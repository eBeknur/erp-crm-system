import sys
from app.core.database import SessionLocal
from app.core.security import hash_password, verify_password
from app.models.models import User, Employee, Store

db = SessionLocal()

# 1. Simulate Admin creating a worker with username and password
store1 = db.query(Store).filter(Store.code == "STORE-001").first()

new_emp = Employee(
    store_id=store1.id if store1 else 1,
    full_name="Anvar Yangi Ishchi",
    phone="+998909998877",
    position="Sotuvchi",
    base_salary=3800000.0
)
db.add(new_emp)
db.commit()
db.refresh(new_emp)

# Create user login account for new worker
user_login = User(
    store_id=store1.id if store1 else 1,
    username="anvar_seller",
    full_name=new_emp.full_name,
    phone=new_emp.phone,
    hashed_password=hash_password("Anvar1234@"),
    role="ISHCHI",
    is_active=True
)
db.add(user_login)
db.commit()
db.refresh(user_login)

new_emp.user_id = user_login.id
db.commit()

print(f"✅ Admin created worker '{new_emp.full_name}' with login username '{user_login.username}'")

# 2. Test logging in as the newly created worker
u = db.query(User).filter(User.username == "anvar_seller").first()
if u and verify_password("Anvar1234@", u.hashed_password) and u.is_active:
    print(f"🎉 TEST SUCCESSFUL! Newly created worker '{u.username}' logged in cleanly (Role: {u.role}, Store ID: {u.store_id})")
else:
    print("❌ FAIL: Login failed for newly created worker!")

db.close()
