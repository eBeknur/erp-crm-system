from app.core.database import Base, engine
from app.seed import seed_db

def reset_and_seed():
    print("🧹 Dropping old DB tables and recreating schema...")
    Base.metadata.drop_all(bind=engine)
    print("🌱 Seeding multi-tenant DB...")
    seed_db()
    print("✅ Database cleanly reset and seeded with DEVELOPER and Multi-Tenant Stores!")

if __name__ == "__main__":
    reset_and_seed()
