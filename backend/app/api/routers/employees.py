from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_store_isolation
from app.models.models import Employee, SalaryPayment, User
from app.schemas.schemas import EmployeeCreate, EmployeeOut
from app.services.audit_service import log_audit
from app.core.security import hash_password

router = APIRouter(prefix="/employees", tags=["Employees & Payroll"])

@router.get("", response_model=List[EmployeeOut])
def list_employees(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_store_id = verify_store_isolation(current_user, store_id)
    query = db.query(Employee)
    if target_store_id is not None:
        query = query.filter(Employee.store_id == target_store_id)
    return query.order_by(Employee.id.desc()).all()

@router.post("", response_model=EmployeeOut)
def create_employee(
    req: EmployeeCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Determine creator role & store
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER", "SELLER": "ISHCHI"}
    creator_role = role_map.get(current_user.role, current_user.role)

    if creator_role not in ["ADMIN", "HR_MANAGER", "DEVELOPER"]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Ishchi yaratish huquqiga ega emassiz!"
        )

    target_store_id = current_user.store_id

    emp = Employee(
        store_id=target_store_id,
        full_name=req.full_name,
        phone=req.phone,
        position=req.position,
        hire_date=req.hire_date,
        salary_type=req.salary_type,
        base_salary=req.base_salary
    )
    db.add(emp)
    db.commit()
    db.refresh(emp)

    # Automatically create login user account if username and password are provided
    if (req.create_user_login or (req.username and req.password)) and req.username and req.password:
        existing = db.query(User).filter(User.username == req.username).first()
        if existing:
            raise HTTPException(status_code=400, detail="Username band!")

        pos_upper = (req.position or "").upper()
        if "MENEDJER" in pos_upper or "MANAGER" in pos_upper:
            user_role = "MANAGER"
        elif "SOTUVCHI" in pos_upper or "SELLER" in pos_upper:
            user_role = "SELLER"
        else:
            user_role = "ISHCHI"

        user_acc = User(
            store_id=target_store_id,
            username=req.username,
            full_name=req.full_name,
            phone=req.phone,
            hashed_password=hash_password(req.password),
            role=user_role,
            is_active=True
        )
        db.add(user_acc)
        db.commit()
        emp.user_id = user_acc.id
        db.commit()

    # Log audit
    action_type = "ADMIN_CREATED_WORKER" if creator_role == "ADMIN" else "HR_MANAGER_CREATED_WORKER"
    if creator_role == "DEVELOPER":
        action_type = "DEVELOPER_CREATED_WORKER"

    log_audit(
        db=db,
        action_type=action_type,
        user=current_user,
        store_id=target_store_id,
        entity="Employee",
        entity_id=emp.id,
        new_value=f"Employee: {emp.full_name} ({emp.position})",
        request=request,
        notes=f"{creator_role} '{current_user.username}' yangi ishchi yaratdi: {emp.full_name}"
    )

    return emp

@router.delete("/{employee_id}")
def delete_employee(
    employee_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER"}
    creator_role = role_map.get(current_user.role, current_user.role)
    if creator_role not in ["ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Ishchini o'chirish taqiqlangan!")

    emp = db.query(Employee).filter(Employee.id == employee_id).first()
    if not emp:
        raise HTTPException(status_code=404, detail="Ishchi topilmadi")

    verify_store_isolation(current_user, emp.store_id)
    emp_name = emp.full_name
    db.delete(emp)
    db.commit()

    log_audit(
        db=db,
        action_type=f"{creator_role}_DELETED_WORKER",
        user=current_user,
        store_id=emp.store_id,
        entity="Employee",
        entity_id=employee_id,
        old_value=f"Employee: {emp_name}",
        request=request,
        notes=f"{creator_role} '{current_user.username}' ishchini o'chirdi: {emp_name}"
    )

    return {"message": "Ishchi muvaffaqiyatli o'chirildi"}
