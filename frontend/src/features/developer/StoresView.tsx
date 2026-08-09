import React, { useState, useEffect } from 'react';
import { Store, Plus, Search, MapPin, Phone, Mail, Clock, Shield, Users, UserCheck, Power, Edit3, Key, CheckCircle, AlertCircle, RefreshCw, Layers } from 'lucide-react';
import { getStores, createStore, updateStore, createOrUpdateStoreAdmin } from '../../services/api';
import { Store as StoreType } from '../../types';

export const StoresView: React.FC = () => {
  const [stores, setStores] = useState<StoreType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Modal States
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedStore, setSelectedStore] = useState<StoreType | null>(null);

  // New Store Form State
  const [storeName, setStoreName] = useState('');
  const [storeCode, setStoreCode] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [openingTime, setOpeningTime] = useState('08:00');
  const [closingTime, setClosingTime] = useState('23:00');
  const [latitude, setLatitude] = useState(41.2995);
  const [longitude, setLongitude] = useState(69.2401);
  const [attendanceRadius, setAttendanceRadius] = useState(100);
  const [timezone, setTimezone] = useState('Asia/Tashkent');
  const [statusVal, setStatusVal] = useState<'ACTIVE' | 'INACTIVE'>('ACTIVE');

  // Initial Admin Creation
  const [createInitialAdmin, setCreateInitialAdmin] = useState(true);
  const [adminFullName, setAdminFullName] = useState('');
  const [adminUsername, setAdminUsername] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      setLoading(true);
      const data = await getStores();
      setStores(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Magazinlar ro'yxatini yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await createStore({
        name: storeName,
        code: storeCode,
        address,
        phone,
        email,
        opening_time: openingTime,
        closing_time: closingTime,
        latitude,
        longitude,
        attendance_radius: attendanceRadius,
        timezone,
        status: statusVal,
        create_initial_admin: createInitialAdmin,
        admin_full_name: adminFullName,
        admin_username: adminUsername,
        admin_email: adminEmail,
        admin_phone: adminPhone,
        admin_password: adminPassword
      });

      setShowCreateModal(false);
      resetCreateForm();
      setSuccessMsg(`Yangi magazin '${storeName}' muvaffaqiyatli yaratildi!`);
      fetchStores();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Magazin yaratishda xatolik yuz berdi");
    }
  };

  const handleToggleStoreStatus = async (store: StoreType) => {
    const newStatus = store.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateStore(store.id, { status: newStatus });
      setSuccessMsg(`Magazin statusi '${newStatus}' ga o'zgartirildi`);
      fetchStores();
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      setError("Statusni o'zgartirishda xatolik");
    }
  };

  const handleEditStoreSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    try {
      await updateStore(selectedStore.id, {
        name: storeName,
        code: storeCode,
        address,
        phone,
        email,
        opening_time: openingTime,
        closing_time: closingTime,
        latitude,
        longitude,
        attendance_radius: attendanceRadius,
        timezone,
        status: statusVal
      });
      setShowEditModal(false);
      setSuccessMsg("Magazin ma'lumotlari yangilandi!");
      fetchStores();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Tahrirlashda xatolik");
    }
  };

  const handleManageAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStore) return;
    try {
      await createOrUpdateStoreAdmin(selectedStore.id, {
        full_name: adminFullName,
        username: adminUsername,
        email: adminEmail,
        phone: adminPhone,
        password: adminPassword
      });
      setShowAdminModal(false);
      setSuccessMsg(`Magazin ADMIN hisobi muvaffaqiyatli saqlandi!`);
      fetchStores();
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Admin boshqarishda xatolik");
    }
  };

  const openEditModal = (s: StoreType) => {
    setSelectedStore(s);
    setStoreName(s.name);
    setStoreCode(s.code);
    setAddress(s.address || '');
    setPhone(s.phone || '');
    setEmail(s.email || '');
    setOpeningTime(s.opening_time);
    setClosingTime(s.closing_time);
    setLatitude(s.latitude);
    setLongitude(s.longitude);
    setAttendanceRadius(s.attendance_radius);
    setTimezone(s.timezone);
    setStatusVal(s.status);
    setShowEditModal(true);
  };

  const openAdminModal = (s: StoreType) => {
    setSelectedStore(s);
    setAdminFullName(s.admin_full_name || `${s.name} Admini`);
    setAdminUsername(s.admin_username || `admin_${s.code.toLowerCase().replace('-', '_')}`);
    setAdminEmail(s.email || '');
    setAdminPhone(s.phone || '');
    setAdminPassword('');
    setShowAdminModal(true);
  };

  const resetCreateForm = () => {
    setStoreName('');
    setStoreCode(`STORE-00${stores.length + 1}`);
    setAddress('');
    setPhone('');
    setEmail('');
    setOpeningTime('08:00');
    setClosingTime('23:00');
    setLatitude(41.2995);
    setLongitude(69.2401);
    setAttendanceRadius(100);
    setTimezone('Asia/Tashkent');
    setStatusVal('ACTIVE');
    setCreateInitialAdmin(true);
    setAdminFullName('');
    setAdminUsername('');
    setAdminEmail('');
    setAdminPhone('');
    setAdminPassword('');
  };

  const filteredStores = stores.filter(s =>
    s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.admin_full_name && s.admin_full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4" />
            Multi-Tenant Architecture
          </div>
          <h1 className="text-2xl font-black text-slate-900">Magazinlar Tizimi (Stores)</h1>
          <p className="text-xs text-slate-500 mt-1">Barcha magazinlar tenantlari va ularning administratorlarini boshqarish</p>
        </div>

        <button
          onClick={() => {
            resetCreateForm();
            setShowCreateModal(true);
          }}
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-2xl shadow-lg shadow-indigo-600/30 transition flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Yangi Magazin Yaratish (Create Store)
        </button>
      </div>

      {/* Alert Messages */}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
          {successMsg}
        </div>
      )}

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
        <Search className="w-5 h-5 text-slate-400 ml-2" />
        <input
          type="text"
          placeholder="Magazin nomi, kodi yoki admin bo'yicha qidiruv..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs font-medium text-slate-800 outline-none bg-transparent"
        />
      </div>

      {/* Stores Grid Table */}
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="w-8 h-8 animate-spin text-indigo-600" />
        </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-medium text-slate-700">
              <thead className="bg-slate-50 text-slate-400 font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Magazin Nomi & Kodi</th>
                  <th className="px-6 py-4">Birinchi ADMIN</th>
                  <th className="px-6 py-4 text-center">Ishchilar Soni</th>
                  <th className="px-6 py-4 text-center">Aktiv Userlar</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Oxirgi Aktivlik</th>
                  <th className="px-6 py-4 text-right">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStores.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400 font-bold">
                      Magazinlar topilmadi
                    </td>
                  </tr>
                ) : (
                  filteredStores.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-black text-sm">
                            {s.code.slice(-3)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm">{s.name}</h4>
                            <div className="flex items-center gap-2 text-slate-400 mt-0.5">
                              <span className="font-mono text-[11px] bg-slate-100 px-2 py-0.5 rounded-md font-semibold text-slate-600">{s.code}</span>
                              <span>• {s.address || 'Manzil kiritilmagan'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        {s.admin_full_name ? (
                          <div>
                            <div className="font-bold text-slate-800">{s.admin_full_name}</div>
                            <div className="text-indigo-600 font-mono text-[11px]">@{s.admin_username}</div>
                          </div>
                        ) : (
                          <span className="text-rose-500 font-bold italic">Admin biriktirilmagan</span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-100 text-slate-800 rounded-full font-bold">
                          <Users className="w-3.5 h-3.5 text-slate-500" />
                          {s.worker_count} ta
                        </span>
                      </td>

                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold">
                          <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {s.active_users_count} ta
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className={`px-3 py-1 rounded-full text-[11px] font-black tracking-wide uppercase ${s.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                          {s.status === 'ACTIVE' ? 'AKTIV' : 'DEAKTIV'}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-slate-500">
                        {s.last_activity ? new Date(s.last_activity).toLocaleString('uz-UZ') : '—'}
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => openAdminModal(s)}
                            className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                            title="ADMINni Boshqarish"
                          >
                            <Shield className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(s)}
                            className="p-2 text-slate-600 hover:bg-slate-100 rounded-xl transition"
                            title="Tahrirlash"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleToggleStoreStatus(s)}
                            className={`p-2 rounded-xl transition ${s.status === 'ACTIVE' ? 'text-rose-600 hover:bg-rose-50' : 'text-emerald-600 hover:bg-emerald-50'}`}
                            title={s.status === 'ACTIVE' ? 'Deaktivlashtirish' : 'Aktivlashtirish'}
                          >
                            <Power className="w-4 h-4" />
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
      )}

      {/* CREATE STORE MODAL (DEVELOPER ONLY) */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto my-8 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-xl font-black text-slate-900">Yangi Magazin Yaratish (Tenant)</h3>
                <p className="text-xs text-slate-500">Ushbu amal FAQAT DEVELOPER huquqiga ega</p>
              </div>
              <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full font-bold text-xs">DEVELOPER ONLY</span>
            </div>

            <form onSubmit={handleCreateStoreSubmit} className="space-y-6 text-xs font-bold text-slate-700">
              {/* Store General Details */}
              <div className="space-y-4">
                <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">1. Magazin Ma'lumotlari</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1">Magazin Nomi *</label>
                    <input
                      type="text"
                      placeholder="Masalan: Toshkent Supermarket #1"
                      value={storeName}
                      onChange={(e) => setStoreName(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Magazin Kodi (Unique) *</label>
                    <input
                      type="text"
                      placeholder="STORE-003"
                      value={storeCode}
                      onChange={(e) => setStoreCode(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                      required
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block mb-1">Manzil</label>
                    <input
                      type="text"
                      placeholder="Toshkent shahri, Yunusobod 4-mavze"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Telefon</label>
                    <input
                      type="text"
                      placeholder="+998712001122"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Email</label>
                    <input
                      type="email"
                      placeholder="store@supermarket.uz"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Ish Boshlanish Vaqti</label>
                    <input
                      type="text"
                      placeholder="08:00"
                      value={openingTime}
                      onChange={(e) => setOpeningTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Ish Tugash Vaqti</label>
                    <input
                      type="text"
                      placeholder="23:00"
                      value={closingTime}
                      onChange={(e) => setClosingTime(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">GPS Latitude</label>
                    <input
                      type="number"
                      step="any"
                      value={latitude}
                      onChange={(e) => setLatitude(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">GPS Longitude</label>
                    <input
                      type="number"
                      step="any"
                      value={longitude}
                      onChange={(e) => setLongitude(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Attendance Radius (metr)</label>
                    <input
                      type="number"
                      value={attendanceRadius}
                      onChange={(e) => setAttendanceRadius(parseFloat(e.target.value))}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                    />
                  </div>

                  <div>
                    <label className="block mb-1">Status</label>
                    <select
                      value={statusVal}
                      onChange={(e: any) => setStatusVal(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                    >
                      <option value="ACTIVE">AKTIV</option>
                      <option value="INACTIVE">DEAKTIV</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Initial Admin Creation Section */}
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-indigo-600 uppercase tracking-wider">2. Birinchi Store ADMIN Yaratish</h4>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createInitialAdmin}
                      onChange={(e) => setCreateInitialAdmin(e.target.checked)}
                      className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                    />
                    <span>ADMIN Hisobini Hozir Yaratish</span>
                  </label>
                </div>

                {createInitialAdmin && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                    <div>
                      <label className="block mb-1">Admin Ismi Familiyasi *</label>
                      <input
                        type="text"
                        placeholder="Dilshod Karimov"
                        value={adminFullName}
                        onChange={(e) => setAdminFullName(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        required={createInitialAdmin}
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Admin Login (Username) *</label>
                      <input
                        type="text"
                        placeholder="admin_store1"
                        value={adminUsername}
                        onChange={(e) => setAdminUsername(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none font-mono"
                        required={createInitialAdmin}
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Admin Paroli *</label>
                      <input
                        type="password"
                        placeholder="Admin1234@"
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                        required={createInitialAdmin}
                      />
                    </div>

                    <div>
                      <label className="block mb-1">Admin Telefon</label>
                      <input
                        type="text"
                        placeholder="+998901234567"
                        value={adminPhone}
                        onChange={(e) => setAdminPhone(e.target.value)}
                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold shadow-lg shadow-indigo-600/30"
                >
                  Yangi Magazin Yaratish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT STORE MODAL */}
      {showEditModal && selectedStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900">Magazinni Tahrirlash</h3>
            <form onSubmit={handleEditStoreSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Magazin Nomi</label>
                <input
                  type="text"
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Magazin Kodi</label>
                <input
                  type="text"
                  value={storeCode}
                  onChange={(e) => setStoreCode(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Manzil</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Status</label>
                <select
                  value={statusVal}
                  onChange={(e: any) => setStatusVal(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                >
                  <option value="ACTIVE">AKTIV</option>
                  <option value="INACTIVE">DEAKTIV</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANAGE ADMIN MODAL */}
      {showAdminModal && selectedStore && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <div>
              <h3 className="text-xl font-black text-slate-900">Magazin ADMINini Boshqarish</h3>
              <p className="text-xs text-slate-500 mt-0.5">{selectedStore.name} ({selectedStore.code})</p>
            </div>

            <form onSubmit={handleManageAdminSubmit} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Admin To'liq Ismi *</label>
                <input
                  type="text"
                  value={adminFullName}
                  onChange={(e) => setAdminFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Admin Login (Username) *</label>
                <input
                  type="text"
                  value={adminUsername}
                  onChange={(e) => setAdminUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none font-mono"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Yangi Parol *</label>
                <input
                  type="password"
                  placeholder="Yangi parol kiriting"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAdminModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl font-bold"
                >
                  Admin Hisobini Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
