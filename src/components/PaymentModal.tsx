import React, { useState, useEffect, useRef } from 'react';
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
  Tag, 
  Percent, 
  BadgePercent,
  Receipt,
  FileText,
  UploadCloud,
  Building2,
  Calculator,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { Booking, PaymentMethod, PaymentTransaction, ResortSettings } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';
import { ConfirmDialogModal } from './ConfirmDialogModal';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  settings?: ResortSettings;
  onRecordPayment: (bookingId: string, transaction: PaymentTransaction) => void;
  onUpdatePaymentTransaction?: (bookingId: string, transactionId: string, updated: Partial<PaymentTransaction>) => void;
  onDeletePaymentTransaction?: (bookingId: string, transactionId: string) => void;
  onOpenReceipt?: (booking: Booking) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  booking,
  settings,
  onRecordPayment,
  onUpdatePaymentTransaction,
  onDeletePaymentTransaction,
  onOpenReceipt,
}) => {
  useLockBodyScroll(isOpen);

  const [activeTab, setActiveTab] = useState<'payment' | 'discount' | 'history'>('payment');
  const [method, setMethod] = useState<PaymentMethod>('transfer');
  const [deleteConfirmTx, setDeleteConfirmTx] = useState<PaymentTransaction | null>(null);
  const [note, setNote] = useState('');
  const [amount, setAmount] = useState<number>(0);
  
  // Bank Account Selection
  const [selectedBank, setSelectedBank] = useState<string>('กสิกรไทย (KBANK) 123-4-56789-0');
  const [showQrModal, setShowQrModal] = useState<boolean>(false);

  // Cash Change Calculator State
  const [cashReceived, setCashReceived] = useState<number | ''>('');
  
  // Date & Time Picker
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [paymentTime, setPaymentTime] = useState<string>(
    new Date().toTimeString().slice(0, 5)
  );

  // Slip Attachment State
  const [slipImage, setSlipImage] = useState<string | null>(null);
  const [previewSlipUrl, setPreviewSlipUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Itemized breakdown collapse state
  const [isBreakdownOpen, setIsBreakdownOpen] = useState<boolean>(false);

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
  const totalPaid = booking?.paidAmount || 0;
  const remainingBalance = booking ? Math.max(0, grandTotal - totalPaid) : 0;
  const isOverpaid = totalPaid > grandTotal;
  const overpaidAmount = isOverpaid ? totalPaid - grandTotal : 0;
  const paymentPercentage = grandTotal > 0 ? Math.min(100, Math.round((totalPaid / grandTotal) * 100)) : 0;

  // Initialize amount when modal opens or booking changes
  useEffect(() => {
    if (booking) {
      const roomBase = booking.roomPrice * booking.totalNights;
      const addOns = booking.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
      const total = booking.totalAmount || (roomBase + addOns);
      const rem = Math.max(0, total - booking.paidAmount);
      
      setAmount(rem > 0 ? rem : total);
      setCashReceived('');
      setNote('');
      setSlipImage(null);
      setActiveTab('payment');
      setEditingTxId(null);
      setPaymentDate(new Date().toISOString().split('T')[0]);
      setPaymentTime(new Date().toTimeString().slice(0, 5));

      if (settings?.bankName && settings?.bankAccountNo) {
        setSelectedBank(`${settings.bankName} ${settings.bankAccountNo}`);
      }
    }
  }, [booking, isOpen, settings]);

  if (!isOpen || !booking) return null;

  // Quick Preset Handlers
  const handleSelectQuickItem = (itemName: string, defaultPrice: number) => {
    setAmount(defaultPrice);
    setNote(itemName);
  };

  // Slip Upload Handler
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Submit Payment Record
  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (amount <= 0) return;

    // Combine payment date and time to ISO string
    const paidAtISO = new Date(`${paymentDate}T${paymentTime}:00`).toISOString();

    const cashRecNum = Number(cashReceived) || 0;
    const cashChgNum = method === 'cash' && cashRecNum >= amount ? cashRecNum - amount : 0;

    const newTx: PaymentTransaction = {
      id: 'tx-' + Date.now(),
      amount: Number(amount),
      method,
      bankAccount: method === 'transfer' ? selectedBank : undefined,
      slipImageUrl: slipImage || undefined,
      note: note.trim() || (method === 'transfer' ? `โอนเงินเข้า ${selectedBank}` : 'ชำระเงินสดหน้าเคาน์เตอร์'),
      paidAt: paidAtISO,
      cashReceived: method === 'cash' && cashRecNum > 0 ? cashRecNum : undefined,
      cashChange: method === 'cash' && cashChgNum > 0 ? cashChgNum : undefined,
      recordedBy: 'เจ้าหน้าที่ฟร้อนท์ (Frontdesk)',
    };

    onRecordPayment(booking.id, newTx);
    setNote('');
    setSlipImage(null);
    setCashReceived('');
  };

  // Submit Discount / Accounting Adjustment
  const handleSubmitDiscount = (e: React.FormEvent) => {
    e.preventDefault();
    if (discountAmount <= 0) return;

    const discountTx: PaymentTransaction = {
      id: 'tx-disc-' + Date.now(),
      amount: Number(discountAmount),
      method: 'cash',
      note: `[ส่วนลด/ปรับยอด] ${discountReason.trim() || 'ปัดเศษให้ลูกค้า'}`,
      paidAt: new Date().toISOString(),
      recordedBy: 'เจ้าหน้าที่ฟร้อนท์ (Frontdesk)',
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

  const getMethodBadge = (m: PaymentMethod) => {
    switch (m) {
      case 'transfer':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 text-[11px] font-bold border border-blue-200">
            <QrCode className="w-3 h-3 text-blue-600" /> โอนเงิน/สลิป
          </span>
        );
      case 'cash':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[11px] font-bold border border-emerald-200">
            <Banknote className="w-3 h-3 text-emerald-600" /> เงินสด
          </span>
        );
      case 'qr':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[11px] font-bold border border-purple-200">
            <QrCode className="w-3 h-3 text-purple-600" /> QR พร้อมเพย์
          </span>
        );
      case 'credit_card':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[11px] font-bold border border-indigo-200">
            <CreditCard className="w-3 h-3 text-indigo-600" /> บัตรเครดิต
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-bold border border-slate-200">
            อื่นๆ
          </span>
        );
    }
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-900 w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col font-['Prompt'] overscroll-contain"
      >
        
        {/* FLOWACCOUNT STANDARD HEADER */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30 shadow-inner">
              <CreditCard className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-black tracking-tight">บันทึกการรับชำระเงิน (Receive Payment)</h3>
                <span className="text-[10px] font-extrabold bg-slate-800 text-slate-300 px-2 py-0.5 rounded border border-slate-700">
                  {booking.bookingCode}
                </span>
              </div>
              <p className="text-slate-400 text-xs font-medium mt-0.5">
                ห้อง {booking.roomNumber} ({booking.roomType}) &bull; คุณ{booking.guestName} ({booking.guestPhone})
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenReceipt && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceipt(booking);
                }}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-xs font-bold transition-all border border-slate-700"
                title="เปิดใบเสร็จรับเงินฉบับเต็ม"
              >
                <Receipt className="w-3.5 h-3.5 text-amber-400" />
                <span>พิมพ์ใบเสร็จ</span>
              </button>
            )}
            <button 
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* CONTENT BODY */}
        <div className="p-4 sm:p-5 overflow-y-auto no-scrollbar space-y-4 flex-1 overscroll-contain">
          
          {/* FLOWACCOUNT 4-METRIC FINANCIAL OVERVIEW */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">ยอดรวมเอกสาร</span>
              <span className="text-base sm:text-lg font-black text-slate-900 mt-0.5 block">
                ฿{grandTotal.toLocaleString()}
              </span>
              <span className="text-[10px] text-slate-400 font-medium">{booking.totalNights} คืน + บริการเสริม</span>
            </div>

            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200">
              <span className="text-[10px] text-emerald-800 font-bold block uppercase tracking-wider">ชำระแล้ว</span>
              <span className="text-base sm:text-lg font-black text-emerald-900 mt-0.5 block">
                ฿{totalPaid.toLocaleString()}
              </span>
              <span className="text-[10px] text-emerald-700 font-bold">
                {paymentPercentage}% ของยอดรวม
              </span>
            </div>

            <div className={`p-3 rounded-2xl border ${
              remainingBalance > 0 
                ? 'bg-rose-50 border-rose-200 text-rose-950' 
                : 'bg-emerald-50/50 border-emerald-200 text-emerald-900'
            }`}>
              <span className={`text-[10px] font-bold block uppercase tracking-wider ${
                remainingBalance > 0 ? 'text-rose-800' : 'text-emerald-800'
              }`}>
                {remainingBalance > 0 ? 'ยอดค้างชำระ' : isOverpaid ? 'ชำระเกิน' : 'ชำระครบถ้วน'}
              </span>
              <span className="text-base sm:text-lg font-black mt-0.5 block">
                ฿{(isOverpaid ? overpaidAmount : remainingBalance).toLocaleString()}
              </span>
              <span className={`text-[10px] font-bold ${
                remainingBalance > 0 ? 'text-rose-600' : 'text-emerald-700'
              }`}>
                {remainingBalance > 0 ? 'รอเก็บเงินส่วนที่เหลือ' : 'ปิดยอดเรียบร้อย'}
              </span>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between">
              <span className="text-[10px] text-slate-500 font-bold block uppercase tracking-wider">สถานะเอกสาร</span>
              <div>
                {totalPaid >= grandTotal ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-xs font-black shadow-xs">
                    <CheckCircle2 className="w-3.5 h-3.5" /> ชำระครบแล้ว
                  </span>
                ) : totalPaid > 0 ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-500 text-white text-xs font-black shadow-xs">
                    <Clock className="w-3.5 h-3.5" /> มัดจำแล้ว ({paymentPercentage}%)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-black shadow-xs">
                    <AlertCircle className="w-3.5 h-3.5" /> ยังไม่ชำระ
                  </span>
                )}
              </div>
              <div className="w-full bg-slate-200 h-1.5 rounded-full overflow-hidden mt-1">
                <div 
                  className={`h-full transition-all duration-500 ${
                    paymentPercentage === 100 ? 'bg-emerald-600' : 'bg-amber-500'
                  }`}
                  style={{ width: `${paymentPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* ITEMIZED BILLING STATEMENT (COLLAPSIBLE LIKE FLOWACCOUNT) */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50/60 transition-all">
            <button
              type="button"
              onClick={() => setIsBreakdownOpen(!isBreakdownOpen)}
              className="w-full p-3 flex items-center justify-between hover:bg-slate-100/80 transition-colors text-left"
            >
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-slate-700" />
                <span className="text-xs font-extrabold text-slate-900">
                  ตารางสรุปรายการเรียกเก็บเงิน (Itemized Invoice Breakdown)
                </span>
                <span className="text-[10px] text-slate-500 font-bold bg-white px-2 py-0.5 rounded-full border border-slate-200">
                  {1 + (booking.addOns?.length || 0)} รายการ
                </span>
              </div>
              <div className="flex items-center gap-1 text-slate-400">
                <span className="text-[11px] font-bold text-slate-600 hidden sm:inline">
                  {isBreakdownOpen ? 'ย่อตาราง' : 'ดูรายละเอียด'}
                </span>
                {isBreakdownOpen ? <ChevronUp className="w-4 h-4 text-slate-700" /> : <ChevronDown className="w-4 h-4 text-slate-700" />}
              </div>
            </button>

            {isBreakdownOpen && (
              <div className="p-3 pt-0 border-t border-slate-200 space-y-2 bg-white animate-in fade-in text-xs">
                <div className="space-y-1.5 pt-2">
                  <div className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-100">
                    <span className="font-medium">
                      🛖 ค่าห้องพักห้อง {booking.roomNumber} ({booking.roomType}) &bull; ฿{booking.roomPrice.toLocaleString()} &times; {booking.totalNights} คืน
                    </span>
                    <span className="font-bold text-slate-900">฿{roomBaseTotal.toLocaleString()}</span>
                  </div>

                  {booking.addOns && booking.addOns.length > 0 && booking.addOns.map((add, i) => (
                    <div key={i} className="flex items-center justify-between text-slate-700 py-1 border-b border-slate-100">
                      <span className="font-medium">
                        🍲 {add.name} &bull; ฿{add.price.toLocaleString()} &times; {add.quantity}
                      </span>
                      <span className="font-bold text-slate-900">฿{(add.price * add.quantity).toLocaleString()}</span>
                    </div>
                  ))}

                  <div className="flex items-center justify-between font-black text-slate-900 pt-1 text-xs sm:text-sm">
                    <span>ยอดสุทธิรวมทั้งสิ้น (Grand Total)</span>
                    <span className="text-emerald-700">฿{grandTotal.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* FLOWACCOUNT TABS */}
          <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('payment')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'payment'
                  ? 'bg-emerald-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>1. บันทึกรับชำระเงิน</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('discount')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'discount'
                  ? 'bg-amber-600 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <BadgePercent className="w-3.5 h-3.5" />
              <span>2. ส่วนลด / ปรับยอด</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 rounded-xl transition-all flex items-center justify-center gap-1.5 ${
                activeTab === 'history'
                  ? 'bg-slate-900 text-white font-black shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>3. ประวัติรับเงิน ({booking.transactions?.length || 0})</span>
            </button>
          </div>

          {/* TAB 1: FLOWACCOUNT-GRADE RECEIVE PAYMENT FORM */}
          {activeTab === 'payment' && (
            <form onSubmit={handleSubmitPayment} className="p-4 bg-slate-50/90 rounded-2xl border border-slate-200 space-y-3.5 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <PlusCircle className="w-4 h-4 text-emerald-600" />
                  บันทึกการรับชำระเงินงวดใหม่ (Record New Payment)
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-100 px-2 py-0.5 rounded-full">
                  FlowAccount UX
                </span>
              </div>

              {/* Quick Amount Calculation Presets */}
              <div>
                <span className="text-[10px] text-slate-500 font-bold block mb-1">ปุ่มลัดระบุยอดเงินด่วน:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  {remainingBalance > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectQuickItem('ชำระยอดคงเหลือทั้งหมด', remainingBalance)}
                      className="px-2.5 py-1 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-black shadow-xs transition-colors flex items-center gap-1"
                    >
                      <span>💰 ชำระยอดค้างทั้งหมด ฿{remainingBalance.toLocaleString()}</span>
                    </button>
                  )}
                  {grandTotal > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectQuickItem('มัดจำ 50% ค่าที่พัก', Math.round(grandTotal * 0.5))}
                      className="px-2.5 py-1 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-900 text-[11px] font-bold border border-blue-200 transition-colors"
                    >
                      🛡️ มัดจำ 50% (฿{Math.round(grandTotal * 0.5).toLocaleString()})
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSelectQuickItem('ชำระค่าห้องพัก', Math.min(roomBaseTotal, remainingBalance || roomBaseTotal))}
                    className="px-2 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                  >
                    <Home className="w-3 h-3 text-blue-600" /> ค่าห้องพัก
                  </button>
                  {addOnsTotal > 0 && (
                    <button
                      type="button"
                      onClick={() => handleSelectQuickItem('ชำระค่าหมูกระทะและบริการเสริม', addOnsTotal)}
                      className="px-2 py-1 rounded-xl bg-white hover:bg-slate-100 text-slate-700 text-[10px] font-bold border border-slate-200 flex items-center gap-1 transition-colors"
                    >
                      <UtensilsCrossed className="w-3 h-3 text-amber-600" /> ค่าอาหาร/เสริม (฿{addOnsTotal.toLocaleString()})
                    </button>
                  )}
                </div>
              </div>

              {/* Payment Methods (Multi-channel selection) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1.5">
                  ช่องทางการรับชำระเงิน (Payment Channel) <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMethod('transfer')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      method === 'transfer'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-white bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${method === 'transfer' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs block font-bold truncate">โอนเงินธนาคาร</span>
                      <span className="text-[9px] text-slate-500 block truncate">พร้อมเพย์ / สลิป</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('cash')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      method === 'cash'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-white bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${method === 'cash' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <Banknote className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs block font-bold truncate">เงินสด (Cash)</span>
                      <span className="text-[9px] text-slate-500 block truncate">มีคำนวณเงินทอน</span>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setMethod('credit_card')}
                    className={`p-2.5 rounded-xl border text-left flex items-center gap-2 transition-all ${
                      method === 'credit_card'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-2 ring-emerald-500/20 font-bold shadow-xs'
                        : 'border-slate-200 hover:bg-white bg-white text-slate-700 font-medium'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${method === 'credit_card' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                      <CreditCard className="w-3.5 h-3.5" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-xs block font-bold truncate">บัตรเครดิต</span>
                      <span className="text-[9px] text-slate-500 block truncate">EDC / บัตร</span>
                    </div>
                  </button>
                </div>
              </div>

              {/* DYNAMIC SUB-SECTION BASED ON PAYMENT METHOD */}
              {/* 1. If Transfer: Bank Account & Live PromptPay QR Button */}
              {method === 'transfer' && (
                <div className="p-3 bg-white rounded-xl border border-blue-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <label className="font-bold text-slate-800 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-blue-600" />
                      บัญชีธนาคารผู้รับเงินของรีสอร์ท:
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowQrModal(true)}
                      className="px-2.5 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs transition-all"
                    >
                      <QrCode className="w-3 h-3" />
                      <span>เปิด QR Code พร้อมเพย์</span>
                    </button>
                  </div>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl outline-none focus:border-blue-500 bg-slate-50"
                  >
                    <option value={`${settings?.bankName || 'กสิกรไทย (KBANK)'} ${settings?.bankAccountNo || '123-4-56789-0'}`}>
                      {settings?.bankName || 'กสิกรไทย (KBANK)'} - {settings?.bankAccountNo || '123-4-56789-0'} ({settings?.bankAccountName || 'สวอนฮิลล์ รีสอร์ท'})
                    </option>
                    <option value="ไทยพาณิชย์ (SCB) 987-6-54321-0">
                      ไทยพาณิชย์ (SCB) - 987-6-54321-0 (สวอนฮิลล์ รีสอร์ท)
                    </option>
                    <option value={`พร้อมเพย์ (PromptPay) ${settings?.promptPayNo || '081-234-5678'}`}>
                      พร้อมเพย์ (PromptPay) - {settings?.promptPayNo || '081-234-5678'}
                    </option>
                  </select>
                </div>
              )}

              {/* 2. If Cash: Smart Cash Change Calculator */}
              {method === 'cash' && (
                <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-200 space-y-2.5 text-xs animate-in fade-in">
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-emerald-950 flex items-center gap-1.5">
                      <Calculator className="w-3.5 h-3.5 text-emerald-700" />
                      ระบบคำนวณเงินทอนอัตโนมัติ (Cash Change Calculator)
                    </span>
                    <span className="text-[10px] text-emerald-800 font-bold">รับเงินสด</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-800 mb-1">
                        รับเงินสดจากลูกค้ามา (บาท):
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">฿</span>
                        <input
                          type="number"
                          placeholder="เช่น 1000, 2000"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full pl-7 pr-3 py-2 text-sm font-black border border-slate-300 rounded-xl outline-none focus:border-emerald-500 bg-white"
                        />
                      </div>
                      {/* Cash quick presets */}
                      <div className="flex items-center gap-1 mt-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setCashReceived(amount)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-100"
                        >
                          พอดี (฿{amount.toLocaleString()})
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(1000)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-100"
                        >
                          แบงก์ 1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(2000)}
                          className="px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-700 text-[10px] font-bold hover:bg-slate-100"
                        >
                          แบงก์ 1,000 (2 ใบ)
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-xl border border-emerald-300 flex flex-col justify-between">
                      <span className="text-[10px] font-bold text-slate-500 block">เงินทอนที่ต้องคืนลูกค้า:</span>
                      <div className="text-right">
                        {typeof cashReceived === 'number' && cashReceived >= amount ? (
                          <div>
                            <span className="text-lg sm:text-xl font-black text-emerald-800">
                              ฿{(cashReceived - amount).toLocaleString()} บาท
                            </span>
                            <span className="text-[10px] text-emerald-700 block font-bold">✓ ทอนเงินถูกต้อง</span>
                          </div>
                        ) : typeof cashReceived === 'number' && cashReceived > 0 ? (
                          <div>
                            <span className="text-sm font-black text-rose-600">
                              เงินสดไม่พอ (ขาด ฿{(amount - cashReceived).toLocaleString()})
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-bold text-slate-400">กรอกยอดเงินสดที่รับมา</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount, Date, Time Row */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    จำนวนเงินที่รับชำระ (บาท) <span className="text-red-500">*</span>
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
                    วันที่รับเงิน
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentDate}
                    onChange={(e) => setPaymentDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-white shadow-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    เวลาที่รับเงิน
                  </label>
                  <input
                    type="time"
                    required
                    value={paymentTime}
                    onChange={(e) => setPaymentTime(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-white shadow-xs"
                  />
                </div>
              </div>

              {/* Slip Attachment Upload (FlowAccount Standard) */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  แนบหลักฐาน / สลิปโอนเงิน (Slip Attachment)
                </label>
                <div className="flex items-center gap-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-dashed border-slate-300 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <UploadCloud className="w-4 h-4 text-emerald-600" />
                    <span>{slipImage ? 'เปลี่ยนรูปสลิป' : 'อัปโหลด / ถ่ายรูปสลิป'}</span>
                  </button>

                  {slipImage && (
                    <div className="flex items-center gap-2">
                      <div 
                        onClick={() => setPreviewSlipUrl(slipImage)}
                        className="w-10 h-10 rounded-xl border-2 border-emerald-500 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity shadow-xs"
                        title="คลิกเพื่อดูสลิปรูปใหญ่"
                      >
                        <img src={slipImage} alt="สลิปโอนเงิน" className="w-full h-full object-cover" />
                      </div>
                      <button
                        type="button"
                        onClick={() => setSlipImage(null)}
                        className="text-slate-400 hover:text-rose-600 p-1"
                        title="ลบรูปสลิป"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Note / Memo */}
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1">
                  บันทึกช่วยจำ / หมายเหตุการรับเงิน
                </label>
                <input
                  type="text"
                  placeholder="เช่น มัดจำ 50% ผ่านไลน์, ชำระเงินสดหน้าฟร้อนท์, ค่าหมูกระทะ 1 ชุด"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-white shadow-xs font-medium"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-emerald-600/30 flex items-center justify-center gap-2 transition-all mt-2"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>บันทึกการรับชำระเงิน ฿{amount.toLocaleString()} บาท</span>
              </button>
            </form>
          )}

          {/* TAB 2: ACCOUNTING DISCOUNT & ADJUSTMENTS FORM */}
          {activeTab === 'discount' && (
            <form onSubmit={handleSubmitDiscount} className="p-4 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-3.5 animate-in fade-in">
              <div>
                <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                  <Tag className="w-4 h-4 text-amber-700" />
                  บันทึกส่วนลด / ปัดเศษเศษสตางค์ / บันทึกเงินขาดตามหลักบัญชี
                </span>
                <p className="text-[11px] text-amber-800 mt-0.5">
                  ใช้ในกรณีปัดเศษลดให้ลูกค้า ยอดเงินขาด หรือส่วนลดพิเศษเพื่อหักลบยอดค้างชำระ
                </p>
              </div>

              {/* Quick Discount Presets */}
              <div>
                <span className="text-[10px] text-amber-900 font-bold block mb-1">เลือกจำนวนเงินลดด่วน:</span>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => { setDiscountAmount(50); setDiscountReason('ปัดเศษ 50 บาทให้ลูกค้า'); }}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-950 text-xs font-black border border-amber-300 transition-colors"
                  >
                    -฿50 (ปัดเศษ)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setDiscountAmount(100); setDiscountReason('ส่วนลดพิเศษ 100 บาท'); }}
                    className="px-2.5 py-1 rounded-xl bg-white hover:bg-amber-100 text-amber-950 text-xs font-black border border-amber-300 transition-colors"
                  >
                    -฿100 (ส่วนลดพิเศษ)
                  </button>
                  {remainingBalance > 0 && remainingBalance < 500 && (
                    <button
                      type="button"
                      onClick={() => { setDiscountAmount(remainingBalance); setDiscountReason('ตัดยอดเศษค้างชำระทั้งหมด'); }}
                      className="px-2.5 py-1 rounded-xl bg-amber-200 hover:bg-amber-300 text-amber-950 text-xs font-black border border-amber-400 transition-colors"
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
                className="w-full py-3 rounded-2xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-extrabold text-xs sm:text-sm shadow-md shadow-amber-600/30 flex items-center justify-center gap-1.5 transition-all"
              >
                <Percent className="w-4 h-4" />
                <span>บันทึกส่วนลด/ปรับยอด ฿{discountAmount.toLocaleString()} บาท</span>
              </button>
            </form>
          )}

          {/* TAB 3: TRANSACTION HISTORY & LEDGER (FLOWACCOUNT STYLE) */}
          {activeTab === 'history' && (
            <div className="bg-slate-50/90 p-4 rounded-2xl border border-slate-200 space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-emerald-600" />
                  ประวัติการรับชำระเงินทุกงวด & ปรับปรุงยอด ({booking.transactions?.length || 0} รายการ)
                </span>
                <span className="text-[10px] text-slate-500 font-medium">แก้ไขหรือลบยอดเงินได้</span>
              </div>

              {(!booking.transactions || booking.transactions.length === 0) ? (
                <div className="py-6 text-center text-xs text-slate-400 font-medium bg-white rounded-xl border border-slate-200">
                  ยังไม่มีประวัติการบันทึกชำระเงินสำหรับลูกค้ารายนี้
                </div>
              ) : (
                <div className="space-y-2">
                  {booking.transactions.map((tx, idx) => {
                    const isEditing = editingTxId === tx.id;
                    const isDiscount = tx.note?.includes('[ส่วนลด') || tx.note?.includes('ปัดเศษ');

                    if (isEditing) {
                      return (
                        <div key={tx.id} className="p-3.5 bg-white rounded-2xl border-2 border-emerald-500 shadow-sm space-y-2.5">
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
                                <option value="credit_card">บัตรเครดิต</option>
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
                        className={`p-3 rounded-2xl border shadow-2xs flex items-center justify-between gap-3 ${
                          isDiscount ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
                        }`}
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-[10px] font-black text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                              งวดที่ {idx + 1}
                            </span>
                            {getMethodBadge(tx.method)}
                            <span className="text-xs font-extrabold text-slate-900 truncate">
                              {tx.note || 'ชำระเงิน'}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[10px] text-slate-400 mt-1 flex-wrap font-medium">
                            <span>
                              {formatThaiDate(tx.paidAt)} เวลา {new Date(tx.paidAt).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })} น.
                            </span>
                            {tx.bankAccount && (
                              <span>&bull; {tx.bankAccount}</span>
                            )}
                            {tx.cashReceived && tx.cashChange !== undefined && (
                              <span className="text-emerald-700 font-bold">
                                (รับมา ฿{tx.cashReceived.toLocaleString()} &bull; ทอน ฿{tx.cashChange.toLocaleString()})
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-2.5 shrink-0">
                          {tx.slipImageUrl && (
                            <button
                              type="button"
                              onClick={() => setPreviewSlipUrl(tx.slipImageUrl || null)}
                              className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-100 hover:text-emerald-700 flex items-center justify-center text-slate-600 transition-colors border border-slate-200"
                              title="ดูรูปสลิป"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          )}

                          <span className={`text-sm sm:text-base font-black ${isDiscount ? 'text-amber-800' : 'text-emerald-700'}`}>
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
                                onClick={() => setDeleteConfirmTx(tx)}
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
          )}

        </div>

        {/* MODAL FOOTER */}
        <div className="p-3.5 px-5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            ค้างชำระสุทธิ: <span className="font-extrabold text-slate-900">฿{remainingBalance.toLocaleString()} บาท</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-extrabold text-xs transition-colors"
          >
            ปิดหน้าต่าง
          </button>
        </div>

      </div>

      {/* PROMPTPAY QR MODAL POPOVER */}
      {showQrModal && (
        <div 
          onClick={() => setShowQrModal(false)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl p-6 shadow-2xl border border-slate-200 text-center max-w-xs w-full animate-in zoom-in-95 space-y-4"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <QrCode className="w-4 h-4 text-blue-600" /> สแกนจ่ายผ่านพร้อมเพย์
              </span>
              <button 
                onClick={() => setShowQrModal(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 flex flex-col items-center justify-center space-y-2">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=PROMPTPAY_${settings?.promptPayNo || '0812345678'}_AMOUNT_${amount}`}
                alt="PromptPay QR Code"
                className="w-44 h-44 rounded-xl border border-slate-300 shadow-sm"
              />
              <span className="text-base font-black text-slate-900 block mt-1">
                ฿{amount.toLocaleString()} บาท
              </span>
              <p className="text-[11px] text-slate-500 font-bold">
                {settings?.bankAccountName || 'สวอนฮิลล์ รีสอร์ท'}
              </p>
              <p className="text-[10px] text-slate-400 font-medium">
                พร้อมเพย์: {settings?.promptPayNo || '081-234-5678'}
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowQrModal(false)}
              className="w-full py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs"
            >
              ปิด QR Code
            </button>
          </div>
        </div>
      )}

      {/* SLIP LIGHTBOX MODAL */}
      {previewSlipUrl && (
        <div 
          onClick={() => setPreviewSlipUrl(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl overflow-hidden shadow-2xl max-w-sm sm:max-w-md w-full animate-in zoom-in-95"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <span className="text-xs font-black flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-emerald-400" /> ตรวจสอบสลิปโอนเงิน
              </span>
              <button 
                onClick={() => setPreviewSlipUrl(null)}
                className="w-7 h-7 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="p-4 bg-slate-100 flex justify-center max-h-[70vh] overflow-y-auto">
              <img src={previewSlipUrl} alt="สลิปโอนเงิน" className="max-w-full h-auto rounded-xl shadow-md border border-slate-300" />
            </div>
            <div className="p-3 bg-white border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewSlipUrl(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                ปิดภาพสลิป
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Transaction Confirmation Modal */}
      {deleteConfirmTx && (
        <ConfirmDialogModal
          isOpen={!!deleteConfirmTx}
          onClose={() => setDeleteConfirmTx(null)}
          onConfirm={() => {
            if (booking && onDeletePaymentTransaction) {
              onDeletePaymentTransaction(booking.id, deleteConfirmTx.id);
            }
          }}
          title="ยืนยันการลบรายการชำระเงิน"
          description={`คุณต้องการลบรายการรับเงิน ฿${deleteConfirmTx.amount.toLocaleString()} บาท (${deleteConfirmTx.note || 'รายการชำระเงิน'}) ออกจากระบบใช่หรือไม่?`}
          confirmText="ยืนยันลบรายการ"
          type="danger"
        />
      )}

    </div>
  );
};
