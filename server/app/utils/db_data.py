from app.utils.db_utils import hash_password
import os

# Datos del usuario Root
root_data = {
    "DNI": "R000000",
    "correo_electronico": os.getenv("ROOT_EMAIL"),
    "usuario": os.getenv("ROOT_USER"),
    "clave": hash_password( os.getenv("ROOT_PASSWORD") ),
    "rol": 1
}