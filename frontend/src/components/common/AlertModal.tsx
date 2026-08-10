import React from 'react';
import { AlertCircle, CheckCircle2, Info, AlertTriangle, X } from 'lucide-react';

export interface AlertModalOptions {
  isOpen: boolean;
  title?: string;
  message: string;
  buttonText?: string;
  type?: 'warning' | 'error' | 'info' | 'success';
  onClose: () => void;
}

export const AlertModal: React.FC<AlertModalOptions> = ({
  isOpen,
  title = "Diqqat",
  message,
  buttonText = "Tushunarli",
  type = 'warning',
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-3xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-100 transform transition-all animate-in zoom-in-95 duration-200 space-y-4 font-sans"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-inner ${
              type === 'error' ? 'bg-rose-100 text-rose-600' :
              type === 'warning' ? 'bg-amber-100 text-amber-600' :
              type === 'success' ? 'bg-emerald-100 text-emerald-600' :
              'bg-blue-100 text-blue-600'
            }`}>
              {type === 'error' && <AlertCircle className="w-6 h-6" />}
              {type === 'warning' && <AlertTriangle className="w-6 h-6" />}
              {type === 'success' && <CheckCircle2 className="w-6 h-6" />}
              {type === 'info' && <Info className="w-6 h-6" />}
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-400 font-medium">Tizim xabari</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-full hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
          <p className="text-xs sm:text-sm text-slate-700 font-semibold leading-relaxed">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end pt-2">
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-full text-xs font-black text-white shadow-lg transition cursor-pointer active:scale-95 ${
              type === 'error' ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30' :
              type === 'warning' ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/30' :
              type === 'success' ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30' :
              'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/30'
            }`}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};
