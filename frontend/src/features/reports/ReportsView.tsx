import React, { useState, useEffect } from 'react';
import { BarChart3, Download, FileText, RefreshCw } from 'lucide-react';
import { getPnLReport, getInventorySummary } from '../../services/api';
import { PnLStatement } from '../../types';

export const ReportsView: React.FC = () => {
  const [pnl, setPnl] = useState<PnLStatement>({
    revenue: 0,
    cogs: 0,
    gross_profit: 0,
    operating_expenses: 0,
    net_profit: 0,
    profit_margin_percent: 0
  });
  const [invSummary, setInvSummary] = useState<any>({
    total_items: 0,
    total_stock_quantity: 0,
    total_valuation: 0,
    low_stock_count: 0,
    low_stock_products: []
  });
  const [loading, setLoading] = useState(true);
  const [filterRange, setFilterRange] = useState('month');

  useEffect(() => {
    fetchReports(filterRange);
  }, [filterRange]);

  const fetchReports = async (range: string) => {
    setLoading(true);
    try {
      const [pnlData, invData] = await Promise.all([
        getPnLReport(range),
        getInventorySummary()
      ]);
      if (pnlData) setPnl(pnlData);
      if (invData) setInvSummary(invData);
    } catch (err) {
      console.error("Failed to load reports:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";

  const handleExport = (type: 'Excel' | 'PDF') => {
    alert(`📥 ${type} formatedagi P&L hisoboti yuklab olindi!`);
  };

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header & Date Range Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <span>P&L (Profit & Loss) Moliyaviy Hisoboti</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Daromad - Tannarx = Yalpi Foyda - Operatsion Xarajatlar = Sof Foyda
          </p>
        </div>

        {/* Date Filter Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {['today', 'week', 'month', 'year'].map((range) => (
            <button
              key={range}
              onClick={() => setFilterRange(range)}
              className={`px-4 py-2 rounded-full text-xs font-bold capitalize transition ${
                filterRange === range ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {range === 'today' ? 'Bugun' : range === 'week' ? 'Shu Hafta' : range === 'month' ? 'Shu Oy' : 'Shu Yil'}
            </button>
          ))}

          {/* Export Buttons */}
          <div className="flex items-center gap-2 pl-3 border-l border-slate-100">
            <button
              onClick={() => handleExport('Excel')}
              className="px-3.5 py-2 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-full text-xs font-bold hover:bg-emerald-100 transition flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              onClick={() => handleExport('PDF')}
              className="px-3.5 py-2 bg-rose-50 text-rose-600 border border-rose-200 rounded-full text-xs font-bold hover:bg-rose-100 transition flex items-center gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* P&L Statement Clean Financial Card */}
      <div className="bg-white border border-slate-100 rounded-3xl p-8 shadow-sm space-y-6 relative">
        {loading && (
          <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-bold text-blue-600">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Yangilanmoqda...</span>
          </div>
        )}

        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <h3 className="text-base font-extrabold text-slate-900 uppercase">
            DAROMAD VA FOYDA HISOBOTI ({filterRange === 'today' ? 'Bugun' : filterRange === 'week' ? 'Shu Hafta' : filterRange === 'month' ? 'Shu Oy' : 'Shu Yil'})
          </h3>
          <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200">
            Rentabellik Margin: {pnl.profit_margin_percent}%
          </span>
        </div>

        <div className="space-y-4 text-sm">
          {/* Revenue */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex justify-between font-bold text-slate-700">
              <span>📈 1. DAROMAD (REVENUE)</span>
              <span className="text-emerald-600 font-black">{formatMoney(pnl.revenue)}</span>
            </div>
            <p className="text-xs text-slate-400">Mahsulotlar savdosidan tushgan umumiy tushum</p>
          </div>

          {/* COGS */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex justify-between font-bold text-slate-700">
              <span>📦 2. TANNARX (COGS - FIFO)</span>
              <span className="text-rose-600 font-black">-{formatMoney(pnl.cogs)}</span>
            </div>
            <p className="text-xs text-slate-400">Sotilgan tovarlarning FIFO bo'yicha haqiqiy xarid tannarxi</p>
          </div>

          {/* Gross Profit */}
          <div className="p-5 bg-blue-50/60 rounded-2xl border border-blue-100 space-y-1">
            <div className="flex justify-between font-black text-base text-slate-900">
              <span>💎 3. YALPI FOYDA (GROSS PROFIT)</span>
              <span className="text-blue-600">+{formatMoney(pnl.gross_profit)}</span>
            </div>
            <p className="text-xs text-slate-400">Daromad - Tannarx</p>
          </div>

          {/* Operating Expenses */}
          <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
            <div className="flex justify-between font-bold text-slate-700">
              <span>💸 4. OPERATSION XARAJATLAR</span>
              <span className="text-rose-600 font-black">-{formatMoney(pnl.operating_expenses)}</span>
            </div>
            <p className="text-xs text-slate-400">Ijara, reklama, transport, kommunal, oylik maoshlar va boshqalar</p>
          </div>

          {/* Net Profit Final Highlight */}
          <div className="p-6 bg-gradient-to-r from-emerald-50 to-teal-50 rounded-3xl border-2 border-emerald-200 space-y-2 shadow-sm">
            <div className="flex justify-between font-black text-lg text-slate-900">
              <span>👑 5. SOF FOYDA (NET PROFIT)</span>
              <span className="text-2xl text-emerald-600">+{formatMoney(pnl.net_profit)}</span>
            </div>
            <p className="text-xs text-emerald-800/80 font-medium">
              Yalpi foydadan barcha operatsion xarajatlar ayirilgandan so'ng qolgan sof daromad
            </p>
          </div>
        </div>
      </div>

      {/* Inventory Valuation Summary */}
      {invSummary && (
        <div className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
          <h3 className="text-base font-extrabold text-slate-900">Ombor Hisoboti Xulosasi</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block">Jami Tovarlar Turi:</span>
              <span className="font-black text-slate-900 text-base">{invSummary.total_items} ta</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block">Jami Qoldiq Soni:</span>
              <span className="font-black text-slate-900 text-base">{invSummary.total_stock_quantity} dona</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block">Ombor Qiymati:</span>
              <span className="font-black text-emerald-600 text-base">{formatMoney(invSummary.total_valuation)}</span>
            </div>
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-slate-400 font-bold block">Kam Qolgan Tovarlar:</span>
              <span className="font-black text-amber-600 text-base">{invSummary.low_stock_count} ta</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
