import React, { useState, useEffect } from 'react';
import { History, ShieldCheck, Filter, Monitor, Globe, Store as StoreIcon, User, RefreshCw, AlertCircle } from 'lucide-react';
import { getAuditLogs, getStores } from '../../services/api';
import { AuditLog, Store, User as UserType } from '../../types';

interface AuditLogViewProps {
  currentUser?: UserType | null;
}

export const AuditLogView: React.FC<AuditLogViewProps> = ({ currentUser }) => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedStoreId, setSelectedStoreId] = useState<number | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const isDeveloper = currentUser?.role === 'DEVELOPER';

  useEffect(() => {
    if (isDeveloper) {
      getStores().then(setStores).catch(console.error);
    }
    fetchLogs();
  }, [selectedStoreId]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs(selectedStoreId);
      setLogs(data);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.detail || "Audit loglarni yuklashda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('DEVELOPER')) return 'bg-purple-100 text-purple-800 border-purple-200';
    if (action.includes('ADMIN')) return 'bg-indigo-100 text-indigo-800 border-indigo-200';
    if (action.includes('HR_MANAGER')) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (action.includes('ISHCHI')) return 'bg-emerald-100 text-emerald-800 border-emerald-200';
    if (action.includes('LOGIN')) return 'bg-cyan-100 text-cyan-800 border-cyan-200';
    if (action.includes('LOGOUT')) return 'bg-slate-100 text-slate-700 border-slate-200';
    return 'bg-amber-100 text-amber-800 border-amber-200';
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2 text-indigo-600 text-xs font-black uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4" />
            Audit Trail & Security System
          </div>
          <h1 className="text-2xl font-black text-slate-900">Developer & Store Audit Loglar</h1>
          <p className="text-xs text-slate-500 mt-1">
            Tizimdagi barcha muhim va texnik harakatlarning real-vaqtdagi batafsil auditi
          </p>
        </div>

        {/* Store Selector Filter for DEVELOPER */}
        {isDeveloper && (
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200">
            <Filter className="w-4 h-4 text-slate-500 ml-1" />
            <select
              value={selectedStoreId || ''}
              onChange={(e) => setSelectedStoreId(e.target.value ? Number(e.target.value) : undefined)}
              className="text-xs font-bold text-slate-800 bg-transparent outline-none pr-4"
            >
              <option value="">Barcha Magazinlar Loglari</option>
              {stores.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.code})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-xs font-bold flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Audit Log Table */}
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
                  <th className="px-5 py-4">Vaqt & Sana</th>
                  <th className="px-5 py-4">Foydalanuvchi & Rol (User ID)</th>
                  <th className="px-5 py-4">Magazin (Store)</th>
                  <th className="px-5 py-4">Amal Turi (Action Type)</th>
                  <th className="px-5 py-4">O'zgargan Ma'lumot (Old → New)</th>
                  <th className="px-5 py-4">IP & Qurilma (Device/Browser)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400 font-bold">
                      Hozircha audit loglar mavjud emas
                    </td>
                  </tr>
                ) : (
                  logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      {/* Date & Time */}
                      <td className="px-5 py-4 whitespace-nowrap">
                        <div className="font-mono font-bold text-slate-900">
                          {new Date(log.created_at).toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {new Date(log.created_at).toLocaleDateString('uz-UZ')}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-xs">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{log.user_name}</div>
                            <div className="flex items-center gap-1 text-[11px] text-slate-400">
                              <span className="font-semibold text-indigo-600">{log.user_role || 'USER'}</span>
                              <span>• ID: {log.user_id || 'Sys'}</span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Store */}
                      <td className="px-5 py-4">
                        {log.store_name ? (
                          <div className="flex items-center gap-1.5 text-slate-800 font-bold">
                            <StoreIcon className="w-3.5 h-3.5 text-indigo-500" />
                            <span>{log.store_name}</span>
                          </div>
                        ) : (
                          <span className="text-slate-400 font-semibold italic">Global / Technical</span>
                        )}
                      </td>

                      {/* Action Type Badge */}
                      <td className="px-5 py-4">
                        <span className={`inline-block px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold border ${getActionBadgeColor(log.action_type)}`}>
                          {log.action_type}
                        </span>
                      </td>

                      {/* Changed Data */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="text-slate-800 font-semibold text-xs leading-snug">
                          {log.changed_data || 'Amal bajarildi'}
                        </div>
                        {(log.old_value || log.new_value) && (
                          <div className="mt-1 font-mono text-[10px] space-y-0.5 bg-slate-50 p-1.5 rounded-lg border border-slate-200">
                            {log.old_value && <div className="text-rose-600">Oldingisi: {log.old_value}</div>}
                            {log.new_value && <div className="text-emerald-600">Yangisi: {log.new_value}</div>}
                          </div>
                        )}
                      </td>

                      {/* IP Address & Device Info */}
                      <td className="px-5 py-4 max-w-xs">
                        <div className="flex items-center gap-1.5 text-slate-700 font-mono text-[11px]">
                          <Globe className="w-3.5 h-3.5 text-slate-400" />
                          <span>{log.ip_address || '127.0.0.1'}</span>
                        </div>
                        {log.device_info && (
                          <div className="flex items-center gap-1 text-[10px] text-slate-400 truncate mt-0.5" title={log.device_info}>
                            <Monitor className="w-3 h-3 flex-shrink-0" />
                            <span className="truncate">{log.device_info}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
