from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class CourseEnrollmentsDAO(Base):
    __tablename__ = 'course_enrollments'

    id = Column(Integer, primary_key=True, nullable=False)
    user_id = Column(Integer, ForeignKey('users.document_id'), nullable=False)
    course_id = Column(Integer, ForeignKey('courses.id'), nullable=False)
    enrollment_date = Column(Date, nullable=False)

    # Relaciones
    user_ref = relationship("UsersDAO", back_populates="enrollments")
    course_ref = relationship("CoursesDAO", back_populates="enrollments")
