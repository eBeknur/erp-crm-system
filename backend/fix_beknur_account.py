from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password
from app.models.models import User, Employee, Store

db = SessionLocal()

emp1 = db.query(Employee).filter(Employee.full_name.ilike("%Beknur%")).first()
if not emp1:
    print("Employee Beknur not found")
    sys.exit(1)

# Check if user account exists or create it
user_beknur = db.query(User).filter(User.username.ilike("Beknur")).first()
if not user_beknur:
    user_beknur = User(
        store_id=emp1.store_id or 1,
        username="Beknur",
        full_name=emp1.full_name,
        phone=emp1.phone,
        hashed_password=hash_password("Beknur1234@"),
        role="ISHCHI",
        is_active=True
    )
    db.add(user_beknur)
    db.commit()
    db.refresh(user_beknur)
    print("✅ Created User account 'Beknur' with password 'Beknur1234@'")
else:
    user_beknur.hashed_password = hash_password("Beknur1234@")
    user_beknur.is_active = True
    db.commit()
    print("✅ Updated password for 'Beknur' to 'Beknur1234@'")

emp1.user_id = user_beknur.id
db.commit()

# Test Login verification
u = db.query(User).filter(User.username == "Beknur").first()
if u and verify_password("Beknur1234@", u.hashed_password) and u.is_active:
    print(f"🎉 VERIFICATION PASSED! User '{u.username}' (Full Name: {u.full_name}, Role: {u.role}) is fully active and ready to log in!")
else:
    print("❌ FAIL: User verification failed")

db.close()
