import React from 'react';
import { Code, ShieldCheck, Database, Layers, ExternalLink, Lock, Server, Key, Terminal } from 'lucide-react';

export const ApiDocsView: React.FC = () => {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl border border-indigo-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 text-indigo-300 rounded-full text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-500/30">
            <Code className="w-3.5 h-3.5" />
            API-FIRST MULTI-TENANT ARCHITECTURE
          </div>
          <h1 className="text-2xl sm:text-3xl font-black">API Hujjatlari & Arxitektura</h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            Supermarket CRM tizimining barcha funksiyalari to'liq REST API arxitekturasida ishlab chiqilgan bo'lib, mobil ilovalar va boshqa magazinlar oson ulanishi uchun tayyorlangan.
          </p>
        </div>

        <a
          href="/docs"
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-2xl shadow-lg transition flex items-center gap-2 flex-shrink-0"
        >
          <ExternalLink className="w-4 h-4" />
          Interactive Swagger UI (/docs)
        </a>
      </div>

      {/* Security & Multi-Tenant Isolation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4" />
            Server-Side Authorization
          </div>
          <h3 className="text-sm font-bold text-slate-900">Store Isolation Protection</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Har bir so'rovda foydalanuvchining <span className="font-mono text-indigo-600 font-bold">Role</span>, <span className="font-mono text-indigo-600 font-bold">User ID</span> va <span className="font-mono text-indigo-600 font-bold">Store ID</span> si tekshiriladi. Token o'zgartirilsa ham server boshqa magazinga kirishni taqiqlaydi.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-purple-600 text-xs font-black uppercase tracking-wider">
            <Lock className="w-4 h-4" />
            JWT Bearer Authentication
          </div>
          <h3 className="text-sm font-bold text-slate-900">Protected API Endpoints</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Barcha so'rovlar <span className="font-mono text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">Authorization: Bearer &lt;Token&gt;</span> kaliti orqali autentifikatsiya qilinadi.
          </p>
        </div>

        <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="flex items-center gap-2 text-emerald-600 text-xs font-black uppercase tracking-wider">
            <Database className="w-4 h-4" />
            Tenant Data Segregation
          </div>
          <h3 className="text-sm font-bold text-slate-900">Database Multi-Tenancy</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Barcha jadvallar (<span className="font-mono text-emerald-700">users, workers, tasks, attendance, expenses, credits</span>) <span className="font-mono text-emerald-700 font-bold">store_id</span> bo'yicha ajratilgan.
          </p>
        </div>
      </div>

      {/* Role Hierarchy Table */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Layers className="w-5 h-5 text-indigo-600" />
          Rollar Ierarxiyasi & Huquqlar (Role Hierarchy)
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-purple-600 text-white rounded-lg text-[10px] font-black uppercase">DEVELOPER</span>
              <span className="text-[10px] font-bold text-purple-700">Daraja 1</span>
            </div>
            <h4 className="text-xs font-bold text-purple-950">Texnik Administrator</h4>
            <p className="text-[11px] text-purple-800 leading-relaxed">
              Barcha magazinlar, audit loglar, store yaratish, admin biriktirish va global texnik sozlamalar.
            </p>
          </div>

          <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-indigo-600 text-white rounded-lg text-[10px] font-black uppercase">ADMIN</span>
              <span className="text-[10px] font-bold text-indigo-700">Daraja 2</span>
            </div>
            <h4 className="text-xs font-bold text-indigo-950">Store Administrator</h4>
            <p className="text-[11px] text-indigo-800 leading-relaxed">
              Faqat o'z magazinidagi savdo, ombor, xarajat, ishchilar, vazifalar va magazin loglarini boshqaradi.
            </p>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-[10px] font-black uppercase">HR MANAGER</span>
              <span className="text-[10px] font-bold text-blue-700">Daraja 3</span>
            </div>
            <h4 className="text-xs font-bold text-blue-950">HR Boshqaruvchi</h4>
            <p className="text-[11px] text-blue-800 leading-relaxed">
              Faqat o'z magazinidagi ishchilarni boshqaradi, davomat va vazifalarni tekshiradi. Loglarni ko'ra olmaydi.
            </p>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-[10px] font-black uppercase">ISHCHI</span>
              <span className="text-[10px] font-bold text-emerald-700">Daraja 4</span>
            </div>
            <h4 className="text-xs font-bold text-emerald-950">Sotuvchi / Xodim</h4>
            <p className="text-[11px] text-emerald-800 leading-relaxed">
              Faqat o'ziga tegishli vazifalar, rasm yuklash (before/after), yordamchi chaqirish va davomat.
            </p>
          </div>
        </div>
      </div>

      {/* Main Endpoints Section */}
      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
          <Terminal className="w-5 h-5 text-indigo-600" />
          Asosiy API Endpointlar Ro'yxati
        </h3>

        <div className="space-y-3 font-mono text-xs">
          {/* Auth */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">POST</span>
              <span className="font-bold text-slate-900">/api/v1/auth/login</span>
            </div>
            <span className="text-slate-500 font-sans text-[11px]">Tizimga kirish (DEVELOPER, ADMIN, HR, ISHCHI)</span>
          </div>

          {/* Developer Profile */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold">GET</span>
              <span className="font-bold text-slate-900">/api/v1/developer/profile</span>
            </div>
            <span className="text-slate-500 font-sans text-[11px]">Developer profilini olish (DEVELOPER ONLY)</span>
          </div>

          {/* Stores */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">POST</span>
              <span className="font-bold text-slate-900">/api/v1/stores</span>
            </div>
            <span className="text-slate-500 font-sans text-[11px]">Yangi magazin va birinchi ADMIN yaratish (DEVELOPER ONLY)</span>
          </div>

          {/* Audit Logs */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-blue-600 text-white rounded font-bold">GET</span>
              <span className="font-bold text-slate-900">/api/v1/audit</span>
            </div>
            <span className="text-slate-500 font-sans text-[11px]">Audit loglarni olish (Role & Store Filter bilan)</span>
          </div>

          {/* Tasks */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">POST</span>
              <span className="font-bold text-slate-900">/api/v1/tasks/&#123;id&#125;/start</span>
            </div>
            <span className="text-slate-500 font-sans text-[11px]">Vazifa boshlash & BEFORE rasm yuklash</span>
          </div>

          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 bg-emerald-600 text-white rounded font-bold">POST</span>
              <span className="font-bold text-slate-900">/api/v1/tasks/&#123;id&#125;/helper</span>
            </div>
            <span className="text-slate-500 font-sans text-[11px]">Yordamchi ishchini vazifaga chaqirish</span>
          </div>
        </div>
      </div>
    </div>
  );
};
