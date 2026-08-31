import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  ArrowRight, 
  Phone, 
  Calendar, 
  Trash2,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2,
  User,
  MessageCircle,
  FileSpreadsheet
} from 'lucide-react';
import type { Booking, BookingStatus } from '../types/pms';
import { HouseLogo } from './HouseLogo';

interface BookingsViewProps {
  bookings: Booking[];
  searchTerm: string;
  onOpenNewBooking: () => void;
  onCheckInGuest: (bookingId: string) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void; // Move to trash
  onRestoreBooking?: (bookingId: string) => void; // Restore from trash
  onPermanentDeleteBooking?: (bookingId: string) => void; // Delete permanently
}

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  searchTerm,
  onOpenNewBooking,
  onCheckInGuest,
  onCheckOutGuest,
  onCancelBooking,
  onRestoreBooking,
  onPermanentDeleteBooking,
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const trashedBookings = bookings.filter(b => !!b.deletedAt || b.status === 'cancelled');
  const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled');

  const countCheckedIn = activeBookings.filter(b => b.status === 'checked_in').length;
  const countConfirmed = activeBookings.filter(b => b.status === 'confirmed').length;
  const countPaid = activeBookings.filter(b => b.paymentStatus === 'paid').length;
  const countTrash = trashedBookings.length;

  const displayedBookings = (statusFilter === 'trash' ? trashedBookings : activeBookings).filter((b) => {
    const matchesSearch = 
      b.guestName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.guestPhone.includes(searchTerm) ||
      b.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.bookingCode.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'trash') return matchesSearch;
    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'checked_in':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-100 text-blue-800 border border-blue-200">
            <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
            กำลังพักอยู่
          </span>
        );
      case 'confirmed':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
            รอลูกค้ามาเช็คอิน
          </span>
        );
      case 'checked_out':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
            <Check className="w-3 h-3 text-slate-500" />
            เช็คเอาท์ออกแล้ว
          </span>
        );
      case 'cancelled':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-100 text-red-700">
            <Trash2 className="w-3 h-3 text-red-600" />
            อยู่ในถังขยะ
          </span>
        );
    }
  };

  const getDaysRemainingInTrash = (deletedAt?: string) => {
    if (!deletedAt) return 15;
    const deleteTime = new Date(deletedAt).getTime();
    const now = Date.now();
    const diffDays = Math.max(0, 15 - Math.floor((now - deleteTime) / (1000 * 60 * 60 * 24)));
    return diffDays;
  };

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* TOP METRIC STATUS COUNTERS - Apple Glass Finish */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 md:gap-3">
        {/* 1. All Bookings */}
        <div 
          onClick={() => setStatusFilter('all')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
            statusFilter === 'all' 
              ? 'bg-slate-900 text-white border-slate-800 shadow-md' 
              : 'bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 hover:border-slate-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusFilter === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-700'}`}>
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium opacity-80">ทั้งหมด</p>
              <p className="text-lg font-black leading-tight">{activeBookings.length}</p>
            </div>
          </div>
        </div>

        {/* 2. Checked In */}
        <div 
          onClick={() => setStatusFilter('checked_in')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
            statusFilter === 'checked_in' 
              ? 'bg-blue-600 text-white border-blue-600 shadow-md' 
              : 'bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 hover:border-blue-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusFilter === 'checked_in' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600'}`}>
              <User className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium opacity-80">กำลังพัก</p>
              <p className="text-lg font-black leading-tight">{countCheckedIn}</p>
            </div>
          </div>
        </div>

        {/* 3. Confirmed / Waiting */}
        <div 
          onClick={() => setStatusFilter('confirmed')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
            statusFilter === 'confirmed' 
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-md' 
              : 'bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 hover:border-emerald-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusFilter === 'confirmed' ? 'bg-emerald-500 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium opacity-80">รอเช็คอิน</p>
              <p className="text-lg font-black leading-tight">{countConfirmed}</p>
            </div>
          </div>
        </div>

        {/* 4. Paid in Full */}
        <div 
          className="p-3.5 rounded-2xl border bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 flex items-center justify-between shadow-xs"
        >
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium text-slate-500">ชำระครบ</p>
              <p className="text-lg font-black text-slate-900 leading-tight">{countPaid}</p>
            </div>
          </div>
        </div>

        {/* 5. Trash */}
        <div 
          onClick={() => setStatusFilter('trash')}
          className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between col-span-2 sm:col-span-1 ${
            statusFilter === 'trash' 
              ? 'bg-red-600 text-white border-red-600 shadow-md' 
              : 'bg-white/95 backdrop-blur-md text-slate-800 border-slate-200 hover:border-red-300 shadow-xs'
          }`}
        >
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${statusFilter === 'trash' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600'}`}>
              <Trash2 className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[11px] font-medium opacity-80">ถังขยะ</p>
              <p className="text-lg font-black leading-tight">{countTrash}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Action and Filter Tab Bar */}
      <div className="bg-white/95 backdrop-blur-md p-3 md:p-3.5 rounded-2xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
          {[
            { id: 'all', label: `ทั้งหมด (${activeBookings.length})` },
            { id: 'confirmed', label: 'รอลูกค้ามา' },
            { id: 'checked_in', label: 'กำลังพักอยู่' },
            { id: 'checked_out', label: 'เช็คเอาท์แล้ว' },
            { id: 'trash', label: `ถังขยะ (${trashedBookings.length})` },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                statusFilter === tab.id
                  ? (tab.id === 'trash' ? 'bg-red-600 text-white shadow-sm' : 'bg-emerald-600 text-white shadow-sm')
                  : (tab.id === 'trash' ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-200')
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenNewBooking}
          className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm py-2.5 px-4 rounded-xl shadow-sm shadow-emerald-600/20 transition-all shrink-0 active:scale-95"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ สร้างรายการจองใหม่</span>
        </button>
      </div>

      {/* Trash Notice Banner */}
      {statusFilter === 'trash' && (
        <div className="bg-amber-50 border border-amber-200 text-amber-900 px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs">
          <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>รายการในถังขยะจะถูกลบถาวรโดยอัตโนมัติเมื่อครบ 15 วัน หรือกด "ลบทันที" เพื่อลบทิ้งถาวรได้เลยครับ</span>
        </div>
      )}

      {/* APPLE LIQUID LUXURY BOOKING CARDS */}
      <div className="space-y-3">
        {displayedBookings.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-500 shadow-xs">
            <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-sm text-slate-800">
              {statusFilter === 'trash' ? 'ไม่มีรายการในถังขยะ' : 'ไม่พบรายการจอง'}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              {statusFilter === 'trash' ? 'รายการจองที่ถูกยกเลิกจะมาอยู่ที่นี่' : 'กดปุ่มสร้างรายการจองใหม่เพื่อบันทึกลูกค้า'}
            </p>
          </div>
        ) : (
          displayedBookings.map((b) => {
            const initials = b.guestName.replace(/คุณ/g, '').trim().slice(0, 2);

            return (
              <div
                key={b.id}
                className={`bg-white/95 backdrop-blur-md rounded-2xl border p-4 md:p-5 transition-all shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${
                  b.status === 'cancelled' || !!b.deletedAt 
                    ? 'border-red-200 bg-red-50/20' 
                    : 'border-slate-200/90 hover:border-emerald-300'
                }`}
              >
                {/* Section 1: Customer Profile & Booking Code */}
                <div className="flex items-start gap-3 min-w-[240px]">
                  {/* Avatar Circle */}
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-slate-800 to-slate-700 text-white flex items-center justify-center font-bold text-sm shadow-sm shrink-0 border border-slate-700">
                    {initials || <User className="w-5 h-5" />}
                  </div>

                  <div>
                    {/* Booking Code & Timestamp */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-700 font-black text-[11px]">
                        {b.bookingCode}
                      </span>
                      <span className="text-[10px] text-slate-500 font-medium">
                        {b.createdAt ? new Date(b.createdAt).toLocaleDateString('th-TH') : 'วันนี้'}
                      </span>
                    </div>

                    {/* Guest Name */}
                    <h3 className="text-sm md:text-base font-black text-slate-900 mt-0.5">
                      {b.guestName}
                    </h3>

                    {/* Phone & Channel */}
                    <div className="flex items-center gap-2 text-xs text-slate-600 mt-1 flex-wrap font-medium">
                      <a 
                        href={`tel:${b.guestPhone.replace(/[^0-9+]/g, '')}`} 
                        className="flex items-center gap-1 font-bold text-emerald-700 underline"
                      >
                        <Phone className="w-3 h-3 text-emerald-600" />
                        {b.guestPhone}
                      </a>
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md flex items-center gap-1">
                        <MessageCircle className="w-2.5 h-2.5 text-emerald-600" />
                        {b.channel}
                      </span>
                    </div>

                    {statusFilter === 'trash' && (
                      <p className="text-[10px] text-red-600 font-bold mt-1">
                        ลบถาวรอัตโนมัติในอีก {getDaysRemainingInTrash(b.deletedAt)} วัน
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 2: Room Logo Badge & Stay Route Timeline */}
                <div className="flex items-center gap-3.5 bg-slate-50/80 p-3 rounded-2xl border border-slate-100 flex-1 min-w-[280px]">
                  {/* Custom Vector Cream-Brown House Logo */}
                  <HouseLogo roomNumber={b.roomNumber} size="md" />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-1">
                      <span className="text-xs font-bold text-slate-800 truncate">{b.roomType}</span>
                      {getStatusBadge(b.status)}
                    </div>

                    {/* Stay Route: CheckIn -> Nights -> CheckOut */}
                    <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
                      <div className="text-left">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">เข้าพัก</span>
                        <span className="font-bold text-slate-900 text-xs">{b.checkInDate}</span>
                      </div>

                      <div className="flex-1 flex flex-col items-center px-1">
                        <span className="text-[10px] font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mb-0.5 border border-emerald-200">
                          {b.totalNights} คืน
                        </span>
                        <div className="w-full h-[2px] bg-slate-300 relative flex items-center justify-end">
                          <ArrowRight className="w-3 h-3 text-slate-400 -mr-1" />
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 block uppercase font-bold">ออก</span>
                        <span className="font-bold text-slate-900 text-xs">{b.checkOutDate}</span>
                      </div>
                    </div>

                    {b.specialRequests && (
                      <p className="text-[10px] text-amber-900 bg-amber-50 px-2 py-0.5 rounded-md mt-1.5 font-semibold border border-amber-200 truncate">
                        หมายเหตุ: {b.specialRequests}
                      </p>
                    )}
                  </div>
                </div>

                {/* Section 3: Price Breakdown & Action Buttons */}
                <div className="flex sm:flex-col lg:flex-row items-center justify-between lg:justify-end gap-3 min-w-[200px] pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
                  {/* Price */}
                  <div className="text-left sm:text-right">
                    <span className="text-[10px] text-slate-500 font-bold block uppercase">ยอดรวม</span>
                    <span className="text-base md:text-lg font-black text-emerald-800">
                      ฿{b.totalAmount.toLocaleString()}
                    </span>
                    <span className="text-[10px] block font-bold text-emerald-600">
                      {b.paymentStatus === 'paid' ? 'ชำระเต็มแล้ว' : (b.paymentStatus === 'deposit' ? `มัดจำ ฿${b.paidAmount.toLocaleString()}` : 'รอชำระ')}
                    </span>
                  </div>

                  {/* Actions */}
                  {statusFilter !== 'trash' ? (
                    <div className="flex items-center gap-1.5">
                      {b.status === 'confirmed' && (
                        <button
                          onClick={() => onCheckInGuest(b.id)}
                          className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>เช็คอิน</span>
                        </button>
                      )}

                      {b.status === 'checked_in' && (
                        <button
                          onClick={() => onCheckOutGuest(b.id)}
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                        >
                          <ArrowRight className="w-3.5 h-3.5" />
                          <span>เช็คเอาท์</span>
                        </button>
                      )}

                      {/* Move to Trash */}
                      <button
                        onClick={() => onCancelBooking(b.id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="ย้ายไปถังขยะ"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => onRestoreBooking && onRestoreBooking(b.id)}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                        title="กู้คืนรายการจองนี้"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>กู้คืน</span>
                      </button>
                      <button
                        onClick={() => onPermanentDeleteBooking && onPermanentDeleteBooking(b.id)}
                        className="px-2.5 py-2 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                        title="ลบถาวรทันที"
                      >
                        <span>ลบทันที</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
