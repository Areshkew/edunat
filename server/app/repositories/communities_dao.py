from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class CommunitiesDAO(Base):
    __tablename__ = 'communities'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    visibility = Column(Integer, nullable=False)  # 0-hidden 1-visible
    created_at = Column(Date, nullable=False)
    updated_at = Column(Date, nullable=True)

    # Relaciones
    members = relationship("UserCommunitiesDAO", back_populates="community_ref")
