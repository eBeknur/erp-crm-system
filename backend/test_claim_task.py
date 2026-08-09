from app.core.database import SessionLocal
from app.models.models import User, Task
from app.api.routers.tasks import start_task

db = SessionLocal()
user = db.query(User).filter(User.username == "Beknur").first()

try:
    res = start_task(task_id=1, request=None, db=db, current_user=user)
    print(f"✅ TASK START SUCCESSFUL: Task ID={res.id}, Status={res.status}, Claimed Employee ID={res.claimed_employee_id}")
except Exception as e:
    import traceback
    print(f"❌ ERROR: {e}")
    traceback.print_exc()

db.close()
