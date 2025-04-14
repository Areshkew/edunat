from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey
from db.base_class import Base
from sqlalchemy.orm import relationship

class UsersDAO(Base):
    __tablename__ = 'users'

    document_id = Column(Integer, primary_key=True, nullable=False, unique=True)
    email = Column(String, nullable=False, unique=True)
    username = Column(String, nullable=False)
    role = Column(Integer, nullable=False)  # 0-User 1-Admin
    password = Column(String, nullable=False)
    name = Column(String, nullable=False)
    academic_level = Column(Integer)  # 0-none  1-pre_school  2-primary  3-secondary  4-high_school  5-technical  6-technological  7-undergraduate  8-specialization  9-masters  10-doctorate
    phone_number = Column(String(10))
    gender = Column(Integer)  # 0-male  1-female  2-other
    photo = Column(String)
    visibility = Column(Integer, nullable=False)  # 0-hidden  1-visible
    needs = Column(String)
    offers = Column(String)
    webpage = Column(String)
    whatsapp = Column(String(10))
    birth_date = Column(Date)
    birth_city = Column(String)
    language = Column(Integer)  # 0-en 1-es
    residence_city = Column(String )
    address = Column(String )
    about = Column(String )
    points = Column(Integer, nullable=False)
    created_at = Column(Date, nullable=False)
    updated_at = Column(Date)

    # Relaciones
    chats_sent = relationship("ChatsDAO", foreign_keys='ChatsDAO.sender_id', back_populates="sender")
    chats_received = relationship("ChatsDAO", foreign_keys='ChatsDAO.receiver_id', back_populates="receiver")
    notifications = relationship("NotificationsDAO", back_populates="user_ref")
    communities = relationship("UserCommunitiesDAO", back_populates="user_ref")
    transactions = relationship("TransactionsDAO", back_populates="origin_ref")
    enrollments = relationship("CourseEnrollmentsDAO", back_populates="user_ref")
    code_ref = relationship("SecurityCodeDAO", back_populates="email_ref")
