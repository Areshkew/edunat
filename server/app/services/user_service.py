import random
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete, func, update
from sqlalchemy.sql import join
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date
import logging

from app.repositories.users_dao import UsersDAO
from app.repositories.securitycodes_dao import SecurityCodeDAO
from app.repositories.courses_dao import CoursesDAO
from app.repositories.courseenrollments_dao import CourseEnrollmentsDAO
from app.repositories.communities_dao import CommunitiesDAO
from app.repositories.usercommunities_dao import UserCommunitiesDAO
from app.repositories.chats_dao import ChatsDAO
from app.repositories.communitychats_dao import CommunityChatsDAO
from app.repositories.transactions_dao import TransactionsDAO
from app.repositories.notifications_dao import NotificationsDAO
from app.utils.class_utils import Injectable
from app.utils.db_data import admin_data
from app.utils.db_utils import hash_password


class UserService(Injectable):
    def __init__(self):
        self.logger = logging.getLogger("uvicorn")

    @staticmethod
    async def initialize_db(db: AsyncSession):
        """
            Inicializar datos primordiales para el funcionamiento del software.
        """    
        # Verificar si el usuario Admin ya existe
        stmt = select(UsersDAO).where(UsersDAO.document_id == admin_data["document_id"])
        
        result = await db.execute(stmt)
        existing_user = result.scalars().first()

        if not existing_user:
            # Crear Usuario
            db_user = UsersDAO(**admin_data)
            db.add(db_user)
            await db.commit()
            await db.refresh(db_user)


    async def get_user_document_role(self, db: AsyncSession, email: str): 
        """
            Obtener el documento y rol de usuario a través de su email.
        """
        stmt = (
            select(UsersDAO.document_id, UsersDAO.role, UsersDAO.password)
            .where(UsersDAO.email == email)
        )
        result = await db.execute(stmt)
        user = result.fetchone()
        
        return {"document_id": user[0], "role": user[1], "password": user[2]} if user else None
    

    async def account_exists(self, db: AsyncSession, username: str, email: str, document_id: str) -> bool:
        """
            Verifica si existe una cuenta con el mismo nombre de usuario, correo electrónico o document_id.
        """
        stmt = select(
            UsersDAO.username,
            UsersDAO.email,
            UsersDAO.document_id
        ).where(
            (UsersDAO.username == username) | 
            (UsersDAO.email == email) | 
            (UsersDAO.document_id == document_id)
        )
        result = await db.execute(stmt)
        account = result.first()
        
        fields_taken = {
            key: getattr(account, key, None) == value for key, value in {
                "username": username,
                "email": email,
                "document_id": document_id
            }.items() if account and getattr(account, key, None) == value
        }

        return  {
            "exists": any(fields_taken.values()),
            "fields": fields_taken
        }
    

    async def create_account(self, db: AsyncSession, account_data: dict, role: int = 0):
        """
        Crea una nueva cuenta de usuario en la base de datos.
        """
        # Convertir la fecha de nacimiento desde el formato de cadena
        birth_date_conversion = datetime.strptime(account_data["birth_date"], "%Y-%m-%d").date()

        # Crear una nueva instancia de UsersDAO
        new_account = UsersDAO(
            document_id=account_data["document_id"],
            email=account_data["email"],
            username=account_data["username"],
            role=role,
            password=hash_password(account_data["password"]),
            name=account_data["name"],
            academic_level=account_data["academic_level"],
            phone_number=account_data["phone_number"],
            gender=account_data["gender"],
            photo=account_data["photo"],
            visibility=account_data["visibility"],
            needs=account_data["needs"],
            offers=account_data["offers"],
            webpage=account_data["webpage"],
            whatsapp=account_data["whatsapp"],
            birth_date=birth_date_conversion,
            birth_city=account_data["birth_city"],
            language=account_data["language"],
            residence_city=account_data["residence_city"],
            address=account_data["address"],
            about=account_data["about"],
            points=account_data["points"],
            created_at=datetime.now(timezone.utc),
            updated_at=None
        )
        
        try:
            db.add(new_account)
            await db.commit()
            await db.refresh(new_account)
            return True
        except IntegrityError:
            await db.rollback()
            return None
        

    async def generate_recovery_code(self) -> str:
        """
        Genera un código de recuperación de contraseña aleatorio de 8 caracteres alfanuméricos.

        """
        # Caracteres alfanuméricos que se utilizarán para generar el código
        characters = '0123456789'
        
        # Genera el código de recuperación aleatorio
        recovery_code = ''.join(random.choice(characters) for i in range(6))
        
        return recovery_code
    

    async def store_code(self, db: AsyncSession, email: str, code: str):
        """
        Crea una nueva instancia o actualiza el código de seguridad para el correo electrónico dado.
        """

        # Verificar si ya existe un registro para el correo electrónico dado
        existing_code = await db.execute(select(SecurityCodeDAO).filter(SecurityCodeDAO.user_email == email))
        existing_code = existing_code.scalars().first()

        if existing_code: #Si existe actualizar
            existing_code.code = code
            existing_code.date = datetime.now()
            await db.commit()
        else: #Si no existe crear uno nuevo
            new_code = SecurityCodeDAO(
                code=code,
                user_email=email,
                date=datetime.now()
            )
            try:
                db.add(new_code)
                await db.commit()
                return True
            except IntegrityError:
                await db.rollback()
                return False
            

    async def verify_code(self, db: AsyncSession, email: str, code: str) -> bool:
        """
        Compara si el correo tiene el codigo introducido asignado a el

        """
        stmt = select(SecurityCodeDAO).where( #Busqueda de correo y codigo especificados
            (SecurityCodeDAO.user_email == email) &
            (SecurityCodeDAO.code == code)
        )
        result = await db.execute(stmt)
        codigo_seguridad = result.scalars().first()
        
        if codigo_seguridad is None:
            return False

        current_datetime = datetime.now()
        time_difference = current_datetime - codigo_seguridad.date

        if time_difference.total_seconds() < 600:  # 10 minutos en segundos
            return True
        else:
            return False

    
    async def update_passwordm(self, db: AsyncSession, gmail: str, password: str) -> bool:
        """
        Actualiza la contraseña de algun email de un usuario

        """
        hashed_password = hash_password(password)

        # Buscar al usuario por su correo electrónico en la base de datos
        user = await db.execute(select(UsersDAO).filter(UsersDAO.email == gmail))
        user = user.scalars().first()
        if not user:
            return False

        # Actualizar la contraseña del usuario en la base de datos
        user.password = hashed_password
        await db.commit()
        return True
    
    async def update_password(self, db: AsyncSession, document_id: str, password: str) -> bool:
        """
        Actualiza la contraseña de algun id de un usuario

        """
        hashed_password = hash_password(password)

        # Buscar al usuario por su correo electrónico en la base de datos
        user = await db.execute(select(UsersDAO).filter(UsersDAO.document_id == document_id))
        user = user.scalars().first()
        if not user:
            return False

        # Actualizar la contraseña del usuario en la base de datos
        user.password = hashed_password
        await db.commit()
        return True
    
    async def get_user_data(self, db: AsyncSession, dni: str, user_fields: List[str]):
        """
        Obtiene los datos del usuario según el DNI y los campos especificados.
        """
        # Lista de campos a excluir 
        exclude_fields = ["password"]

        selected_columns = [getattr(UsersDAO, field) for field in user_fields if field not in exclude_fields]

        # Realizar la consulta en la base de datos
        user_query = select(*selected_columns).filter(UsersDAO.document_id == dni)
        user_results = await db.execute(user_query)
        user_row = user_results.fetchone()

        # Verificar si el usuario existe
        if user_row is None:
            raise ValueError(f"Usuario con document_id {dni} no encontrado")

        # Crear un diccionario con los resultados
        user_data = dict(zip(user_fields, user_row))
            
        return user_data

    async def get_users(self, db: AsyncSession):
        """
        Obtiene todos los usuarios de la base de datos con campos específicos.
        """
        stmt = select(
            UsersDAO.email,
            UsersDAO.username,
            UsersDAO.visibility,
            UsersDAO.role,
            UsersDAO.name,
            UsersDAO.points,
            UsersDAO.phone_number,
            UsersDAO.academic_level,
            UsersDAO.document_id
        ).order_by(UsersDAO.created_at.desc())
        result = await db.execute(stmt)
        users = result.all()
        
        return [
            {
                "email": user[0],
                "username": user[1],
                "visibility": user[2],
                "role": user[3],
                "name": user[4],
                "points": user[5],
                "phone_number": user[6],
                "academic_level": user[7],
                "document_id": user[8]
            }
            for user in users
        ]
    
    async def get_user(self, db: AsyncSession, document_id: str):
        """
        Obtiene todos los datos de un usuario de la base de datos por su document_id.
        """
        stmt = select(UsersDAO).where(UsersDAO.document_id == document_id)
        
        result = await db.execute(stmt)
        user = result.scalars().first()
        
        if user:
            return {
                "document_id": user.document_id,
                "email": user.email,
                "username": user.username,
                "role": user.role,
                "name": user.name,
                "academic_level": user.academic_level,
                "phone_number": user.phone_number,
                "gender": user.gender,
                "photo": user.photo,
                "visibility": user.visibility,
                "needs": user.needs,
                "offers": user.offers,
                "webpage": user.webpage,
                "whatsapp": user.whatsapp,
                "birth_date": user.birth_date,
                "birth_city": user.birth_city,
                "language": user.language,
                "residence_city": user.residence_city,
                "address": user.address,
                "about": user.about,
                "points": user.points,
                "created_at": user.created_at,
                "updated_at": user.updated_at
            }
        return None


    async def toggle_visibility(self, db: AsyncSession, document_id: str) -> bool:
        """
        Cambia la visibilidad de un usuario.
        """
        user = await db.execute(select(UsersDAO).filter(UsersDAO.document_id == document_id))
        user = user.scalars().first()
        if not user:
            return False

        user.visibility = not user.visibility
        await db.commit()
        return True

    async def toggle_role(self, db: AsyncSession, document_id: str) -> bool:
        """
        Cambia el rol de un usuario.
        """
        user = await db.execute(select(UsersDAO).filter(UsersDAO.document_id == document_id))
        user = user.scalars().first()
        if not user:
            return False

        user.role = 0 if user.role == 1 else 1
        await db.commit()
        return True

    async def delete_user(self, db: AsyncSession, document_id: str) -> bool:
        """
        Elimina un usuario de la base de datos.
        """
        user = await db.execute(select(UsersDAO).filter(UsersDAO.document_id == document_id))
        user = user.scalars().first()
        if not user:
            return False

        await db.execute(delete(UsersDAO).where(UsersDAO.document_id == document_id))
        await db.commit()
        return True
    
    async def update_account(self, db: AsyncSession, account_data: dict, dni: str = ""):
        """
            Actualiza una cuenta de usuario en la base de datos.
        """
        
        result = await db.execute(select(UsersDAO).filter(UsersDAO.document_id == dni))
        user = result.scalar()

        if "birth_date" in account_data:
            account_data["birth_date"] = datetime.strptime(account_data["birth_date"], "%Y-%m-%d").date()

        if "password" in account_data:
            account_data["password"] = hash_password(account_data["password"])
          
        try:    
            for key, value in account_data.items():
                if hasattr(user, key):
                    setattr(user, key, value)
            await db.commit()
            return True
        except IntegrityError:
            await db.rollback()
            return None
        
    async def add_points(self, db: AsyncSession, document_id: str, points: int) -> bool:
        """
        Agrega puntos a un usuario
        """
        user = await db.execute(select(UsersDAO).filter(UsersDAO.document_id == document_id))
        user = user.scalars().first()
        if not user:
            return False

        user.points = (user.points or 0) + points
        await db.commit()
        return True
    
    async def subtract_points(self, db: AsyncSession, document_id: str, points: int) -> bool:
        """
        Resta puntos a un usuario
        """
        user = await db.execute(select(UsersDAO).filter(UsersDAO.document_id == document_id))
        user = user.scalars().first()
        if not user:
            return False

        # Verificar que el usuario tenga suficientes puntos
        if user.points < points:
            return False

        user.points = user.points - points
        await db.commit()
        return True
    
    async def get_visible_users(self, db: AsyncSession):
        """
        Obtiene todos los usuarios con rol normal (0) y visibilidad visible (True)
        """
        try:
            stmt = select(
                UsersDAO.document_id,
                UsersDAO.username,
                UsersDAO.email,
                UsersDAO.points
            ).where(
                (UsersDAO.role == 0) & 
                (UsersDAO.visibility == 1)
            ).order_by(UsersDAO.username)
            
            result = await db.execute(stmt)
            users = result.all()
            
            return [
                {
                    "document_id": user[0],
                    "username": user[1],
                    "email": user[2],
                    "points": user[3]
                }
                for user in users
            ]
        except Exception as e:
            print(f"Error getting visible users: {str(e)}")
            return []

    async def get_public_profile(self, db: AsyncSession, document_id: str):
        """
        Obtiene los datos públicos de un usuario para mostrar en su perfil.
        Excluye información sensible como contraseña, dirección, puntos, etc.
        """
        try:
            stmt = select(
                UsersDAO.document_id,
                UsersDAO.email,
                UsersDAO.username,
                UsersDAO.name,
                UsersDAO.academic_level,
                UsersDAO.phone_number,
                UsersDAO.gender,
                UsersDAO.photo,
                UsersDAO.needs,
                UsersDAO.offers,
                UsersDAO.webpage,
                UsersDAO.whatsapp,
                UsersDAO.language,
                UsersDAO.about,
                UsersDAO.created_at,
                UsersDAO.birth_city,
                UsersDAO.residence_city
            ).where(
                (UsersDAO.document_id == document_id) & 
                (UsersDAO.visibility == 1)  # Solo usuarios visibles
            )
            
            result = await db.execute(stmt)
            user = result.first()
            
            if user:
                # Mapeo de campos de nivel académico
                academic_levels = {
                    0: "No especificado",
                    1: "Preescolar", 
                    2: "Primaria",
                    3: "Secundaria",
                    4: "Media/Bachillerato",
                    5: "Técnico",
                    6: "Tecnológico", 
                    7: "Universitario",
                    8: "Especialización",
                    9: "Maestría",
                    10: "Doctorado"
                }
                
                # Mapeo de género
                gender_map = {
                    0: "Masculino",
                    1: "Femenino", 
                    2: "Otro"
                }
                
                # Mapeo de idioma
                language_map = {
                    0: "Inglés",
                    1: "Español"
                }
                
                return {
                    "document_id": user[0],
                    "email": user[1],
                    "username": user[2],
                    "name": user[3],
                    "academic_level": academic_levels.get(user[4], "No especificado"),
                    "phone_number": user[5],
                    "gender": gender_map.get(user[6], "No especificado"),
                    "photo": user[7],
                    "needs": user[8],
                    "offers": user[9],
                    "webpage": user[10],
                    "whatsapp": user[11],
                    "language": language_map.get(user[12], "Español"),
                    "about": user[13],
                    "member_since": user[14],
                    "birth_city": user[15],
                    "residence_city": user[16]
                }
            return None
            
        except Exception as e:
            print(f"Error getting public profile: {str(e)}")
            return None
    
    async def get_admin_statistics(self, db: AsyncSession):
        """
        Obtiene estadísticas completas del sistema para administradores
        """
        try:
            # Calcular fecha del mes actual
            current_date = datetime.now()
            start_of_month = current_date.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            
            # === TOTALES GENERALES ===
            total_users = await db.execute(select(func.count()).select_from(UsersDAO))
            total_users = total_users.scalar() or 0
            
            total_courses = await db.execute(select(func.count()).select_from(CoursesDAO))
            total_courses = total_courses.scalar() or 0
            
            total_communities = await db.execute(select(func.count()).select_from(CommunitiesDAO))
            total_communities = total_communities.scalar() or 0
            
            total_transactions = await db.execute(select(func.count()).select_from(TransactionsDAO))
            total_transactions = total_transactions.scalar() or 0
            
            total_messages = await db.execute(select(func.count()).select_from(ChatsDAO))
            total_messages = total_messages.scalar() or 0
            
            total_community_msgs = await db.execute(select(func.count()).select_from(CommunityChatsDAO))
            total_community_msgs = total_community_msgs.scalar() or 0
            
            total_notifications = await db.execute(select(func.count()).select_from(NotificationsDAO))
            total_notifications = total_notifications.scalar() or 0
            
            total_points = await db.execute(select(func.sum(UsersDAO.points)).select_from(UsersDAO))
            total_points = total_points.scalar() or 0

            # === CRECIMIENTO MENSUAL ===
            new_users_month = await db.execute(
                select(func.count()).select_from(UsersDAO)
                .where(UsersDAO.created_at >= start_of_month)
            )
            new_users_month = new_users_month.scalar() or 0
            
            transactions_month = await db.execute(
                select(func.count()).select_from(TransactionsDAO)
                .where(TransactionsDAO.created_at >= start_of_month)
            )
            transactions_month = transactions_month.scalar() or 0
            
            messages_month = await db.execute(
                select(func.count()).select_from(ChatsDAO)
                .where(ChatsDAO.sent_at >= start_of_month)
            )
            messages_month = messages_month.scalar() or 0
            
            courses_month = await db.execute(
                select(func.count()).select_from(CoursesDAO)
                .where(CoursesDAO.created_at >= start_of_month)
            )
            courses_month = courses_month.scalar() or 0

            # === DISTRIBUCIONES ===
            users_by_role = await db.execute(
                select(UsersDAO.role, func.count()).group_by(UsersDAO.role)
            )
            users_by_role = {role: count for role, count in users_by_role.all()}
            
            users_by_academic = await db.execute(
                select(UsersDAO.academic_level, func.count())
                .where(UsersDAO.academic_level != None)
                .group_by(UsersDAO.academic_level)
            )
            users_by_academic = {level: count for level, count in users_by_academic.all()}
            
            courses_by_status = await db.execute(
                select(CoursesDAO.status, func.count()).group_by(CoursesDAO.status)
            )
            courses_by_status = {status: count for status, count in courses_by_status.all()}
            
            communities_by_visibility = await db.execute(
                select(CommunitiesDAO.visibility, func.count()).group_by(CommunitiesDAO.visibility)
            )
            communities_by_visibility = {vis: count for vis, count in communities_by_visibility.all()}
            
            notifications_by_type = await db.execute(
                select(NotificationsDAO.notification_type, func.count()).group_by(NotificationsDAO.notification_type)
            )
            notifications_by_type = {n_type: count for n_type, count in notifications_by_type.all()}

            # === DATOS RECIENTES ===
            recent_users = await db.execute(
                select(UsersDAO.document_id, UsersDAO.username, UsersDAO.email, UsersDAO.created_at)
                .order_by(UsersDAO.created_at.desc()).limit(5)
            )
            recent_users = [
                {
                    "id": user.document_id,
                    "username": user.username,
                    "email": user.email,
                    "created_at": user.created_at.isoformat() if user.created_at else None
                }
                for user in recent_users.all()
            ]
            
            # Comunidades recientes con más datos
            recent_communities_query = await db.execute(
                select(
                    CommunitiesDAO.id,
                    CommunitiesDAO.name,
                    CommunitiesDAO.about,
                    CommunitiesDAO.visibility,
                    CommunitiesDAO.created_at,
                    func.count(UserCommunitiesDAO.user_id).label('member_count')
                )
                .outerjoin(UserCommunitiesDAO, CommunitiesDAO.id == UserCommunitiesDAO.community_id)
                .group_by(CommunitiesDAO.id, CommunitiesDAO.name, CommunitiesDAO.about, 
                         CommunitiesDAO.visibility, CommunitiesDAO.created_at)
                .order_by(CommunitiesDAO.created_at.desc()).limit(5)
            )
            recent_communities = [
                {
                    "id": comm.id,
                    "name": comm.name,
                    "description": comm.about,
                    "visibility": "Visible" if comm.visibility else "Oculta",
                    "members": comm.member_count,
                    "created_at": comm.created_at.isoformat() if comm.created_at else None
                }
                for comm in recent_communities_query.all()
            ]
            
            recent_transactions = await db.execute(
                select(TransactionsDAO.id, TransactionsDAO.points, TransactionsDAO.created_at, TransactionsDAO.details)
                .order_by(TransactionsDAO.created_at.desc()).limit(5)
            )
            recent_transactions = [
                {
                    "id": txn.id,
                    "amount": txn.points,
                    "type": txn.details or "Transferencia",
                    "date": txn.created_at.isoformat() if txn.created_at else None
                }
                for txn in recent_transactions.all()
            ]

            # === RANKINGS ===
            top_users_by_points = await db.execute(
                select(UsersDAO.username, UsersDAO.points)
                .where(UsersDAO.points > 0)
                .order_by(UsersDAO.points.desc()).limit(10)
            )
            top_users_by_points = [
                {"username": user.username, "points": user.points}
                for user in top_users_by_points.all()
            ]
            
            top_message_senders = await db.execute(
                select(UsersDAO.username, func.count(ChatsDAO.id).label("message_count"))
                .join(ChatsDAO, ChatsDAO.sender_id == UsersDAO.document_id)
                .group_by(UsersDAO.username)
                .order_by(func.count(ChatsDAO.id).desc()).limit(5)
            )
            top_message_senders = [
                {"username": user.username, "messages": user.message_count}
                for user in top_message_senders.all()
            ]

            # === RESUMEN GENERAL (PROMEDIOS) ===
            # Promedio puntos por usuario
            avg_points_per_user = total_points / total_users if total_users > 0 else 0
            
            # Mensajes por usuario
            avg_messages_per_user = total_messages / total_users if total_users > 0 else 0
            
            # Cursos por instructor (usuarios con rol 1)
            total_instructors = users_by_role.get(1, 0)
            avg_courses_per_instructor = total_courses / total_instructors if total_instructors > 0 else 0
            
            # Usuarios por comunidad
            avg_users_per_community = total_users / total_communities if total_communities > 0 else 0
            
            # Mensajes por comunidad
            avg_messages_per_community = total_community_msgs / total_communities if total_communities > 0 else 0

            return {
                "totals": {
                    "users": total_users,
                    "courses": total_courses,
                    "communities": total_communities,
                    "transactions": total_transactions,
                    "messages": total_messages,
                    "communityMessages": total_community_msgs,
                    "notifications": total_notifications,
                    "points": total_points
                },
                "monthly": {
                    "newUsers": new_users_month,
                    "transactions": transactions_month,
                    "messages": messages_month,
                    "courses": courses_month
                },
                "distributions": {
                    "usersByRole": users_by_role,
                    "usersByAcademic": users_by_academic,
                    "coursesByStatus": courses_by_status,
                    "communitiesByVisibility": communities_by_visibility,
                    "notificationsByType": notifications_by_type
                },
                "recent": {
                    "users": recent_users,
                    "communities": recent_communities,
                    "transactions": recent_transactions
                },
                "rankings": {
                    "topUsersByPoints": top_users_by_points,
                    "topMessageSenders": top_message_senders
                },
                "averages": {
                    "pointsPerUser": round(avg_points_per_user, 2),
                    "messagesPerUser": round(avg_messages_per_user, 2),
                    "coursesPerInstructor": round(avg_courses_per_instructor, 2),
                    "usersPerCommunity": round(avg_users_per_community, 2),
                    "messagesPerCommunity": round(avg_messages_per_community, 2)
                }
            }
            
        except Exception as e:
            self.logger.error(f"Error getting admin statistics: {str(e)}")
            raise e
    
    async def get_monthly_growth_data(self, db: AsyncSession):
        """
        Obtiene datos de crecimiento mensual histórico del sistema
        Muestra el total acumulativo de cada categoría hasta cada mes
        """
        try:
            from datetime import datetime, timedelta
            from dateutil.relativedelta import relativedelta
            
            # Obtener los últimos 12 meses
            end_date = datetime.now()
            start_date = end_date - relativedelta(months=11)
            
            monthly_data = []
            
            for i in range(12):
                month_end = start_date + relativedelta(months=i+1)
                
                # Total de usuarios creados HASTA este mes (acumulativo)
                users_total = await db.execute(
                    select(func.count()).select_from(UsersDAO)
                    .where(UsersDAO.created_at < month_end.date())
                )
                users_total = users_total.scalar() or 0
                
                # Total de transacciones HASTA este mes (acumulativo)
                transactions_total = await db.execute(
                    select(func.count()).select_from(TransactionsDAO)
                    .where(TransactionsDAO.created_at < month_end.date())
                )
                transactions_total = transactions_total.scalar() or 0
                
                # Total de mensajes HASTA este mes (acumulativo)
                messages_total = await db.execute(
                    select(func.count()).select_from(ChatsDAO)
                    .where(ChatsDAO.sent_at < month_end)
                )
                messages_total = messages_total.scalar() or 0
                
                # Total de cursos HASTA este mes (acumulativo)
                courses_total = await db.execute(
                    select(func.count()).select_from(CoursesDAO)
                    .where(CoursesDAO.created_at < month_end.date())
                )
                courses_total = courses_total.scalar() or 0
                
                # Total de comunidades HASTA este mes (acumulativo)
                communities_total = await db.execute(
                    select(func.count()).select_from(CommunitiesDAO)
                    .where(CommunitiesDAO.created_at < month_end.date())
                )
                communities_total = communities_total.scalar() or 0
                
                month_display = month_end - relativedelta(months=1)
                
                monthly_data.append({
                    "month": month_display.strftime("%Y-%m"),
                    "monthName": month_display.strftime("%b %Y"),
                    "users": users_total,
                    "transactions": transactions_total,
                    "messages": messages_total,
                    "courses": courses_total,
                    "communities": communities_total
                })
            
            return monthly_data
            
        except Exception as e:
            self.logger.error(f"Error getting monthly growth data: {str(e)}")
            raise e
