import React, { useState, useEffect } from 'react';
import { Search, Bell, ChevronDown, LogOut, CheckSquare, Menu, Layers, Shield, Store as StoreIcon } from 'lucide-react';
import { User as UserType, TaskItem } from '../../types';
import { getTasks } from '../../services/api';

interface HeaderProps {
  onQuickAction: (action: string) => void;
  currentUser?: UserType | null;
  onLogout?: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onQuickAction,
  currentUser,
  onLogout,
  onToggleMobileMenu
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [tasks, setTasks] = useState<TaskItem[]>([]);

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (e) {
      console.error(e);
    }
  };

  const availableTasks = tasks.filter(t => t.status === 'AVAILABLE');

  const isWorker = currentUser?.role === 'ISHCHI' || currentUser?.role === 'SELLER';
  const displayName = currentUser?.full_name || currentUser?.username || 'Foydalanuvchi';
  const displayEmail = currentUser?.email || `${currentUser?.username || 'user'}@supermarket.uz`;

  return (
    <header className={`${isWorker ? 'hidden md:flex' : 'flex'} h-16 bg-white/90 backdrop-blur border-b border-slate-200/80 px-4 sm:px-8 items-center justify-between sticky top-0 z-30 shadow-xs font-sans`}>
      {/* Left: Mobile Toggle & Role Badge */}
      <div className="flex items-center gap-3">
        {!isWorker && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:bg-slate-100 border border-slate-200 transition"
            aria-label="Menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        )}

        <div className="flex items-center gap-2">
          {isDeveloper ? (
            <div className="flex items-center gap-2 px-3 py-1 bg-purple-100 border border-purple-200 rounded-full text-purple-900 text-xs font-black">
              <Shield className="w-3.5 h-3.5 text-purple-600" />
              <span>DEVELOPER MODE</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 px-3 py-1 bg-indigo-50 border border-indigo-100 rounded-full text-indigo-900 text-xs font-bold">
              <StoreIcon className="w-3.5 h-3.5 text-indigo-600" />
              <span>Magazin ID: #{currentUser?.store_id || 1}</span>
            </div>
          )}
        </div>

        {/* Search Bar */}
        <div className="hidden md:relative md:block md:w-64 lg:w-80">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Qidiruv... [Ctrl+K]"
            className="w-full pl-10 pr-4 py-2 bg-slate-100/80 border-none rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition"
          />
        </div>
      </div>

      {/* Right: Actions, Notifications & Profile */}
      <div className="flex items-center gap-3 sm:gap-4">
        {isDeveloper && (
          <button
            onClick={() => onQuickAction('developer_profile')}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-full text-xs font-extrabold shadow-md shadow-purple-600/20 transition"
          >
            <Shield className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Developer Profil</span>
          </button>
        )}

        {/* Notifications Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 relative transition shadow-xs"
          >
            <Bell className="w-4 h-4 text-slate-700" />
            {availableTasks.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white animate-pulse">
                {availableTasks.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 sm:w-80 bg-white border border-slate-200 rounded-3xl shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <h4 className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                  <span>🔴 Bildirishnomalar</span>
                </h4>
                <span onClick={() => { setShowNotifications(false); onQuickAction('tasks'); }} className="text-[10px] text-indigo-600 font-bold cursor-pointer hover:underline">
                  Vazifalar
                </span>
              </div>
              <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
                {availableTasks.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">Hozircha vazifalar mavjud emas</p>
                ) : (
                  availableTasks.map((t) => (
                    <div
                      key={t.id}
                      onClick={() => { setShowNotifications(false); onQuickAction('tasks'); }}
                      className="p-3 rounded-2xl bg-indigo-50/60 border border-indigo-100 text-xs cursor-pointer hover:bg-indigo-100/70 transition space-y-1"
                    >
                      <div className="flex justify-between font-bold text-slate-900">
                        <span>⚡️ {t.title}</span>
                        <span className="text-emerald-600 font-mono">+{new Intl.NumberFormat('uz-UZ').format(t.reward_price)} so'm</span>
                      </div>
                      <p className="text-slate-500 text-[11px]">{t.description || "Tavsif berilmagan"}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Account Menu */}
        <div className="relative">
          <div
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="flex items-center gap-2 cursor-pointer select-none"
          >
            <div className={`w-9 h-9 rounded-full ${isDeveloper ? 'bg-gradient-to-tr from-purple-600 to-indigo-700' : 'bg-gradient-to-tr from-indigo-500 to-blue-600'} border-2 border-white shadow-md text-white flex items-center justify-center font-bold text-xs`}>
              {currentUser?.avatar_url ? (
                <img src={currentUser.avatar_url} alt="Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                displayName.charAt(0).toUpperCase()
              )}
            </div>
            <div className="hidden md:block text-left">
              <p className="text-xs font-bold text-slate-900 leading-tight">{displayName}</p>
              <p className="text-[10px] text-slate-400 font-mono">{currentUser?.role}</p>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </div>

          {showUserMenu && (
            <div className="absolute right-0 mt-3 w-52 bg-white border border-slate-200 rounded-2xl shadow-xl p-2 z-50 animate-in fade-in slide-in-from-top-2">
              {isDeveloper && (
                <button
                  onClick={() => { setShowUserMenu(false); onQuickAction('developer_profile'); }}
                  className="w-full flex items-center gap-2 px-3 py-2 text-purple-700 hover:bg-purple-50 rounded-xl text-xs font-bold transition mb-1"
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Developer Profil</span>
                </button>
              )}
              <button
                onClick={() => { setShowUserMenu(false); if (onLogout) onLogout(); }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 hover:bg-rose-50 rounded-xl text-xs font-bold transition"
              >
                <LogOut className="w-4 h-4" />
                <span>Tizimdan Chiqish (Logout)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
