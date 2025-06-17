from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from db.base_class import Base
from datetime import datetime

class CommunityChatsDAO(Base):
    __tablename__ = 'community_chats'

    id = Column(Integer, primary_key=True, nullable=False)
    sender_id = Column(Integer, ForeignKey('users.document_id', ondelete='CASCADE'), nullable=False)
    community_id = Column(Integer, ForeignKey('communities.id', ondelete='CASCADE'), nullable=False)
    message_text = Column(Text, nullable=False)
    sent_at = Column(DateTime, nullable=False, default=datetime.utcnow)
    attachment_url = Column(String, nullable=True)
