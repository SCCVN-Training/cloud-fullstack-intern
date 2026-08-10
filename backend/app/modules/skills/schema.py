import uuid
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from pydantic.alias_generators import to_camel

class SkillBase(BaseModel):
    title: str = Field(..., max_length=255)
    category: str = Field(..., max_length=100)
    description: str
    image: str = Field(..., max_length=255)
    
    price: int = Field(default=0)
    duration: str = Field(..., max_length=50)
    level: str = Field(..., max_length=50)
    requirements: str
    
    available_slots: int = Field(default=0)
    language: str = Field(default="English", max_length=50)
    
    tags: List[str] = Field(default_factory=list)
    featured: bool = Field(default=False)
    
    about_text: Optional[str] = None
    learning_outcomes: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None

class SkillCreate(SkillBase):
    instructor_id: uuid.UUID

class SkillUpdate(BaseModel):
    title: Optional[str] = Field(None, max_length=255)
    category: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    image: Optional[str] = Field(None, max_length=255)
    price: Optional[int] = None
    duration: Optional[str] = Field(None, max_length=50)
    level: Optional[str] = Field(None, max_length=50)
    requirements: Optional[str] = None
    available_slots: Optional[int] = None
    language: Optional[str] = Field(None, max_length=50)
    tags: Optional[List[str]] = None
    featured: Optional[bool] = None
    about_text: Optional[str] = None
    learning_outcomes: Optional[List[str]] = None
    prerequisites: Optional[List[str]] = None

class SkillResponse(SkillBase):
    id: str # Ensure uuid is converted to string for frontend
    
    rating: float
    review_count: int
    created_at: datetime
    
    # These fields will be populated from the instructor relationship
    instructor_name: str
    instructor_title: str
    instructor_bio: str
    instructor_avatar: str

    model_config = ConfigDict(
        from_attributes=True,
        alias_generator=to_camel,
        populate_by_name=True
    )

class SkillListResponse(BaseModel):
    total: int
    skills: List[SkillResponse]

    model_config = ConfigDict(
        alias_generator=to_camel,
        populate_by_name=True
    )
