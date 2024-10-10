from app.utils.db_utils import hash_password
from datetime import datetime, timezone
import os

# Datos del usuario Admin
admin_data = {
    "document_id": 0,
    "email": os.getenv("ADMIN_EMAIL"),
    "username": os.getenv("ADMIN_USER"),
    "password": hash_password( os.getenv("ADMIN_PASSWORD") ),
    "role": 1,
    "name": "Admin",
    "visibility" : 0,
    "points" : 0,
    "created_at": datetime.now(timezone.utc)
}