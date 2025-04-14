from fastapi import APIRouter, HTTPException, status, Depends, Request
from sqlalchemy.orm import Session

#Modelos
from app.models.user_model import *

#Servicios
from app.services.user_service import UserService
from app.services.email_service import EmailService

#Db utils
from app.utils.auth import create_token
from app.utils.class_utils import Injectable, inject
from app.utils.db_utils import get_db_session, verify_password

@inject(UserService, EmailService)
class UserController(Injectable):
    def __init__(self):
        self.route = APIRouter(prefix='/user')
        # Ingreso de usuario
        self.route.add_api_route("/login", self.login, methods=["POST"])
        self.route.add_api_route("/signup", self.signup, methods=["POST"])
        # Recuperación de contraseña
        self.route.add_api_route("/passwordrecover", self.passwordrecover, methods=["POST"])
        self.route.add_api_route("/codeverification", self.codeverification, methods=["POST"])
        self.route.add_api_route("/newpassword", self.newpassword, methods=["POST"])
        #Funciones para usuario
        self.route.add_api_route("/userdata", self.getuserdata, methods=["POST"])
        self.route.add_api_route("/users", self.getusers, methods=["GET"])
        self.route.add_api_route("/{document_id}", self.getuser, methods=["GET"])
        self.route.add_api_route("/editaccount", self.editaccount, methods=["POST"])
        #Funciones para admin
        self.route.add_api_route("/togglev/{document_id}", self.togglev, methods=["POST"])
        self.route.add_api_route("/toggler/{document_id}", self.toggler, methods=["POST"])
        self.route.add_api_route("/delete/{document_id}", self.delete, methods=["POST"])


    # Ingreso de usuario
    async def login(self, user: UserLogin, db: Session = Depends(get_db_session)):
        data = user.model_dump()
        user_db = await self.userservice.get_user_document_role(db, data["email"])

        if user_db:
            password_verification = verify_password(data["password"], user_db["password"])
            if password_verification:
                token = create_token({
                    "sub": user_db["document_id"],
                    "role": user_db["role"]
                })
                return {"detail": "Se inició sesión correctamente.", "role": user_db["role"], "token": token}
        
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="El email o contraseña no son válidos.")
    
    async def signup(self, user: User, db: Session = Depends(get_db_session)):
        data = user.model_dump()

        user_db = await self.userservice.account_exists(db, data["username"], data["email"], data["document_id"])

        if not user_db["exists"]:
            await self.userservice.create_account(db, data)
            
            token = create_token({
                "sub": data["document_id"],
                "role": 0
            })
            return  {"detail": "Se registró la cuenta correctamente.", "role": "usuario", "token": token}

        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail=f"Ya existe una cuenta con {' '.join(user_db['fields'].keys() )}, verifica los campos seleccionados.")
    

    # Recuperación de contraseña
    async def passwordrecover(self, user: UserRecovery, db: Session = Depends(get_db_session)):
        data = user.model_dump()
        user_db = await self.userservice.account_exists(db, None, data["email"], None)

        if user_db["exists"]:
            codigo = await self.userservice.generate_recovery_code()
            await self.userservice.store_code(db, data["email"], codigo) 
            self.emailservice.send_email(
                            recipient=data["email"],
                            subject="[Edunat] - Codigo de recuperacion de contraseña",
                            template_path='app/templates/password_recovery.html',
                            html=True,
                            template_data={'code': codigo, 'support_email': 'edunat.contact@gmail.com'}
                        )
            
            return {"detail": "Se envio el correo con exito.", "Success": "True"}
        
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="El correo electrónico no se encuentra en el sistema.") 
    

    async def codeverification(self, user: UserCode, db: Session = Depends(get_db_session)):
        data = user.model_dump()
        success = await self.userservice.verify_code(db, data["email"], data["code"])

        if success:
            return {"detail": "El codigo ingresado se valido con el servidor.", "Success": True}
        
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="El codigo es invalido")
            

    async def newpassword(self, user: UserNewPassword, db: Session = Depends(get_db_session)):
        data = user.model_dump()

        if data["password"] != data["repeated_password"]:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Las contraseñas ingresadas no coinciden.")

        success = await self.userservice.update_password(db, data["email"], data["password"])

        if success:
            return {"detail": "La contraseña se cambio con exito.", "Success": True}
        

    #Funciones para get usuario
    async def getuserdata(self, user_fields: List[str], request: Request, db: Session = Depends(get_db_session)):
        data = request.state.payload["sub"]

        if "role" not in request.state.payload:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No se pudo acceder a la petición.")
    
        if request.state.payload["role"] == "guest":
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No se pudo acceder a la petición.")

        user_data = await self.userservice.get_user_data(db, data, user_fields)

        return user_data
    
    async def getusers(self, request: Request, db: Session = Depends(get_db_session)):
        if request.state.payload["role"] != 1:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No se pudo acceder a la petición.")

        users = await self.userservice.get_users(db)

        return users
    
    async def getuser(self, document_id: str, request: Request, db: Session = Depends(get_db_session)):
        try:
            document_id = int(document_id)  # Convert to integer
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El ID del documento debe ser un número.")
        
        data = request.state.payload["sub"]

        if request.state.payload["role"] != 1:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="No se pudo acceder a la petición.")
        
        user = await self.userservice.get_user(db, document_id)

        return user


    #Funciones para admin
    async def togglev(self, document_id: str, request: Request, db: Session = Depends(get_db_session)):
        try:
            document_id = int(document_id)  # Convert to integer
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El ID del documento debe ser un número.")

        if request.state.payload["role"] != 1:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para realizar esta acción.")
        
        success = await self.userservice.toggle_visibility(db, document_id)
        if success:
            return {"detail": "La visibilidad del usuario se actualizó correctamente."}
        
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    async def toggler(self, document_id: str, request: Request, db: Session = Depends(get_db_session)):
        try:
            document_id = int(document_id)  # Convert to integer
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El ID del documento debe ser un número.")

        if request.state.payload["role"] != 1:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para realizar esta acción.")
        
        success = await self.userservice.toggle_role(db, document_id)
        if success:
            return {"detail": "El rol del usuario se actualizó correctamente."}
        
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")

    async def delete(self, document_id: str, request: Request, db: Session = Depends(get_db_session)):
        try:
            document_id = int(document_id)  # Convert to integer
        except ValueError:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="El ID del documento debe ser un número.")

        if request.state.payload["role"] != 1:
            raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="No tienes permisos para realizar esta acción.")
        
        success = await self.userservice.delete_user(db, document_id)
        if success:
            return {"detail": "El usuario fue eliminado correctamente."}
        
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado.")
    
    async def editaccount(self, user: UserUpdate, request: Request, db: Session = Depends(get_db_session)):
        data = user.model_dump()
        dni = request.state.payload["sub"]
        
        data = {key: value for key, value in data.items() if value is not None} #Filtrar datos que no sean default
        
        if request.state.payload["role"] not in [1, 0]:
            raise HTTPException(status_code=403, detail="No se pudo acceder a la petición.")          

        await self.userservice.update_account(db, data, dni)
        return {"detail": "Se actualizo la cuenta correctamente.", "success": True}