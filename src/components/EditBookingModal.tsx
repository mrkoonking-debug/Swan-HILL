import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  Check, 
  User, 
  Phone, 
  Home, 
  UtensilsCrossed, 
  Plus, 
  Minus,
  FileText,
  AlertCircle
} from 'lucide-react';
import type { Room, Booking, AddOnItem, PaymentStatus } from '../types/pms';
import { HouseLogo } from './HouseLogo';
import { ThaiDatePicker } from './ThaiDatePicker';
import { shiftDateStr } from '../utils/dateUtils';

interface EditBookingModalProps {
  booking: Booking | null;
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings?: Booking[];
  onSaveEdit: (updatedBooking: Booking, oldRoomId: string) => void;
}

export const EditBookingModal: React.FC<EditBookingModalProps> = ({
  booking,
  isOpen,
  onClose,
  rooms,
  bookings: _bookings = [],
  onSaveEdit,
}) => {
  if (!isOpen || !booking) return null;

  const [guestName, setGuestName] = useState(booking.guestName);
  const [guestPhone, setGuestPhone] = useState(booking.guestPhone);
  const [totalGuests, setTotalGuests] = useState(booking.totalGuests || 2);
  const [selectedRoomId, setSelectedRoomId] = useState(booking.roomId);
  const [checkInDate, setCheckInDate] = useState(booking.checkInDate);
  const [checkOutDate, setCheckOutDate] = useState(booking.checkOutDate);
  const [checkInTime, setCheckInTime] = useState(booking.checkInTime || '14:00');
  const [checkOutTime, setCheckOutTime] = useState(booking.checkOutTime || '12:00');
  const [roomPrice, setRoomPrice] = useState(booking.roomPrice);
  const [paidAmount, setPaidAmount] = useState(booking.paidAmount || 0);
  const [specialRequests, setSpecialRequests] = useState(booking.specialRequests || '');
  
  // Add-ons
  const [mookataLargeQty, setMookataLargeQty] = useState(0);
  const [mookataSmallQty, setMookataSmallQty] = useState(0);
  const [breakfastQty, setBreakfastQty] = useState(0);
  const [extraBedQty, setExtraBedQty] = useState(0);

  useEffect(() => {
    if (booking) {
      setGuestName(booking.guestName);
      setGuestPhone(booking.guestPhone);
      setTotalGuests(booking.totalGuests || 2);
      setSelectedRoomId(booking.roomId);
      setCheckInDate(booking.checkInDate);
      setCheckOutDate(booking.checkOutDate);
      setCheckInTime(booking.checkInTime || '14:00');
      setCheckOutTime(booking.checkOutTime || '12:00');
      setRoomPrice(booking.roomPrice);
      setPaidAmount(booking.paidAmount || 0);
      setSpecialRequests(booking.specialRequests || '');

      // Load initial add-ons count
      let mL = 0;
      let mS = 0;
      let bf = 0;
      let eb = 0;
      booking.addOns?.forEach(a => {
        if (a.category === 'mookata_large') mL += a.quantity;
        else if (a.category === 'mookata_small') mS += a.quantity;
        else if (a.category === 'breakfast') bf += a.quantity;
        else if (a.category === 'bed') eb += a.quantity;
      });
      setMookataLargeQty(mL);
      setMookataSmallQty(mS);
      setBreakfastQty(bf);
      setExtraBedQty(eb);
    }
  }, [booking]);

  // Selected Room Details
  const currentSelectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms.find(r => r.roomNumber === booking.roomNumber);

  // When room changes, automatically prompt/update room price
  const handleRoomChange = (newRoomId: string) => {
    setSelectedRoomId(newRoomId);
    const targetRoom = rooms.find(r => r.id === newRoomId);
    if (targetRoom) {
      setRoomPrice(targetRoom.pricePerNight);
    }
  };

  // Calculate Nights
  const calculateNights = (cin: string, cout: string): number => {
    if (!cin || !cout) return 1;
    const d1 = new Date(cin + 'T00:00:00');
    const d2 = new Date(cout + 'T00:00:00');
    const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(1, diff);
  };

  const totalNights = calculateNights(checkInDate, checkOutDate);

  // Calculate AddOns & Grand Total
  const mookataLargeTotal = mookataLargeQty * 500;
  const mookataSmallTotal = mookataSmallQty * 350;
  const breakfastTotal = breakfastQty * 60;
  const extraBedTotal = extraBedQty * 300 * totalNights;

  const addOnsTotal = mookataLargeTotal + mookataSmallTotal + breakfastTotal + extraBedTotal;
  const totalRoomCost = roomPrice * totalNights;
  const grandTotal = totalRoomCost + addOnsTotal;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!guestName.trim()) {
      alert('กรุณากรอกชื่อลูกค้า');
      return;
    }

    const room = currentSelectedRoom || rooms[0];
    const newAddOns: AddOnItem[] = [];

    if (mookataLargeQty > 0) {
      newAddOns.push({
        id: 'addon-ml-' + Date.now(),
        name: 'หมูกระทะชุดใหญ่ (500.-)',
        category: 'mookata_large',
        price: 500,
        quantity: mookataLargeQty,
        createdAt: new Date().toISOString(),
      });
    }
    if (mookataSmallQty > 0) {
      newAddOns.push({
        id: 'addon-ms-' + Date.now(),
        name: 'หมูกระทะชุดเล็ก (350.-)',
        category: 'mookata_small',
        price: 350,
        quantity: mookataSmallQty,
        createdAt: new Date().toISOString(),
      });
    }
    if (breakfastQty > 0) {
      newAddOns.push({
        id: 'addon-bf-' + Date.now(),
        name: 'อาหารเช้าเพิ่ม',
        category: 'breakfast',
        price: 60,
        quantity: breakfastQty,
        createdAt: new Date().toISOString(),
      });
    }
    if (extraBedQty > 0) {
      newAddOns.push({
        id: 'addon-bed-' + Date.now(),
        name: `เสริมเตียง (${totalNights} คืน)`,
        category: 'bed',
        price: 300 * totalNights,
        quantity: extraBedQty,
        createdAt: new Date().toISOString(),
      });
    }

    const effectivePaid = Math.max(0, paidAmount);
    const newPaymentStatus: PaymentStatus = effectivePaid >= grandTotal 
      ? 'paid' 
      : (effectivePaid > 0 ? 'deposit' : 'pending');

    const updatedBooking: Booking = {
      ...booking,
      guestName: guestName.trim(),
      guestPhone: guestPhone.trim(),
      totalGuests: totalGuests || 2,
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomType: room.type,
      roomPrice: roomPrice,
      checkInDate,
      checkOutDate,
      checkInTime,
      checkOutTime,
      totalNights,
      addOns: newAddOns,
      totalAmount: grandTotal,
      paidAmount: effectivePaid,
      paymentStatus: newPaymentStatus,
      specialRequests: specialRequests.trim() || undefined,
    };

    onSaveEdit(updatedBooking, booking.roomId);
    onClose();
  };

  const isRoomChanged = selectedRoomId !== booking.roomId;

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in duration-200 font-['Prompt']"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <FileText className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>แก้ไขข้อมูลการจอง</span>
              </h3>
              <p className="text-xs text-emerald-100">
                รหัส {booking.bookingCode} &bull; เปลี่ยนห้อง, วันที่, หรือข้อมูลลูกค้าได้ทันที
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

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800">
          
          {/* 1. ROOM SELECTION (The user's key issue: mistakenly picked S5 instead of S1) */}
          <div className={`p-4 rounded-2xl border transition-all ${
            isRoomChanged 
              ? 'bg-amber-50/70 border-amber-300' 
              : 'bg-slate-50 border-slate-200'
          }`}>
            <label className="font-bold text-slate-900 flex items-center justify-between mb-2">
              <span className="flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-600" />
                <span>เลือกบ้านพัก (ห้องพัก)</span>
              </span>
              {isRoomChanged && (
                <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded-md">
                  ย้ายจากบ้าน {booking.roomNumber} &rarr; {currentSelectedRoom?.roomNumber}
                </span>
              )}
            </label>

            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {rooms.map(r => {
                const isSelected = r.id === selectedRoomId;
                const isOriginal = r.id === booking.roomId;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => handleRoomChange(r.id)}
                    className={`p-2.5 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                      isSelected
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <HouseLogo roomNumber={r.roomNumber} size="sm" />
                    <span className="font-bold text-xs mt-1">บ้าน {r.roomNumber}</span>
                    <span className={`text-[10px] ${isSelected ? 'text-emerald-100' : 'text-slate-500'}`}>
                      ฿{r.pricePerNight.toLocaleString()}
                    </span>
                    {isOriginal && (
                      <span className="absolute -top-1.5 -right-1 text-[8px] bg-slate-800 text-white px-1 rounded-full">
                        เดิม
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {isRoomChanged && (
              <div className="mt-2.5 p-2 bg-amber-100/70 rounded-xl text-[11px] text-amber-900 flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                <span>ระบบจะปลดล็อค <strong>บ้าน {booking.roomNumber}</strong> ให้กลับมาว่าง และย้ายการจองนี้ไป <strong>บ้าน {currentSelectedRoom?.roomNumber}</strong> แทนครับ</span>
              </div>
            )}
          </div>

          {/* 2. DATES & TIME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <ThaiDatePicker
              label="วันที่เช็คอิน (เข้าพัก)"
              value={checkInDate}
              onChange={(val) => {
                setCheckInDate(val);
                if (val >= checkOutDate) {
                  setCheckOutDate(shiftDateStr(val, 1));
                }
              }}
            />

            <ThaiDatePicker
              label="วันที่เช็คเอาท์ (ออก)"
              value={checkOutDate}
              onChange={(val) => {
                if (val > checkInDate) {
                  setCheckOutDate(val);
                }
              }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                เวลาเข้าพักโดยประมาณ:
              </label>
              <input
                type="time"
                value={checkInTime}
                onChange={(e) => setCheckInTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none"
              />
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                เวลาออกโดยประมาณ:
              </label>
              <input
                type="time"
                value={checkOutTime}
                onChange={(e) => setCheckOutTime(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                จำนวนผู้เข้าพัก:
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="1"
                  max="15"
                  value={totalGuests}
                  onChange={(e) => setTotalGuests(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none"
                />
                <span className="text-xs text-slate-500 shrink-0">ท่าน</span>
              </div>
            </div>
          </div>

          {/* 3. GUEST INFO */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                ชื่อผู้เข้าพัก / ผู้จอง:
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="เช่น คุณสมศรี ใจดี"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                เบอร์โทรศัพท์ติดต่อ:
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  value={guestPhone}
                  onChange={(e) => setGuestPhone(e.target.value)}
                  placeholder="08X-XXX-XXXX"
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          {/* 4. ADD-ONS ADJUSTMENT (Mookata, Breakfast, Extra Bed) */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
            <label className="font-bold text-slate-800 flex items-center justify-between text-xs">
              <span className="flex items-center gap-1.5">
                <UtensilsCrossed className="w-4 h-4 text-amber-600" />
                <span>หมูกระทะและบริการเสริม</span>
              </span>
              <span className="text-emerald-700 font-bold">
                รวมเสริม: ฿{addOnsTotal.toLocaleString()}
              </span>
            </label>

            <div className="grid grid-cols-2 gap-2">
              {/* Mookata Large */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">หมูกระทะชุดใหญ่</div>
                  <div className="text-[10px] text-amber-600 font-semibold">฿500 / ชุด</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMookataLargeQty(Math.max(0, mookataLargeQty - 1))}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3 h-3 text-slate-600" />
                  </button>
                  <span className="w-4 text-center font-bold text-xs">{mookataLargeQty}</span>
                  <button
                    type="button"
                    onClick={() => setMookataLargeQty(mookataLargeQty + 1)}
                    className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Mookata Small */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">หมูกระทะชุดเล็ก</div>
                  <div className="text-[10px] text-amber-600 font-semibold">฿350 / ชุด</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setMookataSmallQty(Math.max(0, mookataSmallQty - 1))}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3 h-3 text-slate-600" />
                  </button>
                  <span className="w-4 text-center font-bold text-xs">{mookataSmallQty}</span>
                  <button
                    type="button"
                    onClick={() => setMookataSmallQty(mookataSmallQty + 1)}
                    className="w-6 h-6 rounded-lg bg-amber-500 hover:bg-amber-600 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Extra Bed */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">เสริมเตียง</div>
                  <div className="text-[10px] text-slate-500">฿300 / คืน</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setExtraBedQty(Math.max(0, extraBedQty - 1))}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3 h-3 text-slate-600" />
                  </button>
                  <span className="w-4 text-center font-bold text-xs">{extraBedQty}</span>
                  <button
                    type="button"
                    onClick={() => setExtraBedQty(extraBedQty + 1)}
                    className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Breakfast */}
              <div className="bg-white p-2.5 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-xs text-slate-800">อาหารเช้าเพิ่ม</div>
                  <div className="text-[10px] text-slate-500">฿60 / ท่าน</div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setBreakfastQty(Math.max(0, breakfastQty - 1))}
                    className="w-6 h-6 rounded-lg bg-slate-100 hover:bg-slate-200 flex items-center justify-center cursor-pointer"
                  >
                    <Minus className="w-3 h-3 text-slate-600" />
                  </button>
                  <span className="w-4 text-center font-bold text-xs">{breakfastQty}</span>
                  <button
                    type="button"
                    onClick={() => setBreakfastQty(breakfastQty + 1)}
                    className="w-6 h-6 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 5. FINANCIAL & DEPOSIT ADJUSTMENT */}
          <div className="p-3.5 bg-slate-900 text-white rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800 text-xs">
              <span className="text-slate-400">สรุปคำนวณราคาใหม่:</span>
              <span className="font-bold text-emerald-400">
                ค่าห้อง ฿{roomPrice.toLocaleString()} &times; {totalNights} คืน = ฿{totalRoomCost.toLocaleString()}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-slate-400 block mb-1">
                  ยอดรวมสุทธิ (Grand Total):
                </label>
                <div className="text-lg font-bold text-white">
                  ฿{grandTotal.toLocaleString()}
                </div>
              </div>

              <div>
                <label className="text-[11px] text-emerald-400 font-bold block mb-1">
                  ยอดเงินมัดจำ/ที่ชำระแล้ว:
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">฿</span>
                  <input
                    type="number"
                    min="0"
                    value={paidAmount}
                    onChange={(e) => setPaidAmount(parseFloat(e.target.value) || 0)}
                    className="w-full pl-7 pr-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300 focus:border-emerald-400 outline-none"
                  />
                </div>
                <div className="text-[10px] text-slate-400 mt-1">
                  {grandTotal - paidAmount > 0 ? (
                    <span className="text-amber-400">ค้างชำระ: ฿{(grandTotal - paidAmount).toLocaleString()}</span>
                  ) : (
                    <span className="text-emerald-400">✓ ชำระครบแล้ว</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* 6. SPECIAL REQUESTS */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              หมายเหตุ / คำขอพิเศษ:
            </label>
            <input
              type="text"
              value={specialRequests}
              onChange={(e) => setSpecialRequests(e.target.value)}
              placeholder="เช่น ขอหมอนเพิ่ม, เข้าพักดึก ฯลฯ"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs outline-none focus:border-slate-400"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer text-center"
            >
              ยกเลิก
            </button>

            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/20 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Check className="w-4 h-4 stroke-2" />
              <span>บันทึกการแก้ไขข้อมูล</span>
            </button>
          </div>

        </form>
      </div>
    </div>,
    document.body
  );
};
