import axios from 'axios';
import {
  KpiData, Product, Sale, Purchase, Customer, Supplier, Employee, Expense,
  Account, FinancialTransaction, PnLStatement, AuditLog, StockMovement, Credit, TaskItem,
  Store, DeveloperProfile
} from '../types';

const API_BASE = '/api/v1';

export const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const loginUser = async (username: string, password: string) => {
  const res = await api.post('/auth/login', { username, password });
  return res.data;
};

export const logoutUser = async () => {
  try {
    await api.post('/auth/logout');
  } catch (e) {
    console.error('Logout error:', e);
  } finally {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
};

// --- Developer API Services ---
export const getDeveloperProfile = async (): Promise<DeveloperProfile> => {
  const res = await api.get('/developer/profile');
  return res.data;
};

export const updateDeveloperProfile = async (data: Partial<DeveloperProfile>): Promise<DeveloperProfile> => {
  const res = await api.put('/developer/profile', data);
  return res.data;
};

export const changeDeveloperPassword = async (old_password: string, new_password: string) => {
  const res = await api.put('/developer/change-password', { old_password, new_password });
  return res.data;
};

// --- Stores Multi-Tenant API Services ---
export const getStores = async (): Promise<Store[]> => {
  const res = await api.get('/stores');
  return res.data;
};

export const createStore = async (storeData: any): Promise<Store> => {
  const res = await api.post('/stores', storeData);
  return res.data;
};

export const getStore = async (id: number): Promise<Store> => {
  const res = await api.get(`/stores/${id}`);
  return res.data;
};

export const updateStore = async (id: number, data: Partial<Store>): Promise<Store> => {
  const res = await api.put(`/stores/${id}`, data);
  return res.data;
};

export const createOrUpdateStoreAdmin = async (storeId: number, adminData: any) => {
  const res = await api.post(`/stores/${storeId}/admin`, adminData);
  return res.data;
};

// --- General ERP Services ---
export const getKpis = async (): Promise<KpiData> => {
  const res = await api.get('/dashboard/kpis');
  return res.data;
};

export const getDashboardCharts = async () => {
  const res = await api.get('/dashboard/charts');
  return res.data;
};

export const getProducts = async (search?: string, category?: string): Promise<Product[]> => {
  const res = await api.get('/products', { params: { search, category } });
  return res.data;
};

export const createProduct = async (data: Partial<Product> & { initial_stock?: number }): Promise<Product> => {
  const res = await api.post('/products', data);
  return res.data;
};

export const updateProduct = async (id: number, data: Partial<Product>): Promise<Product> => {
  const res = await api.patch(`/products/${id}`, data);
  return res.data;
};

export const deleteProduct = async (id: number) => {
  const res = await api.delete(`/products/${id}`);
  return res.data;
};

export const getStockMovements = async (productId?: number): Promise<StockMovement[]> => {
  const res = await api.get('/products/movements', { params: { product_id: productId } });
  return res.data;
};

export const getSales = async (): Promise<Sale[]> => {
  const res = await api.get('/sales');
  return res.data;
};

export const createSale = async (saleData: any): Promise<Sale> => {
  const res = await api.post('/sales', saleData);
  return res.data;
};

export const getPurchases = async (): Promise<Purchase[]> => {
  const res = await api.get('/purchases');
  return res.data;
};

export const createPurchase = async (purchaseData: any): Promise<Purchase> => {
  const res = await api.post('/purchases', purchaseData);
  return res.data;
};

export const getCustomers = async (search?: string): Promise<Customer[]> => {
  const res = await api.get('/customers', { params: { search } });
  return res.data;
};

export const createCustomer = async (data: Partial<Customer>): Promise<Customer> => {
  const res = await api.post('/customers', data);
  return res.data;
};

export const payCustomerDebt = async (customer_id: number, amount: number, account_type: string, notes?: string): Promise<Customer> => {
  const res = await api.post('/customers/pay-debt', { customer_id, amount, account_type, notes });
  return res.data;
};

export const getSuppliers = async (search?: string): Promise<Supplier[]> => {
  const res = await api.get('/suppliers', { params: { search } });
  return res.data;
};

export const createSupplier = async (data: Partial<Supplier> & { initial_debt?: number; due_days?: number }): Promise<Supplier> => {
  const res = await api.post('/suppliers', data);
  return res.data;
};

export const paySupplierDebt = async (supplier_id: number, amount: number, account_type: string, notes?: string): Promise<Supplier> => {
  const res = await api.post('/suppliers/pay-debt', { supplier_id, amount, account_type, notes });
  return res.data;
};

export const getEmployees = async (storeId?: number): Promise<Employee[]> => {
  const res = await api.get('/employees', { params: { store_id: storeId } });
  return res.data;
};

export const createEmployee = async (data: Partial<Employee> & { username?: string; password?: string; create_user_login?: boolean; role?: string }): Promise<Employee> => {
  const res = await api.post('/employees', data);
  return res.data;
};

export const addEmployeeAdjustment = async (employee_id: number, type: 'BONUS' | 'ADVANCE' | 'PENALTY', amount: number): Promise<Employee> => {
  const res = await api.post('/employees/adjustment', { employee_id, type, amount });
  return res.data;
};

export const payEmployeeSalary = async (employee_id: number, account_type: string, notes?: string): Promise<Employee> => {
  const res = await api.post('/employees/pay-salary', { employee_id, account_type, notes });
  return res.data;
};

export const deleteEmployee = async (id: number) => {
  const res = await api.delete(`/employees/${id}`);
  return res.data;
};

export const getAccounts = async (): Promise<Account[]> => {
  const res = await api.get('/finance/accounts');
  return res.data;
};

export const getFinancialTransactions = async (): Promise<FinancialTransaction[]> => {
  const res = await api.get('/finance/transactions');
  return res.data;
};

export const getExpenses = async (storeId?: number): Promise<Expense[]> => {
  const res = await api.get('/finance/expenses', { params: { store_id: storeId } });
  return res.data;
};

export const createExpense = async (data: Partial<Expense>): Promise<Expense> => {
  const res = await api.post('/finance/expenses', data);
  return res.data;
};

export const deleteExpense = async (id: number) => {
  const res = await api.delete(`/finance/expenses/${id}`);
  return res.data;
};

export const addIncomeDeposit = async (data: { account_type: string; amount: number; category?: string; notes?: string }) => {
  const res = await api.post('/finance/deposit', data);
  return res.data;
};

export const getPnLReport = async (range: string = 'month'): Promise<PnLStatement> => {
  const res = await api.get('/reports/pnl', { params: { range } });
  return res.data;
};

export const getInventorySummary = async () => {
  const res = await api.get('/reports/inventory-summary');
  return res.data;
};

export const getAuditLogs = async (storeId?: number, actionType?: string): Promise<AuditLog[]> => {
  const res = await api.get('/audit', { params: { store_id: storeId, action_type: actionType } });
  return res.data;
};

export const getCredits = async (storeId?: number): Promise<Credit[]> => {
  const res = await api.get('/credits', { params: { store_id: storeId } });
  return res.data;
};

export const createCredit = async (data: Partial<Credit>): Promise<Credit> => {
  const res = await api.post('/credits', data);
  return res.data;
};

export const updateCredit = async (id: number, data: Partial<Credit>): Promise<Credit> => {
  const res = await api.patch(`/credits/${id}`, data);
  return res.data;
};

export const payCreditInstallment = async (credit_id: number, amount: number, account_type?: string, notes?: string): Promise<Credit> => {
  const res = await api.post(`/credits/${credit_id}/pay`, null, { params: { amount, account_type, notes } });
  return res.data;
};

export const deleteCredit = async (id: number) => {
  const res = await api.delete(`/credits/${id}`);
  return res.data;
};

export const getTasks = async (storeId?: number): Promise<TaskItem[]> => {
  const res = await api.get('/tasks', { params: { store_id: storeId } });
  return res.data;
};

export const createTask = async (data: { title: string; description?: string; reward_price: number; assigned_employee_id?: number }): Promise<TaskItem> => {
  const res = await api.post('/tasks', data);
  return res.data;
};

export const claimTask = async (taskId: number): Promise<TaskItem> => {
  const res = await api.post(`/tasks/${taskId}/start`, {});
  return res.data;
};

export const startTask = async (taskId: number, before_image_url?: string): Promise<TaskItem> => {
  const res = await api.post(`/tasks/${taskId}/start`, { before_image_url });
  return res.data;
};

export const callTaskHelper = async (taskId: number, helper_employee_id: number): Promise<TaskItem> => {
  const res = await api.post(`/tasks/${taskId}/helper`, { helper_employee_id });
  return res.data;
};

export const completeTask = async (taskId: number, after_image_url?: string, proof_notes?: string): Promise<TaskItem> => {
  const res = await api.post(`/tasks/${taskId}/complete`, { after_image_url, proof_notes });
  return res.data;
};

export const approveTask = async (taskId: number): Promise<TaskItem> => {
  const res = await api.post(`/tasks/${taskId}/approve`);
  return res.data;
};

export const deleteTask = async (taskId: number) => {
  const res = await api.delete(`/tasks/${taskId}`);
  return res.data;
};

// --- Attendance (Keldi-Ketdi) APIs ---
export const getAttendanceConfig = async () => {
  const res = await api.get('/attendance/config');
  return res.data;
};

export const getTodayAttendance = async () => {
  const res = await api.get('/attendance/today');
  return res.data;
};

export const checkInAttendance = async (latitude: number, longitude: number, photo_url: string, notes?: string) => {
  const res = await api.post('/attendance/check-in', { latitude, longitude, photo_url, notes });
  return res.data;
};

export const checkOutAttendance = async (latitude: number, longitude: number, photo_url?: string, notes?: string) => {
  const res = await api.post('/attendance/check-out', { latitude, longitude, photo_url, notes });
  return res.data;
};

export const getAttendanceList = async (employee_id?: number, days: number = 7) => {
  const res = await api.get('/attendance/list', { params: { employee_id, days } });
  return res.data;
};
