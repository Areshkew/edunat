#TODO: Add repositories
import random
from app.repositories.users_dao import UsersDAO
from app.repositories.securitycodes_dao import SecurityCodeDAO
from app.utils.class_utils import Injectable
from app.utils.db_data import admin_data
from app.utils.db_utils import hash_password
from datetime import datetime, timedelta, timezone
from sqlalchemy import select, delete, func, update
from sqlalchemy.sql import join
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from typing import List
from datetime import date
import logging


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

    
    async def update_password(self, db: AsyncSession, gmail: str, password: str) -> bool:
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