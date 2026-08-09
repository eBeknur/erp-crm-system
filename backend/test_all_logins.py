import requests

BASE_URL = "http://127.0.0.1:8080/api/v1"

users_to_test = [
    ("developer", "Dev1234@"),
    ("admin", "Admin1234@"),
    ("samarkand_admin", "Sam1234@"),
    ("hr_manager", "Hr1234@"),
    ("ishchi1", "Ishchi1234@"),
    ("seller", "Seller1234@"),
]

print("=== TESTING ALL USER LOGINS ===")
for username, password in users_to_test:
    try:
        res = requests.post(f"{BASE_URL}/auth/login", json={"username": username, "password": password}, proxies={"http": None, "https": None})
        if res.status_code == 200:
            user_data = res.json()["user"]
            print(f"✅ PASS: Username '{username}' -> Full Name: '{user_data['full_name']}', Role: '{user_data['role']}'")
        else:
            print(f"❌ FAIL: Username '{username}' -> Status {res.status_code}: {res.text}")
    except Exception as e:
        print(f"⚠️ ERROR testing '{username}': {e}")
