from uuid import UUID

from fastapi import HTTPException, Request, Response, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from shared.config import settings
from shared.logger import get_logger
from shared.security import (
    create_access_token,
    create_refresh_token,
    get_password_hash,
    verify_password,
    verify_token,
)
from sqlalchemy.ext.asyncio import AsyncSession

from modules.auth.audit_repositories import AuditLogRepository
from modules.auth.repositories import AuthRepository
from modules.auth.schemas import (
    LoginRequest,
    RegisterRequest,
)

logger = get_logger(__name__)


class AuthService:
    """
    Authentication business logic service.

    Handles ONLY authentication:
    - User registration (creates user, NOT profile)
    - User login (sets cookies)
    - Session restoration (refresh tokens)
    - Logout (clears cookies)
    - Current user retrieval

    Profile creation is handled separately by ProfileService.
    """

    def __init__(
        self,
        postgres_session: AsyncSession,
        mongo_db: AsyncIOMotorDatabase,
    ):
        self.auth_repo = AuthRepository(postgres_session)
        self.audit_repo = AuditLogRepository(mongo_db)
        self.session = postgres_session

    # ============ Cookie Management ============

    def _set_authentication_cookies(
        self,
        response: Response,
        user_id: UUID,
        email: str,
    ) -> tuple[str, str]:
        """
        Set HttpOnly cookies with access and refresh tokens.
        """
        # Generate tokens
        access_token = create_access_token(str(user_id))
        refresh_token = create_refresh_token(str(user_id))

        # Cookie settings
        secure = settings.is_production

        # Access token cookie (short-lived)
        response.set_cookie(
            key="access_token",
            value=access_token,
            httponly=True,
            secure=secure,
            samesite="lax",
            max_age=settings.access_token_expire_minutes * 60,
            path="/",
        )

        # Refresh token cookie (long-lived)
        response.set_cookie(
            key="refresh_token",
            value=refresh_token,
            httponly=True,
            secure=secure,
            samesite="lax",
            path="/api/v1/auth/refresh-session",
            max_age=settings.refresh_token_expire_days * 24 * 60 * 60,
        )

        return access_token, refresh_token

    def _clear_authentication_cookies(self, response: Response) -> None:
        """Clear authentication cookies."""
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/api/v1/auth/refresh-session")

    # ============ Registration (Auth Only - NO Profile) ============

    async def register(
        self,
        request: RegisterRequest,
        response: Response,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """
        Register a new user.

        ⚠️ This only creates a user account.
        ⚠️ Profile creation is handled separately by ProfileService.

        Flow:
        1. Check if email exists
        2. Create user in PostgreSQL
        3. Log to MongoDB
        4. Set authentication cookies (auto-login)
        5. Return user_id + message

        Args:
            request: Registration request
            response: FastAPI Response object (for setting cookies)
            ip_address: Client IP address (for audit)
            user_agent: Client user agent (for audit)

        Returns:
            user_id and success message
        """
        # 1. Check if email exists
        if await self.auth_repo.check_email_exists(request.email):
            logger.warning(
                f"Registration failed: Email already exists - {request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="A user with this email address already exists.",
            )

        # 2. Create user (NO profile)
        user = await self.auth_repo.create(
            email=request.email,
            hashed_password=get_password_hash(request.password),
            is_active=True,
        )

        # 3. Log registration in MongoDB
        await self.audit_repo.log_registration(
            user_id=user.id,
            email=request.email,
            ip_address=ip_address,
            user_agent=user_agent,
        )

        # 4. Set cookies (auto-login after registration)
        self._set_authentication_cookies(
            response=response,
            user_id=user.id,
            email=user.email,
        )

        logger.info(f"Business Event: New user registered successfully - ID: {user.id}")
        return user

    # ============ Login ============

    async def login(
        self,
        request: LoginRequest,
        response: Response,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> dict:
        """
        Authenticate a user and set cookies.
        """
        # 1. Find user by email
        user = await self.auth_repo.get_by_email(request.email)

        # 2. Check user exists and password matches
        if not user or not verify_password(request.password, user.hashed_password):
            # Log failed attempt
            await self.audit_repo.log_login_attempt(
                email=request.email,
                success=False,
                ip_address=ip_address,
                user_agent=user_agent,
                user_id=user.id if user else None,
            )
            logger.warning(
                f"Security Warning: Failed login attempt for email - {request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password.",
            )

        # 3. Check if user is active
        if not user.is_active:
            logger.warning(
                f"Security Warning: Login attempt on disabled account - {request.email}"
            )
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="User account is disabled. Please contact support.",
            )

        # 4. Set cookies
        self._set_authentication_cookies(
            response=response,
            user_id=user.id,
            email=user.email,
        )

        # 5. Log successful login
        await self.audit_repo.log_login_attempt(
            email=request.email,
            success=True,
            ip_address=ip_address,
            user_agent=user_agent,
            user_id=user.id,
        )

        # 6. Return response
        logger.info(f"Business Event: User login successful - ID: {user.id}")
        return user

    # ============ Session Restoration ============

    async def refresh_session(
        self,
        request: Request,
        response: Response,
    ) -> dict:
        """Refresh session using refresh token cookie."""
        refresh_token = request.cookies.get("refresh_token")

        if not refresh_token:
            logger.warning("Refresh session failed: Missing refresh token cookie")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Refresh token cookie missing.",
            )

        user_id = verify_token(refresh_token, token_type="refresh")
        if not user_id:
            logger.warning("Refresh session failed: Invalid or expired refresh token")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired refresh token.",
            )

        user = await self.auth_repo.get_by_id(user_id)
        if not user or not user.is_active:
            logger.warning("Refresh session failed: User not found or inactive!")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found or inactive.",
            )

        self._set_authentication_cookies(
            response=response,
            user_id=user.id,
            email=user.email,
        )
        logger.info(
            f"Business Event: Session refreshed successfully for user: {user_id}"
        )

    # ============ Logout ============

    async def logout(self, request: Request, response: Response) -> dict:
        """Logout user - clear authentication cookies."""
        access_token = request.cookies.get("access_token")

        if not access_token:
            logger.warning("Logout failed: Missing access token cookie")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Access token cookie missing.",
            )

        user_id = verify_token(access_token, token_type="access")
        if not user_id:
            logger.warning("Logout failed: Invalid or expired access token cookie")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid or expired access token.",
            )

        self._clear_authentication_cookies(response)
        logger.info(f"Business Event: Logout successfully for user: {user_id}")

    # ============ Current User ============

    # async def get_current_user(
    #     self,
    #     request: Request,
    # ) -> dict:
    #     """Get current authenticated user from access token cookie."""
    #     access_token = request.cookies.get("access_token")

    #     if not access_token:
    #         logger.warning("Get current user failed: Missing access token cookie")
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="Access token cookie missing.",
    #         )

    #     user_id = verify_token(access_token, token_type="access")
    #     if not user_id:
    #         logger.warning("Get current user failed: Invalid or expired access token cookie")
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="Invalid or expired access token.",
    #         )

    #     user = await self.auth_repo.get_by_id(user_id)
    #     if not user or not user.is_active:
    #         logger.warning("Get current user failed: User not found or inactive!")
    #         raise HTTPException(
    #             status_code=status.HTTP_401_UNAUTHORIZED,
    #             detail="User not found or inactive.",
    #         )
    #     logger.info(f"Business Event: Get auth state successfully for user: {user_id}")
    #     return user
