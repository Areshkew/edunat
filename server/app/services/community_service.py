from sqlalchemy import exists, select, delete, update, and_, func
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone
from sqlalchemy.exc import IntegrityError
from typing import List, Optional, Dict, Any

from app.repositories.communities_dao import CommunitiesDAO
from app.repositories.usercommunities_dao import UserCommunitiesDAO
from app.utils.class_utils import Injectable
from app.models.community_model import CommunityMember
from app.repositories.users_dao import UsersDAO

class CommunityService(Injectable):
    async def community_exists(self, db: AsyncSession, community_name: str, exclude_id: Optional[int] = None) -> bool:
        """
        Verifica si existe una comunidad por nombre, excluyendo opcionalmente un ID
        """
        query = select(CommunitiesDAO).where(CommunitiesDAO.name == community_name)
    
        if exclude_id is not None:
            query = query.where(CommunitiesDAO.id != exclude_id)
        
        stmt = select(exists(query))
        result = await db.execute(stmt)
        return result.scalar()
    
    async def create_community(self, db: AsyncSession, community_data: dict) -> CommunitiesDAO:
        """
        Crea una nueva comunidad en la base de datos.
        """
        new_community = CommunitiesDAO(
            name=community_data["name"],
            about=community_data.get("about"),
            visibility=community_data.get("visibility", 1),
            created_at=datetime.now(timezone.utc),
            updated_at=None
        )
        
        db.add(new_community)
        await db.commit()
        await db.refresh(new_community)
        return new_community

    async def get_all_communities(self, db: AsyncSession) -> List[Dict[str, Any]]:
        """
        Obtiene todas las comunidades con el número de miembros de cada una
        """
        # Primero, obtenemos todas las comunidades
        result = await db.execute(select(CommunitiesDAO))
        communities = result.scalars().all()
        
        community_list = []
        # Para cada comunidad, obtenemos el número de miembros
        for community in communities:
            member_count = await db.execute(
                select(func.count())
                .select_from(UserCommunitiesDAO)
                .where(UserCommunitiesDAO.community_id == community.id)
            )
            
            # Creamos un diccionario con los datos de la comunidad y el número de miembros
            community_dict = {
                "id": community.id,
                "name": community.name,
                "about": community.about,
                "visibility": community.visibility,
                "created_at": community.created_at,
                "updated_at": community.updated_at,
                "members": member_count.scalar_one() or 0
            }
            community_list.append(community_dict)
        
        return community_list

    async def get_community_by_id(self, db: AsyncSession, community_id: int) -> Optional[CommunitiesDAO]:
        """
        Obtiene una comunidad por su ID
        """
        result = await db.execute(
            select(CommunitiesDAO).where(CommunitiesDAO.id == community_id)
        )
        return result.scalar_one_or_none()

    async def delete_community(self, db: AsyncSession, community_id: int) -> bool:
        """
        Elimina una comunidad por su ID
        """
        result = await db.execute(
            delete(CommunitiesDAO).where(CommunitiesDAO.id == community_id)
        )
        await db.commit()
        return result.rowcount > 0

    async def update_community(self, db: AsyncSession, community_id: int, update_data: dict) -> bool:
        """
        Actualiza una comunidad
        """
        update_data["updated_at"] = datetime.now(timezone.utc)
        result = await db.execute(
            update(CommunitiesDAO)
            .where(CommunitiesDAO.id == community_id)
            .values(**update_data)
        )
        await db.commit()
        return result.rowcount > 0

    async def join_community(self, db: AsyncSession, user_id: int, community_id: int) -> bool:
        """
        Une un usuario a una comunidad
        """
        # Primero verificamos si el usuario ya es miembro
        existing_membership = await db.execute(
            select(UserCommunitiesDAO).where(
                UserCommunitiesDAO.user_id == user_id,
                UserCommunitiesDAO.community_id == community_id
            )
        )
        
        if existing_membership.scalar_one_or_none() is not None:
            return False  # Ya es miembro
        
        try:
            membership = UserCommunitiesDAO(
                user_id=user_id,
                community_id=community_id,
            )
            db.add(membership)
            await db.commit()
            return True
        except IntegrityError:
            await db.rollback()
            return False

    async def leave_community(self, db: AsyncSession, user_id: int, community_id: int) -> bool:
        """
        Elimina a un usuario de una comunidad
        """
        result = await db.execute(
            delete(UserCommunitiesDAO)
            .where(and_(
                UserCommunitiesDAO.user_id == user_id,
                UserCommunitiesDAO.community_id == community_id
            ))
        )
        await db.commit()
        return result.rowcount > 0

    async def get_community_members(self, db: AsyncSession, community_id: int) -> List[CommunityMember]:
        """
        Obtiene todos los miembros de una comunidad, incluyendo la visibilidad del usuario
        """
        result = await db.execute(
            select(UserCommunitiesDAO, UsersDAO)
            .where(UserCommunitiesDAO.community_id == community_id)
            .join(UsersDAO, UserCommunitiesDAO.user_id == UsersDAO.document_id)
        )
        
        members = []
        for user_community, user in result.all():
            members.append(
                CommunityMember(
                    user_id=user_community.user_id,
                    community_id=user_community.community_id,
                    username=user.username,
                    visibility=user.visibility,
                )
            )
        return members

    async def get_total_members(self, db: AsyncSession):
        """
        Obtiene el número total de miembros en todas las comunidades
        """
        result = await db.execute(
            select(func.count()).select_from(UserCommunitiesDAO)
        )
        return result.scalar_one() or 0

    async def get_user_communities(self, db: AsyncSession, user_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene las comunidades a las que pertenece un usuario
        """
        try:
            # Convert user_id to integer since it's stored as integer in the database
            user_id_int = int(user_id)
            
            # Query to get only community IDs for this user from user_communities join table
            result = await db.execute(
                select(UserCommunitiesDAO.community_id)
                .where(UserCommunitiesDAO.user_id == user_id_int)
            )
            
            community_ids = [row[0] for row in result.all()]
            
            # Return just the community IDs for efficient frontend checking
            return [{"id": community_id} for community_id in community_ids]
        except ValueError:
            # Handle the case where user_id can't be converted to int
            return []
        except Exception as e:
            # Log the error for debugging
            print(f"Error in get_user_communities: {e}")
            return []

    async def get_user_communities_details(self, db: AsyncSession, user_id: str) -> List[Dict[str, Any]]:
        """
        Obtiene detalles completos de las comunidades a las que pertenece un usuario
        Cuenta solo miembros con visibilidad > 0
        """
        try:
            # Convert user_id to integer since it's stored as integer in the database
            user_id_int = int(user_id)
            
            # Query to get community IDs for this user from user_communities join table
            community_id_result = await db.execute(
                select(UserCommunitiesDAO.community_id)
                .where(UserCommunitiesDAO.user_id == user_id_int)
            )
            
            community_ids = [row[0] for row in community_id_result.all()]
            
            if not community_ids:
                return []
            
            # Query to get full community details for these IDs
            community_result = await db.execute(
                select(CommunitiesDAO)
                .where(CommunitiesDAO.id.in_(community_ids))
            )
            
            communities = community_result.scalars().all()
            
            community_details = []
            # For each community, get the number of visible members (visibility > 0) and format the data
            for community in communities:
                # Modified query to only count members with visibility > 0
                member_count = await db.execute(
                    select(func.count())
                    .select_from(UserCommunitiesDAO)
                    .join(UsersDAO, UserCommunitiesDAO.user_id == UsersDAO.document_id)
                    .where(and_(
                        UserCommunitiesDAO.community_id == community.id,
                        UsersDAO.visibility > 0
                    ))
                )
                
                community_dict = {
                    "id": community.id,
                    "name": community.name,
                    "about": community.about,
                    "visibility": community.visibility,
                    "created_at": community.created_at,
                    "updated_at": community.updated_at,
                    "members": member_count.scalar_one() or 0
                }
                community_details.append(community_dict)
            
            return community_details
        except ValueError:
            # Handle the case where user_id can't be converted to int
            return []
        except Exception as e:
            # Log the error for debugging
            print(f"Error in get_user_communities_details: {e}")
            return []
