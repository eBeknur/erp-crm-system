from datetime import datetime, timezone
from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text, Boolean, Numeric
from sqlalchemy.orm import relationship
from app.core.database import Base

def utc_now():
    return datetime.now(timezone.utc)

class Store(Base):
    """Multi-Tenant Store (Tenant)"""
    __tablename__ = "stores"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False, index=True)
    code = Column(String, unique=True, index=True, nullable=False)  # e.g., STORE-001
    address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    opening_time = Column(String, default="08:00")
    closing_time = Column(String, default="23:00")
    latitude = Column(Float, default=41.2995)
    longitude = Column(Float, default=69.2401)
    attendance_radius = Column(Float, default=100.0)  # meters
    timezone = Column(String, default="Asia/Tashkent")
    status = Column(String, default="ACTIVE")  # ACTIVE, INACTIVE
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    users = relationship("User", back_populates="store", cascade="all, delete-orphan")
    employees = relationship("Employee", back_populates="store", cascade="all, delete-orphan")


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)  # Nullable for DEVELOPER
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=True)
    full_name = Column(String, nullable=False)
    phone = Column(String, nullable=True)
    avatar_url = Column(String, nullable=True)
    hashed_password = Column(String, nullable=False)
    role = Column(String, default="ADMIN")  # DEVELOPER, ADMIN, HR_MANAGER, ISHCHI (also SUPER_ADMIN, MANAGER, SELLER for backward compatibility)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)
    last_login_at = Column(DateTime, nullable=True)

    store = relationship("Store", back_populates="users")


class Category(Base):
    __tablename__ = "categories"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    name = Column(String, index=True, nullable=False)
    sku = Column(String, index=True, nullable=False)
    barcode = Column(String, index=True, nullable=True)
    category_name = Column(String, default="Umumiy")
    unit = Column(String, default="dona")  # dona, kg, metr, pack
    cost_price = Column(Float, default=0.0)      # Standard or latest cost
    selling_price = Column(Float, default=0.0)   # Default sale price
    min_stock = Column(Float, default=5.0)
    current_stock = Column(Float, default=0.0)
    created_at = Column(DateTime, default=utc_now)

    batches = relationship("StockBatch", back_populates="product", cascade="all, delete-orphan")
    movements = relationship("StockMovement", back_populates="product", cascade="all, delete-orphan")


class StockBatch(Base):
    """FIFO Lot/Batch Tracking for inventory valuation"""
    __tablename__ = "stock_batches"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    initial_quantity = Column(Float, nullable=False)
    remaining_quantity = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    created_at = Column(DateTime, default=utc_now)

    product = relationship("Product", back_populates="batches")


