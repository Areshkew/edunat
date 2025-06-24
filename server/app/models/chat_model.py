from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ChatMessage(BaseModel):
    receiver_id: Optional[str] = None  # Para chat directo
    community_id: Optional[int] = None  # Para chat de comunidad
    message_text: str
    attachment_url: Optional[str] = None

class DirectMessage(BaseModel):
    receiver_id: str
    message_text: str
    attachment_url: Optional[str] = None

class CommunityMessage(BaseModel):
    community_id: int
    message_text: str
    attachment_url: Optional[str] = None

# **AGREGADO: Modelos para archivos**
class FileUploadRequest(BaseModel):
    chat_type: str = "direct"  # "direct" o "community"
    chat_id: str

class FileUploadResponse(BaseModel):
    success: bool
    file_id: str
    filename: str
    file_type: str
    file_size: int
    download_url: str
    remaining_uploads: int

class FileMessage(BaseModel):
    type: str = "file"
    receiver_id: int
    file_id: str
    file_name: str
    file_type: str
    file_size: int
