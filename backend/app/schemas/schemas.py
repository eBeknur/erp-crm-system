from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

# --- Store & Multi-Tenant Schemas ---
class StoreCreate(BaseModel):
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opening_time: str = "08:00"
    closing_time: str = "23:00"
    latitude: float = 41.2995
    longitude: float = 69.2401
    attendance_radius: float = 100.0
    timezone: str = "Asia/Tashkent"
    status: str = "ACTIVE"

    # Optional First ADMIN Creation Details
    create_initial_admin: bool = False
    admin_full_name: Optional[str] = None
    admin_username: Optional[str] = None
    admin_email: Optional[str] = None
    admin_phone: Optional[str] = None
    admin_password: Optional[str] = None

class StoreUpdate(BaseModel):
    name: Optional[str] = None
    code: Optional[str] = None
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opening_time: Optional[str] = None
    closing_time: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    attendance_radius: Optional[float] = None
    timezone: Optional[str] = None
    status: Optional[str] = None

class StoreOut(BaseModel):
    id: int
    name: str
    code: str
    address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    opening_time: str
    closing_time: str
    latitude: float
    longitude: float
    attendance_radius: float
    timezone: str
    status: str
    created_at: datetime
    updated_at: datetime
    admin_full_name: Optional[str] = None
    admin_username: Optional[str] = None
    worker_count: int = 0
    active_users_count: int = 0
    last_activity: Optional[datetime] = None

    class Config:
        from_attributes = True

class StoreAdminCreate(BaseModel):
    full_name: str
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    password: str

# --- Developer Profile Schemas ---
class DeveloperProfileOut(BaseModel):
    id: int
    full_name: str
    username: str
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class DeveloperProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    username: Optional[str] = None

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

# --- Auth & User Schemas ---
class Token(BaseModel):
    access_token: str
    token_type: str
    user: "UserOut"

class LoginRequest(BaseModel):
    username: str
    password: str

class UserCreate(BaseModel):
    username: str
    password: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    role: str = "ADMIN"
    store_id: Optional[int] = None

class UserOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    username: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    avatar_url: Optional[str] = None
    role: str
    is_active: bool
    created_at: datetime
    last_login_at: Optional[datetime] = None

    class Config:
        from_attributes = True

# --- Product Schemas ---
class ProductCreate(BaseModel):
    name: str
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_name: str = "Umumiy"
    unit: str = "dona"
    cost_price: float = 0.0
    selling_price: float = 0.0
    min_stock: float = 5.0
    initial_stock: float = 0.0

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    sku: Optional[str] = None
    barcode: Optional[str] = None
    category_name: Optional[str] = None
    unit: Optional[str] = None
    cost_price: Optional[float] = None
    selling_price: Optional[float] = None
    min_stock: Optional[float] = None
    current_stock: Optional[float] = None

class ProductOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    name: str
    sku: str
    barcode: Optional[str] = None
    category_name: str
    unit: str
    cost_price: float
    selling_price: float
    min_stock: float
    current_stock: float
    created_at: datetime

    class Config:
        from_attributes = True

