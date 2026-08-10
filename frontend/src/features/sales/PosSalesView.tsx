import React, { useState, useEffect } from 'react';
import { Search, ShoppingCart, Trash2, Plus, Minus, CheckCircle, Printer, AlertTriangle, UserCheck, Users, ShoppingBag } from 'lucide-react';
import { getProducts, getCustomers, getEmployees, createSale } from '../../services/api';
import { Product, Customer, Employee, Sale, User } from '../../types';
import { AlertModal } from '../../components/common/AlertModal';

interface PosSalesViewProps {
  currentUser?: User | null;
}

export const PosSalesView: React.FC<PosSalesViewProps> = ({ currentUser }) => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [cart, setCart] = useState<{ product: Product; quantity: number; unit_price: number }[]>([]);
  
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | ''>('');
  
  const [paidCash, setPaidCash] = useState<number | ''>('');
  const [paidCard, setPaidCard] = useState<number | ''>('');
  const [paidClick, setPaidClick] = useState<number | ''>('');
  const [debtAmount, setDebtAmount] = useState<number | ''>('');

  const [loading, setLoading] = useState(false);
  const [completedSale, setCompletedSale] = useState<Sale | null>(null);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [prods, custs, emps] = await Promise.all([getProducts(), getCustomers(), getEmployees()]);
      setProducts(prods);
      setCustomers(custs);
      setEmployees(emps);

      // Auto pick logged-in employee if available
      if (currentUser && emps.length > 0) {
        const matchedEmp = emps.find(e => e.full_name.toLowerCase() === currentUser.full_name.toLowerCase()) || emps[0];
        setSelectedEmployeeId(matchedEmp.id);
      } else if (emps.length > 0) {
        setSelectedEmployeeId(emps[0].id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const addToCart = (product: Product) => {
    const existingIndex = cart.findIndex((item) => item.product.id === product.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      if (newCart[existingIndex].quantity + 1 > product.current_stock) {
        setAlertMessage(`Omborda [${product.name}] faqat ${product.current_stock} dona bor!`);
        return;
      }
      newCart[existingIndex].quantity += 1;
      setCart(newCart);
    } else {
      if (product.current_stock < 1) {
        setAlertMessage(`Omborda [${product.name}] mahsuloti tugagan!`);
        return;
      }
      setCart([...cart, { product, quantity: 1, unit_price: product.selling_price }]);
    }
  };

  const updateQuantity = (index: number, qty: number) => {
    const item = cart[index];
    if (qty > item.product.current_stock) {
      setAlertMessage(`Omborda [${item.product.name}] faqat ${item.product.current_stock} dona bor!`);
      return;
    }
    if (qty <= 0) {
      removeFromCart(index);
      return;
    }
    const newCart = [...cart];
    newCart[index].quantity = qty;
    setCart(newCart);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const cartTotal = cart.reduce((sum, item) => sum + item.quantity * item.unit_price, 0);
  const totalPaidInput = Number(paidCash || 0) + Number(paidCard || 0) + Number(paidClick || 0);
  const calculatedDebt = Math.max(0, cartTotal - totalPaidInput);

  const handleFinishSale = async () => {
    if (cart.length === 0) {
      setErrorMsg("Savatchada tovar yo'q!");
      return;
    }

    const finalDebt = debtAmount !== '' ? Number(debtAmount) : calculatedDebt;
    if (finalDebt > 0 && !selectedCustomerId) {
      setErrorMsg("⚠️ Qarzga savdo qilish uchun mijoz tanlanishi shart!");
      return;
    }

    setErrorMsg('');
    setLoading(true);

    try {
      const salePayload = {
        customer_id: selectedCustomerId !== '' ? Number(selectedCustomerId) : null,
        employee_id: selectedEmployeeId !== '' ? Number(selectedEmployeeId) : null,
        paid_cash: Number(paidCash || 0),
        paid_card: Number(paidCard || 0),
        paid_click: Number(paidClick || 0),
        debt_amount: finalDebt,
        items: cart.map((item) => ({
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
      };

      const res = await createSale(salePayload);
      setCompletedSale(res);
      setCart([]);
      setPaidCash('');
      setPaidCard('');
      setPaidClick('');
      setDebtAmount('');
      fetchInitialData(); // Refresh product stock
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || "Savdoni yakunlashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";

  const categories = Array.from(new Set(products.map(p => p.category_name)));

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.barcode && p.barcode.includes(searchQuery));
    const matchesCat = selectedCategory === 'ALL' || p.category_name === selectedCategory;
    return matchesSearch && matchesCat;
  });

  return (
    <div className="p-4 sm:p-6 min-h-[calc(100vh-4rem)] flex flex-col lg:flex-row gap-6 max-w-7xl mx-auto font-sans">
      {/* Left Column: Product Catalog & Search */}
      <div className="lg:w-7/12 flex flex-col space-y-4">
        {/* Search Bar & Category Pills */}
        <div className="bg-white border border-slate-100 p-4 rounded-3xl space-y-3 shadow-sm">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Mahsulot nomi, SKU yoki Shtrix-kod skanerlang..."
              className="w-full bg-slate-50 border border-slate-200 rounded-full pl-10 pr-4 py-2.5 text-xs text-slate-900 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            <button
              onClick={() => setSelectedCategory('ALL')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'ALL' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Hamma Mahsulotlar
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                  selectedCategory === cat ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Product Grid */}
        <div className="bg-white border border-slate-100 p-4 rounded-3xl shadow-sm flex-1 min-h-[400px]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {filteredProducts.map((p) => {
              const isOut = p.current_stock <= 0;
              return (
                <div
                  key={p.id}
                  onClick={() => !isOut && addToCart(p)}
                  className={`p-4 rounded-2xl border transition-all cursor-pointer select-none flex flex-col justify-between ${
                    isOut
                      ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed'
                      : 'bg-white border-slate-100 hover:border-blue-500 hover:shadow-md'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
                        {p.category_name}
                      </span>
                      <span className={`text-[10px] font-extrabold ${p.current_stock <= p.min_stock ? 'text-amber-600' : 'text-emerald-600'}`}>
                        {p.current_stock} {p.unit}
                      </span>
                    </div>
                    <h4 className="text-xs font-extrabold text-slate-900 mt-2 line-clamp-2">{p.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">SKU: {p.sku}</p>
                  </div>

                  <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs font-black text-blue-600">{formatMoney(p.selling_price)}</span>
                    <button className="w-6 h-6 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-xs hover:bg-blue-600 hover:text-white transition">
                      +
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Right Column: POS Cart & Checkout Terminal */}
      <div className="lg:w-5/12 bg-white border border-slate-100 rounded-3xl p-5 flex flex-col space-y-4 shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <span>Savdo Savatchasi</span>
          </h3>
          <span className="text-xs font-bold text-slate-400 font-mono">{cart.length} ta tovar</span>
        </div>

        {/* Customer & Worker Selectors */}
        <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100 text-xs">
          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">👤 Mijoz:</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-slate-800 text-[11px]"
            >
              <option value="">Chakana (Naqd)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.current_debt > 0 ? `(Qarz: ${formatMoney(c.current_debt)})` : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-bold text-slate-500 block mb-1">👔 Sotuvchi:</label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value ? Number(e.target.value) : '')}
              className="w-full bg-white border border-slate-200 rounded-xl px-2 py-1.5 font-bold text-slate-800 text-[11px]"
            >
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.full_name} ({e.position})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Cart Items List */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-[160px]">
          {cart.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-slate-400 space-y-2">
              <ShoppingCart className="w-8 h-8 stroke-1 text-slate-300" />
              <p className="text-xs font-medium">Savatcha bo'sh. Mahsulot tanlang.</p>
            </div>
          ) : (
            cart.map((item, idx) => (
              <div key={idx} className="p-3 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between text-xs">
                <div className="flex-1 pr-2">
                  <h5 className="font-extrabold text-slate-900 leading-tight">{item.product.name}</h5>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-slate-400 text-[10px]">{formatMoney(item.unit_price)} ×</span>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => updateQuantity(idx, Number(e.target.value))}
                      className="w-12 bg-white border border-slate-300 text-center rounded-lg py-0.5 text-xs text-slate-900 font-extrabold"
                    />
                  </div>
                </div>

                <div className="text-right flex items-center gap-3">
                  <span className="font-black text-blue-600">{formatMoney(item.quantity * item.unit_price)}</span>
                  <button onClick={() => removeFromCart(idx)} className="text-rose-400 hover:text-rose-600 p-1">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Financial Breakdown & Split Payments */}
        <div className="pt-3 border-t border-slate-100 space-y-3">
          <div className="flex items-center justify-between text-sm font-extrabold text-slate-900 bg-slate-50 p-3 rounded-2xl">
            <span>Jami Summa:</span>
            <span className="text-lg font-black text-blue-600">{formatMoney(cartTotal)}</span>
          </div>

          {/* Payment Type Inputs Grid */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div>
              <label className="text-[10px] font-bold text-slate-500">💵 Naqd:</label>
              <input
                type="number"
                value={paidCash}
                onChange={(e) => setPaidCash(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500">💳 Karta:</label>
              <input
                type="number"
                value={paidCard}
                onChange={(e) => setPaidCard(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-500">📱 Click/Payme:</label>
              <input
                type="number"
                value={paidClick}
                onChange={(e) => setPaidClick(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-xs text-slate-900 font-bold focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold text-amber-600">🤝 Qarz:</label>
              <input
                type="number"
                value={debtAmount !== '' ? debtAmount : calculatedDebt > 0 ? calculatedDebt : ''}
                onChange={(e) => setDebtAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="0"
                className="w-full bg-amber-50 border border-amber-200 rounded-xl px-2.5 py-1.5 text-xs text-amber-900 font-bold focus:ring-2 focus:ring-amber-500/20"
              />
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-xs flex items-center gap-2 font-bold">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleFinishSale}
            disabled={loading || cart.length === 0}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-extrabold text-xs rounded-2xl shadow-lg shadow-emerald-600/20 transition flex items-center justify-center gap-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>SAVDONI YAKUNLASH VA DOKUMENTLASH</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Completed Sale Receipt Modal */}
      {completedSale && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-2">
                <CheckCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-extrabold text-slate-900">Savdo Muvaffaqiyatli Saqlandi!</h3>
              <p className="text-xs text-slate-400 font-mono">Chek № {completedSale.sale_number}</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 text-xs space-y-2 font-mono">
              <div className="flex justify-between">
                <span className="text-slate-400">Vaqt:</span>
                <span className="text-slate-700">{new Date(completedSale.created_at).toLocaleString('uz-UZ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Jami Summa:</span>
                <span className="text-slate-900 font-bold">{formatMoney(completedSale.total_amount)}</span>
              </div>
              <div className="flex justify-between text-emerald-600 font-bold">
                <span>Yalpi Foyda:</span>
                <span>+{formatMoney(completedSale.gross_profit)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-2xl flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Chek Chiqarish</span>
              </button>
              <button
                onClick={() => setCompletedSale(null)}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md"
              >
                Yangi Savdo →
              </button>
            </div>
          </div>
        </div>
      )}

      <AlertModal
        isOpen={alertMessage !== null}
        message={alertMessage || ''}
        onClose={() => setAlertMessage(null)}
      />
    </div>
  );
};
