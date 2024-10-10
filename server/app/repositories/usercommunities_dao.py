from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class UserCommunitiesDAO(Base):
    __tablename__ = 'user_communities'

    id = Column(Integer, primary_key=True, nullable=False)
    community_id = Column(Integer, ForeignKey('communities.id'), nullable=False)
    user_id = Column(Integer, ForeignKey('users.document_id'), nullable=False)

    # Relaciones
    user_ref = relationship("UsersDAO", back_populates="communities")
    community_ref = relationship("CommunitiesDAO", back_populates="members")