class StockMovement(Base):
    """Full Inventory Audit Ledger"""
    __tablename__ = "stock_movements"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    movement_type = Column(String, nullable=False)  # IN, OUT, RETURN, ADJUSTMENT, TRANSFER
    quantity = Column(Float, nullable=False)
    cost_price = Column(Float, default=0.0)
    selling_price = Column(Float, default=0.0)
    reference_type = Column(String, nullable=True)  # PURCHASE, SALE, RETURN, MANUAL
    reference_id = Column(Integer, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    product = relationship("Product", back_populates="movements")


class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    name = Column(String, index=True, nullable=False)
    contact_person = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    total_purchased = Column(Float, default=0.0)
    total_paid = Column(Float, default=0.0)
    current_debt = Column(Float, default=0.0)
    due_days = Column(Integer, default=30)
    debt_start_date = Column(DateTime, default=utc_now)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    purchases = relationship("Purchase", back_populates="supplier")
    payments = relationship("SupplierPayment", back_populates="supplier")


class Purchase(Base):
    __tablename__ = "purchases"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    invoice_number = Column(String, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    total_amount = Column(Float, nullable=False, default=0.0)
    paid_amount = Column(Float, nullable=False, default=0.0)
    debt_amount = Column(Float, nullable=False, default=0.0)
    status = Column(String, default="RECEIVED")  # RECEIVED, PARTIAL_PAID, PAID, CANCELLED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    supplier = relationship("Supplier", back_populates="purchases")
    items = relationship("PurchaseItem", back_populates="purchase", cascade="all, delete-orphan")


class PurchaseItem(Base):
    __tablename__ = "purchase_items"

    id = Column(Integer, primary_key=True, index=True)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    cost_price = Column(Float, nullable=False)
    selling_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)

    purchase = relationship("Purchase", back_populates="items")
    product = relationship("Product")


class SupplierPayment(Base):
    __tablename__ = "supplier_payments"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    purchase_id = Column(Integer, ForeignKey("purchases.id"), nullable=True)
    amount = Column(Float, nullable=False)
    account_type = Column(String, default="CASH")  # CASH, BANK, CLICK
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    supplier = relationship("Supplier", back_populates="payments")


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    name = Column(String, index=True, nullable=False)
    phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    total_sales = Column(Float, default=0.0)
    total_paid = Column(Float, default=0.0)
    current_debt = Column(Float, default=0.0)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    sales = relationship("Sale", back_populates="customer")
    payments = relationship("CustomerPayment", back_populates="customer")


class Employee(Base):
    """Worker / Employee Model"""
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    full_name = Column(String, index=True, nullable=False)
    phone = Column(String, nullable=True)
    position = Column(String, default="Sotuvchi")  # Sotuvchi, HR, Omborchi, Ishchi
    hire_date = Column(String, nullable=True)
    salary_type = Column(String, default="MONTHLY")  # MONTHLY, PERCENTAGE
    base_salary = Column(Float, default=0.0)
    current_bonus = Column(Float, default=0.0)
    current_advance = Column(Float, default=0.0)
    current_penalty = Column(Float, default=0.0)
    total_sales_amount = Column(Float, default=0.0)
    total_profit_generated = Column(Float, default=0.0)
    sales_count = Column(Integer, default=0)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=utc_now)

    store = relationship("Store", back_populates="employees")
    sales = relationship("Sale", back_populates="employee")
    salary_payments = relationship("SalaryPayment", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")


class Attendance(Base):
    """Worker Attendance Record"""
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    check_in_time = Column(DateTime, default=utc_now)
    check_out_time = Column(DateTime, nullable=True)
    check_in_photo_url = Column(Text, nullable=True)
    check_out_photo_url = Column(Text, nullable=True)
    latitude = Column(Float, nullable=True)
    longitude = Column(Float, nullable=True)
    distance_meters = Column(Float, nullable=True)
    is_valid_location = Column(Boolean, default=True)
    late_minutes = Column(Integer, default=0)
    status = Column(String, default="PRESENT")  # PRESENT, LATE, ABSENT, COMPLETED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    employee = relationship("Employee", back_populates="attendances")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    sale_number = Column(String, index=True, nullable=False)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    
    total_amount = Column(Float, nullable=False, default=0.0)
    paid_cash = Column(Float, default=0.0)
    paid_card = Column(Float, default=0.0)
    paid_click = Column(Float, default=0.0)
    debt_amount = Column(Float, default=0.0)
    
    total_cogs = Column(Float, default=0.0)
    gross_profit = Column(Float, default=0.0)
    
    status = Column(String, default="COMPLETED")  # COMPLETED, CANCELLED, RETURNED
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)

    customer = relationship("Customer", back_populates="sales")
    employee = relationship("Employee", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale", cascade="all, delete-orphan")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    unit_cost = Column(Float, nullable=False)  # Computed via FIFO
    total_price = Column(Float, nullable=False)
    total_cost = Column(Float, nullable=False)
    gross_profit = Column(Float, nullable=False)

    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")


class CustomerPayment(Base):
    __tablename__ = "customer_payments"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=False)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=True)
    amount = Column(Float, nullable=False)
    account_type = Column(String, default="CASH")  # CASH, BANK, CLICK
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    customer = relationship("Customer", back_populates="payments")


