import React from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  Trash2, 
  RotateCcw, 
  X,
  CheckCircle2,
  Wrench,
  DoorOpen
} from 'lucide-react';

export type ConfirmType = 'clean' | 'warning' | 'danger' | 'reset' | 'maintenance' | 'checkout';

interface ConfirmDialogModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  roomBadge?: string;
  confirmText?: string;
  cancelText?: string;
  type?: ConfirmType;
}

export const ConfirmDialogModal: React.FC<ConfirmDialogModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  roomBadge,
  confirmText = 'ยืนยันดำเนินการ',
  cancelText = 'ยกเลิก',
  type = 'clean',
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'clean':
        return (
          <div className="w-14 h-14 rounded-3xl bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-inner">
            <Sparkles className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'danger':
        return (
          <div className="w-14 h-14 rounded-3xl bg-rose-100 text-rose-600 border border-rose-200 flex items-center justify-center shadow-inner">
            <Trash2 className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'reset':
        return (
          <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-inner">
            <RotateCcw className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'maintenance':
        return (
          <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-700 border border-amber-200 flex items-center justify-center shadow-inner">
            <Wrench className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'checkout':
        return (
          <div className="w-14 h-14 rounded-3xl bg-blue-100 text-blue-600 border border-blue-200 flex items-center justify-center shadow-inner">
            <DoorOpen className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
      case 'warning':
      default:
        return (
          <div className="w-14 h-14 rounded-3xl bg-amber-100 text-amber-600 border border-amber-200 flex items-center justify-center shadow-inner">
            <AlertTriangle className="w-7 h-7 stroke-[2.5]" />
          </div>
        );
    }
  };

  const getConfirmButtonClass = () => {
    switch (type) {
      case 'clean':
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30';
      case 'danger':
        return 'bg-rose-600 hover:bg-rose-700 text-white shadow-rose-600/30';
      case 'reset':
      case 'maintenance':
      case 'warning':
        return 'bg-amber-600 hover:bg-amber-700 text-white shadow-amber-600/30';
      case 'checkout':
        return 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30';
      default:
        return 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/30';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200 font-['Prompt']">
      <div 
        className="bg-white text-slate-900 w-full max-w-sm sm:max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 text-center relative animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Icon */}
        <div className="flex justify-center mb-4">
          {getIcon()}
        </div>

        {/* Room Badge (if any) */}
        {roomBadge && (
          <div className="inline-block px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-black text-xs mb-2 border border-slate-200">
            {roomBadge}
          </div>
        )}

        {/* Title */}
        <h3 className="text-lg font-black text-slate-900 tracking-tight mb-2">
          {title}
        </h3>

        {/* Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-medium mb-6 px-2">
          {description}
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs sm:text-sm transition-all border border-slate-200"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`py-3 px-4 rounded-2xl active:scale-95 font-bold text-xs sm:text-sm shadow-md transition-all flex items-center justify-center gap-1.5 ${getConfirmButtonClass()}`}
          >
            <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
