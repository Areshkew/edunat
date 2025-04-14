from pydantic import BaseModel, EmailStr, Field
from typing import Annotated, Optional, List, Tuple

class User(BaseModel):
    document_id: Annotated[int, Field(...)]
    email: Annotated[EmailStr, Field(...)]
    username: Annotated[str, Field(..., min_length=1, max_length=32)]
    role: Annotated[int, Field(...)]  # 0-User, 1-Admin
    password: Annotated[str, Field(..., min_length=8, max_length=128)]
    name: Annotated[str, Field(..., min_length=1, max_length=64)]
    academic_level: Annotated[int, Field(..., ge=0, le=10)]  # 0-none, 1-pre_school, etc.
    phone_number: Annotated[str, Field(..., max_length=10)]
    gender: Annotated[int, Field(..., ge=0, le=2)]  # 0-male, 1-female, 2-other
    photo: Annotated[str, Field(..., max_length=255)]
    visibility: Annotated[int, Field(...)]  # 0-hidden, 1-visible
    needs: Annotated[str, Field(..., max_length=255)]
    offers: Annotated[str, Field(..., max_length=255)]
    webpage: Annotated[str, Field(..., max_length=255)]
    whatsapp: Annotated[str, Field(..., max_length=10)]
    birth_date: Annotated[str, Field(...)]
    birth_city: Annotated[str, Field(..., max_length=64)]
    language: Annotated[int, Field(..., ge=0, le=1)]  # 0-en, 1-es
    residence_city: Annotated[str, Field(..., max_length=64)]
    address: Annotated[str, Field(..., max_length=128)]
    about: Annotated[str, Field(..., max_length=255)]
    points: Annotated[int, Field(...)]

class UserLogin(BaseModel):
    email: Annotated[EmailStr, Field(...)]
    password: Annotated[str, Field(..., min_length=5, max_length=32)]

class UserRecovery(BaseModel):
    email: Annotated[EmailStr, Field(...)]

class UserCode(BaseModel):
    email: Annotated[EmailStr, Field(...)]
    code: Annotated[str, Field(..., length=8)]

class UserNewPassword(BaseModel):
    email: Annotated[EmailStr, Field(...)]
    password: Annotated[str, Field(..., min_length=5, max_length=32)]
    repeated_password: Annotated[str, Field(..., min_length=5, max_length=32)]

class UserUpdate(BaseModel):
    document_id: Optional[int] = Field(default=None)
    email: Optional[EmailStr] = Field(default=None)
    username: Optional[str] = Field(default=None, min_length=1, max_length=32)
    password: Optional[str] = Field(default=None, min_length=8, max_length=128)
    name: Optional[str] = Field(default=None, min_length=1, max_length=64)
    academic_level: Optional[int] = Field(default=None, ge=0, le=10)  # 0-none, 1-pre_school, etc.
    phone_number: Optional[str] = Field(default=None, max_length=10)
    gender: Optional[int] = Field(default=None, ge=0, le=2)  # 0-male, 1-female, 2-other
    photo: Optional[str] = Field(default=None, max_length=255)
    visibility: Optional[int] = Field(default=None)  # 0-hidden, 1-visible
    needs: Optional[str] = Field(default=None, max_length=255)
    offers: Optional[str] = Field(default=None, max_length=255)
    webpage: Optional[str] = Field(default=None, max_length=255)
    whatsapp: Optional[str] = Field(default=None, max_length=10)
    birth_date: Optional[str] = Field(default=None)
    birth_city: Optional[str] = Field(default=None, max_length=64)
    language: Optional[int] = Field(default=None, ge=0, le=1)  # 0-en, 1-es
    residence_city: Optional[str] = Field(default=None, max_length=64)
    address: Optional[str] = Field(default=None, max_length=128)
    about: Optional[str] = Field(default=None, max_length=255)
    points: Optional[int] = Field(default=None)
