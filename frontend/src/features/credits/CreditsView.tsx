import React, { useState, useEffect } from 'react';
import { Landmark, Plus, DollarSign, Calendar, Edit, Trash2, CheckCircle2, AlertCircle } from 'lucide-react';
import { getCredits, createCredit, updateCredit, payCreditInstallment, deleteCredit } from '../../services/api';
import { Credit } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

export const CreditsView: React.FC = () => {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedCredit, setSelectedCredit] = useState<Credit | null>(null);

  // Add/Edit Form State
  const [title, setTitle] = useState('');
  const [lenderName, setLenderName] = useState('');
  const [totalAmount, setTotalAmount] = useState<number | ''>('');
  const [monthlyPayment, setMonthlyPayment] = useState<number | ''>('');
  const [remainingBalance, setRemainingBalance] = useState<number | ''>('');
  const [interestRate, setInterestRate] = useState<number | ''>(20);
  const [dueDay, setDueDay] = useState<number | ''>(10);
  const [notes, setNotes] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [accountType, setAccountType] = useState('BANK');

  useEffect(() => {
    fetchCredits();
  }, []);

  const fetchCredits = async () => {
    try {
      const data = await getCredits();
      setCredits(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !lenderName || !totalAmount || !monthlyPayment) {
      alert("Barcha majburiy maydonlarni to'ldiring!");
      return;
    }

    try {
      await createCredit({
        title,
        lender_name: lenderName,
        total_amount: Number(totalAmount),
        monthly_payment: Number(monthlyPayment),
        remaining_balance: Number(remainingBalance || totalAmount),
        interest_rate: Number(interestRate || 0),
        due_day: Number(dueDay || 10),
        notes
      });
      setShowAddModal(false);
      resetForm();
      fetchCredits();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit) return;

    try {
      await updateCredit(selectedCredit.id, {
        title,
        lender_name: lenderName,
        total_amount: Number(totalAmount),
        monthly_payment: Number(monthlyPayment),
        remaining_balance: Number(remainingBalance),
        interest_rate: Number(interestRate || 0),
        due_day: Number(dueDay || 10),
        notes
      });
      setShowEditModal(false);
      setSelectedCredit(null);
      resetForm();
      fetchCredits();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCredit || !payAmount) return;

    try {
      await payCreditInstallment(selectedCredit.id, Number(payAmount), accountType, "Oylik kredit to'lovi");
      setShowPayModal(false);
      setSelectedCredit(null);
      setPayAmount('');
      fetchCredits();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const [deleteCreditId, setDeleteCreditId] = useState<number | null>(null);

  const askDeleteCredit = (id: number) => {
    setDeleteCreditId(id);
  };

  const handleConfirmDeleteCredit = async () => {
    if (!deleteCreditId) return;
    const id = deleteCreditId;
    setDeleteCreditId(null);
    try {
      await deleteCredit(id);
      fetchCredits();
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (cred: Credit) => {
    setSelectedCredit(cred);
    setTitle(cred.title);
    setLenderName(cred.lender_name);
    setTotalAmount(cred.total_amount);
    setMonthlyPayment(cred.monthly_payment);
    setRemainingBalance(cred.remaining_balance);
    setInterestRate(cred.interest_rate);
    setDueDay(cred.due_day);
    setNotes(cred.notes || '');
    setShowEditModal(true);
  };

  const openPayModal = (cred: Credit) => {
    setSelectedCredit(cred);
    setPayAmount(cred.monthly_payment);
    setShowPayModal(true);
  };

  const resetForm = () => {
    setTitle('');
    setLenderName('');
    setTotalAmount('');
    setMonthlyPayment('');
    setRemainingBalance('');
    setInterestRate(20);
    setDueDay(10);
    setNotes('');
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";

  const totalCreditsAmount = credits.reduce((sum, c) => sum + c.total_amount, 0);
  const totalMonthlyPayments = credits.filter(c => c.status === 'ACTIVE').reduce((sum, c) => sum + c.monthly_payment, 0);
  const totalRemainingBalance = credits.reduce((sum, c) => sum + c.remaining_balance, 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Landmark className="w-5 h-5 text-blue-600" />
            <span>Kreditlar Bo'limi (Loans & Credit Ledger)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Administrator tomonidan kredit summalari, oylik to'lovlar va qolgan qoldiq nazorati
          </p>
        </div>

        <button
          onClick={() => { resetForm(); setShowAddModal(true); }}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-md shadow-blue-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yangi Kredit Qo'shish</span>
        </button>
      </div>

      {/* 3 Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-2 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block">Jami Kreditlar Summasi</span>
          <h3 className="text-2xl font-black text-slate-900">{formatMoney(totalCreditsAmount)}</h3>
          <p className="text-[10px] text-slate-400">Tizimdagi barcha olingan kreditlar</p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-2 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block">Oylik Majburiy To'lovlar</span>
          <h3 className="text-2xl font-black text-blue-600">{formatMoney(totalMonthlyPayments)}</h3>
          <p className="text-[10px] text-slate-400">Har oy to'lanishi lozim bo'lgan summa</p>
        </div>

        <div className="bg-white border border-slate-100 p-6 rounded-3xl space-y-2 shadow-sm">
          <span className="text-xs font-bold text-slate-400 block">Qolgan Qoldiq Summa</span>
          <h3 className="text-2xl font-black text-rose-600">{formatMoney(totalRemainingBalance)}</h3>
          <p className="text-[10px] text-slate-400">Bank va kreditorlarga qolgan qarz</p>
        </div>
      </div>

      {/* Credits Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-5">Kredit Nomi & Bank</th>
                <th className="py-4 px-5 text-right">Jami Kredit</th>
                <th className="py-4 px-5 text-right text-blue-600">Oylik To'lov</th>
                <th className="py-4 px-5 text-right text-rose-600">Qolgan Qoldiq</th>
                <th className="py-4 px-5 text-center">Sanasi</th>
                <th className="py-4 px-5 text-center">Status</th>
                <th className="py-4 px-5 text-center">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : credits.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-400 font-medium">Hali hech qanday kredit kiritilmagan</td>
                </tr>
              ) : (
                credits.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5">
                      <p className="font-extrabold text-slate-900">{c.title}</p>
                      <p className="text-[10px] text-slate-400 font-semibold">{c.lender_name} {c.interest_rate > 0 ? `(${c.interest_rate}%)` : ''}</p>
                    </td>
                    <td className="py-4 px-5 text-right font-extrabold text-slate-900">{formatMoney(c.total_amount)}</td>
                    <td className="py-4 px-5 text-right font-black text-blue-600">{formatMoney(c.monthly_payment)}</td>
                    <td className="py-4 px-5 text-right font-black text-rose-600">{formatMoney(c.remaining_balance)}</td>
                    <td className="py-4 px-5 text-center font-bold text-slate-500">
                      Har oyning {c.due_day}-kuni
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                        c.remaining_balance <= 0 || c.status === 'PAID_OFF'
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : 'bg-amber-100 text-amber-700 border border-amber-200'
                      }`}>
                        {c.remaining_balance <= 0 || c.status === 'PAID_OFF' ? 'YOPILGAN' : 'FAOL'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {c.remaining_balance > 0 && (
                          <button
                            onClick={() => openPayModal(c)}
                            className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-full font-bold text-[11px] border border-blue-200"
                          >
                            To'lov Qilish
                          </button>
                        )}
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => askDeleteCredit(c.id)}
                          className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Yangi Kredit Yozuvini Qo'shish</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-slate-500 font-bold block mb-1">Kredit Nomi / Maqsadi *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="masalan: Biznes Rivojlantirish Krediti №1"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Bank / Kredit Beruvchi *</label>
                <input
                  type="text"
                  value={lenderName}
                  onChange={(e) => setLenderName(e.target.value)}
                  placeholder="Ipak Yo'li Banki"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">To'lov Sanasi (Oyning N-kuni)</label>
                <input
                  type="number"
                  value={dueDay}
                  onChange={(e) => setDueDay(e.target.value ? Number(e.target.value) : '')}
                  placeholder="10"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 text-center font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Jami Kredit Summasi (so'm) *</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => {
                    const val = e.target.value ? Number(e.target.value) : '';
                    setTotalAmount(val);
                    if (!remainingBalance) setRemainingBalance(val);
                  }}
                  placeholder="100000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Oylik To'lov Summasi (so'm) *</label>
                <input
                  type="number"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-blue-600 font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Qolgan Qoldiq Summa (so'm) *</label>
                <input
                  type="number"
                  value={remainingBalance}
                  onChange={(e) => setRemainingBalance(e.target.value ? Number(e.target.value) : '')}
                  placeholder="65000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-rose-600 font-bold text-sm"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Yillik Foiz Stavkasi (%)</label>
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value ? Number(e.target.value) : '')}
                  placeholder="22"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 text-center"
                />
              </div>

              <div className="col-span-2">
                <label className="text-slate-500 font-bold block mb-1">Qo'shimcha Izoh</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Garov va shartnoma raqami"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-full shadow-md">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedCredit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdate} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Kredit Ma'lumotlarini Tahrirlash</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-slate-500 font-bold block mb-1">Kredit Nomi *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Jami Kredit Summasi (so'm)</label>
                <input
                  type="number"
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-900 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Oylik To'lov Summasi (so'm)</label>
                <input
                  type="number"
                  value={monthlyPayment}
                  onChange={(e) => setMonthlyPayment(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-blue-600 font-bold"
                  required
                />
              </div>

              <div className="col-span-2">
                <label className="text-slate-500 font-bold block mb-1">Qolgan Qoldiq Summa (so'm) *</label>
                <input
                  type="number"
                  value={remainingBalance}
                  onChange={(e) => setRemainingBalance(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-rose-600 font-bold text-base"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-full shadow-md">Yangilash</button>
            </div>
          </form>
        </div>
      )}

      {/* Pay Installment Modal */}
      {showPayModal && selectedCredit && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handlePay} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Oylik Kredit To'lovi — {selectedCredit.title}
            </h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="text-slate-400">Hozirgi Qolgan Qoldiq Qarz:</span>
              <p className="text-xl font-black text-rose-600 mt-1">{formatMoney(selectedCredit.remaining_balance)}</p>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">To'lanayotgan Summa (so'm) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-blue-600 font-bold text-base"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Pul Qaysi Hisobdan Yechiladi?</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                >
                  <option value="BANK">💳 Bank Hisob-raqam</option>
                  <option value="CASH">💵 Naqd Kassa</option>
                  <option value="CLICK">📱 Click/Payme Hisob</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-full shadow-md">To'lovni Amalga Oshirish</button>
            </div>
          </form>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL FOR DELETING CREDIT */}
      <ConfirmModal
        isOpen={deleteCreditId !== null}
        title="Kredit Yozuvini O'chirish"
        message="Rostdan ham ushbu kredit yozuvini o'chirmoqchimisiz?"
        confirmText="Ha, o'chirish"
        cancelText="Yo'q, bekor qilish"
        type="danger"
        onConfirm={handleConfirmDeleteCredit}
        onCancel={() => setDeleteCreditId(null)}
      />
    </div>
  );
};
