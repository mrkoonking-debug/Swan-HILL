import React from 'react';
import { 
  Trees, 
  Home, 
  Calendar, 
  Check, 
  Copy, 
  Search, 
  Plus, 
  Users, 
  Phone, 
  Clock, 
  CheckCircle2, 
  CreditCard, 
  UtensilsCrossed, 
  Receipt, 
  ChevronRight,
  ChevronLeft
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../../types/pms';
import { formatThaiDate, shiftDateStr } from '../../utils/dateUtils';
import { LiquidSegmentedControl } from '../LiquidSegmentedControl';

// 3D Masterplan Coordinate Pin Locations (Strictly accurate to real Swan HILL architecture)
const PIN_COORDINATES: Record<string, { top: string; left: string }> = {
  S6: { top: '44%', left: '16%' },
  S5: { top: '40%', left: '29%' },
  S4: { top: '30%', left: '42%' },
  S3: { top: '33%', left: '54%' },
  S2: { top: '39%', left: '66%' },
  S1: { top: '47%', left: '83%' },
};

export interface ResortMapSectionProps {
  rooms: Room[];
  bookings: Booking[];
  selectedDate: string;
  isViewingToday: boolean;
  selectedMapRoomNumber: string;
  onSelectMapRoomNumber: (roomNumber: string) => void;
  rightPanelTab: 'all' | 'single';
  onRightPanelTabChange: (tab: 'all' | 'single') => void;
  copiedLineAllSuccess: boolean;
  onCopyAvailableRoomsOnDate: () => void;
  getRoomStatusOnDate: (room: Room) => { status: RoomStatus; booking?: Booking };
  onOpenNewBookingForRoom?: (roomId: string) => void;
  onOpenNewBooking: () => void;
  onOpenNewBookingWithDates?: (roomId: string, checkIn: string, checkOut: string) => void;
  onSelectDate?: (date: string) => void;
  onShiftDate?: (days: number) => void;
  onOpenQuickChecker?: () => void;
  onOpenAddPayment?: (booking: Booking) => void;
  onOpenAddOrder?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onOpenCheckoutModal?: (booking: Booking) => void;
  onOpenCloneBooking?: (booking: Booking) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onTriggerConfirmClean: (room: Room) => void;
  onTriggerConfirmMaintenance: (room: Room) => void;
}

export const ResortMapSection: React.FC<ResortMapSectionProps> = ({
  rooms,
  bookings,
  selectedDate,
  isViewingToday,
  selectedMapRoomNumber,
  onSelectMapRoomNumber,
  rightPanelTab,
  onRightPanelTabChange,
  copiedLineAllSuccess,
  onCopyAvailableRoomsOnDate,
  getRoomStatusOnDate,
  onOpenNewBookingForRoom,
  onOpenNewBooking,
  onOpenNewBookingWithDates,
  onSelectDate,
  onShiftDate,
  onOpenQuickChecker,
  onOpenAddPayment,
  onOpenAddOrder,
  onOpenReceipt,
  onOpenCheckoutModal,
  onOpenCloneBooking,
  onCheckOutGuest,
  onTriggerConfirmClean,
  onTriggerConfirmMaintenance,
}) => {
  const selectedMapRoom = rooms.find(r => r.roomNumber === selectedMapRoomNumber) || rooms[0];
  const selectedMapRoomState = selectedMapRoom 
    ? getRoomStatusOnDate(selectedMapRoom) 
    : { status: 'available' as RoomStatus, booking: undefined };
  const selectedMapBooking = selectedMapRoomState.booking;

  // Helper for single room 30-day availability
  const getRoomMonthAvailability = (roomId: string) => {
    const daysInSeptember = Array.from({ length: 30 }, (_, i) => {
      const d = i + 1;
      const dateStr = `2026-09-${String(d).padStart(2, '0')}`;
      const hasBooking = bookings.find(b => 
        (b.roomId === roomId || b.roomNumber === roomId) &&
        b.checkInDate <= dateStr &&
        b.checkOutDate > dateStr &&
        b.status !== 'cancelled' &&
        !b.deletedAt
      );
      return {
        day: d,
        dateStr,
        isOccupied: !!hasBooking,
        booking: hasBooking,
      };
    });
    return daysInSeptember;
  };

  const selectedRoomDays = selectedMapRoom ? getRoomMonthAvailability(selectedMapRoom.id) : [];

  return (
    <div className="space-y-4 animate-view-transition">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        
        {/* LEFT / TOP: 3D Interactive Masterplan Map (7 cols on desktop) */}
        <div className="lg:col-span-7 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
          
          {/* Map Header Bar with Date Navigator */}
          <div className="p-3 bg-slate-900/95 text-white flex items-center justify-between border-b border-slate-800 text-xs flex-wrap gap-2">
            <div className="flex items-center gap-2 font-bold">
              <Trees className="w-4 h-4 text-emerald-400" />
              <span>แผนผัง 3D:</span>
              <div className="flex items-center gap-1">
                {onShiftDate && (
                  <button
                    type="button"
                    onClick={() => onShiftDate(-1)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="ดูวันก่อนหน้า"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                )}
                <span className="text-emerald-300 font-extrabold px-2 py-0.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-[11px] sm:text-xs">
                  {formatThaiDate(selectedDate)} {isViewingToday ? '(วันนี้)' : ''}
                </span>
                {onShiftDate && (
                  <button
                    type="button"
                    onClick={() => onShiftDate(1)}
                    className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                    title="ดูวันถัดไป"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px]">
              <span className="flex items-center gap-1 font-bold text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span> ว่าง
              </span>
              <span className="flex items-center gap-1 font-bold text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> มีคนพัก
              </span>
              <span className="flex items-center gap-1 font-bold text-amber-400">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> รอแม่บ้าน
              </span>
            </div>
          </div>
          {/* Masterplan Image with Interactive Overlay Pins */}
          <div className="relative w-full aspect-video bg-slate-900 select-none overflow-hidden group">
            <img 
              src="/swan-hill-masterplan.jpg" 
              alt="Swan HILL 3D Masterplan"
              className="w-full h-full object-cover"
            />

            {/* Ambient dark gradient overlay at top/bottom for crispness */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-black/20 pointer-events-none" />

            {/* Interactive Room Hotspot Pins: ONLY S1 - S6 (Clean, Circular, Unobstructed) */}
            {rooms.map((room) => {
              const coords = PIN_COORDINATES[room.roomNumber] || { top: '50%', left: '50%' };
              const isSelected = selectedMapRoomNumber === room.roomNumber;
              const roomState = getRoomStatusOnDate(room);
              const isAvailable = roomState.status === 'available';
              const isOccupied = roomState.status === 'occupied';
              const isCleaning = roomState.status === 'cleaning';

              return (
                <button
                  key={room.id}
                  onClick={() => {
                    onSelectMapRoomNumber(room.roomNumber);
                    onRightPanelTabChange('single');
                  }}
                  style={{ top: coords.top, left: coords.left }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group/pin z-20 ${
                    isSelected ? 'scale-125 z-30' : 'hover:scale-110'
                  }`}
                  title={`บ้าน ${room.roomNumber}`}
                >
                  {/* Outer Glowing Pulse */}
                  <span className={`absolute -inset-1 rounded-full opacity-75 blur-xs ${
                    isAvailable ? 'bg-emerald-400/80 animate-ping' :
                    isOccupied ? 'bg-rose-500/80 animate-pulse' :
                    isCleaning ? 'bg-amber-400/90 animate-pulse' : 'bg-slate-400/80'
                  }`} />

                  {/* Clean, Compact Circular Room Pin Badge - ONLY S1, S2, S3... */}
                  <div className={`relative w-8 h-8 sm:w-9 sm:h-9 rounded-full shadow-2xl flex items-center justify-center border-2 transition-all backdrop-blur-md ${
                    isSelected
                      ? 'ring-4 ring-white bg-slate-950 text-white border-emerald-400 shadow-emerald-500/80'
                      : isAvailable
                      ? 'bg-emerald-600/95 text-white border-emerald-200 shadow-emerald-950/60'
                      : isOccupied
                      ? 'bg-rose-600/95 text-white border-rose-200 shadow-rose-950/60'
                      : isCleaning
                      ? 'bg-amber-500/95 text-white border-amber-200 shadow-amber-950/60'
                      : 'bg-slate-700/95 text-white border-slate-400 shadow-slate-950/60'
                  }`}>
                    <span className="font-black text-xs sm:text-sm tracking-tight text-white drop-shadow-sm">
                      {room.roomNumber}
                    </span>
                  </div>

                  {/* Locator Arrow Indicator when selected */}
                  {isSelected && (
                    <div className="absolute left-1/2 -translate-x-1/2 -bottom-2 w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-white drop-shadow-md" />
                  )}
                </button>
              );
            })}

            {/* Bottom Watermark Tag */}
            <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-medium pointer-events-none">
              แตะที่ป้ายบ้านพักบนแผนที่ 3D เพื่อดูรายละเอียดสถานะประจำวันที่ {formatThaiDate(selectedDate)}
            </div>
          </div>
        </div>

        {/* RIGHT: RoomScope-style Inspector & Multi-Room Availability Panel (5 cols on desktop) */}
        <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xl p-4 md:p-5 flex flex-col justify-between min-h-[640px]">
          
          {/* Tab Switcher: Apple Liquid Glass Sliding Capsule */}
          <LiquidSegmentedControl<'all' | 'single'>
            options={[
              { 
                value: 'all', 
                label: `⚡ สรุปทั้ง 6 หลัง (ว่าง ${rooms.filter(r => getRoomStatusOnDate(r).status === 'available').length})`,
                icon: <Home className="w-3.5 h-3.5" />
              },
              { 
                value: 'single', 
                label: `บ้าน ${selectedMapRoom?.roomNumber || 'S1'} (${formatThaiDate(selectedDate)})`,
                icon: <Calendar className="w-3.5 h-3.5" />
              },
            ]}
            value={rightPanelTab}
            onChange={(val) => onRightPanelTabChange(val)}
            variant="emerald"
            size="md"
            fullWidth
          />

          {/* TAB 1: ALL 6 HOUSES AVAILABILITY */}
          {rightPanelTab === 'all' && (
            <div className="flex-1 flex flex-col justify-between space-y-3 animate-in fade-in mt-3">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-100 text-xs">
                <div>
                  <span className="text-[11px] text-slate-400 font-medium block">
                    {isViewingToday ? '📌 สถานะวันนี้' : '📅 สถานะประจำวันที่'}
                  </span>
                  <span className="font-bold text-slate-900 text-sm">
                    {formatThaiDate(selectedDate)}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={onCopyAvailableRoomsOnDate}
                    className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all cursor-pointer"
                    title="คัดลอกข้อความสรุปบ้านที่ว่าง ส่งตอบลูกค้าใน LINE"
                  >
                    {copiedLineAllSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 stroke-2" />
                        <span>คัดลอกแล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-emerald-600" />
                        <span>คัดลอกส่ง LINE</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={onOpenQuickChecker}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                    title="เปิดระบบเช็คห้องว่างช่วงวันอื่น"
                  >
                    <Search className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* List of all 6 Houses */}
              <div className="space-y-2.5 max-h-[480px] overflow-y-auto pr-0.5 flex-1">
                {rooms.map((room) => {
                  const roomState = getRoomStatusOnDate(room);
                  const isAvail = roomState.status === 'available';
                  const isOcc = roomState.status === 'occupied';
                  const isClean = roomState.status === 'cleaning';

                  return (
                    <div
                      key={room.id}
                      className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                        isAvail
                          ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500 shadow-2xs'
                          : isClean
                          ? 'bg-amber-50/40 border-amber-300/80 shadow-2xs'
                          : 'bg-slate-50 border-slate-200/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs shrink-0 shadow-xs ${
                          isAvail ? 'bg-emerald-600 text-white' : isOcc ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white'
                        }`}>
                          {room.roomNumber}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-slate-900 text-xs">
                              บ้าน {room.roomNumber}
                            </span>
                            <span className="text-[11px] text-slate-500 truncate">
                              ({room.type})
                            </span>
                          </div>
                          <div className="flex items-center gap-2 text-[11px] mt-0.5">
                            {isAvail ? (
                              <span className="text-emerald-700 font-bold">
                                ฿{room.pricePerNight.toLocaleString()}/คืน &bull; ว่างพร้อมจอง
                              </span>
                            ) : isClean ? (
                              <span className="text-amber-800 font-bold truncate">
                                🟡 รอทำความสะอาด {roomState.booking ? `(เพิ่งเช็คเอาท์: ${roomState.booking.guestName})` : ''}
                              </span>
                            ) : (
                              <span className="text-rose-600 font-medium truncate">
                                🔴 มีคนพัก: {roomState.booking?.guestName || 'ติดจอง'}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {isAvail ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenNewBookingWithDates) {
                                const nextDay = shiftDateStr(selectedDate, 1);
                                onOpenNewBookingWithDates(room.id, selectedDate, nextDay);
                              } else if (onOpenNewBookingForRoom) {
                                onOpenNewBookingForRoom(room.id);
                              } else {
                                onOpenNewBooking();
                              }
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>จอง</span>
                          </button>
                        ) : isClean ? (
                          <button
                            type="button"
                            onClick={() => onTriggerConfirmClean(room)}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 text-[10px] font-bold rounded-lg border border-amber-300 transition-all cursor-pointer"
                            title="กดเมื่อทำความสะอาดเสร็จแล้ว"
                          >
                            เปิดห้องว่าง
                          </button>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                            มีคนพัก
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            onSelectMapRoomNumber(room.roomNumber);
                            onRightPanelTabChange('single');
                          }}
                          className="px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                          title={`ดูปฏิทินของบ้าน ${room.roomNumber}`}
                        >
                          ปฏิทิน
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: SINGLE ROOM DETAILS & 30-DAY CALENDAR */}
          {rightPanelTab === 'single' && selectedMapRoom && (
            <div className="flex-1 flex flex-col justify-between space-y-3 animate-in fade-in mt-3">
              <div className="space-y-3">
                {/* Header: Room Title & Price (Reflecting selectedDate status) */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                      selectedMapRoomState.status === 'available' ? 'bg-emerald-600 text-white' :
                      selectedMapRoomState.status === 'occupied' ? 'bg-rose-600 text-white' :
                      selectedMapRoomState.status === 'cleaning' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
                    }`}>
                      {selectedMapRoom.roomNumber}
                    </div>
                    <div>
                      <h2 className="text-base font-black text-slate-900 flex items-center gap-1.5">
                        <span>ห้อง {selectedMapRoom.roomNumber}</span>
                        <span className="text-xs text-slate-500 font-normal">({selectedMapRoom.name})</span>
                      </h2>
                      <p className="text-xs text-emerald-800 font-bold">
                        ฿{selectedMapRoom.pricePerNight.toLocaleString()} บาท / คืน
                      </p>
                    </div>
                  </div>

                  <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${
                    selectedMapRoomState.status === 'available' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    selectedMapRoomState.status === 'occupied' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                    selectedMapRoomState.status === 'cleaning' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {selectedMapRoomState.status === 'available' ? '🟢 ว่างพร้อมขาย' :
                     selectedMapRoomState.status === 'occupied' ? '🔴 มีคนพัก' :
                     selectedMapRoomState.status === 'cleaning' ? '🟡 รอทำความสะอาด' : '⚪ ปิดปรับปรุง'}
                  </span>
                </div>

                {/* 30-Day Monthly Availability Calendar for this Room */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      สถานะห้องว่าง (แตะวันที่เพื่อดูบนผัง 3D)
                    </span>
                    <div className="flex items-center gap-2 text-[10px] font-bold">
                      <span className="flex items-center gap-1 text-emerald-700"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ว่าง</span>
                      <span className="flex items-center gap-1 text-rose-700"><span className="w-2 h-2 rounded-full bg-rose-500"></span> เต็ม</span>
                    </div>
                  </div>

                  {/* 7-column Calendar Day Grid */}
                  <div className="grid grid-cols-7 gap-1 text-center">
                    {['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'].map((d, i) => (
                      <span key={i} className="text-[10px] font-bold text-slate-500 py-0.5">{d}</span>
                    ))}

                    {/* September 2026 starts on Tuesday (2 offset spaces) */}
                    <div className="p-1"></div>
                    <div className="p-1"></div>

                    {selectedRoomDays.map((d) => {
                      const isThisSelectedDate = d.dateStr === selectedDate;
                      return (
                        <button
                          key={d.day}
                          type="button"
                          onClick={() => onSelectDate && onSelectDate(d.dateStr)}
                          title={`วันที่ ${d.day}: ${d.isOccupied ? `มีคนพัก (${d.booking?.guestName})` : 'ว่างพร้อมจอง'} (แตะเพื่อดูบนแผนที่ 3D)`}
                          className={`p-1 rounded-lg text-[10px] font-black transition-all flex flex-col items-center justify-center cursor-pointer active:scale-90 ${
                            isThisSelectedDate
                              ? 'ring-2 ring-slate-900 scale-110 shadow-md z-10'
                              : ''
                          } ${
                            d.isOccupied
                              ? 'bg-rose-500 text-white shadow-2xs font-black'
                              : 'bg-emerald-500 text-white shadow-2xs font-bold'
                          }`}
                        >
                          <span>{d.day}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Equalized Lower Details & Actions Section (Reflecting selectedDate status) */}
              <div className="space-y-2 pt-2 border-t border-slate-100 min-h-[220px] flex flex-col justify-between">
                {/* Guest & Financial Details Section */}
                {selectedMapRoomState.status === 'occupied' && selectedMapBooking ? (
                  <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-blue-600" />
                        {selectedMapBooking.guestName}
                      </span>
                      <a href={`tel:${selectedMapBooking.guestPhone}`} className="text-[11px] text-blue-700 font-bold flex items-center gap-1 hover:underline">
                        <Phone className="w-3 h-3" />
                        {selectedMapBooking.guestPhone}
                      </a>
                    </div>

                    {selectedMapBooking.groupId && (
                      <div className="flex items-center justify-between text-[11px] bg-indigo-100/70 p-1.5 rounded-xl border border-indigo-200">
                        <span className="font-bold text-indigo-900 flex items-center gap-1">
                          <Users className="w-3.5 h-3.5 text-indigo-600" />
                          <span>กรุ๊ป: บ้าน <strong>{selectedMapBooking.groupRoomNumbers?.join(' + ') || 'หลายห้อง'}</strong></span>
                        </span>
                        {selectedMapBooking.groupBookingCode && (
                          <span className="text-[9px] font-mono font-bold text-indigo-700 bg-white px-1.5 py-0.5 rounded border border-indigo-200">
                            #{selectedMapBooking.groupBookingCode}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="text-[11px] text-slate-600 flex justify-between font-medium">
                      <span>เข้าพัก: {formatThaiDate(selectedMapBooking.checkInDate)}</span>
                      <span>ออก: {formatThaiDate(selectedMapBooking.checkOutDate)} ({selectedMapBooking.totalNights} คืน)</span>
                    </div>

                    {/* Financial Breakdown (Paid, Deposit %, Remaining) */}
                    <div className="pt-2 border-t border-blue-200/80 grid grid-cols-3 gap-1.5 text-center">
                      <div className="p-1.5 bg-white rounded-xl border border-blue-100">
                        <span className="text-[9px] text-slate-500 block font-bold">ยอดรวมสุทธิ</span>
                        <span className="text-xs font-black text-slate-900">
                          ฿{selectedMapBooking.totalAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="p-1.5 bg-emerald-100/80 rounded-xl border border-emerald-200">
                        <span className="text-[9px] text-emerald-800 block font-bold">
                          {selectedMapBooking.paidAmount >= selectedMapBooking.totalAmount ? 'ชำระครบ' : `มัดจำ ${((selectedMapBooking.paidAmount / selectedMapBooking.totalAmount) * 100).toFixed(0)}%`}
                        </span>
                        <span className="text-xs font-black text-emerald-900">
                          ฿{selectedMapBooking.paidAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className={`p-1.5 rounded-xl border ${selectedMapBooking.totalAmount - selectedMapBooking.paidAmount > 0 ? 'bg-amber-100/90 border-amber-300' : 'bg-slate-100 border-slate-200'}`}>
                        <span className="text-[9px] text-amber-900 block font-bold">ค้างชำระ</span>
                        <span className="text-xs font-black text-amber-950">
                          ฿{Math.max(0, selectedMapBooking.totalAmount - selectedMapBooking.paidAmount).toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : selectedMapRoomState.status === 'cleaning' ? (
                  <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-amber-950 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-amber-600" />
                        <span>กำลังทำความสะอาด (รอส่งมอบห้อง)</span>
                      </span>
                      <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                        รอทำความสะอาด
                      </span>
                    </div>
                    {selectedMapBooking && (
                      <p className="text-[11px] text-amber-900 font-medium bg-white/70 p-2 rounded-xl border border-amber-200/60">
                        🚪 แขกเพิ่งเช็คเอาท์: <strong>คุณ {selectedMapBooking.guestName}</strong> ({formatThaiDate(selectedMapBooking.checkInDate)} - {formatThaiDate(selectedMapBooking.checkOutDate)})
                      </p>
                    )}
                    <p className="text-[11px] text-slate-600">
                      แม่บ้านกำลังตรวจเช็คอุปกรณ์ จัดเก็บขยะ และเปลี่ยนชุดเครื่องนอนสำหรับผู้เข้าพักรอบถัดไป
                    </p>
                    <div className="pt-1.5 border-t border-amber-200/80 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="p-1 bg-white rounded-xl border border-amber-100 font-bold text-slate-700">ห้อง {selectedMapRoom.roomNumber}</div>
                      <div className="p-1 bg-white rounded-xl border border-amber-100 font-bold text-slate-700">{selectedMapRoom.type}</div>
                      <div className="p-1 bg-white rounded-xl border border-amber-100 font-bold text-emerald-800">฿{selectedMapRoom.pricePerNight.toLocaleString()}/คืน</div>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 bg-emerald-50/80 border border-emerald-200 rounded-2xl space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-emerald-950 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>บ้านพักว่างพร้อมเปิดรับจอง ประจำวันที่ {formatThaiDate(selectedDate)}</span>
                      </span>
                      <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                        พร้อมเข้าพัก
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600">
                      ห้องว่างสะอาดเรียบร้อย อุปกรณ์พร้อมใช้งาน สามารถบันทึกการจองหรือเปิดขายให้ลูกค้าได้ทันที
                    </p>
                    <div className="pt-1.5 border-t border-emerald-200/80 grid grid-cols-3 gap-1.5 text-center text-[10px]">
                      <div className="p-1 bg-white rounded-xl border border-emerald-100 font-bold text-slate-700">สูงสุด {selectedMapRoom.capacity} ท่าน</div>
                      <div className="p-1 bg-white rounded-xl border border-emerald-100 font-bold text-slate-700">{selectedMapRoom.type}</div>
                      <div className="p-1 bg-white rounded-xl border border-emerald-100 font-bold text-emerald-800">฿{selectedMapRoom.pricePerNight.toLocaleString()}/คืน</div>
                    </div>
                  </div>
                )}

                {/* Actions for Selected Map Room */}
                <div className="space-y-1.5">
                  {selectedMapRoomState.status === 'available' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenNewBookingWithDates) {
                            const nextDay = shiftDateStr(selectedDate, 1);
                            onOpenNewBookingWithDates(selectedMapRoom.id, selectedDate, nextDay);
                          } else if (onOpenNewBookingForRoom) {
                            onOpenNewBookingForRoom(selectedMapRoom.id);
                          } else {
                            onOpenNewBooking();
                          }
                        }}
                        className="col-span-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <Plus className="w-4 h-4 stroke-[3]" />
                        <span>บันทึกการจองห้อง {selectedMapRoom.roomNumber} ({formatThaiDate(selectedDate)})</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenQuickChecker}
                        className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 transition-all cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-emerald-600" />
                        <span>เช็ควันอื่น</span>
                      </button>
                      <button
                        type="button"
                        onClick={onCopyAvailableRoomsOnDate}
                        className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-98 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 transition-all cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-slate-600" />
                        <span>คัดลอกส่ง LINE</span>
                      </button>
                    </div>
                  )}

                  {selectedMapRoomState.status === 'occupied' && selectedMapBooking && (
                    <div className="grid grid-cols-2 gap-2">
                      {onOpenCloneBooking && (
                        <button
                          type="button"
                          onClick={() => onOpenCloneBooking(selectedMapBooking)}
                          className="col-span-2 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                        >
                          <Plus className="w-4 h-4 stroke-[3]" />
                          <span>จองเพิ่มอีกห้องให้ลูกค้ารายนี้ ({selectedMapBooking.guestName})</span>
                        </button>
                      )}

                      {onOpenAddPayment && (
                        <button
                          type="button"
                          onClick={() => onOpenAddPayment(selectedMapBooking)}
                          className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>การชำระเงิน</span>
                        </button>
                      )}

                      {onOpenAddOrder && (
                        <button
                          type="button"
                          onClick={() => onOpenAddOrder(selectedMapBooking)}
                          className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all cursor-pointer"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                          <span>สั่งหมูกระทะ</span>
                        </button>
                      )}

                      {onOpenReceipt && (
                        <button
                          type="button"
                          onClick={() => onOpenReceipt(selectedMapBooking)}
                          className="py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 transition-all cursor-pointer"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>พิมพ์ใบเสร็จ</span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          if (onOpenCheckoutModal) onOpenCheckoutModal(selectedMapBooking);
                          else onCheckOutGuest(selectedMapBooking.id);
                        }}
                        className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 border border-rose-200 transition-all cursor-pointer"
                      >
                        <span>เช็คเอาท์</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {selectedMapRoomState.status === 'cleaning' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onTriggerConfirmClean(selectedMapRoom)}
                        className="col-span-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ทำความสะอาดเสร็จแล้ว (เปิดห้องว่าง)</span>
                      </button>
                      <button
                        type="button"
                        onClick={onOpenQuickChecker}
                        className="col-span-2 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 transition-all cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5 text-slate-600" />
                        <span>ตรวจสอบคิวห้องว่างวันอื่น</span>
                      </button>
                    </div>
                  )}

                  {selectedMapRoomState.status === 'maintenance' && (
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onTriggerConfirmMaintenance(selectedMapRoom)}
                        className="col-span-2 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all cursor-pointer"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>เปิดใช้งานห้องพัก (เปิดว่าง)</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
