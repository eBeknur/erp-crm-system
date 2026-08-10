import React, { useState, useEffect } from 'react';
import { DollarSign, Wallet, CreditCard, Smartphone, Plus, ArrowUpRight, Tag, Download, Printer, PieChart, Trash2 } from 'lucide-react';
import { getAccounts, getFinancialTransactions, getExpenses, createExpense, deleteExpense } from '../../services/api';
import { Account, FinancialTransaction, Expense } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const FinanceView: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Expense Form
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [categoryName, setCategoryName] = useState('Ijara');
  const [amount, setAmount] = useState<number | ''>('');
  const [accountType, setAccountType] = useState('CASH');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchData();
    // Smart lightweight polling every 10 seconds (only when tab is visible)
    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchData();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchData = async () => {
    try {
      const [accs, txs, exps] = await Promise.all([getAccounts(), getFinancialTransactions(), getExpenses()]);
      setAccounts(accs);
      setTransactions(txs);
      setExpenses(exps);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const [formError, setFormError] = useState<string | null>(null);

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) return;

    setFormError(null);
    try {
      await createExpense({
        category_name: categoryName,
        amount: Number(amount),
        date: new Date().toISOString().split('T')[0],
        account_type: accountType,
        notes
      });
      setShowAddExpense(false);
      setAmount('');
      setNotes('');
      setFormError(null);
      fetchData();
    } catch (err: any) {
      setFormError(err.response?.data?.detail || "Xarajat saqlashda xatolik yuz berdi");
    }
  };

  const [deleteExpId, setDeleteExpId] = useState<number | null>(null);

  const askDeleteExp = (id: number) => {
    setDeleteExpId(id);
  };

  const handleConfirmDeleteExp = async () => {
    if (!deleteExpId) return;
    const id = deleteExpId;
    setDeleteExpId(null);
    try {
      await deleteExpense(id);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik");
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  const totalCashReserve = accounts.reduce((sum, a) => sum + a.balance, 0);

  const getAccountIcon = (type: string) => {
    if (type === 'BANK') return CreditCard;
    if (type === 'CLICK') return Smartphone;
    return Wallet;
  };

  // Group expenses by Category for Analytics Report
  const categoryTotals: { [key: string]: number } = {};
  let totalExpensesSum = 0;
  let minorExpensesSum = 0;

  expenses.forEach(e => {
    totalExpensesSum += e.amount;
    const cat = e.category_name.startsWith('Kichik Chiqim: ')
      ? e.category_name.replace('Kichik Chiqim: ', '')
      : e.category_name;

    if (e.category_name.startsWith('Kichik Chiqim: ') || cat.toLowerCase().includes('tushlik') || cat.toLowerCase().includes('taksi')) {
      minorExpensesSum += e.amount;
    }

    categoryTotals[cat] = (categoryTotals[cat] || 0) + e.amount;
  });

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>Moliya & Xarajatlar Hisoboti (Finance Ledger)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Alohida Naqd, Bank va Click/Payme balansi, operatsion va kichik chiqimlar hisoboti</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Jami Pul Balansi</span>
            <span className="text-base font-black text-emerald-600">{formatMoney(totalCashReserve)}</span>
          </div>

          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-md shadow-rose-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Operatsion Xarajat</span>
          </button>
        </div>
      </div>

      {/* 3 Account Balance Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-6">
        {accounts.map((acc) => {
          const Icon = getAccountIcon(acc.account_type);
          return (
            <div key={acc.id} className="bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl space-y-3 shadow-sm hover:shadow-md transition">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400">{acc.name}</span>
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-slate-900">{formatMoney(acc.balance)}</h3>
              <p className="text-[10px] text-slate-400">Oxirgi yangilanish: {new Date(acc.updated_at).toLocaleTimeString('uz-UZ')}</p>
            </div>
          );
        })}
      </div>

      {/* Financial Expense Analytics & Breakdown Report */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <PieChart className="w-5 h-5 text-indigo-600" />
              <span>Xarajatlar Tahlili va Categoriyalar Hisoboti</span>
            </h3>
            <p className="text-xs text-slate-400">Kategoriyalar va Kichik Chiqimlar taqsimoti</p>
          </div>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-full transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Hisobotni Chop Etish</span>
          </button>
        </div>

        {/* Expense Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <span className="text-slate-400 font-bold text-xs block">Jami Xarajatlar Summasi:</span>
            <span className="font-black text-rose-600 text-base">{formatMoney(totalExpensesSum)}</span>
          </div>
          <div className="p-4 bg-amber-50/60 rounded-2xl border border-amber-100">
            <span className="text-amber-800 font-bold text-xs block">Mayda / Kichik Chiqimlar:</span>
            <span className="font-black text-amber-600 text-base">{formatMoney(minorExpensesSum)}</span>
          </div>
          <div className="p-4 bg-blue-50/60 rounded-2xl border border-blue-100">
            <span className="text-blue-900 font-bold text-xs block">Asosiy Operatsion Xarajatlar:</span>
            <span className="font-black text-blue-600 text-base">{formatMoney(totalExpensesSum - minorExpensesSum)}</span>
          </div>
          <div className="p-4 bg-emerald-50/60 rounded-2xl border border-emerald-100">
            <span className="text-emerald-900 font-bold text-xs block">Aktiv Kategoriyalar:</span>
            <span className="font-black text-emerald-600 text-base">{Object.keys(categoryTotals).length} ta</span>
          </div>
        </div>

        {/* Expense Category Breakdown Progress Bars */}
        <div className="space-y-3 pt-2">
          <h4 className="text-xs font-extrabold text-slate-700 uppercase tracking-tight">Kategoriyalar bo'yicha hisobot:</h4>
          {Object.keys(categoryTotals).length === 0 ? (
            <p className="text-xs text-slate-400 py-2">Hali xarajatlar kiritilmagan.</p>
          ) : (
            Object.entries(categoryTotals).map(([cat, val]) => {
              const percent = totalExpensesSum > 0 ? Math.round((val / totalExpensesSum) * 100) : 0;
              return (
                <div key={cat} className="space-y-1 text-xs">
                  <div className="flex justify-between font-bold text-slate-800">
                    <span>{cat}</span>
                    <span className="font-mono">{formatMoney(val)} ({percent}%)</span>
                  </div>
                  <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all duration-500"
                      style={{ width: `${percent}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Expenses Table & Cash Flow Transactions Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Expenses List */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-rose-600" />
              <span>Barcha Xarajatlar Jurnali</span>
            </span>
            <span className="text-xs font-mono text-slate-400 font-bold">{expenses.length} ta</span>
          </h3>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Kategoriya</th>
                  <th className="py-3 px-4">Sana</th>
                  <th className="py-3 px-4 text-right">Summa</th>
                  <th className="py-3 px-4">Hisob</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {expenses.map((e) => (
                  <tr key={e.id}>
                    <td className="py-3 px-4 font-bold text-slate-900">{e.category_name}</td>
                    <td className="py-3 px-4 text-slate-400">{e.date}</td>
                    <td className="py-3 px-4 text-right font-extrabold text-rose-600">-{formatMoney(e.amount)}</td>
                    <td className="py-3 px-4">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[10px] text-slate-600 font-mono font-bold">
                        {e.account_type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => askDeleteExp(e.id)}
                        className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Cash Flow Ledger */}
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <ArrowUpRight className="w-4 h-4 text-emerald-600" />
            <span>Cash Flow (Pul Harakatlari Jurnali)</span>
          </h3>
          <div className="overflow-x-auto max-h-96">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Operatsiya</th>
                  <th className="py-3 px-4">Kategoriya</th>
                  <th className="py-3 px-4 text-right">Summa</th>
                  <th className="py-3 px-4">Hisob</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {transactions.map((tx) => (
                  <tr key={tx.id}>
                    <td className="py-3 px-4 font-medium">
                      <span className={`inline-flex items-center gap-1 font-bold ${tx.transaction_type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.transaction_type === 'INCOME' ? '+' : '-'} {tx.description || tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-400">{tx.category}</td>
                    <td className={`py-3 px-4 text-right font-extrabold ${tx.transaction_type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.transaction_type === 'INCOME' ? '+' : '-'}{formatMoney(tx.amount)}
                    </td>
                    <td className="py-3 px-4 font-mono text-[10px] text-slate-400">{tx.account_type}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateExpense} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Operatsion Xarajat Kiritish</h3>
            
            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-2xl flex items-center justify-between">
                <span>⚠️ {formError}</span>
                <button type="button" onClick={() => setFormError(null)} className="text-rose-500 hover:text-rose-800 font-black">✕</button>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Xarajat Kategoriyasi *</label>
                <select
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                >
                  <option value="Ijara">Ijara</option>
                  <option value="Reklama">Reklama</option>
                  <option value="Transport">Transport</option>
                  <option value="Kommunal">Kommunal</option>
                  <option value="Mahsulot xarajati">Mahsulot xarajati</option>
                  <option value="Ishchi oyligi">Ishchi oyligi</option>
                  <option value="Soliq">Soliq</option>
                  <option value="Bank komissiyasi">Bank komissiyasi</option>
                  <option value="Boshqa">Boshqa</option>
                </select>
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Summa (so'm) *</label>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="2000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold text-base"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Qaysi Hisobdan? *</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                >
                  <option value="CASH">💵 Naqd Kassa</option>
                  <option value="BANK">💳 Bank Plastik Karta</option>
                  <option value="CLICK">📱 Click / Payme</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddExpense(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-rose-600 text-white font-bold text-xs rounded-full shadow-md">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL FOR DELETING EXPENSE */}
      <ConfirmModal
        isOpen={deleteExpId !== null}
        title="Xarajatni O'chirish"
        message="Ushbu xarajatni o'chirib balansni tiklamoqchimisiz?"
        confirmText="Ha, o'chirish"
        cancelText="Yo'q, bekor qilish"
        type="danger"
        onConfirm={handleConfirmDeleteExp}
        onCancel={() => setDeleteExpId(null)}
      />
    </div>
  );
};
