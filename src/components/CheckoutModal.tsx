import React from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  ArrowRight, 
  X, 
  CreditCard, 
  DoorOpen,
  DollarSign
} from 'lucide-react';
import type { Booking, PaymentMethod } from '../types/pms';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onConfirmCheckout: (bookingId: string, paymentReceived?: { amount: number; method: PaymentMethod }) => void;
}

export const CheckoutModal: React.FC<CheckoutModalProps> = ({
  isOpen,
  onClose,
  booking,
  onConfirmCheckout,
}) => {
  useLockBodyScroll(isOpen);

  if (!isOpen || !booking) return null;

  const roomBaseTotal = booking.stayType === 'day_use' ? booking.roomPrice : booking.roomPrice * (booking.totalNights || 1);
  const addOnsTotal = booking.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
  const grandTotal = booking.totalAmount || (roomBaseTotal + addOnsTotal);
  const remainingBalance = Math.max(0, grandTotal - booking.paidAmount);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/80 backdrop-blur-md overscroll-contain animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-900 w-full max-w-md rounded-3xl shadow-2xl border border-slate-200 overflow-hidden space-y-4 p-5 sm:p-6 overscroll-contain"
      >
        
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${
              remainingBalance > 0 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
            }`}>
              {remainingBalance > 0 ? <AlertTriangle className="w-5 h-5" /> : <DoorOpen className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">เช็คเอาท์ห้อง {booking.roomNumber}</h3>
              <p className="text-xs text-slate-500 font-medium">{booking.guestName}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 hover:text-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content depending on balance */}
        {remainingBalance > 0 ? (
          <div className="space-y-3">
            {/* Warning Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-300 rounded-2xl space-y-1 text-amber-950">
              <span className="text-xs font-bold flex items-center gap-1.5 text-amber-900">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ลูกค้ารายนี้ยังมียอดค้างชำระ!
              </span>
              <p className="text-xs text-amber-800 font-normal">
                ยอดเงินรวมทั้งสิ้น ฿{grandTotal.toLocaleString()} บาท (จ่ายแล้ว ฿{booking.paidAmount.toLocaleString()})
              </p>
              <p className="text-sm font-bold text-amber-950 pt-1">
                ยอดคงเหลือที่ต้องเรียกเก็บ: <span className="text-red-600 text-base font-bold">฿{remainingBalance.toLocaleString()} บาท</span>
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-1">
              {/* Option 1: Record full payment + checkout (Transfer) */}
              <button
                onClick={() => {
                  onConfirmCheckout(booking.id, { amount: remainingBalance, method: 'transfer' });
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <CreditCard className="w-4 h-4" />
                <span>รับเงินโอน ฿{remainingBalance.toLocaleString()} ครบแล้ว &bull; เช็คเอาท์</span>
              </button>

              {/* Option 2: Record full payment + checkout (Cash) */}
              <button
                onClick={() => {
                  onConfirmCheckout(booking.id, { amount: remainingBalance, method: 'cash' });
                  onClose();
                }}
                className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all"
              >
                <DollarSign className="w-4 h-4" />
                <span>รับเงินสด ฿{remainingBalance.toLocaleString()} ครบแล้ว &bull; เช็คเอาท์</span>
              </button>

              {/* Option 3: Checkout anyway without collecting */}
              <button
                onClick={() => {
                  onConfirmCheckout(booking.id);
                  onClose();
                }}
                className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
              >
                เช็คเอาท์โดยยังไม่เก็บเงิน (คงสถานะค้างจ่าย)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3.5">
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs space-y-1">
              <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                ชำระเงินครบถ้วนแล้ว (฿{grandTotal.toLocaleString()} บาท)
              </span>
              <p className="text-slate-600">
                เมื่อกดยืนยัน ระบบจะเปลี่ยนสถานะห้องพักเป็น <span className="font-bold text-amber-700">"รอทำความสะอาด (Cleaning)"</span>
              </p>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
              >
                ยกเลิก
              </button>
              <button
                onClick={() => {
                  onConfirmCheckout(booking.id);
                  onClose();
                }}
                className="w-2/3 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all"
              >
                <ArrowRight className="w-4 h-4" />
                <span>ยืนยันการเช็คเอาท์</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
