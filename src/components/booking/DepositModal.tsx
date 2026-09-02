import React from 'react';
import { Coins, X } from 'lucide-react';
export interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  grandTotal: number;
  depositAmount: number;
  setDepositAmount: (amount: number) => void;
  depositPercent: number;
  onSetDepositPercent: (percent: number) => void;
  roomPriceUnit: number;
  remainingAtCheckin: number;
}

export const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  grandTotal,
  depositAmount,
  setDepositAmount,
  depositPercent,
  onSetDepositPercent,
  roomPriceUnit,
  remainingAtCheckin,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overscroll-contain animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full max-w-sm rounded-2xl p-4 shadow-2xl border border-slate-200 space-y-3"
      >
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-amber-600" />
            <span>กำหนดยอดเงินมัดจำ</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Quick Percentage Presets */}
        <div className="grid grid-cols-2 gap-1.5 text-xs">
          <button
            type="button"
            onClick={() => onSetDepositPercent(50)}
            className={`p-2 rounded-xl font-bold border transition-all cursor-pointer text-center ${
              depositPercent === 50
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-amber-50'
            }`}
          >
            <span className="block">50% ปกติ</span>
            <span className="text-[10px] font-normal opacity-90">฿{Math.round(grandTotal * 0.5).toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => onSetDepositPercent(30)}
            className={`p-2 rounded-xl font-bold border transition-all cursor-pointer text-center ${
              depositPercent === 30
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-amber-50'
            }`}
          >
            <span className="block">30% เริ่มต้น</span>
            <span className="text-[10px] font-normal opacity-90">฿{Math.round(grandTotal * 0.3).toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => onSetDepositPercent(20)}
            className={`p-2 rounded-xl font-bold border transition-all cursor-pointer text-center ${
              depositPercent === 20
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-amber-50'
            }`}
          >
            <span className="block">20% ขั้นต่ำ</span>
            <span className="text-[10px] font-normal opacity-90">฿{Math.round(grandTotal * 0.2).toLocaleString()}</span>
          </button>

          <button
            type="button"
            onClick={() => setDepositAmount(roomPriceUnit)}
            className={`p-2 rounded-xl font-bold border transition-all cursor-pointer text-center ${
              depositAmount === roomPriceUnit
                ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-amber-50'
            }`}
          >
            <span className="block">ค่าห้อง 1 คืน</span>
            <span className="text-[10px] font-normal opacity-90">฿{roomPriceUnit.toLocaleString()}</span>
          </button>
        </div>

        {/* Custom Number Input */}
        <div className="space-y-1">
          <label className="text-[11px] font-bold text-slate-700 block">หรือระบุยอดเงินเอง (บาท):</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">฿</span>
            <input
              type="number"
              min={1}
              max={grandTotal}
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              className="w-full pl-7 pr-3 py-2 text-sm font-bold text-slate-900 border border-slate-300 rounded-xl outline-none focus:border-amber-500 bg-slate-50 focus:bg-white"
            />
          </div>
        </div>

        {/* Balance preview */}
        <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200 flex items-center justify-between text-xs">
          <span className="text-amber-950 font-medium">คงเหลือเก็บวันเข้าพัก:</span>
          <span className="font-black text-amber-950">฿{remainingAtCheckin.toLocaleString()} บาท</span>
        </div>

        {/* Confirm Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
        >
          ✓ ยืนยันยอดมัดจำ ฿{depositAmount.toLocaleString()}
        </button>
      </div>
    </div>
  );
};
