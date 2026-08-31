import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus,
  LayoutGrid,
  ListFilter,
  CreditCard,
  Receipt
} from 'lucide-react';
import type { Room, Booking } from '../types/pms';
import { HouseLogo } from './HouseLogo';
import { THAI_MONTHS_FULL, formatThaiDate } from '../utils/dateUtils';

interface TimelineCalendarViewProps {
  rooms: Room[];
  bookings: Booking[];
  onOpenNewBookingWithPrefill?: (roomId: string, date: string) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onOpenAddPayment?: (booking: Booking) => void;
}

export const TimelineCalendarView: React.FC<TimelineCalendarViewProps> = ({
  rooms,
  bookings,
  onOpenNewBookingWithPrefill,
  onOpenReceipt,
  onOpenAddPayment,
}) => {
  // Calendar month state (default to August 2026 / 2569)
  const [currentYear, setCurrentYear] = useState<number>(2026);
  const [currentMonth, setCurrentMonth] = useState<number>(7); // 0-indexed (7 = August)
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');
  const [selectedBookingModal, setSelectedBookingModal] = useState<Booking | null>(null);

  // Month navigation
  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  // Buddhist Year
  const yearBE = currentYear + 543;
  const monthName = THAI_MONTHS_FULL[currentMonth];

  // Calculate calendar grid days
  const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay(); // 0 = Sun, 1 = Mon ...
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();

  // Active bookings filter (non-cancelled, non-trashed)
  const activeBookings = bookings.filter(b => b.status !== 'cancelled' && !b.deletedAt);

  // Helper to find bookings for a specific day string (YYYY-MM-DD)
  const getBookingsForDate = (dateStr: string) => {
    return activeBookings.filter(b => dateStr >= b.checkInDate && dateStr < b.checkOutDate);
  };

  // Helper for Payment Status Badge
  const getPaymentBadge = (booking: Booking) => {
    const roomBaseTotal = booking.roomPrice * booking.totalNights;
    const addOnsTotal = booking.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
    const grandTotal = booking.totalAmount || (roomBaseTotal + addOnsTotal);
    const remaining = Math.max(0, grandTotal - booking.paidAmount);

    if (remaining === 0 || booking.paymentStatus === 'paid') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded border border-emerald-300">
          จ่ายครบ
        </span>
      );
    }
    if (booking.paidAmount > 0 || booking.paymentStatus === 'deposit') {
      return (
        <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-amber-900 bg-amber-100 px-1.5 py-0.2 rounded border border-amber-300">
          มัดจำ (ค้าง ฿{remaining.toLocaleString()})
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-rose-800 bg-rose-100 px-1.5 py-0.2 rounded border border-rose-300">
        ยังไม่จ่าย
      </span>
    );
  };

  // Generate days array for Month View
  const calendarCells = [];
  // Leading empty cells
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  // Days of the month
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    calendarCells.push({ day: d, dateStr });
  }

  // 14-day strip for Timeline View
  const timelineDays = Array.from({ length: 14 }, (_, i) => {
    const d = new Date(currentYear, currentMonth, 1 + i * 2);
    return d.toISOString().slice(0, 10);
  });

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* Top Header: Month Selector & View Switcher */}
      <div className="bg-white/95 backdrop-blur-md p-3 md:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        
        {/* Month Navigation (< สิงหาคม 2569 >) */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevMonth}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            title="เดือนก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 px-3 py-1 bg-slate-50 rounded-xl border border-slate-200">
            <CalendarIcon className="w-4 h-4 text-emerald-600" />
            <span className="text-sm md:text-base font-black text-slate-900">
              {monthName} {yearBE}
            </span>
          </div>

          <button
            onClick={handleNextMonth}
            className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-700 active:scale-95 transition-all"
            title="เดือนถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Legend & View Mode Switcher */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Legend */}
          <div className="hidden lg:flex items-center gap-2 text-[10px] font-bold px-2.5 py-1 bg-slate-50 rounded-xl border border-slate-200">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> จ่ายครบแล้ว</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> จ่ายมัดจำ</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-rose-500"></span> ยังไม่ชำระ</span>
          </div>

          {/* Toggle Button */}
          <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'month' 
                  ? 'bg-emerald-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>ปฏิทินทั้งเดือน</span>
            </button>
            <button
              onClick={() => setViewMode('timeline')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                viewMode === 'timeline' 
                  ? 'bg-emerald-600 text-white shadow-xs font-black' 
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>ผัง 6 ห้องพัก</span>
            </button>
          </div>
        </div>
      </div>

      {/* VIEW 1: FULL MONTH INTERACTIVE CALENDAR GRID */}
      {viewMode === 'month' && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-3 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          {/* Day of Week Headers (อา. จ. อ. พ. พฤ. ศ. ส.) */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-2 text-center">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'].map((dayName, idx) => (
              <div 
                key={dayName} 
                className={`py-1.5 text-xs font-black rounded-lg ${
                  idx === 0 || idx === 6 ? 'text-amber-800 bg-amber-50/50' : 'text-slate-700 bg-slate-50'
                }`}
              >
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][idx]}</span>
              </div>
            ))}
          </div>

          {/* Days Cells Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div 
                    key={`empty-${idx}`} 
                    className="min-h-[90px] sm:min-h-[110px] bg-slate-50/40 rounded-2xl border border-dashed border-slate-200/60"
                  />
                );
              }

              const dayBookings = getBookingsForDate(cell.dateStr);
              const bookedRoomsCount = dayBookings.length;
              const availableRoomsCount = Math.max(0, rooms.length - bookedRoomsCount);
              const isFull = availableRoomsCount === 0;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => {
                    if (onOpenNewBookingWithPrefill) {
                      onOpenNewBookingWithPrefill(rooms[0]?.id || 'room-s1', cell.dateStr);
                    }
                  }}
                  className={`min-h-[90px] sm:min-h-[115px] p-1.5 sm:p-2 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:border-emerald-400 select-none ${
                    isFull 
                      ? 'bg-rose-50/30 border-rose-200' 
                      : (bookedRoomsCount > 0 ? 'bg-slate-50/80 border-slate-200' : 'bg-white border-slate-200/90')
                  }`}
                >
                  {/* Top Bar: Day Number & Available Counter */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-black text-slate-900">
                      {cell.day}
                    </span>
                    <span className={`text-[9px] sm:text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                      isFull 
                        ? 'bg-rose-100 text-rose-800 font-black' 
                        : (bookedRoomsCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500')
                    }`}>
                      {isFull ? 'เต็ม' : `ว่าง ${availableRoomsCount}/${rooms.length}`}
                    </span>
                  </div>

                  {/* Bookings Stack in this Day */}
                  <div className="space-y-1 my-1 flex-1 overflow-y-auto no-scrollbar">
                    {dayBookings.slice(0, 3).map((b) => (
                      <div
                        key={b.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedBookingModal(b);
                        }}
                        className="p-1 rounded-lg bg-white border border-slate-200 text-[10px] shadow-2xs hover:border-emerald-500 transition-colors"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-black text-slate-900 truncate">
                            [{b.roomNumber}] {b.guestName}
                          </span>
                        </div>
                        <div className="mt-0.5">
                          {getPaymentBadge(b)}
                        </div>
                      </div>
                    ))}

                    {dayBookings.length > 3 && (
                      <span className="text-[9px] font-bold text-slate-400 block text-center">
                        +{dayBookings.length - 3} หลัง
                      </span>
                    )}
                  </div>

                  {/* Empty Add Slot */}
                  {bookedRoomsCount === 0 && (
                    <div className="text-[9px] text-slate-400 font-bold flex items-center justify-center gap-0.5 opacity-60">
                      <Plus className="w-2.5 h-2.5" /> จอง
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 6-ROOM TIMELINE MATRIX */}
      {viewMode === 'timeline' && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-x-auto no-scrollbar">
          <table className="w-full min-w-[700px] text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="py-2.5 px-3 text-xs font-black text-slate-900 w-44">บ้านพัก</th>
                {timelineDays.map((dStr) => {
                  const date = new Date(dStr);
                  return (
                    <th key={dStr} className="py-2 px-1 text-center text-xs font-bold text-slate-700 min-w-[50px]">
                      <span className="block font-black text-slate-900">{date.getDate()}</span>
                      <span className="text-[10px] text-slate-400">{THAI_MONTHS_FULL[date.getMonth()].slice(0, 3)}</span>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50">
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <HouseLogo roomNumber={room.roomNumber} size="sm" />
                      <div>
                        <span className="text-xs font-black text-slate-900 block leading-tight">{room.roomNumber}</span>
                        <span className="text-[10px] text-slate-500 font-semibold">{room.type}</span>
                      </div>
                    </div>
                  </td>
                  {timelineDays.map((dStr) => {
                    const booking = activeBookings.find(
                      b => b.roomId === room.id && dStr >= b.checkInDate && dStr < b.checkOutDate
                    );

                    return (
                      <td key={dStr} className="py-2 px-1 text-center">
                        {booking ? (
                          <div
                            onClick={() => setSelectedBookingModal(booking)}
                            className="p-1 rounded-lg bg-emerald-100 border border-emerald-300 text-emerald-950 font-bold text-[10px] truncate cursor-pointer hover:scale-105 transition-transform"
                            title={`คลิกเพื่อดูการจอง: ${booking.guestName}`}
                          >
                            <span className="truncate block font-black">{booking.guestName}</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => onOpenNewBookingWithPrefill && onOpenNewBookingWithPrefill(room.id, dStr)}
                            className="w-full h-8 rounded-lg bg-slate-50 hover:bg-emerald-50 text-slate-300 hover:text-emerald-700 flex items-center justify-center transition-colors border border-dashed border-slate-200"
                            title="กดจองห้องนี้ในวันนี้"
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Booking Quick Detail Modal (from calendar click) */}
      {selectedBookingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-slate-900 w-full max-w-md rounded-3xl p-5 border border-slate-200 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HouseLogo roomNumber={selectedBookingModal.roomNumber} size="sm" />
                <div>
                  <h3 className="text-base font-black text-slate-900">
                    ห้อง {selectedBookingModal.roomNumber} - {selectedBookingModal.guestName}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">{selectedBookingModal.bookingCode}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 text-xs text-slate-700">
              <div className="flex justify-between">
                <span>วันเข้าพัก - เช็คเอาท์:</span>
                <span className="font-bold text-slate-900">
                  {formatThaiDate(selectedBookingModal.checkInDate)} ถึง {formatThaiDate(selectedBookingModal.checkOutDate)} ({selectedBookingModal.totalNights} คืน)
                </span>
              </div>
              <div className="flex justify-between">
                <span>ยอดเงินรวมทั้งสิ้น:</span>
                <span className="font-black text-emerald-800 text-sm">฿{selectedBookingModal.totalAmount.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between">
                <span>ชำระแล้ว:</span>
                <span className="font-bold text-emerald-700">฿{selectedBookingModal.paidAmount.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between">
                <span>ยอดคงเหลือ:</span>
                <span className="font-bold text-amber-800">
                  ฿{Math.max(0, selectedBookingModal.totalAmount - selectedBookingModal.paidAmount).toLocaleString()} บาท
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 space-y-2">
              {onOpenAddPayment && Math.max(0, selectedBookingModal.totalAmount - selectedBookingModal.paidAmount) > 0 && (
                <button
                  onClick={() => {
                    onOpenAddPayment(selectedBookingModal);
                    setSelectedBookingModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>บันทึกรับเงินที่ค้าง</span>
                </button>
              )}

              {onOpenReceipt && (
                <button
                  onClick={() => {
                    onOpenReceipt(selectedBookingModal);
                    setSelectedBookingModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                >
                  <Receipt className="w-4 h-4 text-emerald-400" />
                  <span>ดูใบเสร็จ / บันทึกภาพสลิป</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
