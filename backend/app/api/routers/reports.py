from typing import Dict, Any, Optional
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.api.deps import get_db
from app.models.models import Sale, Expense, Product
from app.schemas.schemas import PnLStatement

router = APIRouter(prefix="/reports", tags=["Reports"])

@router.get("/pnl", response_model=PnLStatement)
def get_pnl_statement(
    range: Optional[str] = "month",
    db: Session = Depends(get_db)
):
    now = datetime.now(timezone.utc)
    
    if range == "today":
        start_date = now.replace(hour=0, minute=0, second=0, microsecond=0)
    elif range == "week":
        start_date = now - timedelta(days=7)
    elif range == "year":
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
    else:  # month (default)
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    sales = db.query(Sale).filter(Sale.created_at >= start_date).all()
    total_revenue = sum(s.total_amount for s in sales)
    total_cogs = sum(s.total_cogs for s in sales)
    gross_profit = total_revenue - total_cogs

    expenses = db.query(Expense).filter(Expense.created_at >= start_date).all()
    total_expenses = sum(e.amount for e in expenses)

    net_profit = gross_profit - total_expenses
    profit_margin = (net_profit / total_revenue * 100) if total_revenue > 0 else 0.0

    return PnLStatement(
        revenue=total_revenue,
        cogs=total_cogs,
        gross_profit=gross_profit,
        operating_expenses=total_expenses,
        net_profit=net_profit,
        profit_margin_percent=round(profit_margin, 2)
    )

@router.get("/inventory-summary")
def get_inventory_report(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    total_items = len(products)
    total_stock_qty = sum(p.current_stock for p in products)
    total_valuation = sum(p.current_stock * p.cost_price for p in products)
    low_stock_items = [p for p in products if p.current_stock <= p.min_stock]

    return {
        "total_items": total_items,
        "total_stock_quantity": total_stock_qty,
        "total_valuation": total_valuation,
        "low_stock_count": len(low_stock_items),
        "low_stock_products": [
            {
                "id": p.id,
                "name": p.name,
                "sku": p.sku,
                "current_stock": p.current_stock,
                "min_stock": p.min_stock
            } for p in low_stock_items
        ]
    }
