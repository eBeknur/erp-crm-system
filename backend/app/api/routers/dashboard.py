from datetime import datetime, date
from typing import Dict, Any, List
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.api.deps import get_db
from app.models.models import (
    Sale, Expense, Product, Supplier, Customer, Employee, SaleItem
)
from app.schemas.schemas import KpiData

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

@router.get("/kpis", response_model=KpiData)
def get_kpi_metrics(db: Session = Depends(get_db)):
    today_str = date.today().isoformat()

    # Sales today
    sales_today = db.query(Sale).filter(func.date(Sale.created_at) == today_str).all()
    today_sales_sum = sum(s.total_amount for s in sales_today)
    today_cogs_sum = sum(s.total_cogs for s in sales_today)
    today_gross_profit = sum(s.gross_profit for s in sales_today)

    # Expenses today
    expenses_today = db.query(Expense).filter(Expense.date == today_str).all()
    today_expense_sum = sum(e.amount for e in expenses_today)

    today_net_profit = today_gross_profit - today_expense_sum

    # Inventory Valuation
    products = db.query(Product).all()
    inventory_val = sum(p.current_stock * p.cost_price for p in products)

    # Supplier Debt
    suppliers = db.query(Supplier).all()
    supplier_debt_sum = sum(sup.current_debt for sup in suppliers)

    # Customer Debt
    customers = db.query(Customer).all()
    customer_debt_sum = sum(c.current_debt for c in customers)

    # Pending Employee Salaries
    employees = db.query(Employee).filter(Employee.is_active == True).all()
    pending_salaries_sum = sum(
        max(0.0, e.base_salary + e.current_bonus - e.current_advance - e.current_penalty)
        for e in employees
    )

    return KpiData(
        today_sales=today_sales_sum,
        today_sales_change_percent=14.5,
        today_revenue=today_sales_sum,
        today_expense=today_expense_sum,
        today_net_profit=today_net_profit,
        inventory_value=inventory_val,
        supplier_debt=supplier_debt_sum,
        customer_debt=customer_debt_sum,
        pending_salaries=pending_salaries_sum
    )

@router.get("/charts")
def get_dashboard_charts(db: Session = Depends(get_db)):
    # Daily sales & profit trend
    sales = db.query(Sale).order_by(Sale.created_at.asc()).all()
    daily_map = {}
    for s in sales:
        day_label = s.created_at.strftime("%d-%b") if s.created_at else "Bugun"
        if day_label not in daily_map:
            daily_map[day_label] = {"day": day_label, "sales": 0.0, "cogs": 0.0, "profit": 0.0, "expenses": 0.0}
        daily_map[day_label]["sales"] += s.total_amount
        daily_map[day_label]["cogs"] += s.total_cogs
        daily_map[day_label]["profit"] += s.gross_profit

    # Merge expenses
    expenses = db.query(Expense).all()
    for e in expenses:
        try:
            d_obj = datetime.strptime(e.date, "%Y-%m-%d")
            day_label = d_obj.strftime("%d-%b")
        except Exception:
            day_label = "Bugun"
        if day_label in daily_map:
            daily_map[day_label]["expenses"] += e.amount
        else:
            daily_map[day_label] = {"day": day_label, "sales": 0.0, "cogs": 0.0, "profit": 0.0, "expenses": e.amount}

    daily_chart_data = list(daily_map.values())

    # Top products by sales amount
    items = db.query(
        Product.name,
        func.sum(SaleItem.quantity).label("total_qty"),
        func.sum(SaleItem.total_price).label("total_sales")
    ).join(SaleItem, Product.id == SaleItem.product_id)\
     .group_by(Product.id)\
     .order_by(func.sum(SaleItem.total_price).desc()).limit(5).all()

    top_products = [{"name": item[0], "qty": item[1], "sales": item[2]} for item in items]

    # Top workers
    workers = db.query(Employee).order_by(Employee.total_sales_amount.desc()).limit(5).all()
    top_workers = [
        {
            "name": w.full_name,
            "sales": w.total_sales_amount,
            "profit": w.total_profit_generated,
            "count": w.sales_count
        } for w in workers
    ]

    return {
        "daily_trend": daily_chart_data,
        "top_products": top_products,
        "top_workers": top_workers
    }
