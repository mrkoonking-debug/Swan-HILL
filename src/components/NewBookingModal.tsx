import React, { useState, useEffect } from 'react';
import { X, Check, FileText, Plus, Minus, CreditCard } from 'lucide-react';
import type { Room, Booking, PaymentStatus, AddOnItem } from '../types/pms';
import { 
  ExtraBedIcon, 
  MookataSmallIcon, 
  MookataLargeIcon, 
  BreakfastIcon 
} from './MenuIcons';
import { CustomDropdown, type DropdownOption } from './CustomDropdown';
import { HouseLogo } from './HouseLogo';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  onAddBooking: (booking: Booking) => void;
  prefillRoomId?: string;
  prefillDate?: string;
}

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  onAddBooking,
  prefillRoomId,
  prefillDate,
}) => {
  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || 'room-s1');
  const [checkInDate, setCheckInDate] = useState('2026-09-01');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-02');
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');

  // Add-ons state during booking
  const [extraBeds, setExtraBeds] = useState(0);
  const [mookataSmall, setMookataSmall] = useState(0);
  const [mookataLarge, setMookataLarge] = useState(0);
  const [breakfast, setBreakfast] = useState(0);

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  useEffect(() => {
    if (prefillRoomId) {
      setSelectedRoomId(prefillRoomId);
    }
    if (prefillDate) {
      setCheckInDate(prefillDate);
      const nextDay = new Date(prefillDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay.toISOString().slice(0, 10));
    }
  }, [prefillRoomId, prefillDate, isOpen, rooms]);

  if (!isOpen) return null;

  // Calculate nights
  const dIn = new Date(checkInDate);
  const dOut = new Date(checkOutDate);
  const diffTime = dOut.getTime() - dIn.getTime();
  const totalNights = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  // Calculate Totals
  const roomPricePerNight = selectedRoom?.pricePerNight || 1200;
  const roomBaseTotal = roomPricePerNight * totalNights;
  const addOnsTotal = (extraBeds * 300) + (mookataSmall * 350) + (mookataLarge * 500) + (breakfast * 60);
  const grandTotal = roomBaseTotal + addOnsTotal;

  // Room Dropdown Options
  const roomOptions: DropdownOption[] = rooms.map(r => ({
    value: r.id,
    label: `[${r.roomNumber}] ${r.name}`,
    sublabel: r.type,
    badge: `฿${r.pricePerNight.toLocaleString()}/คืน`,
    icon: <HouseLogo roomNumber={r.roomNumber} size="sm" />
  }));

  // Payment Dropdown Options
  const paymentOptions: DropdownOption[] = [
    {
      value: 'paid',
      label: 'ชำระครบแล้ว',
      sublabel: `฿${grandTotal.toLocaleString()} บาท`,
      badge: 'ชำระครบ',
      icon: <CreditCard className="w-4 h-4 text-emerald-600" />
    },
    {
      value: 'deposit',
      label: 'จ่ายมัดจำเฉพาะค่าห้อง',
      sublabel: `฿${roomBaseTotal.toLocaleString()} บาท (เหลือเก็บตอนเช็คเอาท์ ฿${addOnsTotal.toLocaleString()})`,
      badge: 'มัดจำ',
      icon: <CreditCard className="w-4 h-4 text-amber-600" />
    },
    {
      value: 'pending',
      label: 'ยังไม่จ่าย (รอเก็บเงิน)',
      sublabel: `รอเก็บยอด ฿${grandTotal.toLocaleString()} บาท`,
      badge: 'ยังไม่ชำระ',
      icon: <CreditCard className="w-4 h-4 text-slate-400" />
    }
  ];

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

    const newBooking: Booking = {
      id: 'b-' + Date.now(),
      bookingCode: 'BK-' + Math.floor(1000 + Math.random() * 9000),
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
      paidAmount: paymentStatus === 'paid' ? grandTotal : (paymentStatus === 'deposit' ? roomBaseTotal : 0),
      paymentStatus,
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
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
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
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto no-scrollbar space-y-4 text-slate-800 flex-1">
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
              <label className="block text-xs font-bold text-slate-900 mb-1">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                required
                placeholder="เช่น 0812345678"
                value={guestPhone}
                onChange={(e) => setGuestPhone(e.target.value)}
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

          {/* 3. Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันเข้าพัก
              </label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-semibold bg-slate-50 shadow-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันออก ({totalNights} คืน)
              </label>
              <input
                type="date"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-semibold bg-slate-50 shadow-xs"
              />
            </div>
          </div>

          {/* 4. บริการเสริมตอนจอง (Add-on Services with Custom SVG Icons) */}
          <div className="p-3.5 rounded-2xl bg-slate-50/80 border border-slate-200 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                บริการเสริม & อาหาร (เลือกเพิ่มได้)
              </label>
              <span className="text-[10px] text-slate-500 font-medium">ยังไม่รวมในค่าห้อง</span>
            </div>

            {/* Extra Bed (+300) */}
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-800 flex items-center justify-center">
                  <ExtraBedIcon size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">ที่นอนเสริม</span>
                  <span className="text-[10px] font-bold text-amber-700">+฿300/ท่าน</span>
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
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-800 flex items-center justify-center">
                  <MookataSmallIcon size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">หมูกระทะชุดเล็ก</span>
                  <span className="text-[10px] font-bold text-orange-700">+฿350/ชุด</span>
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
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-red-50 text-red-800 flex items-center justify-center">
                  <MookataLargeIcon size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">หมูกระทะชุดใหญ่</span>
                  <span className="text-[10px] font-bold text-red-700">+฿500/ชุด</span>
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
            <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-slate-200/80 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-800 flex items-center justify-center">
                  <BreakfastIcon size={18} />
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 block leading-tight">อาหารเช้า</span>
                  <span className="text-[10px] font-bold text-teal-700">+฿60/ท่าน</span>
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

          {/* 6. Payment Status (Custom Apple Liquid Glass Dropdown) & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <CustomDropdown
                label="การชำระเงิน *"
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
                className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white shadow-xs"
              />
            </div>
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
              <span>บันทึกการจอง</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
