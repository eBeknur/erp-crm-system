import React from 'react';
import { AlertTriangle, Trash2, CheckCircle2, Info, X } from 'lucide-react';

export interface ConfirmModalOptions {
  isOpen: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info' | 'success';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalOptions> = ({
  isOpen,
  title = "Tasdiqlang",
  message,
  confirmText = "Ha, tasdiqlayman",
  cancelText = "Yo'q, bekor qilish",
  type = 'danger',
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              type === 'danger' ? 'bg-rose-100 text-rose-600' :
              type === 'warning' ? 'bg-amber-100 text-amber-600' :
              type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {type === 'danger' && <Trash2 className="w-6 h-6" />}
              {type === 'warning' && <AlertTriangle className="w-6 h-6" />}
              {type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {type === 'info' && <Info className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-400 font-medium">Tasdiqlash so'ralmoqda</p>
            </div>
          </div>

          <button 
            onClick={onCancel}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="my-5 bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            onClick={onCancel}
            className="px-5 py-2.5 rounded-full text-xs font-black text-slate-600 bg-slate-100 hover:bg-slate-200 transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className={`px-5 py-2.5 rounded-full text-xs font-black text-white shadow-lg transition cursor-pointer active:scale-95 ${
              type === 'danger' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' :
              type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' :
              type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' :
              'bg-blue-600 hover:bg-blue-700 shadow-blue-600/30'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
