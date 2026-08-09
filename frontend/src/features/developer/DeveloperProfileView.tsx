import React, { useState, useEffect } from 'react';
import { User, Shield, Phone, Mail, Clock, Calendar, CheckCircle, AlertCircle, Edit3, Key, RefreshCw, UserCheck } from 'lucide-react';
import { getDeveloperProfile, updateDeveloperProfile, changeDeveloperPassword } from '../../services/api';
import { DeveloperProfile } from '../../types';

export const DeveloperProfileView: React.FC = () => {
  const [profile, setProfile] = useState<DeveloperProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Edit Profile Modal State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editUsername, setEditUsername] = useState('');

  // Change Password Modal State
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getDeveloperProfile();
      setProfile(data);
      setEditFullName(data.full_name || '');
      setEditEmail(data.email || '');
      setEditPhone(data.phone || '');
      setEditAvatarUrl(data.avatar_url || '');
      setEditUsername(data.username || '');
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Profil ma'lumotlarini yuklashda xatolik yuz berdi");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      const updated = await updateDeveloperProfile({
        full_name: editFullName,
        email: editEmail,
        phone: editPhone,
        avatar_url: editAvatarUrl,
        username: editUsername
      });
      setProfile(updated);
      setShowEditModal(false);
      setSuccessMsg("Profil ma'lumotlari muvaffaqiyatli yangilandi!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Yangilashda xatolik");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPasswordError("Yangi parollar mos kelmadi!");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Yangi parol kamida 6 belgidan iborat bo'lishi kerak!");
      return;
    }

    try {
      setPasswordError(null);
      await changeDeveloperPassword(oldPassword, newPassword);
      setShowPasswordModal(false);
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setSuccessMsg("Parolingiz muvaffaqiyatli o'zgartirildi!");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      setPasswordError(err.response?.data?.detail || "Parolni o'zgartirishda xatolik");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
      </div>
    );
  }

  // Split name for First & Last Name display
  const nameParts = profile?.full_name?.split(' ') || ['Developer'];
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Banner & Header */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl border border-indigo-900/50">
        <div className="absolute top-0 right-0 -mt-12 -mr-12 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="relative group">
              <img
                src={profile?.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80"}
                alt="Developer Avatar"
                className="w-28 h-28 rounded-2xl object-cover border-4 border-indigo-500/30 shadow-xl"
              />
              <div className="absolute -bottom-2 -right-2 bg-emerald-500 text-white p-1.5 rounded-xl shadow-lg" title="Account Status: Active">
                <UserCheck className="w-4 h-4" />
              </div>
            </div>

            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-purple-500/20 text-purple-300 rounded-full text-xs font-bold tracking-wide uppercase mb-2 border border-purple-500/30">
                <Shield className="w-3.5 h-3.5" />
                SYSTEM DEVELOPER & CHIEF ARCHITECT
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white">{profile?.full_name}</h1>
              <p className="text-sm text-slate-300 mt-1 font-mono">@{profile?.username} • System Technical Administrator</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowEditModal(true)}
              className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-2"
            >
              <Edit3 className="w-4 h-4" />
              Profilni Tahrirlash
            </button>
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl border border-slate-700 transition flex items-center gap-2"
            >
              <Key className="w-4 h-4" />
              Parolni O'zgartirish
            </button>
          </div>
        </div>
      </div>

      {/* Notifications */}
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

      {/* Developer Profile Information Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Ism & Familiya */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <User className="w-4 h-4 text-indigo-500" />
            Foydalanuvchi Ismi & Familiyasi
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-sm text-slate-500">Ism: <span className="font-bold text-slate-900">{firstName}</span></p>
            <p className="text-sm text-slate-500">Familiya: <span className="font-bold text-slate-900">{lastName || '—'}</span></p>
          </div>
        </div>

        {/* Login & Email */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Mail className="w-4 h-4 text-indigo-500" />
            Login & Email
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-sm text-slate-500">Login: <span className="font-mono font-bold text-indigo-600">{profile?.username}</span></p>
            <p className="text-sm text-slate-500">Email: <span className="font-bold text-slate-900">{profile?.email || '—'}</span></p>
          </div>
        </div>

        {/* Telefon & Status */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Phone className="w-4 h-4 text-indigo-500" />
            Aloqa & Account Status
          </div>
          <div className="space-y-1 pt-1">
            <p className="text-sm text-slate-500">Telefon: <span className="font-bold text-slate-900">{profile?.phone || '—'}</span></p>
            <p className="text-sm text-slate-500">Status: 
              <span className={`ml-2 px-2.5 py-0.5 rounded-full text-xs font-black ${profile?.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                {profile?.is_active ? 'AKTIV' : 'DEAKTIV'}
              </span>
            </p>
          </div>
        </div>

        {/* Yaratilgan sana */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Calendar className="w-4 h-4 text-indigo-500" />
            Yaratilgan Sana
          </div>
          <p className="text-base font-bold text-slate-800 pt-1">
            {profile?.created_at ? new Date(profile.created_at).toLocaleString('uz-UZ') : '—'}
          </p>
        </div>

        {/* Oxirgi kirish vaqti */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-3 text-slate-400 text-xs font-bold uppercase tracking-wider">
            <Clock className="w-4 h-4 text-indigo-500" />
            Oxirgi Kirish Vaqti
          </div>
          <p className="text-base font-bold text-indigo-600 pt-1">
            {profile?.last_login_at ? new Date(profile.last_login_at).toLocaleString('uz-UZ') : 'Hozir'}
          </p>
        </div>

        {/* Technical Role Privilege */}
        <div className="p-5 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 shadow-sm space-y-2">
          <div className="flex items-center gap-3 text-indigo-800 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-4 h-4 text-indigo-600" />
            Texnik Huquqlar
          </div>
          <p className="text-xs text-indigo-900 font-medium leading-relaxed pt-1">
            DEVELOPER roli tizimning to'liq texnik administratsiyasini va barcha magazinlar (multi-tenant stores) ustidan global nazoratni ta'minlaydi.
          </p>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {showEditModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900">Developer Profilini Tahrirlash</h3>
            
            <form onSubmit={handleUpdateProfile} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">To'liq Ism va Familiya</label>
                <input
                  type="text"
                  value={editFullName}
                  onChange={(e) => setEditFullName(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Login (Username)</label>
                <input
                  type="text"
                  value={editUsername}
                  onChange={(e) => setEditUsername(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Email Manzil</label>
                <input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Telefon Raqam</label>
                <input
                  type="text"
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                />
              </div>

              <div>
                <label className="block mb-1">Profil Rasmi URL (Avatar)</label>
                <input
                  type="url"
                  value={editAvatarUrl}
                  onChange={(e) => setEditAvatarUrl(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  placeholder="https://..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-bold"
                >
                  Saqlash
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CHANGE PASSWORD MODAL */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl space-y-5 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-black text-slate-900">Developer Parolini O'zgartirish</h3>

            {passwordError && (
              <div className="p-3 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl">
                {passwordError}
              </div>
            )}

            <form onSubmit={handleChangePassword} className="space-y-4 text-xs font-bold text-slate-700">
              <div>
                <label className="block mb-1">Eski Parol</label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Yangi Parol</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div>
                <label className="block mb-1">Yangi Parolni Tasdiqlang</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-5 py-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-slate-200"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-purple-600 text-white rounded-xl hover:bg-purple-700 font-bold"
                >
                  Parolni O'zgartirish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
