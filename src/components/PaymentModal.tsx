import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  X, 
  Check, 
  QrCode, 
  Banknote, 
  Clock,
  Trash2,
  Edit2,
  PlusCircle,
  Home,
  UtensilsCrossed,
  Sparkles,
  Tag,
  Percent,
  BadgePercent
} from 'lucide-react';
import type { Booking, PaymentMethod, PaymentTransaction } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onRecordPayment: (bookingId: string, transaction: PaymentTransaction) => void;
  onUpdatePaymentTransaction?: (bookingId: string, transactionId: string, updated: Partial<PaymentTransaction>) => void;
  onDeletePaymentTransaction?: (bookingId: string, transactionId: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  onRecordPayment,
  onUpdatePaymentTransaction,
  onDeletePaymentTransaction,
}) => {
  const [formMode, setFormMode] = useState<'payment' | 'discount'>('payment');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState<number>(0);
  
  // Discount / Adjustment State
  const [discountAmount, setDiscountAmount] = useState<number>(50);
  const [discountReason, setDiscountReason] = useState<string>('ปัดเศษให้ลูกค้า');

  // Editing state for an existing transaction
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState<number>(0);
  const [editMethod, setEditMethod] = useState<PaymentMethod>('transfer');
  const [editNote, setEditNote] = useState<string>('');

  const roomBaseTotal = booking ? booking.roomPrice * booking.totalNights : 0;
  const addOnsTotal = booking?.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
  const grandTotal = booking?.totalAmount || (roomBaseTotal + addOnsTotal);
  const remainingBalance = booking ? Math.max(0, grandTotal - booking.paidAmount) : 0;

  // Initialize amount when modal opens or booking changes
  useEffect(() => {
    if (booking) {
      const roomBase = booking.roomPrice * booking.totalNights;
      const addOns = booking.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
      const total = booking.totalAmount || (roomBase + addOns);
      const rem = Math.max(0, total - booking.paidAmount);
      setAmount(rem > 0 ? rem : total);
      setNote('');
      setFormMode('payment');
      setEditingTxId(null);
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  // Quick Preset Handlers
  const handleSelectQuickItem = (itemName: string, defaultPrice: number) => {
    setAmount(defaultPrice);
    setNote(itemName);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    const newTx: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      amount: Number(amount),
      method,
      note: note.trim() || (method === 'transfer' ? 'โอนเงินเข้าบัญชี' : 'ชำระเงินสด'),
      paidAt: new Date().toISOString(),
    };

    onRecordPayment(booking.id, newTx);
    setNote('');
  };

  const handleSubmitDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountAmount <= 0) return;

    const discountTx: PaymentTransaction = {
      id: 'tx-disc-' + Date.now(),
      amount: Number(discountAmount),
      method: 'cash',
      note: `[ส่วนลด/ปรับยอด] ${discountReason.trim() || 'ปัดเศษให้ลูกค้า'}`,
      paidAt: new Date().toISOString(),
    };

    onRecordPayment(booking.id, discountTx);
    setDiscountAmount(50);
  };

  // Start editing a past transaction
  const handleStartEdit = (tx: PaymentTransaction) => {
    setEditingTxId(tx.id);
    setEditAmount(tx.amount);
    setEditMethod(tx.method);
    setEditNote(tx.note || '');
  };

  // Save edited transaction
  const handleSaveEdit = (txId: string) => {
    if (onUpdatePaymentTransaction && editAmount > 0) {
      onUpdatePaymentTransaction(booking.id, txId, {
        amount: Number(editAmount),
        method: editMethod,
        note: editNote.trim(),
      });
      setEditingTxId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-white text-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col font-['Prompt']">
        
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-black">การชำระเงิน & ปรับปรุงยอดบัญชี</h3>
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
        <div className="p-4 overflow-y-auto no-scrollbar space-y-4 flex-1">
          
          {/* Financial Overview 3 Cards */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block">ยอดรวมทั้งสิ้น</span>
              <span className="text-sm md:text-base font-black text-slate-900">฿{grandTotal.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold block">ชำระแล้ว</span>
              <span className="text-sm md:text-base font-black text-emerald-800">฿{booking.paidAmount.toLocaleString()}</span>
            </div>
            <div className={`p-2.5 rounded-2xl border ${remainingBalance > 0 ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
              <span className={`text-[10px] font-bold block ${remainingBalance > 0 ? 'text-amber-900' : 'text-slate-500'}`}>คงเหลือค้างชำระ</span>
              <span className={`text-sm md:text-base font-black ${remainingBalance > 0 ? 'text-amber-950' : 'text-slate-700'}`}>฿{remainingBalance.toLocaleString()}</span>
            </div>
          </div>

          {/* Past Transactions Timeline & Editor */}
          <div className="bg-slate-50/80 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-emerald-600" />
                ประวัติการชำระเงิน & ปรับปรุงยอด ({booking.transactions?.length || 0} รายการ)
              </span>
              <span className="text-[10px] text-slate-500 font-medium">แก้ไขหรือลบยอดเงินได้</span>
            </div>

            {(!booking.transactions || booking.transactions.length === 0) ? (
              <div className="py-3 text-center text-xs text-slate-400 font-medium">
                ยังไม่มีประวัติการบันทึกชำระเงินสำหรับลูกค้ารายนี้
              </div>
            ) : (
              <div className="space-y-2">
                {booking.transactions.map((tx, idx) => {
                  const isEditing = editingTxId === tx.id;
                  const isDiscount = tx.note?.includes('[ส่วนลด') || tx.note?.includes('ปัดเศษ');

                  if (isEditing) {
                    return (
                      <div key={tx.id} className="p-3 bg-white rounded-xl border-2 border-emerald-500 shadow-sm space-y-2.5">
                        <div className="flex items-center justify-between text-xs font-black text-emerald-900">
                          <span>แก้ไขยอดรอบที่ {idx + 1}</span>
                          <span className="text-[10px] text-slate-400">{formatThaiDate(tx.paidAt)}</span>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">จำนวนเงิน (บาท)</label>
                            <input
                              type="number"
                              value={editAmount}
                              onChange={(e) => setEditAmount(Number(e.target.value))}
                              className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                            />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-600 block mb-1">วิธีชำระ</label>
                            <select
                              value={editMethod}
                              onChange={(e) => setEditMethod(e.target.value as PaymentMethod)}
                              className="w-full px-2.5 py-1.5 text-xs font-bold border border-slate-300 rounded-lg outline-none bg-white"
                            >
                              <option value="transfer">โอนเงิน / พร้อมเพย์</option>
                              <option value="cash">เงินสด</option>
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-slate-600 block mb-1">หมายเหตุ</label>
                          <input
                            type="text"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                            placeholder="ระบุหมายเหตุ"
                            className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-emerald-500"
                          />
                        </div>

                        <div className="flex justify-end gap-1.5 pt-1">
                          <button
                            type="button"
                            onClick={() => setEditingTxId(null)}
                            className="px-2.5 py-1 rounded-lg border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100"
                          >
                            ยกเลิก
                          </button>
                          <button
                            type="button"
                            onClick={() => handleSaveEdit(tx.id)}
                            className="px-3 py-1 rounded-lg bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 shadow-xs"
                          >
                            บันทึกการแก้ไข
                          </button>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div 
                      key={tx.id} 
                      className={`p-2.5 rounded-xl border shadow-2xs flex items-center justify-between gap-2 ${
                        isDiscount ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded">
                            รอบที่ {idx + 1}
                          </span>
                          <span className="text-xs font-black text-slate-900">
                            {isDiscount ? '🏷️ ส่วนลด/ปรับยอด' : tx.method === 'transfer' ? 'โอนเงิน / พร้อมเพย์' : 'เงินสด'}
                          </span>
                          <span className="text-[11px] text-slate-600 font-medium truncate">
                            &bull; {tx.note || 'ชำระเงิน'}
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {formatThaiDate(tx.paidAt)} {new Date(tx.paidAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                        </p>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`text-sm font-black ${isDiscount ? 'text-amber-800' : 'text-emerald-700'}`}>
                          +฿{tx.amount.toLocaleString()}
                        </span>

                        {/* Action Buttons: Edit & Delete */}
                        <div className="flex items-center gap-1 border-l border-slate-200 pl-2">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(tx)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title="แก้ไขรายการนี้"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {onDeletePaymentTransaction && (
                            <button
                              type="button"
                              onClick={() => {
                                if (window.confirm(`ยืนยันการลบรายการ ฿${tx.amount.toLocaleString()} บาท นี้หรือไม่?`)) {
                                  onDeletePaymentTransaction(booking.id, tx.id);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="ลบรายการนี้"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Form Selector Tabs: รับชำระเงิน vs ปรับลด/ส่วนลด */}
          <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setFormMode('payment')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                formMode === 'payment'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>บันทึกรับเงิน</span>
            </button>
            <button
              type="button"
              onClick={() => setFormMode('discount')}
              className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                formMode === 'discount'
                  ? 'bg-amber-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BadgePercent className="w-3.5 h-3.5" />
              <span>ปรับลด / ปัดเศษ / เงินขาด</span>
            </button>
          </div>

          {/* MODE 1: Standard Payment Form */}
          {formMode === 'payment' && (
            <form onSubmit={handleSubmitPayment} className="p-3.5 bg-slate-50/80 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                บันทึกการรับชำระเงินรอบใหม่
              </span>

              {/* Quick Item Fill Buttons */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">เลือกรายการยอดเงินด่วน:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {remainingBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectQuickItem('ชำระยอดคงเหลือทั้งหมด', remainingBalance)}
                      className="px-2.5 py-1 rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 text-[11px] font-black border border-emerald-300 transition-colors"
                    >
                      ยอดคงเหลือทั้งหมด (฿{remainingBalance.toLocaleString()})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectQuickItem('ชำระค่าห้องพักส่วนที่เหลือ', Math.min(roomBaseTotal, remainingBalance))}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Home className="w-3 h-3 text-blue-600" /> ค่าห้องพัก
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectQuickItem('ชำระค่าหมูกระทะ', 500)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <UtensilsCrossed className="w-3 h-3 text-amber-600" /> ค่าหมูกระทะ (฿500)
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSelectQuickItem('ชำระค่าที่นอนเสริม / อาหารเช้า', 300)}
                    className="px-2 py-1 rounded-lg bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Sparkles className="w-3 h-3 text-emerald-600" /> ที่นอน/อาหาร
                  </button>
                </div>
              </div>

              {/* Payment Method Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  ช่องทางการชำระเงิน <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('transfer')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      method === 'transfer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-white bg-white/60 text-slate-700 font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${method === 'transfer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <QrCode className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs block font-bold">โอนเงินผ่านธนาคาร</span>
                      <span className="text-[10px] text-slate-500">พร้อมเพย์ / สแกนคิวอาร์</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('cash')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      method === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-white bg-white/60 text-slate-700 font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${method === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Banknote className="w-3.5 h-3.5" />
                    </div>
                    <div>
                      <span className="text-xs block font-bold">ชำระเงินสด</span>
                      <span className="text-[10px] text-slate-500">จ่ายหน้าเคาน์เตอร์</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Amount & Note Inputs */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    จำนวนเงินที่รับ (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">฿</span>
                    <input
                      type="number"
                      required
                      min={1}
                      value={amount}
                      onChange={(e) => setAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 text-sm font-black text-slate-900 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    บันทึกช่วยจำ / หมายเหตุ
                  </label>
                  <input
                    type="text"
                    placeholder="เช่น ค่าหมูกระทะ, มัดจำค่าห้อง"
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-white shadow-xs font-medium"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>บันทึกการชำระเงิน ฿{amount.toLocaleString()} บาท</span>
              </button>
            </form>
          )}

          {/* MODE 2: Accounting Discount & Adjustments Form */}
          {formMode === 'discount' && (
            <form onSubmit={handleSubmitDiscount} className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3 animate-in fade-in">
              <div>
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-700" />
                  บันทึกส่วนลด / ปัดเศษเศษสตางค์ / บันทึกเงินขาดตามหลักบัญชี
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  ใช้กรณีปัดเศษลดให้ลูกค้า หรือยอดเงินขาดเล็กน้อยเพื่อตัดยอดค้างชำระ
                </p>
              </div>

              {/* Quick Discount Presets */}
              <div>
                <span className="text-[10px] text-amber-900 font-bold block mb-1">เลือกจำนวนเงินลดด่วน:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setDiscountAmount(50); setDiscountReason('ปัดเศษ 50 บาทให้ลูกค้า'); }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-950 text-xs font-black border border-amber-300 transition-colors"
                  >
                    -฿50 (ปัดเศษ)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountAmount(100); setDiscountReason('ส่วนลดพิเศษ 100 บาท'); }}
                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-amber-100 text-amber-950 text-xs font-black border border-amber-300 transition-colors"
                  >
                    -฿100 (ส่วนลดพิเศษ)
                  </button>
                  {remainingBalance > 0 && remainingBalance < 200 && (
                    <button
                      type="button"
                      onClick={() => { setDiscountAmount(remainingBalance); setDiscountReason('ตัดยอดเศษค้างชำระทั้งหมด'); }}
                      className="px-2.5 py-1 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-black border border-amber-400 transition-colors"
                    >
                      ตัดเศษค้างทั้งหมด (-฿{remainingBalance.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">
                    จำนวนเงินที่ลด / ปรับยอด (บาท) <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-700 font-black text-sm">฿</span>
                    <input
                      type="number"
                      required
                      min={1}
                      max={grandTotal}
                      value={discountAmount}
                      onChange={(e) => setDiscountAmount(Number(e.target.value))}
                      className="w-full pl-7 pr-3 py-2 text-sm font-black text-amber-950 border border-amber-300 rounded-xl focus:border-amber-600 outline-none bg-white shadow-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-amber-950 mb-1">
                    เหตุผล / รายละเอียดการปรับลด
                  </label>
                  <input
                    type="text"
                    value={discountReason}
                    onChange={(e) => setDiscountReason(e.target.value)}
                    placeholder="เช่น ปัดเศษให้ลูกค้า, ส่วนลดแนะนำ"
                    className="w-full px-3 py-2 text-xs border border-amber-300 rounded-xl focus:border-amber-600 outline-none bg-white shadow-xs font-medium"
                  />
                </div>
              </div>

              {/* Submit Discount Button */}
              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all"
              >
                <Percent className="w-4 h-4" />
                <span>บันทึกส่วนลด/ปรับยอด ฿{discountAmount.toLocaleString()} บาท</span>
              </button>
            </form>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>
    </div>
  );
};
