import sys
from app.core.database import SessionLocal, Base, engine
from app.models.models import Store, User, AuditLog, Employee
from app.api.deps import verify_store_isolation
from app.services.audit_service import log_audit
from app.core.security import hash_password
from fastapi import HTTPException

def log_pass(msg):
    print(f"✅ PASS: {msg}")

def log_fail(msg):
    print(f"❌ FAIL: {msg}")
    sys.exit(1)

def run_direct_tests():
    print("🚀 Starting Pure Python Verification Suite...")
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    try:
        # 1. Verify DEVELOPER account exists
        dev = db.query(User).filter(User.role == "DEVELOPER").first()
        if not dev or dev.username != "developer":
            log_fail("DEVELOPER account not found in database!")
        log_pass(f"DEVELOPER user verified: '{dev.full_name}' (@{dev.username})")

        # 2. Verify Stores exist
        stores = db.query(Store).all()
        if len(stores) < 2:
            log_fail("Multi-tenant stores missing!")
        log_pass(f"Multi-tenant stores verified ({len(stores)} stores found: {[s.code for s in stores]})")

        # 3. Test Store Isolation Function
        admin1 = db.query(User).filter(User.username == "admin").first()
        if not admin1:
            log_fail("Store 1 Admin missing!")

        # Admin 1 accessing own store -> Allowed
        res_store = verify_store_isolation(admin1, admin1.store_id)
        if res_store != admin1.store_id:
            log_fail("Admin store verification failed for own store")
        log_pass(f"Store isolation verified: Admin 1 accesses own store #{admin1.store_id} cleanly")

        # Admin 1 accessing Store 2 -> Raises 403 Forbidden
        try:
            verify_store_isolation(admin1, 2)
            log_fail("Security breach! Admin 1 was allowed to request store_id=2")
        except HTTPException as e:
            if e.status_code == 403:
                log_pass("Server-side store isolation verified! Admin 1 request for store 2 blocked with 403 Forbidden")
            else:
                log_fail(f"Unexpected status code: {e.status_code}")

        # DEVELOPER accessing Store 2 -> Allowed
        dev_store = verify_store_isolation(dev, 2)
        if dev_store != 2:
            log_fail("Developer cross-store access failed")
        log_pass("DEVELOPER global store access verified! DEVELOPER can query any store")

        # 4. Test Audit Trail Logging
        audit_entry = log_audit(
            db=db,
            action_type="DEVELOPER_VERIFICATION_TEST",
            user=dev,
            store_id=stores[0].id,
            entity="Store",
            entity_id=stores[0].id,
            changed_data="Test Verification Execution",
            notes="Automatic test verification log entry"
        )

        if not audit_entry or audit_entry.action_type != "DEVELOPER_VERIFICATION_TEST":
            log_fail("Audit log creation failed")
        log_pass(f"Audit log entry created successfully: #{audit_entry.id} ({audit_entry.action_type})")

        print("\n🎉 ALL DIRECT MULTI-TENANT & DEVELOPER REQS VERIFIED SUCCESSFULLY!")

    finally:
        db.close()

if __name__ == "__main__":
    run_direct_tests()