class SalaryPayment(Base):
    __tablename__ = "salary_payments"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    base_salary = Column(Float, default=0.0)
    bonus = Column(Float, default=0.0)
    advance = Column(Float, default=0.0)
    penalty = Column(Float, default=0.0)
    net_paid = Column(Float, nullable=False)
    account_type = Column(String, default="CASH")  # CASH, BANK, CLICK
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)

    employee = relationship("Employee", back_populates="salary_payments")


class Account(Base):
    __tablename__ = "accounts"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    name = Column(String, nullable=False)  # Naqd, Bank, Click/Payme
    account_type = Column(String, nullable=False)      # CASH, BANK, CLICK
    balance = Column(Float, default=0.0)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class FinancialTransaction(Base):
    __tablename__ = "financial_transactions"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    account_type = Column(String, nullable=False)  # CASH, BANK, CLICK
    transaction_type = Column(String, nullable=False)  # INCOME, EXPENSE
    category = Column(String, nullable=False)  # SALE, CUSTOMER_DEBT_PAYMENT, PURCHASE, SUPPLIER_DEBT_PAYMENT, EXPENSE, SALARY
    amount = Column(Float, nullable=False)
    reference_type = Column(String, nullable=True)
    reference_id = Column(Integer, nullable=True)
    description = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)


class ExpenseCategory(Base):
    __tablename__ = "expense_categories"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    category_name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    date = Column(String, nullable=False)
    account_type = Column(String, default="CASH")  # CASH, BANK, CLICK
    notes = Column(Text, nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)


class AuditLog(Base):
    """Detailed Multi-Tenant Audit Trail Log"""
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=True)
    user_name = Column(String, nullable=False, default="Tizim")
    user_role = Column(String, nullable=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    store_name = Column(String, nullable=True)
    action_type = Column(String, nullable=False)  # ADMIN_CREATED_WORKER, ISHCHI_BEFORE_IMAGE, DEVELOPER_CREATED_STORE, etc.
    entity = Column(String, nullable=True)
    entity_id = Column(Integer, nullable=True)
    changed_data = Column(Text, nullable=True)
    old_value = Column(Text, nullable=True)
    new_value = Column(Text, nullable=True)
    ip_address = Column(String, nullable=True)
    device_info = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)


class Credit(Base):
    """Credit & Loan Management Ledger"""
    __tablename__ = "credits"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    title = Column(String, nullable=False, index=True)
    lender_name = Column(String, nullable=False)  # Bank / Tashkilot nomi
    total_amount = Column(Float, nullable=False, default=0.0)      # Jami kredit summasi
    monthly_payment = Column(Float, nullable=False, default=0.0)   # Oylik to'lov summasi
    remaining_balance = Column(Float, nullable=False, default=0.0) # Qancha qoldiq qolgani
    interest_rate = Column(Float, default=0.0)
    due_day = Column(Integer, default=10) # Har oyning qaysi sanasigacha
    status = Column(String, default="ACTIVE")  # ACTIVE, PAID_OFF
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)


class Task(Base):
    """Worker & Staff Tasks Ledger"""
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    title = Column(String, nullable=False, index=True)
    description = Column(Text, nullable=True)
    reward_price = Column(Float, nullable=False, default=0.0) # Vazifa narxi / mukofoti
    status = Column(String, default="AVAILABLE") # AVAILABLE, IN_PROGRESS, COMPLETED_PENDING_REVIEW, APPROVED, REJECTED
    assigned_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    claimed_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    helper_employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True) # Secondary helper worker
    claimed_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    before_image_url = Column(Text, nullable=True) # Image URL/Base64 uploaded BEFORE starting
    after_image_url = Column(Text, nullable=True)  # Image URL/Base64 uploaded AFTER completing
    proof_image_url = Column(Text, nullable=True) # Base64 or image URL
    proof_notes = Column(Text, nullable=True)
    created_by_user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=utc_now)
    updated_at = Column(DateTime, default=utc_now, onupdate=utc_now)

    claimed_employee = relationship("Employee", foreign_keys=[claimed_employee_id])
    helper_employee = relationship("Employee", foreign_keys=[helper_employee_id])


class Notification(Base):
    """System & Store Notifications"""
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    store_id = Column(Integer, ForeignKey("stores.id"), nullable=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=utc_now)
