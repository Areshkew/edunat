from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List
from datetime import datetime
import httpx

# Models
from app.models.transaction_model import *

# Services
from app.services.transaction_service import TransactionService

# Db utils
from app.utils.class_utils import Injectable, inject
from app.utils.db_utils import get_db_session

@inject(TransactionService)
class TransactionController(Injectable):
    def __init__(self):
        self.route = APIRouter(prefix='/transaction')
        # Transaction functions
        self.route.add_api_route("/create/community", self.create_community_transaction, methods=["POST"])
        self.route.add_api_route("/create/user", self.create_user_transaction, methods=["POST"])
        self.route.add_api_route("/approve/{transaction_id}", self.approve_transaction, methods=["PUT"])
        self.route.add_api_route("/reject/{transaction_id}", self.reject_transaction, methods=["PUT"])
        self.route.add_api_route("/pending/community", self.get_pending_community_transactions, methods=["GET"])
        self.route.add_api_route("/user/pending/community", self.get_user_pending_community_transactions, methods=["GET"])

    async def _verify_admin(self, request: Request) -> None:
        if request.state.payload.get("role") != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se necesita ser admin para esta accion"
            )

    async def create_community_transaction(self, transaction: Transaction, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            # Crear una transacción con estado de espera de aprobación del administrador (2)
            data = transaction.model_dump()
            data["status"] = 2  # WaitingAdminApproval
            data["origin"] = request.state.payload["sub"]
            
            new_transaction = await self.transactionservice.create_transaction(db, data)
            return {
                "status": "success",
                "message": "Transacción creada con éxito, en espera de aprobación del administrador",
                "data": {
                    "transaction_id": new_transaction.id,
                    "status": new_transaction.status
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo crear la transacción, error: {str(e)}"
            )

    async def create_user_transaction(self, transaction: Transaction, request:Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            # Crear una transacción con estado de espera de aprobación del usuario (3)
            data = transaction.model_dump()
            data["status"] = 3  # WaitingUserApproval
            data["origin"] = request.state.payload["sub"]
            data["date"] = datetime.now().date()
            
            new_transaction = await self.transactionservice.create_transaction(db, data)
            return {
                "status": "success",
                "message": "Transacción creada con éxito, en espera de aprobación del usuario",
                "data": {
                    "transaction_id": new_transaction.id,
                    "status": new_transaction.status
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo crear la transacción, error: {str(e)}"
            )

    async def approve_transaction(self, transaction_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            # Verificar que la transacción existe
            transaction = await self.transactionservice.get_transaction_by_id(db, transaction_id)
            if not transaction:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Transacción no encontrada"
                )
            
            # Si la transacción está en estado de espera de aprobación del admin, verificar que sea admin
            if transaction.status == 2:  # WaitingAdminApproval
                await self._verify_admin(request)
                
                # Si es una transacción para unirse a una comunidad, procesar la unión y los puntos
                try:
                    user_id = transaction.origin
                    community_id = transaction.destination  # En este punto, aún no tiene sufijo
                    points = transaction.points
                    token = request.headers.get("Authorization")
                    
                    # 1. Unir el usuario a la comunidad
                    try:
                        async with httpx.AsyncClient() as client:
                            join_response = await client.post(
                                f"http://localhost:8000/api/community/add/{community_id}/{user_id}",
                                headers={"Authorization": token}
                            )
                            join_response.raise_for_status()
                            # Nota: ignoramos errores si el usuario ya es miembro
                    except Exception as e:
                        print(f"Error al unir usuario a la comunidad: {str(e)}")
                        # Continuamos con el proceso incluso si esto falla
                    
                    # 2. Otorgar puntos al usuario
                    try:
                        async with httpx.AsyncClient() as client:
                            points_response = await client.post(
                                f"http://localhost:8000/api/user/addp/{user_id}/{points}",
                                headers={"Authorization": token}
                            )
                            points_response.raise_for_status()
                    except Exception as e:
                        print(f"Error al otorgar puntos al usuario: {str(e)}")
                        # Continuamos con el proceso incluso si esto falla
                except Exception as e:
                    print(f"Error procesando acciones posteriores a la aprobación: {str(e)}")
                    # Continuamos con la aprobación de la transacción
            
            # Si la transacción está en estado de espera de aprobación del usuario, verificar que sea el usuario destino
            elif transaction.status == 3:  # WaitingUserApproval
                user_id = request.state.payload["sub"]
                if str(user_id) != transaction.destination:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permiso para aprobar esta transacción"
                    )
            
            # Actualizar el estado de la transacción
            success = await self.transactionservice.update_transaction_status(db, transaction_id, 0)  # Approved
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al aprobar la transacción"
                )
            
            # Obtener la transacción actualizada
            updated_transaction = await self.transactionservice.get_transaction_by_id(db, transaction_id)
            
            return {
                "status": "success",
                "message": "Transacción aprobada con éxito",
                "data": {
                    "transaction_id": transaction_id,
                    "status": updated_transaction.status,
                    "destination": updated_transaction.destination,
                    "destination_type": self.transactionservice.get_destination_type(updated_transaction.destination)
                }
            }
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo aprobar la transacción, error: {str(e)}"
            )

    async def reject_transaction(self, transaction_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            # Verificar que la transacción existe
            transaction = await self.transactionservice.get_transaction_by_id(db, transaction_id)
            if not transaction:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Transacción no encontrada"
                )
            
            # Si la transacción está en estado de espera de aprobación del admin, verificar que sea admin
            if transaction.status == 2:  # WaitingAdminApproval
                await self._verify_admin(request)
            
            # Si la transacción está en estado de espera de aprobación del usuario, verificar que sea el usuario destino
            elif transaction.status == 3:  # WaitingUserApproval
                user_id = request.state.payload["sub"]
                if str(user_id) != transaction.destination:
                    raise HTTPException(
                        status_code=status.HTTP_403_FORBIDDEN,
                        detail="No tienes permiso para rechazar esta transacción"
                    )
            
            # Actualizar el estado de la transacción
            success = await self.transactionservice.update_transaction_status(db, transaction_id, 1)  # Rejected
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Error al rechazar la transacción"
                )
            
            # Obtener la transacción actualizada
            updated_transaction = await self.transactionservice.get_transaction_by_id(db, transaction_id)
            
            return {
                "status": "success",
                "message": "Transacción rechazada con éxito",
                "data": {
                    "transaction_id": transaction_id,
                    "status": updated_transaction.status,
                    "destination": updated_transaction.destination,
                    "destination_type": self.transactionservice.get_destination_type(updated_transaction.destination)
                }
            }
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo rechazar la transacción, error: {str(e)}"
            )

    async def get_pending_community_transactions(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            # Verify admin permissions
            await self._verify_admin(request)
            
            # Get transactions with status 2 (WaitingAdminApproval) including community names
            transaction_list = await self.transactionservice.get_pending_transactions_with_details(db, 2)
            
            return {
                "status": "success",
                "message": "Transacciones pendientes de comunidad recuperadas con éxito",
                "data": transaction_list
            }
                
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener transacciones pendientes: {str(e)}"
            )

    async def get_user_pending_community_transactions(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            # Get user ID from token
            user_id = request.state.payload["sub"]
            
            # Get just transaction IDs and destinations with status 2 (WaitingAdminApproval) for this user
            user_transactions = await self.transactionservice.get_user_pending_transactions(db, user_id, 2)
            
            # Transform to simplified response format with just the needed fields
            transaction_list = []
            for transaction_tuple in user_transactions:
                transaction_list.append({
                    "id": transaction_tuple[0],
                    "destination": transaction_tuple[1]
                })
            
            return {
                "status": "success",
                "message": "Transacciones pendientes de comunidad del usuario recuperadas con éxito",
                "data": transaction_list
            }
            
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Error al obtener transacciones pendientes del usuario: {str(e)}"
            )
