#TODO: Add repositories
from app.repositories.users_dao import UsersDAO
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