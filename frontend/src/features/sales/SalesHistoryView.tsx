import React, { useState, useEffect } from 'react';
import { History, Eye, Search, UserCheck, Award, TrendingUp, Filter } from 'lucide-react';
import { getSales, getEmployees } from '../../services/api';
import { Sale, Employee, User } from '../../types';

interface SalesHistoryViewProps {
  currentUser?: User | null;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ currentUser }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSellerFilter, setSelectedSellerFilter] = useState<string>('ALL');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [salesData, empData] = await Promise.all([getSales(), getEmployees()]);
      setSales(salesData);
      setEmployees(empData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";

  // Calculate seller breakdown stats
  const sellerStats: { [key: string]: { name: string; count: number; totalAmount: number; totalProfit: number } } = {};

  sales.forEach(s => {
    const empName = s.employee?.full_name || 'Administrator';
    if (!sellerStats[empName]) {
      sellerStats[empName] = { name: empName, count: 0, totalAmount: 0, totalProfit: 0 };
    }
    sellerStats[empName].count += 1;
    sellerStats[empName].totalAmount += s.total_amount;
    sellerStats[empName].totalProfit += s.gross_profit;
  });

  const sellerList = Object.values(sellerStats).sort((a, b) => b.totalAmount - a.totalAmount);

  const filteredSales = sales.filter(s => {
    const empName = s.employee?.full_name || 'Administrator';
    const matchesSearch = s.sale_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (s.customer && s.customer.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      empName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSeller = selectedSellerFilter === 'ALL' || empName === selectedSellerFilter;
    return matchesSearch && matchesSeller;
  });

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-blue-600" />
            <span>Savdolar Tarixi va Sotuvchilar Natijasi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Kim qancha savdo qilgani va har bir sotuvchining audit tarixi</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Savdo №, mijoz yoki ishchi..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>

          <select
            value={selectedSellerFilter}
            onChange={(e) => setSelectedSellerFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold px-3 py-2 rounded-full focus:outline-none"
          >
            <option value="ALL">👔 Hamma Sotuvchilar</option>
            {sellerList.map(s => (
              <option key={s.name} value={s.name}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Seller Performance Leaderboard Cards */}
      <div className="space-y-3">
        <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
          <Award className="w-4 h-4 text-amber-500" />
          <span>Sotuvchilar Reytingi va KPI Statistikasi</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sellerList.length === 0 ? (
            <div className="col-span-full py-4 text-xs text-slate-400">Hali savdo qilgan sotuvchilar mavjud emas.</div>
          ) : (
            sellerList.map((s, idx) => (
              <div key={s.name} className="bg-white border border-slate-100 p-4 rounded-2xl space-y-2 shadow-xs hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>{s.name}</span>
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-50 text-blue-600">
                    #{idx + 1} Sotuvchi
                  </span>
                </div>

                <div className="pt-1 border-t border-slate-100 space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Savdolar Soni:</span>
                    <span className="font-extrabold text-slate-900">{s.count} ta savdo</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400 text-[11px]">Jami Tushum:</span>
                    <span className="font-black text-blue-600">{formatMoney(s.totalAmount)}</span>
                  </div>
                  <div className="flex justify-between text-emerald-600 font-bold">
                    <span className="text-[11px]">Yalpi Foydasi:</span>
                    <span>+{formatMoney(s.totalProfit)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Detailed Sales History Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-100 font-extrabold text-slate-900 text-xs flex justify-between items-center">
          <span>Barcha Savdolar Ro'yxati</span>
          <span className="font-mono text-slate-400">{filteredSales.length} ta savdo</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-5">№</th>
                <th className="py-4 px-5">Sana & Vaqt</th>
                <th className="py-4 px-5">👔 Sotuvchi</th>
                <th className="py-4 px-5">👤 Mijoz</th>
                <th className="py-4 px-5 text-right">Jami Summa</th>
                <th className="py-4 px-5 text-right">To'lov</th>
                <th className="py-4 px-5 text-right">Qarz</th>
                <th className="py-4 px-5 text-right text-emerald-600">Yalpi Foyda</th>
                <th className="py-4 px-5 text-center">Tafsilot</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto"></div>
                  </td>
                </tr>
              ) : filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-slate-400 font-medium">Savdolar topilmadi</td>
                </tr>
              ) : (
                filteredSales.map((s) => {
                  const paidTotal = s.paid_cash + s.paid_card + s.paid_click;
                  const empName = s.employee?.full_name || 'Administrator';
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 font-bold text-slate-900">{s.sale_number}</td>
                      <td className="py-4 px-5 text-slate-400 font-mono">
                        {new Date(s.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="py-4 px-5 font-extrabold text-blue-600 flex items-center gap-1.5">
                        <UserCheck className="w-3.5 h-3.5 text-blue-500" />
                        <span>{empName}</span>
                      </td>
                      <td className="py-4 px-5 font-bold text-slate-800">{s.customer?.name || 'Chakana mijoz'}</td>
                      <td className="py-4 px-5 text-right font-extrabold text-slate-900">{formatMoney(s.total_amount)}</td>
                      <td className="py-4 px-5 text-right text-slate-600">{formatMoney(paidTotal)}</td>
                      <td className={`py-4 px-5 text-right font-bold ${s.debt_amount > 0 ? 'text-amber-500' : 'text-slate-400'}`}>
                        {s.debt_amount > 0 ? formatMoney(s.debt_amount) : '0'}
                      </td>
                      <td className="py-4 px-5 text-right font-extrabold text-emerald-600">+{formatMoney(s.gross_profit)}</td>
                      <td className="py-4 px-5 text-center">
                        <button
                          onClick={() => setSelectedSale(s)}
                          className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-blue-600 transition"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {selectedSale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Savdo Tafsilotlari {selectedSale.sale_number}</h3>
                <p className="text-xs text-slate-400">Sana: {new Date(selectedSale.created_at).toLocaleString('uz-UZ')}</p>
              </div>
              <button onClick={() => setSelectedSale(null)} className="text-slate-400 hover:text-slate-900 font-bold text-sm">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-100">
              <div>
                <span className="text-slate-400 text-[10px]">Mijoz:</span>
                <p className="font-bold text-slate-900">{selectedSale.customer?.name || 'Chakana'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Sotuvchi:</span>
                <p className="font-extrabold text-blue-600">{selectedSale.employee?.full_name || 'Administrator'}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Tannarx (COGS):</span>
                <p className="font-bold text-slate-600">{formatMoney(selectedSale.total_cogs)}</p>
              </div>
              <div>
                <span className="text-slate-400 text-[10px]">Yalpi Foyda:</span>
                <p className="font-bold text-emerald-600">+{formatMoney(selectedSale.gross_profit)}</p>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold">
                  <tr>
                    <th className="py-2.5 px-3">Mahsulot</th>
                    <th className="py-2.5 px-3 text-center">Miqdor</th>
                    <th className="py-2.5 px-3 text-right">Sotuv narxi</th>
                    <th className="py-2.5 px-3 text-right">Tannarx (FIFO)</th>
                    <th className="py-2.5 px-3 text-right">Foyda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {selectedSale.items?.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 px-3 font-bold">{item.product?.name || `Mahsulot #${item.product_id}`}</td>
                      <td className="py-2.5 px-3 text-center font-semibold">{item.quantity}</td>
                      <td className="py-2.5 px-3 text-right">{formatMoney(item.unit_price)}</td>
                      <td className="py-2.5 px-3 text-right text-slate-400">{formatMoney(item.unit_cost)}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-600">+{formatMoney(item.gross_profit)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="text-right">
              <button
                onClick={() => setSelectedSale(null)}
                className="px-6 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-full shadow-md"
              >
                Yopish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
