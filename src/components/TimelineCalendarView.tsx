import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  Plus, 
  CreditCard, 
  Receipt,
  Users,
  LayoutGrid,
  ListFilter,
  UtensilsCrossed,
  X,
  Phone,
  ChevronRight as ArrowRightIcon,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import type { Room, Booking } from '../types/pms';
import { formatThaiDate, THAI_MONTHS_FULL } from '../utils/dateUtils';
import { HouseLogo } from './HouseLogo';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

interface TimelineCalendarViewProps {
  rooms: Room[];
  bookings: Booking[];
  onOpenNewBookingWithPrefill?: (roomId: string, date: string) => void;
  onOpenCloneBooking?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onOpenAddPayment?: (booking: Booking) => void;
  onOpenAddOrder?: (booking: Booking) => void;
}

export const TimelineCalendarView: React.FC<TimelineCalendarViewProps> = ({
  rooms,
  bookings,
  onOpenNewBookingWithPrefill,
  onOpenCloneBooking,
  onOpenReceipt,
  onOpenAddPayment,
  onOpenAddOrder,
}) => {
  const [selectedDateModal, setSelectedDateModal] = useState<string | null>(null);
  const [selectedBookingModal, setSelectedBookingModal] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');

  useLockBodyScroll(!!selectedDateModal || !!selectedBookingModal);

  // Strictly order rooms: S1, S2 -> S3, S4 -> S5, S6 (Memoized)
  const orderedRooms = useMemo(() => {
    const order = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    return [...rooms].sort((a, b) => order.indexOf(a.roomNumber) - order.indexOf(b.roomNumber));
  }, [rooms]);

  // Dynamic viewing month/year state (Default to Sept 2026 if bookings exist there, else current month)
  const [viewDate, setViewDate] = useState<Date>(() => {
    const now = new Date();
    const hasSept = bookings.some(b => b.checkInDate.startsWith('2026-09') && !b.deletedAt);
    if (hasSept) return new Date(2026, 8, 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed (0=Jan, 8=Sept)
  const currentMonthYear = `${THAI_MONTHS_FULL[month]} ${year + 543}`;

  const handlePrevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };
  const handleNextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };
  const handleResetToCurrentMonth = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
  };

  const todayStr = useMemo(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
  }, []);

  // Memoize Month Grid Cells & Timeline Days calculation
  const { calendarCells, timelineDays } = useMemo(() => {
    const startDayOfWeek = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const cells: ({ day: number; dateStr: string } | null)[] = [];
    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push(null);
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      cells.push({ day: d, dateStr });
    }

    const tDays = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    });

    return { calendarCells: cells, timelineDays: tDays };
  }, [year, month]);

  // Active bookings filter (Memoized)
  const activeBookings = useMemo(() => {
    return bookings.filter(b => b.status !== 'cancelled' && !b.deletedAt);
  }, [bookings]);

  // Precomputed Date Lookup Maps: O(1) Instant Access instead of 370+ iterations per render
  const { bookingsByDate, bookingsByRoomAndDate } = useMemo(() => {
    const byDate = new Map<string, Booking[]>();
    const byRoomAndDate = new Map<string, Booking[]>();

    activeBookings.forEach((b) => {
      const checkIn = new Date(b.checkInDate + 'T00:00:00');
      const checkOut = new Date(b.checkOutDate + 'T00:00:00');

      const cur = new Date(checkIn);
      while (cur < checkOut) {
        const y = cur.getFullYear();
        const m = String(cur.getMonth() + 1).padStart(2, '0');
        const d = String(cur.getDate()).padStart(2, '0');
        const dStr = `${y}-${m}-${d}`;

        if (!byDate.has(dStr)) byDate.set(dStr, []);
        byDate.get(dStr)!.push(b);

        const rKey1 = `${b.roomId}_${dStr}`;
        const rKey2 = `${b.roomNumber}_${dStr}`;
        if (!byRoomAndDate.has(rKey1)) byRoomAndDate.set(rKey1, []);
        byRoomAndDate.get(rKey1)!.push(b);
        if (rKey1 !== rKey2) {
          if (!byRoomAndDate.has(rKey2)) byRoomAndDate.set(rKey2, []);
          byRoomAndDate.get(rKey2)!.push(b);
        }

        cur.setDate(cur.getDate() + 1);
      }
    });

    return { bookingsByDate: byDate, bookingsByRoomAndDate: byRoomAndDate };
  }, [activeBookings]);

  // Fast O(1) Helpers
  const getBookingsForDate = useCallback((dateStr: string): Booking[] => {
    return bookingsByDate.get(dateStr) || [];
  }, [bookingsByDate]);

  const getAllBookingsForRoomAndDate = useCallback((roomId: string, dateStr: string): Booking[] => {
    return bookingsByRoomAndDate.get(`${roomId}_${dateStr}`) || [];
  }, [bookingsByRoomAndDate]);

  const getBookingForRoomAndDate = useCallback((roomId: string, dateStr: string): Booking | undefined => {
    const list = getAllBookingsForRoomAndDate(roomId, dateStr);
    if (list.length === 0) return undefined;
    if (list.length === 1) return list[0];
    return list.find(b => b.status === 'checked_in') || list.find(b => b.status === 'confirmed') || list[0];
  }, [getAllBookingsForRoomAndDate]);

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-24 md:pb-12 animate-in fade-in duration-500 font-['Prompt'] w-full max-w-full overflow-hidden">
      
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>ปฏิทินห้องพัก Swan HILL Resort</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">
            {currentMonthYear} &bull; แตะที่วันเพื่อดูสรุปและสถานะห้องพัก 6 หลัง
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
          {/* Month Shift Navigation Buttons */}
          <div className="flex items-center gap-0.5 sm:gap-1 bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="เดือนก่อนหน้า"
            >
              <ChevronLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
            <button
              type="button"
              onClick={handleResetToCurrentMonth}
              className="px-2 sm:px-2.5 py-1 text-[11px] sm:text-xs font-semibold text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
              title="กลับมาดูเดือนปัจจุบัน"
            >
              {currentMonthYear}
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1 sm:p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors cursor-pointer"
              title="เดือนถัดไป"
            >
              <ChevronRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </button>
          </div>

          {/* Legend (Desktop) */}
          <div className="hidden lg:flex items-center gap-2.5 text-[11px] font-medium px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs">
            <span className="flex items-center gap-1.5 text-emerald-800">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> ว่างพร้อมจอง
            </span>
            <span className="flex items-center gap-1.5 text-amber-800">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> จ่ายมัดจำ
            </span>
            <span className="flex items-center gap-1.5 text-blue-800">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> จ่ายครบแล้ว
            </span>
          </div>

          {/* Toggle View Mode (Apple Liquid Glass Sliding Capsule) */}
          <LiquidSegmentedControl<'month' | 'timeline'>
            options={[
              { value: 'month', label: 'รายเดือน', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              { value: 'timeline', label: 'ผัง 6 ห้อง', icon: <ListFilter className="w-3.5 h-3.5" /> },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val)}
            variant="emerald"
            size="sm"
          />
        </div>
      </div>

      {/* VIEW 1: CLEAN & COMPACT FULL MONTH CALENDAR GRID (Mobile Zero-Overflow) */}
      {viewMode === 'month' && (
        <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-3xl border border-slate-200/90 p-1 sm:p-5 shadow-[0_8px_30px_rgba(0,0,0,0.04)] w-full max-w-full overflow-hidden">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-2 mb-1 sm:mb-2 text-center">
            {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'].map((dayName, idx) => (
              <div 
                key={dayName} 
                className={`py-1 sm:py-1.5 text-[10px] sm:text-xs font-black rounded-md sm:rounded-lg ${
                  idx === 0 || idx === 6 ? 'text-amber-800 bg-amber-50/50' : 'text-slate-700 bg-slate-50'
                }`}
              >
                <span className="hidden sm:inline">{dayName}</span>
                <span className="sm:hidden">{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][idx]}</span>
              </div>
            ))}
          </div>

          {/* Days Cells Grid (Clean & Compact with Zero Horizontal Overflow) */}
          <div className="grid grid-cols-7 gap-0.5 sm:gap-2">
            {calendarCells.map((cell, idx) => {
              if (!cell) {
                return (
                  <div 
                    key={`empty-${idx}`} 
                    className="min-w-0 h-14 sm:h-20 bg-slate-50/40 rounded-lg sm:rounded-2xl border border-dashed border-slate-200/60"
                  />
                );
              }

              const dayBookings = getBookingsForDate(cell.dateStr);
              const bookedRoomsCount = dayBookings.length;
              const availableRoomsCount = Math.max(0, rooms.length - bookedRoomsCount);
              const isFull = availableRoomsCount === 0;
              const isToday = cell.dateStr === todayStr;

              return (
                <div
                  key={cell.dateStr}
                  onClick={() => setSelectedDateModal(cell.dateStr)}
                  className={`min-w-0 h-14 sm:h-20 p-1 sm:p-2 rounded-lg sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between hover:shadow-md hover:border-emerald-500 select-none group relative overflow-hidden ${
                    isToday ? 'ring-2 ring-emerald-500 ring-offset-1' : ''
                  } ${
                    isFull 
                      ? 'bg-rose-50/40 border-rose-200 hover:bg-rose-50' 
                      : (bookedRoomsCount > 0 ? 'bg-slate-50/90 border-slate-200 hover:bg-white' : 'bg-white border-slate-200/90 hover:bg-emerald-50/30')
                  }`}
                >
                  {/* Top Bar: Day Number & Status Indicator */}
                  <div className="flex items-center justify-between gap-0.5 leading-none">
                    <span className={`text-[11px] sm:text-sm font-black transition-colors shrink-0 leading-none ${
                      isToday ? 'text-emerald-700 font-black' : 'text-slate-900 group-hover:text-emerald-700'
                    }`}>
                      {cell.day}
                    </span>
                    <span className={`text-[7px] sm:text-[10px] font-black px-0.5 sm:px-1.5 py-0.2 sm:py-0.5 rounded shrink-0 whitespace-nowrap leading-none ${
                      isFull 
                        ? 'bg-rose-100 text-rose-800' 
                        : (bookedRoomsCount > 0 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-500')
                    }`}>
                      <span className="sm:hidden">
                        {isFull ? 'เต็ม' : (bookedRoomsCount > 0 ? `ว่าง ${availableRoomsCount}` : 'ว่าง')}
                      </span>
                      <span className="hidden sm:inline">
                        {isFull ? 'เต็ม 6/6' : `ว่าง ${availableRoomsCount}/${rooms.length}`}
                      </span>
                    </span>
                  </div>

                  {/* Room Indicators: Mobile (Micro Badges) */}
                  <div className="flex sm:hidden items-center gap-0.5 flex-wrap overflow-hidden leading-none mt-auto">
                    {bookedRoomsCount === 0 ? (
                      <span className="text-[6.5px] text-slate-400 font-medium truncate block">
                        ว่าง 6 หลัง
                      </span>
                    ) : (
                      <>
                        {dayBookings.slice(0, 2).map((b) => (
                          <span
                            key={b.id}
                            className={`px-0.5 py-0.2 rounded text-[6.5px] font-black leading-none text-white ${
                              b.paidAmount >= b.totalAmount ? 'bg-blue-600' : 'bg-amber-500'
                            }`}
                          >
                            {b.roomNumber}
                          </span>
                        ))}
                        {bookedRoomsCount > 2 && (
                          <span className="text-[6.5px] font-black text-slate-500 leading-none">
                            +{bookedRoomsCount - 2}
                          </span>
                        )}
                      </>
                    )}
                  </div>

                  {/* Room Indicators: Desktop (Standard Pills) */}
                  <div className="hidden sm:flex items-center gap-1 flex-wrap overflow-hidden leading-none">
                    {bookedRoomsCount === 0 ? (
                      <span className="text-[8px] sm:text-[9px] font-bold text-slate-400 opacity-60">
                        ว่างทุกหลัง
                      </span>
                    ) : (
                      <>
                        {dayBookings.slice(0, 3).map((b) => {
                          const isPaid = b.paidAmount >= b.totalAmount;
                          return (
                            <span
                              key={b.id}
                              title={`${b.roomNumber}: ${b.guestName} (${isPaid ? 'จ่ายครบ' : 'มัดจำ'})`}
                              className={`px-1 sm:px-1.5 py-0.5 rounded text-[8px] sm:text-[9px] font-black leading-none whitespace-nowrap ${
                                isPaid 
                                  ? 'bg-blue-600 text-white' 
                                  : 'bg-amber-500 text-white'
                              }`}
                            >
                              {b.roomNumber}
                            </span>
                          );
                        })}
                        {bookedRoomsCount > 3 && (
                          <span className="text-[8px] sm:text-[9px] font-black text-slate-500 leading-none">
                            +{bookedRoomsCount - 3}
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: 6-ROOM TIMELINE MATRIX */}
      {viewMode === 'timeline' && (
        <div className="space-y-2 w-full max-w-full">
          {/* Mobile Swipe Guidance Banner */}
          <div className="sm:hidden flex items-center justify-between px-2.5 py-1.5 bg-emerald-50 text-emerald-800 rounded-xl text-xs font-semibold border border-emerald-200">
            <span className="flex items-center gap-1.5">
              <span className="text-sm">👆</span>
              <span>เลื่อนซ้าย-ขวา เพื่อดูผังห้องและวันที่ทั้งหมด</span>
            </span>
            <span className="text-[10px] bg-white text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-200 font-bold">
              30 วัน
            </span>
          </div>

          <div className="bg-white/95 backdrop-blur-xl rounded-xl sm:rounded-3xl border border-slate-200/90 p-2 sm:p-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] overflow-x-auto no-scrollbar touch-pan-x w-full max-w-full">
            <table className="w-full min-w-[650px] sm:min-w-[700px] text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="sticky left-0 bg-white z-20 py-2 sm:py-2.5 px-2 sm:px-3 text-xs font-black text-slate-900 w-28 sm:w-44 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                    บ้านพัก
                  </th>
                  {timelineDays.map((dStr) => {
                    const date = new Date(dStr);
                    const isTimelineToday = dStr === todayStr;
                    return (
                      <th key={dStr} className={`py-2 px-1 text-center text-xs font-bold ${isTimelineToday ? 'bg-emerald-50/80 text-emerald-800' : 'text-slate-600'}`}>
                        <span className="block text-[10px] text-slate-400">
                          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][date.getDay()]}
                        </span>
                        <span className={`font-black ${isTimelineToday ? 'text-emerald-700 underline decoration-2' : 'text-slate-800'}`}>
                          {date.getDate()}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orderedRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="sticky left-0 bg-white z-10 py-2 sm:py-3 px-2 sm:px-3 border-r border-slate-200 shadow-[2px_0_5px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <HouseLogo roomNumber={room.roomNumber} size="sm" />
                        <div>
                          <span className="font-black text-xs text-slate-900 block">
                            ห้อง {room.roomNumber}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500 font-medium block">
                            ฿{room.pricePerNight.toLocaleString()}/คืน
                          </span>
                        </div>
                      </div>
                    </td>
                  {timelineDays.map((dStr) => {
                    const roomBookings = getAllBookingsForRoomAndDate(room.id, dStr);
                    const booking = getBookingForRoomAndDate(room.id, dStr);

                    return (
                      <td key={dStr} className="py-2 px-1 text-center">
                        {booking ? (
                          <div
                            onClick={() => setSelectedBookingModal(booking)}
                            className={`p-1 rounded-lg border font-bold text-[10px] truncate cursor-pointer hover:scale-105 transition-transform ${
                              booking.status === 'checked_out'
                                ? 'bg-slate-100 border-slate-300 text-slate-700'
                                : 'bg-emerald-100 border-emerald-300 text-emerald-950'
                            }`}
                            title={`คลิกเพื่อดูการจอง: ${booking.guestName} ${roomBookings.length > 1 ? `(มี ${roomBookings.length} รายการจองวันนี้)` : ''}`}
                          >
                            <span className="truncate block font-black">
                              {booking.guestName}
                              {roomBookings.length > 1 && <span className="text-[8px] ml-0.5 text-blue-700 font-extrabold">(+{roomBookings.length - 1})</span>}
                            </span>
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
        </div>
      )}

      {/* LEVEL 2 MODAL: DAILY DAY OVERVIEW (เมื่อกดที่วันใดวันหนึ่งในปฏิทิน) */}
      {selectedDateModal && createPortal(
        <div 
          onClick={() => setSelectedDateModal(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[88dvh] sm:max-h-[90vh] flex flex-col overscroll-contain animate-in slide-in-from-bottom-8 duration-200"
          >
            
            {/* Mobile Bottom Sheet Handle */}
            <div className="pt-2.5 pb-1 bg-slate-900 flex justify-center sm:hidden shrink-0">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            {/* Modal Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center border border-emerald-500/30">
                  <Calendar className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-black">
                    สรุปบ้านพักวันที่ {formatThaiDate(selectedDateModal)}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    ว่าง {Math.max(0, rooms.length - getBookingsForDate(selectedDateModal).length)} หลัง &bull; จองแล้ว {getBookingsForDate(selectedDateModal).length} หลัง
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedDateModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* List of All 6 Rooms on this Date */}
            <div className="p-4 overflow-y-auto no-scrollbar space-y-2.5 flex-1 overscroll-contain">
              {orderedRooms.map((room) => {
                const roomBookings = getAllBookingsForRoomAndDate(room.id, selectedDateModal);
                const activeBooking = roomBookings.find(b => b.status === 'checked_in' || b.status === 'confirmed');
                const checkedOutBooking = roomBookings.find(b => b.status === 'checked_out');

                // Case 1: No bookings at all
                if (roomBookings.length === 0) {
                  return (
                    <div 
                      key={room.id} 
                      className="p-3 bg-slate-50 hover:bg-emerald-50/50 rounded-2xl border border-slate-200 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-900 border border-emerald-300 flex items-center justify-center font-black text-xs shrink-0">
                          {room.roomNumber}
                        </span>
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-slate-900 block truncate">
                            ห้อง {room.roomNumber} - {room.name}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold">
                            🟢 ว่างพร้อมจอง (฿{room.pricePerNight.toLocaleString()}/คืน)
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenNewBookingWithPrefill && selectedDateModal) {
                            onOpenNewBookingWithPrefill(room.id, selectedDateModal);
                          }
                          setSelectedDateModal(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>กดจอง</span>
                      </button>
                    </div>
                  );
                }

                // Case 2: Room was checked out earlier today, but currently vacant for round 2
                if (!activeBooking && checkedOutBooking) {
                  return (
                    <div 
                      key={room.id} 
                      className="p-3 bg-emerald-50/40 hover:bg-emerald-50 rounded-2xl border border-emerald-200 transition-all flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                          {room.roomNumber}
                        </span>
                        <div className="min-w-0">
                          <span className="font-extrabold text-xs text-slate-900 block truncate">
                            ห้อง {room.roomNumber} - {room.name}
                          </span>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] text-emerald-700 font-bold">
                              ✨ เคลียร์ห้องเสร็จแล้ว พร้อมรับรอบ 2 (Walk-in)
                            </span>
                            <span 
                              onClick={() => {
                                setSelectedBookingModal(checkedOutBooking);
                                setSelectedDateModal(null);
                              }}
                              className="text-[9px] text-slate-500 underline hover:text-slate-800 cursor-pointer"
                            >
                              (ดูบิลเดิม: คุณ {checkedOutBooking.guestName})
                            </span>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          if (onOpenNewBookingWithPrefill && selectedDateModal) {
                            onOpenNewBookingWithPrefill(room.id, selectedDateModal);
                          }
                          setSelectedDateModal(null);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shrink-0 shadow-xs flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>จองรอบใหม่</span>
                      </button>
                    </div>
                  );
                }

                // Case 3: Active booking (possibly with previous checkout today as well)
                const booking = activeBooking || checkedOutBooking || roomBookings[0];
                return (
                  <div
                    key={room.id}
                    onClick={() => {
                      setSelectedBookingModal(booking);
                      setSelectedDateModal(null);
                    }}
                    className="p-3 bg-white hover:border-emerald-500 rounded-2xl border-2 border-slate-200 shadow-xs transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black text-xs shrink-0">
                        {room.roomNumber}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-extrabold text-xs text-slate-900 block truncate">
                            ห้อง {room.roomNumber} - {room.name}
                          </span>
                          {checkedOutBooking && activeBooking && (
                            <span className="text-[9px] bg-blue-100 text-blue-900 font-bold px-1 rounded">แขกใหม่คืนนี้</span>
                          )}
                        </div>
                        <span className="text-[10px] text-blue-700 font-semibold truncate block">
                          🔵 พักโดย: คุณ {booking.guestName}
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-2">
                      <div>
                        <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          booking.paidAmount >= booking.totalAmount 
                            ? 'bg-emerald-100 text-emerald-800' 
                            : 'bg-amber-100 text-amber-900'
                        }`}>
                          {booking.paidAmount >= booking.totalAmount ? 'จ่ายครบแล้ว' : `ค้าง ฿${(booking.totalAmount - booking.paidAmount).toLocaleString()}`}
                        </span>
                      </div>
                      <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedDateModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

      {/* LEVEL 3 MODAL: FULL BOOKING, PAYMENT & MOOKATA INSPECTOR (เมื่อกดเลือกบ้านพักนั้น) */}
      {selectedBookingModal && createPortal(
        <div 
          onClick={() => setSelectedBookingModal(null)}
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white text-slate-900 w-full sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[88dvh] sm:max-h-[92vh] flex flex-col overscroll-contain animate-in slide-in-from-bottom-8 duration-200"
          >
            
            {/* Mobile Bottom Sheet Handle */}
            <div className="pt-2.5 pb-1 bg-slate-900 flex justify-center sm:hidden shrink-0">
              <div className="w-12 h-1.5 bg-slate-700 rounded-full" />
            </div>

            {/* Header */}
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm">
                  {selectedBookingModal.roomNumber}
                </span>
                <div>
                  <h3 className="text-base font-black">
                    ห้อง {selectedBookingModal.roomNumber} - {selectedBookingModal.guestName}
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    {selectedBookingModal.bookingCode} &bull; {selectedBookingModal.roomType}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-4 overflow-y-auto no-scrollbar space-y-4 flex-1 overscroll-contain">
              
              {/* Guest Details */}
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-blue-600" /> ชื่อผู้เข้าพัก:
                  </span>
                  <span className="font-black text-slate-900">{selectedBookingModal.guestName}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" /> เบอร์โทรศัพท์:
                  </span>
                  <a href={`tel:${selectedBookingModal.guestPhone}`} className="font-bold text-blue-600 hover:underline">
                    {selectedBookingModal.guestPhone}
                  </a>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" /> ระยะเวลาพัก:
                  </span>
                  <span className="font-bold text-slate-800">
                    {formatThaiDate(selectedBookingModal.checkInDate)} ถึง {formatThaiDate(selectedBookingModal.checkOutDate)} ({selectedBookingModal.totalNights} คืน)
                  </span>
                </div>
              </div>

              {/* Group Booking Badge / Indicator */}
              {selectedBookingModal.groupId && (
                <div className="p-2.5 bg-indigo-50/90 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] text-indigo-700 font-bold block">การจองแบบกลุ่ม (หลายห้อง)</span>
                      <span className="font-black text-indigo-950">
                        บ้าน {selectedBookingModal.groupRoomNumbers?.join(' + ') || 'หลายห้อง'}
                      </span>
                    </div>
                  </div>
                  {selectedBookingModal.groupBookingCode && (
                    <span className="text-[10px] font-mono font-bold bg-white text-indigo-700 px-2 py-0.5 rounded-lg border border-indigo-200">
                      #{selectedBookingModal.groupBookingCode}
                    </span>
                  )}
                </div>
              )}

              {/* Financial Breakdown (เรื่องการจ่ายเงิน & มัดจำ) */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  สรุปรายละเอียดการเงิน & ยอดมัดจำ
                </span>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-xl border border-blue-100">
                    <span className="text-[9px] text-slate-500 font-bold block">ยอดรวมทั้งสิ้น</span>
                    <span className="text-xs font-black text-slate-900">
                      ฿{selectedBookingModal.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-100/90 rounded-xl border border-emerald-200">
                    <span className="text-[9px] text-emerald-800 font-bold block">
                      {selectedBookingModal.paidAmount >= selectedBookingModal.totalAmount ? 'ชำระครบ' : `มัดจำ ${Math.round((selectedBookingModal.paidAmount / selectedBookingModal.totalAmount) * 100)}%`}
                    </span>
                    <span className="text-xs font-black text-emerald-950">
                      ฿{selectedBookingModal.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl border ${selectedBookingModal.totalAmount - selectedBookingModal.paidAmount > 0 ? 'bg-amber-100 border-amber-300' : 'bg-slate-100 border-slate-200'}`}>
                    <span className="text-[9px] text-amber-900 font-bold block">คงเหลือค้างจ่าย</span>
                    <span className="text-xs font-black text-amber-950">
                      ฿{Math.max(0, selectedBookingModal.totalAmount - selectedBookingModal.paidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mookata & Add-ons Section (เรื่องหมูกระทะ / บริการเสริม) */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                    รายการอาหาร & หมูกระทะ & บริการเสริม
                  </span>
                  {onOpenAddOrder && (
                    <button
                      onClick={() => {
                        onOpenAddOrder(selectedBookingModal);
                        setSelectedBookingModal(null);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-black flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> เพิ่มออเดอร์
                    </button>
                  )}
                </div>

                {(!selectedBookingModal.addOns || selectedBookingModal.addOns.length === 0) ? (
                  <p className="text-[11px] text-amber-800 font-medium py-1">
                    ยังไม่มีรายการสั่งหมูกระทะหรือบริการเสริมในห้องนี้
                  </p>
                ) : (
                  <div className="space-y-1">
                    {selectedBookingModal.addOns.map((item) => (
                      <div key={item.id} className="p-1.5 bg-white rounded-xl border border-amber-100 text-xs flex items-center justify-between">
                        <span className="font-bold text-slate-800">{item.name} x {item.quantity}</span>
                        <span className="font-black text-amber-900">฿{(item.price * item.quantity).toLocaleString()} บาท</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                {onOpenCloneBooking && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenCloneBooking(selectedBookingModal);
                      setSelectedBookingModal(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Plus className="w-4 h-4 stroke-[3]" />
                    <span>จองเพิ่มอีกห้องให้ลูกค้ารายนี้ ({selectedBookingModal.guestName})</span>
                  </button>
                )}

                <div className="grid grid-cols-2 gap-2">
                  {onOpenAddPayment && (
                    <button
                      onClick={() => {
                        onOpenAddPayment(selectedBookingModal);
                        setSelectedBookingModal(null);
                      }}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>การชำระเงิน</span>
                    </button>
                  )}

                  {onOpenReceipt && (
                    <button
                      onClick={() => {
                        onOpenReceipt(selectedBookingModal);
                        setSelectedBookingModal(null);
                      }}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>พิมพ์ใบเสร็จรับเงิน</span>
                    </button>
                  )}
                </div>
              </div>

            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
              <button
                onClick={() => setSelectedBookingModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
              >
                ปิดหน้าต่าง
              </button>
            </div>

          </div>
        </div>,
        document.body
      )}

    </div>
  );
};
