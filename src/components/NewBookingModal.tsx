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
  Coins
} from 'lucide-react';
import type { Room, Booking, PaymentStatus, AddOnItem } from '../types/pms';
import { CustomDropdown, type DropdownOption } from './CustomDropdown';
import { HouseLogo } from './HouseLogo';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { formatLocalDate, shiftDateStr } from '../utils/dateUtils';

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
  }, [prefillRoomId, prefillDate, prefillCheckOutDate, isOpen, rooms]);

  // Update default deposit when grandTotal changes
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

  // Payment Dropdown Options
  const paymentOptions: DropdownOption[] = [
    {
      value: 'deposit',
      label: 'จ่ายเงินมัดจำ (30% / 50% / ระบุเอง)',
      sublabel: `มัดจำ ฿${depositAmount.toLocaleString()} (เหลือชำระวันพัก ฿${remainingAtCheckin.toLocaleString()})`,
      badge: `${depositPercent}%`,
      icon: <Coins className="w-4 h-4 text-amber-600" />
    },
    {
      value: 'paid',
      label: 'ชำระครบเต็มจำนวน 100%',
      sublabel: `฿${grandTotal.toLocaleString()} บาท (ไม่มีค้างชำระ)`,
      badge: '100%',
      icon: <CreditCard className="w-4 h-4 text-emerald-600" />
    },
    {
      value: 'pending',
      label: 'ยังไม่จ่าย (รอเก็บเงินทั้งหมด)',
      sublabel: `รอเก็บยอด ฿${grandTotal.toLocaleString()} บาท`,
      badge: 'ยังไม่จ่าย',
      icon: <CreditCard className="w-4 h-4 text-slate-400" />
    }
  ];

  const sanitizePhoneInput = (val: string) => {
    return val.replace(/[^0-9,\s-]/g, '');
  };

  const handleSetDepositPercent = (percent: number) => {
    const calculated = Math.round(grandTotal * (percent / 100));
    setDepositAmount(calculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !selectedRoom) return;

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
      guestName,
      guestPhone,
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
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overscroll-contain animate-in fade-in font-['Prompt']"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90dvh] sm:max-h-[92vh] flex flex-col overscroll-contain"
      >
        {/* Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="text-base md:text-lg font-bold">บันทึกการจองห้องพัก</h3>
              <p className="text-slate-400 text-xs mt-0.5 font-medium">Swan HILL PMS</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body - Scrollbar Completely Hidden via no-scrollbar */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto no-scrollbar space-y-4 text-slate-800 flex-1 overscroll-contain">
          {/* 1. Guest Name & Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-900 mb-1">
                ชื่อลูกค้า <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="เช่น คุณสมชาย"
                value={guestName}
                onChange={(e) => setGuestName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-medium bg-slate-50 focus:bg-white transition-all shadow-xs"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-900">
                  เบอร์โทรศัพท์ <span className="text-red-500">*</span>
                </label>
                <span className="text-[10px] text-slate-400 font-medium">ใส่ได้ 1-2 เบอร์ (คั่นด้วย , ได้)</span>
              </div>
              <input
                type="text"
                required
                placeholder="เช่น 0812345678, 0899876543"
                value={guestPhone}
                onChange={(e) => setGuestPhone(sanitizePhoneInput(e.target.value))}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-medium bg-slate-50 focus:bg-white transition-all shadow-xs"
              />
            </div>
          </div>

          {/* 2. Choose Room (Custom Apple Liquid Glass Dropdown) */}
          <div>
            <CustomDropdown
              label="เลือกบ้านพัก / ขนาดห้อง *"
              options={roomOptions}
              value={selectedRoomId}
              onChange={(val) => setSelectedRoomId(val)}
            />
          </div>

          {/* 3. Check-in & Check-out Dates */}
          <div className="grid grid-cols-2 gap-3">
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
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-xs"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
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
                  className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white transition-all shadow-xs"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* 4. Add-on Services & Food (Steppers) */}
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                บริการเสริม & อาหารสั่งล่วงหน้า
              </span>
              <span className="text-[10px] text-slate-500 font-medium">กด + เพื่อเพิ่มจำนวน</span>
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
                  className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-black text-xs">{extraBeds}</span>
                <button
                  type="button"
                  onClick={() => setExtraBeds(extraBeds + 1)}
                  className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform"
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
                  className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-black text-xs">{mookataSmall}</span>
                <button
                  type="button"
                  onClick={() => setMookataSmall(mookataSmall + 1)}
                  className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform"
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
                  className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-black text-xs">{mookataLarge}</span>
                <button
                  type="button"
                  onClick={() => setMookataLarge(mookataLarge + 1)}
                  className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>

            {/* Breakfast (+60) */}
            <div className="flex items-center justify-between bg-white p-2 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2">
                <UtensilsCrossed className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-xs font-bold block">อาหารเช้าเพิ่มเติม</span>
                  <span className="text-[10px] text-slate-500">฿60 / ท่าน</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setBreakfast(Math.max(0, breakfast - 1))}
                  className="w-6 h-6 rounded-md bg-slate-100 text-slate-700 flex items-center justify-center font-bold active:scale-90 transition-transform"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-5 text-center font-black text-xs">{breakfast}</span>
                <button
                  type="button"
                  onClick={() => setBreakfast(breakfast + 1)}
                  className="w-6 h-6 rounded-md bg-emerald-600 text-white flex items-center justify-center font-bold active:scale-90 transition-transform"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. Total Calculation Summary Box */}
          <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 space-y-1 text-xs shadow-xs">
            <div className="flex justify-between text-slate-700">
              <span>ค่าห้อง ({selectedRoom?.roomNumber} &bull; {totalNights} คืน):</span>
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

          {/* 6. Payment Status & Flexible Deposit Adjustments */}
          <div className="space-y-2.5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <CustomDropdown
                  label="สถานะการชำระเงิน *"
                  options={paymentOptions}
                  value={paymentStatus}
                  onChange={(val) => setPaymentStatus(val as PaymentStatus)}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  หมายเหตุเพิ่มเติม
                </label>
                <input
                  type="text"
                  placeholder="เช่น ขอเตาปิ้งย่างตอนเย็น"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white shadow-xs font-medium"
                />
              </div>
            </div>

            {/* Flexible Deposit Percent & Amount Selector (when deposit is selected) */}
            {paymentStatus === 'deposit' && (
              <div className="p-3 bg-amber-50/90 rounded-2xl border border-amber-200 space-y-2.5 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 flex items-center gap-1.5">
                    <Coins className="w-3.5 h-3.5 text-amber-700" />
                    กำหนดยอดเงินมัดจำล่วงหน้า:
                  </span>
                  <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-300">
                    มัดจำ {depositPercent}% (฿{depositAmount.toLocaleString()})
                  </span>
                </div>

                {/* Quick Percent Buttons: 50%, 30%, 20%, Room 1 Night */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    type="button"
                    onClick={() => handleSetDepositPercent(50)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      depositPercent === 50
                        ? 'bg-amber-600 text-white font-black shadow-xs'
                        : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    50% ปกติ (฿{Math.round(grandTotal * 0.5).toLocaleString()})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDepositPercent(30)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      depositPercent === 30
                        ? 'bg-amber-600 text-white font-black shadow-xs'
                        : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    30% เริ่มต้น (฿{Math.round(grandTotal * 0.3).toLocaleString()})
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSetDepositPercent(20)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      depositPercent === 20
                        ? 'bg-amber-600 text-white font-black shadow-xs'
                        : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    20% ขั้นต่ำ (฿{Math.round(grandTotal * 0.2).toLocaleString()})
                  </button>

                  <button
                    type="button"
                    onClick={() => setDepositAmount(roomPricePerNight)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                      depositAmount === roomPricePerNight
                        ? 'bg-amber-600 text-white font-black shadow-xs'
                        : 'bg-white text-slate-700 border border-amber-200 hover:bg-amber-100'
                    }`}
                  >
                    ค่าห้อง 1 คืน (฿{roomPricePerNight.toLocaleString()})
                  </button>
                </div>

                {/* Custom Deposit Amount Input */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div>
                    <label className="text-[10px] font-bold text-amber-950 block mb-0.5">ระบุยอดมัดจำเอง (บาท):</label>
                    <div className="relative">
                      <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">฿</span>
                      <input
                        type="number"
                        min={1}
                        max={grandTotal}
                        value={depositAmount}
                        onChange={(e) => setDepositAmount(Number(e.target.value))}
                        className="w-full pl-6 pr-2.5 py-1.5 text-xs font-black text-slate-900 border border-amber-300 rounded-lg outline-none focus:border-amber-600 bg-white"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-white rounded-lg border border-amber-200 flex flex-col justify-center text-right">
                    <span className="text-[9px] text-slate-500 font-bold">คงเหลือเก็บวันเข้าพัก</span>
                    <span className="text-xs font-black text-amber-950">฿{remainingAtCheckin.toLocaleString()} บาท</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Bottom Actions */}
          <div className="pt-2 pb-1 flex gap-2.5">
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
              <span>บันทึกการจอง (รับ ฿{effectivePaid.toLocaleString()})</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
