import React, { useState } from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus
} from 'lucide-react';
import type { Room, Booking } from '../types/pms';
import { HouseLogo } from './HouseLogo';

interface TimelineCalendarViewProps {
  rooms: Room[];
  bookings: Booking[];
  onOpenNewBookingWithPrefill?: (roomId: string, date: string) => void;
}

export const TimelineCalendarView: React.FC<TimelineCalendarViewProps> = ({
  rooms,
  bookings,
  onOpenNewBookingWithPrefill,
}) => {
  const [selectedDate, setSelectedDate] = useState<string>('2026-08-31');

  // Generate 7-day strip from selectedDate
  const getDaysArray = (startStr: string) => {
    const arr = [];
    const curr = new Date(startStr);
    for (let i = -2; i < 5; i++) {
      const d = new Date(curr);
      d.setDate(d.getDate() + i);
      arr.push(d.toISOString().slice(0, 10));
    }
    return arr;
  };

  const days = getDaysArray(selectedDate);

  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().slice(0, 10));
  };

  const getBookingForRoomAndDate = (roomId: string, dateStr: string) => {
    return bookings.find((b) => {
      if (b.status === 'cancelled' || !!b.deletedAt) return false;
      if (b.roomId !== roomId) return false;
      return dateStr >= b.checkInDate && dateStr < b.checkOutDate;
    });
  };

  const activeBookingsToday = bookings.filter(b => {
    if (b.status === 'cancelled' || !!b.deletedAt) return false;
    return selectedDate >= b.checkInDate && selectedDate < b.checkOutDate;
  });

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* Date Bar & Controls */}
      <div className="bg-white/95 backdrop-blur-md p-3.5 md:p-4 rounded-2xl border border-slate-200/80 shadow-[0_4px_16px_rgba(0,0,0,0.03)] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-slate-900 text-white flex items-center justify-center shadow-xs">
            <CalendarIcon className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900">
              ปฏิทินตรวจเช็คห้องว่างรายวัน (S1 - S6)
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              วันที่เลือก: <b className="text-emerald-700">{selectedDate}</b> &bull; มีผู้เข้าพัก {activeBookingsToday.length} หลัง
            </p>
          </div>
        </div>

        {/* Date Selector Navigation */}
        <div className="flex items-center gap-2">
          <button
            onClick={handlePrevDay}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all"
            title="วันก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 font-bold text-xs text-slate-800 outline-none focus:border-emerald-500"
          />

          <button
            onClick={handleNextDay}
            className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 transition-all"
            title="วันถัดไป"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 7-DAY TIMELINE MATRIX TABLE */}
      <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/90 shadow-[0_4px_16px_rgba(0,0,0,0.03)] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-left">
                <th className="p-3.5 text-xs font-black text-slate-700 w-44 sticky left-0 bg-slate-50/95 z-10">
                  บ้านพัก / วิลล่า
                </th>
                {days.map((d) => {
                  const dateObj = new Date(d);
                  const isCurrent = d === selectedDate;
                  const dayName = dateObj.toLocaleDateString('th-TH', { weekday: 'short' });
                  const dayNum = dateObj.getDate();

                  return (
                    <th
                      key={d}
                      className={`p-2.5 text-center text-xs font-bold border-l border-slate-200/60 ${
                        isCurrent ? 'bg-emerald-50 text-emerald-900 font-black' : 'text-slate-600'
                      }`}
                    >
                      <span className="block text-[10px] uppercase">{dayName}</span>
                      <span className={`inline-block text-sm px-2 py-0.5 rounded-lg mt-0.5 ${isCurrent ? 'bg-emerald-600 text-white font-black' : ''}`}>
                        {dayNum}
                      </span>
                    </th>
                  );
                })}
              </tr>
            </thead>

            <tbody className="divide-y divide-slate-100 text-xs">
              {rooms.map((room) => (
                <tr key={room.id} className="hover:bg-slate-50/50 transition-colors">
                  {/* Room Label with SVG HouseLogo */}
                  <td className="p-3 sticky left-0 bg-white/95 backdrop-blur-md z-10 border-r border-slate-100">
                    <div className="flex items-center gap-2.5">
                      <HouseLogo roomNumber={room.roomNumber} size="sm" />
                      <div>
                        <span className="font-black text-slate-900 text-xs block">{room.roomNumber}</span>
                        <span className="text-[10px] text-slate-500 font-bold block">{room.type}</span>
                        <span className="text-[10px] font-black text-emerald-700">฿{room.pricePerNight.toLocaleString()}</span>
                      </div>
                    </div>
                  </td>

                  {/* Day Cells */}
                  {days.map((d) => {
                    const booking = getBookingForRoomAndDate(room.id, d);
                    const isSelected = d === selectedDate;

                    if (booking) {
                      return (
                        <td
                          key={d}
                          className={`p-2 text-center border-l border-slate-100 ${
                            isSelected ? 'bg-emerald-50/40' : ''
                          }`}
                        >
                          <div className="p-2 rounded-xl bg-blue-50 border border-blue-200 text-blue-900 text-[10px] font-bold shadow-2xs">
                            <span className="block truncate">{booking.guestName}</span>
                            <span className="text-[9px] text-blue-600 block">
                              {booking.bookingCode}
                            </span>
                          </div>
                        </td>
                      );
                    }

                    // Available Day Slot
                    return (
                      <td
                        key={d}
                        className={`p-2 text-center border-l border-slate-100 ${
                          isSelected ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <button
                          onClick={() => onOpenNewBookingWithPrefill && onOpenNewBookingWithPrefill(room.id, d)}
                          className="w-full py-2.5 rounded-xl border border-dashed border-emerald-300/80 hover:border-emerald-500 hover:bg-emerald-50/60 text-emerald-700 font-bold text-[10px] transition-all flex items-center justify-center gap-0.5 group"
                          title={`เปิดจองห้อง ${room.roomNumber} วันที่ ${d}`}
                        >
                          <Plus className="w-3 h-3 group-hover:scale-110 transition-transform" />
                          <span>ว่าง</span>
                        </button>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
