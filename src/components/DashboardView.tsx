import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  ArrowRight, 
  Phone, 
  Calendar, 
  X, 
  CheckCircle2, 
  Clock, 
  Coins, 
  Home, 
  UtensilsCrossed, 
  Map, 
  LayoutGrid, 
  Trees, 
  Receipt, 
  CreditCard, 
  AlertTriangle, 
  ChevronRight,
  ChevronLeft,
  DoorOpen,
  Search,
  Copy,
  Check
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../types/pms';
import { formatThaiDate, THAI_MONTHS_FULL, shiftDateStr } from '../utils/dateUtils';
import { ConfirmDialogModal, type ConfirmType } from './ConfirmDialogModal';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { QuickAvailabilityModal } from './QuickAvailabilityModal';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

const THAI_DAYS = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];

const formatThaiFullDate = (dateStr: string): string => {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) return dateStr;
  const dayName = THAI_DAYS[d.getDay()];
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const yearBE = d.getFullYear() + 543;
  return `${dayName}ที่ ${day} ${month} ${yearBE}`;
};

interface DashboardViewProps {
  rooms: Room[];
  bookings: Booking[];
  onUpdateRoomStatus: (roomId: string, newStatus: RoomStatus) => void;
  onCheckInGuest?: (bookingId: string) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onOpenNewBookingForRoom?: (roomId: string) => void;
  onOpenNewBooking: () => void;
  onOpenNewBookingWithDates?: (roomId: string, checkIn: string, checkOut: string) => void;
  onOpenQuickChecker?: () => void;
  onOpenAddOrder?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onOpenAddPayment?: (booking: Booking) => void;
  onOpenCheckoutModal?: (booking: Booking) => void;
}

