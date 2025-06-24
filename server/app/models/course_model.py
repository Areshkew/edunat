from datetime import date
from pydantic import BaseModel, Field
from typing import Optional

class Course(BaseModel):
    name: str = Field(..., max_length=100)
    classroom_link: Optional[str] = Field(None, max_length=500)
    start_date: date
    end_date: Optional[date] = None
    status: Optional[int] = Field(default=0, ge=0, le=2)  # 0-upcoming, 1-in_progress, 2-completed
    cost: Optional[int] = Field(default=0, ge=0)  # Cost in points, minimum 0

class CourseUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    classroom_link: Optional[str] = Field(None, max_length=500)
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    status: Optional[int] = Field(None, ge=0, le=2)  # 0-upcoming, 1-in_progress, 2-completed
    cost: Optional[int] = Field(None, ge=0)  # Cost in points, minimum 0

class CourseStudent(BaseModel):
    student_id: int
    course_id: int
    username: str
    enrolled_date: date
    status: int  # 0-inactive, 1-active, 2-completed
