import React, { useState, useEffect } from 'react';
import { Package, Plus, Search, AlertTriangle, Edit2, Trash2 } from 'lucide-react';
import { getProducts, createProduct, updateProduct, deleteProduct, getStockMovements } from '../../services/api';
import { Product, StockMovement, User } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface WarehouseViewProps {
  currentUser?: User | null;
}

export const WarehouseView: React.FC<WarehouseViewProps> = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState<'products' | 'movements'>('products');
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  const canEditProduct = !currentUser || currentUser.role === 'ADMIN' || currentUser.role === 'DEVELOPER' || currentUser.role === 'SUPER_ADMIN' || currentUser.role === 'MANAGER' || currentUser.role === 'HR_MANAGER';

  // Add Form State
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryName, setCategoryName] = useState('Aksessuarlar');
  const [unit, setUnit] = useState('dona');
  const [costPrice, setCostPrice] = useState<number | ''>('');
  const [sellingPrice, setSellingPrice] = useState<number | ''>('');
  const [minStock, setMinStock] = useState<number | ''>(10);
  const [initialStock, setInitialStock] = useState<number | ''>('');

  // Edit Form State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editName, setEditName] = useState('');
  const [editSku, setEditSku] = useState('');
  const [editBarcode, setEditBarcode] = useState('');
  const [editCategory, setEditCategory] = useState('');
  const [editUnit, setEditUnit] = useState('');
  const [editCostPrice, setEditCostPrice] = useState<number | ''>('');
  const [editSellingPrice, setEditSellingPrice] = useState<number | ''>('');
  const [editMinStock, setEditMinStock] = useState<number | ''>('');
  const [editStock, setEditStock] = useState<number | ''>('');

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
      const [prods, moves] = await Promise.all([getProducts(), getStockMovements()]);
      setProducts(prods);
      setMovements(moves);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) {
      alert("Mahsulot nomini kiritishingiz shart!");
      return;
    }
    const finalSku = sku.trim() || `PRD-${Date.now().toString().slice(-6)}`;
    try {
      await createProduct({
        name,
        sku: finalSku,
        barcode: barcode || undefined,
        category_name: categoryName,
        unit,
        cost_price: Number(costPrice || 0),
        selling_price: Number(sellingPrice || 0),
        min_stock: Number(minStock || 5),
        initial_stock: Number(initialStock || 0)
      });
      setShowAddModal(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setEditName(p.name);
    setEditSku(p.sku);
    setEditBarcode(p.barcode || '');
    setEditCategory(p.category_name);
    setEditUnit(p.unit);
    setEditCostPrice(p.cost_price);
    setEditSellingPrice(p.selling_price);
    setEditMinStock(p.min_stock);
    setEditStock(p.current_stock);
    setShowEditModal(true);
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      await updateProduct(editingProduct.id, {
        name: editName,
        sku: editSku,
        barcode: editBarcode || undefined,
        category_name: editCategory,
        unit: editUnit,
        cost_price: Number(editCostPrice || 0),
        selling_price: Number(editSellingPrice || 0),
        min_stock: Number(editMinStock || 0),
        current_stock: Number(editStock || 0)
      });
      setShowEditModal(false);
      setEditingProduct(null);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; prodId?: number; prodName?: string }>({ isOpen: false });

  const askDeleteProduct = (id: number, prodName: string) => {
    setDeleteConfirm({ isOpen: true, prodId: id, prodName });
  };

  const handleConfirmDeleteProduct = async () => {
    if (!deleteConfirm.prodId) return;
    const { prodId } = deleteConfirm;
    setDeleteConfirm({ isOpen: false });
    try {
      await deleteProduct(prodId);
      fetchData();
    } catch (err: any) {
      alert(err.response?.data?.detail || "Xatolik yuz berdi");
    }
  };

  const resetForm = () => {
    setName('');
    setSku('');
    setBarcode('');
    setCategoryName('Aksessuarlar');
    setUnit('dona');
    setCostPrice('');
    setSellingPrice('');
    setMinStock(10);
    setInitialStock('');
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";

  const totalInventoryValuation = products.reduce(
    (sum, p) => sum + p.current_stock * p.cost_price, 0
  );
  const lowStockCount = products.filter(p => p.current_stock <= p.min_stock).length;

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (p.barcode && p.barcode.includes(searchQuery))
  );

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto font-sans">
      {/* Banner & Valuation Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <Package className="w-5 h-5 text-blue-600" />
            <span>Ombor & Inventory Ledger (FIFO)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Qoldiqlar va audit harakatlari (Kirim, Chiqim) boshqaruvi
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-slate-50 px-5 py-2.5 rounded-2xl border border-slate-100 text-right">
            <span className="text-[10px] text-slate-400 uppercase font-extrabold block">Jami Ombor Qiymati</span>
            <span className="text-base font-black text-emerald-600">{formatMoney(totalInventoryValuation)}</span>
          </div>

          {canEditProduct && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-md shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>Yangi Mahsulot</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-1 bg-white border border-slate-100 p-1.5 rounded-2xl w-fit shadow-xs">
          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'products' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📦 Tovarlar Qoldig'i ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-extrabold transition ${
              activeTab === 'movements' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            📋 Kirim / Chiqim Harakatlari ({movements.length})
          </button>
        </div>

        {activeTab === 'products' && (
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Nomi, SKU yoki Barcode..."
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-full text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
            />
          </div>
        )}
      </div>

      {/* Low Stock Banner */}
      {lowStockCount > 0 && activeTab === 'products' && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl text-amber-800 text-xs flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Ogohlantirish: <strong>{lowStockCount} ta</strong> mahsulot minimal zaxiradan kam qolgan!</span>
          </div>
        </div>
      )}

      {/* Table Content */}
      {activeTab === 'products' ? (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Mahsulot Nomi</th>
                  <th className="py-4 px-5">SKU / Barcode</th>
                  <th className="py-4 px-5">Kategoriya</th>
                  <th className="py-4 px-5 text-center">Minimal Zaxira</th>
                  <th className="py-4 px-5 text-center">Joriy Qoldiq</th>
                  <th className="py-4 px-5 text-right">Tannarx</th>
                  <th className="py-4 px-5 text-right">Sotuv Narxi</th>
                  <th className="py-4 px-5 text-right">Ombor Qiymati</th>
                  {canEditProduct && <th className="py-4 px-5 text-center">Amallar</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredProducts.map((p) => {
                  const isLow = p.current_stock <= p.min_stock;
                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-4 px-5 font-bold text-slate-900">{p.name}</td>
                      <td className="py-4 px-5 font-mono text-slate-400">{p.sku} {p.barcode ? `| ${p.barcode}` : ''}</td>
                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-[10px] font-bold">
                          {p.category_name}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-center text-slate-400">{p.min_stock} {p.unit}</td>
                      <td className="py-4 px-5 text-center">
                        <span className={`px-3 py-1 rounded-full font-extrabold text-[11px] ${
                          isLow ? 'bg-amber-100 text-amber-700 border border-amber-200' : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {p.current_stock} {p.unit}
                        </span>
                      </td>
                      <td className="py-4 px-5 text-right text-slate-400">{formatMoney(p.cost_price)}</td>
                      <td className="py-4 px-5 text-right font-extrabold text-blue-600">{formatMoney(p.selling_price)}</td>
                      <td className="py-4 px-5 text-right font-bold text-slate-900">{formatMoney(p.current_stock * p.cost_price)}</td>
                      {canEditProduct && (
                        <td className="py-4 px-5 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenEditModal(p)}
                              className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-xl transition"
                              title="Sonini yoki narxini tahrirlash"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => askDeleteProduct(p.id, p.name)}
                              className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-xl transition"
                              title="Tovarni o'chirish"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="bg-white border border-slate-100 rounded-3xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-4 px-5">Vaqt</th>
                  <th className="py-4 px-5">Harakat Turi</th>
                  <th className="py-4 px-5">Mahsulot ID</th>
                  <th className="py-4 px-5 text-center">Miqdor</th>
                  <th className="py-4 px-5 text-right">Tannarx</th>
                  <th className="py-4 px-5">Izoh / Hujjat</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/80 transition">
                    <td className="py-4 px-5 text-slate-400">
                      {new Date(m.created_at).toLocaleString('uz-UZ', { dateStyle: 'short', timeStyle: 'short' })}
                    </td>
                    <td className="py-4 px-5">
                      <span className={`px-2.5 py-1 rounded-full font-extrabold text-[10px] ${
                        m.movement_type === 'IN' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {m.movement_type === 'IN' ? '📥 KIRIM' : '📤 CHIQIM'}
                      </span>
                    </td>
                    <td className="py-4 px-5 font-mono">Product #{m.product_id}</td>
                    <td className="py-4 px-5 text-center font-bold text-slate-900">{m.quantity}</td>
                    <td className="py-4 px-5 text-right text-slate-400">{formatMoney(m.cost_price)}</td>
                    <td className="py-4 px-5 text-slate-500">{m.notes || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateProduct} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Yangi Mahsulot Yaratish</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-slate-500 font-bold block mb-1">Mahsulot Nomi *</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="masalan: iPhone 15 Pro Case"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-slate-500 font-bold block mb-1">Shtrix-kod (Barcode)</label>
                <input
                  type="text"
                  value={barcode}
                  onChange={(e) => setBarcode(e.target.value)}
                  placeholder="4780012345"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Kategoriya</label>
                <input
                  type="text"
                  value={categoryName}
                  onChange={(e) => setCategoryName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">O'lchov Birligi</label>
                <select
                  value={unit}
                  onChange={(e) => setUnit(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                >
                  <option value="dona">dona</option>
                  <option value="kg">kg</option>
                  <option value="metr">metr</option>
                  <option value="litr">litr</option>
                  <option value="quti">quti</option>
                </select>
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Xarid Tannarxi (so'm)</label>
                <input
                  type="number"
                  value={costPrice}
                  onChange={(e) => setCostPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="45000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Sotuv Narxi (so'm)</label>
                <input
                  type="number"
                  value={sellingPrice}
                  onChange={(e) => setSellingPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="70000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Minimal Zaxira Chegarasi</label>
                <input
                  type="number"
                  value={minStock}
                  onChange={(e) => setMinStock(e.target.value ? Number(e.target.value) : '')}
                  placeholder="5"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Boshlang'ich Qoldiq (Son)</label>
                <input
                  type="number"
                  value={initialStock}
                  onChange={(e) => setInitialStock(e.target.value ? Number(e.target.value) : '')}
                  placeholder="50"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
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

      {/* Edit Product & Stock Quantity Adjustment Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleUpdateProduct} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-lg shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-base font-extrabold text-slate-900">Mahsulot va Qoldiq Sonini O'zgartirish</h3>
              <button type="button" onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-900 font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="col-span-2">
                <label className="text-slate-500 font-bold block mb-1">Mahsulot Nomi *</label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                  required
                />
              </div>

              {/* Stock Quantity Direct Edit Highlight Box */}
              <div className="col-span-2 p-4 bg-blue-50/80 border border-blue-100 rounded-2xl space-y-2">
                <label className="text-xs font-black text-blue-900 block">📦 Ombordagi Joriy Qoldiq Soni ({editingProduct.unit}):</label>
                <input
                  type="number"
                  value={editStock}
                  onChange={(e) => setEditStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-white border border-blue-200 rounded-xl px-4 py-2.5 text-blue-900 font-black text-base focus:ring-2 focus:ring-blue-500/20"
                  required
                />
                <p className="text-[10px] text-blue-700">Administrator sifatida mahsulot qoldiq sonini to'g'ridan-to'g'ri o'zgartirishingiz mumkin.</p>
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-slate-500 font-bold block mb-1">Shtrix-kod (Barcode)</label>
                <input
                  type="text"
                  value={editBarcode}
                  onChange={(e) => setEditBarcode(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Xarid Tannarxi (so'm)</label>
                <input
                  type="number"
                  value={editCostPrice}
                  onChange={(e) => setEditCostPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Sotuv Narxi (so'm)</label>
                <input
                  type="number"
                  value={editSellingPrice}
                  onChange={(e) => setEditSellingPrice(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Minimal Zaxira</label>
                <input
                  type="number"
                  value={editMinStock}
                  onChange={(e) => setEditMinStock(e.target.value ? Number(e.target.value) : '')}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Kategoriya</label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-full shadow-md">O'zgarishlarni Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="O'chirishni tasdiqlang"
        message={`Rostdan ham '${deleteConfirm.prodName}'ni o'chirmoqchimisiz?`}
        onConfirm={handleConfirmDeleteProduct}
        onCancel={() => setDeleteConfirm({ isOpen: false })}
      />
    </div>
  );
};
