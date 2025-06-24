from sqlalchemy import select, update, join, func, desc, case, and_, or_
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import datetime, timezone, date, timedelta
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

    async def get_all_transactions_with_details(self, db: AsyncSession) -> List[Dict]:
        """
        Obtiene todas las transacciones con detalles adicionales como nombres de usuarios y comunidades
        """
        # Get all transactions
        transaction_query = select(TransactionsDAO).order_by(desc(TransactionsDAO.created_at))
        result = await db.execute(transaction_query)
        transactions = result.scalars().all()
        
        # Create combined list of user IDs (origins) and destination IDs that are users
        user_ids = set()
        community_ids = set()
        
        for transaction in transactions:
            # Add origin to user IDs
            try:
                user_ids.add(int(transaction.origin))
            except (ValueError, TypeError):
                pass
            
            # Check destination type and add to appropriate set
            dest = transaction.destination
            dest_type = self.get_destination_type(dest)
            clean_dest = self.get_clean_destination(dest)
            
            try:
                if dest_type == 'community':
                    community_ids.add(int(clean_dest))
                elif dest_type == 'user':
                    user_ids.add(int(clean_dest))
                else:
                    # For pending transactions, try to determine type based on status
                    if transaction.status == 2:  # Community pending
                        community_ids.add(int(clean_dest))
                    elif transaction.status == 3:  # User pending
                        user_ids.add(int(clean_dest))
            except (ValueError, TypeError):
                pass
        
        # Fetch all users in one query
        users_dict = {}
        if user_ids:
            user_query = select(UsersDAO).where(UsersDAO.document_id.in_(list(user_ids)))
            user_result = await db.execute(user_query)
            users = user_result.scalars().all()
            users_dict = {user.document_id: user.username for user in users}
        
        # Fetch all communities in one query
        communities_dict = {}
        if community_ids:
            community_query = select(CommunitiesDAO).where(CommunitiesDAO.id.in_(list(community_ids)))
            community_result = await db.execute(community_query)
            communities = community_result.scalars().all()
            communities_dict = {community.id: community.name for community in communities}
        
        # Build the final result with all details
        transaction_list = []
        for transaction in transactions:
            # Determine destination name and type
            dest = transaction.destination
            dest_type = self.get_destination_type(dest)
            clean_dest = self.get_clean_destination(dest)
            
            destination_name = "Desconocido"
            if dest_type == 'community':
                try:
                    destination_name = communities_dict.get(int(clean_dest), f"Comunidad {clean_dest}")
                except (ValueError, TypeError):
                    pass
            elif dest_type == 'user':
                try:
                    destination_name = users_dict.get(int(clean_dest), f"Usuario {clean_dest}")
                except (ValueError, TypeError):
                    pass
            else:
                # For pending transactions
                if transaction.status == 2:
                    try:
                        destination_name = communities_dict.get(int(clean_dest), f"Comunidad {clean_dest}")
                    except (ValueError, TypeError):
                        pass
                elif transaction.status == 3:
                    try:
                        destination_name = users_dict.get(int(clean_dest), f"Usuario {clean_dest}")
                    except (ValueError, TypeError):
                        pass
            
            # Get origin user name
            origin_name = "Sistema"
            try:
                origin_name = users_dict.get(int(transaction.origin), f"Usuario {transaction.origin}")
            except (ValueError, TypeError):
                pass
            
            # Format status for display
            status_text = "Desconocido"
            if transaction.status == 0:
                status_text = "Aprobada"
            elif transaction.status == 1:
                status_text = "Rechazada"
            elif transaction.status == 2:
                status_text = "Pendiente (Comunidad)"
            elif transaction.status == 3:
                status_text = "Pendiente (Usuario)"
            
            transaction_list.append({
                "id": transaction.id,
                "date": transaction.date,
                "points": transaction.points,
                "origin": transaction.origin,
                "origin_name": origin_name,
                "destination": dest,
                "destination_clean": clean_dest,
                "destination_name": destination_name,
                "destination_type": dest_type,
                "status": transaction.status,
                "status_text": status_text,
                "details": transaction.details,
                "created_at": transaction.created_at
            })
        
        return transaction_list

    async def get_transaction_statistics(self, db: AsyncSession) -> Dict:
        """
        Obtiene estadísticas de las transacciones
        """
        # Total transactions by status
        status_counts_query = select(
            TransactionsDAO.status,
            func.count(TransactionsDAO.id).label('count')
        ).group_by(TransactionsDAO.status)
        
        status_result = await db.execute(status_counts_query)
        status_counts = {status: count for status, count in status_result}
        
        # Total points transacted
        points_query = select(func.sum(TransactionsDAO.points))
        points_result = await db.execute(points_query)
        total_points = points_result.scalar_one() or 0
        
        # Transactions in the last 7 days
        seven_days_ago = datetime.now(timezone.utc).date() - timedelta(days=7)
        recent_query = select(func.count(TransactionsDAO.id)).where(
            TransactionsDAO.created_at >= seven_days_ago
        )
        recent_result = await db.execute(recent_query)
        recent_count = recent_result.scalar_one() or 0
        
        # Most active communities (destinations)
        community_query = select(
            TransactionsDAO.destination,
            func.count(TransactionsDAO.id).label('count')
        ).where(
            or_(
                TransactionsDAO.destination.endswith('C'),
                TransactionsDAO.status == 2
            )
        ).group_by(
            TransactionsDAO.destination
        ).order_by(
            desc('count')
        ).limit(5)
        
        community_result = await db.execute(community_query)
        top_communities = []
        
        for dest, count in community_result:
            clean_dest = self.get_clean_destination(dest)
            try:
                community_name_result = await db.execute(
                    select(CommunitiesDAO.name).where(CommunitiesDAO.id == int(clean_dest))
                )
                name = community_name_result.scalar_one_or_none() or f"Comunidad {clean_dest}"
                top_communities.append({
                    "destination": dest,
                    "clean_id": clean_dest,
                    "name": name,
                    "count": count
                })
            except (ValueError, TypeError):
                pass
        
        return {
            "total_transactions": sum(status_counts.values()),
            "approved_transactions": status_counts.get(0, 0),
            "rejected_transactions": status_counts.get(1, 0),
            "pending_community": status_counts.get(2, 0),
            "pending_user": status_counts.get(3, 0),
            "total_points": total_points,
            "recent_transactions": recent_count,
            "top_communities": top_communities
        }

    async def get_user_transactions(self, db: AsyncSession, user_id: str) -> List[Dict]:
        """
        Obtiene todas las transacciones donde el usuario es origen o destino
        """
        try:
            # Convert user_id to int
            user_id_int = int(user_id)
            
            # Query for transactions where the user is origin or destination
            result = await db.execute(
                select(TransactionsDAO).where(
                    or_(
                        TransactionsDAO.origin == user_id_int,
                        # For destinations, we need to check the clean version without suffix
                        func.substring(TransactionsDAO.destination, 1, func.length(TransactionsDAO.destination) - 1) == str(user_id_int)
                    )
                ).order_by(desc(TransactionsDAO.created_at))
            )
            transactions = result.scalars().all()
            
            # Collect community and user IDs that need to be looked up
            community_ids = set()
            user_ids = set()
            
            for transaction in transactions:
                # Add origin to user IDs
                try:
                    user_ids.add(int(transaction.origin))
                except (ValueError, TypeError):
                    pass
                
                # For status 2 (pending community approval), the destination is a community ID
                if transaction.status == 2:
                    try:
                        community_ids.add(int(transaction.destination))
                    except (ValueError, TypeError):
                        pass
                    continue
                
                # For status 3 (pending user approval), the destination is a user ID
                if transaction.status == 3:
                    try:
                        user_ids.add(int(transaction.destination))
                    except (ValueError, TypeError):
                        pass
                    continue
                
                # For completed transactions (status 0 or 1), check the suffix
                if transaction.status in [0, 1]:
                    dest = transaction.destination
                    if dest.endswith('C'):
                        # It's a community transaction
                        try:
                            community_ids.add(int(dest[:-1]))
                        except (ValueError, TypeError):
                            pass
                    elif dest.endswith('U'):
                        # It's a user transaction
                        try:
                            user_ids.add(int(dest[:-1]))
                        except (ValueError, TypeError):
                            pass
            
            # Fetch all users in one query
            users_dict = {}
            if user_ids:
                user_query = select(UsersDAO).where(UsersDAO.document_id.in_(list(user_ids)))
                user_result = await db.execute(user_query)
                users = user_result.scalars().all()
                users_dict = {user.document_id: user.username for user in users}
            
            # Fetch all communities in one query
            communities_dict = {}
            if community_ids:
                community_query = select(CommunitiesDAO).where(CommunitiesDAO.id.in_(list(community_ids)))
                community_result = await db.execute(community_query)
                communities = community_result.scalars().all()
                communities_dict = {community.id: community.name for community in communities}
            
            # Process transactions with details
            user_transactions = []
            for transaction in transactions:
                # Determine if user is origin
                is_origin = transaction.origin == user_id_int
                
                # Determine destination type and name based on transaction status and suffix
                dest_type = "unknown"
                dest_name = "Desconocido"
                dest_clean = transaction.destination
                
                if transaction.status == 2:
                    # Pending community approval - destination is a community
                    dest_type = "community"
                    try:
                        dest_id = int(transaction.destination)
                        dest_clean = str(dest_id)
                        dest_name = communities_dict.get(dest_id, f"Comunidad {dest_id}")
                    except (ValueError, TypeError):
                        dest_name = f"Comunidad {transaction.destination}"
                
                elif transaction.status == 3:
                    # Pending user approval - destination is a user
                    dest_type = "user"
                    try:
                        dest_id = int(transaction.destination)
                        dest_clean = str(dest_id)
                        dest_name = users_dict.get(dest_id, f"Usuario {dest_id}")
                    except (ValueError, TypeError):
                        dest_name = f"Usuario {transaction.destination}"
                
                elif transaction.status in [0, 1]:
                    # Completed transaction - check suffix
                    dest = transaction.destination
                    if dest.endswith('C'):
                        # Community transaction
                        dest_type = "community"
                        try:
                            dest_id = int(dest[:-1])
                            dest_clean = str(dest_id)
                            dest_name = communities_dict.get(dest_id, f"Comunidad {dest_id}")
                        except (ValueError, TypeError):
                            dest_clean = dest[:-1]
                            dest_name = f"Comunidad {dest_clean}"
                    
                    elif dest.endswith('U'):
                        # User transaction
                        dest_type = "user"
                        try:
                            dest_id = int(dest[:-1])
                            dest_clean = str(dest_id)
                            dest_name = users_dict.get(dest_id, f"Usuario {dest_id}")
                        except (ValueError, TypeError):
                            dest_clean = dest[:-1]
                            dest_name = f"Usuario {dest_clean}"
                
                # Get origin name (always a user)
                origin_name = "Sistema"
                try:
                    origin_id = int(transaction.origin)
                    origin_name = users_dict.get(origin_id, f"Usuario {origin_id}")
                except (ValueError, TypeError):
                    pass
                
                # Format status for display
                status_text = "Desconocido"
                if transaction.status == 0:
                    status_text = "Aprobada"
                elif transaction.status == 1:
                    status_text = "Rechazada"
                elif transaction.status == 2:
                    status_text = "Pendiente (Comunidad)"
                elif transaction.status == 3:
                    status_text = "Pendiente (Usuario)"
                
                trans_info = {
                    "id": transaction.id,
                    "date": transaction.date,
                    "created_at": transaction.created_at,
                    "points": transaction.points,
                    "origin": transaction.origin,
                    "origin_name": origin_name,
                    "destination": transaction.destination,
                    "destination_clean": dest_clean,
                    "destination_name": dest_name,
                    "destination_type": dest_type,
                    "status": transaction.status,
                    "status_text": status_text,
                    "details": transaction.details,
                    "is_origin": is_origin
                }
                
                user_transactions.append(trans_info)
            
            return user_transactions
        except Exception as e:
            # Log the error
            print(f"Error getting user transactions: {str(e)}")
            return []
    
    async def get_user_destination_transactions(self, db: AsyncSession, user_id: str) -> List[Dict]:
        """
        Obtiene todas las transacciones pendientes (estado 3) donde el usuario actual es el destinatario
        """
        try:
            # Convert user_id to integer for comparison
            user_id_int = int(user_id)
            
            # Select transactions with status 3 (WaitingUserApproval) where current user is destination
            result = await db.execute(
                select(TransactionsDAO).where(
                    (TransactionsDAO.status == 3) & 
                    (TransactionsDAO.destination == str(user_id_int))
                )
            )
            transactions = result.scalars().all()
            
            # Extract origin IDs safely
            origin_ids = []
            for transaction in transactions:
                try:
                    if transaction.origin:
                        origin_ids.append(int(transaction.origin))
                except (ValueError, TypeError):
                    # Skip if conversion fails
                    pass
            
            # Fetch user data in one query if we have any origin IDs
            users_dict = {}
            if origin_ids:
                user_query = select(UsersDAO).where(UsersDAO.document_id.in_(origin_ids))
                user_result = await db.execute(user_query)
                users = user_result.scalars().all()
                users_dict = {user.document_id: user.username for user in users}
            
            # Format the results
            transaction_list = []
            for transaction in transactions:
                # Get origin name
                origin_name = "Sistema"
                try:
                    origin_id = int(transaction.origin)
                    origin_name = users_dict.get(origin_id, f"Usuario {origin_id}")
                except (ValueError, TypeError):
                    pass
                
                transaction_list.append({
                    "id": transaction.id,
                    "date": transaction.date,
                    "points": transaction.points,
                    "origin": transaction.origin,
                    "origin_name": origin_name,
                    "destination": transaction.destination,
                    "status": transaction.status,
                    "details": transaction.details,
                    "created_at": transaction.created_at
                })
            
            return transaction_list
            
        except Exception as e:
            # Log the error and return empty list
            print(f"Error getting user destination transactions: {str(e)}")
            return []

