# Description: Archivo principal del servidor. Se encarga de inicializar el servidor y de definir las rutas de la API.
from fastapi.staticfiles import StaticFiles

#TODO: Add app controllers
from app.controllers.user_controller import UserController

#Middleware
from app.middleware.auth_middleware import AuthMiddleware

#Services
from app.services.user_service import UserService

#Utils
from app.utils.class_utils import inject
from app.utils.db_utils import create_tables, get_db_session

#Libraries
from contextlib import asynccontextmanager
from db.connection import engine
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn, os

#TODO @inject(Controllers...)
@inject(UserController)
class ServerBootstrap:
    """
        ServerBootstrap es responsable de inicializar el servidor.
        Se encarga de inicializar la aplicación de FastAPI y de inicializar los controladores.

        Los controladores son clases que se encargan de manejar las peticiones HTTP.
    """
    origin = [ os.getenv("CORS_ORIGIN") ]
    
    def __init__(self, app: FastAPI):
        self.app = app
        self.HOST = os.getenv("HOST")
        self.app.include_router(self.usercontroller.route, prefix='/api') 

    def run(self):
        uvicorn.run(self.app, host=self.HOST, port=8000)

    @asynccontextmanager
    @staticmethod
    async def start_up_events(app: FastAPI):
        # Crear las tablas en la base de datos
        await create_tables(engine)

        # Crear el usuario admin
        async for session in get_db_session():
            try:
                await UserService.initialize_db(session)
            finally:
                await session.close()

        yield
    
def main():
    app = FastAPI(lifespan=ServerBootstrap.start_up_events)
    app.add_middleware(CORSMiddleware, 
                        allow_origins=ServerBootstrap.origin,
                        allow_credentials=True, 
                        allow_methods=["*"],
                        allow_headers=["*"])
    app.add_middleware(AuthMiddleware)
    ServerBootstrap(app).run()

if __name__ == "__main__":
    main()