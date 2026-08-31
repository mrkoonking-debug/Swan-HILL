import React, { useState, useEffect } from 'react';
import { X, Check, FileText } from 'lucide-react';
import type { Room, Booking, PaymentStatus } from '../types/pms';

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
  const [selectedRoomId, setSelectedRoomId] = useState(rooms[0]?.id || '');
  const [checkInDate, setCheckInDate] = useState('2026-09-01');
  const [checkOutDate, setCheckOutDate] = useState('2026-09-02');
  const [totalAmount, setTotalAmount] = useState<number>(3500);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [notes, setNotes] = useState('');

  const selectedRoom = rooms.find(r => r.id === selectedRoomId) || rooms[0];

  useEffect(() => {
    if (prefillRoomId) {
      setSelectedRoomId(prefillRoomId);
      const r = rooms.find(item => item.id === prefillRoomId);
      if (r) setTotalAmount(r.pricePerNight);
    }
    if (prefillDate) {
      setCheckInDate(prefillDate);
      const nextDay = new Date(prefillDate);
      nextDay.setDate(nextDay.getDate() + 1);
      setCheckOutDate(nextDay.toISOString().slice(0, 10));
    }
  }, [prefillRoomId, prefillDate, isOpen, rooms]);

  useEffect(() => {
    if (selectedRoom) {
      setTotalAmount(selectedRoom.pricePerNight);
    }
  }, [selectedRoomId]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName || !guestPhone || !selectedRoom) return;

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
      totalNights: 1,
      totalGuests: selectedRoom.capacity || 2,
      totalAmount: Number(totalAmount),
      paidAmount: paymentStatus === 'paid' ? Number(totalAmount) : (paymentStatus === 'deposit' ? Math.round(Number(totalAmount) / 2) : 0),
      paymentStatus,
      status: 'confirmed',
      specialRequests: notes || undefined,
      createdAt: new Date().toISOString()
    };

    onAddBooking(newBooking);
    onClose();

    setGuestName('');
    setGuestPhone('');
    setNotes('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white w-full sm:max-w-lg rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="p-4 bg-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            <div>
              <h3 className="text-base md:text-lg font-bold">บันทึกการจองห้องพัก</h3>
              <p className="text-emerald-100 text-xs mt-0.5 font-medium">กรอกข้อมูลลูกค้าเพื่อเปิดการจอง</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-emerald-700/60 hover:bg-emerald-700 flex items-center justify-center text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-3.5 text-slate-800 flex-1">
          {/* 1. Guest Name */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              1. ชื่อลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="พิมพ์ชื่อลูกค้า (เช่น คุณสมชาย)"
              value={guestName}
              onChange={(e) => setGuestName(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-medium bg-slate-50 focus:bg-white"
            />
          </div>

          {/* 2. Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              2. เบอร์โทรศัพท์ลูกค้า <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              required
              placeholder="เช่น 0812345678"
              value={guestPhone}
              onChange={(e) => setGuestPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-medium bg-slate-50 focus:bg-white"
            />
          </div>

          {/* 3. Choose Room */}
          <div>
            <label className="block text-xs font-bold text-slate-900 mb-1">
              3. เลือกบ้านพัก / วิลล่า <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedRoomId}
              onChange={(e) => setSelectedRoomId(e.target.value)}
              className="w-full px-3 py-2.5 text-xs md:text-sm border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold bg-white text-emerald-800"
            >
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  [{r.roomNumber}] {r.name} (฿{r.pricePerNight.toLocaleString()} / คืน)
                </option>
              ))}
            </select>
          </div>

          {/* 4. Dates */}
          <div className="grid grid-cols-2 gap-2.5">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                4. วันเข้าพัก
              </label>
              <input
                type="date"
                required
                value={checkInDate}
                onChange={(e) => setCheckInDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-semibold bg-slate-50"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                วันออก
              </label>
              <input
                type="date"
                required
                value={checkOutDate}
                onChange={(e) => setCheckOutDate(e.target.value)}
                className="w-full px-2.5 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-semibold bg-slate-50"
              />
            </div>
          </div>

          {/* 5. Total Price & Payment */}
          <div className="grid grid-cols-2 gap-2.5 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                5. ยอดเงินรวม (บาท)
              </label>
              <input
                type="number"
                required
                value={totalAmount}
                onChange={(e) => setTotalAmount(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm md:text-base border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-black text-emerald-800 bg-emerald-50/60"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                การจ่ายเงิน
              </label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value as PaymentStatus)}
                className="w-full px-2 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none font-bold bg-white"
              >
                <option value="paid">ชำระครบแล้ว</option>
                <option value="deposit">จ่ายมัดจำแล้ว</option>
                <option value="pending">ยังไม่จ่าย</option>
              </select>
            </div>
          </div>

          {/* 6. Notes */}
          <div>
            <label className="block text-xs font-bold text-slate-500 mb-1">
              หมายเหตุ (ถ้ามี)
            </label>
            <input
              type="text"
              placeholder="เช่น ขอเตียงเสริม, จองจาก LINE"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-slate-50"
            />
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
              className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
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
