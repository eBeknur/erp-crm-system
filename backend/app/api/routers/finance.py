from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.api.deps import get_db, get_current_user, verify_store_isolation
from app.models.models import Account, FinancialTransaction, Expense, User
from app.schemas.schemas import ExpenseCreate, ExpenseOut, AccountOut, FinancialTransactionOut
from app.services.audit_service import log_audit

router = APIRouter(prefix="/finance", tags=["Finance & Expenses"])

@router.get("/accounts", response_model=List[AccountOut])
def get_accounts(
    store_id: Optional[int] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_store_id = verify_store_isolation(current_user, store_id)
    query = db.query(Account)
    if target_store_id is not None:
        query = query.filter(Account.store_id == target_store_id)
    accounts = query.all()

    if not accounts:
        defaults = [
            ("Naqd", "CASH"),
            ("Bank", "BANK"),
            ("Click/Payme", "CLICK")
        ]
        for name, acc_type in defaults:
            acc = Account(store_id=target_store_id or current_user.store_id, name=name, account_type=acc_type, balance=0.0)
            db.add(acc)
        db.commit()
        query = db.query(Account)
        if target_store_id is not None:
            query = query.filter(Account.store_id == target_store_id)
        accounts = query.all()

    return accounts

@router.get("/transactions", response_model=List[FinancialTransactionOut])
def get_financial_transactions(
    store_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_store_id = verify_store_isolation(current_user, store_id)
    query = db.query(FinancialTransaction)
    if target_store_id is not None:
        query = query.filter(FinancialTransaction.store_id == target_store_id)
    return query.order_by(FinancialTransaction.id.desc()).limit(limit).all()

@router.get("/expenses", response_model=List[ExpenseOut])
def get_expenses(
    store_id: Optional[int] = None,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    target_store_id = verify_store_isolation(current_user, store_id)
    query = db.query(Expense)
    if target_store_id is not None:
        query = query.filter(Expense.store_id == target_store_id)
    return query.order_by(Expense.id.desc()).limit(limit).all()

@router.post("/expenses", response_model=ExpenseOut)
def create_expense(
    req: ExpenseCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    role_map = {"SUPER_ADMIN": "ADMIN", "MANAGER": "HR_MANAGER"}
    user_role = role_map.get(current_user.role, current_user.role)

    if user_role not in ["ADMIN", "DEVELOPER", "HR_MANAGER"]:
        raise HTTPException(status_code=403, detail="Xarajat qo'shish ruxsat etilmagan!")

    if req.amount <= 0:
        raise HTTPException(status_code=400, detail="Summa noldan katta bo'lishi kerak")

    target_store_id = current_user.store_id

    expense = Expense(
        store_id=target_store_id,
        category_name=req.category_name,
        amount=req.amount,
        date=req.date,
        account_type=req.account_type,
        notes=req.notes,
        user_id=current_user.id
    )
    db.add(expense)
    db.commit()
    db.refresh(expense)

    # Deduct from financial ledger (accounts & financial transactions)
    from app.services.ledger import FinancialLedgerEngine
    FinancialLedgerEngine.update_account_balance(
        db=db,
        account_type=req.account_type,
        amount=req.amount,
        transaction_type="EXPENSE",
        category=req.category_name,
        description=f"Operatsion xarajat: {req.category_name} ({req.notes or ''})",
        reference_type="EXPENSE",
        reference_id=expense.id,
        user_id=current_user.id
    )

    log_audit(
        db=db,
        action_type="ADMIN_ADDED_EXPENSE",
        user=current_user,
        store_id=target_store_id,
        entity="Expense",
        entity_id=expense.id,
        new_value=f"Category: {expense.category_name}, Amount: {expense.amount}",
        request=request,
        notes=f"{user_role} '{current_user.username}' xarajat qo'shdi: {expense.category_name} ({expense.amount} so'm)"
    )

    db.commit()
    db.refresh(expense)
    return expense

@router.delete("/expenses/{expense_id}")
def delete_expense(
    expense_id: int,
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    exp = db.query(Expense).filter(Expense.id == expense_id).first()
    if not exp:
        raise HTTPException(status_code=404, detail="Xarajat topilmadi")

    verify_store_isolation(current_user, exp.store_id)

    # Restore account balance
    from app.services.ledger import FinancialLedgerEngine
    FinancialLedgerEngine.update_account_balance(
        db=db,
        account_type=exp.account_type,
        amount=exp.amount,
        transaction_type="INCOME",
        category=exp.category_name,
        description=f"O'chirilgan xarajat balansi qaytarildi: {exp.category_name}",
        reference_type="EXPENSE_DELETE",
        reference_id=exp.id,
        user_id=current_user.id
    )

    db.delete(exp)
    db.commit()
    return {"message": "Xarajat o'chirildi"}
