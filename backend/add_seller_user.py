from app.core.database import SessionLocal
from app.core.security import hash_password
from app.models.models import User, Store

db = SessionLocal()

store1 = db.query(Store).filter(Store.code == "STORE-001").first()

seller_user = db.query(User).filter(User.username == "seller").first()
if not seller_user:
    seller_user = User(
        store_id=store1.id if store1 else 1,
        username="seller",
        full_name="Sardor Sotuvchi",
        email="seller@chilonzor.uz",
        phone="+998905556677",
        hashed_password=hash_password("Seller1234@"),
        role="ISHCHI",
        is_active=True
    )
    db.add(seller_user)
    db.commit()
    print("✅ Created user 'seller' with password 'Seller1234@'")
else:
    seller_user.hashed_password = hash_password("Seller1234@")
    seller_user.is_active = True
    db.commit()
    print("✅ Password for 'seller' reset to 'Seller1234@'")

db.close()
