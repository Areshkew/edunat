import logging
from sqlalchemy import select, delete, update, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

from app.repositories.notifications_dao import NotificationsDAO
from app.repositories.users_dao import UsersDAO
from app.utils.class_utils import Injectable

class NotificationService(Injectable):
    def __init__(self):
        self.logger = logging.getLogger("uvicorn")

    async def create_notification(self, db: AsyncSession, notification_data: dict) -> NotificationsDAO:
        """
        Crea una nueva notificación en la base de datos.
        """
        new_notification = NotificationsDAO(
            user_id=notification_data["user_id"],
            message=notification_data["message"],
            notification_type=notification_data["notification_type"],
            is_read=notification_data.get("is_read", False),
            created_at=datetime.now(timezone.utc).date()
        )
        
        db.add(new_notification)
        await db.commit()
        await db.refresh(new_notification)
        return new_notification

    async def get_all_notifications(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Obtiene todas las notificaciones con información del usuario
        """
        result = await db.execute(
            select(NotificationsDAO, UsersDAO.username)
            .join(UsersDAO, NotificationsDAO.user_id == UsersDAO.document_id)
            .order_by(NotificationsDAO.created_at.desc())
        )
        
        notifications = []
        for notification, username in result.all():
            notification_dict = {
                "id": notification.id,
                "user_id": notification.user_id,
                "username": username,
                "message": notification.message,
                "notification_type": notification.notification_type,
                "is_read": notification.is_read,
                "created_at": notification.created_at
            }
            notifications.append(notification_dict)
        
        return notifications

    async def get_notification_by_id(self, db: AsyncSession, notification_id: int) -> Optional[Dict[str, Any]]:
        """
        Obtiene una notificación por su ID incluyendo información del usuario
        """
        result = await db.execute(
            select(NotificationsDAO, UsersDAO.username)
            .join(UsersDAO, NotificationsDAO.user_id == UsersDAO.document_id)
            .where(NotificationsDAO.id == notification_id)
        )
        
        row = result.first()
        if not row:
            return None
            
        notification, username = row
        
        return {
            "id": notification.id,
            "user_id": notification.user_id,
            "username": username,
            "message": notification.message,
            "notification_type": notification.notification_type,
            "is_read": notification.is_read,
            "created_at": notification.created_at
        }

    async def get_user_notifications(self, db: AsyncSession, user_id: int) -> List[Dict[str, Any]]:
        """
        Obtiene todas las notificaciones de un usuario específico
        """
        result = await db.execute(
            select(NotificationsDAO)
            .where(NotificationsDAO.user_id == user_id)
            .order_by(NotificationsDAO.created_at.desc())
        )
        
        notifications = []
        for notification in result.scalars().all():
            notification_dict = {
                "id": notification.id,
                "user_id": notification.user_id,
                "message": notification.message,
                "notification_type": notification.notification_type,
                "is_read": notification.is_read,
                "created_at": notification.created_at
            }
            notifications.append(notification_dict)
        
        return notifications

    async def update_notification(self, db: AsyncSession, notification_id: int, update_data: dict) -> bool:
        """
        Actualiza una notificación
        """
        result = await db.execute(
            update(NotificationsDAO)
            .where(NotificationsDAO.id == notification_id)
            .values(**update_data)
        )
        await db.commit()
        return result.rowcount > 0

    async def delete_notification(self, db: AsyncSession, notification_id: int) -> bool:
        """
        Elimina una notificación por su ID
        """
        result = await db.execute(
            delete(NotificationsDAO).where(NotificationsDAO.id == notification_id)
        )
        await db.commit()
        return result.rowcount > 0

    async def mark_as_read(self, db: AsyncSession, notification_id: int) -> bool:
        """
        Marca una notificación como leída
        """
        return await self.update_notification(db, notification_id, {"is_read": True})

    async def mark_all_as_read(self, db: AsyncSession, user_id: int) -> bool:
        """
        Marca todas las notificaciones de un usuario como leídas
        """
        result = await db.execute(
            update(NotificationsDAO)
            .where(and_(
                NotificationsDAO.user_id == user_id,
                NotificationsDAO.is_read == False
            ))
            .values(is_read=True)
        )
        await db.commit()
        return result.rowcount > 0

    async def get_unread_count(self, db: AsyncSession, user_id: int) -> int:
        """
        Obtiene el número de notificaciones no leídas de un usuario
        """
        result = await db.execute(
            select(func.count())
            .select_from(NotificationsDAO)
            .where(and_(
                NotificationsDAO.user_id == user_id,
                NotificationsDAO.is_read == False
            ))
        )
        return result.scalar_one() or 0
