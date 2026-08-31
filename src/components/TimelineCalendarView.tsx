import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  User, 
  Phone, 
  Plus, 
  Check, 
  ArrowRight,
  ListFilter,
  Columns3,
  Home
} from 'lucide-react';
import type { Room, Booking } from '../types/pms';
import { HouseLogo } from './HouseLogo';

interface TimelineCalendarViewProps {
  rooms: Room[];
  bookings: Booking[];
  onOpenNewBookingWithPrefill: (roomId: string, date: string) => void;
  onCheckInGuest?: (bookingId: string) => void;
  onCheckOutGuest?: (bookingId: string) => void;
}

export const TimelineCalendarView: React.FC<TimelineCalendarViewProps> = ({
  rooms,
  bookings,
  onOpenNewBookingWithPrefill,
  onCheckInGuest,
  onCheckOutGuest,
}) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date('2026-08-31'));
  const [viewMode, setViewMode] = useState<'daily' | 'gantt'>('daily');

  const formatDateKey = (d: Date) => d.toISOString().slice(0, 10);
  const selectedDateKey = formatDateKey(selectedDate);

  const generate7Days = () => {
    const days: Date[] = [];
    const base = new Date(selectedDate);
    base.setDate(base.getDate() - 3);
    for (let i = 0; i < 7; i++) {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      days.push(d);
    }
    return days;
  };

  const dayStrip = generate7Days();

  const getBookingForRoomAndDate = (roomId: string, dateKey: string) => {
    return bookings.find(b => {
      if (b.status === 'cancelled' || !!b.deletedAt) return false;
      if (b.roomId !== roomId) return false;
      return dateKey >= b.checkInDate && dateKey < b.checkOutDate;
    });
  };

  const getThaiDayShort = (d: Date) => {
    const days = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
    return days[d.getDay()];
  };

  const getThaiFullDate = (d: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    };
    return d.toLocaleDateString('th-TH', options);
  };

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d);
  };

  const handleToday = () => {
    setSelectedDate(new Date('2026-08-31'));
  };

  const standaloneRooms = rooms.filter(r => !r.roomNumber.includes('บ้าน 5'));
  const duplexRooms = rooms.filter(r => r.roomNumber.includes('บ้าน 5'));

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* View Switcher & Header Bar */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-black text-slate-900 flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <span>ปฏิทินตรวจเช็คห้องว่าง Swan HILL</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-medium">
            เลือกดูสถานะรายวัน หรือสลับเป็นผังตารางแนวนอน
          </p>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 self-start sm:self-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'daily'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <ListFilter className="w-3.5 h-3.5" />
            <span>ดูรายวัน</span>
          </button>
          <button
            onClick={() => setViewMode('gantt')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'gantt'
                ? 'bg-emerald-600 text-white shadow-xs font-black'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Columns3 className="w-3.5 h-3.5" />
            <span>ผังตาราง 14 วัน</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: DAILY VIEW (NO EMOJIS, PURE SVG) */}
      {/* ========================================================================= */}
      {viewMode === 'daily' && (
        <div className="space-y-3">
          {/* Day Navigation Bar with 7-day strip */}
          <div className="bg-white p-3 md:p-4 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
            {/* Top Date Header with Prev/Next buttons */}
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={handlePrevDay}
                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
              >
                <ChevronLeft className="w-4 h-4" />
                <span className="hidden xs:inline">วันก่อนหน้า</span>
              </button>

              <div className="text-center">
                <p className="text-sm md:text-base font-black text-slate-900">{getThaiFullDate(selectedDate)}</p>
                {selectedDateKey === '2026-08-31' && (
                  <span className="inline-block text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full mt-0.5">
                    วันนี้
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleToday}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold hover:bg-emerald-100 transition-colors"
                >
                  วันนี้
                </button>
                <button
                  onClick={handleNextDay}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 active:scale-95 transition-all flex items-center gap-1 text-xs font-bold"
                >
                  <span className="hidden xs:inline">วันถัดไป</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 7-Day Quick Touch Strip */}
            <div className="grid grid-cols-7 gap-1 pt-1 border-t border-slate-100">
              {dayStrip.map((d) => {
                const dKey = formatDateKey(d);
                const isSelected = dKey === selectedDateKey;
                const isTodayDate = dKey === '2026-08-31';

                return (
                  <button
                    key={dKey}
                    onClick={() => setSelectedDate(d)}
                    className={`py-1.5 px-1 rounded-xl flex flex-col items-center justify-center transition-all ${
                      isSelected
                        ? 'bg-emerald-600 text-white font-black shadow-xs scale-102'
                        : (isTodayDate 
                            ? 'bg-emerald-50 text-emerald-800 font-bold border border-emerald-300' 
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 font-semibold')
                    }`}
                  >
                    <span className="text-[10px] leading-tight">{getThaiDayShort(d)}</span>
                    <span className="text-xs md:text-sm font-black mt-0.5">{d.getDate()}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Rooms Status Grid for Selected Date */}
          <div className="space-y-3">
            {/* 4 Standalone Villas */}
            <div>
              <div className="px-1 mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Home className="w-3.5 h-3.5 text-emerald-600" />
                <span>บ้านพัก 4 หลังเดี่ยว (บ้าน 1 - บ้าน 4)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {standaloneRooms.map((room) => {
                  const booking = getBookingForRoomAndDate(room.id, selectedDateKey);
                  const isAvailable = !booking;

                  return (
                    <div
                      key={room.id}
                      className={`p-3.5 rounded-2xl border transition-all bg-white shadow-xs flex flex-col justify-between ${
                        isAvailable
                          ? 'border-emerald-200 hover:border-emerald-300'
                          : 'border-blue-200 bg-blue-50/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <HouseLogo roomNumber={room.roomNumber} size="sm" />
                            <div>
                              <span className="text-sm font-black text-slate-900">{room.roomNumber}</span>
                              <p className="text-xs font-medium text-slate-600">{room.name}</p>
                            </div>
                          </div>

                          {isAvailable ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ว่างทั้งวัน
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              มีผู้พัก
                            </span>
                          )}
                        </div>

                        {booking && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-800 space-y-1">
                            <p className="font-bold text-blue-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              {booking.guestName}
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <a href={`tel:${booking.guestPhone.replace(/[^0-9+]/g, '')}`} className="text-emerald-700 font-bold underline">
                                {booking.guestPhone}
                              </a>
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              พัก: {booking.checkInDate} ถึง {booking.checkOutDate} ({booking.totalNights} คืน)
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        {isAvailable ? (
                          <button
                            onClick={() => onOpenNewBookingWithPrefill(room.id, selectedDateKey)}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>กดจอง {room.roomNumber} ในวันนี้</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {booking?.status === 'confirmed' && onCheckInGuest && (
                              <button
                                onClick={() => onCheckInGuest(booking.id)}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>เช็คอิน</span>
                              </button>
                            )}
                            {booking?.status === 'checked_in' && onCheckOutGuest && (
                              <button
                                onClick={() => onCheckOutGuest(booking.id)}
                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>เช็คเอาท์</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 1 Duplex Twin Villa (2 Rooms) */}
            <div className="pt-1">
              <div className="px-1 mb-1.5 flex items-center gap-1.5 text-xs font-bold text-slate-800">
                <Home className="w-3.5 h-3.5 text-teal-600" />
                <span>บ้านพักหลังที่ 5 (บ้านแฝด 2 ห้องแยก - รับลูกค้าได้ 2 เจ้า)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {duplexRooms.map((room) => {
                  const booking = getBookingForRoomAndDate(room.id, selectedDateKey);
                  const isAvailable = !booking;

                  return (
                    <div
                      key={room.id}
                      className={`p-3.5 rounded-2xl border transition-all bg-white shadow-xs flex flex-col justify-between ${
                        isAvailable
                          ? 'border-teal-200 hover:border-teal-300'
                          : 'border-blue-200 bg-blue-50/30'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <HouseLogo roomNumber={room.roomNumber} size="sm" />
                            <div>
                              <span className="text-sm font-black text-slate-900">{room.roomNumber}</span>
                              <p className="text-xs font-medium text-slate-600">{room.name}</p>
                            </div>
                          </div>

                          {isAvailable ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                              ว่างทั้งวัน
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                              มีผู้พัก
                            </span>
                          )}
                        </div>

                        {booking && (
                          <div className="mt-2.5 p-2.5 rounded-xl bg-white border border-blue-200 text-xs text-slate-800 space-y-1">
                            <p className="font-bold text-blue-900 flex items-center gap-1.5">
                              <User className="w-3.5 h-3.5 text-blue-600" />
                              {booking.guestName}
                            </p>
                            <p className="text-slate-600 flex items-center gap-1.5">
                              <Phone className="w-3.5 h-3.5 text-emerald-600" />
                              <a href={`tel:${booking.guestPhone.replace(/[^0-9+]/g, '')}`} className="text-emerald-700 font-bold underline">
                                {booking.guestPhone}
                              </a>
                            </p>
                            <p className="text-[10px] text-slate-500 font-medium">
                              พัก: {booking.checkInDate} ถึง {booking.checkOutDate} ({booking.totalNights} คืน)
                            </p>
                          </div>
                        )}
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        {isAvailable ? (
                          <button
                            onClick={() => onOpenNewBookingWithPrefill(room.id, selectedDateKey)}
                            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                            <span>กดจอง {room.roomNumber} ในวันนี้</span>
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            {booking?.status === 'confirmed' && onCheckInGuest && (
                              <button
                                onClick={() => onCheckInGuest(booking.id)}
                                className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                              >
                                <Check className="w-3.5 h-3.5" />
                                <span>เช็คอิน</span>
                              </button>
                            )}
                            {booking?.status === 'checked_in' && onCheckOutGuest && (
                              <button
                                onClick={() => onCheckOutGuest(booking.id)}
                                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1"
                              >
                                <ArrowRight className="w-3.5 h-3.5" />
                                <span>เช็คเอาท์</span>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: GANTT CHART VIEW */}
      {/* ========================================================================= */}
      {viewMode === 'gantt' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-4">
          <div className="overflow-x-auto">
            <div className="min-w-[650px]">
              <div className="grid grid-cols-8 gap-1 pb-2 border-b border-slate-200 text-center font-bold text-xs text-slate-700">
                <div className="text-left font-black text-slate-900 pl-2">บ้านพัก</div>
                {dayStrip.map((d) => (
                  <div key={formatDateKey(d)} className="py-1">
                    <div>{getThaiDayShort(d)}</div>
                    <div className="text-emerald-700 font-black">{d.getDate()}</div>
                  </div>
                ))}
              </div>

              <div className="divide-y divide-slate-100">
                {rooms.map((room) => (
                  <div key={room.id} className="grid grid-cols-8 gap-1 py-2.5 items-center">
                    <div className="flex items-center gap-2 pl-2">
                      <HouseLogo roomNumber={room.roomNumber} size="sm" />
                      <span className="font-bold text-xs text-slate-900 truncate">{room.roomNumber}</span>
                    </div>

                    {dayStrip.map((d) => {
                      const dKey = formatDateKey(d);
                      const booking = getBookingForRoomAndDate(room.id, dKey);

                      return (
                        <div key={dKey} className="p-0.5">
                          {booking ? (
                            <div className="bg-blue-100 border border-blue-300 text-blue-900 rounded-lg p-1 text-[10px] font-bold text-center truncate shadow-xs">
                              {booking.guestName.replace(/คุณ/g, '').trim().slice(0, 5)}
                            </div>
                          ) : (
                            <button
                              onClick={() => onOpenNewBookingWithPrefill(room.id, dKey)}
                              className="w-full bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-300 text-emerald-700 rounded-lg p-1 text-[10px] font-bold text-center transition-colors"
                            >
                              + จอง
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
