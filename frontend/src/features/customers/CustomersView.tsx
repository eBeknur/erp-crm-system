import React, { useState, useEffect } from 'react';
import { Users, Plus, Search } from 'lucide-react';
import { getCustomers, createCustomer, payCustomerDebt } from '../../services/api';
import { Customer } from '../../types';

export const CustomersView: React.FC = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [notes, setNotes] = useState('');

  // Payment Form
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [accountType, setAccountType] = useState('CASH');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    try {
      await createCustomer({ name, phone, address, notes });
      setShowAddModal(false);
      setName('');
      setPhone('');
      setAddress('');
      setNotes('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik");
    }
  };

  const handlePayDebt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomer || !payAmount) return;
    try {
      await payCustomerDebt(selectedCustomer.id, Number(payAmount), accountType, "Mijoz qarz to'lovi");
      setShowPayModal(false);
      setSelectedCustomer(null);
      setPayAmount('');
      fetchCustomers();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik");
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  const totalCustomerDebt = customers.reduce((sum, c) => sum + c.current_debt, 0);

  const filteredCustomers = customers.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-600" />
            <span>Mijozlar Boshqaruvi (Customers & Receivables)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Mijozlar ro'yxati, xaridlari va haqdorlik qarzlari</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Bizga Mijozlar Qarzi</span>
            <span className="text-base font-black text-indigo-600">{formatMoney(totalCustomerDebt)}</span>
          </div>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-md shadow-blue-600/20 transition"
          >
            <Plus className="w-4 h-4" />
            <span>Mijoz Qo'shish</span>
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
              <th className="py-4 px-5">F.I.O / Kompaniya</th>
              <th className="py-4 px-5">Telefon</th>
              <th className="py-4 px-5">Manzil</th>
              <th className="py-4 px-5 text-right">Jami Xaridlari</th>
              <th className="py-4 px-5 text-right text-emerald-600">To'langan</th>
              <th className="py-4 px-5 text-right text-indigo-600">Qarz Balansi</th>
              <th className="py-4 px-5 text-center">Qarz To'lash</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {filteredCustomers.map((c) => (
              <tr key={c.id} className="hover:bg-slate-50/80 transition">
                <td className="py-4 px-5 font-bold text-slate-900">{c.name}</td>
                <td className="py-4 px-5 text-slate-600">{c.phone || '-'}</td>
                <td className="py-4 px-5 text-slate-400">{c.address || '-'}</td>
                <td className="py-4 px-5 text-right font-extrabold text-slate-900">{formatMoney(c.total_sales)}</td>
                <td className="py-4 px-5 text-right font-bold text-emerald-600">{formatMoney(c.total_paid)}</td>
                <td className="py-4 px-5 text-right font-bold text-indigo-600">{formatMoney(c.current_debt)}</td>
                <td className="py-4 px-5 text-center">
                  {c.current_debt > 0 ? (
                    <button
                      onClick={() => { setSelectedCustomer(c); setPayAmount(c.current_debt); setShowPayModal(true); }}
                      className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 border border-indigo-200 rounded-full font-bold text-[11px]"
                    >
                      To'lov Qabul Qilish
                    </button>
                  ) : (
                    <span className="text-slate-400 font-medium text-[10px]">Qarz Yo'q</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Yangi Mijoz Yaratish</h3>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">F.I.O / Kompaniya *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Aliyev Botir"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Telefon Nomer</label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+998 90 123 45 67"
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

      {/* Pay Debt Modal */}
      {showPayModal && selectedCustomer && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handlePayDebt} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Mijoz Qarz To'lovi — {selectedCustomer.name}
            </h3>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
              <span className="text-slate-400">Mijozning Hozirgi Qarzi:</span>
              <p className="text-xl font-black text-indigo-600 mt-1">{formatMoney(selectedCustomer.current_debt)}</p>
            </div>
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Qabul Qilinar To'lov Summasi (so'm) *</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-emerald-600 font-bold text-base"
                  required
                />
              </div>
              <div>
                <label className="text-slate-500 font-bold block mb-1">Pul Qaysi Hisobga Tushadi?</label>
                <select
                  value={accountType}
                  onChange={(e) => setAccountType(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800"
                >
                  <option value="CASH">💵 Naqd Kassa</option>
                  <option value="BANK">💳 Bank Hisob-raqam</option>
                  <option value="CLICK">📱 Click/Payme Hisob</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowPayModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-md">To'lovni Saqlash</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
