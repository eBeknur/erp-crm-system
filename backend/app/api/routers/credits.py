from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_store_isolation
from app.models.models import Credit, User
from app.schemas.schemas import CreditCreate, CreditOut
from app.services.audit_service import log_audit

router = APIRouter(prefix="/credits", tags=["Credit & Loans"])

@router.get("", response_model=List[CreditOut])
def get_credits(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_store_id = verify_store_isolation(current_user, store_id)
    query = db.query(Credit)
    if target_store_id is not None:
        query = query.filter(Credit.store_id == target_store_id)
    return query.order_by(Credit.id.desc()).all()

@router.post("", response_model=CreditOut)
def create_credit(
    req: CreditCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER"}
    user_role = role_map.get(current_user.role, current_user.role)

    if user_role not in ["ADMIN", "DEVELOPER"]:
        raise HTTPException(status_code=403, detail="Kredit kiritish ruxsat etilmagan!")

    if req.total_amount <= 0:
        raise HTTPException(status_code=400, detail="Summa noldan katta bo'lishi kerak")

    target_store_id = current_user.store_id
    rem_bal = req.remaining_balance if req.remaining_balance is not None else req.total_amount

    credit = Credit(
        store_id=target_store_id,
        title=req.title,
        lender_name=req.lender_name,
        total_amount=req.total_amount,
        monthly_payment=req.monthly_payment,
        remaining_balance=rem_bal,
        interest_rate=req.interest_rate,
        due_day=req.due_day,
        status="ACTIVE" if rem_bal > 0 else "PAID_OFF",
        notes=req.notes
    )
    db.add(credit)
    db.commit()
    db.refresh(credit)

    log_audit(
        db=db,
        action_type="ADMIN_CREATED_CREDIT",
        user=current_user,
        store_id=target_store_id,
        entity="Credit",
        entity_id=credit.id,
        new_value=f"Credit: {credit.title} ({credit.total_amount} so'm)",
        request=request,
        notes=f"{user_role} '{current_user.username}' kredit yaratdi: '{credit.title}'"
    )

    return credit

@router.post("/{credit_id}/pay", response_model=CreditOut)
def pay_credit(
    credit_id: int,
    amount: float,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    credit = db.query(Credit).filter(Credit.id == credit_id).first()
    if not credit:
        raise HTTPException(status_code=404, detail="Kredit topilmadi")

    verify_store_isolation(current_user, credit.store_id)

    credit.remaining_balance = max(0.0, credit.remaining_balance - amount)
    if credit.remaining_balance <= 0:
        credit.status = "PAID_OFF"

    db.commit()
    db.refresh(credit)

    role_map = {"SUPER_ADMIN": "ADMIN"}
    user_role = role_map.get(current_user.role, current_user.role)

    log_audit(
        db=db,
        action_type="ADMIN_MARKED_CREDIT_PAID",
        user=current_user,
        store_id=credit.store_id,
        entity="Credit",
        entity_id=credit.id,
        new_value=f"Paid: {amount}, Remaining: {credit.remaining_balance}",
        request=request,
        notes=f"{user_role} '{current_user.username}' kredit to'lovini belgiladi"
    )

    return credit
