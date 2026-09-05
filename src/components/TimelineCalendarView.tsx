import React, { useState, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { 
  Calendar, 
  Plus, 
  CreditCard, 
  Receipt, 
  Users, 
  LayoutGrid, 
  CalendarDays, 
  UtensilsCrossed, 
  X, 
  Phone, 
  ChevronRight as ArrowRightIcon, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import type { Room, Booking } from '../types/pms';
import { formatThaiDate, THAI_MONTHS_FULL, formatLocalDate, shiftDateStr } from '../utils/dateUtils';
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
  const [selectedBookingModal, setSelectedBookingModal] = useState<Booking | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  useLockBodyScroll(!!selectedBookingModal);

  // Strictly order rooms: S1, S2 -> S3, S4 -> S5, S6 (Memoized)
  const orderedRooms = useMemo(() => {
    const order = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
    return [...rooms].sort((a, b) => order.indexOf(a.roomNumber) - order.indexOf(b.roomNumber));
  }, [rooms]);

  const todayStr = useMemo(() => formatLocalDate(new Date()), []);

  // Dynamic viewing month/year state (Default to Sept 2026 if bookings exist there, else current month)
  const [viewDate, setViewDate] = useState<Date>(() => {
    const now = new Date();
    const hasSept = bookings.some(b => b.checkInDate.startsWith('2026-09') && !b.deletedAt);
    if (hasSept) return new Date(2026, 8, 1);
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

  // Selected date for Master-Detail inspection in Month View
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const hasSept = bookings.some(b => b.checkInDate.startsWith('2026-09') && !b.deletedAt);
    if (hasSept) return '2026-09-01';
    return todayStr;
  });

  // 7-Day Rolling Window Start Date (defaults to selectedDate or viewDate)
  const [weekStartDateStr, setWeekStartDateStr] = useState<string>(() => {
    const hasSept = bookings.some(b => b.checkInDate.startsWith('2026-09') && !b.deletedAt);
    if (hasSept) return '2026-09-01';
    return todayStr;
  });

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth(); // 0-indexed (0=Jan, 8=Sept)
  const currentMonthYear = `${THAI_MONTHS_FULL[month]} ${year + 543}`;

  const handlePrevMonth = () => {
    const prev = new Date(year, month - 1, 1);
    setViewDate(prev);
    const newDateStr = `${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedDate(newDateStr);
    setWeekStartDateStr(newDateStr);
  };

  const handleNextMonth = () => {
    const next = new Date(year, month + 1, 1);
    setViewDate(next);
    const newDateStr = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}-01`;
    setSelectedDate(newDateStr);
    setWeekStartDateStr(newDateStr);
  };

  const handleResetToToday = () => {
    const now = new Date();
    setViewDate(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDate(todayStr);
    setWeekStartDateStr(todayStr);
  };

  // 7-Day Window Navigation
  const handlePrevWeek = () => {
    setWeekStartDateStr(prev => shiftDateStr(prev, -7));
  };

  const handleNextWeek = () => {
    setWeekStartDateStr(prev => shiftDateStr(prev, 7));
  };

  const handleResetWeekToToday = () => {
    setWeekStartDateStr(todayStr);
  };

  // Memoize 7-Day Window Array
  const weekDays = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      days.push(shiftDateStr(weekStartDateStr, i));
    }
    return days;
  }, [weekStartDateStr]);

  const weekDateRangeLabel = useMemo(() => {
    if (weekDays.length === 0) return '';
    const first = weekDays[0];
    const last = weekDays[6];
    return `${formatThaiDate(first)} - ${formatThaiDate(last)}`;
  }, [weekDays]);

  // Memoize Month Grid Cells
  const calendarCells = useMemo(() => {
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
    return cells;
  }, [year, month]);

  // Active bookings filter (Memoized)
  const activeBookings = useMemo(() => {
    return bookings.filter(b => b.status !== 'cancelled' && !b.deletedAt);
  }, [bookings]);

  // Precomputed Date Lookup Maps: O(1) Instant Access
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

  // Selected date statistics
  const selectedDateBookings = useMemo(() => {
    return getBookingsForDate(selectedDate);
  }, [getBookingsForDate, selectedDate]);

  const selectedDateVacantCount = Math.max(0, rooms.length - selectedDateBookings.length);

  // Helper to extract clean short guest nickname or first name
  const formatShortGuestName = (name: string): string => {
    if (!name) return 'ผู้เข้าพัก';
    const clean = name.replace(/^คุณ\s*/, '').trim();
    return clean.split(' ')[0] || clean;
  };

  return (
    <div className="space-y-3 sm:space-y-4 md:space-y-6 pb-24 md:pb-12 animate-in fade-in duration-300 font-['Prompt'] w-full max-w-full overflow-hidden">
      
      {/* Top Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        <div>
          <h1 className="text-base sm:text-lg md:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 shrink-0" />
            <span>ปฏิทินตรวจเช็คห้องว่าง Swan HILL</span>
          </h1>
          <p className="text-[11px] sm:text-xs text-slate-500 font-normal mt-0.5">
            บ้านพัก 6 หลัง (S1 - S6) &bull; แตะเลือกวันเพื่อดูสถานะและกดจองได้ทันที
          </p>
        </div>

        <div className="flex items-center justify-between sm:justify-end gap-1.5 sm:gap-2 flex-wrap w-full sm:w-auto">
          {/* Legend Badges */}
          <div className="hidden lg:flex items-center gap-3 text-xs font-semibold px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-2xs text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-300"></span> ว่างครบ 6
            </span>
            <span className="flex items-center gap-1.5 text-amber-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span> มัดจำ
            </span>
            <span className="flex items-center gap-1.5 text-blue-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-blue-600"></span> จ่ายครบ
            </span>
            <span className="flex items-center gap-1.5 text-rose-800 font-bold">
              <span className="w-2 h-2 rounded-full bg-rose-600"></span> เต็ม
            </span>
          </div>

          {/* Liquid View Mode Switcher */}
          <LiquidSegmentedControl<'month' | 'week'>
            options={[
              { value: 'month', label: 'รายเดือน', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
              { value: 'week', label: 'ผัง 7 วัน', icon: <CalendarDays className="w-3.5 h-3.5" /> },
            ]}
            value={viewMode}
            onChange={(val) => setViewMode(val)}
            variant="emerald"
            size="sm"
          />
        </div>
      </div>

      {/* ========================================================= */}
      {/* MODE 1: SMART MONTH CALENDAR + MASTER-DETAIL 6-ROOM PANEL */}
      {/* ========================================================= */}
      {viewMode === 'month' && (
        <div className="space-y-3 sm:space-y-4">
          
          {/* Month Navigation Card */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-2 sm:p-3 shadow-2xs flex items-center justify-between gap-2">
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl text-slate-700 transition-all cursor-pointer"
                title="เดือนก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
              <span className="text-xs sm:text-sm font-black text-slate-900 px-2 sm:px-3">
                {currentMonthYear}
              </span>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1.5 hover:bg-slate-100 active:scale-95 rounded-xl text-slate-700 transition-all cursor-pointer"
                title="เดือนถัดไป"
              >
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetToToday}
                className="px-2.5 py-1 text-[11px] sm:text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-xl border border-emerald-200 transition-all cursor-pointer whitespace-nowrap"
              >
                กลับมาวันนี้
              </button>
            </div>
          </div>

          {/* 7-Column Responsive Month Grid */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-2.5 sm:p-4 shadow-sm space-y-2.5">
            {/* Day of Week Headers */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2 text-center select-none">
              {['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสฯ', 'ศุกร์', 'เสาร์'].map((dayName, idx) => (
                <div 
                  key={dayName} 
                  className={`py-2 text-xs font-bold rounded-xl transition-colors ${
                    idx === 0 
                      ? 'text-rose-600 bg-rose-50/60 border border-rose-100/80' 
                      : idx === 6
                      ? 'text-indigo-600 bg-indigo-50/60 border border-indigo-100/80' 
                      : 'text-slate-600 bg-slate-50 border border-slate-200/70'
                  }`}
                >
                  <span className="hidden sm:inline">{dayName}</span>
                  <span className="sm:hidden">{['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][idx]}</span>
                </div>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return (
                    <div 
                      key={`empty-${idx}`} 
                      className="min-w-0 min-h-[72px] sm:min-h-[92px] bg-slate-50/40 rounded-xl sm:rounded-2xl border border-dashed border-slate-200/80"
                    />
                  );
                }

                const dayBookings = getBookingsForDate(cell.dateStr);
                const bookedRoomsCount = dayBookings.length;
                const availableRoomsCount = Math.max(0, rooms.length - bookedRoomsCount);
                const isFull = availableRoomsCount === 0;
                const isToday = cell.dateStr === todayStr;
                const isSelected = cell.dateStr === selectedDate;
                const isPartial = bookedRoomsCount > 0 && !isFull;

                return (
                  <button
                    type="button"
                    key={cell.dateStr}
                    onClick={() => setSelectedDate(cell.dateStr)}
                    className={`min-w-0 min-h-[72px] sm:min-h-[92px] p-2 sm:p-2.5 rounded-xl sm:rounded-2xl border transition-all cursor-pointer flex flex-col justify-between text-left relative select-none group active:scale-[0.98] ${
                      isSelected
                        ? 'ring-2 ring-emerald-600 border-emerald-600 bg-emerald-50/30 shadow-md z-10'
                        : isToday
                        ? 'ring-2 ring-slate-400/80 border-slate-300 bg-white shadow-2xs hover:border-emerald-400'
                        : isFull 
                        ? 'bg-rose-50/25 border-rose-200/80 hover:border-rose-300' 
                        : isPartial 
                        ? 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300' 
                        : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-xs'
                    }`}
                  >
                    {/* Top Row: Date Number (Large, Bold & Legible) + Status Badge */}
                    <div className="flex items-center justify-between gap-1 w-full">
                      {isToday ? (
                        <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs sm:text-sm shadow-xs shrink-0">
                          {cell.day}
                        </span>
                      ) : (
                        <span className={`text-sm sm:text-base font-extrabold tracking-tight shrink-0 ${
                          isSelected ? 'text-emerald-950 font-black' : 'text-slate-800'
                        }`}>
                          {cell.day}
                        </span>
                      )}

                      {/* Status Badge (Clean, Consistent, High-Contrast across ALL states) */}
                      {isFull ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-rose-600" />
                          <span>เต็ม</span>
                        </span>
                      ) : isPartial ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                          <span>ว่าง {availableRoomsCount}</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[9px] sm:text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/90 whitespace-nowrap">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                          <span>ว่าง 6</span>
                        </span>
                      )}
                    </div>

                    {/* Bottom Row: Room Availability & Booked Chips */}
                    <div className="mt-auto pt-1.5 w-full">
                      {bookedRoomsCount === 0 ? (
                        <div className="py-1 px-1.5 rounded-lg bg-slate-50/80 border border-slate-200/60 group-hover:bg-emerald-50/60 group-hover:border-emerald-200/80 transition-colors flex items-center justify-between text-[10px] text-slate-500 font-medium">
                          <span className="truncate">S1-S6 ว่าง</span>
                          <span className="text-[9px] font-bold text-emerald-600 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">+ จอง</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 flex-wrap overflow-hidden">
                          {dayBookings.slice(0, 3).map((b) => {
                            const isPaid = b.paidAmount >= b.totalAmount;
                            return (
                              <span
                                key={b.id}
                                className={`px-1.5 py-0.5 rounded text-[9px] font-bold leading-none whitespace-nowrap shadow-2xs ${
                                  isPaid 
                                    ? 'bg-blue-600 text-white' 
                                    : 'bg-amber-500 text-white'
                                }`}
                                title={`ห้อง ${b.roomNumber}: คุณ ${b.guestName} (${isPaid ? 'จ่ายครบ' : 'มัดจำ'})`}
                              >
                                {b.roomNumber}
                              </span>
                            );
                          })}
                          {bookedRoomsCount > 3 && (
                            <span className="px-1 py-0.5 rounded text-[9px] font-bold bg-slate-800 text-white leading-none">
                              +{bookedRoomsCount - 3}
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* ========================================================= */}
          {/* MASTER-DETAIL 6-ROOM STATUS PANEL (INSTANT ON SELECTION) */}
          {/* ========================================================= */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 shadow-sm p-3 sm:p-5 space-y-3 sm:space-y-4 animate-in slide-in-from-top-3 duration-200">
            {/* Panel Title Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black shadow-xs shrink-0">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <span>สถานะบ้านพักวันที่ {formatThaiDate(selectedDate)}</span>
                    {selectedDate === todayStr && (
                      <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                        วันนี้
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-500 font-medium">
                    ว่าง {selectedDateVacantCount} หลัง &bull; จองแล้ว {selectedDateBookings.length} หลัง
                  </p>
                </div>
              </div>

              {/* Status summary pill */}
              <div className="flex items-center gap-1.5 self-start sm:self-auto">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                  selectedDateVacantCount === 0 
                    ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                    : selectedDateVacantCount === 6 
                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                    : 'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  <span className={`w-2 h-2 rounded-full ${
                    selectedDateVacantCount === 0 ? 'bg-rose-500' : selectedDateVacantCount === 6 ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
                  <span>{selectedDateVacantCount === 0 ? 'บ้านเต็มทุกหลัง' : `มีห้องว่างพร้อมรับ ${selectedDateVacantCount} หลัง`}</span>
                </span>
              </div>
            </div>

            {/* 6 Rooms Grid Cards: Clean, Thumb-Friendly, No Horizontal Overflow */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 sm:gap-3">
              {orderedRooms.map((room) => {
                const roomBookings = getAllBookingsForRoomAndDate(room.id, selectedDate);
                const activeBooking = roomBookings.find(b => b.status === 'checked_in' || b.status === 'confirmed');
                const checkedOutBooking = roomBookings.find(b => b.status === 'checked_out');

                // Case 1: Room is Vacant
                if (roomBookings.length === 0) {
                  return (
                    <div 
                      key={room.id}
                      className="p-3 sm:p-3.5 bg-white hover:border-slate-300 rounded-2xl border border-slate-200 transition-all flex items-center justify-between gap-3 shadow-2xs group"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <HouseLogo roomNumber={room.roomNumber} size="md" />
                        <div className="min-w-0">
                          <span className="font-black text-xs sm:text-sm text-slate-900 block truncate">
                            ห้อง {room.roomNumber} - {room.name}
                          </span>
                          <span className="text-[11px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            <span>ว่างพร้อมจอง &bull; ฿{room.pricePerNight.toLocaleString()}/คืน</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenNewBookingWithPrefill) {
                            onOpenNewBookingWithPrefill(room.id, selectedDate);
                          }
                        }}
                        className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shrink-0 shadow-sm flex items-center gap-1.5 cursor-pointer transition-all"
                        title={`จองห้อง ${room.roomNumber} ในวันที่ ${formatThaiDate(selectedDate)}`}
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>กดจอง</span>
                      </button>
                    </div>
                  );
                }

                // Case 2: Cleaned and Ready after earlier checkout
                if (!activeBooking && checkedOutBooking) {
                  return (
                    <div 
                      key={room.id}
                      className="p-3 sm:p-3.5 bg-white hover:border-slate-300 rounded-2xl border border-slate-200 transition-all flex items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <HouseLogo roomNumber={room.roomNumber} size="md" />
                        <div className="min-w-0">
                          <span className="font-black text-xs sm:text-sm text-slate-900 block truncate">
                            ห้อง {room.roomNumber} - {room.name}
                          </span>
                          <span className="text-[10px] text-emerald-700 font-bold flex items-center gap-1 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                            <span>แขกเดิมออกแล้ว พร้อมรับ Walk-in รอบใหม่</span>
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenNewBookingWithPrefill) {
                            onOpenNewBookingWithPrefill(room.id, selectedDate);
                          }
                        }}
                        className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs shrink-0 shadow-sm flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>จองรอบ 2</span>
                      </button>
                    </div>
                  );
                }

                // Case 3: Active Booking
                const booking = activeBooking || checkedOutBooking || roomBookings[0];
                const isPaid = booking.paidAmount >= booking.totalAmount;

                return (
                  <div
                    key={room.id}
                    onClick={() => setSelectedBookingModal(booking)}
                    className="p-3 sm:p-3.5 bg-white hover:border-emerald-500 rounded-2xl border-2 border-slate-200 shadow-xs hover:shadow-md transition-all cursor-pointer flex items-center justify-between gap-2.5 group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HouseLogo roomNumber={room.roomNumber} size="md" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-xs sm:text-sm text-slate-900 block truncate">
                            ห้อง {room.roomNumber}
                          </span>
                          <span className={`text-[9px] px-1.5 py-0.5 rounded font-black text-white ${
                            isPaid ? 'bg-blue-600' : 'bg-amber-500'
                          }`}>
                            {isPaid ? 'จ่ายครบ' : 'มัดจำ'}
                          </span>
                        </div>
                        <span className="text-xs text-slate-700 font-bold truncate block">
                          คุณ {booking.guestName}
                        </span>
                        <div className="flex items-center gap-1.5 text-[10px] text-slate-500 font-medium">
                          <span>{booking.guestPhone || '-'}</span>
                          {booking.addOns && booking.addOns.length > 0 && (
                            <span className="text-amber-700 font-bold bg-amber-50 px-1 rounded flex items-center gap-0.5">
                              <UtensilsCrossed className="w-2.5 h-2.5" /> มีหมูกระทะ
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex items-center gap-1">
                      <ArrowRightIcon className="w-4 h-4 text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}

      {/* ========================================================= */}
      {/* MODE 2: WORLD-CLASS 7-DAY ROLLING TIMELINE MATRIX         */}
      {/* ========================================================= */}
      {viewMode === 'week' && (
        <div className="space-y-3 sm:space-y-4">
          
          {/* Week Navigation Header */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200 p-2 sm:p-3 shadow-2xs flex items-center justify-between gap-2 flex-wrap">
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                type="button"
                onClick={handlePrevWeek}
                className="p-1.5 sm:p-2 hover:bg-slate-100 active:scale-95 rounded-xl text-slate-700 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                title="7 วันก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <div className="px-1 sm:px-2">
                <span className="text-xs sm:text-sm font-black text-slate-900 block leading-tight">
                  {weekDateRangeLabel}
                </span>
                <span className="text-[10px] text-slate-500 font-medium">
                  ผังห้องพักรายสัปดาห์ 7 วัน
                </span>
              </div>
              <button
                type="button"
                onClick={handleNextWeek}
                className="p-1.5 sm:p-2 hover:bg-slate-100 active:scale-95 rounded-xl text-slate-700 transition-all cursor-pointer border border-slate-200 shadow-2xs"
                title="7 วันถัดไป"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleResetWeekToToday}
                className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 active:scale-95 rounded-xl border border-emerald-200 transition-all cursor-pointer whitespace-nowrap"
              >
                สัปดาห์นี้ (วันนี้)
              </button>
            </div>
          </div>

          {/* 7-Day Matrix Table (Strict Fixed Column Widths, No Distortion) */}
          <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-300 p-2 sm:p-4 shadow-sm overflow-x-auto no-scrollbar w-full max-w-full">
            <table className="w-full table-fixed min-w-[580px] sm:min-w-[700px] border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200">
                  {/* Sticky Room Column */}
                  <th className="sticky left-0 bg-white z-20 py-2 sm:py-3 px-2 sm:px-3 text-xs font-black text-slate-900 w-24 sm:w-36 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)] text-left">
                    บ้านพัก
                  </th>
                  
                  {/* Exactly 7 Day Columns with Equal Width */}
                  {weekDays.map((dStr) => {
                    const date = new Date(dStr + 'T00:00:00');
                    const isWeekToday = dStr === todayStr;
                    const isSunday = date.getDay() === 0;
                    const isSaturday = date.getDay() === 6;

                    return (
                      <th
                        key={dStr}
                        className={`py-2 px-1 text-center border-r border-slate-100 transition-colors ${
                          isWeekToday
                            ? 'bg-emerald-600 text-white shadow-2xs'
                            : isSunday
                            ? 'bg-rose-50/70 text-rose-900'
                            : isSaturday
                            ? 'bg-indigo-50/70 text-indigo-900'
                            : 'bg-slate-50/70 text-slate-800'
                        }`}
                      >
                        <span className={`block text-[10px] font-bold ${
                          isWeekToday 
                            ? 'text-emerald-100' 
                            : isSunday 
                            ? 'text-rose-600' 
                            : isSaturday 
                            ? 'text-indigo-600' 
                            : 'text-slate-500'
                        }`}>
                          {['อา', 'จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส'][date.getDay()]}
                        </span>
                        <span className={`font-black text-xs sm:text-sm ${isWeekToday ? 'text-white' : 'text-slate-900'}`}>
                          {date.getDate()}
                        </span>
                      </th>
                    );
                  })}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {orderedRooms.map((room) => (
                  <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                    {/* Sticky Room Column Header */}
                    <td className="sticky left-0 bg-white z-10 py-2 sm:py-3 px-2 sm:px-3 border-r border-slate-200 shadow-[2px_0_4px_rgba(0,0,0,0.03)]">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <HouseLogo roomNumber={room.roomNumber} size="sm" />
                        <div className="min-w-0">
                          <span className="font-black text-xs text-slate-900 block truncate">
                            ห้อง {room.roomNumber}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-slate-500 font-bold block truncate">
                            ฿{room.pricePerNight.toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* 7 Daily Cells */}
                    {weekDays.map((dStr) => {
                      const roomBookings = getAllBookingsForRoomAndDate(room.id, dStr);
                      const booking = getBookingForRoomAndDate(room.id, dStr);

                      return (
                        <td key={dStr} className="py-1.5 px-1 text-center align-middle">
                          {booking ? (
                            <div
                              onClick={() => setSelectedBookingModal(booking)}
                              className={`p-1.5 rounded-xl border text-left cursor-pointer hover:scale-[1.03] transition-all shadow-2xs select-none ${
                                booking.status === 'checked_out'
                                  ? 'bg-slate-100 border-slate-300 text-slate-800'
                                  : booking.paidAmount >= booking.totalAmount
                                  ? 'bg-blue-600 border-blue-700 text-white'
                                  : 'bg-amber-500 border-amber-600 text-white'
                              }`}
                              title={`คลิกเพื่อดู: คุณ ${booking.guestName} (${booking.paidAmount >= booking.totalAmount ? 'จ่ายครบ' : 'มัดจำ'})`}
                            >
                              <span className="block font-black text-[10px] sm:text-[11px] truncate leading-tight">
                                {formatShortGuestName(booking.guestName)}
                              </span>
                              <div className="flex items-center justify-between gap-0.5 mt-0.5 leading-none">
                                <span className="text-[8px] opacity-90 truncate">
                                  {booking.paidAmount >= booking.totalAmount ? 'ชำระแล้ว' : 'มัดจำ'}
                                </span>
                                {roomBookings.length > 1 && (
                                  <span className="text-[8px] font-bold bg-white/30 px-1 rounded">
                                    +{roomBookings.length - 1}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <button
                              type="button"
                              onClick={() => onOpenNewBookingWithPrefill && onOpenNewBookingWithPrefill(room.id, dStr)}
                              className="w-full h-9 rounded-xl bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 text-slate-400 hover:text-emerald-700 flex items-center justify-center transition-all border border-dashed border-slate-200 cursor-pointer active:scale-95"
                              title={`กดจองห้อง ${room.roomNumber} ในวันที่ ${formatThaiDate(dStr)}`}
                            >
                              <Plus className="w-4 h-4" />
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

      {/* ========================================================= */}
      {/* BOOKING DETAILS INSPECTOR MODAL (LEVEL 3)                 */}
      {/* ========================================================= */}
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
                <span className="w-9 h-9 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black text-sm shadow-xs">
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
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content Details */}
            <div className="p-4 overflow-y-auto no-scrollbar space-y-3.5 flex-1 overscroll-contain">
              
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

              {/* Group Booking Badge */}
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

              {/* Financial Breakdown */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2.5">
                <span className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  สรุปรายละเอียดการเงิน & ยอดมัดจำ
                </span>

                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="p-2 bg-white rounded-xl border border-blue-100 shadow-2xs">
                    <span className="text-[9px] text-slate-500 font-bold block">ยอดรวมทั้งสิ้น</span>
                    <span className="text-xs font-black text-slate-900">
                      ฿{selectedBookingModal.totalAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="p-2 bg-emerald-100/90 rounded-xl border border-emerald-200 shadow-2xs">
                    <span className="text-[9px] text-emerald-800 font-bold block">
                      {selectedBookingModal.paidAmount >= selectedBookingModal.totalAmount ? 'ชำระครบ' : `มัดจำ ${Math.round((selectedBookingModal.paidAmount / selectedBookingModal.totalAmount) * 100)}%`}
                    </span>
                    <span className="text-xs font-black text-emerald-950">
                      ฿{selectedBookingModal.paidAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className={`p-2 rounded-xl border shadow-2xs ${selectedBookingModal.totalAmount - selectedBookingModal.paidAmount > 0 ? 'bg-amber-100 border-amber-300' : 'bg-slate-100 border-slate-200'}`}>
                    <span className="text-[9px] text-amber-900 font-bold block">คงเหลือค้างจ่าย</span>
                    <span className="text-xs font-black text-amber-950">
                      ฿{Math.max(0, selectedBookingModal.totalAmount - selectedBookingModal.paidAmount).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Mookata & Add-ons Section */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-amber-950 flex items-center gap-1.5">
                    <UtensilsCrossed className="w-4 h-4 text-amber-700" />
                    รายการอาหาร & หมูกระทะ & บริการเสริม
                  </span>
                  {onOpenAddOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenAddOrder(selectedBookingModal);
                        setSelectedBookingModal(null);
                      }}
                      className="px-2 py-0.5 rounded-lg bg-amber-200 hover:bg-amber-300 text-amber-950 text-[10px] font-black flex items-center gap-1 cursor-pointer"
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
                      type="button"
                      onClick={() => {
                        onOpenAddPayment(selectedBookingModal);
                        setSelectedBookingModal(null);
                      }}
                      className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>การชำระเงิน</span>
                    </button>
                  )}

                  {onOpenReceipt && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenReceipt(selectedBookingModal);
                        setSelectedBookingModal(null);
                      }}
                      className="py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
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
                type="button"
                onClick={() => setSelectedBookingModal(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold text-xs cursor-pointer"
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
