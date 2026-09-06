import React, { useState, useRef, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Phone, 
  Calendar, 
  Home, 
  CreditCard, 
  UtensilsCrossed, 
  RotateCcw, 
  Check, 
  FileText, 
  Plus, 
  Copy, 
  Users, 
  CheckCheck,
  LayoutGrid
} from 'lucide-react';
import type { Room, Booking, AddOnItem } from '../types/pms';
import { formatThaiDate, formatLocalDate, shiftDateStr } from '../utils/dateUtils';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { 
  parseThaiBookingText, 
  createBookingsFromIntent, 
  type ParsedBookingIntent 
} from '../services/aiBookingService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings: Booking[];
  onAddBooking: (newBookings: Booking | Booking[]) => void;
  onOpenNewBookingWithPrefill?: (
    roomId?: string, 
    checkIn?: string, 
    checkOut?: string, 
    guestName?: string, 
    guestPhone?: string
  ) => void;
  onOpenReceipt?: (booking: Booking) => void;
}

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings,
  onAddBooking,
  onOpenNewBookingWithPrefill,
  onOpenReceipt,
}) => {
  useLockBodyScroll(isOpen);

  // Active Tab: 'form' (Quick Form with clear fields) or 'bullet' (Bullet Point template / LINE chat paste)
  const [activeTab, setActiveTab] = useState<'form' | 'bullet'>('form');

  // Dates
  const todayStr = useMemo(() => formatLocalDate(new Date()), []);
  const tomorrowStr = useMemo(() => shiftDateStr(todayStr, 1), [todayStr]);

  // --- FORM MODE STATE ---
  const [formSelectedRoomNumbers, setFormSelectedRoomNumbers] = useState<string[]>(['S1']);
  const [formGuestName, setFormGuestName] = useState('');
  const [formGuestPhone, setFormGuestPhone] = useState('');
  const [formCheckInDate, setFormCheckInDate] = useState(todayStr);
  const [formCheckOutDate, setFormCheckOutDate] = useState(tomorrowStr);
  const [formPaymentStatus, setFormPaymentStatus] = useState<'deposit' | 'paid' | 'pending'>('deposit');
  const [formExtraBeds, setFormExtraBeds] = useState(0);
  const [formMookataLarge, setFormMookataLarge] = useState(0);
  const [formMookataSmall, setFormMookataSmall] = useState(0);
  const [formBreakfast, setFormBreakfast] = useState(0);

  // --- BULLET / TEXT MODE STATE ---
  const [textInput, setTextInput] = useState('');
  const [parsedResult, setParsedResult] = useState<ParsedBookingIntent | null>(null);
  const [textFeedbackMessage, setTextFeedbackMessage] = useState<string | null>(null);
  const [isProcessingText, setIsProcessingText] = useState(false);
  const [copyToast, setCopyToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // --- SAVED SUCCESS STATE ---
  const [lastCreatedBookings, setLastCreatedBookings] = useState<Booking[] | null>(null);

  // Reset when modal is reopened
  useEffect(() => {
    if (isOpen) {
      setLastCreatedBookings(null);
      setTextFeedbackMessage(null);
      setParsedResult(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Active bookings filter (exclude cancelled & checked_out)
  const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out');

  // Helper to check room occupancy for a specific room and date range
  const checkRoomOccupied = (roomNum: string, inDate: string, outDate: string) => {
    return activeBookings.some(b => {
      if (b.roomNumber !== roomNum) return false;
      return inDate < b.checkOutDate && outDate > b.checkInDate;
    });
  };

  // Calculate nights for form
  const calculateNights = (inDate: string, outDate: string) => {
    const d1 = new Date(inDate + 'T12:00:00').getTime();
    const d2 = new Date(outDate + 'T12:00:00').getTime();
    return Math.max(1, Math.round((d2 - d1) / (1000 * 60 * 60 * 24)));
  };

  const formTotalNights = calculateNights(formCheckInDate, formCheckOutDate);

  // Calculate pricing for Form mode
  const formSelectedRooms = rooms.filter(r => formSelectedRoomNumbers.includes(r.roomNumber));
  const formRoomRateTotal = formSelectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0) || (formSelectedRoomNumbers.length * 1200);
  const formAddOnsTotal = (formMookataLarge * 500) + (formMookataSmall * 350) + (formExtraBeds * 300) + (formBreakfast * 60);
  const formGrandTotal = (formRoomRateTotal * formTotalNights) + formAddOnsTotal;
  const formDepositAmount = formPaymentStatus === 'paid' 
    ? formGrandTotal 
    : (formPaymentStatus === 'deposit' ? Math.round(formGrandTotal * 0.5) : 0);

  // Conflict list in Form mode
  const formConflictedRooms = formSelectedRoomNumbers.filter(rNum => 
    checkRoomOccupied(rNum, formCheckInDate, formCheckOutDate)
  );

  // Room toggle in Form mode
  const handleToggleRoom = (rNum: string) => {
    if (formSelectedRoomNumbers.includes(rNum)) {
      if (formSelectedRoomNumbers.length > 1) {
        setFormSelectedRoomNumbers(formSelectedRoomNumbers.filter(n => n !== rNum));
      }
    } else {
      setFormSelectedRoomNumbers([...formSelectedRoomNumbers, rNum]);
    }
  };

  // Adjust nights stepper in Form mode
  const handleAdjustNights = (delta: number) => {
    const current = formTotalNights;
    const next = Math.max(1, current + delta);
    setFormCheckOutDate(shiftDateStr(formCheckInDate, next));
  };

  // Save Booking directly from Form Mode
  const handleSaveFromForm = () => {
    if (formSelectedRoomNumbers.length === 0) return;

    const addOnsList: AddOnItem[] = [];
    if (formMookataLarge > 0) {
      addOnsList.push({
        id: 'ml-' + Date.now(),
        name: `หมูกระทะชุดใหญ่ (${formMookataLarge} ชุด)`,
        category: 'mookata_large',
        price: 500,
        quantity: formMookataLarge,
        createdAt: new Date().toISOString()
      });
    }
    if (formMookataSmall > 0) {
      addOnsList.push({
        id: 'ms-' + Date.now(),
        name: `หมูกระทะชุดเล็ก (${formMookataSmall} ชุด)`,
        category: 'mookata_small',
        price: 350,
        quantity: formMookataSmall,
        createdAt: new Date().toISOString()
      });
    }
    if (formExtraBeds > 0) {
      addOnsList.push({
        id: 'eb-' + Date.now(),
        name: `ที่นอนเสริม (${formExtraBeds} ท่าน)`,
        category: 'bed',
        price: 300,
        quantity: formExtraBeds,
        createdAt: new Date().toISOString()
      });
    }
    if (formBreakfast > 0) {
      addOnsList.push({
        id: 'bf-' + Date.now(),
        name: `อาหารเช้า (${formBreakfast} ท่าน)`,
        category: 'breakfast',
        price: 60,
        quantity: formBreakfast,
        createdAt: new Date().toISOString()
      });
    }

    const intent: ParsedBookingIntent = {
      type: 'booking',
      roomNumbers: formSelectedRoomNumbers,
      guestName: formGuestName.trim() || 'รอลูกค้าแจ้ง',
      guestPhone: formGuestPhone.trim() || '-',
      checkInDate: formCheckInDate,
      checkOutDate: formCheckOutDate,
      totalNights: formTotalNights,
      totalGuests: formSelectedRooms.reduce((sum, r) => sum + r.capacity, 0),
      paymentStatus: formPaymentStatus,
      depositAmount: formDepositAmount,
      addOns: addOnsList,
      extraBeds: formExtraBeds,
      mookataSmall: formMookataSmall,
      mookataLarge: formMookataLarge,
      breakfast: formBreakfast,
      isRoomAvailable: formConflictedRooms.length === 0,
      conflictDetails: formConflictedRooms.length > 0 ? `ห้อง ${formConflictedRooms.join(', ')} มีการจองแล้ว` : undefined,
      estimatedTotal: formGrandTotal,
    };

    const created = createBookingsFromIntent(intent, rooms);
    onAddBooking(created);
    setLastCreatedBookings(created);
  };

  // --- BULLET TEMPLATE HANDLERS ---
  const handleInsertBulletTemplate = () => {
    const thaiDateToday = formatThaiDate(todayStr);
    const template = `• บ้านพัก: S1\n• ชื่อผู้เข้าพัก: \n• เบอร์โทรศัพท์: \n• วันที่เข้าพัก: ${thaiDateToday}\n• จำนวนคืน: 1 คืน\n• การชำระเงิน: มัดจำ 50%\n• บริการเสริม: `;
    setTextInput(template);
    setTextFeedbackMessage(null);
    setParsedResult(null);
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 50);
  };

  const handleCopyCustomerForm = () => {
    const customerForm = `🏡 แบบฟอร์มข้อมูลการจอง Swan HILL Resort\n• บ้านพักที่ต้องการ: \n• ชื่อผู้เข้าพัก: \n• เบอร์โทรศัพท์: \n• วันที่เข้าพัก: \n• จำนวนคืน: \n• จำนวนผู้เข้าพัก: \n• สั่งหมูกระทะ / เสริมที่นอน (ถ้ามี): `;
    navigator.clipboard.writeText(customerForm);
    setCopyToast(true);
    setTimeout(() => setCopyToast(false), 3000);
  };

  const handleProcessText = () => {
    if (!textInput.trim() || isProcessingText) return;
    setIsProcessingText(true);
    setTextFeedbackMessage(null);

    setTimeout(() => {
      const result = parseThaiBookingText(textInput, rooms, bookings);
      if (result.type === 'booking') {
        setParsedResult(result);
        setTextFeedbackMessage(null);
      } else {
        setParsedResult(null);
        setTextFeedbackMessage(result.message);
      }
      setIsProcessingText(false);
    }, 300);
  };

  const handleConfirmSaveFromText = (intent: ParsedBookingIntent) => {
    const created = createBookingsFromIntent(intent, rooms);
    onAddBooking(created);
    setLastCreatedBookings(created);
  };

  const handleTransferToForm = (intent: ParsedBookingIntent) => {
    if (intent.roomNumbers.length > 0) {
      setFormSelectedRoomNumbers(intent.roomNumbers);
    }
    if (intent.guestName) {
      setFormGuestName(intent.guestName);
    }
    if (intent.guestPhone && intent.guestPhone !== '-') {
      setFormGuestPhone(intent.guestPhone);
    }
    if (intent.checkInDate) {
      setFormCheckInDate(intent.checkInDate);
    }
    if (intent.checkOutDate) {
      setFormCheckOutDate(intent.checkOutDate);
    }
    setFormPaymentStatus(intent.paymentStatus);
    setFormMookataLarge(intent.mookataLarge || 0);
    setFormMookataSmall(intent.mookataSmall || 0);
    setFormExtraBeds(intent.extraBeds || 0);
    setFormBreakfast(intent.breakfast || 0);

    setActiveTab('form');
  };

  const handleOpenFullPMSModal = (intent?: ParsedBookingIntent) => {
    if (onOpenNewBookingWithPrefill) {
      const rNum = intent ? intent.roomNumbers[0] : formSelectedRoomNumbers[0];
      const room = rooms.find(r => r.roomNumber === rNum);
      onOpenNewBookingWithPrefill(
        room?.id,
        intent ? intent.checkInDate : formCheckInDate,
        intent ? intent.checkOutDate : formCheckOutDate,
        intent ? intent.guestName : formGuestName,
        intent ? intent.guestPhone : formGuestPhone
      );
      onClose();
    }
  };

  const handleResetAll = () => {
    setFormSelectedRoomNumbers(['S1']);
    setFormGuestName('');
    setFormGuestPhone('');
    setFormCheckInDate(todayStr);
    setFormCheckOutDate(tomorrowStr);
    setFormPaymentStatus('deposit');
    setFormExtraBeds(0);
    setFormMookataLarge(0);
    setFormMookataSmall(0);
    setFormBreakfast(0);
    setTextInput('');
    setParsedResult(null);
    setTextFeedbackMessage(null);
    setLastCreatedBookings(null);
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-700 overflow-hidden h-[94dvh] sm:h-[88vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Top Header Bar */}
        <div className="p-3 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white">ลงข้อมูลการจองห้องพัก</h3>
                <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Swan HILL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                เลือกกรอกแบบฟอร์ม หรือวางข้อความ Bullet Point จาก LINE
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetAll}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="รีเซ็ตเริ่มใหม่"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation: Mode Selection */}
        <div className="px-3 pt-2 pb-2 bg-slate-950 border-b border-slate-800/90 shrink-0 flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab('form')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-98 ${
              activeTab === 'form'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            <span>📝 กรอกแบบฟอร์มด่วน</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bullet')}
            className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-black transition-all cursor-pointer active:scale-98 ${
              activeTab === 'bullet'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950'
                : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700/60'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>📋 วางข้อความ / แม่แบบ Bullet</span>
          </button>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto bg-slate-900/60 space-y-4">

          {/* SUCCESS SCREEN BANNER IF RECENTLY BOOKED */}
          {lastCreatedBookings && (
            <div className="p-4 bg-emerald-950/80 border-2 border-emerald-500 text-emerald-100 rounded-2xl shadow-xl space-y-3 animate-in zoom-in-95 duration-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500 text-slate-950 flex items-center justify-center shrink-0 shadow-md">
                  <CheckCheck className="w-6 h-6 stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="text-sm sm:text-base font-black text-white">
                    บันทึกการจองเข้าระบบเรียบร้อยแล้ว!
                  </h4>
                  <p className="text-xs text-emerald-300 font-medium">
                    ห้อง {lastCreatedBookings.map(b => b.roomNumber).join(', ')} • คุณ{lastCreatedBookings[0].guestName} ({formatThaiDate(lastCreatedBookings[0].checkInDate)})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                {onOpenReceipt && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenReceipt(lastCreatedBookings[0]);
                      onClose();
                    }}
                    className="flex-1 py-2 px-3 rounded-xl bg-white text-emerald-950 font-black text-xs hover:bg-emerald-50 transition-all cursor-pointer shadow-sm text-center"
                  >
                    🧾 ดูใบเสร็จรับเงิน
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setLastCreatedBookings(null);
                    handleResetAll();
                  }}
                  className="flex-1 py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs transition-all cursor-pointer text-center"
                >
                  ➕ ทำรายการจองใหม่
                </button>
              </div>
            </div>
          )}

          {/* TAB 1: FORM MODE */}
          {activeTab === 'form' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* SECTION 1: Room Selection Grid */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Home className="w-4 h-4 text-emerald-400" />
                    <span>1. เลือกบ้านพักที่ต้องการจอง</span>
                  </span>
                  <span className="text-[11px] text-slate-400">
                    เลือกแล้ว: <strong className="text-emerald-400 font-bold">{formSelectedRoomNumbers.join(', ')}</strong> ({formSelectedRoomNumbers.length} หลัง)
                  </span>
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].map((rNum) => {
                    const room = rooms.find(r => r.roomNumber === rNum);
                    const isSelected = formSelectedRoomNumbers.includes(rNum);
                    const isOccupied = checkRoomOccupied(rNum, formCheckInDate, formCheckOutDate);
                    const isBigRoom = rNum === 'S3' || rNum === 'S4';

                    return (
                      <button
                        key={rNum}
                        type="button"
                        onClick={() => handleToggleRoom(rNum)}
                        className={`relative p-2.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 flex flex-col justify-between ${
                          isSelected
                            ? isOccupied 
                              ? 'bg-rose-950/60 border-rose-500 text-white shadow-md ring-2 ring-rose-500/50'
                              : 'bg-emerald-950/70 border-emerald-500 text-white shadow-md ring-2 ring-emerald-500/50'
                            : 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-black">{rNum}</span>
                          {isSelected && (
                            <span className="w-4 h-4 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[10px]">
                              ✓
                            </span>
                          )}
                        </div>

                        <div className="mt-1">
                          <span className="text-[10px] text-slate-400 block">
                            {isBigRoom ? '4 ท่าน' : '2 ท่าน'}
                          </span>
                          <span className="text-[11px] font-black text-emerald-400 block">
                            ฿{(room?.pricePerNight || (isBigRoom ? 2000 : 1200)).toLocaleString()}
                          </span>
                        </div>

                        <div className="mt-1 flex items-center gap-1">
                          <span className={`w-1.5 h-1.5 rounded-full ${isOccupied ? 'bg-rose-500 animate-pulse' : 'bg-emerald-400'}`} />
                          <span className={`text-[9px] font-medium ${isOccupied ? 'text-rose-400' : 'text-slate-400'}`}>
                            {isOccupied ? 'มีคนจอง' : 'ว่าง'}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Conflict Alert if any */}
                {formConflictedRooms.length > 0 && (
                  <div className="p-2.5 bg-rose-950/60 border border-rose-800/80 rounded-xl text-xs text-rose-300 flex items-center gap-2 font-medium">
                    <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                    <span>บ้าน {formConflictedRooms.join(', ')} มีรายการจองแล้วในช่วงวันที่เลือก! โปรดเปลี่ยนห้องหรือเปลี่ยนวันที่</span>
                  </div>
                )}
              </div>

              {/* SECTION 2: Guest Information */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-emerald-400" />
                  <span>2. ข้อมูลผู้เข้าพัก</span>
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      ชื่อลูกค้า / ผู้เข้าพัก <span className="text-slate-500 font-normal">(เว้นว่างได้)</span>
                    </label>
                    <input
                      type="text"
                      value={formGuestName}
                      onChange={(e) => setFormGuestName(e.target.value)}
                      placeholder="เช่น คุณสมชาย หรือ รอลูกค้าแจ้ง"
                      className="w-full bg-slate-900 text-white placeholder-slate-500 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      เบอร์โทรศัพท์ <span className="text-slate-500 font-normal">(เว้นว่างได้)</span>
                    </label>
                    <input
                      type="tel"
                      value={formGuestPhone}
                      onChange={(e) => setFormGuestPhone(e.target.value)}
                      placeholder="เช่น 081-234-5678"
                      className="w-full bg-slate-900 text-white placeholder-slate-500 text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: Check-in / Check-out Dates */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 text-emerald-400" />
                    <span>3. วันที่เข้าพัก & จำนวนคืน</span>
                  </span>

                  <div className="flex items-center gap-1 bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400">พัก</span>
                    <strong className="text-xs text-amber-400 font-black">{formTotalNights} คืน</strong>
                    <button
                      type="button"
                      onClick={() => handleAdjustNights(-1)}
                      disabled={formTotalNights <= 1}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 disabled:opacity-30 text-white text-xs flex items-center justify-center cursor-pointer ml-1"
                      title="ลดจำนวนคืน"
                    >
                      -
                    </button>
                    <button
                      type="button"
                      onClick={() => handleAdjustNights(1)}
                      className="w-5 h-5 rounded bg-slate-800 hover:bg-slate-700 text-white text-xs flex items-center justify-center cursor-pointer"
                      title="เพิ่มจำนวนคืน"
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      วันที่เช็คอิน (Check-in)
                    </label>
                    <input
                      type="date"
                      value={formCheckInDate}
                      onChange={(e) => {
                        const val = e.target.value;
                        setFormCheckInDate(val);
                        if (val >= formCheckOutDate) {
                          setFormCheckOutDate(shiftDateStr(val, 1));
                        }
                      }}
                      className="w-full bg-slate-900 text-white text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-emerald-400/80 block mt-1">
                      {formatThaiDate(formCheckInDate)}
                    </span>
                  </div>

                  <div>
                    <label className="text-[11px] text-slate-400 font-bold block mb-1">
                      วันที่เช็คเอาท์ (Check-out)
                    </label>
                    <input
                      type="date"
                      value={formCheckOutDate}
                      min={shiftDateStr(formCheckInDate, 1)}
                      onChange={(e) => setFormCheckOutDate(e.target.value)}
                      className="w-full bg-slate-900 text-white text-xs sm:text-sm px-3 py-2.5 rounded-xl border border-slate-800 focus:outline-hidden focus:border-emerald-500"
                    />
                    <span className="text-[10px] text-amber-400/80 block mt-1">
                      {formatThaiDate(formCheckOutDate)}
                    </span>
                  </div>
                </div>
              </div>

              {/* SECTION 4: Add-ons (หมูกระทะ / เสริมที่นอน) */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-2.5">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-4 h-4 text-amber-400" />
                  <span>4. บริการเสริม (หมูกระทะ / เสริมที่นอน)</span>
                </span>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {/* Mookata Large */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">หมูกระทะ (ใหญ่)</span>
                      <span className="text-[10px] text-amber-400 font-semibold">฿500 / ชุด</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormMookataLarge(Math.max(0, formMookataLarge - 1))}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-white">{formMookataLarge}</span>
                      <button
                        type="button"
                        onClick={() => setFormMookataLarge(formMookataLarge + 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Mookata Small */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">หมูกระทะ (เล็ก)</span>
                      <span className="text-[10px] text-amber-400 font-semibold">฿350 / ชุด</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormMookataSmall(Math.max(0, formMookataSmall - 1))}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-white">{formMookataSmall}</span>
                      <button
                        type="button"
                        onClick={() => setFormMookataSmall(formMookataSmall + 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Extra Bed */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">เสริมที่นอน</span>
                      <span className="text-[10px] text-blue-400 font-semibold">฿300 / ท่าน</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormExtraBeds(Math.max(0, formExtraBeds - 1))}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-white">{formExtraBeds}</span>
                      <button
                        type="button"
                        onClick={() => setFormExtraBeds(formExtraBeds + 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* Breakfast */}
                  <div className="p-2.5 bg-slate-900 rounded-xl border border-slate-800 flex flex-col justify-between">
                    <div>
                      <span className="text-xs font-bold text-slate-200 block">อาหารเช้า</span>
                      <span className="text-[10px] text-teal-400 font-semibold">฿60 / ท่าน</span>
                    </div>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-800">
                      <button
                        type="button"
                        onClick={() => setFormBreakfast(Math.max(0, formBreakfast - 1))}
                        className="w-6 h-6 rounded-lg bg-slate-800 hover:bg-slate-700 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        -
                      </button>
                      <span className="text-xs font-black text-white">{formBreakfast}</span>
                      <button
                        type="button"
                        onClick={() => setFormBreakfast(formBreakfast + 1)}
                        className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center text-xs cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* SECTION 5: Payment & Total Calculation */}
              <div className="bg-slate-950/70 p-3 sm:p-4 rounded-2xl border border-slate-800 space-y-3">
                <span className="text-xs font-black text-slate-200 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                  <span>5. การชำระเงิน & ยอดรวม</span>
                </span>

                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setFormPaymentStatus('deposit')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      formPaymentStatus === 'deposit'
                        ? 'bg-blue-600 border-blue-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    มัดจำ 50%
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormPaymentStatus('paid')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      formPaymentStatus === 'paid'
                        ? 'bg-emerald-600 border-emerald-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ชำระครบ (100%)
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormPaymentStatus('pending')}
                    className={`py-2 px-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer text-center ${
                      formPaymentStatus === 'pending'
                        ? 'bg-amber-600 border-amber-400 text-white shadow-md'
                        : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    ยังไม่ชำระ
                  </button>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">ยอดรวมทั้งสิ้น ({formTotalNights} คืน)</span>
                    <span className="text-base font-black text-emerald-400">
                      ฿{formGrandTotal.toLocaleString()} บาท
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">
                      {formPaymentStatus === 'paid' ? 'ชำระแล้วเต็มจำนวน' : (formPaymentStatus === 'deposit' ? 'ยอดมัดจำที่ต้องชำระ' : 'ยังไม่มียอดชำระ')}
                    </span>
                    <span className="text-sm font-black text-blue-400">
                      ฿{formDepositAmount.toLocaleString()} บาท
                    </span>
                    {formPaymentStatus === 'deposit' && (
                      <span className="text-[10px] text-slate-400 block">
                        (คงเหลือวันเช็คอิน ฿{(formGrandTotal - formDepositAmount).toLocaleString()})
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Button: Confirm Save */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={handleSaveFromForm}
                  disabled={formConflictedRooms.length > 0 || formSelectedRoomNumbers.length === 0}
                  className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/50 transition-all cursor-pointer active:scale-98"
                >
                  <Check className="w-5 h-5 stroke-[3]" />
                  <span>ยืนยันบันทึกการจองทันที (฿{formGrandTotal.toLocaleString()})</span>
                </button>
              </div>

            </div>
          )}

          {/* TAB 2: BULLET POINT / TEXT & LINE CHAT MODE */}
          {activeTab === 'bullet' && (
            <div className="space-y-4 animate-in fade-in duration-200">
              
              {/* Toolbar with Bullet Actions */}
              <div className="bg-slate-950 p-3 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-emerald-400" />
                    <span>แม่แบบและเครื่องมือข้อความ</span>
                  </span>
                  {copyToast && (
                    <span className="text-[11px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded-md border border-emerald-800 animate-in fade-in">
                      ✓ คัดลอกแบบฟอร์มแล้ว พร้อมส่งใน LINE!
                    </span>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleInsertBulletTemplate}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white text-xs font-black transition-all cursor-pointer shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>แทรกแม่แบบ Bullet Point</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCopyCustomerForm}
                    className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-200 text-xs font-bold border border-slate-700 transition-all cursor-pointer"
                    title="คัดลอกแบบฟอร์มเพื่อส่งให้ลูกค้าใน LINE กรอก"
                  >
                    <Copy className="w-3.5 h-3.5 text-amber-400" />
                    <span>คัดลอกแบบฟอร์มส่งลูกค้า (LINE)</span>
                  </button>

                  {textInput && (
                    <button
                      type="button"
                      onClick={() => {
                        setTextInput('');
                        setParsedResult(null);
                        setTextFeedbackMessage(null);
                        textareaRef.current?.focus();
                      }}
                      className="px-2.5 py-2 rounded-xl bg-slate-800 hover:bg-rose-950 hover:text-rose-300 text-slate-400 text-xs transition-colors cursor-pointer"
                      title="ล้างข้อความ"
                    >
                      ล้างช่องพิมพ์
                    </button>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300 block">
                  พิมพ์ข้อความ Bullet Point หรือวางข้อความแชทจาก LINE:
                </label>
                <textarea
                  ref={textareaRef}
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  rows={6}
                  placeholder="เช่น:&#10;• บ้านพัก: S1&#10;• ชื่อผู้เข้าพัก: คุณสมชาย&#10;• เบอร์โทรศัพท์: 0812345678&#10;• วันที่เข้าพัก: 26 ก.ย.&#10;• การชำระเงิน: มัดจำ 50%"
                  className="w-full bg-slate-950 text-white placeholder-slate-500 text-xs sm:text-sm p-3.5 rounded-2xl border border-slate-800 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 leading-relaxed font-mono"
                />

                <button
                  type="button"
                  onClick={handleProcessText}
                  disabled={!textInput.trim() || isProcessingText}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer active:scale-98"
                >
                  <Sparkles className="w-4 h-4 fill-white" />
                  <span>{isProcessingText ? 'กำลังอ่านและประมวลผลข้อมูล...' : 'ประมวลผลและสกัดข้อมูลการจอง (AI Parse)'}</span>
                </button>
              </div>

              {/* Feedback if text not recognized */}
              {textFeedbackMessage && (
                <div className="p-3 bg-slate-800/80 border border-slate-700 rounded-xl text-xs text-slate-300 leading-relaxed whitespace-pre-line">
                  {textFeedbackMessage}
                </div>
              )}

              {/* REVIEW SCREEN CARD IF EXTRACTED */}
              {parsedResult && (
                <div className="w-full bg-white text-slate-900 rounded-2xl sm:rounded-3xl border-2 border-emerald-500 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  
                  {/* Review Header Banner */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3 sm:p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black block">
                          หน้าจอตรวจสอบข้อมูลการจอง (Review)
                        </span>
                        <span className="text-[10px] text-emerald-100">
                          สกัดข้อมูลจากข้อความเรียบร้อย ตรวจสอบความถูกต้องก่อนบันทึก
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-black bg-white text-emerald-900 px-2.5 py-0.5 rounded-full shadow-2xs">
                      {parsedResult.roomNumbers.join(' + ')}
                    </span>
                  </div>

                  {/* Conflict warning if occupied */}
                  {!parsedResult.isRoomAvailable && (
                    <div className="p-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{parsedResult.conflictDetails || 'ห้องดังกล่าวมีคนจองแล้วในบางช่วงวัน!'}</span>
                    </div>
                  )}

                  {/* Structured Details */}
                  <div className="p-3 sm:p-4 space-y-2.5 text-xs">
                    {/* Guest & Phone */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ชื่อผู้เข้าพัก</span>
                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                          {parsedResult.guestName || 'รอลูกค้าแจ้ง'}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">เบอร์โทรศัพท์</span>
                        <span className="font-black text-blue-600 text-xs sm:text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {parsedResult.guestPhone || '-'}
                        </span>
                      </div>
                    </div>

                    {/* Room & Dates */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">บ้านพัก</span>
                        <span className="font-black text-slate-900 flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-emerald-600" />
                          ห้อง {parsedResult.roomNumbers.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ระยะเวลาเข้าพัก</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          {formatThaiDate(parsedResult.checkInDate)} ({parsedResult.totalNights} คืน)
                        </span>
                      </div>
                    </div>

                    {/* Add-ons */}
                    {parsedResult.addOns.length > 0 && (
                      <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-black text-amber-900 flex items-center gap-1 mb-1">
                          <UtensilsCrossed className="w-3 h-3 text-amber-700" />
                          บริการเสริม / หมูกระทะ:
                        </span>
                        <div className="space-y-0.5">
                          {parsedResult.addOns.map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-slate-700 font-semibold text-[11px]">
                              <span>• {a.name}</span>
                              <span className="font-black text-amber-900">฿{(a.price * a.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing */}
                    <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold block flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> ยอดรวมทั้งสิ้น
                        </span>
                        <span className="text-sm font-black text-emerald-950">
                          ฿{parsedResult.estimatedTotal.toLocaleString()} บาท
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {parsedResult.paymentStatus === 'paid' ? 'ชำระเต็มจำนวน' : `มัดจำแล้ว (ค้าง ฿${Math.max(0, parsedResult.estimatedTotal - parsedResult.depositAmount).toLocaleString()})`}
                        </span>
                        <span className="text-xs font-black text-blue-700">
                          ฿{parsedResult.depositAmount.toLocaleString()} บาท
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Actions in Review Card */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleTransferToForm(parsedResult)}
                      className="flex-1 min-w-[140px] py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>แก้ไขในแบบฟอร์มด่วน</span>
                    </button>

                    {onOpenNewBookingWithPrefill && (
                      <button
                        type="button"
                        onClick={() => handleOpenFullPMSModal(parsedResult)}
                        className="py-2.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 font-bold text-xs flex items-center justify-center gap-1 transition-all cursor-pointer border border-slate-300"
                        title="เปิดในหน้าจองหลักแบบละเอียด (PMS)"
                      >
                        <span>เปิดฟอร์มเต็ม</span>
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => handleConfirmSaveFromText(parsedResult)}
                      className="flex-2 min-w-[160px] py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                    >
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>ยืนยันบันทึกทันที</span>
                    </button>
                  </div>

                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>,
    document.body
  );
};
