import logging
from sqlalchemy import exists, select, delete, update, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, date
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any

from app.repositories.courses_dao import CoursesDAO
from app.repositories.courseenrollments_dao import CourseEnrollmentsDAO  
from app.utils.class_utils import Injectable
from app.models.course_model import CourseStudent
from app.repositories.users_dao import UsersDAO

class CourseService(Injectable):
    def __init__(self):
        self.logger = logging.getLogger("uvicorn")

    async def create_course(self, db: AsyncSession, course_data: dict) -> CoursesDAO:
        """
        Crea un nuevo curso en la base de datos.
        """
        new_course = CoursesDAO(
            name=course_data["name"],
            instructor=course_data["instructor"],
            classroom_link=course_data.get("classroom_link"),
            start_date=course_data["start_date"],
            end_date=course_data.get("end_date"),
            status=course_data.get("status", 0),  # Por defecto, próximo
            cost=course_data.get("cost"),  # Add cost field with default value 0
            created_at=datetime.now(timezone.utc).date(),
            updated_at=None
        )
        
        db.add(new_course)
        await db.commit()
        await db.refresh(new_course)
        return new_course

    async def get_all_courses(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Obtiene todos los cursos con el número de estudiantes de cada uno
        """
        # Primero, obtenemos todos los cursos
        result = await db.execute(select(CoursesDAO))
        courses = result.scalars().all()
        
        course_list = []
        # Para cada curso, obtenemos el número de estudiantes
        for course in courses:
            student_count = await db.execute(
                select(func.count())
                .select_from(CourseEnrollmentsDAO)
                .where(CourseEnrollmentsDAO.course_id == course.id)
            )
            
            # Obtenemos el nombre del instructor
            instructor_result = await db.execute(
                select(UsersDAO.username)
                .where(UsersDAO.document_id == course.instructor)
            )
            instructor_name = instructor_result.scalar_one_or_none() or "Desconocido"
            
            # Creamos un diccionario con los datos del curso y el número de estudiantes
            course_dict = {
                "id": course.id,
                "name": course.name,
                "instructor": course.instructor,
                "instructor_name": instructor_name,
                "classroom_link": course.classroom_link,
                "start_date": course.start_date,
                "end_date": course.end_date,
                "status": course.status,
                "cost": course.cost, 
                "created_at": course.created_at,
                "updated_at": course.updated_at,
                "students": student_count.scalar_one() or 0
            }
            course_list.append(course_dict)
        
        return course_list

    async def get_course_by_id(self, db: AsyncSession, course_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene un curso por su ID incluyendo información del instructor
        """
        result = await db.execute(
            select(CoursesDAO, UsersDAO.username.label("instructor_name"))
            .join(UsersDAO, CoursesDAO.instructor == UsersDAO.document_id)
            .where(CoursesDAO.id == course_id)
        )
        
        row = result.first()
        if not row:
            return None
            
        course, instructor_name = row
        
        # Obtener número de estudiantes
        student_count = await db.execute(
            select(func.count())
            .select_from(CourseEnrollmentsDAO)
            .where(CourseEnrollmentsDAO.course_id == course_id)
        )
        
        return {
            "id": course.id,
            "name": course.name,
            "instructor": course.instructor,
            "instructor_name": instructor_name,
            "classroom_link": course.classroom_link,
            "start_date": course.start_date,
            "end_date": course.end_date,
            "status": course.status,
            "cost": course.cost, 
            "created_at": course.created_at,
            "updated_at": course.updated_at,
            "students": student_count.scalar_one() or 0
        }

    async def is_course_instructor(self, db: AsyncSession, course_id: int, user_id: int) -> bool:
        """
        Verifica si el usuario es el instructor del curso
        """
        result = await db.execute(
            select(exists().where(and_(
                CoursesDAO.id == course_id,
                CoursesDAO.instructor == user_id
            )))
        )
        return result.scalar()

    async def delete_course(self, db: AsyncSession, course_id: int) -> bool:
        """
        Elimina un curso por su ID, incluyendo todas las inscripciones
        """
        try:
            # Verificar que el curso existe
            course_exists = await db.execute(
                select(exists().where(CoursesDAO.id == course_id))
            )
            
            if not course_exists.scalar():
                return False
            
            # Eliminar inscripciones primero
            await db.execute(
                delete(CourseEnrollmentsDAO).where(CourseEnrollmentsDAO.course_id == course_id)
            )
            
            # Eliminar el curso
            result = await db.execute(
                delete(CoursesDAO).where(CoursesDAO.id == course_id)
            )
            
            await db.commit()
            return result.rowcount > 0
            
        except Exception as e:
            await db.rollback()
            raise Exception(f"Error eliminando curso: {str(e)}")

    async def update_course(self, db: AsyncSession, course_id: int, update_data: dict) -> bool:
        """
        Actualiza un curso
        """
        update_data["updated_at"] = datetime.now(timezone.utc).date()
        
        result = await db.execute(
            update(CoursesDAO)
            .where(CoursesDAO.id == course_id)
            .values(**update_data)
        )
        await db.commit()
        return result.rowcount > 0

    async def enroll_student(self, db: AsyncSession, user_id: int, course_id: int) -> bool:
        """
        Inscribe un estudiante en un curso
        """
        # Primero verificamos si el usuario ya está inscrito
        existing_enrollment = await db.execute(
            select(CourseEnrollmentsDAO).where(
                CourseEnrollmentsDAO.user_id == user_id,  # Updated field name
                CourseEnrollmentsDAO.course_id == course_id
            )
        )
        
        if existing_enrollment.scalar_one_or_none() is not None:
            return False  # Ya está inscrito
        
        # También verificamos que el estudiante no sea el instructor
        is_instructor = await self.is_course_instructor(db, course_id, user_id)
        if is_instructor:
            return False  # El instructor no puede inscribirse en su propio curso
        
        try:
            enrollment = CourseEnrollmentsDAO(
                user_id=user_id,  # Updated field name
                course_id=course_id,
                enrollment_date=datetime.now(timezone.utc).date(),  # Updated field name
            )
            db.add(enrollment)
            await db.commit()
            return True
        except IntegrityError:
            await db.rollback()
            return False

    async def unenroll_student(self, db: AsyncSession, user_id: int, course_id: int) -> bool:
        """
        Da de baja a un estudiante de un curso
        """
        result = await db.execute(
            delete(CourseEnrollmentsDAO)
            .where(and_(
                CourseEnrollmentsDAO.user_id == user_id,  # Updated field name
                CourseEnrollmentsDAO.course_id == course_id
            ))
        )
        await db.commit()
        return result.rowcount > 0

    async def get_course_students(self, db: AsyncSession, course_id: int) -> List[CourseStudent]:
        """
        Obtiene todos los estudiantes de un curso
        """
        result = await db.execute(
            select(CourseEnrollmentsDAO, UsersDAO)
            .where(CourseEnrollmentsDAO.course_id == course_id)
            .join(UsersDAO, CourseEnrollmentsDAO.user_id == UsersDAO.document_id)  # Updated field name
        )
        
        students = []
        for enrollment, user in result.all():
            students.append(
                CourseStudent(
                    student_id=enrollment.user_id,  # Updated field name
                    course_id=enrollment.course_id,
                    username=user.username,
                    enrolled_date=enrollment.enrollment_date,  # Updated field name
                    status=1  # Default status since the existing DAO doesn't have a status field
                )
            )
        return students

    async def get_instructor_courses(self, db: AsyncSession, instructor_id: int) -> List[Dict[str, Any]]:
        """
        Obtiene los cursos donde el usuario es instructor
        """
        try:
            # Obtener cursos donde el usuario es instructor
            result = await db.execute(
                select(CoursesDAO)
                .where(CoursesDAO.instructor == instructor_id)
            )
            
            courses = result.scalars().all()
            course_list = []
            
            for course in courses:
                # Contar estudiantes en cada curso
                student_count = await db.execute(
                    select(func.count())
                    .select_from(CourseEnrollmentsDAO)
                    .where(CourseEnrollmentsDAO.course_id == course.id)
                )
                
                course_dict = {
                    "id": course.id,
                    "name": course.name,
                    "classroom_link": course.classroom_link,
                    "start_date": course.start_date,
                    "end_date": course.end_date,
                    "status": course.status,
                    "cost": course.cost,  # Add cost field
                    "created_at": course.created_at,
                    "updated_at": course.updated_at,
                    "students": student_count.scalar_one() or 0
                }
                course_list.append(course_dict)
                
            return course_list
        except Exception as e:
            print(f"Error obteniendo cursos del instructor: {e}")
            return []

    async def get_student_courses(self, db: AsyncSession, student_id: int) -> List[Dict[str, Any]]:
        """
        Obtiene los cursos donde el usuario está inscrito como estudiante
        """
        try:
            # Obtener IDs de cursos donde el usuario está inscrito
            enrollment_result = await db.execute(
                select(CourseEnrollmentsDAO.course_id)
                .where(CourseEnrollmentsDAO.user_id == student_id)  # Updated field name
            )
            
            course_ids = [row[0] for row in enrollment_result.all()]
            
            if not course_ids:
                return []
            
            # Obtener detalles de estos cursos, incluyendo el nombre del instructor
            courses_result = await db.execute(
                select(CoursesDAO, UsersDAO.username.label("instructor_name"))
                .join(UsersDAO, CoursesDAO.instructor == UsersDAO.document_id)
                .where(CoursesDAO.id.in_(course_ids))
            )
            
            course_list = []
            
            for row in courses_result.all():
                course, instructor_name = row
                
                # Obtener detalles de la inscripción
                enrollment_details = await db.execute(
                    select(CourseEnrollmentsDAO.enrollment_date)  # Updated field name and only get the date
                    .where(and_(
                        CourseEnrollmentsDAO.course_id == course.id,
                        CourseEnrollmentsDAO.user_id == student_id  # Updated field name
                    ))
                )
                
                enrollment_date = enrollment_details.scalar_one_or_none()
                
                course_dict = {
                    "id": course.id,
                    "name": course.name,
                    "instructor": course.instructor,
                    "instructor_name": instructor_name,
                    "classroom_link": course.classroom_link,
                    "start_date": course.start_date,
                    "end_date": course.end_date,
                    "status": course.status,
                    "cost": course.cost,  # Add cost field
                    "enrollment_status": 1,  # Default value since status isn't in the existing DAO
                    "enrolled_date": enrollment_date,
                    "created_at": course.created_at,
                    "updated_at": course.updated_at,
                }
                course_list.append(course_dict)
                
            return course_list
        except Exception as e:
            print(f"Error obteniendo cursos del estudiante: {e}")
            return []

    async def get_course_recommendations(self, db: AsyncSession, user_id: str):
        """
        Obtiene recomendaciones de cursos: los más populares y algunos aleatorios
        Excluye cursos en los que el usuario ya está inscrito
        """
        try:
            # Obtener los IDs de cursos en los que el usuario ya está inscrito
            user_enrolled_courses = await db.execute(
                select(CourseEnrollmentsDAO.course_id)
                .where(CourseEnrollmentsDAO.user_id == user_id)
            )
            enrolled_course_ids = [row[0] for row in user_enrolled_courses.all()]
            
            # Obtener los cursos más populares (por número de inscripciones)
            # Excluir cursos en los que el usuario ya está inscrito
            popular_courses_query = await db.execute(
                select(
                    CoursesDAO.id,
                    CoursesDAO.name,
                    CoursesDAO.cost,
                    CoursesDAO.status,
                    CoursesDAO.start_date,
                    CoursesDAO.end_date,
                    UsersDAO.username.label('instructor_name'),
                    func.count(CourseEnrollmentsDAO.id).label('enrollment_count')
                )
                .join(UsersDAO, CoursesDAO.instructor == UsersDAO.document_id)
                .outerjoin(CourseEnrollmentsDAO, CoursesDAO.id == CourseEnrollmentsDAO.course_id)
                .where(~CoursesDAO.id.in_(enrolled_course_ids) if enrolled_course_ids else True)
                .group_by(
                    CoursesDAO.id, 
                    CoursesDAO.name, 
                    CoursesDAO.cost, 
                    CoursesDAO.status,
                    CoursesDAO.start_date,
                    CoursesDAO.end_date,
                    UsersDAO.username
                )
                .order_by(func.count(CourseEnrollmentsDAO.id).desc())
                .limit(3)
            )
            
            popular_courses = popular_courses_query.all()
            popular_course_ids = [course.id for course in popular_courses]
            
            # Combinar IDs de cursos a excluir (inscritos + populares)
            excluded_course_ids = list(set(enrolled_course_ids + popular_course_ids))
            
            # Obtener 2 cursos aleatorios que no estén en los populares ni en los inscritos
            random_courses_query = await db.execute(
                select(
                    CoursesDAO.id,
                    CoursesDAO.name,
                    CoursesDAO.cost,
                    CoursesDAO.status,
                    CoursesDAO.start_date,
                    CoursesDAO.end_date,
                    UsersDAO.username.label('instructor_name')
                )
                .join(UsersDAO, CoursesDAO.instructor == UsersDAO.document_id)
                .where(~CoursesDAO.id.in_(excluded_course_ids) if excluded_course_ids else True)
                .order_by(func.random())
                .limit(2)
            )
            
            random_courses = random_courses_query.all()
            
            # Formatear respuesta
            def format_course(course, is_popular=False):
                status_map = {0: "Próximo", 1: "En progreso", 2: "Completado"}
                return {
                    "id": course.id,
                    "name": course.name,
                    "instructor": course.instructor_name,
                    "cost": course.cost,
                    "status": status_map.get(course.status, "Desconocido"),
                    "start_date": course.start_date.isoformat() if course.start_date else None,
                    "end_date": course.end_date.isoformat() if course.end_date else None,
                    "enrollment_count": getattr(course, 'enrollment_count', 0) if is_popular else None
                }
            
            return {
                "popular_courses": [format_course(course, True) for course in popular_courses],
                "random_courses": [format_course(course) for course in random_courses],
                "message": "¡Nunca pierdas el momento de aprender!"
            }
            
        except Exception as e:
            self.logger.error(f"Error getting course recommendations: {str(e)}")
            raise e
