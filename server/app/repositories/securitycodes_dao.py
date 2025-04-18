from sqlalchemy import Column, Integer, String, DateTime, ForeignKey
from db.base_class import Base
from sqlalchemy.orm import relationship

class SecurityCodeDAO(Base):
    __tablename__ = 'security_codes'
    id = Column(Integer, primary_key=True, unique=True, nullable=False, autoincrement=True)
    code = Column(String(8), unique=True , nullable=False)
    user_email = Column(String(64), ForeignKey('users.email', onupdate='CASCADE', ondelete='CASCADE'), nullable=False, unique=True, index=True)
    date = Column(DateTime, nullable=False)

    email_ref = relationship("UsersDAO", back_populates="code_ref")
