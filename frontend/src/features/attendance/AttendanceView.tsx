import React, { useState, useEffect } from 'react';
import { Camera, CheckCircle2, AlertTriangle, ShieldCheck, Clock, FileSpreadsheet, RefreshCw, Calendar } from 'lucide-react';
import { getTodayAttendance, getAttendanceList, checkInAttendance, checkOutAttendance } from '../../services/api';
import { AttendanceItem, User } from '../../types';
import { AlertModal } from '../../components/common/AlertModal';

interface AttendanceViewProps {
  currentUser?: User | null;
}

// Fixed GPS location for Turkuaz building
const TURKUAZ_LAT = 41.311081;
const TURKUAZ_LNG = 69.240562;

// Utility function: Compresses raw Base64 images to 500px max width & 60% JPEG quality (30KB size instead of 3MB!)
const compressImage = (base64Str: string, maxWidth = 500, quality = 0.6): Promise<string> => {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = base64Str;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let width = img.width;
      let height = img.height;

      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width);
        width = maxWidth;
      }

      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx?.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => resolve(base64Str);
  });
};

export const AttendanceView: React.FC<AttendanceViewProps> = ({ currentUser }) => {
  const [todayAttendance, setTodayAttendance] = useState<AttendanceItem | null>(null);
  const [attendanceList, setAttendanceList] = useState<AttendanceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submittingAttendance, setSubmittingAttendance] = useState(false);

  // Selected Day Filter (0 = Bugun, 1 = Kecha, 2..6 = 2..6 kun oldin)
  const [selectedDayOffset, setSelectedDayOffset] = useState<number>(0);

  // Photo & Inline Messaging
  const [selfiePhoto, setSelfiePhoto] = useState<string | null>(null);
  const [inlineMessage, setInlineMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  const isAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'DEVELOPER' || currentUser?.role === 'SUPER_ADMIN';

  useEffect(() => {
    fetchAttendanceData();
    // Smart lightweight polling every 8 seconds (only when tab is visible)
    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchAttendanceData();
      }
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  const fetchAttendanceData = async () => {
    try {
      if (isAdmin) {
        const [today, list] = await Promise.all([
          getTodayAttendance(),
          getAttendanceList(undefined, 7)
        ]);
        setTodayAttendance(today);
        setAttendanceList(list);
      } else {
        const today = await getTodayAttendance();
        setTodayAttendance(today);
      }
    } catch (err) {
      console.error("Attendance fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const rawBase64 = reader.result as string;
        const compressed = await compressImage(rawBase64, 500, 0.6);
        setSelfiePhoto(compressed);
        setInlineMessage({ type: 'success', text: "📸 Selfie rasmga tushildi! Endi 'Rasmni Tasdiqlash va Ishni Boshlash' tugmasini bosing." });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCheckInSubmit = async () => {
    if (!selfiePhoto) {
      setInlineMessage({ type: 'error', text: "📸 Iltimos, avval rasmga tushing!" });
      return;
    }
    if (submittingAttendance) return;

    const photoBackup = selfiePhoto;
    setSubmittingAttendance(true);
    setInlineMessage({ type: 'info', text: "⚡️ Rasm va kelishingiz adminga yuborilmoqda..." });

    // INSTANT OPTIMISTIC UI LOCK: Instantly hide camera form so user cannot double click!
    const nowIso = new Date().toISOString();
    const optimisticItem: any = {
      id: Date.now(),
      check_in_time: nowIso,
      photo_url: photoBackup,
      status: 'PRESENT',
      user_id: currentUser?.id,
      full_name: currentUser?.full_name || 'Siz',
      late_minutes: 0
    };
    setTodayAttendance(optimisticItem);
    setSelfiePhoto(null);

    try {
      await checkInAttendance(TURKUAZ_LAT, TURKUAZ_LNG, photoBackup);
      setInlineMessage({ type: 'success', text: "🎉 Rasm va kelishingiz tasdiqlandi. Ishingiz muvaffaqiyatli boshlandi!" });
      await fetchAttendanceData();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Ishga kelishni tasdiqlashda xatolik yuz berdi";
      setInlineMessage({ type: 'error', text: errMsg });
      // Revert if error occurs
      setSelfiePhoto(photoBackup);
      setTodayAttendance(null);
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const handleCheckOutSubmit = async () => {
    if (submittingAttendance) return;
    setSubmittingAttendance(true);
    setInlineMessage({ type: 'info', text: "👋 Ish kuni yakunlanmoqda..." });

    // INSTANT OPTIMISTIC UI LOCK: Instantly set status to COMPLETED so button changes in 0ms!
    const nowIso = new Date().toISOString();
    setTodayAttendance(prev => prev ? {
      ...prev,
      status: 'COMPLETED',
      check_out_time: nowIso
    } : null);

    try {
      await checkOutAttendance(TURKUAZ_LAT, TURKUAZ_LNG, selfiePhoto || undefined);
      setInlineMessage({ type: 'success', text: "🎉 Ish kuni muvaffaqiyatli yakunlandi! Rahmat!" });
      setSelfiePhoto(null);
      await fetchAttendanceData();
    } catch (err: any) {
      const errMsg = err.response?.data?.detail || "Ketishni saqlashda xatolik";
      setInlineMessage({ type: 'error', text: errMsg });
      await fetchAttendanceData();
    } finally {
      setSubmittingAttendance(false);
    }
  };

  const [alertMessage, setAlertMessage] = useState<string | null>(null);

  // Export Attendance & Worked Hours Report to Excel (.csv with UTF-8 BOM)
  const exportToExcel = () => {
    if (attendanceList.length === 0) {
      setAlertMessage("Yuklab olish uchun ma'lumotlar mavjud emas!");
      return;
    }

    const headers = ["F.I.SH (Ishchi)", "Sana", "Kelgan Vaqti", "Ketgan Vaqti", "Ishlagan Vaqti", "Kechikish (Daqiqa)", "Holati"];
    const rows = attendanceList.map(item => {
      const name = item.full_name || item.employee?.full_name || `Ishchi #${item.employee_id}`;
      const dateStr = new Date(item.check_in_time).toLocaleDateString('uz-UZ');
      const inTime = new Date(item.check_in_time).toLocaleTimeString('uz-UZ');
      const outTime = item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString('uz-UZ') : 'Ketmagan';
      const workedStr = item.worked_time_str || (item.worked_hours ? `${item.worked_hours} soat` : '0 soat');
      const lateMins = item.late_minutes || 0;
      const statusText = item.status === 'COMPLETED' ? 'Yakunlangan' : item.status === 'PRESENT' ? 'Ishda' : 'Kech qolgan';

      return [
        `"${name}"`,
        `"${dateStr}"`,
        `"${inTime}"`,
        `"${outTime}"`,
        `"${workedStr}"`,
        `"${lateMins} min"`,
        `"${statusText}"`
      ].join(",");
    });

    const csvContent = "\uFEFF" + [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    const fileName = `Ishchilar_Ish_Soatlari_Hisoboti_${new Date().toISOString().slice(0, 10)}.csv`;
    link.setAttribute("download", fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to generate 7 days array
  const last7Days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - i);
    return {
      offset: i,
      label: i === 0 ? "Bugun" : i === 1 ? "Kecha" : `${d.getDate()}-${d.toLocaleString('uz-UZ', { month: 'short' })}`,
      fullDateStr: d.toISOString().slice(0, 10)
    };
  });

  // Filter list by selected day
  const filteredListByDay = attendanceList.filter(item => {
    const itemDateStr = new Date(item.check_in_time).toISOString().slice(0, 10);
    const targetDateStr = last7Days[selectedDayOffset].fullDateStr;
    return itemDateStr === targetDateStr;
  });

  const renderLateBadge = (item: AttendanceItem) => {
    const checkInDate = new Date(item.check_in_time);
    const checkInMins = checkInDate.getHours() * 60 + checkInDate.getMinutes();
    const shiftMins = 9 * 60; // 09:00 AM
    const lateMins = item.late_minutes !== undefined && item.late_minutes > 0 
      ? item.late_minutes 
      : Math.max(0, checkInMins - shiftMins);

    if (lateMins <= 0) {
      return (
        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
          🟢 Vaqtida Keldi (09:00)
        </span>
      );
    } else if (lateMins <= 10) {
      return (
        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-emerald-500 text-white border border-emerald-600 animate-pulse">
          🟢 {lateMins} daqiqa kech qoldi
        </span>
      );
    } else {
      return (
        <span className="text-[11px] font-black px-3 py-1 rounded-full bg-rose-600 text-white border border-rose-700 animate-pulse shadow-md">
          🔴 {lateMins} daqiqa kech qoldi!
        </span>
      );
    }
  };

  const totalPresentCount = attendanceList.filter(a => a.status !== 'ABSENT').length;

  return (
    <div className="p-4 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Top Banner */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 rounded-3xl shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-500/20 border border-indigo-400/30 rounded-full text-indigo-300 text-xs font-bold">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Shift 09:00 AM — Keldi-Ketdi & Ish Soati Nazorati</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            {isAdmin ? "📋 Ishchilar Kelish va Ish Soatlari Nazorati" : "📸 Ishga Kelishni Tasdiqlash"}
          </h2>
          <p className="text-xs text-slate-300 max-w-xl font-medium leading-relaxed">
            Ishchilar kelganda va ketganda vaqtini tasdiqlaydi. Barcha ish soatlari avtomatik hisoblab boriladi.
          </p>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          {isAdmin && (
            <button
              onClick={exportToExcel}
              className="px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-2xl shadow-lg shadow-emerald-600/30 transition flex items-center gap-2 cursor-pointer active:scale-95 border border-emerald-400/40"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>📊 Excel Hisobotini Yuklash (.xlsx)</span>
            </button>
          )}

          {isAdmin && (
            <div className="bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/10 text-right">
              <span className="text-[10px] text-indigo-200 uppercase font-black tracking-wider block">Jami Kelganlar</span>
              <span className="text-2xl font-black text-emerald-400 font-mono">{totalPresentCount} ta</span>
            </div>
          )}
        </div>
      </div>

      {/* WORKER SECTION: Rendered for Non-Admin workers */}
      {!isAdmin && (
        <div className="space-y-6">
          {/* Inline Notification Banner */}
          {inlineMessage && (
            <div className={`p-4 rounded-2xl text-xs font-bold border flex items-center gap-2 transition ${
              inlineMessage.type === 'success'
                ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
                : inlineMessage.type === 'error'
                ? 'bg-rose-50 text-rose-900 border-rose-200'
                : 'bg-blue-50 text-blue-900 border-blue-200'
            }`}>
              {inlineMessage.type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />}
              {inlineMessage.type === 'error' && <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />}
              {inlineMessage.type === 'info' && <RefreshCw className="w-5 h-5 text-blue-600 animate-spin shrink-0" />}
              <span>{inlineMessage.text}</span>
            </div>
          )}

          {/* IF WORKER HAS ALREADY CHECKED IN TODAY -> SHOW CONFIRMED CARD */}
          {todayAttendance && todayAttendance.check_in_time ? (
            <div className="bg-emerald-50/90 border-2 border-emerald-300 p-6 sm:p-8 rounded-3xl text-center space-y-5 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md">
                <CheckCircle2 className="w-10 h-10 text-emerald-600" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-black text-emerald-950">🎉 Bugungi Ishga Kelish Muvaffaqiyatli Tasdiqlangan!</h3>
                <div className="mt-2">{renderLateBadge(todayAttendance)}</div>
                <p className="text-xs text-emerald-800 font-bold mt-2 font-mono">
                  Kelgan vaqtingiz: {new Date(todayAttendance.check_in_time).toLocaleTimeString('uz-UZ')}
                </p>
                {todayAttendance.worked_time_str && (
                  <p className="text-xs text-blue-800 font-black font-mono bg-blue-100/80 px-4 py-1.5 rounded-full inline-block mt-2">
                    ⏱ Ishlagan vaqtingiz: {todayAttendance.worked_time_str}
                  </p>
                )}
              </div>

              {(todayAttendance.photo_url || todayAttendance.check_in_photo_url) && (
                <div className="pt-2">
                  <span className="text-[11px] font-black text-slate-500 block mb-2 uppercase tracking-wider">Yuborilgan Foto-Isbotingiz:</span>
                  <img
                    src={todayAttendance.photo_url || todayAttendance.check_in_photo_url}
                    alt="Submitted Proof"
                    className="w-40 h-40 object-cover rounded-2xl mx-auto border-2 border-emerald-400 shadow-md"
                  />
                </div>
              )}

              {todayAttendance.status !== 'COMPLETED' ? (
                <div className="pt-4 border-t border-emerald-200/60 max-w-sm mx-auto">
                  <button
                    onClick={handleCheckOutSubmit}
                    disabled={submittingAttendance}
                    className="w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs rounded-full shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <Clock className="w-4 h-4" />
                    <span>{submittingAttendance ? "⚡️ Ketish saqlanmoqda..." : "🚪 Ish Kuni Yakunlandi (Ketdim)"}</span>
                  </button>
                </div>
              ) : (
                <div className="pt-4 border-t border-emerald-200/60 font-black text-xs text-blue-900 bg-blue-100/70 p-3.5 rounded-2xl max-w-sm mx-auto shadow-sm">
                  ✅ Bugungi ish kuni yakunlandi {todayAttendance.check_out_time ? `(${new Date(todayAttendance.check_out_time).toLocaleTimeString('uz-UZ')})` : ''}
                </div>
              )}
            </div>
          ) : (
            /* CAMERA CAPTURE SECTION (Only shown BEFORE worker checks in) */
            <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
              <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
                <Camera className="w-5 h-5 text-blue-600" />
                <span>📸 Selfie Rasmga Tushish & Ishni Boshlash</span>
              </h3>

              {selfiePhoto ? (
                <div className="space-y-4 bg-slate-50 p-5 rounded-3xl border border-slate-200 text-center">
                  <span className="text-xs font-black text-slate-700 block uppercase tracking-wider">Olingan Selfie Foto-Isbot:</span>
                  <div className="relative inline-block mx-auto max-w-xs overflow-hidden rounded-2xl border-2 border-emerald-500 shadow-xl">
                    <img src={selfiePhoto} alt="Selfie Proof" className="w-full h-64 object-cover" />
                  </div>
                  <div>
                    <label
                      htmlFor="direct-selfie-camera-input"
                      className="inline-block px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full transition shadow-md cursor-pointer"
                    >
                      🔄 Qayta Rasmga Tushish
                    </label>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <label
                    htmlFor="direct-selfie-camera-input"
                    className="w-full py-10 bg-blue-600 hover:bg-blue-700 text-white rounded-3xl flex flex-col items-center justify-center gap-3 transition cursor-pointer shadow-lg shadow-blue-600/30 active:scale-98 group"
                  >
                    <div className="w-16 h-16 rounded-full bg-white/20 text-white flex items-center justify-center shadow-inner group-hover:scale-110 transition">
                      <Camera className="w-8 h-8" />
                    </div>
                    <div className="text-center px-4">
                      <span className="text-base font-black text-white block">📸 TELEFON KAMERASINI OCHISH VA RASMGA TUSHISH</span>
                      <span className="text-xs text-blue-100 mt-1 block font-medium font-sans">Ushbu tugmani bosing — Telefoningiz kamerasini ochadi!</span>
                    </div>
                  </label>

                  <input
                    id="direct-selfie-camera-input"
                    type="file"
                    accept="image/*"
                    capture="user"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
              )}

              {/* Confirm & Start Shift Button */}
              <div className="pt-2">
                <button
                  onClick={handleCheckInSubmit}
                  disabled={submittingAttendance || !selfiePhoto}
                  className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm rounded-full shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  <span>
                    {submittingAttendance ? "⚡️ Tasdiqlanmoqda..." : "✅ Rasmni Tasdiqlash va Ishni Boshlash"}
                  </span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ADMIN DASHBOARD: Display Worker Check-In Times, Worked Hours & 7-Day Filter (Shown ONLY to Admin/HR/Dev) */}
      {isAdmin && (
        <div className="bg-white border border-slate-100 p-6 sm:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-indigo-600" />
              <span>📋 Ishchilar Kelish va Ish Soatlari (Kunbay)</span>
            </h3>

            {/* 7-DAY SELECTOR TABS */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
              {last7Days.map((day) => (
                <button
                  key={day.offset}
                  onClick={() => setSelectedDayOffset(day.offset)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition cursor-pointer flex items-center gap-1 ${
                    selectedDayOffset === day.offset
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-black'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{day.label}</span>
                </button>
              ))}
            </div>
          </div>

          {filteredListByDay.length === 0 ? (
            <div className="text-center py-12 space-y-2">
              <Clock className="w-12 h-12 text-slate-300 mx-auto" />
              <p className="text-xs text-slate-500 font-bold">Ushbu kunda ({last7Days[selectedDayOffset].label}) hali hech qaysi ishchi kelishni tasdiqlamadi.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {filteredListByDay.map((item) => {
                const photoUrl = item.photo_url || item.check_in_photo_url;
                const displayName = item.full_name || item.employee?.full_name || `Ishchi #${item.user_id || item.employee_id}`;
                const workedStr = item.worked_time_str || (item.worked_hours ? `${item.worked_hours} soat` : '0 soat');

                return (
                  <div key={item.id} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3 flex flex-col justify-between hover:shadow-md transition">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-black text-sm text-slate-900">{displayName}</span>
                        {renderLateBadge(item)}
                      </div>

                      <div className="text-[11px] font-mono text-slate-600 space-y-1 pt-1">
                        <div>Kelgan vaqti: <strong className="text-slate-900 font-bold">{new Date(item.check_in_time).toLocaleTimeString('uz-UZ')}</strong></div>
                        <div>Ketgan vaqti: <strong className="text-slate-900 font-bold">{item.check_out_time ? new Date(item.check_out_time).toLocaleTimeString('uz-UZ') : 'Ishlamoqda'}</strong></div>
                        
                        {/* Worked Hours Calculation Badge */}
                        <div className="pt-1">
                          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-sm ${
                            item.check_out_time
                              ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                              : 'bg-blue-100 text-blue-900 border border-blue-300 animate-pulse'
                          }`}>
                            <Clock className="w-3.5 h-3.5" />
                            <span>Ishlagan vaqti: {workedStr}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {photoUrl ? (
                      <div className="pt-2">
                        <span className="text-[10px] text-slate-400 uppercase font-extrabold block mb-1">Foto-Isbot:</span>
                        <a href={photoUrl} target="_blank" rel="noopener noreferrer" className="block relative group overflow-hidden rounded-xl border border-slate-300">
                          <img src={photoUrl} alt="Worker Proof" className="w-full h-40 object-cover group-hover:scale-105 transition" />
                          <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-xs font-bold">
                            🔍 Kattalashtirish
                          </div>
                        </a>
                      </div>
                    ) : (
                      <div className="bg-slate-200/50 p-4 rounded-xl text-center text-slate-400 text-xs italic">
                        Foto-isbot yo'q
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
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
