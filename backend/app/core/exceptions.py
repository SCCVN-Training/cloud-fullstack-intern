from fastapi import FastAPI, Request, status
from fastapi.responses import JSONResponse

# Base Exception
class AppException(Exception):
    def __init__(
        self,
        message: str
    ):
        self.message = message
        super().__init__(message)

# Authentication Exceptions
class EmailAlreadyExistsException(AppException):
    pass


class InvalidCredentialException(AppException):
    pass


class UserNotFoundException(AppException):
    pass

# Profile Exception
class ProfileNotFoundException(AppException):
    pass

# Booking Exception
class BookingNotFoundException(AppException):
    pass

# Review Exceptions
class ReviewAlreadyExistsException(AppException):
    pass

# Wallet Exceptions
class WalletNotFoundException(AppException):
    pass


class InsufficientBalanceException(AppException):
    pass

# JWT Token Exception
class InvalidTokenException(AppException):
    pass

# Authorization Exception
class ForbiddenException(AppException):
    pass

# Global Exception Handlers
def register_exception_handlers(app: FastAPI) -> None:
    # Email already exists
    @app.exception_handler(EmailAlreadyExistsException)
    async def email_exists_handler(
        request: Request,
        exc: EmailAlreadyExistsException
    ):
        return JSONResponse(
            status_code=400,
            content={
                "detail": exc.message
            }
        )

    # Invalid credential
    @app.exception_handler(InvalidCredentialException)
    async def invalid_credential_handler(
        request: Request,
        exc: InvalidCredentialException
    ):
        return JSONResponse(
            status_code=401,
            content={
                "detail": exc.message
            }
        )

    # User not found
    @app.exception_handler(UserNotFoundException)
    async def user_not_found_handler(
        request: Request,
        exc: UserNotFoundException
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": exc.message
            }
        )

    # Profile not found
    @app.exception_handler(ProfileNotFoundException)
    async def profile_not_found_handler(
        request: Request,
        exc: ProfileNotFoundException
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": exc.message
            }
        )

    # Booking not found
    @app.exception_handler(BookingNotFoundException)
    async def booking_not_found_handler(
        request: Request,
        exc: BookingNotFoundException
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": exc.message
            }
        )

    # Review already exists for this booking
    @app.exception_handler(ReviewAlreadyExistsException)
    async def review_already_exists_handler(
        request: Request,
        exc: ReviewAlreadyExistsException
    ):
        return JSONResponse(
            status_code=409,
            content={
                "detail": exc.message
            }
        )

    # Wallet not found
    @app.exception_handler(WalletNotFoundException)
    async def wallet_not_found_handler(
        request: Request,
        exc: WalletNotFoundException
    ):
        return JSONResponse(
            status_code=404,
            content={
                "detail": exc.message
            }
        )

    # Insufficient balance
    @app.exception_handler(InsufficientBalanceException)
    async def insufficient_balance_handler(
        request: Request,
        exc: InsufficientBalanceException
    ):
        return JSONResponse(
            status_code=422,
            content={
                "detail": exc.message
            }
        )

    @app.exception_handler(AppException)
    async def app_exception_handler(
        request: Request,
        exc: AppException
    ):
        return JSONResponse(
            status_code=400,
            content={
                "detail": exc.message
            }
        )

    # Invalid JWT token
    @app.exception_handler(InvalidTokenException)
    async def invalid_token_exception_handler(
        request: Request,
        exc: InvalidTokenException
    ):
        return JSONResponse(
            status_code=status.HTTP_401_UNAUTHORIZED,
            content={
                "detail": str(exc)
            }
        )

    # Forbidden access
    @app.exception_handler(ForbiddenException)
    async def forbidden_exception_handler(
        request: Request,
        exc: ForbiddenException
    ):
        return JSONResponse(
            status_code=status.HTTP_403_FORBIDDEN,
            content={
                "detail": exc.message
            }
        )
