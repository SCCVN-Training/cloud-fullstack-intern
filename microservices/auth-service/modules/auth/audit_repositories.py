from datetime import datetime, timedelta, timezone
from uuid import UUID

from motor.motor_asyncio import AsyncIOMotorDatabase


class AuditLogRepository:
    """
    Handles audit logging for authentication events.

    Stores logs in MongoDB for:
    - User registration
    - Login attempts (success/failure)
    - Password changes
    - Account deactivation
    """

    def __init__(self, mongo_db: AsyncIOMotorDatabase):
        """Initialize with MongoDB database instance."""
        self.collection = mongo_db["auth_audit_logs"]

    # ============ Log Creation Methods ============

    async def log_registration(
        self,
        user_id: UUID,
        email: str,
        ip_address: str | None = None,
        user_agent: str | None = None,
    ) -> None:
        """
        Log a user registration event.

        Args:
            user_id: Newly created user's ID
            email: User's email address
            display_name: User's display name
            ip_address: IP address of registration (optional)
            user_agent: User agent string (optional)
        """
        await self.collection.insert_one(
            {
                "event_type": "USER_REGISTERED",
                "associated_user_id": str(user_id),
                "email": email,
                "ip_address": ip_address,
                "user_agent": user_agent,
                "timestamp_utc": datetime.now(timezone.utc),
            }
        )

    async def log_login_attempt(
        self,
        email: str,
        success: bool,
        ip_address: str | None = None,
        user_agent: str | None = None,
        user_id: UUID | None = None,
    ) -> None:
        """
        Log a login attempt (success or failure).

        Args:
            email: Email used for login
            success: Whether login was successful
            ip_address: IP address of attempt
            user_agent: User agent string
            user_id: User ID if login was successful
        """
        log_entry = {
            "event_type": "LOGIN_ATTEMPT",
            "email": email,
            "success": success,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp_utc": datetime.now(timezone.utc),
        }

        if user_id:
            log_entry["associated_user_id"] = str(user_id)

        await self.collection.insert_one(log_entry)

    async def log_password_change(
        self,
        user_id: UUID,
        email: str,
        ip_address: str | None = None,
    ) -> None:
        """
        Log a password change event.

        Args:
            user_id: User who changed password
            email: User's email
            ip_address: IP address of request
        """
        await self.collection.insert_one(
            {
                "event_type": "PASSWORD_CHANGED",
                "associated_user_id": str(user_id),
                "email": email,
                "ip_address": ip_address,
                "timestamp_utc": datetime.now(timezone.utc),
            }
        )

    async def log_account_deactivation(
        self,
        user_id: UUID,
        email: str,
        reason: str | None = None,
    ) -> None:
        """
        Log an account deactivation event.

        Args:
            user_id: User being deactivated
            email: User's email
            reason: Reason for deactivation (optional)
        """
        await self.collection.insert_one(
            {
                "event_type": "ACCOUNT_DEACTIVATED",
                "associated_user_id": str(user_id),
                "email": email,
                "reason": reason,
                "timestamp_utc": datetime.now(timezone.utc),
            }
        )

    # ============ Query Methods ============

    async def get_user_audit_logs(
        self,
        user_id: UUID,
        limit: int = 50,
        skip: int = 0,
    ) -> list[dict]:
        """
        Get audit logs for a specific user.

        Args:
            user_id: User ID to get logs for
            limit: Maximum number of logs to return
            skip: Number of logs to skip (pagination)

        Returns:
            List of audit log entries
        """
        cursor = (
            self.collection.find({"associated_user_id": str(user_id)})
            .sort("timestamp_utc", -1)
            .skip(skip)
            .limit(limit)
        )

        return await cursor.to_list(length=limit)

    async def get_recent_registrations(
        self,
        days: int = 7,
        limit: int = 100,
    ) -> list[dict]:
        """
        Get recent user registrations.

        Args:
            days: Number of days to look back
            limit: Maximum number of registrations to return

        Returns:
            List of registration logs
        """
        cutoff = datetime.now(timezone.utc) - timedelta(days=days)

        cursor = (
            self.collection.find(
                {"event_type": "USER_REGISTERED", "timestamp_utc": {"$gte": cutoff}}
            )
            .sort("timestamp_utc", -1)
            .limit(limit)
        )

        return await cursor.to_list(length=limit)
