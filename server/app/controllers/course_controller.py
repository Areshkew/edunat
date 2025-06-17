from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

# Models
from app.models.course_model import *

# Services
from app.services.course_service import CourseService

# Db utils
from app.utils.class_utils import Injectable, inject
from app.utils.db_utils import get_db_session

@inject(CourseService)
class CourseController(Injectable):
    def __init__(self):
        self.route = APIRouter(prefix='/course')
        # Course functions
        self.route.add_api_route("/create", self.create, methods=["POST"])
        self.route.add_api_route("/list", self.list, methods=["GET"])
        # **AGREGADO: Endpoint de recomendaciones - DEBE IR ANTES DE /{course_id}**
        self.route.add_api_route("/recommendations", self.get_recommendations, methods=["GET"])
        self.route.add_api_route("/my-courses", self.get_my_courses, methods=["GET"])  # Moved before /{course_id}
        self.route.add_api_route("/{course_id}", self.get, methods=["GET"])
        self.route.add_api_route("/delete/{course_id}", self.delete, methods=["DELETE"])
        self.route.add_api_route("/update/{course_id}", self.update, methods=["PUT"])
        self.route.add_api_route("/join/{course_id}", self.join, methods=["POST"])
        self.route.add_api_route("/leave/{course_id}", self.leave, methods=["POST"])
        self.route.add_api_route("/students/{course_id}", self.get_students, methods=["GET"])
        self.route.add_api_route("/instructor/courses", self.get_instructor_courses, methods=["GET"])
        self.route.add_api_route("/student/courses", self.get_student_courses, methods=["GET"])
        # New endpoints for student management
        self.route.add_api_route("/add-student/{course_id}/{student_id}", self.add_student, methods=["POST"])
        self.route.add_api_route("/remove-student/{course_id}/{student_id}", self.remove_student, methods=["DELETE"])

    async def _verify_instructor_or_admin(self, request: Request, course_id: int = None, db: AsyncSession = None) -> None:
        """Verify if the user is an admin or the instructor of the course"""
        user_role = request.state.payload.get("role")
        user_id = request.state.payload.get("sub")
        
        if user_role == 1:  # Admin role
            return
            
        if course_id is not None and db is not None:
            is_instructor = await self.courseservice.is_course_instructor(db, course_id, user_id)
            if is_instructor:
                return
                
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Se necesita ser instructor del curso o administrador para esta acción"
        )

    async def create(self, course: Course, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            data = course.model_dump()
            
            # By default, the creator is the instructor
            data["instructor"] = user_id
            
            new_course = await self.courseservice.create_course(db, data)
            return {
                "status": "success",
                "message": "Curso creado con éxito",
                "data": {
                    "course_id": new_course.id,
                    "name": new_course.name
                }
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo crear el curso, error: {str(e)}"
            )

    async def list(self, db: AsyncSession = Depends(get_db_session)):
        try:
            courses = await self.courseservice.get_all_courses(db)
            return {
                "status": "success",
                "message": "Cursos obtenidos con éxito",
                "data": courses
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron obtener los cursos, error: {str(e)}"
            )

    async def get(self, course_id: int, db: AsyncSession = Depends(get_db_session)):
        try:
            course = await self.courseservice.get_course_by_id(db, course_id)
            if not course:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se encontró el curso"
                )
            return course
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener el curso, error: {str(e)}"
            )

    async def delete(self, course_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_instructor_or_admin(request, course_id, db)
            
            success = await self.courseservice.delete_course(db, course_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Curso no encontrado"
                )
            return {
                "status": "success",
                "message": "Curso eliminado con éxito",
                "data": {
                    "course_id": course_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo eliminar el curso, error: {str(e)}"
            )

    async def update(self, course_id: int, course: CourseUpdate, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_instructor_or_admin(request, course_id, db)
            
            data = course.model_dump(exclude_unset=True)
            
            updated = await self.courseservice.update_course(db, course_id, data)
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Curso no encontrado"
                )
            return {
                "status": "success",
                "message": "Curso actualizado con éxito",
                "data": {
                    "course_id": course_id,
                    "updated_fields": list(data.keys())
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo actualizar el curso, error: {str(e)}"
            )

    async def join(self, course_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            success = await self.courseservice.enroll_student(db, user_id, course_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo inscribirse en el curso, o ya estás inscrito o el curso no existe"
                )
            return {
                "status": "success",
                "message": "Inscrito exitosamente en el curso",
                "data": {
                    "course_id": course_id,
                    "user_id": user_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo inscribir en el curso, error: {str(e)}"
            )

    async def leave(self, course_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            success = await self.courseservice.unenroll_student(db, user_id, course_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo abandonar el curso, o no existe o no estás inscrito en él"
                )
            return {
                "status": "success",
                "message": "Abandonado el curso con éxito",
                "data": {
                    "course_id": course_id,
                    "user_id": user_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo abandonar el curso, error: {str(e)}"
            )

    async def get_students(self, course_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_instructor_or_admin(request, course_id, db)
            
            students = await self.courseservice.get_course_students(db, course_id)
            return {
                "status": "success",
                "message": "Estudiantes del curso obtenidos con éxito",
                "data": students
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron obtener los estudiantes, error: {str(e)}"
            )

    async def get_instructor_courses(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            courses = await self.courseservice.get_instructor_courses(db, user_id)
            
            return {
                "status": "success",
                "message": "Cursos del instructor obtenidos con éxito",
                "data": courses
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron obtener los cursos del instructor, error: {str(e)}"
            )
    
    async def get_student_courses(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            courses = await self.courseservice.get_student_courses(db, user_id)
            
            return {
                "status": "success",
                "message": "Cursos del estudiante obtenidos con éxito",
                "data": courses
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron obtener los cursos del estudiante, error: {str(e)}"
            )

    async def add_student(self, course_id: int, student_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        """
        Añade un estudiante a un curso (solo admin o instructor)
        """
        try:
            await self._verify_instructor_or_admin(request, course_id, db)
            
            success = await self.courseservice.enroll_student(db, student_id, course_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo inscribir al estudiante. Puede que ya esté inscrito o sea el instructor del curso"
                )
            
            return {
                "status": "success",
                "message": "Estudiante añadido al curso con éxito",
                "data": {
                    "course_id": course_id,
                    "student_id": student_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo añadir al estudiante al curso, error: {str(e)}"
            )

    async def remove_student(self, course_id: int, student_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        """
        Remueve un estudiante de un curso (solo admin o instructor)
        """
        try:
            await self._verify_instructor_or_admin(request, course_id, db)
            
            success = await self.courseservice.unenroll_student(db, student_id, course_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo remover al estudiante del curso. Puede que no esté inscrito"
                )
            
            return {
                "status": "success",
                "message": "Estudiante removido del curso con éxito",
                "data": {
                    "course_id": course_id,
                    "student_id": student_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo remover al estudiante del curso, error: {str(e)}"
            )

    async def get_my_courses(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        """
        Get all courses that the current user is enrolled in
        """
        try:
            user_id = request.state.payload["sub"]
            courses = await self.courseservice.get_student_courses(db, user_id)
            
            return {
                "status": "success",
                "message": "Cursos del usuario obtenidos con éxito",
                "data": courses
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron obtener los cursos del usuario, error: {str(e)}"
            )

    async def get_recommendations(self, request: Request, db: AsyncSession = Depends(get_db_session)):
        """
        Obtiene recomendaciones de cursos para el usuario
        """
        # Verificar que el usuario esté autenticado
        if not hasattr(request.state, 'payload') or request.state.payload.get("role") == "guest":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Acceso no autorizado.")
        
        try:
            # Obtener el document_id del usuario desde el token
            user_id = request.state.payload["sub"]
            
            recommendations = await self.courseservice.get_course_recommendations(db, user_id)
            return {
                "success": True,
                "data": recommendations
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener recomendaciones: {str(e)}"
            )
