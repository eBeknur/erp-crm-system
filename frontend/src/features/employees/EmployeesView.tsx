import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Phone, DollarSign, Award, AlertCircle, Trash2, CheckCircle2, X, Lock, Shield, User, Briefcase } from 'lucide-react';
import { getEmployees, createEmployee, addEmployeeAdjustment, deleteEmployee } from '../../services/api';
import { Employee, User as UserType } from '../../types';

interface EmployeesViewProps {
  currentUser?: UserType | null;
}

export const EmployeesView: React.FC<EmployeesViewProps> = ({ currentUser }) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Adjustment Modal State
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [adjType, setAdjType] = useState<'BONUS' | 'ADVANCE' | 'PENALTY'>('BONUS');
  const [adjAmount, setAdjAmount] = useState<number>(100000);
  const [showAdjModal, setShowAdjModal] = useState(false);

  // Form State for creating new employee
  const [formData, setFormData] = useState({
    full_name: '',
    phone: '',
    position: 'Sotuvchi',
    username: '',
    password: '',
    salary_type: 'MONTHLY' as 'MONTHLY' | 'HOURLY',
    base_salary: 4000000,
    create_user_login: true,
  });

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER' || currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'HR_MANAGER' || currentUser?.role === 'MANAGER';

  useEffect(() => {
    fetchEmployeesData();
    // Smart lightweight polling every 10 seconds (only when tab is visible)
    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchEmployeesData();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchEmployeesData = async () => {
    setLoading(true);
    try {
      const data = await getEmployees();
      setEmployees(data);
    } catch (err) {
      console.error('Failed to fetch employees:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name) {
      setMessage({ type: 'error', text: "Ishchining ismini kiriting!" });
      return;
    }

    setSubmitting(true);
    setMessage(null);
    try {
      await createEmployee({
        full_name: formData.full_name,
        phone: formData.phone,
        position: formData.position,
        salary_type: formData.salary_type,
        base_salary: Number(formData.base_salary),
        username: formData.username || undefined,
        password: formData.password || undefined,
        create_user_login: formData.create_user_login,
      });

      setMessage({ type: 'success', text: `🎉 Yangi ishchi '${formData.full_name}' muvaffaqiyatli qo'shildi!` });
      setShowAddModal(false);
      setFormData({
        full_name: '',
        phone: '',
        position: 'Sotuvchi',
        username: '',
        password: '',
        salary_type: 'MONTHLY',
        base_salary: 4000000,
        create_user_login: true,
      });
      fetchEmployeesData();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Ishchini saqlashda xatolik yuz berdi!";
      setMessage({ type: 'error', text: errMsg });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAdjustmentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp || adjAmount <= 0) return;

    setSubmitting(true);
    try {
      await addEmployeeAdjustment(selectedEmp.id, adjType, adjAmount);
      setMessage({
        type: 'success',
        text: `✅ ${selectedEmp.full_name} uchun ${adjType} (${adjAmount.toLocaleString('uz-UZ')} so'm) saqlandi!`
      });
      setShowAdjModal(false);
      fetchEmployeesData();
    } catch (err: any) {
      setMessage({ type: 'error', text: "O'zgartirishni saqlashda xatolik" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Haqiqatan ham '${name}' ishchisini o'chirmoqchimisiz?`)) return;
    try {
      await deleteEmployee(id);
      setMessage({ type: 'success', text: `Ishchi '${name}' o'chirildi.` });
      fetchEmployeesData();
    } catch (err) {
      setMessage({ type: 'error', text: "Ishchini o'chirishda xatolik" });
    }
  };

  const totalEmployees = employees.length;
  const totalBaseSalary = employees.reduce((acc, curr) => acc + (curr.base_salary || 0), 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-6xl mx-auto font-sans">
      {/* Header Banner & Stat Cards */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Users className="w-6 h-6 text-indigo-600" />
            <span>👥 Ishchilar Ro'yxati & Xodimlar Boshqaruvi</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Magazin ishchilarini boshqarish, yangi xodimlarni ro'yxatdan o'tkazish va oylik ish haqlarini belgilash.
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddModal(true)}
            className="px-6 py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-full shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>➕ Yangi Ishchi Qo'shish</span>
          </button>
        )}
      </div>

      {/* Global Notification Banner */}
      {message && (
        <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center justify-between transition ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-900 border-emerald-200' : 'bg-rose-50 text-rose-900 border-rose-200'
        }`}>
          <div className="flex items-center gap-2">
            {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
            <span>{message.text}</span>
          </div>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/80 space-y-1">
          <span className="text-[10px] text-slate-400 font-extrabold uppercase block">Jami Xodimlar Soni</span>
          <span className="text-2xl font-black text-slate-900 block font-mono">{totalEmployees} ta ishchi</span>
        </div>

        <div className="bg-indigo-50/70 p-5 rounded-3xl border border-indigo-200 space-y-1">
          <span className="text-[10px] text-indigo-700 font-extrabold uppercase block">Umumiy Oylik Ish Haqi</span>
          <span className="text-2xl font-black text-indigo-900 block font-mono">{totalBaseSalary.toLocaleString('uz-UZ')} so'm</span>
        </div>

        <div className="bg-emerald-50/70 p-5 rounded-3xl border border-emerald-200 space-y-1">
          <span className="text-[10px] text-emerald-800 font-extrabold uppercase block">Tizim Turi</span>
          <span className="text-base font-black text-emerald-900 block">Faol Ishchilar Bazasi</span>
        </div>
      </div>

      {/* Employee List Grid */}
      <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
        <h3 className="text-base font-black text-slate-900 border-b border-slate-100 pb-3 flex items-center justify-between">
          <span>📋 Barcha Xodimlar Ro'yxati</span>
          <span className="text-xs font-bold text-slate-400">{employees.length} ta xodim</span>
        </h3>

        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto"></div>
            <span className="text-xs text-slate-400 block mt-2 font-medium">Xodimlar yuklanmoqda...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Users className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Hali xodimlar qo'shilmagan.</p>
            {isAdmin && (
              <button
                onClick={() => setShowAddModal(true)}
                className="inline-block text-xs font-black text-indigo-600 hover:underline cursor-pointer"
              >
                + Yangi Ishchi Qo'shish
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {employees.map((emp) => (
              <div key={emp.id} className="bg-slate-50 border border-slate-200/80 rounded-3xl p-5 space-y-4 hover:shadow-md transition flex flex-col justify-between">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white font-black flex items-center justify-center text-base shadow-md shadow-indigo-600/20">
                      {emp.full_name?.charAt(0) || 'I'}
                    </div>
                    <span className="text-[10px] font-black px-3 py-1 rounded-full bg-indigo-100 text-indigo-800 border border-indigo-200">
                      {emp.position || 'Sotuvchi'}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-base font-black text-slate-900">{emp.full_name}</h4>
                    {emp.phone && (
                      <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5 font-medium">
                        <Phone className="w-3.5 h-3.5 text-slate-400" />
                        <span>{emp.phone}</span>
                      </p>
                    )}
                  </div>

                  <div className="bg-white p-3 rounded-2xl border border-slate-200 text-xs space-y-1 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-400 font-sans">Oylik Maoshi:</span>
                      <strong className="text-slate-900 font-black">{(emp.base_salary || 0).toLocaleString('uz-UZ')} so'm</strong>
                    </div>
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-400 font-sans">Maosh turi:</span>
                      <span className="text-slate-600 font-bold">{emp.salary_type === 'HOURLY' ? 'Soatbay' : 'Oylik'}</span>
                    </div>
                  </div>
                </div>

                {isAdmin && (
                  <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => { setSelectedEmp(emp); setShowAdjModal(true); }}
                      className="flex-1 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Award className="w-3.5 h-3.5" />
                      <span>Bonus/Jarima</span>
                    </button>

                    <button
                      onClick={() => handleDelete(emp.id, emp.full_name)}
                      className="p-2 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* MODAL: Yangi Ishchi Yaratish */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 space-y-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">➕ Yangi Ishchi Yaratish</h3>
                  <p className="text-xs text-slate-400 font-medium">Tizim uchun yangi xodim profili va logini</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">F.I.SH (Ismi va Sharifi)*</label>
                <input
                  type="text"
                  required
                  placeholder="Masalan: Sardor Bozorov"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Telefon Raqami</label>
                  <input
                    type="text"
                    placeholder="+998 90 123 45 67"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Lavozimi</label>
                  <select
                    value={formData.position}
                    onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Sotuvchi">Sotuvchi</option>
                    <option value="Ishchi">Ishchi</option>
                    <option value="Menedjer">Menedjer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Oylik Ish Haqi (so'm)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={formData.base_salary}
                    onChange={(e) => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700 block">Maosh Turi</label>
                  <select
                    value={formData.salary_type}
                    onChange={(e) => setFormData({ ...formData, salary_type: e.target.value as 'MONTHLY' | 'HOURLY' })}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="MONTHLY">Oylik Maosh</option>
                    <option value="HOURLY">Soatbay Maosh</option>
                  </select>
                </div>
              </div>

              {/* Tizimga Kirish Akkaunti Yaratish (Login & Parol) */}
              <div className="bg-indigo-50/60 p-4 rounded-2xl border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900 flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-indigo-600" />
                    <span>Tizimga Kirish Logini & Paroli Yaratish</span>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-indigo-800 uppercase block">Login (Username)</label>
                    <input
                      type="text"
                      placeholder="Masalan: sardor123"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono focus:outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-extrabold text-indigo-800 uppercase block">Parol</label>
                    <input
                      type="password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="w-full px-3 py-2 bg-white border border-indigo-200 rounded-xl text-xs font-mono focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs rounded-full shadow-lg shadow-indigo-600/30 transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>{submitting ? 'Saqlanmoqda...' : 'Ishchini Saqlash'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Bonus & Jarima (Adjustment) */}
      {showAdjModal && selectedEmp && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 space-y-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">🎁 Bonus / Jarima Qo'shish</h3>
              <button onClick={() => setShowAdjModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAdjustmentSubmit} className="space-y-4">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 text-xs">
                <span className="text-slate-400 block">Xodim:</span>
                <strong className="text-slate-900 font-black text-sm">{selectedEmp.full_name}</strong>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Amal Turi</label>
                <select
                  value={adjType}
                  onChange={(e) => setAdjType(e.target.value as any)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-bold"
                >
                  <option value="BONUS">🟢 BONUS (Mukofot)</option>
                  <option value="ADVANCE">🔵 AVANS (Oldindan to'lov)</option>
                  <option value="PENALTY">🔴 JARIMA (Ushlab qolish)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700 block">Summa (so'm)</label>
                <input
                  type="number"
                  min="1000"
                  step="50000"
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(Number(e.target.value))}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black font-mono"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAdjModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-full"
                >
                  Bekor Qilish
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 bg-indigo-600 text-white font-black text-xs rounded-full shadow-md"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