class StockMovementOut(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity: float
    cost_price: float
    selling_price: float
    reference_type: Optional[str] = None
    reference_id: Optional[int] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

# --- Supplier & Purchase Schemas ---
class SupplierCreate(BaseModel):
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    initial_debt: Optional[float] = 0.0
    due_days: Optional[int] = 30
    notes: Optional[str] = None

class SupplierOut(BaseModel):
    id: int
    name: str
    contact_person: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    total_purchased: float
    total_paid: float
    current_debt: float
    due_days: Optional[int] = 30
    debt_start_date: Optional[datetime] = None
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class PurchaseItemCreate(BaseModel):
    product_id: int
    quantity: float
    cost_price: float
    selling_price: float

class PurchaseCreate(BaseModel):
    supplier_id: int
    invoice_number: str
    paid_amount: float
    items: List[PurchaseItemCreate]
    notes: Optional[str] = None

class PurchaseItemOut(BaseModel):
    id: int
    product_id: int
    quantity: float
    cost_price: float
    selling_price: float
    total_cost: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class PurchaseOut(BaseModel):
    id: int
    invoice_number: str
    supplier_id: int
    total_amount: float
    paid_amount: float
    debt_amount: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    supplier: Optional[SupplierOut] = None
    items: List[PurchaseItemOut] = []

    class Config:
        from_attributes = True

# --- Customer & Employee Schemas ---
class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    notes: Optional[str] = None

class CustomerOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    address: Optional[str] = None
    total_sales: float
    total_paid: float
    current_debt: float
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class EmployeeCreate(BaseModel):
    full_name: str
    phone: Optional[str] = None
    position: str = "Sotuvchi"
    hire_date: Optional[str] = None
    salary_type: str = "MONTHLY"
    base_salary: float = 0.0
    create_user_login: bool = False
    username: Optional[str] = None
    password: Optional[str] = None

class EmployeeOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    full_name: str
    phone: Optional[str] = None
    position: str
    hire_date: Optional[str] = None
    salary_type: str
    base_salary: float
    current_bonus: float
    current_advance: float
    current_penalty: float
    total_sales_amount: float
    total_profit_generated: float
    sales_count: int
    is_active: bool
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class AttendanceCheckInRequest(BaseModel):
    latitude: float
    longitude: float
    photo_url: str
    notes: Optional[str] = None

class AttendanceCheckOutRequest(BaseModel):
    latitude: float
    longitude: float
    photo_url: Optional[str] = None
    notes: Optional[str] = None

class AttendanceCreate(BaseModel):
    employee_id: int
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    notes: Optional[str] = None

class AttendanceOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    employee_id: int
    user_id: Optional[int] = None
    full_name: Optional[str] = None
    check_in_time: datetime
    check_out_time: Optional[datetime] = None
    check_in_photo_url: Optional[str] = None
    check_out_photo_url: Optional[str] = None
    photo_url: Optional[str] = None
    latitude: Optional[float] = None
    longitude: Optional[float] = None
    distance_meters: Optional[float] = None
    is_valid_location: Optional[bool] = True
    late_minutes: Optional[int] = 0
    worked_hours: Optional[float] = 0.0
    worked_time_str: Optional[str] = None
    status: str
    notes: Optional[str] = None
    created_at: datetime
    employee: Optional[EmployeeOut] = None

    class Config:
        from_attributes = True

# --- Sale & Financial Schemas ---
class SaleItemCreate(BaseModel):
    product_id: int
    quantity: float
    unit_price: float

class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    items: List[SaleItemCreate]
    paid_cash: float = 0.0
    paid_card: float = 0.0
    paid_click: float = 0.0
    notes: Optional[str] = None

class SaleItemOut(BaseModel):
    id: int
    product_id: int
    quantity: float
    unit_price: float
    unit_cost: float
    total_price: float
    total_cost: float
    gross_profit: float
    product: Optional[ProductOut] = None

    class Config:
        from_attributes = True

class SaleOut(BaseModel):
    id: int
    sale_number: str
    customer_id: Optional[int] = None
    employee_id: Optional[int] = None
    total_amount: float
    paid_cash: float
    paid_card: float
    paid_click: float
    debt_amount: float
    total_cogs: float
    gross_profit: float
    status: str
    notes: Optional[str] = None
    created_at: datetime
    customer: Optional[CustomerOut] = None
    employee: Optional[EmployeeOut] = None
    items: List[SaleItemOut] = []

    class Config:
        from_attributes = True

class ExpenseCreate(BaseModel):
    category_name: str
    amount: float
    date: str
    account_type: str = "CASH"
    notes: Optional[str] = None

class ExpenseOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    category_name: str
    amount: float
    date: str
    account_type: str
    notes: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int] = None
    user_name: str
    user_role: Optional[str] = None
    store_id: Optional[int] = None
    store_name: Optional[str] = None
    action_type: str
    entity: Optional[str] = None
    entity_id: Optional[int] = None
    changed_data: Optional[str] = None
    old_value: Optional[str] = None
    new_value: Optional[str] = None
    ip_address: Optional[str] = None
    device_info: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CreditCreate(BaseModel):
    title: str
    lender_name: str
    total_amount: float
    monthly_payment: float
    remaining_balance: Optional[float] = None
    interest_rate: float = 0.0
    due_day: int = 10
    notes: Optional[str] = None

class CreditOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    title: str
    lender_name: str
    total_amount: float
    monthly_payment: float
    remaining_balance: float
    interest_rate: float
    due_day: int
    status: str
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class TaskCreate(BaseModel):
    title: str
    description: Optional[str] = None
    reward_price: float = 0.0
    assigned_employee_id: Optional[int] = None

class TaskStart(BaseModel):
    before_image_url: Optional[str] = None

class TaskComplete(BaseModel):
    after_image_url: Optional[str] = None
    proof_image_url: Optional[str] = None
    proof_notes: Optional[str] = None

class TaskCallHelper(BaseModel):
    helper_employee_id: int

class TaskOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    title: str
    description: Optional[str] = None
    reward_price: float
    status: str
    assigned_employee_id: Optional[int] = None
    claimed_employee_id: Optional[int] = None
    helper_employee_id: Optional[int] = None
    claimed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    before_image_url: Optional[str] = None
    after_image_url: Optional[str] = None
    proof_image_url: Optional[str] = None
    proof_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    claimed_employee: Optional[EmployeeOut] = None
    helper_employee: Optional[EmployeeOut] = None

    class Config:
        from_attributes = True

class KpiData(BaseModel):
    today_sales: float = 0.0
    today_sales_change_percent: float = 0.0
    today_revenue: float = 0.0
    today_expense: float = 0.0
    today_net_profit: float = 0.0
    inventory_value: float = 0.0
    supplier_debt: float = 0.0
    customer_debt: float = 0.0
    pending_salaries: float = 0.0

class PnLStatement(BaseModel):
    revenue: float = 0.0
    cogs: float = 0.0
    gross_profit: float = 0.0
    operating_expenses: float = 0.0
    net_profit: float = 0.0
    profit_margin_percent: float = 0.0

class CustomerPaymentCreate(BaseModel):
    customer_id: int
    amount: float
    account_type: str = "CASH"
    notes: Optional[str] = None

class SupplierPaymentCreate(BaseModel):
    supplier_id: int
    amount: float
    account_type: str = "CASH"
    notes: Optional[str] = None

class EmployeeAdjustmentCreate(BaseModel):
    employee_id: int
    type: str
    amount: float

class SalaryPayCreate(BaseModel):
    employee_id: int
    account_type: str = "CASH"
    notes: Optional[str] = None

class AccountOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    name: str
    account_type: str
    balance: float
    updated_at: datetime

    class Config:
        from_attributes = True

class FinancialTransactionOut(BaseModel):
    id: int
    store_id: Optional[int] = None
    account_type: str
    transaction_type: str
    category: str
    amount: float
    description: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True

class CreditUpdate(BaseModel):
    title: Optional[str] = None
    lender_name: Optional[str] = None
    total_amount: Optional[float] = None
    monthly_payment: Optional[float] = None
    remaining_balance: Optional[float] = None
    interest_rate: Optional[float] = None
    due_day: Optional[int] = None
    status: Optional[str] = None
    notes: Optional[str] = None

class CreditPaymentRequest(BaseModel):
    credit_id: int
    amount: float
    account_type: str = "CASH"
    notes: Optional[str] = None

class TaskCompleteRequest(BaseModel):
    proof_image_url: Optional[str] = None
    proof_notes: Optional[str] = None


