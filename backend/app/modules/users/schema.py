import uuid

from pydantic import BaseModel, EmailStr

class UserResponse(BaseModel):
    id: uuid.UUID
    user_name: str
    email: EmailStr

    model_config = {
        "from_attributes": True
    }