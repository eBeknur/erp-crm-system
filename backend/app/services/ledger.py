from sqlalchemy.orm import Session
from fastapi import HTTPException
from app.models.models import (
    Product, StockBatch, StockMovement, Account, FinancialTransaction,
    Customer, Supplier, Employee, AuditLog
)

class FifoEngine:
    @staticmethod
    def consume_stock(db: Session, product_id: int, quantity: float, unit_price: float, reference_type: str = "SALE", reference_id: int = None, user_id: int = None):
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Mahsulot topilmadi")
        
        if product.current_stock < quantity:
            raise HTTPException(
                status_code=400,
                detail=f"❌ Omborda [{product.name}] yetarli emas. Mavjud: {product.current_stock} {product.unit}, Talab: {quantity}"
            )
        
        # Get active stock batches ordered by oldest first (FIFO)
        batches = db.query(StockBatch).filter(
            StockBatch.product_id == product_id,
            StockBatch.remaining_quantity > 0
        ).order_by(StockBatch.created_at.asc()).all()

        remaining_to_consume = quantity
        total_cogs = 0.0

        for batch in batches:
            if remaining_to_consume <= 0:
                break
            
            take = min(batch.remaining_quantity, remaining_to_consume)
            batch.remaining_quantity -= take
            total_cogs += take * batch.cost_price
            remaining_to_consume -= take

        # Fallback if product stock exists but no open batches (e.g. initial manual stock without batches)
        if remaining_to_consume > 0:
            total_cogs += remaining_to_consume * product.cost_price

        # Update current stock
        product.current_stock -= quantity
        unit_cost = total_cogs / quantity if quantity > 0 else product.cost_price
        total_price = quantity * unit_price
        gross_profit = total_price - total_cogs

        # Record stock movement ledger
        movement = StockMovement(
            product_id=product_id,
            movement_type="OUT",
            quantity=quantity,
            cost_price=unit_cost,
            selling_price=unit_price,
            reference_type=reference_type,
            reference_id=reference_id,
            user_id=user_id,
            notes=f"Savdo #{reference_id}"
        )
        db.add(movement)

        return {
            "unit_cost": unit_cost,
            "total_cost": total_cogs,
            "total_price": total_price,
            "gross_profit": gross_profit
        }

    @staticmethod
    def add_stock(db: Session, product_id: int, quantity: float, cost_price: float, selling_price: float, purchase_id: int = None, user_id: int = None):
        product = db.query(Product).filter(Product.id == product_id).first()
        if not product:
            raise HTTPException(status_code=404, detail="Mahsulot topilmadi")

        # Update product current stock and prices
        product.current_stock += quantity
        product.cost_price = cost_price
        if selling_price > 0:
            product.selling_price = selling_price

        # Create stock batch for FIFO
        batch = StockBatch(
            product_id=product_id,
            purchase_id=purchase_id,
            initial_quantity=quantity,
            remaining_quantity=quantity,
            cost_price=cost_price
        )
        db.add(batch)

        # Log movement
        movement = StockMovement(
            product_id=product_id,
            movement_type="IN",
            quantity=quantity,
            cost_price=cost_price,
            selling_price=selling_price,
            reference_type="PURCHASE" if purchase_id else "MANUAL",
            reference_id=purchase_id,
            user_id=user_id,
            notes=f"Kirim #{purchase_id}" if purchase_id else "Dastlabki kirim"
        )
        db.add(movement)


class FinancialLedgerEngine:
    @staticmethod
    def update_account_balance(db: Session, account_type: str, amount: float, transaction_type: str, category: str, description: str = None, reference_type: str = None, reference_id: int = None, user_id: int = None):
        if amount <= 0:
            return

        # Map standard account names
        account_name_map = {
            "CASH": "Naqd",
            "BANK": "Bank",
            "CLICK": "Click/Payme"
        }
        name = account_name_map.get(account_type.upper(), "Naqd")
        
        account = db.query(Account).filter(Account.name == name).first()
        if not account:
            account = Account(name=name, account_type=account_type.upper(), balance=0.0)
            db.add(account)
            db.flush()

        if transaction_type.upper() == "INCOME":
            account.balance += amount
        elif transaction_type.upper() == "EXPENSE":
            account.balance -= amount

        transaction = FinancialTransaction(
            account_type=account_type.upper(),
            transaction_type=transaction_type.upper(),
            category=category,
            amount=amount,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description,
            user_id=user_id
        )
        db.add(transaction)


class AuditService:
    @staticmethod
    def log(db: Session, user_name: str, action: str, entity: str = None, entity_id: int = None, details: str = None, user_id: int = None):
        log_entry = AuditLog(
            user_id=user_id,
            user_name=user_name or "Tizim",
            action_type=action,
            entity=entity,
            entity_id=entity_id,
            changed_data=details
        )
        db.add(log_entry)
