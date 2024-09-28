from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class ChatsDAO(Base):
    __tablename__ = 'chats'

    id = Column(Integer, primary_key=True, nullable=False)
    sender_id = Column(Integer, ForeignKey('users.document_id'), nullable=False)
    receiver_id = Column(Integer, ForeignKey('users.document_id'), nullable=False)
    message_text = Column(String, nullable=False)
    sent_at = Column(Date, nullable=False)
    read_at = Column(Date, nullable=True)
    attachment_url = Column(String, nullable=True)

    # Relaciones
    sender = relationship("UsersDAO", foreign_keys=[sender_id], back_populates="chats_sent")
    receiver = relationship("UsersDAO", foreign_keys=[receiver_id], back_populates="chats_received")
