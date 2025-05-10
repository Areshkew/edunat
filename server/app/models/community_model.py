from datetime import datetime
from pydantic import BaseModel, Field
from typing import Optional

class Community(BaseModel):
    name: str = Field(..., max_length=100)
    about: Optional[str] = Field(None, max_length=500)
    visibility: Optional[int] = Field(default = 1, ge=0, le=1)

class CommunityUpdate(BaseModel):
    name: Optional[str] = Field(default = 1, max_length=100)
    about: Optional[str] = Field(None, max_length=500)
    visibility: Optional[int] = Field(None, ge=0, le=1)

class CommunityMember(BaseModel):
    user_id: int
    community_id: int
    username: str
    visibility: int