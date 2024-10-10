from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class NotificationsDAO(Base):
    __tablename__ = 'notifications'

    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.document_id'), nullable=False)
    message = Column(String, nullable=False)
    notification_type = Column(Integer, nullable=False)  # 0-info  1-warning  2-alert
    is_read = Column(Boolean, nullable=False)
    created_at = Column(Date, nullable=False)

    # Relaciones
    user_ref = relationship("UsersDAO", back_populates="notifications")
