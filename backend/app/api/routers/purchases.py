from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import Purchase, PurchaseItem, Supplier, User
from app.schemas.schemas import PurchaseCreate, PurchaseOut
from app.services.ledger import FifoEngine, FinancialLedgerEngine, AuditService

router = APIRouter(prefix="/purchases", tags=["Purchases & Stock Entry"])

@router.get("", response_model=List[PurchaseOut])
def list_purchases(limit: int = 100, db: Session = Depends(get_db)):
    return db.query(Purchase).order_by(Purchase.id.desc()).limit(limit).all()

@router.post("", response_model=PurchaseOut)
def create_purchase(
    req: PurchaseCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    supplier = db.query(Supplier).filter(Supplier.id == req.supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Postavshik topilmadi")

    if not req.items:
        raise HTTPException(status_code=400, detail="Kirim tovarlari kiritilmadi")

    existing_inv = db.query(Purchase).filter(Purchase.invoice_number == req.invoice_number).first()
    if existing_inv:
        raise HTTPException(status_code=400, detail=f"Invoice № [{req.invoice_number}] allaqachon mavjud")

    total_amount = sum(item.quantity * item.cost_price for item in req.items)
    paid_amount = min(req.paid_amount, total_amount)
    debt_amount = total_amount - paid_amount

    status_str = "PAID" if debt_amount <= 0 else ("PARTIAL_PAID" if paid_amount > 0 else "RECEIVED")

    purchase = Purchase(
        invoice_number=req.invoice_number,
        supplier_id=req.supplier_id,
        user_id=current_user.id,
        total_amount=total_amount,
        paid_amount=paid_amount,
        debt_amount=debt_amount,
        status=status_str,
        notes=req.notes
    )

    try:
        db.add(purchase)
        db.flush()

        for item in req.items:
            total_cost = item.quantity * item.cost_price
            p_item = PurchaseItem(
                purchase_id=purchase.id,
                product_id=item.product_id,
                quantity=item.quantity,
                cost_price=item.cost_price,
                selling_price=item.selling_price,
                total_cost=total_cost
            )
            db.add(p_item)

            # Add to stock batch FIFO
            FifoEngine.add_stock(
                db=db,
                product_id=item.product_id,
                quantity=item.quantity,
                cost_price=item.cost_price,
                selling_price=item.selling_price,
                purchase_id=purchase.id,
                user_id=current_user.id
            )

        # Update Supplier Stats
        supplier.total_purchased += total_amount
        supplier.total_paid += paid_amount
        supplier.current_debt += debt_amount

        # Update account payout if paid upfront
        if paid_amount > 0:
            FinancialLedgerEngine.update_account_balance(
                db=db,
                account_type="CASH",
                amount=paid_amount,
                transaction_type="EXPENSE",
                category="PURCHASE",
                description=f"Tovar Kirimi Invoice #{purchase.invoice_number} to'lovi",
                reference_type="PURCHASE",
                reference_id=purchase.id,
                user_id=current_user.id
            )

        AuditService.log(
            db=db,
            user_name=current_user.full_name,
            action="PURCHASE_CREATED",
            entity="Purchase",
            entity_id=purchase.id,
            details=f"Tovar kirimi #{purchase.invoice_number} saqlandi. Jami: {total_amount:,.0f} so'm",
            user_id=current_user.id
        )

        db.commit()
        db.refresh(purchase)
        return purchase
    except Exception as e:
        db.rollback()
        raise e
