from datetime import date
from pydantic import BaseModel, Field
from typing import Optional

class Notification(BaseModel):
    user_id: int
    message: str = Field(..., max_length=500)
    notification_type: int = Field(..., ge=0, le=2)  # 0-info, 1-warning, 2-alert
    is_read: Optional[bool] = Field(default=False)

class NotificationUpdate(BaseModel):
    message: Optional[str] = Field(None, max_length=500)
    notification_type: Optional[int] = Field(None, ge=0, le=2)
    is_read: Optional[bool] = None

class NotificationResponse(BaseModel):
    id: int
    user_id: int
    message: str
    notification_type: int
    is_read: bool
    created_at: date
    username: Optional[str] = None
