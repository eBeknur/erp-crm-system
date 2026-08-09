from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import Customer, CustomerPayment, User
from app.schemas.schemas import CustomerCreate, CustomerOut, CustomerPaymentCreate
from app.services.ledger import FinancialLedgerEngine, AuditService

router = APIRouter(prefix="/customers", tags=["Customers"])

@router.get("", response_model=List[CustomerOut])
def list_customers(search: Optional[str] = None, db: Session = Depends(get_db)):
    query = db.query(Customer)
    if search:
        pattern = f"%{search}%"
        query = query.filter((Customer.name.like(pattern)) | (Customer.phone.like(pattern)))
    return query.order_by(Customer.id.desc()).all()

@router.post("", response_model=CustomerOut)
def create_customer(
    req: CustomerCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = Customer(
        name=req.name,
        phone=req.phone,
        address=req.address,
        notes=req.notes
    )
    db.add(customer)
    db.commit()
    db.refresh(customer)

    AuditService.log(
        db=db,
        user_name=current_user.full_name,
        action="CUSTOMER_CREATED",
        entity="Customer",
        entity_id=customer.id,
        details=f"Yangi mijoz qo'shildi: {customer.name}",
        user_id=current_user.id
    )
    db.commit()
    return customer

@router.post("/pay-debt", response_model=CustomerOut)
def pay_customer_debt(
    req: CustomerPaymentCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Mijoz topilmadi")

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="To'lov summasi noldan katta bo'lishi kerak")

    payment = CustomerPayment(
        customer_id=req.customer_id,
        amount=req.amount,
        account_type=req.account_type,
        notes=req.notes,
        user_id=current_user.id
    )
    db.add(payment)

    customer.total_paid += req.amount
    customer.current_debt = max(0.0, customer.current_debt - req.amount)

    # Financial Ledger income update
    FinancialLedgerEngine.update_account_balance(
        db=db,
        account_type=req.account_type,
        amount=req.amount,
        transaction_type="INCOME",
        category="CUSTOMER_DEBT_PAYMENT",
        description=f"Mijoz qarz to'lovi: {customer.name}",
        reference_type="CUSTOMER_PAYMENT",
        reference_id=payment.id,
        user_id=current_user.id
    )

    AuditService.log(
        db=db,
        user_name=current_user.full_name,
        action="CUSTOMER_DEBT_PAID",
        entity="Customer",
        entity_id=customer.id,
        details=f"Mijoz [{customer.name}] qarzidan {req.amount:,.0f} so'm to'ladi",
        user_id=current_user.id
    )

    db.commit()
    db.refresh(customer)
    return customer
