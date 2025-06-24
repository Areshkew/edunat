from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

# Models
from app.models.notification_model import *

# Services
from app.services.notification_service import NotificationService

# Db utils
from app.utils.class_utils import Injectable, inject
from app.utils.db_utils import get_db_session

@inject(NotificationService)
class NotificationController(Injectable):
    def __init__(self):
        self.route = APIRouter(prefix='/notifications')
        # Notification functions
        self.route.add_api_route("/create", self.create, methods=["POST"])
        self.route.add_api_route("/list", self.list, methods=["GET"])
        self.route.add_api_route("/my-notifications", self.get_my_notifications, methods=["GET"])
        self.route.add_api_route("/unread-count", self.get_unread_count, methods=["GET"])
        self.route.add_api_route("/{notification_id}", self.get, methods=["GET"])
        self.route.add_api_route("/update/{notification_id}", self.update, methods=["PUT"])
        self.route.add_api_route("/delete/{notification_id}", self.delete, methods=["DELETE"])
        self.route.add_api_route("/mark-read/{notification_id}", self.mark_as_read, methods=["PATCH"])
        self.route.add_api_route("/mark-all-read", self.mark_all_as_read, methods=["PATCH"])

    async def _verify_admin(self, request: Request) -> None:
        """Verify if the user is an admin"""
        user_role = request.state.payload.get("role")
        
        if user_role != 1:  # Admin role
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se necesita ser administrador para esta acción"
            )

    async def _verify_notification_owner_or_admin(self, request: Request, notification_id: int, db: AsyncSession) -> None:
        """Verify if the user owns the notification or is an admin"""
        user_role = request.state.payload.get("role")
        user_id = request.state.payload.get("sub")
        
        if user_role == 1:  # Admin role
            return
            
        # Check if user owns the notification
        notification = await self.notificationservice.get_notification_by_id(db, notification_id)
        if not notification:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Notificación no encontrada"
            )
            
        if notification["user_id"] != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permiso para acceder a esta notificación"
            )

    async def create(self, notification: Notification, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:            
            data = notification.model_dump()
            
            new_notification = await self.notificationservice.create_notification(db, data)
            return {
                "status": "success",
                "message": "Notificación creada con éxito",
                "data": {
                    "notification_id": new_notification.id,
                    "message": new_notification.message
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo crear la notificación, error: {str(e)}"
            )

    async def list(self, request: Request, db: AsyncSession = Depends(get_db_session)):
        try:
            await self._verify_admin(request)
            
            notifications = await self.notificationservice.get_all_notifications(db)
            return {
                "status": "success",
                "message": "Notificaciones obtenidas con éxito",
                "data": notifications
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron obtener las notificaciones, error: {str(e)}"
            )

    async def get(self, notification_id: int, request: Request, db: AsyncSession = Depends(get_db_session)):
        try:
            await self._verify_notification_owner_or_admin(request, notification_id, db)
            
            notification = await self.notificationservice.get_notification_by_id(db, notification_id)
            if not notification:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se encontró la notificación"
                )
            return {
                "status": "success",
                "message": "Notificación obtenida con éxito",
                "data": notification
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener la notificación, error: {str(e)}"
            )

    async def get_my_notifications(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            notifications = await self.notificationservice.get_user_notifications(db, user_id)
            
            return {
                "status": "success",
                "message": "Notificaciones del usuario obtenidas con éxito",
                "data": notifications
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron obtener las notificaciones del usuario, error: {str(e)}"
            )

    async def update(self, notification_id: int, notification: NotificationUpdate, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_notification_owner_or_admin(request, notification_id, db)
            
            data = notification.model_dump(exclude_unset=True)
            
            updated = await self.notificationservice.update_notification(db, notification_id, data)
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notificación no encontrada"
                )
            return {
                "status": "success",
                "message": "Notificación actualizada con éxito",
                "data": {
                    "notification_id": notification_id,
                    "updated_fields": list(data.keys())
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo actualizar la notificación, error: {str(e)}"
            )

    async def delete(self, notification_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_notification_owner_or_admin(request, notification_id, db)
            
            success = await self.notificationservice.delete_notification(db, notification_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notificación no encontrada"
                )
            return {
                "status": "success",
                "message": "Notificación eliminada con éxito",
                "data": {
                    "notification_id": notification_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo eliminar la notificación, error: {str(e)}"
            )

    async def mark_as_read(self, notification_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_notification_owner_or_admin(request, notification_id, db)
            
            success = await self.notificationservice.mark_as_read(db, notification_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Notificación no encontrada"
                )
            return {
                "status": "success",
                "message": "Notificación marcada como leída",
                "data": {
                    "notification_id": notification_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo marcar la notificación como leída, error: {str(e)}"
            )

    async def mark_all_as_read(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            
            success = await self.notificationservice.mark_all_as_read(db, user_id)
            return {
                "status": "success",
                "message": "Todas las notificaciones marcadas como leídas",
                "data": {
                    "user_id": user_id,
                    "updated": success
                }
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudieron marcar las notificaciones como leídas, error: {str(e)}"
            )

    async def get_unread_count(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            count = await self.notificationservice.get_unread_count(db, user_id)
            
            return {
                "status": "success",
                "message": "Contador de notificaciones no leídas obtenido con éxito",
                "data": {
                    "unread_count": count
                }
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener el contador de notificaciones, error: {str(e)}"
            )
