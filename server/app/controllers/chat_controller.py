from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, List, Set
import json
import logging
from datetime import datetime
from fastapi import UploadFile, File
import os
import uuid
from pathlib import Path

from app.services.chat_service import ChatService
from app.utils.class_utils import Injectable, inject
from app.utils.db_utils import get_db_session

@inject(ChatService)
class ChatController(Injectable):
    def __init__(self):
        self.route = APIRouter()
        self.logger = logging.getLogger("uvicorn")
        
        # Almacenar conexiones WebSocket por comunidad
        self.community_connections: Dict[int, Set[WebSocket]] = {}
        self.direct_connections: Dict[str, WebSocket] = {}
        
        # Endpoints REST para historial
        self.route.add_api_route("/direct-messages/{user_id}", self.get_direct_messages, methods=["GET"])
        self.route.add_api_route("/community-messages/{community_id}", self.get_community_messages, methods=["GET"])
        self.route.add_api_route("/conversations", self.get_conversations, methods=["GET"])
        
        # WebSocket usando decorador con user_id incluido
        @self.route.websocket("/ws/community/{community_id}/{user_id}")
        async def community_websocket_handler(websocket: WebSocket, community_id: int, user_id: int):
            await self.community_websocket(websocket, community_id, user_id)
        
        # WebSocket para chat directo con user_id específico
        @self.route.websocket("/ws/direct/{user_id}")
        async def direct_websocket_handler(websocket: WebSocket, user_id: int):
            await self.direct_websocket_with_user(websocket, user_id)

        # **NUEVO: Directorio para archivos adjuntos**
        self.upload_dir = Path("uploads/chat_files")
        self.upload_dir.mkdir(parents=True, exist_ok=True)
        
        # **NUEVO: Tipos de archivo permitidos**
        self.allowed_extensions = {
            'images': {'.jpg', '.jpeg', '.png', '.gif', '.webp'},
            'documents': {'.pdf', '.doc', '.docx', '.txt', '.xlsx', '.ppt', '.pptx'},
            'audio': {'.mp3', '.wav', '.ogg', '.m4a'},
            'video': {'.mp4', '.avi', '.mov', '.webm'}
        }
        
        # **ACTUALIZADO: Tamaño máximo de archivo (2MB)**
        self.max_file_size = 2 * 1024 * 1024
        
        # **NUEVO: Límite de archivos por chat (5 máximo)**
        self.max_files_per_chat = 5

        # **NUEVO: Endpoints para archivos**
        self.route.add_api_route("/upload-file", self.upload_chat_file, methods=["POST"])
        self.route.add_api_route("/download-file/{file_id}", self.download_chat_file, methods=["GET"])

        # **ACTUALIZADO: Endpoint para obtener conteo de archivos con nueva estructura**
        self.route.add_api_route("/file-count/{chat_type}/{receiver_id}", self.get_file_count, methods=["GET"])
        
        # **NUEVO: Endpoint para eliminar mensajes (solo admin)**
        self.route.add_api_route("/delete-message/{message_id}", self.delete_community_message, methods=["DELETE"])

    async def get_direct_messages(self, user_id: str, request: Request, db: AsyncSession = Depends(get_db_session)):
        """Obtiene mensajes directos entre el usuario autenticado y otro usuario"""
        try:
            current_user_id = int(request.state.payload["sub"])
            target_user_id = int(user_id)
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        messages = await self.chatservice.get_direct_messages(db, current_user_id, target_user_id)
        return {"messages": messages}

    async def get_community_messages(self, community_id: int, request: Request, db: AsyncSession = Depends(get_db_session)):
        """Obtiene mensajes de una comunidad"""
        messages = await self.chatservice.get_community_messages(db, community_id)
        return {"messages": messages}

    async def get_conversations(self, request: Request, db: AsyncSession = Depends(get_db_session)):
        """Obtiene las conversaciones del usuario autenticado"""
        try:
            user_id = int(request.state.payload["sub"])
        except ValueError:
            raise HTTPException(status_code=400, detail="Invalid user ID format")
            
        conversations = await self.chatservice.get_user_conversations(db, user_id)
        return {"conversations": conversations}

    async def community_websocket(self, websocket: WebSocket, community_id: int, user_id: int):
        """
        WebSocket para chat de comunidad específica
        URL: /ws/community/{community_id}/{user_id}
        JSON: {"message_text": "mensaje"} o {"message_text": "📎 archivo", "file_id": "...", "file_name": "...", ...}
        """
        try:
            await websocket.accept()
            
            # Obtener username
            username = f"Usuario {user_id}"
            async for session in get_db_session():
                try:
                    from app.repositories.users_dao import UsersDAO
                    from sqlalchemy import select
                    
                    user_query = select(UsersDAO.username).where(UsersDAO.document_id == user_id)
                    user_result = await session.execute(user_query)
                    db_username = user_result.scalar()
                    if db_username:
                        username = db_username
                    break
                except Exception:
                    break
                finally:
                    await session.close()
            
            # Agregar a conexiones de la comunidad
            if community_id not in self.community_connections:
                self.community_connections[community_id] = set()
            self.community_connections[community_id].add(websocket)
            
            # Enviar historial de mensajes al conectarse
            async for session in get_db_session():
                try:
                    history = await self.chatservice.get_community_messages(session, community_id)
                    
                    await websocket.send_text(json.dumps({
                        "type": "history",
                        "messages": history
                    }))
                    break
                except Exception:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Error cargando historial"
                    }))
                    break
                finally:
                    await session.close()
            
            # Escuchar nuevos mensajes
            while True:
                try:
                    text = await websocket.receive_text()
                    data = json.loads(text)
                    
                    message_text = data.get("message_text", "").strip()
                    file_id = data.get("file_id")
                    file_name = data.get("file_name")
                    file_type = data.get("file_type")
                    file_size = data.get("file_size")
                    
                    if not message_text:
                        await websocket.send_text(json.dumps({
                            "type": "error", 
                            "message": "Campo obligatorio: message_text"
                        }))
                        continue
                    
                    message_id = f"comm_{community_id}_{user_id}_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:8]}"
                    
                    message = {
                        "id": message_id,
                        "type": "message",
                        "sender_id": user_id,
                        "sender_username": username,
                        "community_id": community_id,
                        "message_text": message_text,
                        "sent_at": datetime.now().isoformat()
                    }
                    
                    if file_id:
                        message.update({
                            "file_id": file_id,
                            "file_name": file_name,
                            "file_type": file_type,
                            "file_size": file_size,
                            "download_url": f"/api/chat/download-file/{file_id}"
                        })
                    
                    # Guardar en base de datos
                    async for session in get_db_session():
                        try:
                            await self.chatservice.send_community_message_simple(
                                session, 
                                sender_id=user_id,
                                community_id=community_id,
                                message_text=message_text,
                                file_id=file_id
                            )
                        except Exception:
                            pass
                        finally:
                            await session.close()
                    
                    # Broadcast a todos los conectados en esta comunidad
                    for conn in self.community_connections.get(community_id, set()).copy():
                        try:
                            await conn.send_text(json.dumps(message))
                        except:
                            self.community_connections[community_id].discard(conn)
                    
                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error", 
                        "message": "Formato JSON inválido"
                    }))
                except Exception:
                    break
                    
        except Exception:
            pass
        finally:
            # Limpiar conexión al desconectar
            if community_id in self.community_connections:
                self.community_connections[community_id].discard(websocket)
                if not self.community_connections[community_id]:
                    del self.community_connections[community_id]

    async def direct_chat(self, websocket: WebSocket):
        """
        WebSocket para chat directo entre usuarios
        """
        await websocket.accept()
        self.logger.info("Direct WebSocket connected")
        
        # ID del usuario conectado
        sender_id = None
        
        try:
            while True:
                try:
                    # Recibir mensaje
                    text = await websocket.receive_text()
                    data = json.loads(text)
                    
                    # Validar campos requeridos
                    sender_id = int(data.get("sender_id", 0))
                    receiver_id = int(data.get("receiver_id", 0))
                    message_text = data.get("message_text", "").strip()
                    
                    if not sender_id or not receiver_id or not message_text:
                        await websocket.send_text(json.dumps({"error": "Campos obligatorios: sender_id, receiver_id, message_text"}))
                        continue
                    
                    self.logger.info(f"Mensaje directo de {sender_id} a {receiver_id}: {message_text}")
                    
                    # Guardar remitente en conexiones
                    self.direct_connections[str(sender_id)] = websocket
                    
                    # Crear objeto mensaje
                    message = {
                        "sender_id": sender_id,
                        "sender_username": f"Usuario {sender_id}",
                        "receiver_id": receiver_id,
                        "message_text": message_text,
                        "sent_at": datetime.now().isoformat()
                    }
                    
                    # Guardar en base de datos (sin esperar respuesta)
                    async for session in get_db_session():
                        try:
                            await self.chatservice.send_direct_message(
                                session, 
                                sender_id=str(sender_id),  # Convertir a string para la DB
                                receiver_id=str(receiver_id),  # Convertir a string para la DB
                                message_text=message_text
                            )
                        except Exception as e:
                            self.logger.error(f"Error guardando mensaje directo: {str(e)}")
                        finally:
                            await session.close()
                    
                    # Enviar al remitente (confirmación)
                    await websocket.send_text(json.dumps(message))
                    
                    # Enviar al destinatario si está conectado
                    if str(receiver_id) in self.direct_connections:
                        try:
                            await self.direct_connections[str(receiver_id)].send_text(json.dumps(message))
                        except:
                            # Remover conexión inválida
                            del self.direct_connections[str(receiver_id)]
                    
                except WebSocketDisconnect:
                    self.logger.info("Direct WebSocket disconnected")
                    break
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({"error": "Formato JSON inválido"}))
                except Exception as e:
                    self.logger.error(f"Error en Direct WebSocket: {str(e)}")
                    
        finally:
            # Limpiar conexión al desconectar
            if sender_id and str(sender_id) in self.direct_connections:
                del self.direct_connections[str(sender_id)]
            self.logger.info("Direct WebSocket cleaned up")

    async def upload_chat_file(
        self, 
        request: Request,
        db: AsyncSession = Depends(get_db_session)
    ):
        """Subir archivo para chat directo o de comunidad"""
        try:
            user_id = int(request.state.payload["sub"])
            
            form_data = await request.form()
            file = form_data.get("file")
            chat_type = form_data.get("chat_type", "direct")
            receiver_id = form_data.get("receiver_id")
            
            if not file or not hasattr(file, 'filename'):
                raise HTTPException(status_code=400, detail="No se recibió ningún archivo")
            
            if not receiver_id or str(receiver_id).strip() == '' or str(receiver_id).lower() in ['null', 'undefined', 'none']:
                raise HTTPException(status_code=400, detail="ID de receptor requerido y válido")
            
            clean_receiver_id = str(receiver_id).strip()
            if not clean_receiver_id:
                raise HTTPException(status_code=400, detail="ID de receptor no puede estar vacío")
            
            file_count = await self.chatservice.get_user_file_count(db, user_id, chat_type, clean_receiver_id)
            if file_count >= self.max_files_per_chat:
                raise HTTPException(status_code=400, detail=f"Límite de archivos alcanzado (máximo {self.max_files_per_chat} por chat)")
            
            file_content = await file.read()
            file_size = len(file_content)
            
            if file_size > self.max_file_size:
                raise HTTPException(status_code=413, detail="Archivo demasiado grande (máximo 2MB)")
            
            file_extension = Path(file.filename).suffix.lower()
            if not self._is_allowed_file(file_extension):
                raise HTTPException(status_code=400, detail="Tipo de archivo no permitido")
            
            file_id = str(uuid.uuid4())
            safe_filename = f"{file_id}{file_extension}"
            file_path = self.upload_dir / safe_filename
            
            compressed_content, final_size = self._compress_file(file_content, file_extension)
            
            with open(file_path, "wb") as buffer:
                buffer.write(compressed_content)
            
            file_type = self._get_file_type(file_extension)

            file_info = await self.chatservice.save_chat_file(
                db,
                file_id=file_id,
                original_filename=file.filename,
                file_path=str(file_path),
                file_size=final_size,
                file_type=file_type,
                uploaded_by=user_id,
                chat_type=chat_type,
                receiver_id=clean_receiver_id
            )
            
            if not file_info:
                raise HTTPException(status_code=500, detail="Error al guardar información del archivo")
            
            return {
                "success": True,
                "file_id": file_id,
                "filename": file.filename,
                "file_type": file_type,
                "file_size": final_size,
                "download_url": f"/api/chat/download-file/{file_id}",
                "remaining_uploads": self.max_files_per_chat - file_count - 1
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=500, detail="Error interno al subir archivo")

    # **ARREGLADO: Función para comprimir archivos - SIN ASYNC**
    def _compress_file(self, file_content: bytes, file_extension: str) -> tuple[bytes, int]:
        """Comprime archivos según su tipo"""
        try:
            original_size = len(file_content)
            
            if file_extension.lower() in {'.jpg', '.jpeg', '.png', '.gif', '.webp'}:
                compressed_content, compressed_size = self._compress_image(file_content, file_extension)
                return compressed_content, compressed_size
                
            elif file_extension.lower() in {'.pdf', '.doc', '.docx', '.txt', '.xlsx', '.ppt', '.pptx'}:
                compressed_content, compressed_size = self._compress_with_gzip(file_content)
                return compressed_content, compressed_size
                
            else:
                compressed_content, compressed_size = self._compress_with_gzip(file_content)
                if compressed_size < original_size * 0.9:
                    return compressed_content, compressed_size
                else:
                    return file_content, original_size
                    
        except Exception:
            return file_content, len(file_content)

    def _compress_image(self, file_content: bytes, file_extension: str) -> tuple[bytes, int]:
        """Comprime imágenes reduciendo calidad y resolución"""
        try:
            from PIL import Image
            import io
            
            image = Image.open(io.BytesIO(file_content))
            
            if image.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[-1])
                else:
                    background.paste(image)
                image = background
            
            max_size = (1200, 800)
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            output = io.BytesIO()
            if file_extension.lower() in {'.jpg', '.jpeg'}:
                image.save(output, format='JPEG', quality=50, optimize=True)
            elif file_extension.lower() == '.png':
                image.save(output, format='JPEG', quality=60, optimize=True)
            elif file_extension.lower() == '.webp':
                image.save(output, format='WEBP', quality=50, optimize=True)
            else:
                image.save(output, format='JPEG', quality=50, optimize=True)
            
            compressed_content = output.getvalue()
            compressed_size = len(compressed_content)
            
            return compressed_content, compressed_size
            
        except ImportError:
            return file_content, len(file_content)
        except Exception:
            return file_content, len(file_content)

    def _compress_with_gzip(self, file_content: bytes) -> tuple[bytes, int]:
        """Comprime archivos usando gzip"""
        try:
            import gzip
            
            compressed = gzip.compress(file_content, compresslevel=9)
            compressed_size = len(compressed)
            
            return compressed, compressed_size
            
        except Exception:
            return file_content, len(file_content)

    # **MODIFICAR: Actualizar WebSocket para manejar archivos**
    async def direct_websocket_with_user(self, websocket: WebSocket, user_id: int):
        """
        WebSocket para chat directo con user_id específico
        URL: /ws/direct/{user_id}
        JSON: {"receiver_id": 456, "message_text": "mensaje"}
        """
        try:
            await websocket.accept()
            
            # Obtener username
            username = f"Usuario {user_id}"
            async for session in get_db_session():
                try:
                    from app.repositories.users_dao import UsersDAO
                    from sqlalchemy import select
                    
                    user_query = select(UsersDAO.username).where(UsersDAO.document_id == user_id)
                    user_result = await session.execute(user_query)
                    db_username = user_result.scalar()
                    if db_username:
                        username = db_username
                    break
                except Exception:
                    break
                finally:
                    await session.close()
            
            # Almacenar conexión del usuario
            self.direct_connections[str(user_id)] = websocket
            
            # Enviar historial completo de conversaciones al conectarse
            async for session in get_db_session():
                try:
                    conversations = await self.chatservice.get_user_conversations_with_messages(session, user_id)
                    
                    await websocket.send_text(json.dumps({
                        "type": "history",
                        "conversations": conversations
                    }))
                    break
                except Exception:
                    await websocket.send_text(json.dumps({
                        "type": "error",
                        "message": "Error cargando conversaciones"
                    }))
                    break
                finally:
                    await session.close()
            
            while True:
                try:
                    text = await websocket.receive_text()
                    data = json.loads(text)
                    
                    message_type = data.get("type", "text")
                    receiver_id = data.get("receiver_id")
                    
                    if not receiver_id:
                        await websocket.send_text(json.dumps({
                            "type": "error", 
                            "message": "Campo obligatorio: receiver_id"
                        }))
                        continue
                    
                    if message_type == "text":
                        message_text = data.get("message_text", "").strip()
                        if not message_text:
                            await websocket.send_text(json.dumps({
                                "type": "error", 
                                "message": "Campo obligatorio: message_text"
                            }))
                            continue
                        
                        message_id = f"msg_{user_id}_{int(datetime.now().timestamp() * 1000)}_{uuid.uuid4().hex[:8]}"
                        
                        message = {
                            "id": message_id,
                            "type": "message",
                            "message_type": "text",
                            "sender_id": user_id,
                            "sender_username": username,
                            "receiver_id": int(receiver_id),
                            "message_text": message_text,
                            "sent_at": datetime.now().isoformat()
                        }
                        
                        # Guardar en DB
                        async for session in get_db_session():
                            try:
                                await self.chatservice.send_direct_message_simple(
                                    session, 
                                    sender_id=user_id,
                                    receiver_id=int(receiver_id),
                                    message_text=message_text
                                )
                                break
                            except Exception:
                                pass
                            finally:
                                await session.close()
                        
                    elif message_type == "file":
                        file_id = data.get("file_id")
                        file_name = data.get("file_name")
                        file_type = data.get("file_type")
                        file_size = data.get("file_size")
                        
                        if not all([file_id, file_name]):
                            await websocket.send_text(json.dumps({
                                "type": "error", 
                                "message": "Campos obligatorios para archivo: file_id, file_name"
                            }))
                            continue
                        
                        message_id = f"file_{user_id}_{int(datetime.now().timestamp() * 1000)}_{file_id[:8]}"
                        
                        message = {
                            "id": message_id,
                            "type": "message",
                            "message_type": "file",
                            "sender_id": user_id,
                            "sender_username": username,
                            "receiver_id": int(receiver_id),
                            "file_id": file_id,
                            "file_name": file_name,
                            "file_type": file_type,
                            "file_size": file_size,
                            "download_url": f"/api/chat/download-file/{file_id}",
                            "sent_at": datetime.now().isoformat()
                        }
                        
                        # Guardar en DB
                        async for session in get_db_session():
                            try:
                                await self.chatservice.send_direct_message_simple(
                                    session, 
                                    sender_id=user_id,
                                    receiver_id=int(receiver_id),
                                    message_text="",
                                    file_id=file_id
                                )
                                break
                            except Exception:
                                pass
                            finally:
                                await session.close()
                    
                    else:
                        await websocket.send_text(json.dumps({
                            "type": "error", 
                            "message": "Tipo de mensaje no válido. Usa 'text' o 'file'"
                        }))
                        continue
                    
                    # Broadcast a ambos usuarios
                    for target_user_id in [str(user_id), str(receiver_id)]:
                        if target_user_id in self.direct_connections:
                            try:
                                await self.direct_connections[target_user_id].send_text(json.dumps(message))
                            except Exception:
                                try:
                                    del self.direct_connections[target_user_id]
                                except:
                                    pass
                    
                except WebSocketDisconnect:
                    break
                except json.JSONDecodeError:
                    await websocket.send_text(json.dumps({
                        "type": "error", 
                        "message": "Formato JSON inválido"
                    }))
                except Exception:
                    break
                    
        except Exception:
            pass
        finally:
            # Limpiar conexión al desconectar
            if str(user_id) in self.direct_connections:
                del self.direct_connections[str(user_id)]

    async def download_chat_file(self, file_id: str, request: Request, db: AsyncSession = Depends(get_db_session)):
        """Descargar archivo de chat"""
        try:
            file_info = await self.chatservice.get_chat_file(db, file_id)
            if not file_info:
                raise HTTPException(status_code=404, detail="Archivo no encontrado")
            
            file_path = Path(file_info.file_path)
            if not file_path.exists():
                raise HTTPException(status_code=404, detail="Archivo no encontrado en el sistema")
            
            file_extension = Path(file_info.original_filename).suffix.lower()
            
            with open(file_path, "rb") as f:
                file_content = f.read()
            
            if file_extension in {'.pdf', '.doc', '.docx', '.txt', '.xlsx', '.ppt', '.pptx'}:
                try:
                    import gzip
                    decompressed_content = gzip.decompress(file_content)
                    
                    import tempfile
                    import os
                    
                    temp_fd, temp_path = tempfile.mkstemp(suffix=f'_{file_info.original_filename}')
                    try:
                        with os.fdopen(temp_fd, 'wb') as temp_file:
                            temp_file.write(decompressed_content)
                        
                        from fastapi.responses import FileResponse
                        from starlette.background import BackgroundTask
                        
                        def cleanup_temp_file():
                            try:
                                if os.path.exists(temp_path):
                                    os.unlink(temp_path)
                            except Exception:
                                pass
                        
                        response = FileResponse(
                            path=temp_path,
                            filename=file_info.original_filename,
                            media_type='application/octet-stream',
                            headers={"Content-Disposition": f"attachment; filename=\"{file_info.original_filename}\""}
                        )
                        
                        response.background = BackgroundTask(cleanup_temp_file)
                        return response
                        
                    except Exception as e:
                        try:
                            os.close(temp_fd)
                            os.unlink(temp_path)
                        except:
                            pass
                        raise e
                        
                except gzip.BadGzipFile:
                    pass
                except Exception:
                    pass
            
            from fastapi.responses import FileResponse
            return FileResponse(
                path=str(file_path),
                filename=file_info.original_filename,
                media_type='application/octet-stream',
                headers={"Content-Disposition": f"attachment; filename=\"{file_info.original_filename}\""}
            )
            
        except HTTPException:
            raise
        except Exception:
            raise HTTPException(status_code=500, detail="Error al descargar archivo")

    def _is_allowed_file(self, extension: str) -> bool:
        """Verificar si el tipo de archivo está permitido"""
        for file_types in self.allowed_extensions.values():
            if extension in file_types:
                return True
        return False

    def _get_file_type(self, extension: str) -> str:
        """Obtener el tipo de archivo basado en la extensión"""
        for file_type, extensions in self.allowed_extensions.items():
            if extension in extensions:
                return file_type
        return 'other'

    async def get_file_count(self, chat_type: str, receiver_id: str, request: Request, db: AsyncSession = Depends(get_db_session)):
        """Obtener conteo de archivos por chat directo o de comunidad"""
        try:
            user_id = int(request.state.payload["sub"])
            self.logger.info(f"Getting file count: user_id={user_id}, chat_type={chat_type}, receiver_id={receiver_id}")
            count = await self.chatservice.get_user_file_count(db, user_id, chat_type, receiver_id)
            return {"count": count, "remaining": self.max_files_per_chat - count}
        except Exception as e:
            self.logger.error(f"Error getting file count: {str(e)}")
            return {"count": 0, "remaining": self.max_files_per_chat}

    async def delete_community_message(self, message_id: str, request: Request, db: AsyncSession = Depends(get_db_session)):
        """Eliminar mensaje de chat de comunidad (solo admin)"""
        try:
            # **ARREGLADO: Verificar admin usando el mismo patrón que community_controller**
            if request.state.payload.get("role") != 1:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Se necesita ser admin para esta accion"
                )
            
            # **DELEGAR toda la lógica al servicio**
            result = await self.chatservice.delete_community_message(db, message_id)
            
            if not result["success"]:
                raise HTTPException(status_code=404, detail=result["error"])
            
            community_id = result["community_id"]
            
            # **NOTIFICAR A TODOS LOS CONECTADOS EN LA COMUNIDAD**
            deletion_message = {
                "type": "message_deleted",
                "message_id": message_id,
                "community_id": community_id,
                "deleted_at": datetime.now().isoformat()
            }
            
            # Broadcast a todos los conectados en esta comunidad
            for conn in self.community_connections.get(community_id, set()).copy():
                try:
                    await conn.send_text(json.dumps(deletion_message))
                except:
                    self.community_connections[community_id].discard(conn)
            
            return {
                "success": True,
                "message": "Mensaje eliminado correctamente",
                "message_id": message_id,
                "community_id": community_id,
                "had_attachment": result["had_attachment"]
            }
            
        except HTTPException:
            raise
        except Exception as e:
            self.logger.error(f"Error eliminando mensaje {message_id}: {str(e)}")
            raise HTTPException(status_code=500, detail="Error interno al eliminar mensaje")
