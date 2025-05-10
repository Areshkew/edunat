from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.ext.asyncio import AsyncSession
from typing import Dict, Any, List

# Models
from app.models.community_model import *

# Services
from app.services.community_service import CommunityService

# Db utils
from app.utils.class_utils import Injectable, inject
from app.utils.db_utils import get_db_session

@inject(CommunityService)
class CommunityController(Injectable):
    def __init__(self):
        self.route = APIRouter(prefix='/community')
        # Community functions
        self.route.add_api_route("/create", self.create, methods=["POST"])
        self.route.add_api_route("/list", self.list, methods=["GET"])
        self.route.add_api_route("/{community_id}", self.get, methods=["GET"])
        self.route.add_api_route("/delete/{community_id}", self.delete, methods=["DELETE"])
        self.route.add_api_route("/update/{community_id}", self.update, methods=["PUT"])
        self.route.add_api_route("/join/{community_id}", self.join, methods=["POST"])
        self.route.add_api_route("/leave/{community_id}", self.leave, methods=["POST"])
        self.route.add_api_route("/members/{community_id}", self.get_members, methods=["GET"])
        self.route.add_api_route("/add/{community_id}/{user_id}", self.add, methods=["POST"])
        self.route.add_api_route("/kick/{community_id}/{user_id}", self.kick, methods=["POST"])
        self.route.add_api_route("/stats/totalmembers", self.totalmembers, methods=["GET"])
        self.route.add_api_route("/user/communities", self.get_user_communities, methods=["GET"])
        self.route.add_api_route("/user/communities/details", self.get_user_communities_details, methods=["GET"])

    async def _verify_admin(self, request: Request) -> None:
        if request.state.payload.get("role") != 1:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Se necesita ser admin para esta accion"
            )

    async def create(self, community: Community, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_admin(request)
            data = community.model_dump()
            
            if await self.communityservice.community_exists(db, data["name"]):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Comunidad ya tiene el nombre: '{data['name']}'"
                )
            
            new_community = await self.communityservice.create_community(db, data)
            return {
                "status": "success",
                "message": "Comunidad creada con exito",
                "data": {
                    "community_id": new_community.id,
                    "name": new_community.name
                }
            }
            
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo crear la comunidad, error: {str(e)}"
            )

    async def list(self, db: AsyncSession = Depends(get_db_session)):
        try:
            communities = await self.communityservice.get_all_communities(db)
            return {
                "status": "success",
                "message": "Comunidades obtenidas con éxito",
                "data": communities
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener las comunidades, error: {str(e)}"
            )

    async def get(self, community_id: int, db: AsyncSession = Depends(get_db_session)):
        try:
            community = await self.communityservice.get_community_by_id(db, community_id)
            if not community:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="No se encontro la comunidad"
                )
            return community
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener la comunidad, error: {str(e)}"
            )

    async def delete(self, community_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_admin(request)
            success = await self.communityservice.delete_community(db, community_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comunidad no encontrada"
                )
            return {
                "status": "success",
                "message": "Comunidad eliminada con exito",
                "data": {
                    "community_id": community_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo eliminar la comunidad, error: {str(e)}"
            )

    async def update(self, community_id: int, community: CommunityUpdate, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_admin(request)
            data = community.model_dump(exclude_unset=True)
            
            if 'name' in data and await self.communityservice.community_exists(db, data["name"], community_id):
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"Communidad ya tiene el nombre: '{data['name']}'"
                )
            
            updated = await self.communityservice.update_community(db, community_id, data)
            if not updated:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Comunidad no encontrada"
                )
            return {
                "status": "success",
                "message": "Comunidad actualizada con exito",
                "data": {
                    "community_id": community_id,
                    "updated_fields": list(data.keys())
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo actualizar la comunidad, error: {str(e)}"
            )

    async def join(self, community_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            success = await self.communityservice.join_community(db, user_id, community_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo unir a la comunidad, o ya estas unido o no existe"
                )
            return {
                "status": "success",
                "message": "Unido exitosamente a la comunidad",
                "data": {
                    "community_id": community_id,
                    "user_id": user_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo unir a la comunidad error:: {str(e)}"
            )

    async def leave(self, community_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            user_id = request.state.payload["sub"]
            success = await self.communityservice.leave_community(db, user_id, community_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo dejar la comunidad, o no existe o no estas en ella"
                )
            return {
                "status": "success",
                "message": "Se abandono la comunidad con exito",
                "data": {
                    "community_id": community_id,
                    "user_id": user_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo abandonar la comunidad, error: {str(e)}"
            )
        
    async def add(self, community_id: int, user_id : int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_admin(request)
            success = await self.communityservice.join_community(db, user_id, community_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo agregar a la comunidad, no existe o ya esta agregado"
                )
            return {
                "status": "success",
                "message": "Unido exitosamente a la comunidad",
                "data": {
                    "community_id": community_id,
                    "user_id": user_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo unir a la comunidad error:: {str(e)}"
            )
        
    async def kick(self, community_id: int, user_id: int, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            await self._verify_admin(request)
            success = await self.communityservice.leave_community(db, user_id, community_id)
            if not success:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No se pudo dejar la comunidad, o no existe o el usuario no esta en ella"
                )
            return {
                "status": "success",
                "message": "Se saco el usuario de la comunidad con exito",
                "data": {
                    "community_id": community_id,
                    "user_id": user_id
                }
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo abandonar la comunidad, error: {str(e)}"
            )

    async def get_members(self, community_id: int, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            members = await self.communityservice.get_community_members(db, community_id)
            return {
                "status": "success",
                "message": "Miembros de la comunidad obtenidos con exito",
                "data": members
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener los miembros, error: {str(e)}"
            )
    
    async def totalmembers(self, db: AsyncSession = Depends(get_db_session)):
        try:
            total_members = await self.communityservice.get_total_members(db)
            return total_members        
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener el total de miembros, error: {str(e)}"
            )
    
    async def get_user_communities(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        try:
            # Get user ID from token
            user_id = request.state.payload["sub"]
            
            # Get communities the user is a member of (only IDs for efficiency)
            user_communities = await self.communityservice.get_user_communities(db, user_id)
            
            return {
                "status": "success",
                "message": "Comunidades del usuario obtenidas con éxito",
                "data": user_communities
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener las comunidades del usuario, error: {str(e)}"
            )
    
    async def get_user_communities_details(self, request: Request, db: AsyncSession = Depends(get_db_session)) -> Dict[str, Any]:
        """
        Obtiene detalles completos de las comunidades a las que pertenece el usuario autenticado
        """
        try:
            # Get user ID from token
            user_id = request.state.payload["sub"]
            
            # Get detailed community information for this user
            user_communities = await self.communityservice.get_user_communities_details(db, user_id)
            
            return {
                "status": "success",
                "message": "Detalles de comunidades del usuario obtenidos con éxito",
                "data": user_communities
            }
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"No se pudo obtener los detalles de las comunidades del usuario, error: {str(e)}"
            )
