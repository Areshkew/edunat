from .chats_dao import ChatsDAO
from .notifications_dao import NotificationsDAO
from .usercommunities_dao import UserCommunitiesDAO
from .communities_dao import CommunitiesDAO
from .transactions_dao import TransactionsDAO
from .courses_dao import CoursesDAO
from .courseenrollments_dao import CourseEnrollmentsDAO
from .users_dao import UsersDAO
from sqlalchemy.orm import relationship

# Creación de las relaciones entre las tablas

# Relaciones para UsersDAO
UsersDAO.chats_sent = relationship("ChatsDAO", foreign_keys='ChatsDAO.sender_id', back_populates="sender")
UsersDAO.chats_received = relationship("ChatsDAO", foreign_keys='ChatsDAO.receiver_id', back_populates="receiver")
UsersDAO.notifications = relationship("NotificationsDAO", back_populates="user_ref")
UsersDAO.communities = relationship("UserCommunitiesDAO", back_populates="user_ref")
UsersDAO.transactions = relationship("TransactionsDAO", foreign_keys='TransactionsDAO.origin', back_populates="origin_ref")
UsersDAO.enrollments = relationship("CourseEnrollmentsDAO", back_populates="user_ref")

# Relaciones para ChatsDAO
ChatsDAO.sender = relationship("UsersDAO", foreign_keys=[ChatsDAO.sender_id], back_populates="chats_sent")
ChatsDAO.receiver = relationship("UsersDAO", foreign_keys=[ChatsDAO.receiver_id], back_populates="chats_received")

# Relaciones para NotificationsDAO
NotificationsDAO.user_ref = relationship("UsersDAO", back_populates="notifications")

# Relaciones para UserCommunitiesDAO
UserCommunitiesDAO.user_ref = relationship("UsersDAO", back_populates="communities")
UserCommunitiesDAO.community_ref = relationship("CommunitiesDAO", back_populates="members")

# Relaciones para CommunitiesDAO
CommunitiesDAO.members = relationship("UserCommunitiesDAO", back_populates="community_ref")

# Relaciones para TransactionsDAO
TransactionsDAO.origin_ref = relationship("UsersDAO", foreign_keys=[TransactionsDAO.origin], back_populates="transactions")
TransactionsDAO.destination_ref = relationship("UsersDAO", foreign_keys=[TransactionsDAO.destination])

# Relaciones para CoursesDAO
CoursesDAO.enrollments = relationship("CourseEnrollmentsDAO", back_populates="course_ref")

# Relaciones para CourseEnrollmentsDAO
CourseEnrollmentsDAO.user_ref = relationship("UsersDAO", back_populates="enrollments")
CourseEnrollmentsDAO.course_ref = relationship("CoursesDAO", back_populates="enrollments")
