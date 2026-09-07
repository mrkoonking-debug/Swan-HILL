import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Coins, 
  RotateCcw, 
  DoorOpen, 
  Calendar, 
  User,
  CreditCard,
  Banknote
} from 'lucide-react';
import type { Booking, PaymentMethod } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';
import { HouseLogo } from './HouseLogo';

interface CancelBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirmCancel: (
    bookingId: string, 
    refundData: { 
      refundAmount: number; 
      refundMethod: PaymentMethod; 
      reason: string; 
      note?: string; 
    }
  ) => void;
}

export const CancelBookingModal: React.FC<CancelBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  onConfirmCancel,
}) => {
  if (!isOpen || !booking) return null;

  const paidAmount = booking.paidAmount || 0;
  
  // Refund states
  const [refundType, setRefundType] = useState<'full' | 'partial' | 'none'>(paidAmount > 0 ? 'full' : 'none');
  const [customRefundAmount, setCustomRefundAmount] = useState<string>(paidAmount.toString());
  const [refundMethod, setRefundMethod] = useState<PaymentMethod>('transfer');
  const [reason, setReason] = useState<string>('ลูกค้าแจ้งเปลี่ยนใจ');
  const [customReason, setCustomReason] = useState<string>('');
  const [note, setNote] = useState<string>('');

  useEffect(() => {
    if (booking) {
      const p = booking.paidAmount || 0;
      setRefundType(p > 0 ? 'full' : 'none');
      setCustomRefundAmount(p.toString());
      setReason('ลูกค้าแจ้งเปลี่ยนใจ');
      setCustomReason('');
      setNote('');
    }
  }, [booking]);

  const calculateActualRefund = (): number => {
    if (paidAmount <= 0 || refundType === 'none') return 0;
    if (refundType === 'full') return paidAmount;
    const num = parseFloat(customRefundAmount) || 0;
    return Math.min(paidAmount, Math.max(0, num));
  };

  const finalRefundAmount = calculateActualRefund();
  const finalReason = reason === 'other' ? (customReason.trim() || 'ลูกค้าขอยกเลิก') : reason;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirmCancel(booking.id, {
      refundAmount: finalRefundAmount,
      refundMethod,
      reason: finalReason,
      note: note.trim() || undefined,
    });
    onClose();
  };

  const quickReasons = [
    'ลูกค้าแจ้งเปลี่ยนใจ',
    'ติดธุระกะทันหัน / เลื่อนทริป',
    'ลงข้อมูลผิดห้อง / ผิดวัน',
    'ลูกค้าติดต่อไม่ได้',
    'สภาพอากาศ / ฝนตก',
    'other'
  ];

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in duration-200 font-['Prompt']"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <RotateCcw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>ยกเลิกการจอง & คืนเงินมัดจำ</span>
              </h3>
              <p className="text-xs text-rose-100">
                รหัส {booking.bookingCode} &bull; ปลดล็อคห้องพักให้กลับมาว่างทันที
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800">
          
          {/* Booking Summary Box */}
          <div className="p-3.5 bg-slate-50 border border-slate-200/90 rounded-2xl flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <HouseLogo roomNumber={booking.roomNumber} size="md" />
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900 text-sm sm:text-base">
                    บ้าน {booking.roomNumber}
                  </span>
                  <span className="text-[11px] text-slate-500 font-normal">
                    ({booking.roomType})
                  </span>
                </div>
                <div className="text-xs text-slate-700 font-medium truncate mt-0.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{booking.guestName}</span>
                  <span className="text-slate-400">({booking.guestPhone})</span>
                </div>
                <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-slate-400 shrink-0" />
                  <span>{formatThaiDate(booking.checkInDate)} - {formatThaiDate(booking.checkOutDate)} ({booking.totalNights} คืน)</span>
                </div>
              </div>
            </div>

            {/* Financial Status Summary */}
            <div className="text-right shrink-0 border-l border-slate-200 pl-3">
              <span className="text-[10px] text-slate-500 block">ยอดรวมทั้งสิ้น</span>
              <span className="font-bold text-slate-900 text-xs sm:text-sm">฿{booking.totalAmount.toLocaleString()}</span>
              <span className="text-[10px] text-slate-500 block mt-1">ชำระแล้ว (มัดจำ)</span>
              <span className={`font-bold text-xs sm:text-sm ${paidAmount > 0 ? 'text-emerald-700' : 'text-slate-400'}`}>
                ฿{paidAmount.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Refund Deposit Section */}
          <div className="p-4 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <label className="font-bold text-amber-950 flex items-center gap-1.5 text-xs sm:text-sm">
                <Coins className="w-4 h-4 text-amber-600" />
                <span>การจัดการเงินมัดจำ / ยอดที่ชำระแล้ว</span>
              </label>
              <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-lg border border-amber-200">
                ลูกค้าจ่ายมาแล้ว: ฿{paidAmount.toLocaleString()}
              </span>
            </div>

            {paidAmount > 0 ? (
              <div className="space-y-3">
                {/* 3 Refund Options */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setRefundType('full');
                      setCustomRefundAmount(paidAmount.toString());
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      refundType === 'full'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[10px] opacity-80 mb-0.5">คืนเต็มจำนวน</div>
                    <div>฿{paidAmount.toLocaleString()}</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRefundType('partial')}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      refundType === 'partial'
                        ? 'bg-amber-600 text-white border-amber-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[10px] opacity-80 mb-0.5">คืนบางส่วน</div>
                    <div>ระบุยอดเงิน</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setRefundType('none');
                      setCustomRefundAmount('0');
                    }}
                    className={`p-2.5 rounded-xl border text-center font-bold text-xs transition-all cursor-pointer ${
                      refundType === 'none'
                        ? 'bg-red-600 text-white border-red-600 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <div className="text-[10px] opacity-80 mb-0.5">ไม่คืนมัดจำ</div>
                    <div>฿0 (ริบเงิน)</div>
                  </button>
                </div>

                {/* If Partial Refund: input custom amount */}
                {refundType === 'partial' && (
                  <div className="bg-white p-3 rounded-xl border border-amber-300 space-y-1.5 animate-in fade-in">
                    <label className="text-xs font-semibold text-slate-700 block">
                      ระบุจำนวนเงินที่ต้องการคืนลูกค้า (บาท):
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 font-bold text-slate-400">฿</span>
                      <input
                        type="number"
                        min="0"
                        max={paidAmount}
                        value={customRefundAmount}
                        onChange={(e) => setCustomRefundAmount(e.target.value)}
                        placeholder="กรอกยอดเงินคืน"
                        className="w-full pl-8 pr-4 py-2 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 outline-none"
                      />
                    </div>
                    <p className="text-[11px] text-slate-500">
                      ลูกค้าจ่ายมา ฿{paidAmount.toLocaleString()} &bull; หักค่าปรับไว้ ฿{Math.max(0, paidAmount - (parseFloat(customRefundAmount) || 0)).toLocaleString()} บาท
                    </p>
                  </div>
                )}

                {/* Refund Method (if refunding > 0) */}
                {finalRefundAmount > 0 && (
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/80">
                    <span className="text-xs font-semibold text-amber-950">ช่องทางคืนเงิน:</span>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => setRefundMethod('transfer')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                          refundMethod === 'transfer'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <CreditCard className="w-3.5 h-3.5" />
                        <span>โอนเงินคืน (พร้อมเพย์/ธนาคาร)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setRefundMethod('cash')}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer border ${
                          refundMethod === 'cash'
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200'
                        }`}
                      >
                        <Banknote className="w-3.5 h-3.5" />
                        <span>เงินสด</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white p-3 rounded-xl border border-amber-200 text-slate-600 text-xs font-medium">
                รายการนี้ยังไม่ได้ชำระเงินมัดจำ จึงไม่มีรายการคืนเงิน
              </div>
            )}
          </div>

          {/* Cancellation Reason */}
          <div className="space-y-2">
            <label className="font-bold text-slate-800 block text-xs sm:text-sm">
              สาเหตุการยกเลิกการจอง:
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {quickReasons.map((r) => {
                const isSelected = reason === r;
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={`px-2.5 py-2 rounded-xl text-xs font-medium border text-left transition-all cursor-pointer truncate ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {r === 'other' ? 'ระบุสาเหตุอื่นๆ...' : r}
                  </button>
                );
              })}
            </div>

            {reason === 'other' && (
              <input
                type="text"
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="พิมพ์ระบุเหตุผลการยกเลิก..."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-slate-500 focus:ring-1 focus:ring-slate-500 mt-1"
                required
              />
            )}
          </div>

          {/* Additional Notes */}
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-700 block">
              หมายเหตุเพิ่มเติม (ถ้ามี):
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="เช่น โอนคืนผ่านพร้อมเพย์ลูกค้า 08X-XXX-XXXX แล้ว"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400"
            />
          </div>

          {/* Automatic Room Unlocking Notice (The core solution for the user!) */}
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-900">
            <DoorOpen className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong>ปลดล็อคห้องทันที:</strong> เมื่อกดยืนยันแล้ว <strong>บ้าน {booking.roomNumber}</strong> จะถูกเปลี่ยนสถานะกลับมาเป็น <strong className="text-emerald-700">"ว่างพร้อมขาย"</strong> บนหน้าผังรีสอร์ททันที เพื่อให้คุณรับลูกค้ารายอื่นได้ทันเวลาครับ
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer text-center"
            >
              ปิดหน้าต่าง
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-red-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>ยืนยันยกเลิก {finalRefundAmount > 0 ? `(คืนเงิน ฿${finalRefundAmount.toLocaleString()})` : ''}</span>
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};
