import sys
import os

# Ensure python path includes backend
sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from app.core.database import SessionLocal, engine, Base
from app.seed import seed_db

def restore_all_system_data():
    print("🔄 Restoring all system features, tables, suppliers, products, and accounts...")
    try:
        Base.metadata.drop_all(bind=engine)
        Base.metadata.create_all(bind=engine)
        print("✅ Database tables recreated fresh.")
    except Exception as e:
        print(f"Error resetting schema: {e}")

    seed_db()
    print("🎉 All features, suppliers, employees, products, and accounts successfully RESTORED!")

if __name__ == "__main__":
    restore_all_system_data()
