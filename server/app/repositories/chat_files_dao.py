from sqlalchemy import Column, String, Integer, DateTime, BigInteger, Text, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.utils.db_utils import Base

class ChatFilesDAO(Base):
    __tablename__ = "chat_files"
    
    id = Column(Integer, primary_key=True, nullable=False)
    file_id = Column(String(255), unique=True, index=True, nullable=False)
    original_filename = Column(String(255), nullable=False)
    file_path = Column(Text, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    file_type = Column(String(50), nullable=False)  # 'images', 'documents', 'audio', 'video'
    uploaded_by = Column(Integer, ForeignKey('users.document_id', ondelete='CASCADE'), nullable=False)
    chat_type = Column(String(20), nullable=False)  # 'direct', 'community'
    chat_id = Column(String(50), nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    
    # Relación con usuarios
    uploader = relationship("UsersDAO", foreign_keys=[uploaded_by])
    
    def to_dict(self):
        return {
            "id": self.id,
            "file_id": self.file_id,
            "original_filename": self.original_filename,
            "file_path": self.file_path,
            "file_size": self.file_size,
            "file_type": self.file_type,
            "uploaded_by": self.uploaded_by,
            "chat_type": self.chat_type,
            "chat_id": self.chat_id,
            "created_at": self.created_at.isoformat() if self.created_at else None
        }
