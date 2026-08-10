import React, { useState, useEffect } from 'react';
import { Receipt, Plus, Trash2, Calendar, Coffee, Car, FileText, Wrench, Package, Utensils, Zap } from 'lucide-react';
import { getExpenses, createExpense, deleteExpense } from '../../services/api';
import { Expense } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const PettyCashView: React.FC = () => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [categoryName, setCategoryName] = useState('Tushlik / Oziq-ovqat');
  const [amount, setAmount] = useState<number | ''>('');
  const [accountType, setAccountType] = useState('CASH');
  const [notes, setNotes] = useState('');

  const quickCategories = [
    { label: 'Tushlik / Oziq-ovqat', icon: Utensils, color: 'bg-amber-50 text-amber-600 border-amber-200' },
    { label: 'Transport / Taksi', icon: Car, color: 'bg-blue-50 text-blue-600 border-blue-200' },
    { label: 'Kanselyariya & Qog\'oz', icon: FileText, color: 'bg-purple-50 text-purple-600 border-purple-200' },
    { label: 'Kofe / Choy / Suv', icon: Coffee, color: 'bg-orange-50 text-orange-600 border-orange-200' },
    { label: 'Kichik ta\'mirlash', icon: Wrench, color: 'bg-slate-100 text-slate-700 border-slate-200' },
    { label: 'Mayda xaridlar', icon: Package, color: 'bg-emerald-50 text-emerald-600 border-emerald-200' },
    { label: 'Boshqa kichik chiqim', icon: Zap, color: 'bg-rose-50 text-rose-600 border-rose-200' },
  ];

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const data = await getExpenses();
      setExpenses(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filter minor expenses (category containing 'Tushlik', 'Transport', 'Kanselyariya', 'Kofe', 'ta\'mirlash', 'Mayda', 'Kichik', etc.)
  const isMinorCategory = (cat: string) => {
    const lower = cat.toLowerCase();
    return lower.includes('tushlik') || lower.includes('transport') || lower.includes('taksi') ||
           lower.includes('kanselyariya') || lower.includes('kofe') || lower.includes('choy') ||
           lower.includes('ta\'mirlash') || lower.includes('mayda') || lower.includes('kichik') ||
           lower.includes('oziq-ovqat');
  };

  const pettyExpenses = expenses.filter(e => isMinorCategory(e.category_name));

  const handleCreatePettyExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;
    try {
      await createExpense({
        category_name: `Kichik Chiqim: ${categoryName}`,
        amount: Number(amount),
        date: new Date().toISOString().split('T')[0],
        account_type: accountType,
        notes: notes.trim() || categoryName
      });
      setAmount('');
      setNotes('');
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const [deleteId, setDeleteId] = useState<number | null>(null);

  const askDeletePettyExpense = (id: number) => {
    setDeleteId(id);
  };

  const handleConfirmDeletePettyExpense = async () => {
    if (!deleteId) return;
    const id = deleteId;
    setDeleteId(null);
    try {
      await deleteExpense(id);
      fetchExpenses();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik");
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  const totalPettyCashAmount = pettyExpenses.reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Receipt className="w-5 h-5 text-amber-600" />
            <span>Kichik Chiqimlar (Mayda Chiqimlar va Kassa Fondi)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Kundalik tushlik, transport, taksi, kofe va mayda xarajatlarni tezkor hisoblash
          </p>
        </div>

        <div className="bg-amber-50 px-5 py-2.5 rounded-2xl border border-amber-100 text-right">
          <span className="text-[10px] text-amber-800 uppercase font-extrabold block">Jami Kichik Chiqimlar</span>
          <span className="text-base font-black text-amber-600">{formatMoney(totalPettyCashAmount)}</span>
        </div>
      </div>

      {/* Quick Add Form & Category Selector */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Plus className="w-4.5 h-4.5 text-blue-600" />
          <span>Yangi Kichik Chiqim Kiritish</span>
        </h3>

        {/* Category Quick Pills */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-600 block">Kichik Chiqim Turini Tanlang:</label>
          <div className="flex flex-wrap gap-2">
            {quickCategories.map((cat) => {
              const Icon = cat.icon;
              const isSelected = categoryName === cat.label;
              return (
                <button
                  key={cat.label}
                  type="button"
                  onClick={() => setCategoryName(cat.label)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-2xl text-xs font-bold transition border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-600/20'
                      : `${cat.color} hover:opacity-80`
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        <form onSubmit={handleCreatePettyExpense} className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Chiqim Summasi (so'm) *</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
              placeholder="masalan: 35000"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 font-extrabold text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Qaysi Hisobdan Chiqim Bo'ldi? *</label>
            <select
              value={accountType}
              onChange={(e) => setAccountType(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 font-bold text-xs"
            >
              <option value="CASH">💵 Naqd Kassa</option>
              <option value="BANK">💳 Bank Plastik Karta</option>
              <option value="CLICK">📱 Click / Payme</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-slate-600 block mb-1">Izoh / Tafsilot</label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="masalan: Tushlik va mineral suv"
              className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2.5 text-slate-900 font-bold text-xs"
            />
          </div>

          <div className="sm:col-span-3 pt-2">
            <button
              type="submit"
              className="w-full py-3 bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-amber-600/20 transition flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>KICHIK CHIQIMNI TASDIQLASH VA KASSADAN CHIQARISH</span>
            </button>
          </div>
        </form>
      </div>

      {/* Minor Expenses Feed */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
        <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between border-b border-slate-100 pb-3">
          <span>Ro'yxatga Olingan Kichik Chiqimlar Jurnali</span>
          <span className="text-xs font-bold text-slate-400 font-mono">{pettyExpenses.length} ta chiqim</span>
        </h3>

        {pettyExpenses.length === 0 ? (
          <div className="py-12 text-center text-slate-400 font-medium text-xs">
            Hali hech qanday kichik chiqim kiritilmagan. Yuqoridagi shakldan kiritishingiz mumkin.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {pettyExpenses.map((exp) => (
              <div key={exp.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 flex flex-col justify-between hover:shadow-xs transition">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      {exp.category_name.replace('Kichik Chiqim: ', '')}
                    </span>
                    <span className="text-xs font-mono font-bold text-slate-400">{exp.date}</span>
                  </div>
                  <p className="text-xs font-extrabold text-slate-900 pt-1">{exp.notes || exp.category_name}</p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200/60">
                  <div>
                    <span className="text-sm font-black text-rose-600">-{formatMoney(exp.amount)}</span>
                    <span className="text-[10px] font-mono text-slate-400 block font-bold">{exp.account_type}</span>
                  </div>
                  <button
                    onClick={() => askDeletePettyExpense(exp.id)}
                    className="p-2 text-rose-500 hover:bg-rose-100/60 rounded-xl transition"
                    title="Chiqimni o'chirish"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CUSTOM CONFIRM MODAL FOR PETTY EXPENSE */}
      <ConfirmModal
        isOpen={deleteId !== null}
        title="Kichik Chiqimni O'chirish"
        message="Ushbu kichik chiqimni o'chirmoqchimisiz? Kassadan summa qaytariladi."
        confirmText="Ha, o'chirish"
        cancelText="Yo'q, bekor qilish"
        type="danger"
        onConfirm={handleConfirmDeletePettyExpense}
        onCancel={() => setDeleteId(null)}
      />
    </div>
  );
};
