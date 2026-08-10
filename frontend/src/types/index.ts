export interface User {
  id: number;
  store_id?: number;
  username: string;
  full_name: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: 'DEVELOPER' | 'ADMIN' | 'HR_MANAGER' | 'ISHCHI' | 'SUPER_ADMIN' | 'MANAGER' | 'SELLER';
  is_active: boolean;
  created_at?: string;
  last_login_at?: string;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  address?: string;
  phone?: string;
  email?: string;
  opening_time: string;
  closing_time: string;
  latitude: number;
  longitude: number;
  attendance_radius: number;
  timezone: string;
  status: 'ACTIVE' | 'INACTIVE';
  created_at: string;
  updated_at: string;
  admin_full_name?: string;
  admin_username?: string;
  worker_count: number;
  active_users_count: number;
  last_activity?: string;
}

export interface DeveloperProfile {
  id: number;
  full_name: string;
  username: string;
  email?: string;
  phone?: string;
  avatar_url?: string;
  role: string;
  is_active: boolean;
  created_at: string;
  last_login_at?: string;
}

export interface AuditLog {
  id: number;
  user_id?: number;
  user_name: string;
  user_role?: string;
  store_id?: number;
  store_name?: string;
  action_type: string;
  entity?: string;
  entity_id?: number;
  changed_data?: string;
  old_value?: string;
  new_value?: string;
  ip_address?: string;
  device_info?: string;
  created_at: string;
}

export interface KpiData {
  today_sales: number;
  today_sales_change_percent: number;
  today_revenue: number;
  today_expense: number;
  today_net_profit: number;
  inventory_value: number;
  supplier_debt: number;
  customer_debt: number;
  pending_salaries: number;
}

export interface PnLStatement {
  revenue: number;
  cogs: number;
  gross_profit: number;
  operating_expenses: number;
  net_profit: number;
  profit_margin_percent: number;
}

export interface Product {
  id: number;
  store_id?: number;
  name: string;
  sku: string;
  barcode?: string;
  category_name: string;
  unit: string;
  cost_price: number;
  selling_price: number;
  min_stock: number;
  current_stock: number;
  created_at: string;
}

export interface StockMovement {
  id: number;
  product_id: number;
  movement_type: 'IN' | 'OUT' | 'RETURN' | 'ADJUSTMENT' | 'TRANSFER';
  quantity: number;
  cost_price: number;
  selling_price: number;
  reference_type?: string;
  reference_id?: number;
  notes?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  store_id?: number;
  name: string;
  contact_person?: string;
  phone?: string;
  address?: string;
  total_purchased: number;
  total_paid: number;
  current_debt: number;
  due_days?: number;
  debt_start_date?: string;
  notes?: string;
  created_at: string;
}

export interface Customer {
  id: number;
  store_id?: number;
  name: string;
  phone?: string;
  address?: string;
  total_sales: number;
  total_paid: number;
  current_debt: number;
  notes?: string;
  created_at: string;
}

export interface Employee {
  id: number;
  store_id?: number;
  user_id?: number;
  full_name: string;
  phone?: string;
  position: string;
  hire_date?: string;
  salary_type: string;
  base_salary: number;
  current_bonus: number;
  current_advance: number;
  current_penalty: number;
  total_sales_amount: number;
  total_profit_generated: number;
  sales_count: number;
  is_active: boolean;
  created_at?: string;
}

export interface SaleItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  unit_cost: number;
  total_price: number;
  total_cost: number;
  gross_profit: number;
  product?: Product;
}

export interface Sale {
  id: number;
  store_id?: number;
  sale_number: string;
  customer_id?: number;
  employee_id?: number;
  total_amount: number;
  paid_cash: number;
  paid_card: number;
  paid_click: number;
  debt_amount: number;
  total_cogs: number;
  gross_profit: number;
  status: string;
  notes?: string;
  created_at: string;
  customer?: Customer;
  employee?: Employee;
  items: SaleItem[];
}

export interface PurchaseItem {
  id: number;
  product_id: number;
  quantity: number;
  cost_price: number;
  selling_price: number;
  total_cost: number;
  product?: Product;
}

export interface Purchase {
  id: number;
  store_id?: number;
  invoice_number: string;
  supplier_id: number;
  total_amount: number;
  paid_amount: number;
  debt_amount: number;
  status: string;
  notes?: string;
  created_at: string;
  supplier?: Supplier;
  items: PurchaseItem[];
}

export interface Expense {
  id: number;
  store_id?: number;
  category_name: string;
  amount: number;
  date: string;
  account_type: string;
  notes?: string;
  created_at: string;
}

export interface Account {
  id: number;
  store_id?: number;
  name: string;
  account_type: string;
  balance: number;
  updated_at: string;
}

export interface FinancialTransaction {
  id: number;
  store_id?: number;
  account_type: string;
  transaction_type: 'INCOME' | 'EXPENSE';
  category: string;
  amount: number;
  description?: string;
  created_at: string;
}

export interface Credit {
  id: number;
  store_id?: number;
  title: string;
  lender_name: string;
  total_amount: number;
  monthly_payment: number;
  remaining_balance: number;
  interest_rate: number;
  due_day: number;
  status: 'ACTIVE' | 'PAID_OFF';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface TaskItem {
  id: number;
  store_id?: number;
  title: string;
  description?: string;
  reward_price: number;
  status: 'AVAILABLE' | 'IN_PROGRESS' | 'COMPLETED_PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
  assigned_employee_id?: number;
  claimed_employee_id?: number;
  helper_employee_id?: number;
  claimed_at?: string;
  completed_at?: string;
  before_image_url?: string;
  after_image_url?: string;
  proof_image_url?: string;
  proof_notes?: string;
  created_at: string;
  updated_at: string;
  claimed_employee?: Employee;
  helper_employee?: Employee;
}

export interface AttendanceItem {
  id: number;
  store_id?: number;
  employee_id: number;
  user_id?: number;
  full_name?: string;
  check_in_time: string;
  check_out_time?: string;
  check_in_photo_url?: string;
  check_out_photo_url?: string;
  photo_url?: string;
  latitude?: number;
  longitude?: number;
  distance_meters?: number;
  is_valid_location?: boolean;
  late_minutes?: number;
  worked_hours?: number;
  worked_time_str?: string;
  status: 'PRESENT' | 'LATE' | 'ABSENT' | 'COMPLETED';
  notes?: string;
  created_at: string;
  employee?: Employee;
}
