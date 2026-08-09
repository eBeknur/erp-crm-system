from app.core.database import SessionLocal
from app.models.models import User

db = SessionLocal()
users = db.query(User).all()

print("=== CURRENT DATABASE USERS ===")
for u in users:
    print(f"ID: {u.id} | Username: {u.username} | Full Name: {u.full_name} | Role: {u.role} | Store ID: {u.store_id} | Active: {u.is_active}")
db.close()
