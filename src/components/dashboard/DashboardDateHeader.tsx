import React from 'react';
import { 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  Calendar, 
  Check, 
  Copy, 
  Search 
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../../types/pms';
import { formatThaiDate, THAI_MONTHS_FULL } from '../../utils/dateUtils';

const THAI_DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

const formatThaiFullDate = (dateStr: string) => {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return dateStr;
  const dayName = THAI_DAYS[d.getDay()];
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${dayName}ที่ ${day} ${month} ${yearBE}`;
};

export interface DashboardDateHeaderProps {
  selectedDate: string;
  isViewingToday: boolean;
  onShiftDate: (days: number) => void;
  onResetToToday: () => void;
  onSelectDate: (date: string) => void;
  rooms: Room[];
  getRoomStatusOnDate: (room: Room) => { status: RoomStatus; booking?: Booking };
  onOpenNewBookingForRoom?: (roomId: string) => void;
  onOpenNewBooking: () => void;
  copiedLineAllSuccess: boolean;
  onCopyAvailableRoomsOnDate: () => void;
  onOpenQuickChecker?: () => void;
}

export const DashboardDateHeader: React.FC<DashboardDateHeaderProps> = ({
  selectedDate,
  isViewingToday,
  onShiftDate,
  onResetToToday,
  onSelectDate,
  rooms,
  getRoomStatusOnDate,
  onOpenNewBookingForRoom,
  onOpenNewBooking,
  copiedLineAllSuccess,
  onCopyAvailableRoomsOnDate,
  onOpenQuickChecker,
}) => {
  const availableRoomsList = rooms.filter(r => getRoomStatusOnDate(r).status === 'available');

  return (
    <div className="space-y-3">
      {/* DATE SELECTOR & STATUS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        {/* Date Shift Buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => onShiftDate(-1)}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="ย้อนดูวันก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
            <span>{isViewingToday ? 'เมื่อวาน' : 'วันก่อน'}</span>
          </button>

          <button
            type="button"
            onClick={onResetToToday}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
              isViewingToday 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
            title="กลับมาดูสถานะวันปัจจุบัน"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>📌 วันนี้</span>
          </button>

          <button
            type="button"
            onClick={() => onShiftDate(1)}
            className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 whitespace-nowrap"
            title="ดูสถานะวันถัดไป"
          >
            <span>{isViewingToday ? 'พรุ่งนี้' : 'ถัดไป'}</span>
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>
        </div>

        {/* Date Display Pill with Integrated Native Picker */}
        <div className="relative flex items-center justify-between sm:justify-end gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs group">
          <div className="flex items-center gap-2 min-w-0">
            <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
              {formatThaiFullDate(selectedDate)}
            </span>
            <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
              isViewingToday 
                ? 'text-emerald-700 bg-emerald-100' 
                : 'text-amber-700 bg-amber-100'
            }`}>
              {isViewingToday ? 'วันปัจจุบัน' : 'ดูสถานะล่วงหน้า'}
            </span>
          </div>

          <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90 shrink-0 sm:hidden" />

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && onSelectDate(e.target.value)}
            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
            title="แตะเพื่อเลือกวันที่ต้องการดูสถานะผังบ้าน"
          />
        </div>
      </div>

      {/* Quick Room Availability Glance Bar */}
      <div className="p-3 sm:px-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-950">
              บ้านที่ว่าง {isViewingToday ? 'วันนี้' : formatThaiDate(selectedDate)}:
            </span>
          </div>

          {availableRoomsList.length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {availableRoomsList.map(r => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(r.id);
                    else onOpenNewBooking();
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white hover:bg-emerald-600 hover:text-white active:scale-95 text-emerald-900 border border-emerald-300 text-xs font-bold shadow-2xs transition-all cursor-pointer group"
                  title={`กดจองบ้าน ${r.roomNumber}`}
                >
                  <span>บ้าน {r.roomNumber}</span>
                  <span className="text-[10px] text-emerald-700 group-hover:text-emerald-100 font-normal">
                    (฿{r.pricePerNight.toLocaleString()})
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <span className="text-xs text-rose-600 font-semibold">
              เต็มทุกหลังแล้วในวันที่เลือก
            </span>
          )}
        </div>

        {/* Quick Check Date Range & Line Copy Buttons */}
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {availableRoomsList.length > 0 && (
            <button
              type="button"
              onClick={onCopyAvailableRoomsOnDate}
              className="px-3 py-1.5 bg-white hover:bg-emerald-50 active:scale-95 text-emerald-800 border border-emerald-300 font-semibold text-xs rounded-xl shadow-2xs flex items-center gap-1.5 cursor-pointer transition-all"
              title="คัดลอกข้อความสรุปบ้านที่ว่างประจำวันนี้ ส่งตอบลูกค้าใน LINE"
            >
              {copiedLineAllSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600 stroke-2" />
                  <span className="text-emerald-700 font-bold">คัดลอกแล้ว!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-emerald-600" />
                  <span>คัดลอกตอบ LINE</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={onOpenQuickChecker}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="เปิดระบบเช็คห้องว่างด่วนตามช่วงวัน"
          >
            <Search className="w-3.5 h-3.5" />
            <span>🔍 เช็คห้องว่างตามช่วงวัน</span>
          </button>
        </div>
      </div>
    </div>
  );
};
