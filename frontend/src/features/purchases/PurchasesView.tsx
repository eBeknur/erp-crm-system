import React, { useState, useEffect } from 'react';
import { ArrowDownToLine, Plus, Trash2 } from 'lucide-react';
import { getPurchases, getSuppliers, getProducts, createPurchase } from '../../services/api';
import { Purchase, Supplier, Product } from '../../types';
import { AlertModal } from '../../components/common/AlertModal';

export const PurchasesView: React.FC = () => {
  const [alertMessage, setAlertMessage] = useState<string | null>(null);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Form
  const [showAddModal, setShowAddModal] = useState(false);
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paidAmount, setPaidAmount] = useState<number | ''>('');
  const [items, setItems] = useState<{ product_id: number; quantity: number; cost_price: number; selling_price: number }[]>([]);
  
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [itemQty, setItemQty] = useState<number | ''>(10);
  const [itemCost, setItemCost] = useState<number | ''>('');
  const [itemSalePrice, setItemSalePrice] = useState<number | ''>('');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [purchRes, supRes, prodRes] = await Promise.all([getPurchases(), getSuppliers(), getProducts()]);
      setPurchases(purchRes);
      setSuppliers(supRes);
      setProducts(prodRes);
      if (supRes.length > 0) setSupplierId(supRes[0].id);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (pid: number) => {
    setSelectedProductId(pid);
    const prod = products.find(p => p.id === pid);
    if (prod) {
      setItemCost(prod.cost_price);
      setItemSalePrice(prod.selling_price);
    }
  };

  const handleAddItemToInvoice = () => {
    if (!selectedProductId || !itemQty || !itemCost) {
      setAlertMessage("Mahsulot, miqdor va tannarx kiritilishi shart!");
      return;
    }
    setItems([
      ...items,
      {
        product_id: Number(selectedProductId),
        quantity: Number(itemQty),
        cost_price: Number(itemCost),
        selling_price: Number(itemSalePrice || 0)
      }
    ]);
    setSelectedProductId('');
    setItemQty(10);
    setItemCost('');
    setItemSalePrice('');
  };

  const handleSavePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierId || !invoiceNumber || items.length === 0) {
      setAlertMessage("Postavshik, Invoice № va tovarlar kiritilishi shart!");
      return;
    }

    try {
      await createPurchase({
        supplier_id: Number(supplierId),
        invoice_number: invoiceNumber,
        paid_amount: Number(paidAmount || 0),
        items
      });
      setShowAddModal(false);
      setInvoiceNumber('');
      setPaidAmount('');
      setItems([]);
      fetchData();
    } catch (err: any) {
      setAlertMessage(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";
  const totalInvoiceCost = items.reduce((sum, i) => sum + i.quantity * i.cost_price, 0);

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <ArrowDownToLine className="w-5 h-5 text-emerald-600" />
            <span>Tovar Kirimi (Purchases)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Postavshikdan kirim qilinganda Ombor + Batch oshadi va Postavshik qarzi/to'lovi yangilanadi
          </p>
        </div>

        <button
          onClick={() => {
            setInvoiceNumber(`INV-2026-${Math.floor(1000 + Math.random() * 9000)}`);
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md shadow-emerald-600/20 transition"
        >
          <Plus className="w-4 h-4" />
          <span>+ Yangi Kirim Qilish</span>
        </button>
      </div>

      {/* History Table */}
      <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-4 px-5">Invoice №</th>
                <th className="py-4 px-5">Sana</th>
                <th className="py-4 px-5">Postavshik</th>
                <th className="py-4 px-5 text-right">Jami Summa</th>
                <th className="py-4 px-5 text-right text-emerald-600">To'langan</th>
                <th className="py-4 px-5 text-right text-amber-600">Postavshik Qarzi</th>
                <th className="py-4 px-5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {loading ? (
                <tr><td colSpan={7} className="text-center py-12 text-slate-400">Yuklanmoqda...</td></tr>
              ) : purchases.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-4 px-5 font-mono font-bold text-slate-900">{p.invoice_number}</td>
                  <td className="py-4 px-5 text-slate-400">
                    {new Date(p.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-900">{p.supplier?.name || 'Postavshik'}</td>
                  <td className="py-4 px-5 text-right font-extrabold text-slate-900">{formatMoney(p.total_amount)}</td>
                  <td className="py-4 px-5 text-right font-bold text-emerald-600">{formatMoney(p.paid_amount)}</td>
                  <td className="py-4 px-5 text-right font-bold text-amber-600">{formatMoney(p.debt_amount)}</td>
                  <td className="py-4 px-5 text-center">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-100">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Purchase Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleSavePurchase} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-2xl shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Tovar Kirim Hujjatini Rasmiylashtirish</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Postavshik *</label>
                <select
                  value={supplierId}
                  onChange={(e) => setSupplierId(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 focus:outline-none"
                  required
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Qarz: {formatMoney(s.current_debt)})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Invoice № *</label>
                <input
                  type="text"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-mono focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2">
              <span className="text-[11px] font-bold text-slate-600 block">Kirim Tovarini Tanlash</span>
              <div className="grid grid-cols-12 gap-2 text-xs">
                <div className="col-span-4">
                  <select
                    value={selectedProductId}
                    onChange={(e) => handleProductSelect(Number(e.target.value))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 focus:outline-none"
                  >
                    <option value="">-- Mahsulot tanlang --</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <input
                    type="number"
                    value={itemQty}
                    onChange={(e) => setItemQty(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Miqdor"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 text-center focus:outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <input
                    type="number"
                    value={itemCost}
                    onChange={(e) => setItemCost(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Tannarx"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 text-right focus:outline-none"
                  />
                </div>
                <div className="col-span-3 flex gap-1">
                  <input
                    type="number"
                    value={itemSalePrice}
                    onChange={(e) => setItemSalePrice(e.target.value ? Number(e.target.value) : '')}
                    placeholder="Sotuv"
                    className="w-full bg-white border border-slate-200 rounded-xl px-2 py-2 text-slate-800 text-right focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddItemToInvoice}
                    className="px-3 bg-blue-600 text-white font-bold rounded-xl text-xs"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            <div className="border border-slate-100 rounded-2xl overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Mahsulot</th>
                    <th className="py-2.5 px-3 text-center">Miqdor</th>
                    <th className="py-2.5 px-3 text-right">Tannarx</th>
                    <th className="py-2.5 px-3 text-right">Jami Cost</th>
                    <th className="py-2.5 px-3 text-center">O'chirish</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {items.map((it, idx) => {
                    const prod = products.find(p => p.id === it.product_id);
                    return (
                      <tr key={idx}>
                        <td className="py-2.5 px-3 font-bold">{prod?.name || it.product_id}</td>
                        <td className="py-2.5 px-3 text-center font-bold">{it.quantity}</td>
                        <td className="py-2.5 px-3 text-right">{formatMoney(it.cost_price)}</td>
                        <td className="py-2.5 px-3 text-right font-extrabold text-blue-600">{formatMoney(it.quantity * it.cost_price)}</td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => setItems(items.filter((_, i) => i !== idx))}
                            className="text-rose-500 hover:text-rose-700"
                          >
                            <Trash2 className="w-3.5 h-3.5 mx-auto" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2 text-xs">
              <div className="flex justify-between items-center font-bold text-slate-900">
                <span>Jami Hujjat Summasi:</span>
                <span className="text-base text-blue-600">{formatMoney(totalInvoiceCost)}</span>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                <div>
                  <label className="text-slate-500 block mb-1">To'langan Summa (Naqd/Bank):</label>
                  <input
                    type="number"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(e.target.value ? Number(e.target.value) : '')}
                    placeholder="0"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-emerald-600 font-bold text-right focus:outline-none"
                  />
                </div>
                <div className="text-right">
                  <span className="text-slate-500 block mb-1">Qolgan Postavshik Qarzi:</span>
                  <span className="text-sm font-extrabold text-amber-600">
                    {formatMoney(Math.max(0, totalInvoiceCost - Number(paidAmount || 0)))}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full"
              >
                Bekor qilish
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md"
              >
                Kirimni Saqlash
              </button>
            </div>
          </form>
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
