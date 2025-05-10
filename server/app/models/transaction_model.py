from datetime import date
from pydantic import BaseModel, Field
from typing import Optional

class Transaction(BaseModel):
    points: int = Field(...)
    destination: str = Field(...)
    details: str = Field(...)

