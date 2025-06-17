from datetime import date
from pydantic import BaseModel, Field
from typing import Optional

class Transaction(BaseModel):
    points: int = Field(...)
    origin: Optional[int] = Field(default=None)
    destination: str = Field(...)
    details: str = Field(...)

