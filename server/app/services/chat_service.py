from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_, desc, func, text
from typing import List
from datetime import datetime
import logging

from app.repositories.chats_dao import ChatsDAO
from app.repositories.communitychats_dao import CommunityChatsDAO
from app.repositories.users_dao import UsersDAO
from app.repositories.communities_dao import CommunitiesDAO
from app.repositories.usercommunities_dao import UserCommunitiesDAO
from app.repositories.chat_files_dao import ChatFilesDAO  # **NUEVO: Importar ChatFilesDAO**
from app.utils.class_utils import Injectable

class ChatService(Injectable):
    def __init__(self):
        self.logger = logging.getLogger("uvicorn")

    async def send_community_message(self, db: AsyncSession, sender_id: str, community_id: int, message_text: str, attachment_url: str = None):
        """
        Envía un mensaje a una comunidad - SIMPLE, sin username como parámetro
        """
        try:
            # Convertir sender_id a int para guardar en la tabla
            sender_id_int = int(sender_id)
            
            # Crear mensaje directamente
            new_message = CommunityChatsDAO(
                sender_id=sender_id_int,
                community_id=community_id,
                message_text=message_text,
                sent_at=datetime.utcnow(),
                attachment_url=attachment_url
            )
            
            db.add(new_message)
            await db.commit()
            await db.refresh(new_message)
            
            # Obtener username mediante JOIN
            sender_info = await db.execute(
                select(UsersDAO.username).where(UsersDAO.document_id == sender_id_int)
            )
            username = sender_info.scalar() or f"Usuario {sender_id}"
            
            return {
                "id": new_message.id,
                "sender_id": new_message.sender_id,
                "sender_username": username,
                "community_id": new_message.community_id,
                "message_text": new_message.message_text,
                "sent_at": new_message.sent_at,
                "attachment_url": new_message.attachment_url
            }
        except Exception as e:
            await db.rollback()
            self.logger.error(f"Error sending community message: {str(e)}")
            return None

    async def send_direct_message(self, db: AsyncSession, sender_id: str, receiver_id: str, message_text: str, attachment_url: str = None):
        """
        Envía un mensaje directo entre usuarios - SIMPLE, sin verificaciones
        """
        try:
            # Convertir IDs a int para guardar en la tabla
            sender_id_int = int(sender_id)
            receiver_id_int = int(receiver_id)
            
            # Crear mensaje directamente
            new_message = ChatsDAO(
                sender_id=sender_id_int,
                receiver_id=receiver_id_int,
                message_text=message_text,
                sent_at=datetime.utcnow(),
                attachment_url=attachment_url
            )
            
            db.add(new_message)
            await db.commit()
            await db.refresh(new_message)
            
            # Obtener información del sender para respuesta
            sender_info = await db.execute(
                select(UsersDAO.username).where(UsersDAO.document_id == sender_id_int)
            )
            sender_username = sender_info.scalar()
            
            return {
                "id": new_message.id,
                "sender_id": new_message.sender_id,
                "sender_username": sender_username or f"Usuario {sender_id}",
                "receiver_id": new_message.receiver_id,
                "message_text": new_message.message_text,
                "sent_at": new_message.sent_at,
                "attachment_url": new_message.attachment_url
            }
        except Exception as e:
            await db.rollback()
            self.logger.error(f"Error sending direct message: {str(e)}")
            return None

    async def get_direct_messages(self, db: AsyncSession, user1_id: int, user2_id: int, limit: int = 50):
        """
        Obtiene mensajes directos entre dos usuarios
        """
        try:
            stmt = select(
                ChatsDAO.id,
                ChatsDAO.sender_id,
                ChatsDAO.receiver_id,
                ChatsDAO.message_text,
                ChatsDAO.sent_at,
                ChatsDAO.attachment_url,
                UsersDAO.username
            ).join(
                UsersDAO, ChatsDAO.sender_id == UsersDAO.document_id
            ).where(
                or_(
                    and_(ChatsDAO.sender_id == user1_id, ChatsDAO.receiver_id == user2_id),
                    and_(ChatsDAO.sender_id == user2_id, ChatsDAO.receiver_id == user1_id)
                )
            ).order_by(desc(ChatsDAO.sent_at)).limit(limit)
            
            result = await db.execute(stmt)
            messages = result.all()
            
            return [
                {
                    "id": msg[0],
                    "sender_id": msg[1],
                    "receiver_id": msg[2],
                    "message_text": msg[3],
                    "sent_at": msg[4],
                    "attachment_url": msg[5],
                    "sender_username": msg[6]
                }
                for msg in reversed(messages)
            ]
        except Exception as e:
            self.logger.error(f"Error getting direct messages: {str(e)}")
            return []

    async def get_community_messages(self, db: AsyncSession, community_id: int, limit: int = 50):
        """
        Obtiene mensajes de una comunidad con username
        """
        try:
            stmt = select(
                CommunityChatsDAO.id,
                CommunityChatsDAO.sender_id,
                CommunityChatsDAO.community_id,
                CommunityChatsDAO.message_text,
                CommunityChatsDAO.sent_at,
                CommunityChatsDAO.attachment_url,
                UsersDAO.username
            ).join(
                UsersDAO, CommunityChatsDAO.sender_id == UsersDAO.document_id
            ).where(
                CommunityChatsDAO.community_id == community_id
            ).order_by(CommunityChatsDAO.sent_at).limit(limit)  # Orden cronológico
            
            result = await db.execute(stmt)
            messages = result.all()
            
            return [
                {
                    "id": msg[0],
                    "sender_id": msg[1],
                    "community_id": msg[2],
                    "message_text": msg[3],
                    "sent_at": msg[4].isoformat(),
                    "attachment_url": msg[5],
                    "sender_username": msg[6] or f"Usuario {msg[1]}"
                }
                for msg in messages
            ]
        except Exception as e:
            self.logger.error(f"Error getting community messages: {str(e)}")
            return []

    async def get_user_conversations(self, db: AsyncSession, user_id: int):
        """
        Obtiene las conversaciones de un usuario
        """
        try:
            stmt = select(
                ChatsDAO.sender_id,
                ChatsDAO.receiver_id,
                ChatsDAO.message_text,
                ChatsDAO.sent_at,
                UsersDAO.username
            ).join(
                UsersDAO, 
                or_(
                    and_(ChatsDAO.sender_id == UsersDAO.document_id, ChatsDAO.receiver_id == user_id),
                    and_(ChatsDAO.receiver_id == UsersDAO.document_id, ChatsDAO.sender_id == user_id)
                )
            ).where(
                or_(ChatsDAO.sender_id == user_id, ChatsDAO.receiver_id == user_id)
            ).order_by(desc(ChatsDAO.sent_at))
            
            result = await db.execute(stmt)
            messages = result.all()
            
            # Agrupar por conversación
            conversations = {}
            for msg in messages:
                other_user = msg[1] if msg[0] == user_id else msg[0]
                if other_user not in conversations:
                    conversations[other_user] = {
                        "user_id": other_user,
                        "username": msg[4] if msg[0] != user_id else None,
                        "last_message": msg[2],
                        "last_message_time": msg[3]
                    }
            
            return list(conversations.values())
        except Exception as e:
            self.logger.error(f"Error getting user conversations: {str(e)}")
            return []

    async def send_community_message_simple(self, db: AsyncSession, sender_id: int, community_id: int, message_text: str, attachment_url: str = None):
        """
        Envía un mensaje a una comunidad - ULTRA SIMPLE, sin consultas extras
        """
        try:
            # Crear mensaje directamente sin consultas adicionales
            new_message = CommunityChatsDAO(
                sender_id=sender_id,
                community_id=community_id,
                message_text=message_text,
                sent_at=datetime.utcnow(),
                attachment_url=attachment_url
            )
            
            db.add(new_message)
            await db.commit()
            
            return True
        except Exception as e:
            await db.rollback()
            self.logger.error(f"Error sending community message: {str(e)}")
            return False

    async def get_user_conversations_with_messages(self, db: AsyncSession, user_id: int):
        """Obtiene las conversaciones del usuario con historial de mensajes incluyendo archivos"""
        try:
            # **1. Obtener todos los mensajes de texto**
            text_messages_stmt = select(ChatsDAO).where(
                or_(ChatsDAO.sender_id == user_id, ChatsDAO.receiver_id == user_id)
            )
            text_result = await db.execute(text_messages_stmt)
            text_messages = text_result.scalars().all()
            
            # **2. Obtener todos los archivos donde el usuario participa**
            files_stmt = select(ChatFilesDAO).where(
                and_(
                    ChatFilesDAO.chat_type == "direct",
                    or_(
                        ChatFilesDAO.uploaded_by == user_id,  # Archivos que subió el usuario
                        ChatFilesDAO.chat_id == str(user_id)  # Archivos que le enviaron al usuario
                    )
                )
            )
            files_result = await db.execute(files_stmt)
            file_records = files_result.scalars().all()
            
            # **3. Crear una lista combinada de todos los mensajes (texto + archivos)**
            all_messages = []
            conversations_dict = {}
            
            # Agregar mensajes de texto
            for message in text_messages:
                other_user_id = message.receiver_id if message.sender_id == user_id else message.sender_id
                
                # **Solo agregar mensajes que tengan texto O que tengan attachment_url**
                if message.message_text.strip() or message.attachment_url:
                    message_data = {
                        "id": message.id,
                        "sender_id": message.sender_id,
                        "receiver_id": message.receiver_id,
                        "message_text": message.message_text,
                        "sent_at": message.sent_at,
                        "other_user_id": other_user_id,
                        "message_type": "file" if message.attachment_url and not message.message_text.strip() else "text",
                        "attachment_url": message.attachment_url
                    }
                    
                    # Si es un archivo, obtener información adicional
                    if message.attachment_url:
                        file_id = message.attachment_url.split('/')[-1]
                        file_info = next((f for f in file_records if f.file_id == file_id), None)
                        if file_info:
                            message_data.update({
                                "file_id": file_info.file_id,
                                "file_name": file_info.original_filename,
                                "file_type": file_info.file_type,
                                "file_size": file_info.file_size,
                                "download_url": message.attachment_url
                            })
                    
                    all_messages.append(message_data)
            
            # **4. Agregar archivos que NO tienen mensaje asociado en chats**
            for file_record in file_records:
                # Determinar el otro usuario
                if file_record.uploaded_by == user_id:
                    other_user_id = int(file_record.chat_id)
                else:
                    other_user_id = file_record.uploaded_by
                
                # Verificar si ya existe un mensaje para este archivo
                existing_message = next((m for m in all_messages if m.get("file_id") == file_record.file_id), None)
                
                if not existing_message:
                    # Crear mensaje de archivo
                    file_timestamp = getattr(file_record, 'upload_date', None) or getattr(file_record, 'created_at', None) or datetime.utcnow()
                    
                    file_message = {
                        "id": f"file_{file_record.id}",
                        "sender_id": file_record.uploaded_by,
                        "receiver_id": other_user_id if file_record.uploaded_by == user_id else user_id,
                        "message_text": "",
                        "sent_at": file_timestamp,
                        "other_user_id": other_user_id,
                        "message_type": "file",
                        "file_id": file_record.file_id,
                        "file_name": file_record.original_filename,
                        "file_type": file_record.file_type,
                        "file_size": file_record.file_size,
                        "download_url": f"/api/chat/download-file/{file_record.file_id}"
                    }
                    all_messages.append(file_message)
            
            # **5. Agrupar por conversación**
            for message in all_messages:
                other_user_id = message["other_user_id"]
                
                if str(other_user_id) not in conversations_dict:
                    # Obtener username del otro usuario
                    user_stmt = select(UsersDAO.username).where(UsersDAO.document_id == other_user_id)
                    user_result = await db.execute(user_stmt)
                    username = user_result.scalar() or f"Usuario {other_user_id}"
                    
                    conversations_dict[str(other_user_id)] = {
                        "username": username,
                        "lastMessage": "",
                        "lastMessageTime": "",
                        "unreadCount": 0,
                        "messages": []
                    }
                
                # Preparar mensaje para respuesta
                message_response = {
                    "id": message["id"],
                    "sender_id": message["sender_id"],
                    "receiver_id": message["receiver_id"],
                    "message_text": message["message_text"],
                    "sent_at": message["sent_at"].isoformat() if hasattr(message["sent_at"], 'isoformat') else str(message["sent_at"]),
                    "sender_username": f"Usuario {message['sender_id']}",
                    "receiver_username": f"Usuario {message['receiver_id']}",
                    "message_type": message["message_type"]
                }
                
                # Agregar información de archivo si es necesario
                if message["message_type"] == "file":
                    message_response.update({
                        "file_id": message.get("file_id"),
                        "file_name": message.get("file_name"),
                        "file_type": message.get("file_type"),
                        "file_size": message.get("file_size"),
                        "download_url": message.get("download_url")
                    })
                
                conversations_dict[str(other_user_id)]["messages"].append(message_response)
            
            # **6. Ordenar mensajes y establecer último mensaje**
            for conv in conversations_dict.values():
                # Ordenar mensajes por fecha
                conv["messages"].sort(key=lambda x: x["sent_at"])
                
                # **ARREGLADO: Establecer el último mensaje correctamente**
                if conv["messages"]:
                    last_message = conv["messages"][-1]
                    if last_message["message_type"] == "file":
                        # Para archivos, mostrar el nombre del archivo
                        conv["lastMessage"] = f"📎 {last_message.get('file_name', 'Archivo adjunto')}"
                    else:
                        # Para texto, mostrar el mensaje o "Archivo adjunto" si está vacío
                        conv["lastMessage"] = last_message["message_text"] or "📎 Archivo adjunto"
                    
                    conv["lastMessageTime"] = last_message["sent_at"]
            
            self.logger.info(f"Loaded conversations for user {user_id}: {len(conversations_dict)} conversations with combined messages and files")
            
            return conversations_dict
            
        except Exception as e:
            self.logger.error(f"Error getting user conversations with messages: {str(e)}")
            return {}

    async def send_community_message_simple(self, db: AsyncSession, sender_id: int, community_id: int, message_text: str, file_id: str = None):
        """
        Envía un mensaje a una comunidad - ULTRA SIMPLE, con soporte para archivos
        """
        try:
            # Crear mensaje directamente sin consultas adicionales
            new_message = CommunityChatsDAO(
                sender_id=sender_id,
                community_id=community_id,
                message_text=message_text,
                sent_at=datetime.utcnow(),
                attachment_url=f"/api/chat/download-file/{file_id}" if file_id else None
            )
            
            db.add(new_message)
            await db.commit()
            
            return True
        except Exception as e:
            await db.rollback()
            self.logger.error(f"Error sending community message: {str(e)}")
            return False

    # **NUEVO: Métodos para manejar archivos**
    async def save_chat_file(
        self, 
        db: AsyncSession, 
        file_id: str, 
        original_filename: str, 
        file_path: str, 
        file_size: int, 
        file_type: str, 
        uploaded_by: int, 
        chat_type: str, 
        receiver_id: str
    ):
        """Guardar información de archivo en la base de datos"""
        try:
            # **ARREGLADO: Solo guardar en chat_files, NO crear mensaje automáticamente**
            new_file = ChatFilesDAO(
                file_id=file_id,
                original_filename=original_filename,
                file_path=file_path,
                file_size=file_size,
                file_type=file_type,
                uploaded_by=uploaded_by,
                chat_type=chat_type,
                chat_id=receiver_id
            )
            
            db.add(new_file)
            await db.commit()
            await db.refresh(new_file)
            
            # **REMOVIDO: Ya no creamos mensaje automáticamente aquí**
            # El WebSocket se encargará de crear el mensaje cuando sea necesario
            
            return {
                "id": new_file.id,
                "file_id": new_file.file_id,
                "original_filename": new_file.original_filename,
                "file_path": new_file.file_path,
                "file_size": new_file.file_size,
                "file_type": new_file.file_type,
                "uploaded_by": new_file.uploaded_by,
                "chat_type": new_file.chat_type,
                "chat_id": new_file.chat_id
            }
            
        except Exception as e:
            await db.rollback()
            self.logger.error(f"Error saving chat file: {str(e)}")
            return None

    async def get_chat_file(self, db: AsyncSession, file_id: str):
        """Obtener información de archivo por ID"""
        try:
            stmt = select(ChatFilesDAO).where(ChatFilesDAO.file_id == file_id)
            result = await db.execute(stmt)
            return result.scalar_one_or_none()
            
        except Exception as e:
            self.logger.error(f"Error getting chat file: {str(e)}")
            return None

    async def get_user_file_count(self, db: AsyncSession, user_id: int, chat_type: str, receiver_id: str):
        """
        Contar archivos subidos por un usuario en un chat específico
        """
        try:
            stmt = select(func.count(ChatFilesDAO.id)).where(
                and_(
                    ChatFilesDAO.uploaded_by == user_id,
                    ChatFilesDAO.chat_type == chat_type,
                    ChatFilesDAO.chat_id == receiver_id  # **NOTA: chat_id contiene receiver_id para direct**
                )
            )
            result = await db.execute(stmt)
            return result.scalar() or 0
            
        except Exception as e:
            self.logger.error(f"Error counting user files: {str(e)}")
            return 0

    async def delete_chat_file(self, db: AsyncSession, file_id: str, user_id: int):
        """Eliminar archivo (solo el propietario puede eliminar)"""
        try:
            stmt = select(ChatFilesDAO).where(
                and_(
                    ChatFilesDAO.uploaded_by == user_id,
                    ChatFilesDAO.file_id == file_id,
                )
            )
            result = await db.execute(stmt)
            
            file_record = result.scalar_one_or_none()
            
            if file_record:
                await db.delete(file_record)
                await db.commit()
                return True
            return False
            
        except Exception as e:
            await db.rollback()
            self.logger.error(f"Error deleting chat file: {str(e)}")
            return False
    async def send_direct_message_simple(self, db: AsyncSession, sender_id: int, receiver_id: int, message_text: str, file_id: str = None):
        """
        Envía un mensaje directo - ULTRA SIMPLE, con soporte para archivos
        """
        try:
            # Crear mensaje directamente sin consultas adicionales
            new_message = ChatsDAO(
                sender_id=sender_id,
                receiver_id=receiver_id,
                message_text=message_text,
                sent_at=datetime.utcnow(),
                attachment_url=f"/api/chat/download-file/{file_id}" if file_id else None
            )
            
            db.add(new_message)
            await db.commit()
            
            return True
        except Exception as e:
            await db.rollback()
            self.logger.error(f"Error sending direct message: {str(e)}")
            return False

    async def delete_community_message(self, db: AsyncSession, message_id: str) -> dict:
        """Eliminar mensaje de chat de comunidad"""
        try:
            # **CONVERTIR message_id a entero**
            try:
                message_id_int = int(message_id)
            except ValueError:
                return {
                    "success": False,
                    "error": "ID de mensaje inválido"
                }
            
            # **BUSCAR el mensaje**
            message_query = select(CommunityChatsDAO).where(CommunityChatsDAO.id == message_id_int)
            message_result = await db.execute(message_query)
            message = message_result.scalar_one_or_none()
            
            if not message:
                return {
                    "success": False,
                    "error": "Mensaje no encontrado"
                }
            
            community_id = message.community_id
            had_attachment = bool(message.attachment_url)
            
            # **ELIMINAR archivo asociado si existe**
            if message.attachment_url:
                try:
                    # Buscar archivo en chat_files
                    file_query = select(ChatFilesDAO).where(
                        and_(
                            ChatFilesDAO.chat_type == "community",
                            ChatFilesDAO.chat_id == str(community_id),
                            ChatFilesDAO.original_filename.ilike(f"%{message.message_text.replace('📎 ', '')}%")
                        )
                    )
                    file_result = await db.execute(file_query)
                    chat_file = file_result.scalar_one_or_none()
                    
                    if chat_file:
                        # Eliminar archivo físico
                        import os
                        if os.path.exists(chat_file.file_path):
                            os.remove(chat_file.file_path)
                        
                        # Eliminar registro de archivo
                        await db.delete(chat_file)
                except Exception as file_error:
                    # No fallar si hay error eliminando archivo
                    print(f"Error eliminando archivo: {file_error}")
            
            # **ELIMINAR mensaje**
            await db.delete(message)
            await db.commit()
            
            return {
                "success": True,
                "community_id": community_id,
                "had_attachment": had_attachment
            }
            
        except Exception as e:
            await db.rollback()
            print(f"Error en delete_community_message: {e}")
            return {
                "success": False,
                "error": "Error interno al eliminar mensaje"
            }

    async def delete_direct_message(self, db: AsyncSession, message_id: str, user_id: int) -> dict:
        """Eliminar mensaje directo con toda su lógica"""
        try:
            from app.repositories.chats_dao import ChatsDAO
            from app.repositories.chat_files_dao import ChatFilesDAO
            from sqlalchemy import select, delete
            from pathlib import Path
            import logging
            
            logger = logging.getLogger("uvicorn")
            
            # **BUSCAR el mensaje en la base de datos**
            message_query = select(ChatsDAO).where(ChatsDAO.id == message_id)
            result = await db.execute(message_query)
            message = result.scalar_one_or_none()
            
            if not message:
                return {
                    "success": False,
                    "error": "Mensaje no encontrado"
                }
            
            # **SI EL MENSAJE TIENE ARCHIVO ADJUNTO**
            if message.attachment_url:
                file_id = message.attachment_url.split("/")[-1]
                
                # Buscar el archivo en chat_files
                file_query = select(ChatFilesDAO).where(ChatFilesDAO.file_id == file_id)
                file_result = await db.execute(file_query)
                chat_file = file_result.scalar_one_or_none()
                
                if chat_file:
                    # **ELIMINAR ARCHIVO FÍSICO**
                    file_path = Path(chat_file.file_path)
                    if file_path.exists():
                        try:
                            file_path.unlink()  # Eliminar archivo del sistema
                            logger.info(f"Archivo físico eliminado: {file_path}")
                        except Exception as e:
                            logger.error(f"Error eliminando archivo físico: {e}")
                            # Continuar con la eliminación del mensaje aunque falle el archivo
                    
                    # **ELIMINAR REGISTRO DE chat_files**
                    await db.execute(delete(ChatFilesDAO).where(ChatFilesDAO.file_id == file_id))
                    logger.info(f"Registro de archivo eliminado: {file_id}")
            
            # **ELIMINAR MENSAJE DE CHATS**
            await db.execute(delete(ChatsDAO).where(ChatsDAO.id == message_id))
            await db.commit()
            
            logger.info(f"Mensaje directo eliminado: {message_id}")
            
            return {
                "success": True
            }
            
        except Exception as e:
            await db.rollback()
            logger.error(f"Error en delete_direct_message: {str(e)}")
            return {
                "success": False,
                "error": f"Error interno al eliminar mensaje: {str(e)}"
            }
