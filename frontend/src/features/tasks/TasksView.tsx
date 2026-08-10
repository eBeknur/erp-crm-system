import React, { useState, useEffect } from 'react';
import { CheckSquare, Plus, Clock, CheckCircle2, Camera, AlertCircle, Trash2, ShieldCheck, X, ZoomIn } from 'lucide-react';
import { getTasks, createTask, claimTask, completeTask, approveTask, deleteTask } from '../../services/api';
import { TaskItem, User } from '../../types';
import { ConfirmModal } from '../../components/common/ConfirmModal';

interface TasksViewProps {
  currentUser?: User | null;
}

export const TasksView: React.FC<TasksViewProps> = ({ currentUser }) => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState<'AVAILABLE' | 'WAITING' | 'COMPLETED'>('AVAILABLE');

  // Admin Create Task Modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [rewardPrice, setRewardPrice] = useState<number | ''>(150000);

  // Worker Complete Task Modal
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);
  const [showCompleteModal, setShowCompleteModal] = useState(false);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [proofNotes, setProofNotes] = useState('');

  // Image Lightbox Modal State
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isSuperAdmin = !currentUser || ['ADMIN', 'SUPER_ADMIN', 'DEVELOPER', 'HR_MANAGER'].includes(currentUser.role);

  useEffect(() => {
    fetchTasks();
    // Smart lightweight polling every 10 seconds (only when tab is visible)
    const timer = setInterval(() => {
      if (!document.hidden) {
        fetchTasks();
      }
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  const fetchTasks = async () => {
    try {
      const data = await getTasks();
      setTasks(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatErrorMessage = (err: any): string => {
    const detail = err?.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) return detail.map((d: any) => d.msg || JSON.stringify(d)).join(', ');
    if (typeof detail === 'object' && detail !== null) return JSON.stringify(detail);
    return err?.message || "Xatolik yuz berdi";
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !rewardPrice) return;
    try {
      await createTask({
        title,
        description,
        reward_price: Number(rewardPrice)
      });
      setShowCreateModal(false);
      setTitle('');
      setDescription('');
      setRewardPrice(150000);
      fetchTasks();
    } catch (err: any) {
      alert(formatErrorMessage(err));
    }
  };

  const handleClaim = async (taskId: number) => {
    try {
      await claimTask(taskId);
      setActiveSubTab('WAITING');
      fetchTasks();
    } catch (err: any) {
      alert(formatErrorMessage(err));
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCompleteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTask) return;
    try {
      await completeTask(selectedTask.id, proofImage || undefined, proofNotes);
      setShowCompleteModal(false);
      setSelectedTask(null);
      setProofImage(null);
      setProofNotes('');
      fetchTasks();
    } catch (err: any) {
      alert(formatErrorMessage(err));
    }
  };

  const handleApprove = async (taskId: number) => {
    try {
      await approveTask(taskId);
      fetchTasks();
    } catch (err: any) {
      alert(formatErrorMessage(err));
    }
  };

  const [deleteTaskId, setDeleteTaskId] = useState<number | null>(null);

  const askDeleteTask = (taskId: number) => {
    setDeleteTaskId(taskId);
  };

  const handleConfirmDeleteTask = async () => {
    if (!deleteTaskId) return;
    const id = deleteTaskId;
    setDeleteTaskId(null);
    try {
      await deleteTask(id);
      fetchTasks();
    } catch (err: any) {
      alert(formatErrorMessage(err));
    }
  };

  const formatMoney = (val: number) => new Intl.NumberFormat('uz-UZ').format(val) + " so'm";

  const availableTasks = tasks.filter(t => t.status === 'AVAILABLE');
  const waitingTasks = tasks.filter(t => 
    t.status === 'IN_PROGRESS' || t.status === 'COMPLETED_PENDING_REVIEW'
  );
  const completedTasks = tasks.filter(t => t.status === 'APPROVED');

  return (
    <div className="p-4 sm:p-8 space-y-6 sm:space-y-8 max-w-7xl mx-auto font-sans">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-slate-100 p-5 sm:p-6 rounded-3xl shadow-sm">
        <div>
          <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-blue-600" />
            <span>Boshqa Vazifalar Bo'limi</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Topshiriqni bajarish, foto isbot yuborish va mukofot bonusini olish
          </p>
        </div>

        <div className="flex items-center gap-3">
          {availableTasks.length > 0 && (
            <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 border border-rose-100 text-rose-600 text-xs font-extrabold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500"></span>
              <span>{availableTasks.length} ta Yangi Vazifa</span>
            </span>
          )}

          {isSuperAdmin && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-md shadow-blue-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              <span>+ Yangi Vazifa Yaratish</span>
            </button>
          )}
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex flex-wrap border-b border-slate-200 gap-3 sm:gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveSubTab('AVAILABLE')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeSubTab === 'AVAILABLE'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <Clock className="w-4 h-4" />
          <span>Mavjud Vazifalar ({availableTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('WAITING')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeSubTab === 'WAITING'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <AlertCircle className="w-4 h-4 text-amber-500" />
          <span>Kutish Bo'limi / Bajarilayotgan ({waitingTasks.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('COMPLETED')}
          className={`pb-3 flex items-center gap-2 transition border-b-2 ${
            activeSubTab === 'COMPLETED'
              ? 'border-blue-600 text-blue-600 font-extrabold'
              : 'border-transparent text-slate-400 hover:text-slate-700'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          <span>Bajarilgan & Tasdiqlangan ({completedTasks.length})</span>
        </button>
      </div>

      {/* TAB 1: Mavjud Vazifalar */}
      {activeSubTab === 'AVAILABLE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {availableTasks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
              Hozircha hech qanday yangi vazifa yo'q.
            </div>
          ) : (
            availableTasks.map((t) => (
              <div key={t.id} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition relative flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-600 border border-blue-100">
                      🟡 Ochiq Vazifa
                    </span>
                    <span className="text-sm font-black text-emerald-600 font-mono">
                      +{formatMoney(t.reward_price)}
                    </span>
                  </div>
                  <h3 className="text-base font-extrabold text-slate-900">{t.title}</h3>
                  <p className="text-xs text-slate-500">{t.description || 'Tavsif berilmagan'}</p>
                </div>

                <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                  {isSuperAdmin ? (
                    <div className="w-full flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-400">⚡️ Ishchilar uchun ochiq topshiriq</span>
                      <button
                        onClick={() => askDeleteTask(t.id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition flex items-center gap-1 text-xs font-bold"
                        title="Vazifani o'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                        <span>O'chirish</span>
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleClaim(t.id)}
                      className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-md shadow-blue-600/20 transition flex items-center justify-center gap-1.5"
                    >
                      <span>⚡️ Vazifani Olish</span>
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: Kutish Bo'limi / Bajarilayotgan */}
      {activeSubTab === 'WAITING' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {waitingTasks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
              Kutish bo'limida vazifalar yo'q.
            </div>
          ) : (
            waitingTasks.map((t) => (
              <div key={t.id} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm hover:shadow-md transition">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                    t.status === 'COMPLETED_PENDING_REVIEW'
                      ? 'bg-amber-50 text-amber-700 border-amber-200'
                      : 'bg-blue-50 text-blue-700 border-blue-200'
                  }`}>
                    {t.status === 'COMPLETED_PENDING_REVIEW' ? '⏳ Admin Tasdiqini Kutmoqda' : '⚙️ Bajarilmoqda'}
                  </span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    +{formatMoney(t.reward_price)}
                  </span>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-extrabold text-slate-900">{t.title}</h3>
                  <p className="text-xs text-slate-500">{t.description || 'Tavsif yo\'q'}</p>
                </div>

                {/* Uploaded Proof Photo & Notes Preview */}
                {(t.proof_image_url || t.after_image_url || t.before_image_url) && (
                  <div className="space-y-2 bg-slate-50/80 p-3 rounded-2xl border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-extrabold text-slate-500 flex items-center gap-1">
                        <Camera className="w-3.5 h-3.5 text-blue-600" />
                        <span>Ishchi Yuborgan Foto Isbot:</span>
                      </span>
                      <span className="text-[9px] font-bold text-blue-600 flex items-center gap-0.5 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        <ZoomIn className="w-3 h-3" />
                        <span>Kattalashtirish</span>
                      </span>
                    </div>
                    <div
                      onClick={() => setPreviewImage(t.proof_image_url || t.after_image_url || t.before_image_url || null)}
                      className="relative group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm"
                    >
                      <img
                        src={t.proof_image_url || t.after_image_url || t.before_image_url}
                        alt="Ishchi yuklagan rasm"
                        className="w-full h-44 object-cover group-hover:scale-105 transition duration-300"
                      />
                      <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                        <ZoomIn className="w-4 h-4" />
                        <span>Katta ko'rish</span>
                      </div>
                    </div>
                    {t.proof_notes && (
                      <p className="text-[11px] text-slate-600 font-medium italic bg-white p-2 rounded-xl border border-slate-100">
                        💬 "{t.proof_notes}"
                      </p>
                    )}
                  </div>
                )}

                <div className="pt-2">
                  {t.status === 'IN_PROGRESS' ? (
                    <button
                      onClick={() => { setSelectedTask(t); setShowCompleteModal(true); }}
                      className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-full shadow-md transition flex items-center justify-center gap-2"
                    >
                      <Camera className="w-4 h-4" />
                      <span>📸 Vazifani Tugatish (Rasm yuborish)</span>
                    </button>
                  ) : (
                    isSuperAdmin ? (
                      <button
                        onClick={() => handleApprove(t.id)}
                        className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-full shadow-md transition flex items-center justify-center gap-1.5"
                      >
                        <ShieldCheck className="w-4 h-4" />
                        <span>✅ Rasm va Natijani Tasdiqlash & Bonus Berish</span>
                      </button>
                    ) : (
                      <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-center space-y-1">
                        <span className="text-[11px] font-extrabold text-amber-900 block">
                          ⏳ Administrator Tasdiqlashi Kutilmoqda
                        </span>
                        <p className="text-[10px] text-amber-700">
                          Rasm va vazifa natijasi yuborildi. Faqat Admin tasdiqlagach maoshingizga bonus qo'shiladi.
                        </p>
                      </div>
                    )
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: Bajarilgan & Tasdiqlangan */}
      {activeSubTab === 'COMPLETED' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {completedTasks.length === 0 ? (
            <div className="col-span-full py-16 text-center text-slate-400 font-medium bg-white rounded-3xl border border-slate-100">
              Bajarilgan vazifalar yo'q.
            </div>
          ) : (
            completedTasks.map((t) => (
              <div key={t.id} className="bg-white border border-slate-100 rounded-3xl p-6 space-y-4 shadow-sm">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <span className="text-[10px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                    🟢 ADMIN TASDIQLADI
                  </span>
                  <span className="text-sm font-black text-emerald-600 font-mono">
                    +{formatMoney(t.reward_price)}
                  </span>
                </div>

                <h3 className="text-sm font-extrabold text-slate-900">{t.title}</h3>

                {(t.proof_image_url || t.after_image_url || t.before_image_url) && (
                  <div
                    onClick={() => setPreviewImage(t.proof_image_url || t.after_image_url || t.before_image_url || null)}
                    className="relative group cursor-pointer overflow-hidden rounded-2xl border border-slate-100 shadow-xs"
                  >
                    <img
                      src={t.proof_image_url || t.after_image_url || t.before_image_url}
                      alt="Proof"
                      className="w-full h-36 object-cover group-hover:scale-105 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-slate-900/20 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center text-white font-bold text-xs gap-1.5 backdrop-blur-[1px]">
                      <ZoomIn className="w-4 h-4" />
                      <span>Katta ko'rish</span>
                    </div>
                  </div>
                )}

                <div className="text-[10px] text-slate-400 font-mono">
                  Tasdiqlandi: {new Date(t.completed_at || t.updated_at).toLocaleString('uz-UZ')}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Admin Create Task Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTask} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">Yangi Vazifa Yaratish</h3>
            
            <div className="space-y-3 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Vazifa Sarlavhasi / Nomi *</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="masalan: Tovarlarni tushirish"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Vazifa Narxi / Mukofoti (so'm) *</label>
                <input
                  type="number"
                  value={rewardPrice}
                  onChange={(e) => setRewardPrice(e.target.value ? Number(e.target.value) : '')}
                  placeholder="150000"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 font-bold text-base"
                  required
                />
              </div>

              <div>
                <label className="text-slate-500 font-bold block mb-1">Batafsil Tavsif</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Skladga kelgan 50 ta korobkani tushirish va joylashtirish"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800 h-20"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-blue-600 text-white font-bold text-xs rounded-full shadow-md">Saqlash</button>
            </div>
          </form>
        </div>
      )}

      {/* Worker Complete Task & Photo Upload Modal */}
      {showCompleteModal && selectedTask && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCompleteSubmit} className="bg-white border border-slate-100 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-4">
            <h3 className="text-base font-extrabold text-slate-900 border-b border-slate-100 pb-3">
              Vazifani Tugatish & Rasm Yuborish — {selectedTask.title}
            </h3>

            <div className="space-y-4 text-xs">
              <div>
                <label className="text-slate-500 font-bold block mb-1">Bajarilganligi Haqida Rasm (Telefoningizdan Tanlang) *</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100"
                />
              </div>

              {proofImage && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 block">Tanlangan Rasm:</span>
                  <img src={proofImage} alt="Preview" className="w-full h-40 object-cover rounded-2xl border border-slate-200" />
                </div>
              )}

              <div>
                <label className="text-slate-500 font-bold block mb-1">Izoh / Izohlar</label>
                <input
                  type="text"
                  value={proofNotes}
                  onChange={(e) => setProofNotes(e.target.value)}
                  placeholder="masalan: Hamma tovarlar muvaffaqiyatli joylashtirildi"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-3.5 py-2 text-slate-800"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button type="button" onClick={() => setShowCompleteModal(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-800 font-bold text-xs rounded-full">Bekor qilish</button>
              <button type="submit" className="flex-1 py-2.5 bg-emerald-600 text-white font-bold text-xs rounded-full shadow-md">Rasm Yuborish & Tasdiqqa Yuborish</button>
            </div>
          </form>
        </div>
      )}

      {/* Fullscreen Image Lightbox Modal */}
      {previewImage && (
        <div
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-8 animate-in fade-in duration-200 cursor-zoom-out"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative max-w-4xl max-h-[90vh] bg-slate-900 rounded-3xl p-3 sm:p-5 shadow-2xl border border-slate-700/80 overflow-hidden flex flex-col items-center cursor-default"
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-4 right-4 z-10 p-2.5 bg-slate-800/90 hover:bg-slate-700 text-white rounded-full backdrop-blur-sm border border-slate-600/80 transition shadow-lg"
              title="Yopish (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
            <img
              src={previewImage}
              alt="Katta foto isbot"
              className="max-w-full max-h-[78vh] object-contain rounded-2xl shadow-md border border-slate-800"
            />
            <span className="text-xs font-extrabold text-slate-300 mt-3 flex items-center gap-1.5 bg-slate-800/60 px-4 py-1.5 rounded-full border border-slate-700">
              <ZoomIn className="w-4 h-4 text-blue-400" />
              <span>Foto isbotni yopish uchun atrofga yoki X tugmasiga bosing</span>
            </span>
          </div>
        </div>
      )}

      {/* CUSTOM CONFIRM MODAL FOR DELETING TASK */}
      <ConfirmModal
        isOpen={deleteTaskId !== null}
        title="Vazifani O'chirish"
        message="Rostdan ham ushbu vazifani o'chirmoqchimisiz? Qaytarib bo'lmaydi."
        confirmText="Ha, o'chirish"
        cancelText="Yo'q, bekor qilish"
        type="danger"
        onConfirm={handleConfirmDeleteTask}
        onCancel={() => setDeleteTaskId(null)}
      />
    </div>
  );
};
