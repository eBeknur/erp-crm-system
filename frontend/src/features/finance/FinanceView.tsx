import React, { useState, useEffect } from 'react';
import { DollarSign, Wallet, CreditCard, Smartphone, Plus, ArrowUpRight, Tag, Download, Printer, PieChart, Trash2 } from 'lucide-react';
import { getAccounts, getFinancialTransactions, getExpenses, createExpense, deleteExpense, addIncomeDeposit } from '../../services/api';
import { Account, FinancialTransaction, Expense } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';
import { AlertModal } from '../../components/common/AlertModal';

export const FinanceView: React.FC = () => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
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

  // Add Income (Deposit) Form
  const [showAddIncome, setShowAddIncome] = useState(false);
  const [incomeAmount, setIncomeAmount] = useState<number | ''>('');
  const [incomeAccountType, setIncomeAccountType] = useState('CASH');
  const [incomeCategory, setIncomeCategory] = useState('KASSAGA_PUL_KIRIMI');
  const [incomeNotes, setIncomeNotes] = useState('');
  const [incomeFormError, setIncomeFormError] = useState<string | null>(null);

  const handleCreateIncome = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!incomeAmount) return;

    setIncomeFormError(null);
    try {
      await addIncomeDeposit({
        account_type: incomeAccountType,
        amount: Number(incomeAmount),
        category: incomeCategory,
        notes: incomeNotes
      });
      setShowAddIncome(false);
      setIncomeAmount('');
      setIncomeNotes('');
      setIncomeFormError(null);
      fetchData();
    } catch (err: any) {
      setIncomeFormError(err.response?.data?.detail || "Pul kirim qilishda xatolik yuz berdi");
    }
  };

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
      const [accsRes, txsRes, expsRes] = await Promise.allSettled([
        getAccounts(),
        getFinancialTransactions(),
        getExpenses()
      ]);
      if (accsRes.status === 'fulfilled') setAccounts(accsRes.value);
      if (txsRes.status === 'fulfilled') setTransactions(txsRes.value);
      if (expsRes.status === 'fulfilled') setExpenses(expsRes.value);
    } catch (err) {
      console.error("Finance fetchData error:", err);
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
      setAlertMessage(err.response?.data?.detail || "Xatolik yuz berdi");
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

  const handleExportExcel = () => {
    if (transactions.length === 0 && expenses.length === 0) {
      setAlertMessage("Yuklab olish uchun kirim-chiqim tranzaksiyalari mavjud emas!");
      return;
    }

    const allRecords: {
      id: string | number;
      date: string;
      rawDate: number;
      type: string;
      description: string;
      category: string;
      amount: number;
      account: string;
    }[] = [];

    // Add financial transactions (incomes & ledger expenses)
    transactions.forEach(tx => {
      allRecords.push({
        id: `TX-${tx.id}`,
        date: new Date(tx.created_at).toLocaleString('uz-UZ'),
        rawDate: new Date(tx.created_at).getTime(),
        type: tx.transaction_type === 'INCOME' ? 'KIRIM (+)' : 'CHIQIM (-)',
        description: tx.description || tx.category || 'Tranzaksiya',
        category: tx.category || 'Moliya',
        amount: tx.amount,
        account: 'Asosiy Kassa'
      });
    });

    // Add Expenses if not already linked in transactions
    const txRefIds = new Set(transactions.map(t => t.reference_id).filter(Boolean));
    expenses.forEach(e => {
      if (!txRefIds.has(e.id)) {
        allRecords.push({
          id: `EXP-${e.id}`,
          date: e.date || new Date().toISOString().split('T')[0],
          rawDate: new Date(e.date || Date.now()).getTime(),
          type: 'CHIQIM (-)',
          description: `Operatsion xarajat: ${e.category_name} (${e.notes || ''})`,
          category: e.category_name,
          amount: e.amount,
          account: 'Asosiy Kassa'
        });
      }
    });

    // Sort by date descending
    allRecords.sort((a, b) => b.rawDate - a.rawDate);

    const headers = ["ID", "Sana va Vaqt", "Tranzaksiya Turi", "Operatsiya / Izoh", "Kategoriya", "Summa (so'm)", "Hisob"];

    const rows = allRecords.map(r => [
      r.id,
      r.date,
      r.type,
      `"${(r.description || '').replace(/"/g, '""')}"`,
      `"${(r.category || '').replace(/"/g, '""')}"`,
      r.amount,
      r.account
    ]);

    // Use sep=; instruction for Excel column separation across all Windows regional settings
    const csvContent = "\uFEFFsep=;\n" + [headers.join(";"), ...rows.map(r => r.join(";"))].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const filename = `kirim_chiqim_hisoboti_${new Date().toISOString().split('T')[0]}.csv`;
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            onClick={() => {
              setIncomeAccountType('CASH');
              setShowAddIncome(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md shadow-emerald-600/20 transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>+ Pul Kirim Qilish</span>
          </button>

          <button
            onClick={() => setShowAddExpense(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-full shadow-md shadow-rose-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>+ Operatsion Xarajat</span>
          </button>
        </div>
      </div>



      {/* Financial Expense Analytics & Breakdown Report */}
      {/* SINGLE UNIFIED FULL-WIDTH TABLE CARD: BARCHA HARAKATLAR JURNALI */}
      <div className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              <span>📋 Barcha Harakatlar Jurnali (Kirim & Chiqimlar)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">Barcha pul tushumlari, xarajatlar va amallar tarixi ({transactions.length} ta operatsiya)</p>
          </div>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-full transition shadow-md shadow-emerald-600/20 active:scale-95 border border-emerald-400/30 shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-white" />
            <span>📥 Excel Yuklab Olish (.csv)</span>
          </button>
        </div>

        <div className="overflow-x-auto max-h-[500px]">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100 sticky top-0">
              <tr>
                <th className="py-3.5 px-4">Sana & Vaqt</th>
                <th className="py-3.5 px-4">Operatsiya / Izoh</th>
                <th className="py-3.5 px-4">Kategoriya</th>
                <th className="py-3.5 px-4 text-right">Summa</th>
                <th className="py-3.5 px-4">Hisob</th>
                <th className="py-3.5 px-4 text-center">Amal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {transactions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                    Hali pul harakatlari amalga oshirilmagan.
                  </td>
                </tr>
              ) : (
                transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-3.5 px-4 text-slate-400 font-medium whitespace-nowrap">
                      {new Date(tx.created_at).toLocaleString('uz-UZ')}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      <span className={`inline-flex items-center gap-1.5 ${tx.transaction_type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {tx.transaction_type === 'INCOME' ? '🟢 +' : '🔴 -'} {tx.description || tx.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-slate-500 font-medium">
                      <span className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-semibold text-slate-700">
                        {tx.category}
                      </span>
                    </td>
                    <td className={`py-3.5 px-4 text-right font-black text-sm ${tx.transaction_type === 'INCOME' ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {tx.transaction_type === 'INCOME' ? '+' : '-'}{formatMoney(tx.amount)}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-xs text-slate-500 font-semibold">
                      Asosiy Kassa Balansi
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {tx.transaction_type === 'EXPENSE' && tx.reference_id && (
                        <button
                          onClick={() => askDeleteExp(tx.reference_id!)}
                          className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition cursor-pointer"
                          title="Xarajatni o'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Income (Deposit) Modal */}
      {showAddIncome && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateIncome} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              <span>Hisobga Pul Kirim Qilish</span>
            </h3>

            {incomeFormError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs rounded-2xl flex items-center justify-between">
                <span>⚠️ {incomeFormError}</span>
                <button type="button" onClick={() => setIncomeFormError(null)} className="text-rose-500 hover:text-rose-800 font-black">✕</button>
              </div>
            )}

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Kirim Summasi (so'm) *</label>
                <input
                  type="number"
                  value={incomeAmount}
                  onChange={(e) => setIncomeAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold text-base"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Izoh (ixtiyoriy)</label>
                <input
                  type="text"
                  value={incomeNotes}
                  onChange={(e) => setIncomeNotes(e.target.value)}
                  placeholder="Kassa to'ldirish yoki tushum haqida izoh..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddIncome(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-md shadow-emerald-600/20">Pul Kirim Qilish</button>
            </div>
          </form>
        </div>
      )}

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

      <AlertModal
        isOpen={alertMessage !== null}
        message={alertMessage || ''}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
};
