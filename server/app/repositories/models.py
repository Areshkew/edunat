from .chats_dao import ChatsDAO
from .communitychats_dao import CommunityChatsDAO
from .notifications_dao import NotificationsDAO
from .usercommunities_dao import UserCommunitiesDAO
from .communities_dao import CommunitiesDAO
from .transactions_dao import TransactionsDAO
from .courses_dao import CoursesDAO
from .courseenrollments_dao import CourseEnrollmentsDAO
from .users_dao import UsersDAO
from .chat_files_dao import ChatFilesDAO  # **AGREGADO: Importar ChatFilesDAO**
from sqlalchemy.orm import relationship

# Creación de las relaciones entre las tablas

# Relaciones para UsersDAO
UsersDAO.chats_sent = relationship("ChatsDAO", foreign_keys='ChatsDAO.sender_id', back_populates="sender", cascade="all, delete-orphan")
UsersDAO.chats_received = relationship("ChatsDAO", foreign_keys='ChatsDAO.receiver_id', back_populates="receiver", cascade="all, delete-orphan")
UsersDAO.community_chats = relationship("CommunityChatsDAO", back_populates="sender_ref", cascade="all, delete-orphan")
UsersDAO.notifications = relationship("NotificationsDAO", back_populates="user_ref")
UsersDAO.communities = relationship("UserCommunitiesDAO", back_populates="user_ref")
UsersDAO.transactions = relationship("TransactionsDAO", foreign_keys='TransactionsDAO.origin', back_populates="origin_ref")
UsersDAO.enrollments = relationship("CourseEnrollmentsDAO", back_populates="user_ref")
# **AGREGADO: Relación con archivos subidos**
UsersDAO.uploaded_files = relationship("ChatFilesDAO", foreign_keys='ChatFilesDAO.uploaded_by', cascade="all, delete-orphan")
# **AGREGADO: Relación con cursos impartidos**
UsersDAO.courses_taught = relationship("CoursesDAO", foreign_keys='CoursesDAO.instructor', back_populates="instructor_ref")

# Relaciones para ChatsDAO
ChatsDAO.sender = relationship("UsersDAO", foreign_keys=[ChatsDAO.sender_id], back_populates="chats_sent")
ChatsDAO.receiver = relationship("UsersDAO", foreign_keys=[ChatsDAO.receiver_id], back_populates="chats_received")

# Relaciones para CommunityChatsDAO
CommunityChatsDAO.sender_ref = relationship("UsersDAO", back_populates="community_chats")
CommunityChatsDAO.community_ref = relationship("CommunitiesDAO", back_populates="chats")

# Relaciones para NotificationsDAO
NotificationsDAO.user_ref = relationship("UsersDAO", back_populates="notifications")

# Relaciones para UserCommunitiesDAO
UserCommunitiesDAO.user_ref = relationship("UsersDAO", back_populates="communities")
UserCommunitiesDAO.community_ref = relationship("CommunitiesDAO", back_populates="members")

# Relaciones para CommunitiesDAO
CommunitiesDAO.members = relationship("UserCommunitiesDAO", back_populates="community_ref")
CommunitiesDAO.chats = relationship("CommunityChatsDAO", back_populates="community_ref", cascade="all, delete-orphan")

# Relaciones para TransactionsDAO
TransactionsDAO.origin_ref = relationship("UsersDAO", foreign_keys=[TransactionsDAO.origin], back_populates="transactions")

# Relaciones para CoursesDAO
CoursesDAO.enrollments = relationship("CourseEnrollmentsDAO", back_populates="course_ref")
CoursesDAO.instructor_ref = relationship("UsersDAO", foreign_keys='CoursesDAO.instructor', back_populates="courses_taught")

# Relaciones para CourseEnrollmentsDAO
CourseEnrollmentsDAO.user_ref = relationship("UsersDAO", back_populates="enrollments")
CourseEnrollmentsDAO.course_ref = relationship("CoursesDAO", back_populates="enrollments")

# **AGREGADO: Relaciones para ChatFilesDAO**
ChatFilesDAO.uploader = relationship("UsersDAO", foreign_keys=[ChatFilesDAO.uploaded_by], back_populates="uploaded_files")
