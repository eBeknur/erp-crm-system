import sys
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def log_pass(msg):
    print(f"✅ PASS: {msg}")

def log_fail(msg):
    print(f"❌ FAIL: {msg}")
    sys.exit(1)

def run_tests():
    print("🚀 Starting In-Process Multi-Tenant & DEVELOPER Role Verification...")

    # 1. Login as DEVELOPER
    res = client.post("/api/v1/auth/login", json={"username": "developer", "password": "Dev1234@"})
    if res.status_code != 200:
        log_fail(f"Developer login failed: {res.text}")
    dev_token = res.json()["access_token"]
    dev_headers = {"Authorization": f"Bearer {dev_token}"}
    log_pass("DEVELOPER login successful!")

    # 2. Fetch Developer Profile
    res = client.get("/api/v1/developer/profile", headers=dev_headers)
    if res.status_code != 200:
        log_fail(f"Get developer profile failed: {res.text}")
    profile = res.json()
    if profile["role"] != "DEVELOPER" or profile["username"] != "developer":
        log_fail(f"Developer profile values invalid: {profile}")
    log_pass(f"Developer profile verified for '{profile['full_name']}'!")

    # 3. Create Store via DEVELOPER API
    new_store_data = {
        "name": "Buxoro Supermarket #3",
        "code": "STORE-003",
        "address": "Buxoro shahri, Labi Hovuz 10-uy",
        "phone": "+998652223344",
        "email": "buxoro@supermarket.uz",
        "opening_time": "08:00",
        "closing_time": "23:00",
        "latitude": 39.7747,
        "longitude": 64.4286,
        "attendance_radius": 120.0,
        "timezone": "Asia/Tashkent",
        "status": "ACTIVE",
        "create_initial_admin": True,
        "admin_full_name": "Buxoro Admini",
        "admin_username": "buxoro_admin",
        "admin_email": "admin@buxoro.uz",
        "admin_phone": "+998907778899",
        "admin_password": "BuxAdmin1234@"
    }

    res = client.post("/api/v1/stores", json=new_store_data, headers=dev_headers)
    if res.status_code != 200:
        log_fail(f"Store creation failed: {res.text}")
    created_store = res.json()
    log_pass(f"DEVELOPER created store '{created_store['name']}' ({created_store['code']}) with initial ADMIN '{created_store['admin_username']}'!")

    # 4. Login as Store 1 ADMIN
    res = client.post("/api/v1/auth/login", json={"username": "admin", "password": "Admin1234@"})
    if res.status_code != 200:
        log_fail(f"Store 1 Admin login failed: {res.text}")
    admin1_token = res.json()["access_token"]
    admin1_headers = {"Authorization": f"Bearer {admin1_token}"}
    log_pass("Store 1 ADMIN login successful!")

    # 5. Verify non-DEVELOPER cannot create store (Forbidden 403)
    res = client.post("/api/v1/stores", json=new_store_data, headers=admin1_headers)
    if res.status_code != 403:
        log_fail(f"Security breach! Non-developer was able to access store creation API (status {res.status_code})")
    log_pass("Store creation API properly restricted to DEVELOPER role ONLY (403 Forbidden for ADMIN)!")

    # 6. Verify Server-Side Store Isolation
    # Admin 1 (Store 1) attempts to query employees of Store 2
    res = client.get("/api/v1/employees?store_id=2", headers=admin1_headers)
    if res.status_code != 403:
        log_fail(f"Security breach! Admin 1 manipulated store_id to query Store 2 data (status {res.status_code})")
    log_pass("Server-side store isolation verified! Admin parameter manipulation blocked with 403 Forbidden.")

    # 7. Test Audit Trail Generation
    # Admin 1 creates worker
    worker_data = {
        "full_name": "Test Worker Store 1",
        "phone": "+998901112233",
        "position": "Sotuvchi",
        "salary_type": "MONTHLY",
        "base_salary": 3500000.0,
        "create_user_login": True,
        "username": "worker_test1",
        "password": "Worker1234@"
    }
    res = client.post("/api/v1/employees", json=worker_data, headers=admin1_headers)
    if res.status_code != 200:
        log_fail(f"Worker creation failed: {res.text}")
    log_pass("ADMIN created worker & login successfully!")

    # Login as Ishchi 1
    res = client.post("/api/v1/auth/login", json={"username": "ishchi1", "password": "Ishchi1234@"})
    if res.status_code != 200:
        log_fail(f"Ishchi login failed: {res.text}")
    ishchi_token = res.json()["access_token"]
    ishchi_headers = {"Authorization": f"Bearer {ishchi_token}"}
    log_pass("ISHCHI login successful!")

    # 8. Audit Log Access Controls
    # ISHCHI attempts to view audit logs -> 403 Forbidden
    res = client.get("/api/v1/audit", headers=ishchi_headers)
    if res.status_code != 403:
        log_fail(f"Security breach! ISHCHI was able to view audit logs (status {res.status_code})")
    log_pass("Audit Log access restricted: ISHCHI denied access (403 Forbidden)!")

    # ADMIN 1 views audit logs -> Should see ONLY Store 1 logs
    res = client.get("/api/v1/audit", headers=admin1_headers)
    if res.status_code != 200:
        log_fail(f"ADMIN view audit logs failed: {res.text}")
    admin_logs = res.json()
    for l in admin_logs:
        if l["store_id"] and l["store_id"] != 1:
            log_fail(f"Security breach! ADMIN 1 saw log belonging to store {l['store_id']}")
    log_pass(f"ADMIN 1 saw strictly store 1 audit logs ({len(admin_logs)} logs retrieved)!")

    # DEVELOPER views audit logs across all stores
    res = client.get("/api/v1/audit", headers=dev_headers)
    if res.status_code != 200:
        log_fail(f"DEVELOPER view audit logs failed: {res.text}")
    dev_logs = res.json()
    log_pass(f"DEVELOPER retrieved cross-tenant system audit logs ({len(dev_logs)} total logs retrieved)!")

    print("\n🎉 ALL MULTI-TENANT & DEVELOPER VERIFICATION TESTS PASSED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
