from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import Supplier, SupplierPayment, User
from app.schemas.schemas import SupplierCreate, SupplierOut, SupplierPaymentCreate
from app.services.ledger import FinancialLedgerEngine, AuditService

router = APIRouter(prefix="/suppliers", tags=["Suppliers"])

@router.get("", response_model=List[SupplierOut])
def list_suppliers(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Supplier)
    if search:
        pattern = f"%{search}%"
        query = query.filter((Supplier.name.like(pattern)) | (Supplier.phone.like(pattern)))
    return query.order_by(Supplier.id.desc()).all()

@router.post("", response_model=SupplierOut)
def create_supplier(
    req: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    debt_val = req.initial_debt or 0.0
    supplier = Supplier(
        name=req.name,
        contact_person=req.contact_person,
        phone=req.phone,
        address=req.address,
        current_debt=debt_val,
        total_purchased=debt_val,
        due_days=req.due_days or 30,
        notes=req.notes
    )
    db.add(supplier)
    db.commit()
    db.refresh(supplier)

    AuditService.log(
        db=db,
        user_name=current_user.full_name,
        action="SUPPLIER_CREATED",
        entity="Supplier",
        entity_id=supplier.id,
        details=f"Yangi postavshik qo'shildi: {supplier.name}",
        user_id=current_user.id
    )
    db.commit()
    return supplier

@router.post("/pay-debt", response_model=SupplierOut)
def pay_supplier_debt(
    req: SupplierPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == req.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Postavshik topilmadi")

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="To'lov summasi noldan katta bo'lishi kerak")

    payment = SupplierPayment(
        supplier_id=req.supplier_id,
        amount=req.amount,
        account_type=req.account_type,
        notes=req.notes,
        user_id=current_user.id
    )
    db.add(payment)

    supplier.total_paid += req.amount
    supplier.current_debt = max(0.0, supplier.current_debt - req.amount)

    # Financial Ledger expense update
    FinancialLedgerEngine.update_account_balance(
        db=db,
        account_type=req.account_type,
        amount=req.amount,
        transaction_type="EXPENSE",
        category="SUPPLIER_DEBT_PAYMENT",
        description=f"Postavshikka qarz to'lovi: {supplier.name}",
        reference_type="SUPPLIER_PAYMENT",
        reference_id=payment.id,
        user_id=current_user.id
    )

    AuditService.log(
        db=db,
        user_name=current_user.full_name,
        action="SUPPLIER_DEBT_PAID",
        entity="Supplier",
        entity_id=supplier.id,
        details=f"Postavshik [{supplier.name}] qarzi to'landi: {req.amount:,.0f} so'm",
        user_id=current_user.id
    )

    db.commit()
    db.refresh(supplier)
    return supplier
