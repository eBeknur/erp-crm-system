import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { WarehouseView } from './features/warehouse/WarehouseView';
import { PurchasesView } from './features/purchases/PurchasesView';
import { SuppliersView } from './features/suppliers/SuppliersView';
import { EmployeesView } from './features/employees/EmployeesView';
import { AttendanceView } from './features/attendance/AttendanceView';
import { FinanceView } from './features/finance/FinanceView';
import { ReportsView } from './features/reports/ReportsView';
import { AuditLogView } from './features/audit/AuditLogView';
import { CreditsView } from './features/credits/CreditsView';
import { TasksView } from './features/tasks/TasksView';
import { LoginView } from './features/auth/LoginView';
import { DeveloperProfileView } from './features/developer/DeveloperProfileView';
import { StoresView } from './features/developer/StoresView';
import { ApiDocsView } from './features/developer/ApiDocsView';
import { User } from './types';
import { ShieldAlert } from 'lucide-react';
import { logoutUser } from './services/api';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('tasks');
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');

    if (savedToken && savedUser) {
      try {
        const parsedUser: User = JSON.parse(savedUser);
        setToken(savedToken);
        setUser(parsedUser);
        setDefaultTabForRole(parsedUser.role);
      } catch (e) {
        console.error('Failed to parse saved user:', e);
      }
    }
    setLoading(false);
  }, []);

  const setDefaultTabForRole = (role: string) => {
    if (role === 'DEVELOPER') {
      setActiveTab('developer_profile');
    } else if (role === 'HR_MANAGER' || role === 'MANAGER') {
      setActiveTab('employees');
    } else {
      setActiveTab('tasks');
    }
  };

  const handleLoginSuccess = (loggedInUser: User, accessToken: string) => {
    setUser(loggedInUser);
    setToken(accessToken);
    setDefaultTabForRole(loggedInUser.role);
  };

  const handleLogout = async () => {
    await logoutUser();
    setUser(null);
    setToken(null);
  };

  if (loading) {
    return (
      <div className="h-screen w-screen bg-white flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!token || !user) {
    return <LoginView onLoginSuccess={handleLoginSuccess} />;
  }

  const role = user.role;
  const isDeveloper = role === 'DEVELOPER';
  const isAdmin = role === 'ADMIN' || role === 'SUPER_ADMIN' || isDeveloper;
  const isHr = role === 'HR_MANAGER' || role === 'MANAGER' || isAdmin;
  const isWorker = role === 'ISHCHI' || role === 'SELLER' || isAdmin;

  const renderAccessDenied = () => (
    <div className="p-6 sm:p-12 max-w-lg mx-auto text-center space-y-4 my-8 bg-rose-50/80 border border-rose-200 rounded-3xl font-sans">
      <div className="w-14 h-14 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto shadow-md">
        <ShieldAlert className="w-7 h-7 text-rose-600" />
      </div>
      <div>
        <h3 className="text-base font-black text-rose-900">🚫 Ruxsat Berilmadi</h3>
        <p className="text-xs text-rose-700 mt-1 font-medium">
          Ushbu bo'lim faqat belgilangan foydalanuvchi roli uchun mo'ljallangan!
        </p>
      </div>
      <button
        onClick={() => setDefaultTabForRole(role)}
        className="px-6 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-full shadow-md"
      >
        Asosiy Bo'limga O'tish
      </button>
    </div>
  );

  const renderContent = () => {
    switch (activeTab) {
      // Developer Specific Pages
      case 'developer_profile':
        return isDeveloper ? <DeveloperProfileView /> : renderAccessDenied();
      case 'stores':
        return isDeveloper ? <StoresView /> : renderAccessDenied();
      case 'api_docs':
        return isDeveloper ? <ApiDocsView /> : renderAccessDenied();

      // General ERP & Operations Pages
      case 'tasks':
        return <TasksView currentUser={user} />;
      case 'warehouse':
        return isWorker ? <WarehouseView currentUser={user} /> : renderAccessDenied();
      case 'purchases':
        return isAdmin ? <PurchasesView /> : renderAccessDenied();
      case 'suppliers':
        return isAdmin ? <SuppliersView /> : renderAccessDenied();
      case 'employees':
        return <EmployeesView currentUser={user} />;
      case 'attendance':
        return <AttendanceView currentUser={user} />;
      case 'credits':
        return isAdmin ? <CreditsView /> : renderAccessDenied();
      case 'finance':
        return isAdmin ? <FinanceView /> : renderAccessDenied();
      case 'reports':
        return isAdmin ? <ReportsView /> : renderAccessDenied();
      case 'audit':
        return isAdmin ? <AuditLogView currentUser={user} /> : renderAccessDenied();
      default:
        return isDeveloper ? <DeveloperProfileView /> : <TasksView currentUser={user} />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-white text-slate-800 font-sans">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={user}
        mobileOpen={mobileOpen}
        setMobileOpen={setMobileOpen}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
        <Header
          onQuickAction={setActiveTab}
          currentUser={user}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setMobileOpen(!mobileOpen)}
        />
        <main className="flex-1 overflow-y-auto bg-white pb-20 md:pb-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default App;
