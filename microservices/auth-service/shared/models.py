from typing import Any, Generic, TypeVar

from pydantic import BaseModel

T = TypeVar("T")


class ApiResponse(BaseModel, Generic[T]):
    message: str = "Success"
    data: T | None = None
    meta: dict[str, Any] | BaseModel | None = None
