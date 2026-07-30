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

# JWT Token Exception
class InvalidTokenException(AppException):
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