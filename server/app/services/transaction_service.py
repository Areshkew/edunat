from sqlalchemy import select, update, join
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, date
from typing import List, Optional, Dict, Any

from app.repositories.transactions_dao import TransactionsDAO
from app.repositories.users_dao import UsersDAO
from app.repositories.communities_dao import CommunitiesDAO
from app.utils.class_utils import Injectable

class TransactionService(Injectable):
    async def create_transaction(self, db: AsyncSession, transaction_data: dict) -> TransactionsDAO:
        """
        Crea una nueva transacción en la base de datos.
        """
        new_transaction = TransactionsDAO(
            date=datetime.now(timezone.utc).date(),
            points=transaction_data["points"],
            origin=transaction_data["origin"],
            destination=transaction_data["destination"],
            status=transaction_data["status"],  # 0-approved 1-rejected 2-WaitingAdminApproval 3-WaitingUserApproval
            details=transaction_data["details"],
            created_at=datetime.now(timezone.utc).date()
        )
        
        db.add(new_transaction)
        await db.commit()
        await db.refresh(new_transaction)
        return new_transaction

    async def get_transaction_by_id(self, db: AsyncSession, transaction_id: int) -> Optional[TransactionsDAO]:
        """
        Obtiene una transacción por su ID
        """
        result = await db.execute(
            select(TransactionsDAO).where(TransactionsDAO.id == transaction_id)
        )
        return result.scalar_one_or_none()

    async def update_transaction_status(self, db: AsyncSession, transaction_id: int, status: int) -> bool:
        """
        Actualiza el estado de una transacción (0-approved 1-rejected)
        """
        transaction = await self.get_transaction_by_id(db, transaction_id)
        if not transaction:
            return False
        
        # Agregar sufijo al destino según el tipo de transacción
        destination_with_suffix = transaction.destination
        if status in [0, 1]:  # Si se aprueba o rechaza
            if transaction.status == 2:  # Si estaba en espera de admin (comunidad)
                destination_with_suffix = f"{transaction.destination}C"
            elif transaction.status == 3:  # Si estaba en espera de usuario
                destination_with_suffix = f"{transaction.destination}U"
        
        result = await db.execute(
            update(TransactionsDAO)
            .where(TransactionsDAO.id == transaction_id)
            .values(status=status, destination=destination_with_suffix)
        )
        await db.commit()
        return result.rowcount > 0

    async def get_pending_transactions(self, db: AsyncSession, status: int) -> List[TransactionsDAO]:
        """
        Obtiene todas las transacciones pendientes por estado
        """
        result = await db.execute(
            select(TransactionsDAO).where(TransactionsDAO.status == status)
        )
        return result.scalars().all()
        
    def get_destination_type(self, destination: str) -> str:
        """
        Determina el tipo de destino basado en el sufijo
        Returns:
            - 'community': Si termina en C
            - 'user': Si termina en U
            - 'unknown': Si no tiene sufijo (transacción pendiente)
        """
        if destination.endswith('C'):
            return 'community'
        elif destination.endswith('U'):
            return 'user'
        return 'unknown'
        
    def get_clean_destination(self, destination: str) -> str:
        """
        Elimina el sufijo del destino para obtener el ID real
        """
        if destination.endswith(('C', 'U')):
            return destination[:-1]
        return destination

    async def get_user_pending_transactions(self, db: AsyncSession, user_id: str, status: int) -> List[TransactionsDAO]:
        """
        Obtiene todas las transacciones pendientes de un usuario específico por estado
        """
        try:
            # Convert user_id to integer since the column is defined as Integer in the DAO
            user_id_int = int(user_id)
            
            result = await db.execute(
                select(TransactionsDAO.id, TransactionsDAO.destination).where(
                    (TransactionsDAO.status == status) & 
                    (TransactionsDAO.origin == user_id_int)
                )
            )
            return result.all()  # Return only the needed columns
        except ValueError:
            # Handle the case where user_id can't be converted to int
            return []
    
    async def get_pending_transactions_with_details(self, db: AsyncSession, status: int) -> List[Dict]:
        """
        Obtiene todas las transacciones pendientes por estado con nombres de comunidad mediante JOIN
        """
        # First, get all pending transactions
        transaction_query = select(TransactionsDAO).where(TransactionsDAO.status == status)
        result = await db.execute(transaction_query)
        transactions = result.scalars().all()
        
        # Build a list of community IDs to fetch
        community_ids = []
        for transaction in transactions:
            # Assuming the destination is the community ID as string
            # For pending transactions (status 2), destination doesn't have a suffix yet
            try:
                community_id = int(transaction.destination)
                community_ids.append(community_id)
            except ValueError:
                # In case destination is not a valid integer
                continue
        
        # Fetch communities in a single query if we have any IDs
        communities_dict = {}
        if community_ids:
            community_query = select(CommunitiesDAO).where(CommunitiesDAO.id.in_(community_ids))
            community_result = await db.execute(community_query)
            communities = community_result.scalars().all()
            
            # Create a mapping of id -> name for quick lookup
            communities_dict = {str(community.id): community.name for community in communities}
        
        # Build the final result with community names
        transaction_list = []
        for transaction in transactions:
            # Get community name from our dictionary if available
            community_name = communities_dict.get(
                transaction.destination, 
                f"Comunidad {transaction.destination}"
            )
            
            transaction_list.append({
                "id": transaction.id,
                "date": transaction.date,
                "points": transaction.points,
                "origin": transaction.origin,
                "destination": transaction.destination,
                "destination_name": community_name,
                "status": transaction.status,
                "details": transaction.details,
                "created_at": transaction.created_at
            })
        
        return transaction_list
