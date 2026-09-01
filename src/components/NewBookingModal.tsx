import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  CreditCard, 
  FileText,
  Plus,
  Minus,
  UtensilsCrossed,
  Bed,
  Sparkles,
  Coins,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Clock,
  Settings2,
  Phone,
  User
} from 'lucide-react';
import type { Room, Booking, PaymentStatus, AddOnItem } from '../types/pms';
import { CustomDropdown, type DropdownOption } from './CustomDropdown';
import { HouseLogo } from './HouseLogo';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { formatLocalDate, shiftDateStr, formatThaiDate } from '../utils/dateUtils';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings?: Booking[];
  onAddBooking: (booking: Booking) => void;
  prefillRoomId?: string;
  prefillDate?: string;
  prefillCheckOutDate?: string;
}

// Generate auto booking code like BK-20260902-04
const generateBookingCode = (checkInDateStr: string) => {
  const cleanDate = checkInDateStr.replace(/-/g, '');
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  return `BK-${cleanDate}-${randomSuffix}`;
};

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings = [],
  onAddBooking,
  prefillRoomId,
  prefillDate,
  prefillCheckOutDate
}) => {
  useLockBodyScroll(isOpen);
  const defaultCheckIn = formatLocalDate(new Date());
  const defaultCheckOut = shiftDateStr(defaultCheckIn, 1);

  // Guided Stepper (1 = Customer & Room, 2 = Add-ons & Payment)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('deposit');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Add-ons state during booking
  const [extraBeds, setExtraBeds] = useState(0);
  const [mookataSmall, setMookataSmall] = useState(0);
  const [mookataLarge, setMookataLarge] = useState(0);
  const [breakfast, setBreakfast] = useState(0);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  // Calculate nights safely without timezone drift
  const diffNights = () => {
    const pIn = checkInDate.split('-').map(Number);
    const pOut = checkOutDate.split('-').map(Number);
    const d1 = new Date(pIn[0], pIn[1] - 1, pIn[2]);
    const d2 = new Date(pOut[0], pOut[1] - 1, pOut[2]);
    const diff = d2.getTime() - d1.getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };
  const totalNights = diffNights();

  // Calculate Totals
  const roomPricePerNight = selectedRoom?.pricePerNight || 1200;
  const roomBaseTotal = roomPricePerNight * totalNights;
  const addOnsTotal = (extraBeds * 300) + (mookataSmall * 350) + (mookataLarge * 500) + (breakfast * 60);
  const grandTotal = roomBaseTotal + addOnsTotal;

  useEffect(() => {
    if (prefillRoomId) {
      setSelectedRoomId(prefillRoomId);
    }
    if (prefillDate) {
      setCheckInDate(prefillDate);
    }
    if (prefillCheckOutDate) {
      setCheckOutDate(prefillCheckOutDate);
    } else if (prefillDate) {
      setCheckOutDate(shiftDateStr(prefillDate, 1));
    }
    if (isOpen) {
      setCurrentStep(1);
      setIsDepositModalOpen(false);
    }
  }, [prefillRoomId, prefillDate, prefillCheckOutDate, isOpen, rooms]);

  // Update default deposit when grandTotal changes (default to 50%)
  useEffect(() => {
    if (grandTotal > 0 && depositAmount === 0) {
      setDepositAmount(Math.round(grandTotal * 0.5));
    }
  }, [grandTotal]);

  if (!isOpen) return null;

  // Deposit percentage calculations
  const effectivePaid = paymentStatus === 'paid' ? grandTotal : (paymentStatus === 'deposit' ? depositAmount : 0);
  const depositPercent = grandTotal > 0 ? Math.round((effectivePaid / grandTotal) * 100) : 0;
  const remainingAtCheckin = Math.max(0, grandTotal - effectivePaid);

  // Active bookings filter to check room conflicts
  const activeBookings = (bookings || []).filter(b => !b.deletedAt && b.status !== 'cancelled');

  // Room Dropdown Options with live availability check
  const roomOptions: DropdownOption[] = rooms.map(r => {
    const conflict = activeBookings.find(b => 
      (b.roomId === r.id || b.roomNumber === r.roomNumber) &&
      b.checkInDate < checkOutDate && b.checkOutDate > checkInDate
    );

    return {
      value: r.id,
      label: conflict ? `[${r.roomNumber}] ${r.name} (ติดจอง)` : `[${r.roomNumber}] ${r.name}`,
      sublabel: conflict ? `${r.type} • ติดจองโดยคุณ ${conflict.guestName}` : `${r.type} • ว่างพร้อมจอง`,
      badge: conflict ? '🔴 ติดจองแล้ว' : `🟢 ว่าง ฿${r.pricePerNight.toLocaleString()}/คืน`,
      icon: <HouseLogo roomNumber={r.roomNumber} size="sm" />
    };
  });

  const sanitizePhoneInput = (val: string) => {
    return val.replace(/[^0-9,\s-]/g, '');
  };

  const handleSetDepositPercent = (percent: number) => {
    const calculated = Math.round(grandTotal * (percent / 100));
    setDepositAmount(calculated);
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      alert('กรุณาระบุชื่อลูกค้า');
      return;
    }
    if (!guestPhone.trim()) {
      alert('กรุณาระบุเบอร์โทรศัพท์ลูกค้า');
      return;
    }
    setCurrentStep(2);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim() || !guestPhone.trim() || !selectedRoom) return;

    const addOnsList: AddOnItem[] = [];
    if (extraBeds > 0) {
      addOnsList.push({
        id: 'bed-' + Date.now(),
        name: `ที่นอนเสริม (${extraBeds} ท่าน)`,
        category: 'bed',
        price: 300,
        quantity: extraBeds,
        createdAt: new Date().toISOString()
      });
    }
    if (mookataSmall > 0) {
      addOnsList.push({
        id: 'mks-' + Date.now(),
        name: `หมูกระทะชุดเล็ก (${mookataSmall} ชุด)`,
        category: 'mookata_small',
        price: 350,
        quantity: mookataSmall,
        createdAt: new Date().toISOString()
      });
    }
    if (mookataLarge > 0) {
      addOnsList.push({
        id: 'mkl-' + Date.now(),
        name: `หมูกระทะชุดใหญ่ (${mookataLarge} ชุด)`,
        category: 'mookata_large',
        price: 500,
        quantity: mookataLarge,
        createdAt: new Date().toISOString()
      });
    }
    if (breakfast > 0) {
      addOnsList.push({
        id: 'bf-' + Date.now(),
        name: `อาหารเช้า (${breakfast} ท่าน)`,
        category: 'breakfast',
        price: 60,
        quantity: breakfast,
        createdAt: new Date().toISOString()
      });
    }

    const calculatedPaidAmount = paymentStatus === 'paid' 
      ? grandTotal 
      : (paymentStatus === 'deposit' ? (depositAmount > 0 ? depositAmount : Math.round(grandTotal * 0.5)) : 0);

    const newBooking: Booking = {
      id: 'b-' + Date.now(),
      bookingCode: generateBookingCode(checkInDate),
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      channel: 'LINE Official',
      roomId: selectedRoom.id,
      roomNumber: selectedRoom.roomNumber,
      roomType: selectedRoom.type,
      checkInDate,
      checkOutDate,
      totalNights,
      totalGuests: selectedRoom.capacity || 2,
      roomPrice: roomPricePerNight,
      addOns: addOnsList,
      totalAmount: grandTotal,
      paidAmount: calculatedPaidAmount,
      paymentStatus: calculatedPaidAmount >= grandTotal ? 'paid' : (calculatedPaidAmount > 0 ? 'deposit' : 'pending'),
      status: 'confirmed',
      specialRequests: notes || undefined,
      createdAt: new Date().toISOString()
    };

    onAddBooking(newBooking);
    onClose();

    // Reset form
    setGuestName('');
    setGuestPhone('');
    setNotes('');
    setExtraBeds(0);
    setMookataSmall(0);
    setMookataLarge(0);
    setBreakfast(0);
    setDepositAmount(0);
    setCurrentStep(1);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overscroll-contain animate-in fade-in font-['Prompt']"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col overscroll-contain"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">บันทึกการจองห้องพัก</h3>
              <p className="text-slate-400 text-[11px] font-medium">Swan HILL Resort</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Pill Indicator (2 Steps) */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentStep === 1
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${currentStep === 1 ? 'bg-white text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              1
            </span>
            <span>ลูกค้า & ห้องพัก</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          <button
            type="button"
            onClick={() => {
              if (guestName.trim() && guestPhone.trim()) {
                setCurrentStep(2);
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentStep === 2
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 opacity-90'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${currentStep === 2 ? 'bg-white text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              2
            </span>
            <span>อาหาร & ชำระเงิน</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: ลูกค้า & ห้องพัก (Who & Where)                                    */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} className="p-4 overflow-y-auto no-scrollbar space-y-3.5 text-slate-800 flex-1">
            {/* 1. Guest Name & Phone */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-900 mb-1 flex items-center gap-1">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ชื่อลูกค้า <span className="text-red-500">*</span></span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="เช่น คุณสมชาย เจริญพร"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-emerald-500 outline-none font-medium bg-slate-50 focus:bg-white transition-all shadow-xs"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-900 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    <span>เบอร์โทรศัพท์ <span className="text-red-500">*</span></span>
                  </label>
                  <span className="text-[10px] text-slate-400 font-normal">คั่นด้วย , ได้ถ้ามี 2 เบอร์</span>
                </div>
                <input
                  type="text"
                  required
                  placeholder="เช่น 081-234-5678"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(sanitizePhoneInput(e.target.value))}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:border-emerald-500 outline-none font-medium bg-slate-50 focus:bg-white transition-all shadow-xs"
                />
              </div>
            </div>

            {/* 2. Choose Room */}
            <div>
              <CustomDropdown
                label="เลือกบ้านพัก / ขนาดห้อง *"
                options={roomOptions}
                value={selectedRoomId}
                onChange={(val) => setSelectedRoomId(val)}
              />
            </div>

            {/* 3. Check-in & Check-out Dates */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    วันเช็คอิน <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={checkInDate}
                      onChange={(e) => setCheckInDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-white transition-all shadow-xs"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-900 mb-1">
                    วันเช็คเอาท์ <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      required
                      value={checkOutDate}
                      onChange={(e) => setCheckOutDate(e.target.value)}
                      className="w-full px-3 py-2 text-xs font-bold border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-white transition-all shadow-xs"
                    />
                    <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Nights Summary Banner */}
              <div className="pt-1.5 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600">
                  เข้าพัก: <strong className="text-slate-900">{totalNights} คืน</strong> ({formatThaiDate(checkInDate)} - {formatThaiDate(checkOutDate)})
                </span>
                <span className="font-bold text-emerald-800">
                  ฿{roomBaseTotal.toLocaleString()} บาท
                </span>
              </div>
            </div>

            {/* Bottom Step 1 Action */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>ถัดไป: อาหาร & ชำระเงิน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: อาหาร & ชำระเงิน (Add-ons & Payment)                              */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="p-4 overflow-y-auto no-scrollbar space-y-3.5 text-slate-800 flex-1">
            
            {/* Summary Tag Header */}
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <HouseLogo roomNumber={selectedRoom.roomNumber} size="sm" />
                <div>
                  <span className="font-bold text-slate-900">บ้าน {selectedRoom.roomNumber} ({selectedRoom.name})</span>
                  <span className="text-[11px] text-slate-500 block">ลูกค้า: {guestName} &bull; {totalNights} คืน</span>
                </div>
              </div>
              <span className="text-xs font-black text-emerald-800">
                ฿{grandTotal.toLocaleString()}
              </span>
            </div>

            {/* 1. Add-on Services & Food (Steppers) */}
            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                  <span>อาหาร & บริการเสริมสั่งล่วงหน้า</span>
                </span>
                <span className="text-[10px] text-slate-400 font-normal">กด + เพิ่มจำนวน (ถ้ามี)</span>
              </div>

              {/* Extra Bed (+300) */}
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-xs font-bold block">ที่นอนเสริม</span>
                    <span className="text-[10px] text-slate-500">฿300 / ท่าน</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))}
                    className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-black text-xs">{extraBeds}</span>
                  <button
                    type="button"
                    onClick={() => setExtraBeds(extraBeds + 1)}
                    className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mookata Small (+350) */}
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold block">หมูกระทะ (ชุดเล็ก)</span>
                    <span className="text-[10px] text-slate-500">฿350 / ชุด</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMookataSmall(Math.max(0, mookataSmall - 1))}
                    className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-black text-xs">{mookataSmall}</span>
                  <button
                    type="button"
                    onClick={() => setMookataSmall(mookataSmall + 1)}
                    className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mookata Large (+500) */}
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-600" />
                  <div>
                    <span className="text-xs font-bold block">หมูกระทะ (ชุดใหญ่)</span>
                    <span className="text-[10px] text-slate-500">฿500 / ชุด</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setMookataLarge(Math.max(0, mookataLarge - 1))}
                    className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-black text-xs">{mookataLarge}</span>
                  <button
                    type="button"
                    onClick={() => setMookataLarge(mookataLarge + 1)}
                    className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Breakfast (+60) */}
              <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
                <div className="flex items-center gap-2">
                  <UtensilsCrossed className="w-4 h-4 text-teal-600" />
                  <div>
                    <span className="text-xs font-bold block">อาหารเช้าเพิ่มเติม</span>
                    <span className="text-[10px] text-slate-500">฿60 / ท่าน</span>
                  </div>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => setBreakfast(Math.max(0, breakfast - 1))}
                    className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="w-5 text-center font-black text-xs">{breakfast}</span>
                  <button
                    type="button"
                    onClick={() => setBreakfast(breakfast + 1)}
                    className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* 2. Total Calculation Summary Box */}
            <div className="p-3 bg-emerald-50/90 rounded-2xl border border-emerald-200 space-y-1 text-xs shadow-xs">
              <div className="flex justify-between text-slate-700">
                <span>ค่าห้องพัก ({totalNights} คืน):</span>
                <span className="font-bold">฿{roomBaseTotal.toLocaleString()}</span>
              </div>
              {addOnsTotal > 0 && (
                <div className="flex justify-between text-slate-700">
                  <span>ค่าบริการเสริม & อาหาร:</span>
                  <span className="font-bold text-emerald-800">+฿{addOnsTotal.toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-emerald-200">
                <span>ยอดเงินรวมทั้งสิ้น:</span>
                <span className="text-emerald-950">฿{grandTotal.toLocaleString()} บาท</span>
              </div>
            </div>

            {/* 3. Payment Status: 3 Large Touchable Cards (No Dropdown required) */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-900">
                เลือกการชำระเงินของลูกค้า <span className="text-red-500">*</span>
              </label>

              <div className="grid grid-cols-3 gap-2">
                {/* Option 1: จ่ายมัดจำ */}
                <div
                  onClick={() => {
                    setPaymentStatus('deposit');
                    if (depositAmount === 0) setDepositAmount(Math.round(grandTotal * 0.5));
                  }}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                    paymentStatus === 'deposit'
                      ? 'bg-amber-50 border-amber-500 shadow-xs ring-1 ring-amber-500 text-amber-950'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Coins className={`w-5 h-5 mx-auto mb-1 ${paymentStatus === 'deposit' ? 'text-amber-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold block">จ่ายมัดจำ</span>
                  <span className="text-[10px] text-amber-800 font-semibold block mt-0.5">
                    ฿{depositAmount.toLocaleString()} ({depositPercent}%)
                  </span>

                  {paymentStatus === 'deposit' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setIsDepositModalOpen(true);
                      }}
                      className="mt-1.5 px-2 py-0.5 bg-amber-200/80 hover:bg-amber-300 text-amber-900 rounded-md text-[9px] font-bold flex items-center justify-center gap-0.5 mx-auto cursor-pointer"
                    >
                      <Settings2 className="w-2.5 h-2.5" />
                      <span>ปรับยอด</span>
                    </button>
                  )}
                </div>

                {/* Option 2: ชำระครบ 100% */}
                <div
                  onClick={() => setPaymentStatus('paid')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentStatus === 'paid'
                      ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-1 ring-emerald-500 text-emerald-950'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <CreditCard className={`w-5 h-5 mx-auto mb-1 ${paymentStatus === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold block">ชำระครบ 100%</span>
                  <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                    ฿{grandTotal.toLocaleString()}
                  </span>
                </div>

                {/* Option 3: รอเก็บเงิน */}
                <div
                  onClick={() => setPaymentStatus('pending')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                    paymentStatus === 'pending'
                      ? 'bg-slate-100 border-slate-500 shadow-xs ring-1 ring-slate-500 text-slate-900'
                      : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <Clock className={`w-5 h-5 mx-auto mb-1 ${paymentStatus === 'pending' ? 'text-slate-700' : 'text-slate-400'}`} />
                  <span className="text-xs font-bold block">รอเก็บเงิน</span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    เก็บวันเข้าพัก
                  </span>
                </div>
              </div>

              {/* Deposit Active Summary Line */}
              {paymentStatus === 'deposit' && (
                <div className="p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center justify-between text-xs">
                  <span className="text-amber-950 font-medium">
                    รับเงินมัดจำ: <strong className="text-amber-900 font-bold">฿{depositAmount.toLocaleString()}</strong>
                  </span>
                  <span className="text-slate-600 text-[11px]">
                    เหลือเก็บวันพัก: <strong className="text-slate-900 font-bold">฿{remainingAtCheckin.toLocaleString()}</strong>
                  </span>
                </div>
              )}
            </div>

            {/* 4. Notes (Optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                หมายเหตุเพิ่มเติม (ถ้ามี)
              </label>
              <input
                type="text"
                placeholder="เช่น ขอเตาปิ้งย่าง หรือขอเช็คอินเร็ว"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white shadow-xs font-medium"
              />
            </div>

            {/* Bottom Step 2 Actions */}
            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>ยืนยันบันทึกจอง (รับ ฿{effectivePaid.toLocaleString()})</span>
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* POP-UP: กำหนดยอดเงินมัดจำล่วงหน้า (Deposit Customizer Modal)                  */}
        {/* ========================================================================= */}
        {isDepositModalOpen && (
          <div 
            onClick={() => setIsDepositModalOpen(false)}
            className="fixed inset-0 z-60 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in"
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
                  onClick={() => setIsDepositModalOpen(false)}
                  className="w-6 h-6 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Quick Percentage Presets */}
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                <button
                  type="button"
                  onClick={() => handleSetDepositPercent(50)}
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
                  onClick={() => handleSetDepositPercent(30)}
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
                  onClick={() => handleSetDepositPercent(20)}
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
                  onClick={() => setDepositAmount(roomPricePerNight)}
                  className={`p-2 rounded-xl font-bold border transition-all cursor-pointer text-center ${
                    depositAmount === roomPricePerNight
                      ? 'bg-amber-500 text-white border-amber-600 shadow-xs'
                      : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-amber-50'
                  }`}
                >
                  <span className="block">ค่าห้อง 1 คืน</span>
                  <span className="text-[10px] font-normal opacity-90">฿{roomPricePerNight.toLocaleString()}</span>
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
                onClick={() => setIsDepositModalOpen(false)}
                className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
              >
                ✓ ยืนยันยอดมัดจำ ฿{depositAmount.toLocaleString()}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
