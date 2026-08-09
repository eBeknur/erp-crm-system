from app.core.database import SessionLocal
from app.models.models import User, Employee

db = SessionLocal()

print("=== CHECKING USER 'Beknur' / 'beknur' IN USERS TABLE ===")
user = db.query(User).filter(User.username.ilike("beknur")).first()
if user:
    print(f"FOUND USER: ID={user.id}, Username='{user.username}', Full Name='{user.full_name}', Role='{user.role}', Active={user.is_active}, Store ID={user.store_id}")
else:
    print("❌ NO USER WITH USERNAME 'beknur' FOUND IN USERS TABLE!")

print("\n=== CHECKING EMPLOYEES TABLE FOR 'Beknur' ===")
employees = db.query(Employee).all()
for e in employees:
    print(f"Employee ID={e.id}, Full Name='{e.full_name}', User ID={e.user_id}, Store ID={e.store_id}")

db.close()
