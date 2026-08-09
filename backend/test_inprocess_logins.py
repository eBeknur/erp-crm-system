import sys
from app.core.security import verify_password
from app.core.database import SessionLocal
from app.models.models import User

db = SessionLocal()
users_to_test = [
    ("developer", "Dev1234@"),
    ("admin", "Admin1234@"),
    ("samarkand_admin", "Sam1234@"),
    ("hr_manager", "Hr1234@"),
    ("ishchi1", "Ishchi1234@"),
    ("seller", "Seller1234@"),
]

print("=== IN-PROCESS USER LOGIN VERIFICATION ===")
for username, password in users_to_test:
    u = db.query(User).filter(User.username == username).first()
    if not u:
        print(f"❌ FAIL: Username '{username}' NOT FOUND in DB")
    elif not verify_password(password, u.hashed_password):
        print(f"❌ FAIL: Username '{username}' PASSWORD INVALID")
    elif not u.is_active:
        print(f"❌ FAIL: Username '{username}' ACCOUNT INACTIVE")
    else:
        print(f"✅ PASS: Username '{username}' -> Full Name: '{u.full_name}', Role: '{u.role}', Store ID: {u.store_id}")
db.close()
