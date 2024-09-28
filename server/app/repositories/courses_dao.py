from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, Enum, Text
from db.base_class import Base
from sqlalchemy.orm import relationship

class CoursesDAO(Base):
    __tablename__ = 'courses'

    id = Column(Integer, primary_key=True, nullable=False)
    name = Column(String, nullable=False)
    instructor = Column(Integer, ForeignKey('users.document_id'), nullable=False)
    classroom_link = Column(String, nullable=True)
    start_date = Column(Date, nullable=False)
    end_date = Column(Date, nullable=True)
    status = Column(Integer, nullable=False)  # 0-upcoming  1-in_progress  2-completed
    created_at = Column(Date, nullable=False)
    updated_at = Column(Date, nullable=True)

    # Relaciones
    enrollments = relationship("CourseEnrollmentsDAO", back_populates="course_ref")

