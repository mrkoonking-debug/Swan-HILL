import React, { useState } from 'react';
import { 
  CreditCard, 
  X, 
  Check, 
  QrCode, 
  Banknote, 
  Clock
} from 'lucide-react';
import type { Booking, PaymentMethod, PaymentTransaction } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onRecordPayment: (bookingId: string, transaction: PaymentTransaction) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onRecordPayment,
}) => {
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote] = useState('');

  if (!isOpen || !booking) return null;

  const roomBaseTotal = booking.roomPrice * booking.totalNights;
  const addOnsTotal = booking.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
  const grandTotal = booking.totalAmount || (roomBaseTotal + addOnsTotal);
  const remainingBalance = Math.max(0, grandTotal - booking.paidAmount);

  // Default payment amount is remaining balance (or grand total if unpaid)
  const [amount, setAmount] = useState<number>(remainingBalance > 0 ? remainingBalance : grandTotal);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newTx: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      amount: Number(amount),
      method,
      note: note.trim() || (method === 'transfer' ? 'โอนเงินเข้าบัญชี' : 'ชำระเงินสดหน้าเคาน์เตอร์'),
      paidAt: new Date().toISOString(),
    };

    onRecordPayment(booking.id, newTx);
    onClose();
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white text-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black">บันทึกการรับชำระเงิน</h3>
              <p className="text-slate-400 text-xs font-medium">
                ห้อง {booking.roomNumber} &bull; {booking.guestName} ({booking.bookingCode})
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto no-scrollbar space-y-4 flex-1">
          
          {/* Financial Overview Cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block uppercase">ยอดรวมทั้งสิ้น</span>
              <span className="text-sm md:text-base font-black text-slate-900">฿{grandTotal.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200">
              <span className="text-[10px] text-emerald-700 font-bold block uppercase">ชำระแล้ว</span>
              <span className="text-sm md:text-base font-black text-emerald-800">฿{booking.paidAmount.toLocaleString()}</span>
            </div>
            <div className={`p-2.5 rounded-xl border ${remainingBalance > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] font-bold block uppercase ${remainingBalance > 0 ? 'text-amber-800' : 'text-slate-500'}`}>ค้างชำระ</span>
              <span className={`text-sm md:text-base font-black ${remainingBalance > 0 ? 'text-amber-900' : 'text-slate-700'}`}>฿{remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment Method Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1.5">
              ช่องทางการชำระเงิน <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod('transfer')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  method === 'transfer'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method === 'transfer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs block font-bold">โอนเงิน / พร้อมเพย์</span>
                  <span className="text-[10px] text-slate-500">Bank Transfer / QR</span>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setMethod('cash')}
                className={`p-3 rounded-xl border text-left flex items-center gap-2.5 transition-all ${
                  method === 'cash'
                    ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                    : 'border-slate-200 hover:bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${method === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  <Banknote className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-xs block font-bold">เงินสด</span>
                  <span className="text-[10px] text-slate-500">Cash Payment</span>
                </div>
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-xs font-bold text-slate-900">
                จำนวนเงินที่รับชำระ (บาท) <span className="text-red-500">*</span>
              </label>
              {remainingBalance > 0 && (
                <button
                  type="button"
                  onClick={() => setAmount(remainingBalance)}
                  className="text-[10px] font-bold text-emerald-700 hover:underline"
                >
                  ใส่ยอดคงเหลือทั้งหมด (฿{remainingBalance.toLocaleString()})
                </button>
              )}
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">฿</span>
              <input
                type="number"
                required
                min={1}
                max={grandTotal}
                value={amount}
                onChange={(e) => setAmount(Number(e.target.value))}
                className="w-full pl-8 pr-4 py-2.5 text-base font-black text-slate-900 border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white shadow-xs"
              />
            </div>
          </div>

          {/* Note Input */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              บันทึกช่วยจำ / หมายเหตุการชำระ
            </label>
            <input
              type="text"
              placeholder="เช่น ชำระค่าหมูกระทะ 2 ชุด, สลิปโอนกสิกรไทย"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white shadow-xs"
            />
          </div>

          {/* Transaction History for this Booking */}
          {booking.transactions && booking.transactions.length > 0 && (
            <div className="pt-2 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-800 block mb-2 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                ประวัติการรับชำระเงินก่อนหน้า ({booking.transactions.length} รายการ)
              </span>
              <div className="space-y-1.5 max-h-32 overflow-y-auto no-scrollbar">
                {booking.transactions.map((tx) => (
                  <div key={tx.id} className="p-2 bg-slate-50 rounded-lg border border-slate-200 text-[11px] flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-900 block">
                        {tx.method === 'transfer' ? 'โอนเงิน/พร้อมเพย์' : 'เงินสด'} - {tx.note || 'รับชำระเงิน'}
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {formatThaiDate(tx.paidAt)} {new Date(tx.paidAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                      </span>
                    </div>
                    <span className="font-black text-emerald-700 text-xs">
                      +฿{tx.amount.toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-2 flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-sm shadow-emerald-600/20 flex items-center justify-center gap-1.5 transition-all"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>บันทึกรับชำระ ฿{amount.toLocaleString()}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
