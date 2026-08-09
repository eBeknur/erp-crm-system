import React, { useState, useEffect } from 'react';
import { Building2, Plus, AlertTriangle, Clock, CheckCircle2, Phone, X, DollarSign } from 'lucide-react';
import { getSuppliers, createSupplier, paySupplierDebt } from '../../services/api';
import { Supplier } from '../../types';

export const SuppliersView: React.FC = () => {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  // Add Form State
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [initialDebt, setInitialDebt] = useState<number | ''>('');
  const [dueDays, setDueDays] = useState<number>(30);
  const [notes, setNotes] = useState('');

  // Payment Form State
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [accountType, setAccountType] = useState('CASH');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchSuppliers();
    // Smart lightweight polling every 10 seconds (only when tab is visible)
    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchSuppliers();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchSuppliers = async () => {
    try {
      const data = await getSuppliers();
      setSuppliers(data);
    } catch (err) {
      console.error("Failed to fetch suppliers:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    setSubmitting(true);
    try {
      await createSupplier({
        name,
        contact_person: contactPerson,
        phone,
        address,
        initial_debt: Number(initialDebt) || 0,
        due_days: Number(dueDays) || 30,
        notes,
      });
      setShowAddModal(false);
      setName('');
      setContactPerson('');
      setPhone('');
      setAddress('');
      setInitialDebt('');
      setDueDays(30);
      setNotes('');
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Postavshikni saqlashda xatolik");
    } finally {
      setSubmitting(false);
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplier || !payAmount) return;

    setSubmitting(true);
    try {
      await paySupplierDebt(selectedSupplier.id, Number(payAmount), accountType, "Postavshik qarz to'lovi");
      setShowPayModal(false);
      setSelectedSupplier(null);
      setPayAmount('');
      fetchSuppliers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "To'lovda xatolik yuz berdi");
    } finally {
      setSubmitting(false);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  const totalDebtSum = suppliers.reduce((sum, s) => sum + (s.current_debt || 0), 0);

  // Helper to check 80% timeframe threshold
  const checkTimeframeWarning = (supplier: Supplier) => {
    if (!supplier.current_debt || supplier.current_debt <= 0) return null;

    const totalDays = supplier.due_days || 30;
    const debtDate = new Date(supplier.debt_start_date || supplier.created_at);
    const now = new Date();
    const elapsedMs = now.getTime() - debtDate.getTime();
    const elapsedDays = Math.max(0, Math.floor(elapsedMs / (1000 * 60 * 60 * 24)));
    const remainingDays = Math.max(0, totalDays - elapsedDays);
    const ratio = elapsedDays / totalDays;

    const isCritical = ratio >= 0.8 || remainingDays <= 2;

    return {
      isCritical,
      elapsedDays,
      totalDays,
      remainingDays,
      ratioPercent: Math.min(100, Math.round(ratio * 100))
    };
  };

  const urgentSuppliers = suppliers.filter(s => {
    const w = checkTimeframeWarning(s);
    return w && w.isCritical;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div className="space-y-1">
          <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
            <Building2 className="w-6 h-6 text-amber-600" />
            <span>🚚 Postavshiklar & To'lov Muddatlari Boshqaruvi</span>
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Postavshik qarzlari, to'lov muddatlari va 80% vaqt o'tgandagi ogohlantirishlar tizimi.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-amber-50 px-5 py-3 rounded-2xl border border-amber-200 text-right">
            <span className="text-[10px] text-amber-800 uppercase font-black block">Jami Postavshik Qarzi</span>
            <span className="text-lg font-black text-amber-600 font-mono">{formatMoney(totalDebtSum)}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-6 py-3.5 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-full shadow-lg shadow-amber-600/30 transition cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>➕ Postavshik Qo'shish</span>
          </button>
        </div>
      </div>

      {/* ⚠️ URGENT DEADLINE ALERT BANNER (If 80% time elapsed) */}
      {urgentSuppliers.length > 0 && (
        <div className="bg-rose-50 border-2 border-rose-300 p-5 rounded-3xl space-y-3 animate-pulse shadow-md">
          <div className="flex items-center gap-3 text-rose-900">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-6 h-6 text-rose-600" />
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide">
                🚨 DIQQAT: {urgentSuppliers.length} ta postavshik to'lov muddatining 80%+ vaqti o'tib ketdi!
              </h3>
              <p className="text-xs text-rose-700 font-medium">
                Oz vaqt qoldi, tezroq to'lov qiling! Quyidagi postavshiklarga to'lov muddatlari tugamoqda:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-2 border-t border-rose-200">
            {urgentSuppliers.map(s => {
              const w = checkTimeframeWarning(s);
              return (
                <div key={s.id} className="bg-white p-3 rounded-2xl border border-rose-200 text-xs flex justify-between items-center">
                  <div>
                    <strong className="text-slate-900 block font-black">{s.name}</strong>
                    <span className="text-rose-600 font-black font-mono">{formatMoney(s.current_debt)}</span>
                  </div>
                  <span className="text-[10px] font-black px-2 py-1 bg-rose-100 text-rose-800 rounded-full">
                    {w?.remainingDays} kun qoldi
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Table Card */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600 mx-auto"></div>
            <span className="text-xs text-slate-400 block mt-2 font-medium">Postavshiklar yuklanmoqda...</span>
          </div>
        ) : suppliers.length === 0 ? (
          <div className="text-center py-12 space-y-2">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-xs text-slate-500 font-bold">Hali postavshiklar kiritilmagan.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-extrabold uppercase tracking-wider">
                  <th className="py-4 px-5">Kompaniya Nomi</th>
                  <th className="py-4 px-5">Kontakt / Telefon</th>
                  <th className="py-4 px-5 text-right">Jami Xarid</th>
                  <th className="py-4 px-5 text-right text-emerald-600">To'langan</th>
                  <th className="py-4 px-5 text-right text-amber-600">Qarz Balansi</th>
                  <th className="py-4 px-5 text-center">To'lov Muddati Statusi</th>
                  <th className="py-4 px-5 text-center">Amal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
                {suppliers.map((s) => {
                  const warning = checkTimeframeWarning(s);
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 font-black text-slate-900 text-sm">
                        {s.name}
                        {s.address && <span className="text-[11px] text-slate-400 block font-normal">{s.address}</span>}
                      </td>

                      <td className="py-4 px-5 text-slate-600 font-sans">
                        <div className="font-bold text-slate-800">{s.contact_person || '-'}</div>
                        {s.phone && (
                          <span className="text-[11px] text-slate-500 flex items-center gap-1 font-mono">
                            <Phone className="w-3 h-3 text-slate-400" />
                            {s.phone}
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-right font-black text-slate-900 font-mono">{formatMoney(s.total_purchased)}</td>
                      <td className="py-4 px-5 text-right font-black text-emerald-600 font-mono">{formatMoney(s.total_paid)}</td>
                      <td className="py-4 px-5 text-right font-black text-amber-600 font-mono text-sm">{formatMoney(s.current_debt)}</td>

                      {/* 80% Timeframe Status Column */}
                      <td className="py-4 px-5 text-center">
                        {s.current_debt > 0 ? (
                          warning?.isCritical ? (
                            <div className="inline-flex flex-col items-center gap-1 bg-rose-100 text-rose-900 px-3 py-1.5 rounded-2xl border border-rose-300 animate-pulse">
                              <span className="text-[11px] font-black flex items-center gap-1">
                                <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                                <span>⚠️ Oz vaqt qoldi, tezroq to'lov qiling!</span>
                              </span>
                              <span className="text-[10px] font-mono text-rose-700">
                                ({warning.elapsedDays}/{warning.totalDays} kun o'tdi — {warning.remainingDays} kun qoldi)
                              </span>
                            </div>
                          ) : (
                            <div className="inline-flex flex-col items-center bg-blue-50 text-blue-800 px-3 py-1.5 rounded-2xl border border-blue-200">
                              <span className="text-[11px] font-bold flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5 text-blue-600" />
                                <span>Vaqtida to'lash rejada ({warning?.totalDays || 30} kun)</span>
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">
                                ({warning?.remainingDays} kun qoldi)
                              </span>
                            </div>
                          )
                        ) : (
                          <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                            ✅ Qarz Yo'q
                          </span>
                        )}
                      </td>

                      <td className="py-4 px-5 text-center">
                        {s.current_debt > 0 ? (
                          <button
                            onClick={() => { setSelectedSupplier(s); setShowPayModal(true); }}
                            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-full shadow-md transition cursor-pointer active:scale-95"
                          >
                            💳 Qarz To'lash
                          </button>
                        ) : (
                          <span className="text-slate-400 font-bold text-xs">-</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Yangi Postavshik Qo'shish */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handleCreate} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 w-full max-w-lg shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">➕ Yangi Postavshik Qo'shish</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">Kompaniya Nomi *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Masalan: BeknurLLC"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Kontakt Shaxs</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="Masalan: Beknur aka"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-700 font-bold block">Telefon Raqami</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+998 90 123 45 67"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Debt & Payment Period Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-amber-50/60 p-4 rounded-2xl border border-amber-200">
                <div className="space-y-1">
                  <label className="text-amber-900 font-black block">Hozirgi Qarz Miqdori (so'm)</label>
                  <input
                    type="number"
                    min="0"
                    step="100000"
                    value={initialDebt}
                    onChange={(e) => setInitialDebt(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-black font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-amber-900 font-black block">To'lov Muddat Kunlari</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={dueDays}
                    onChange={(e) => setDueDays(Number(e.target.value))}
                    placeholder="30"
                    className="w-full bg-white border border-amber-300 rounded-xl px-3 py-2 text-slate-900 font-black font-mono focus:outline-none"
                  />
                  <span className="text-[10px] text-amber-700 font-medium block">Masalan: 10 kun yoki 30 kun</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-full shadow-lg shadow-amber-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? 'Saqlanmoqda...' : 'Saqlash'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: Postavshik Qarzi To'lovi */}
      {showPayModal && selectedSupplier && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 animate-in fade-in">
          <form onSubmit={handlePayDebt} className="bg-white border border-slate-100 rounded-3xl p-6 sm:p-8 w-full max-w-md shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-black text-slate-900">
                💳 Postavshik Qarzi To'lovi — {selectedSupplier.name}
              </h3>
              <button type="button" onClick={() => setShowPayModal(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200 text-xs space-y-1">
              <span className="text-amber-800 font-bold block uppercase">Hozirgi Qarz Balansi:</span>
              <p className="text-2xl font-black text-amber-600 font-mono">{formatMoney(selectedSupplier.current_debt)}</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">To'lov Summasi (so'm) *</label>
                <input
                  type="number"
                  min="1"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5000000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-black font-mono focus:ring-2 focus:ring-amber-500 focus:outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-700 font-bold block">To'lov Turi</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-slate-900 font-bold focus:outline-none"
                >
                  <option value="CASH">💵 Naqd Pul</option>
                  <option value="BANK">🏦 Bank (Hisoppat)</option>
                  <option value="CLICK">📱 Click / Payme</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowPayModal(false)}
                className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-full transition"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 py-3 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs rounded-full shadow-lg shadow-amber-600/30 transition cursor-pointer disabled:opacity-50"
              >
                {submitting ? "To'lanmoqda..." : "To'lovni Amalga Oshirish"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
