import React from 'react';
import {
  History, Package, ArrowDownToLine,
  Building2, UserCheck, DollarSign, BarChart3, ShieldCheck, Rocket, Layers, Landmark, CheckSquare, X, ShoppingBag,
  User, Code, Users, Clock
} from 'lucide-react';
import { User as UserType } from '../../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  currentUser?: UserType | null;
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  mobileOpen = false,
  setMobileOpen
}) => {
  const userRole = currentUser?.role || 'ADMIN';
  const isDeveloper = userRole === 'DEVELOPER';

  const menuItems: { id: string; label: string; icon: any; badge?: string; allowedRoles: string[] }[] = [
    // Developer Specific Tabs
    { id: 'developer_profile', label: 'Developer Profil', icon: User, badge: 'DEV', allowedRoles: ['DEVELOPER'] },
    { id: 'stores', label: 'Magazinlar (Stores)', icon: Layers, badge: 'Multi-Tenant', allowedRoles: ['DEVELOPER'] },
    { id: 'audit', label: 'Audit Loglar & Texnik', icon: ShieldCheck, badge: 'Audit', allowedRoles: ['DEVELOPER', 'ADMIN', 'SUPER_ADMIN'] },
    { id: 'api_docs', label: 'API Hujjatlar', icon: Code, badge: 'API', allowedRoles: ['DEVELOPER'] },

    // Store Admin & Operations Tabs
    { id: 'tasks', label: 'Vazifalar Boshqaruvi', icon: CheckSquare, badge: 'Tasks', allowedRoles: ['DEVELOPER', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'ISHCHI', 'SELLER'] },
    { id: 'warehouse', label: 'Ombor & Tovarlar', icon: Package, allowedRoles: ['ADMIN', 'SUPER_ADMIN', 'ISHCHI', 'SELLER'] },
    { id: 'purchases', label: 'Tovar Kirimi', icon: ArrowDownToLine, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'suppliers', label: 'Postavshiklar', icon: Building2, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'employees', label: "Ishchilar Ro'yxati", icon: Users, allowedRoles: ['DEVELOPER', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER'] },
    { id: 'attendance', label: "Nazorat", icon: Clock, badge: 'Shift 09:00', allowedRoles: ['DEVELOPER', 'ADMIN', 'SUPER_ADMIN', 'HR_MANAGER', 'MANAGER', 'ISHCHI', 'SELLER'] },
    { id: 'credits', label: "Kreditlar Bo'limi", icon: Landmark, badge: 'Kredit', allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'finance', label: 'Moliya & Xarajatlar', icon: DollarSign, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
    { id: 'reports', label: 'Hisobotlar (Analytics)', icon: BarChart3, allowedRoles: ['ADMIN', 'SUPER_ADMIN'] },
  ];

  // Filter menu items per role
  const visibleMenuItems = menuItems.filter(item => item.allowedRoles.includes(userRole));

  const handleTabClick = (id: string) => {
    setActiveTab(id);
    if (setMobileOpen) {
      setMobileOpen(false);
    }
  };

  const bottomBarItems = visibleMenuItems.slice(0, 4);

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen && setMobileOpen(false)}
          className="md:hidden fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-40 animate-in fade-in"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed md:sticky top-0 left-0 h-screen w-72 md:w-64 bg-white border-r border-slate-200/80 flex flex-col select-none shadow-xl md:shadow-xs z-50 transition-transform duration-300 font-sans ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="p-5 sm:p-6 flex items-center justify-between border-b border-slate-100 md:border-none">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${isDeveloper ? 'bg-gradient-to-br from-purple-600 to-indigo-900' : 'bg-slate-900'} flex items-center justify-center text-white font-extrabold shadow-md`}>
              <Layers className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-base tracking-tight flex items-center gap-1">
                <span>Supermarket</span>
                <span className={isDeveloper ? "text-purple-600 font-extrabold" : "text-indigo-600"}>CRM</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                {isDeveloper ? "DEVELOPER CORE" : "STORE MANAGEMENT"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen && setMobileOpen(false)}
            className="md:hidden p-2 text-slate-400 hover:text-slate-900 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation List */}
        <nav className="flex-1 overflow-y-auto px-4 py-3 space-y-1">
          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleTabClick(item.id)}
                className={`w-full flex items-center justify-between px-4 py-3 md:py-2.5 rounded-2xl text-xs font-extrabold transition-all duration-200 ${
                  isActive
                    ? isDeveloper
                      ? 'bg-purple-600 text-white shadow-md shadow-purple-600/25'
                      : 'bg-indigo-600 text-white shadow-md shadow-indigo-600/25'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4.5 h-4.5 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                      isActive
                        ? 'bg-white/20 text-white'
                        : isDeveloper
                        ? 'bg-purple-100 text-purple-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Role Identity Card */}
        <div className={`p-4 m-4 rounded-3xl text-center space-y-2 relative overflow-hidden border ${isDeveloper ? 'bg-gradient-to-br from-purple-50 to-indigo-50 border-purple-200' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`w-8 h-8 rounded-xl bg-white shadow-sm flex items-center justify-center mx-auto ${isDeveloper ? 'text-purple-600' : 'text-indigo-600'}`}>
            <Rocket className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-black text-slate-900">{currentUser?.full_name || 'User'}</h4>
            <p className={`text-[10px] font-bold uppercase tracking-wider ${isDeveloper ? 'text-purple-700' : 'text-indigo-700'}`}>
              Rol: {userRole}
            </p>
          </div>
        </div>
      </aside>

      {/* Mobile Touch Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur border-t border-slate-200 px-2 py-2 flex items-center justify-around z-30 shadow-2xl select-none">
        {bottomBarItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleTabClick(item.id)}
              className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-2xl transition-all ${
                isActive ? 'text-indigo-600 font-black' : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              <div className={`p-1 rounded-xl ${isActive ? 'bg-indigo-50 text-indigo-600' : ''}`}>
                <Icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold tracking-tight">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