// 3D Masterplan Coordinate Pin Locations (Strictly accurate to real Swan HILL architecture)
const PIN_COORDINATES: Record<string, { top: string; left: string }> = {
  S6: { top: '44%', left: '16%' },
  S5: { top: '40%', left: '29%' },
  S4: { top: '30%', left: '42%' },
  S3: { top: '33%', left: '54%' },
  S2: { top: '39%', left: '66%' },
  S1: { top: '47%', left: '83%' },
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  rooms,
  bookings,
  onUpdateRoomStatus,
  onCheckInGuest: _onCheckInGuest,
  onCheckOutGuest,
  onOpenNewBookingForRoom,
  onOpenNewBooking,
  onOpenNewBookingWithDates,
  onOpenQuickChecker,
  onOpenAddOrder,
  onOpenReceipt,
  onOpenAddPayment,
  onOpenCheckoutModal,
}) => {
  const [selectedRoomModal, setSelectedRoomModal] = useState<Room | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [selectedMapRoomNumber, setSelectedMapRoomNumber] = useState<string>('S1');
  const [rightPanelTab, setRightPanelTab] = useState<'all' | 'single'>('all');
  const [isQuickCheckerOpen, setIsQuickCheckerOpen] = useState(false);
  const [copiedLineAllSuccess, setCopiedLineAllSuccess] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    roomBadge?: string;
    confirmText?: string;
    cancelText?: string;
    type: ConfirmType;
    onConfirm: () => void;
  } | null>(null);

  useLockBodyScroll(!!selectedRoomModal || !!confirmDialog);

  // Today's Date String (local timezone safe)
  const getLocalDateStr = (d: Date = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const hasToday = bookings.some(b => b.checkInDate <= todayStr && b.checkOutDate >= todayStr && !b.deletedAt);
    if (hasToday) return todayStr;
    const hasSept = bookings.some(b => b.checkInDate <= '2026-09-01' && b.checkOutDate >= '2026-09-01' && !b.deletedAt);
    if (hasSept) return '2026-09-01';
    return todayStr;
  });

  const isViewingToday = selectedDate === todayStr;

  const handleShiftDate = (days: number) => {
    const parts = selectedDate.split('-').map(Number);
    const y = parts[0] || new Date().getFullYear();
    const m = parts[1] || (new Date().getMonth() + 1);
    const d = parts[2] || new Date().getDate();
    const current = new Date(y, m - 1, d);
    current.setDate(current.getDate() + days);
    setSelectedDate(getLocalDateStr(current));
  };

  const handleResetToToday = () => {
    setSelectedDate(todayStr);
  };

  // Helper to determine room status on selectedDate
  const getRoomStatusOnDate = (room: Room) => {
    if (isViewingToday) {
      const currentBooking = room.currentGuest?.bookingId 
        ? bookings.find(b => b.id === room.currentGuest?.bookingId)
        : bookings.find(b => (b.roomId === room.id || b.roomNumber === room.roomNumber) && b.checkInDate <= todayStr && b.checkOutDate > todayStr && b.status !== 'cancelled' && !b.deletedAt);
      return {
        status: room.status,
        booking: currentBooking,
      };
    }

    // For other dates, look for an active booking
    const booking = bookings.find(b => 
      (b.roomId === room.id || b.roomNumber === room.roomNumber) && 
      b.checkInDate <= selectedDate && 
      b.checkOutDate > selectedDate && 
      b.status !== 'cancelled' && 
      !b.deletedAt
    );

    if (booking) {
      return { status: 'occupied' as RoomStatus, booking };
    }
    return { status: 'available' as RoomStatus, booking: undefined };
  };

  const handleCopyAvailableRoomsOnDate = () => {
    const nextDayStr = shiftDateStr(selectedDate, 1);
    const availableOnDate = rooms.filter(r => getRoomStatusOnDate(r).status === 'available');

    if (availableOnDate.length === 0) {
      const text = `🌿 สวอนฮิลล์ รีสอร์ท (Swan HILL)\n📅 ประจำวันที่: ${formatThaiDate(selectedDate)}\nขออภัยครับ วันนี้บ้านพักเต็มทุกหลังแล้วครับ 🙏`;
      navigator.clipboard.writeText(text);
      setCopiedLineAllSuccess(true);
      setTimeout(() => setCopiedLineAllSuccess(false), 2500);
      return;
    }

    const houseList = availableOnDate.map((r, i) => 
      `${i + 1}. บ้าน ${r.roomNumber} (${r.type}) - พักได้ ${r.capacity} ท่าน\n   ราคา: ฿${r.pricePerNight.toLocaleString()} /คืน`
    ).join('\n');

    const text = `🌿 สวอนฮิลล์ รีสอร์ท (Swan HILL)\nขอแจ้งบ้านพักที่ว่างพร้อมให้บริการครับ ✨\n\n📅 วันที่เข้าพัก: ${formatThaiDate(selectedDate)} ถึง ${formatThaiDate(nextDayStr)} (1 คืน)\n\n🏡 บ้านที่ว่างมีดังนี้ครับ:\n${houseList}\n\n🍲 มีบริการสั่งหมูกระทะส่งตรงถึงหน้าบ้านพัก\nสนใจจองหรือสอบถามเพิ่มเติมแจ้งได้เลยนะครับ 😊`;

    navigator.clipboard.writeText(text);
    setCopiedLineAllSuccess(true);
    setTimeout(() => setCopiedLineAllSuccess(false), 2500);
  };

  const totalRooms = rooms.length;

  // Dynamic status on selectedDate across all rooms
  const roomsWithDateState = rooms.map(r => ({
    room: r,
    state: getRoomStatusOnDate(r),
  }));

  const availableRooms = roomsWithDateState.filter(item => item.state.status === 'available').length;
  const occupiedRooms = roomsWithDateState.filter(item => item.state.status === 'occupied').length;
  const arrivalsOnDate = bookings.filter(b => b.checkInDate === selectedDate && b.status !== 'cancelled' && !b.deletedAt);
  const departuresOnDate = bookings.filter(b => b.checkOutDate === selectedDate && b.status !== 'cancelled' && !b.deletedAt);
  const totalMonthRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);

  // Map room lookup by number
  const roomMap: Record<string, Room | undefined> = {};
  rooms.forEach(r => { roomMap[r.roomNumber] = r; });

  // Currently selected room in 3D Map Inspector
  const selectedMapRoom = roomMap[selectedMapRoomNumber] || rooms[0];
  const selectedMapState = selectedMapRoom ? getRoomStatusOnDate(selectedMapRoom) : undefined;
  const selectedMapBooking = selectedMapState?.booking || (
    selectedMapRoom?.currentGuest?.bookingId
      ? bookings.find(b => b.id === selectedMapRoom.currentGuest?.bookingId)
      : bookings.find(b => b.roomId === selectedMapRoom?.id && b.status !== 'cancelled')
  );

  // Strictly order rooms sequentially: S1, S2 -> S3, S4 -> S5, S6
  const mediumRooms = [roomMap['S1'], roomMap['S2']].filter((r): r is Room => Boolean(r));
  const largeRooms = [roomMap['S3'], roomMap['S4']].filter((r): r is Room => Boolean(r));
  const smallRooms = [roomMap['S5'], roomMap['S6']].filter((r): r is Room => Boolean(r));

  // Generate availability for September 2026 (30 days) for a given room
  const getRoomMonthAvailability = (roomId: string) => {
    const days = [];
    const activeBookings = bookings.filter(b => (b.roomId === roomId || b.roomNumber === roomId) && b.status !== 'cancelled' && !b.deletedAt);

    for (let day = 1; day <= 30; day++) {
      const dateStr = `2026-09-${String(day).padStart(2, '0')}`;
      const bookingOnDay = activeBookings.find(b => {
        return dateStr >= b.checkInDate && dateStr < b.checkOutDate;
      });

      days.push({
        day,
        dateStr,
        isOccupied: Boolean(bookingOnDay),
        booking: bookingOnDay,
      });
    }
    return days;
  };

  const selectedRoomDays = selectedMapRoom ? getRoomMonthAvailability(selectedMapRoom.id) : [];

  const renderRoomCard = (room: Room) => {
    const roomState = getRoomStatusOnDate(room);
    const isAvailable = roomState.status === 'available';
    const isOccupied = roomState.status === 'occupied';
    const isCleaning = roomState.status === 'cleaning';
    const isMaintenance = roomState.status === 'maintenance';

    const currentBooking = roomState.booking;

    const roomBaseTotal = currentBooking ? currentBooking.roomPrice * currentBooking.totalNights : 0;
    const addOnsTotal = currentBooking?.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
    const grandTotal = currentBooking?.totalAmount || (roomBaseTotal + addOnsTotal);
    const remainingBalance = currentBooking ? Math.max(0, grandTotal - currentBooking.paidAmount) : 0;

    return (
      <div 
        key={room.id}
        onClick={() => setSelectedRoomModal(room)}
        className={`group relative rounded-2xl p-3.5 transition-all duration-300 border cursor-pointer flex flex-col justify-between ${
          isAvailable 
            ? 'bg-white hover:border-emerald-400 border-slate-200/80 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-lg' 
            : isOccupied 
            ? 'bg-blue-50/70 border-blue-200/90 shadow-[0_4px_20px_rgba(37,99,235,0.06)]' 
            : isCleaning 
            ? 'bg-amber-50/70 border-amber-200/90 shadow-[0_4px_20px_rgba(217,119,6,0.06)]' 
            : 'bg-slate-50 border-slate-200 text-slate-400'
        }`}
      >
        <div>
          {/* Card Header: Room Number & Status */}
          <div className="flex items-center justify-between gap-1.5 mb-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 shadow-2xs ${
                isAvailable ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                isOccupied ? 'bg-blue-600 text-white shadow-blue-500/20' :
                isCleaning ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                {room.roomNumber}
              </span>
              <div className="min-w-0">
                <span className="font-semibold text-xs text-slate-800 truncate block">
                  {room.name}
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  ฿{room.pricePerNight.toLocaleString()}/คืน
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium shrink-0 ${
              isAvailable ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
              isOccupied ? 'bg-blue-100 text-blue-900 border border-blue-300' :
              isCleaning ? 'bg-amber-100 text-amber-900 border border-amber-300' :
              'bg-slate-200 text-slate-700'
            }`}>
              {isAvailable ? 'ว่าง' : isOccupied ? 'มีคนพัก' : isCleaning ? 'รอแม่บ้าน' : 'ปิดซ่อม'}
            </span>
          </div>

          {/* Guest Stay Information */}
          {isOccupied && room.currentGuest && (
            <div className="p-2 rounded-xl bg-white/90 border border-blue-200/80 text-[11px] space-y-1 shadow-2xs">
              <span className="font-medium text-slate-800 flex items-center gap-1 truncate">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{room.currentGuest.name}</span>
              </span>
              <span className="text-[10px] text-slate-500 block font-normal">
                ออก {formatThaiDate(room.currentGuest.checkOut)}
              </span>

              {/* Payment Alert Banner */}
              {remainingBalance > 0 ? (
                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 font-normal text-[10px] flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate">
                    <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                    ค้างชำระ:
                  </span>
                  <span className="font-semibold text-amber-950">฿{remainingBalance.toLocaleString()}</span>
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-emerald-50 text-emerald-800 font-medium text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ชำระครบแล้ว (฿{grandTotal.toLocaleString()})</span>
                </div>
              )}

              {/* Add-on Summary Pill */}
              {currentBooking?.addOns && currentBooking.addOns.length > 0 && (
                <div className="pt-1 border-t border-slate-200 flex flex-wrap gap-1">
                  {currentBooking.addOns.map((a) => (
                    <span key={a.id} className="text-[9px] font-normal bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                      {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cleaning notice */}
          {isCleaning && (
            <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-medium flex items-center gap-1 shadow-2xs">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>กำลังทำความสะอาด</span>
            </div>
          )}
        </div>

        {/* Card Bottom Actions */}
        <div className="mt-2.5 pt-2 border-t border-slate-100 space-y-1.5">
          {isAvailable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(room.id);
                else onOpenNewBooking();
              }}
              className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-medium text-xs flex items-center justify-center gap-1 shadow-2xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>กดจองห้อง {room.roomNumber}</span>
            </button>
          )}

          {isOccupied && (
            <div className="flex gap-1.5 flex-wrap">
              {/* Record Payment Button */}
              {currentBooking && remainingBalance > 0 && onOpenAddPayment && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddPayment(currentBooking);
                  }}
                  className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-xs transition-all"
                  title="จัดการการชำระเงิน"
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>การชำระเงิน</span>
                </button>
              )}

              {/* Order Add-on Button */}
              {currentBooking && onOpenAddOrder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddOrder(currentBooking);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                  title="สั่งหมูกระทะ / บริการเสริม"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>สั่งอาหาร</span>
                </button>
              )}

              {/* Receipt Modal Trigger */}
              {currentBooking && onOpenReceipt && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenReceipt(currentBooking);
                  }}
                  className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                  title="ดูและพิมพ์ใบเสร็จรับเงิน"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>ใบเสร็จ</span>
                </button>
              )}

              {/* Quick Checkout Trigger */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (currentBooking) {
                    if (onOpenCheckoutModal) {
                      onOpenCheckoutModal(currentBooking);
                    } else {
                      onCheckOutGuest(currentBooking.id);
                    }
                  } else if (room.currentGuest?.bookingId) {
                    onCheckOutGuest(room.currentGuest.bookingId);
                  }
                }}
                className="w-full py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[10px] flex items-center justify-center gap-1 border border-rose-200 transition-all"
              >
                <span>เช็คเอาท์ห้อง {room.roomNumber}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {isCleaning && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialog({
                  isOpen: true,
                  type: 'clean',
                  roomBadge: `ห้อง ${room.roomNumber}`,
                  title: 'ยืนยันทำความสะอาดเสร็จสิ้น',
                  description: `คุณต้องการเปลี่ยนสถานะห้อง ${room.roomNumber} เป็น "ห้องว่างพร้อมเปิดรับจอง" ทันทีใช่หรือไม่?`,
                  confirmText: 'ยืนยันเปิดห้องว่าง',
                  onConfirm: () => onUpdateRoomStatus(room.id, 'available'),
                });
              }}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ทำความสะอาดเสร็จแล้ว (เปิดว่าง)</span>
            </button>
          )}

          {isMaintenance && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setConfirmDialog({
                  isOpen: true,
                  type: 'clean',
                  roomBadge: `ห้อง ${room.roomNumber}`,
                  title: 'ยืนยันเปิดใช้งานห้องพัก',
                  description: `คุณต้องการเปิดใช้งานห้อง ${room.roomNumber} ให้เป็นห้องว่างพร้อมขายใช่หรือไม่?`,
                  confirmText: 'ยืนยันเปิดห้องพัก',
                  onConfirm: () => onUpdateRoomStatus(room.id, 'available'),
                });
              }}
              className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-900 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs"
            >
              <span>เปิดใช้งานห้องพัก</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-12 animate-in fade-in duration-500 font-['Prompt']">
      
      {/* DATE SELECTOR & STATUS BAR */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Date Shift Buttons */}
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            type="button"
            onClick={() => handleShiftDate(-1)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0"
            title="ย้อนดูวันก่อนหน้า"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>{isViewingToday ? 'เมื่อวาน' : 'วันก่อนหน้า'}</span>
          </button>

          <button
            type="button"
            onClick={handleResetToToday}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer ${
              isViewingToday 
                ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
            }`}
            title="กลับมาดูสถานะวันปัจจุบัน"
          >
            <Clock className="w-4 h-4" />
            <span>📌 วันนี้</span>
          </button>

          <button
            type="button"
            onClick={() => handleShiftDate(1)}
            className="flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-medium rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0"
            title="ดูสถานะวันถัดไป"
          >
            <span>{isViewingToday ? 'พรุ่งนี้' : 'วันถัดไป'}</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Thai Full Date Label + Date Picker */}
        <div className="flex items-center justify-between sm:justify-end gap-3">
          <div className="text-left sm:text-right">
            <span className="text-[11px] font-normal text-slate-400 block">
              {isViewingToday ? '📌 วันนี้ (วันปัจจุบัน)' : '📅 ดูสถานะล่วงหน้า'}
            </span>
            <span className="text-xs sm:text-sm font-semibold text-slate-900 block">
              {formatThaiFullDate(selectedDate)}
            </span>
          </div>

          <input
            type="date"
            value={selectedDate}
            onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
            title="แตะเพื่อเลือกวันที่ต้องการดูสถานะผังบ้าน"
          />
        </div>
      </div>

      {/* Quick Room Availability Glance Bar for selectedDate (All 6 Houses At A Glance) */}
      <div className="p-3 sm:px-4 bg-gradient-to-r from-emerald-50 via-teal-50 to-white rounded-2xl border border-emerald-200/90 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap min-w-0">
          <div className="flex items-center gap-1.5 shrink-0">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-xs font-bold text-emerald-950">
              บ้านที่ว่าง {isViewingToday ? 'วันนี้' : formatThaiDate(selectedDate)}:
            </span>
          </div>

          {rooms.filter(r => getRoomStatusOnDate(r).status === 'available').length > 0 ? (
            <div className="flex items-center gap-1.5 flex-wrap">
              {rooms
                .filter(r => getRoomStatusOnDate(r).status === 'available')
                .map(r => (
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
          {rooms.filter(r => getRoomStatusOnDate(r).status === 'available').length > 0 && (
            <button
              type="button"
              onClick={handleCopyAvailableRoomsOnDate}
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
            onClick={() => {
              if (onOpenQuickChecker) onOpenQuickChecker();
              else setIsQuickCheckerOpen(true);
            }}
            className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs flex items-center gap-1.5 cursor-pointer transition-all"
            title="เปิดระบบเช็คห้องว่างด่วนตามช่วงวัน"
          >
            <Search className="w-3.5 h-3.5" />
            <span>🔍 เช็คห้องว่างตามช่วงวัน</span>
          </button>
        </div>
      </div>

      {/* Top Banner: Overview KPI Cards (ตามวันที่เลือก) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-emerald-100 font-medium text-xs">บ้านพักว่างพร้อมขาย</span>
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Home className="w-3.5 h-3.5 text-emerald-100" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold">{availableRooms}</span>
            <span className="text-xs text-emerald-200 font-normal">/ {totalRooms} หลัง</span>
          </div>
          <div className="mt-1 text-[10px] text-emerald-200/90 font-normal">
            {isViewingToday ? 'เปิดรับแขกได้ทันที' : `ว่างวันที่ ${formatThaiDate(selectedDate)}`}
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-blue-100 font-medium text-xs">มีคนพัก / จองแล้ว</span>
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Users className="w-3.5 h-3.5 text-blue-100" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold">{occupiedRooms}</span>
            <span className="text-xs text-blue-200 font-normal">/ {totalRooms} หลัง</span>
          </div>
          <div className="mt-1 text-[10px] text-blue-200/90 font-normal">
            อัตราเข้าพัก {totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(0) : 0}%
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-700 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-amber-100 font-medium text-xs">เช็คอินเข้าพักวันนี้</span>
            <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
              <DoorOpen className="w-3.5 h-3.5 text-amber-100" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1.5">
            <span className="text-xl md:text-2xl font-bold">
              {arrivalsOnDate.length}
            </span>
            <span className="text-xs text-amber-200 font-normal">ห้อง</span>
          </div>
          <div className="mt-1 text-[10px] text-amber-200/90 font-normal">
            ออกวันนี้ {departuresOnDate.length} ห้อง
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-medium text-xs">รายได้รวมเดือนนี้</span>
            <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Coins className="w-3.5 h-3.5 text-emerald-400" />
            </div>
          </div>
          <div className="mt-1.5 flex items-baseline gap-1">
            <span className="text-lg md:text-xl font-bold text-emerald-400">
              ฿{totalMonthRevenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-1 text-[10px] text-slate-400 font-normal">
            รวมค่าห้องและหมูกระทะ
          </div>
        </div>
      </div>

      {/* Main Header & View Mode Switcher */}
      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <div>
          <h1 className="text-base md:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Trees className="w-5 h-5 text-emerald-600" />
            <span>ผังบ้านพัก Swan HILL Resort</span>
          </h1>
          <p className="text-xs text-slate-500 font-normal">
            ผัง 3D เสมือนจริง &bull; ตรวจสอบสถานะห้องว่างและรายละเอียดการชำระเงิน
          </p>
        </div>

        {/* View Switcher: Apple Liquid Glass Sliding Capsule */}
        <LiquidSegmentedControl<'map' | 'grid'>
          options={[
            { value: 'map', label: '3D แผนผังรีสอร์ท', icon: <Map className="w-3.5 h-3.5" /> },
            { value: 'grid', label: 'รายการบ้านพัก', icon: <LayoutGrid className="w-3.5 h-3.5" /> },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val)}
          variant="emerald"
          size="md"
        />
      </div>

      {/* VIEW 1: 3D REALISTIC RESORT MASTERPLAN & ROOMSCOPE INSPECTOR */}
      {viewMode === 'map' && (
        <div className="space-y-4 animate-view-transition">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            
            {/* LEFT / TOP: 3D Interactive Masterplan Map (7 cols on desktop) */}
            <div className="lg:col-span-7 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden shadow-xl flex flex-col">
              
              {/* Map Header Bar */}
              <div className="p-3.5 bg-slate-900/90 text-white flex items-center justify-between border-b border-slate-800 text-xs flex-wrap gap-2">
                <div className="flex items-center gap-2 font-bold">
                  <Trees className="w-4 h-4 text-emerald-400" />
                  <span>แผนที่ผัง 3D Swan HILL Resort</span>
                </div>
                <div className="flex items-center gap-3 text-[11px]">
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

                {/* Interactive Room Hotspot Pins */}
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
                        setSelectedMapRoomNumber(room.roomNumber);
                        setRightPanelTab('single');
                      }}
                      style={{ top: coords.top, left: coords.left }}
                      className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 group/pin z-20 ${
                        isSelected ? 'scale-115 z-30' : 'hover:scale-110'
                      }`}
                    >
                      {/* Outer Glowing Pulse */}
                      <span className={`absolute -inset-1 rounded-full opacity-75 blur-xs ${
                        isAvailable ? 'bg-emerald-400 animate-ping' :
                        isOccupied ? 'bg-rose-500 animate-pulse' :
                        isCleaning ? 'bg-amber-400 animate-pulse' : 'bg-slate-400'
                      }`} />

                      {/* Main Room Pin Badge */}
                      <div className={`relative px-2 py-1 rounded-xl shadow-2xl flex items-center gap-1.5 border-2 transition-all ${
                        isSelected
                          ? 'ring-4 ring-white bg-slate-950 text-white border-emerald-400 shadow-emerald-500/50'
                          : isAvailable
                          ? 'bg-emerald-600 text-white border-emerald-300'
                          : isOccupied
                          ? 'bg-rose-600 text-white border-rose-300'
                          : isCleaning
                          ? 'bg-amber-500 text-white border-amber-200'
                          : 'bg-slate-700 text-white border-slate-500'
                      }`}>
                        <span className="w-2 h-2 rounded-full bg-white shrink-0" />
                        <span className="font-black text-xs tracking-wide">{room.roomNumber}</span>
                        <span className="text-[10px] font-bold opacity-90 hidden sm:inline">
                          ฿{room.pricePerNight}
                        </span>
                      </div>
                    </button>
                  );
                })}

                {/* Bottom Watermark Tag */}
                <div className="absolute bottom-2 left-3 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-lg text-[10px] text-slate-300 font-medium pointer-events-none">
                  แตะที่ป้ายห้องพักเพื่อดูตารางว่าง & ยอดชำระเงิน
                </div>
              </div>
            </div>

            {/* RIGHT: RoomScope-style Inspector & Multi-Room Availability Panel (5 cols on desktop) */}
            <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xl p-4 md:p-5 space-y-4">
              
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
                    label: `ปฏิทินบ้าน ${selectedMapRoom?.roomNumber || 'S1'}`,
                    icon: <Calendar className="w-3.5 h-3.5" />
                  },
                ]}
                value={rightPanelTab}
                onChange={(val) => setRightPanelTab(val)}
                variant="emerald"
                size="md"
                fullWidth
              />

              {/* TAB 1: ALL 6 HOUSES AVAILABILITY */}
              {rightPanelTab === 'all' && (
                <div className="space-y-3 animate-in fade-in">
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
                        onClick={handleCopyAvailableRoomsOnDate}
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
                        onClick={() => {
                          if (onOpenQuickChecker) onOpenQuickChecker();
                          else setIsQuickCheckerOpen(true);
                        }}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl border border-slate-200 cursor-pointer"
                        title="เปิดระบบเช็คห้องว่างช่วงวันอื่น"
                      >
                        <Search className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* List of all 6 Houses */}
                  <div className="space-y-2.5 max-h-[460px] overflow-y-auto pr-0.5">
                    {rooms.map((room) => {
                      const roomState = getRoomStatusOnDate(room);
                      const isAvail = roomState.status === 'available';
                      const isOcc = roomState.status === 'occupied';

                      return (
                        <div
                          key={room.id}
                          className={`p-3 rounded-2xl border transition-all flex items-center justify-between gap-2.5 ${
                            isAvail
                              ? 'bg-emerald-50/40 border-emerald-300 hover:border-emerald-500 shadow-2xs'
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
                                    ฿{room.pricePerNight.toLocaleString()}/คืน &bull; สูงสุด {room.capacity} ท่าน
                                  </span>
                                ) : (
                                  <span className="text-rose-600 font-medium truncate">
                                    มีคนพัก: {roomState.booking?.guestName || 'ติดจอง'}
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
                                  if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(room.id);
                                  else onOpenNewBooking();
                                }}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-2xs flex items-center gap-1 transition-all cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                                <span>จอง</span>
                              </button>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-rose-100 text-rose-800 text-[10px] font-bold border border-rose-200">
                                {isOcc ? 'มีคนพัก' : 'รอแม่บ้าน'}
                              </span>
                            )}

                            <button
                              type="button"
                              onClick={() => {
                                setSelectedMapRoomNumber(room.roomNumber);
                                setRightPanelTab('single');
                              }}
                              className="px-2 py-1.5 bg-white hover:bg-slate-100 text-slate-600 text-xs rounded-xl border border-slate-200 transition-all cursor-pointer"
                              title={`ดูปฏิทิน 30 วันของบ้าน ${room.roomNumber}`}
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
                <div className="space-y-4 animate-in fade-in">
                
                {/* Header: Room Title & Price */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-base shadow-sm ${
                      selectedMapRoom.status === 'available' ? 'bg-emerald-600 text-white' :
                      selectedMapRoom.status === 'occupied' ? 'bg-rose-600 text-white' :
                      selectedMapRoom.status === 'cleaning' ? 'bg-amber-500 text-white' : 'bg-slate-700 text-white'
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
                    selectedMapRoom.status === 'available' ? 'bg-emerald-100 text-emerald-900 border-emerald-300' :
                    selectedMapRoom.status === 'occupied' ? 'bg-rose-100 text-rose-900 border-rose-300' :
                    selectedMapRoom.status === 'cleaning' ? 'bg-amber-100 text-amber-900 border-amber-300' :
                    'bg-slate-100 text-slate-800 border-slate-300'
                  }`}>
                    {selectedMapRoom.status === 'available' ? '🟢 ว่างพร้อมขาย' :
                     selectedMapRoom.status === 'occupied' ? '🔴 มีคนพัก' :
                     selectedMapRoom.status === 'cleaning' ? '🟡 รอแม่บ้าน' : '⚪ ปิดปรับปรุง'}
                  </span>
                </div>

                {/* 30-Day Monthly Availability Calendar for this Room (กันยายน 2569) */}
                <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                      สถานะห้องว่าง (กันยายน 2569)
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

                    {selectedRoomDays.map((d) => (
                      <div
                        key={d.day}
                        title={d.isOccupied ? `วันที่ ${d.day} ก.ย. 69: มีคนพัก (${d.booking?.guestName})` : `วันที่ ${d.day} ก.ย. 69: ว่างพร้อมจอง`}
                        className={`p-1 rounded-lg text-[10px] font-black transition-all flex flex-col items-center justify-center ${
                          d.isOccupied
                            ? 'bg-rose-500 text-white shadow-2xs font-black ring-1 ring-rose-300'
                            : 'bg-emerald-500 text-white shadow-2xs font-bold'
                        }`}
                      >
                        <span>{d.day}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Guest & Financial Details Section */}
                {selectedMapRoom.status === 'occupied' && selectedMapBooking ? (
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
                ) : (
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-900 flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <div>
                      <span className="font-bold block">บ้านพักว่างพร้อมเปิดรับจอง</span>
                      <span className="text-[11px] text-emerald-700 font-medium">กดปุ่มด้านล่างเพื่อเปิดการจองห้อง {selectedMapRoom.roomNumber}</span>
                    </div>
                  </div>
                )}

                {/* Actions for Selected Map Room */}
                <div className="space-y-2 pt-1">
                  {selectedMapRoom.status === 'available' && (
                    <button
                      onClick={() => {
                        if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(selectedMapRoom.id);
                        else onOpenNewBooking();
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98"
                    >
                      <Plus className="w-4 h-4 stroke-[3]" />
                      <span>กดจองห้อง {selectedMapRoom.roomNumber}</span>
                    </button>
                  )}

                  {selectedMapRoom.status === 'occupied' && selectedMapBooking && (
                    <div className="grid grid-cols-2 gap-2">
                      {onOpenAddPayment && (
                        <button
                          onClick={() => onOpenAddPayment(selectedMapBooking)}
                          className="py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all active:scale-98"
                        >
                          <CreditCard className="w-3.5 h-3.5" />
                          <span>การชำระเงิน</span>
                        </button>
                      )}

                      {onOpenAddOrder && (
                        <button
                          onClick={() => onOpenAddOrder(selectedMapBooking)}
                          className="py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all active:scale-98"
                        >
                          <UtensilsCrossed className="w-3.5 h-3.5" />
                          <span>สั่งหมูกระทะ</span>
                        </button>
                      )}

                      {onOpenReceipt && (
                        <button
                          onClick={() => onOpenReceipt(selectedMapBooking)}
                          className="py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1 border border-slate-200 transition-all"
                        >
                          <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                          <span>พิมพ์ใบเสร็จ</span>
                        </button>
                      )}

                      <button
                        onClick={() => {
                          if (onOpenCheckoutModal) onOpenCheckoutModal(selectedMapBooking);
                          else onCheckOutGuest(selectedMapBooking.id);
                        }}
                        className="py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1 border border-rose-200 transition-all"
                      >
                        <span>เช็คเอาท์</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {selectedMapRoom.status === 'cleaning' && (
                    <button
                      onClick={() => {
                        setConfirmDialog({
                          isOpen: true,
                          type: 'clean',
                          roomBadge: `ห้อง ${selectedMapRoom.roomNumber}`,
                          title: 'ยืนยันทำความสะอาดเสร็จสิ้น',
                          description: `คุณต้องการเปลี่ยนสถานะห้อง ${selectedMapRoom.roomNumber} เป็น "ห้องว่างพร้อมเปิดรับจอง" ทันทีใช่หรือไม่?`,
                          confirmText: 'ยืนยันเปิดห้องว่าง',
                          onConfirm: () => onUpdateRoomStatus(selectedMapRoom.id, 'available'),
                        });
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>ทำความสะอาดเสร็จแล้ว (เปิดว่าง)</span>
                    </button>
                  )}
                </div>

              </div>
            )}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CATEGORIZED GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="space-y-4 animate-view-transition">
          {/* SECTION 1: บ้านพักหลังกลาง (S1, S2 - ฿1,200) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-blue-700" />
                <span>บ้านพักหลังกลาง (1,200 บาท/คืน) - ห้อง S1, S2</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                บ้านเดี่ยว &bull; เตียงเดี่ยว
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {mediumRooms.map(renderRoomCard)}
            </div>
          </div>

          {/* SECTION 2: บ้านพักหลังใหญ่ (S3, S4 - ฿1,500) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-700" />
                <span>บ้านพักหลังใหญ่ (1,500 บาท/คืน) - ห้อง S3, S4</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                บ้านเดี่ยวขนาดใหญ่ &bull; ระเบียงกว้าง
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {largeRooms.map(renderRoomCard)}
            </div>
          </div>

          {/* SECTION 3: บ้านพักหลังเล็ก (S5, S6 - ฿1,000) */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-amber-700" />
                <span>บ้านพักหลังเล็ก (1,000 บาท/คืน) - ห้อง S5, S6</span>
              </h2>
              <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                อาคารบ้านแฝดด้านใน &bull; พักได้ 2 ท่าน
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {smallRooms.map(renderRoomCard)}
            </div>
          </div>
        </div>
      )}

      {/* Room Detail Modal (For Clicking on Grid View Cards) */}
      {selectedRoomModal && (
        <div 
          onClick={() => setSelectedRoomModal(null)}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in"
        >
          <div 
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 overscroll-contain"
          >
            <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <span className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
                  {selectedRoomModal.roomNumber}
                </span>
                <div>
                  <h3 className="font-bold text-sm">ห้อง {selectedRoomModal.roomNumber} - {selectedRoomModal.name}</h3>
                  <p className="text-[11px] text-slate-400">฿{selectedRoomModal.pricePerNight.toLocaleString()}/คืน &bull; {selectedRoomModal.capacity} ท่าน</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRoomModal(null)}
                className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Quick Status Changers */}
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1.5">เปลี่ยนสถานะห้องพักด่วน:</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoomModal.id, 'available');
                      setSelectedRoomModal(null);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedRoomModal.status === 'available' ? 'bg-emerald-100 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    🟢 ว่างพร้อมขาย
                  </button>
                  <button
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoomModal.id, 'cleaning');
                      setSelectedRoomModal(null);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedRoomModal.status === 'cleaning' ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    🟡 รอทำความสะอาด
                  </button>
                  <button
                    onClick={() => {
                      onUpdateRoomStatus(selectedRoomModal.id, 'maintenance');
                      setSelectedRoomModal(null);
                    }}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                      selectedRoomModal.status === 'maintenance' ? 'bg-rose-100 border-rose-300 text-rose-900 ring-2 ring-rose-500/20' : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    ⚪ ปิดปรับปรุง
                  </button>
                </div>
              </div>

              {/* Occupied Actions */}
              {selectedRoomModal.status === 'occupied' && (
                <div className="space-y-2">
                  {onOpenAddPayment && (
                    <button
                      onClick={() => {
                        const b = bookings.find(item => item.id === selectedRoomModal.currentGuest?.bookingId);
                        if (b) onOpenAddPayment(b);
                        setSelectedRoomModal(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <CreditCard className="w-4 h-4" />
                      <span>การชำระเงิน</span>
                    </button>
                  )}

                  {onOpenAddOrder && (
                    <button
                      onClick={() => {
                        const b = bookings.find(item => item.id === selectedRoomModal.currentGuest?.bookingId);
                        if (b) onOpenAddOrder(b);
                        setSelectedRoomModal(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>สั่งหมูกระทะ / บริการเสริม</span>
                    </button>
                  )}

                  {onOpenReceipt && (
                    <button
                      onClick={() => {
                        const b = bookings.find(item => item.id === selectedRoomModal.currentGuest?.bookingId);
                        if (b) onOpenReceipt(b);
                        setSelectedRoomModal(null);
                      }}
                      className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                      <span>พิมพ์ใบเสร็จ / บันทึกภาพสลิป</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const bId = selectedRoomModal.currentGuest?.bookingId;
                      setSelectedRoomModal(null);
                      if (bId) {
                        const b = bookings.find(item => item.id === bId);
                        if (b && onOpenCheckoutModal) onOpenCheckoutModal(b);
                        else onCheckOutGuest(bId);
                      }
                    }}
                    className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <span>เช็คเอาท์ห้องพัก</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Custom Sleek In-App Confirmation Popup */}
      {confirmDialog && (
        <ConfirmDialogModal
          isOpen={confirmDialog.isOpen}
          onClose={() => setConfirmDialog(null)}
          onConfirm={confirmDialog.onConfirm}
          title={confirmDialog.title}
          description={confirmDialog.description}
          roomBadge={confirmDialog.roomBadge}
          confirmText={confirmDialog.confirmText}
          cancelText={confirmDialog.cancelText}
          type={confirmDialog.type}
        />
      )}

      {/* Quick Room Availability Checker Modal */}
      <QuickAvailabilityModal
        isOpen={isQuickCheckerOpen}
        onClose={() => setIsQuickCheckerOpen(false)}
        rooms={rooms}
        bookings={bookings}
        onSelectRoomForBooking={(roomId, checkIn, checkOut) => {
          if (onOpenNewBookingWithDates) {
            onOpenNewBookingWithDates(roomId, checkIn, checkOut);
          } else if (onOpenNewBookingForRoom) {
            onOpenNewBookingForRoom(roomId);
          } else {
            onOpenNewBooking();
          }
        }}
      />

    </div>
  );
};
