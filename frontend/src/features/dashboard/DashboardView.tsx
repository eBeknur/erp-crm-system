import React, { useEffect, useState } from 'react';
import {
  TrendingUp, DollarSign, ShoppingBag, ArrowDownRight, PackageCheck,
  Building2, UserMinus, Wallet, ArrowUpRight,
  Calendar, MessageSquare, Video, ChevronLeft, ChevronRight, Landmark, ArrowRight
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, Tooltip, ResponsiveContainer
} from 'recharts';
import { getKpis, getDashboardCharts, getEmployees, getCredits } from '../../services/api';
import { KpiData, Employee, Credit } from '../../types';

interface DashboardViewProps {
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const [kpi, setKpi] = useState<KpiData | null>(null);
  const [charts, setCharts] = useState<any>(null);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [credits, setCredits] = useState<Credit[]>([]);
  const [activeEmpIdx, setActiveEmpIdx] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [kpiRes, chartRes, empRes, credRes] = await Promise.all([
          getKpis(),
          getDashboardCharts(),
          getEmployees(),
          getCredits()
        ]);
        setKpi(kpiRes);
        setCharts(chartRes);
        setEmployees(empRes);
        setCredits(credRes);
      } catch (err) {
        console.error('Error fetching dashboard:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  };

  if (loading || !kpi) {
    return (
      <div className="p-12 flex items-center justify-center h-full text-slate-400">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const kpiCards = [
    { title: 'Bugungi savdo', value: kpi.today_sales, change: '+14.5%', isUp: true, icon: ShoppingBag, color: 'from-blue-500 to-indigo-500' },
    { title: 'Bugungi daromad', value: kpi.today_revenue, change: '+12.0%', isUp: true, icon: TrendingUp, color: 'from-emerald-500 to-teal-500' },
    { title: 'Bugungi xarajat', value: kpi.today_expense, change: '-3.2%', isUp: false, icon: ArrowDownRight, color: 'from-rose-500 to-pink-500' },
    { title: 'Bugungi sof foyda', value: kpi.today_net_profit, change: '+18.4%', isUp: true, icon: DollarSign, color: 'from-purple-500 to-violet-500' },
    { title: 'Ombor qiymati', value: kpi.inventory_value, icon: PackageCheck, color: 'from-cyan-500 to-blue-500' },
    { title: 'Postavshik qarzi', value: kpi.supplier_debt, icon: Building2, color: 'from-amber-500 to-orange-500' },
    { title: 'Mijozlar qarzi', value: kpi.customer_debt, icon: UserMinus, color: 'from-indigo-500 to-blue-500' },
    { title: 'Berilishi kerak oylik', value: kpi.pending_salaries, icon: Wallet, color: 'from-fuchsia-500 to-rose-500' },
  ];

  const currentEmp = employees[activeEmpIdx] || { full_name: 'Ali Vohidov', position: 'Katta Sotuvchi' };

  const totalCreditDebt = credits.reduce((sum, c) => sum + c.remaining_balance, 0);
  const monthlyPaymentTotal = credits.filter(c => c.status === 'ACTIVE').reduce((sum, c) => sum + c.monthly_payment, 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Top Main Section (2 Columns Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left / Center Main Panel (8 Cols) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Hero Managing Business Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-4 relative overflow-hidden">
            <div className="max-w-md space-y-3">
              <h2 className="text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">
                Biznesingizni boshqarishni boshlang!
              </h2>
              <p className="text-xs text-slate-500 leading-relaxed font-medium">
                Mijozlar bazasini yarating, ombor qoldiqlari, moliya va kredit statistikalarini real-vaqtda kuzating.
              </p>
              <button
                onClick={() => onNavigate('purchases')}
                className="mt-2 inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-xs font-bold shadow-lg shadow-blue-600/25 transition"
              >
                <span>+ Yangi operatsiya qo'shish</span>
              </button>
            </div>
          </div>

          {/* REPLACED SCREENSHOT AREA: Kreditlar va Bank Qarzlari Card */}
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center font-bold">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Kreditlar va Bank Qarzlari Nazorati</h3>
                  <p className="text-xs text-slate-400 font-medium">Jami to'lanadigan bank kreditlari va oylik majburiyatlar</p>
                </div>
              </div>
              <button
                onClick={() => onNavigate('credits')}
                className="flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
              >
                <span>Kreditlar bo'limiga o'tish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Credit Summary Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Jami Qolgan Qoldiq</span>
                <span className="text-lg font-black text-rose-600">{formatMoney(totalCreditDebt)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Oylik Majburiy To'lov</span>
                <span className="text-lg font-black text-blue-600">{formatMoney(monthlyPaymentTotal)}</span>
              </div>
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-1">
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Faol Kreditlar Soni</span>
                <span className="text-lg font-black text-slate-900">{credits.filter(c => c.status === 'ACTIVE').length} ta bank</span>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
              <span className="font-semibold">Administrator Tomonidan Boshqariladi</span>
              <span className="text-emerald-600 font-bold">100% Sinxronlashgan Ledger</span>
            </div>
          </div>

          {/* Bottom Donut Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">Bugungi Savdo Hujmati</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">{formatMoney(kpi.today_sales)}</h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">O'tgan oy: 18,500,000 so'm</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-purple-500 border-t-purple-200 flex items-center justify-center font-extrabold text-xs text-purple-600">
                +39%
              </div>
            </div>

            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-slate-400">Rentabellik darajasi</p>
                <h4 className="text-2xl font-black text-slate-900 mt-1">48.5%</h4>
                <p className="text-[10px] font-semibold text-slate-400 mt-1">O'tgan oy: 42.0%</p>
              </div>
              <div className="w-16 h-16 rounded-full border-4 border-amber-400 border-t-amber-100 flex items-center justify-center font-extrabold text-xs text-amber-600">
                +48%
              </div>
            </div>
          </div>

        </div>

        {/* Right Sidebar Widgets Panel (4 Cols) */}
        <div className="lg:col-span-4 space-y-8">
          
          {/* Your Team Card Carousel */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">Jamoangiz</h3>
                <p className="text-xs text-slate-400">Ishchilarizning faolligi va lavozimi</p>
              </div>
            </div>

            <div className="bg-gradient-to-b from-blue-500 to-blue-600 rounded-3xl p-6 text-white text-center space-y-4 shadow-lg shadow-blue-500/20 relative">
              <div className="relative inline-block">
                <div className="w-20 h-20 rounded-full bg-blue-400 border-4 border-white/30 mx-auto flex items-center justify-center text-3xl font-bold shadow-md">
                  👩‍💼
                </div>
              </div>
              <div>
                <h4 className="text-base font-extrabold">{currentEmp.full_name}</h4>
                <p className="text-xs text-blue-100 font-medium">{currentEmp.position}</p>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center text-white transition">
                  <Calendar className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center text-white transition">
                  <MessageSquare className="w-4 h-4" />
                </button>
                <button className="w-9 h-9 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur flex items-center justify-center text-white transition">
                  <Video className="w-4 h-4" />
                </button>
              </div>

              <button
                onClick={() => setActiveEmpIdx((prev) => (prev > 0 ? prev - 1 : employees.length - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setActiveEmpIdx((prev) => (prev < employees.length - 1 ? prev + 1 : 0))}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Statistics Graph Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-extrabold text-slate-900">Statistika</h3>
              <p className="text-xs text-slate-400">Loyiha va savdolar dinamikasi</p>
            </div>

            <div className="h-52 w-full relative pt-4">
              <div className="absolute right-12 top-2 z-10 bg-slate-900 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-md">
                max
              </div>

              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={charts?.daily_trend || []}>
                  <defs>
                    <linearGradient id="purpleGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="#94a3b8" fontSize={10} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', borderRadius: '12px', fontSize: '11px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                    formatter={(val: any) => [formatMoney(val)]}
                  />
                  <Area type="monotone" dataKey="sales" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#purpleGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>

      </div>

      {/* 8 KPI Cards Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-extrabold text-slate-900">Moliya va Ombor KPI Ko'rsatkichlari</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpiCards.map((card, idx) => {
            const Icon = card.icon;
            return (
              <div key={idx} className="bg-white border border-slate-100 p-5 rounded-3xl shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400">{card.title}</span>
                  <div className={`w-9 h-9 rounded-2xl bg-gradient-to-tr ${card.color} flex items-center justify-center text-white shadow-md`}>
                    <Icon className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-4">
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">{formatMoney(card.value)}</h3>
                  {card.change && (
                    <p className={`text-[11px] font-bold mt-1.5 flex items-center gap-0.5 ${card.isUp ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {card.isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                      <span>{card.change} o'tgan haftaga nisbatan</span>
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
