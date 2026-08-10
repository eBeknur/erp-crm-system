from datetime import datetime, timezone, timedelta
from app.core.database import SessionLocal, Base, engine
from app.core.security import hash_password
from app.models.models import Store, User, Account, Employee, Task, AuditLog, Supplier, Customer, Product, Attendance

def seed_db():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Primary DEVELOPER Account
        developer = db.query(User).filter(User.role == "DEVELOPER").first()
        if not developer:
            developer = User(
                username="developer",
                full_name="Beknur (Chief Developer)",
                email="developer@supermarket.uz",
                phone="+998901234567",
                avatar_url="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80",
                hashed_password=hash_password("Dev1234@"),
                role="DEVELOPER",
                is_active=True,
                created_at=datetime.now(timezone.utc),
                last_login_at=datetime.now(timezone.utc)
            )
            db.add(developer)
            db.commit()
            db.refresh(developer)

        # 2. Seed Default Store 1
        store1 = db.query(Store).filter(Store.code == "STORE-001").first()
        if not store1:
            store1 = Store(
                name="Toshkent Markaziy Supermarket",
                code="STORE-001",
                address="Toshkent shahri, Chilonzor tumani, 5-mavze 12-uy",
                phone="+998712001122",
                email="chilonzor@supermarket.uz",
                opening_time="08:00",
                closing_time="23:00",
                latitude=41.2995,
                longitude=69.2401,
                attendance_radius=150.0,
                timezone="Asia/Tashkent",
                status="ACTIVE"
            )
            db.add(store1)
            db.commit()
            db.refresh(store1)

        # 3. Seed ADMIN user for Store 1
        admin_user = db.query(User).filter(User.username == "admin").first()
        if not admin_user:
            admin_user = User(
                store_id=store1.id,
                username="admin",
                full_name="Toshkent Admini",
                email="admin@chilonzor.uz",
                phone="+998909876543",
                hashed_password=hash_password("Admin1234@"),
                role="ADMIN",
                is_active=True
            )
            db.add(admin_user)
            db.commit()

        # 4. Seed Beknur worker user & employee
        beknur_user = db.query(User).filter(User.username == "Beknur").first()
        if not beknur_user:
            beknur_user = User(
                store_id=store1.id,
                username="Beknur",
                full_name="Beknur Bozorov",
                email="beknur@chilonzor.uz",
                phone="+998901112233",
                hashed_password=hash_password("Beknur1234@"),
                role="ISHCHI",
                is_active=True
            )
            db.add(beknur_user)
            db.commit()
            db.refresh(beknur_user)

        beknur_emp = db.query(Employee).filter(Employee.user_id == beknur_user.id).first()
        if not beknur_emp:
            beknur_emp = Employee(
                store_id=store1.id,
                user_id=beknur_user.id,
                full_name="Beknur Bozorov",
                position="ISHCHI",
                salary_type="MONTHLY",
                base_salary=4500000.0
            )
            db.add(beknur_emp)
            db.commit()

        # 5. Seed HR Manager and Ishchi users
        hr_user = db.query(User).filter(User.username == "hr_manager").first()
        if not hr_user:
            hr_user = User(
                store_id=store1.id,
                username="hr_manager",
                full_name="Malika HR Menejer",
                email="hr@chilonzor.uz",
                phone="+998911112233",
                hashed_password=hash_password("Hr1234@"),
                role="HR_MANAGER",
                is_active=True
            )
            db.add(hr_user)
            db.commit()

        ishchi_user = db.query(User).filter(User.username == "ishchi1").first()
        if not ishchi_user:
            ishchi_user = User(
                store_id=store1.id,
                username="ishchi1",
                full_name="Jasur Ishchi",
                email="jasur@chilonzor.uz",
                phone="+998944445566",
                hashed_password=hash_password("Ishchi1234@"),
                role="ISHCHI",
                is_active=True
            )
            db.add(ishchi_user)
            db.commit()
            db.refresh(ishchi_user)

            db.add(Employee(
                store_id=store1.id,
                user_id=ishchi_user.id,
                full_name="Jasur Ishchi",
                position="ISHCHI",
                salary_type="MONTHLY",
                base_salary=4000000.0
            ))
            db.commit()

        seller_user = db.query(User).filter(User.username == "seller").first()
        if not seller_user:
            seller_user = User(
                store_id=store1.id,
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
            db.refresh(seller_user)

            db.add(Employee(
                store_id=store1.id,
                user_id=seller_user.id,
                full_name="Sardor Sotuvchi",
                position="Sotuvchi",
                salary_type="MONTHLY",
                base_salary=4200000.0
            ))
            db.commit()

        # 6. Seed Suppliers with initial debt and due_days
        if db.query(Supplier).count() == 0:
            past_date = datetime.now(timezone.utc) - timedelta(days=25)
            s1 = Supplier(
                store_id=store1.id,
                name="Nestle Uzbekistan MCHJ",
                contact_person="Alisher Karimov",
                phone="+998712003344",
                current_debt=12500000.0,
                due_days=30,
                debt_start_date=past_date
            )
            s2 = Supplier(
                store_id=store1.id,
                name="Coca-Cola Bottlers Tashkent",
                contact_person="Dilshod Rahimov",
                phone="+998712005566",
                current_debt=5000000.0,
                due_days=15,
                debt_start_date=past_date
            )
            db.add_all([s1, s2])
            db.commit()

        # 7. Seed Products
        if db.query(Product).count() == 0:
            p1 = Product(
                store_id=store1.id,
                sku="NST-001",
                barcode="4780001112233",
                name="Nestle Sut 3.2% 1L",
                category_name="Sut Mahsulotlari",
                cost_price=11000.0,
                selling_price=14500.0,
                current_stock=150.0,
                min_stock=20.0,
                unit="dona"
            )
            p2 = Product(
                store_id=store1.id,
                sku="COK-001",
                barcode="5449000000996",
                name="Coca-Cola 1.5L",
                category_name="Ichimliklar",
                cost_price=9500.0,
                selling_price=12500.0,
                current_stock=300.0,
                min_stock=50.0,
                unit="dona"
            )
            db.add_all([p1, p2])
            db.commit()

        # 8. Accounts
        if not db.query(Account).filter(Account.store_id == store1.id).first():
            db.add(Account(store_id=store1.id, name="Asosiy Kassa Balansi", account_type="CASH", balance=30000000.0))
        db.commit()

        # Initial Audit Log
        if db.query(AuditLog).count() == 0:
            db.add(AuditLog(
                user_id=developer.id,
                user_name=developer.full_name,
                user_role="DEVELOPER",
                store_id=store1.id,
                store_name=store1.name,
                action_type="DEVELOPER_SYSTEM_INIT",
                entity="System",
                changed_data="Full System Seed & Data Restoration Complete",
                ip_address="127.0.0.1",
                device_info="Mozilla/5.0 (System Initializer)"
            ))
            db.commit()

    finally:
        db.close()

if __name__ == "__main__":
    seed_db()
