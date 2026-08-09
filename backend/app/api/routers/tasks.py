from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_store_isolation
from app.models.models import Task, Employee, User
from app.schemas.schemas import TaskCreate, TaskOut, TaskStart, TaskComplete, TaskCallHelper
from app.services.audit_service import log_audit

router = APIRouter(prefix="/tasks", tags=["Task Management"])

@router.get("", response_model=List[TaskOut])
def get_tasks(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_store_id = verify_store_isolation(current_user, store_id)
    query = db.query(Task)
    if target_store_id is not None:
        query = query.filter(Task.store_id == target_store_id)
    
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER", "SELLER": "ISHCHI"}
    user_role = role_map.get(current_user.role, current_user.role)

    if user_role in ["ADMIN", "DEVELOPER"]:
        return query.order_by(Task.id.desc()).all()

    # For ISHCHI / HR_MANAGER filter relevant tasks
    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.full_name == current_user.full_name).first()
    emp_id = emp.id if emp else None

    all_tasks = query.order_by(Task.id.desc()).all()
    filtered = []
    for t in all_tasks:
        if t.status == "AVAILABLE" or (emp_id and (t.claimed_employee_id == emp_id or t.helper_employee_id == emp_id)):
            filtered.append(t)
    return filtered

@router.post("", response_model=TaskOut)
def create_task(
    req: TaskCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER"}
    user_role = role_map.get(current_user.role, current_user.role)

    if user_role not in ["ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Vazifa yaratish faqat Admin uchun mo'ljallangan!")

    target_store_id = current_user.store_id

    task = Task(
        store_id=target_store_id,
        title=req.title,
        description=req.description,
        reward_price=req.reward_price,
        assigned_employee_id=req.assigned_employee_id,
        created_by_user_id=current_user.id,
        status="AVAILABLE"
    )
    db.add(task)
    db.commit()
    db.refresh(task)

    action_type = "ADMIN_CREATED_TASK" if user_role == "ADMIN" else "DEVELOPER_CREATED_TASK"

    log_audit(
        db=db,
        action_type=action_type,
        user=current_user,
        store_id=target_store_id,
        entity="Task",
        entity_id=task.id,
        new_value=f"Task: {task.title} ({task.reward_price} so'm)",
        request=request,
        notes=f"{user_role} '{current_user.username}' yangi vazifa yaratdi: '{task.title}'"
    )

    return task

@router.post("/{task_id}/start", response_model=TaskOut)
def start_task(
    task_id: int,
    request: Request,
    req: Optional[TaskStart] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = req or TaskStart()
    """
    ISHCHI starts task and optionally uploads BEFORE picture.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Vazifa topilmadi")

    verify_store_isolation(current_user, task.store_id)

    emp = db.query(Employee).filter(Employee.user_id == current_user.id).first()
    if not emp:
        emp = db.query(Employee).filter(Employee.full_name == current_user.full_name).first()
    emp_id = emp.id if emp else None

    task.status = "IN_PROGRESS"
    task.claimed_employee_id = emp_id
    task.claimed_at = datetime.now(timezone.utc)
    if req.before_image_url:
        task.before_image_url = req.before_image_url

    db.commit()
    db.refresh(task)

    log_audit(
        db=db,
        action_type="ISHCHI_STARTED_TASK",
        user=current_user,
        store_id=task.store_id,
        entity="Task",
        entity_id=task.id,
        request=request,
        notes=f"ISHCHI '{current_user.username}' vazifani boshladi: '{task.title}'"
    )

    if req.before_image_url:
        log_audit(
            db=db,
            action_type="ISHCHI_BEFORE_IMAGE",
            user=current_user,
            store_id=task.store_id,
            entity="Task",
            entity_id=task.id,
            request=request,
            notes=f"ISHCHI '{current_user.username}' BEFORE rasm yukladi"
        )

    return task

@router.post("/{task_id}/helper", response_model=TaskOut)
def call_helper(
    task_id: int,
    req: TaskCallHelper,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    ISHCHI calls another worker for help.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Vazifa topilmadi")

    verify_store_isolation(current_user, task.store_id)

    helper_emp = db.query(Employee).filter(Employee.id == req.helper_employee_id).first()
    if not helper_emp:
        raise HTTPException(status_code=404, detail="Yordamchi ishchi topilmadi")

    task.helper_employee_id = req.helper_employee_id
    db.commit()
    db.refresh(task)

    log_audit(
        db=db,
        action_type="ISHCHI_CALLED_HELPER",
        user=current_user,
        store_id=task.store_id,
        entity="Task",
        entity_id=task.id,
        new_value=f"Helper: {helper_emp.full_name}",
        request=request,
        notes=f"ISHCHI '{current_user.username}' boshqa ishchini ('{helper_emp.full_name}') yordamga chaqirdi"
    )

    return task

@router.post("/{task_id}/complete", response_model=TaskOut)
def complete_task(
    task_id: int,
    request: Request,
    req: Optional[TaskComplete] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    req = req or TaskComplete()
    """
    ISHCHI completes task and uploads AFTER picture & proof.
    """
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Vazifa topilmadi")

    verify_store_isolation(current_user, task.store_id)

    task.status = "COMPLETED_PENDING_REVIEW"
    if req.after_image_url:
        task.after_image_url = req.after_image_url
        task.proof_image_url = req.after_image_url
    if req.proof_image_url:
        task.proof_image_url = req.proof_image_url
    if req.proof_notes:
        task.proof_notes = req.proof_notes
    task.completed_at = datetime.now(timezone.utc)

    db.commit()
    db.refresh(task)

    if req.after_image_url or req.proof_image_url:
        log_audit(
            db=db,
            action_type="ISHCHI_AFTER_IMAGE",
            user=current_user,
            store_id=task.store_id,
            entity="Task",
            entity_id=task.id,
            request=request,
            notes=f"ISHCHI '{current_user.username}' AFTER rasm yukladi"
        )

    return task

@router.post("/{task_id}/approve", response_model=TaskOut)
def approve_task(
    task_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER"}
    user_role = role_map.get(current_user.role, current_user.role)

    if user_role not in ["ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Faqat Administrator vazifani tasdiqlay oladi!")

    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Vazifa topilmadi")

    verify_store_isolation(current_user, task.store_id)

    task.status = "APPROVED"
    if task.claimed_employee_id:
        emp = db.query(Employee).filter(Employee.id == task.claimed_employee_id).first()
        if emp and task.reward_price > 0:
            emp.current_bonus += task.reward_price

    db.commit()
    db.refresh(task)

    log_audit(
        db=db,
        action_type="ADMIN_APPROVED_TASK",
        user=current_user,
        store_id=task.store_id,
        entity="Task",
        entity_id=task.id,
        new_value="Status: APPROVED",
        request=request,
        notes=f"{user_role} '{current_user.username}' vazifani tasdiqladi: '{task.title}'"
    )

    return task
