from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user
from app.models.models import Sale, SaleItem, Customer, Employee, Product, User
from app.schemas.schemas import SaleCreate, SaleOut
from app.services.ledger import FifoEngine, FinancialLedgerEngine, AuditService

router = APIRouter(prefix="/sales", tags=["Sales"])

@router.get("", response_model=List[SaleOut])
def list_sales(
    limit: int = 100,
    db: Session = Depends(get_db)
):
    return db.query(Sale).order_by(Sale.id.desc()).limit(limit).all()

@router.get("/{sale_id}", response_model=SaleOut)
def get_sale_detail(sale_id: int, db: Session = Depends(get_db)):
    sale = db.query(Sale).filter(Sale.id == sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Savdo topilmadi")
    return sale

@router.post("", response_model=SaleOut)
def create_sale(
    req: SaleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if not req.items:
        raise HTTPException(status_code=400, detail="Savdo savatchasi bo'sh!")

    # Calculate total sale amount
    total_amount = sum(item.quantity * item.unit_price for item in req.items)
    total_paid = req.paid_cash + req.paid_card + req.paid_click
    expected_debt = max(0.0, total_amount - total_paid)
    debt_amount = req.debt_amount if req.debt_amount > 0 else expected_debt

    if debt_amount > 0 and not req.customer_id:
        raise HTTPException(status_code=400, detail="Qarzga savdo qilish uchun mijoz tanlanishi shart!")

    sale_count = db.query(Sale).count() + 1001
    sale_number = f"#{sale_count}"

    sale = Sale(
        sale_number=sale_number,
        customer_id=req.customer_id,
        employee_id=req.employee_id,
        user_id=current_user.id,
        total_amount=total_amount,
        paid_cash=req.paid_cash,
        paid_card=req.paid_card,
        paid_click=req.paid_click,
        debt_amount=debt_amount,
        total_cogs=0.0,
        gross_profit=0.0,
        status="COMPLETED",
        notes=req.notes
    )

    try:
        db.add(sale)
        db.flush()  # Obtain sale.id

        total_cogs = 0.0
        total_gross_profit = 0.0

        for item_data in req.items:
            consumed = FifoEngine.consume_stock(
                db=db,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                reference_type="SALE",
                reference_id=sale.id,
                user_id=current_user.id
            )

            sale_item = SaleItem(
                sale_id=sale.id,
                product_id=item_data.product_id,
                quantity=item_data.quantity,
                unit_price=item_data.unit_price,
                unit_cost=consumed["unit_cost"],
                total_price=consumed["total_price"],
                total_cost=consumed["total_cost"],
                gross_profit=consumed["gross_profit"]
            )
            db.add(sale_item)

            total_cogs += consumed["total_cost"]
            total_gross_profit += consumed["gross_profit"]

        sale.total_cogs = total_cogs
        sale.gross_profit = total_gross_profit

        # Financial Ledger updates
        if req.paid_cash > 0:
            FinancialLedgerEngine.update_account_balance(
                db=db, account_type="CASH", amount=req.paid_cash,
                transaction_type="INCOME", category="SALE",
                description=f"Savdo {sale.sale_number} (Naqd)",
                reference_type="SALE", reference_id=sale.id, user_id=current_user.id
            )
        if req.paid_card > 0:
            FinancialLedgerEngine.update_account_balance(
                db=db, account_type="BANK", amount=req.paid_card,
                transaction_type="INCOME", category="SALE",
                description=f"Savdo {sale.sale_number} (Karta)",
                reference_type="SALE", reference_id=sale.id, user_id=current_user.id
            )
        if req.paid_click > 0:
            FinancialLedgerEngine.update_account_balance(
                db=db, account_type="CLICK", amount=req.paid_click,
                transaction_type="INCOME", category="SALE",
                description=f"Savdo {sale.sale_number} (Click/Payme)",
                reference_type="SALE", reference_id=sale.id, user_id=current_user.id
            )

        # Customer debt update
        if req.customer_id:
            customer = db.query(Customer).filter(Customer.id == req.customer_id).first()
            if customer:
                customer.total_sales += total_amount
                customer.total_paid += total_paid
                customer.current_debt += debt_amount

        # Employee performance update
        if req.employee_id:
            emp = db.query(Employee).filter(Employee.id == req.employee_id).first()
            if emp:
                emp.total_sales_amount += total_amount
                emp.total_profit_generated += total_gross_profit
                emp.sales_count += 1

        AuditService.log(
            db=db,
            user_name=current_user.full_name,
            action="SALE_CREATED",
            entity="Sale",
            entity_id=sale.id,
            details=f"Savdo {sale.sale_number} yaratildi. Jami: {total_amount:,.0f} so'm, Foyda: {total_gross_profit:,.0f} so'm",
            user_id=current_user.id
        )

        db.commit()
        db.refresh(sale)
        return sale
    except Exception as e:
        db.rollback()
        raise e
