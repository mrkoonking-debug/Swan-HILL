import React, { useState } from 'react';
import { 
  Users, 
  Plus, 
  ArrowRight, 
  Sparkles, 
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
  ChevronRight
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';
import { ConfirmDialogModal, type ConfirmType } from './ConfirmDialogModal';

interface DashboardViewProps {
  rooms: Room[];
  bookings: Booking[];
  onUpdateRoomStatus: (roomId: string, newStatus: RoomStatus) => void;
  onCheckInGuest?: (bookingId: string) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onOpenNewBookingForRoom?: (roomId: string) => void;
  onOpenNewBooking: () => void;
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
  onCheckOutGuest,
  onOpenNewBookingForRoom,
  onOpenNewBooking,
  onOpenAddOrder,
  onOpenReceipt,
  onOpenAddPayment,
  onOpenCheckoutModal,
}) => {
  const [selectedRoomModal, setSelectedRoomModal] = useState<Room | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');
  const [selectedMapRoomNumber, setSelectedMapRoomNumber] = useState<string>('S1');
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

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;
  const totalMonthRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);

  // Map room lookup by number
  const roomMap: Record<string, Room | undefined> = {};
  rooms.forEach(r => { roomMap[r.roomNumber] = r; });

  // Currently selected room in 3D Map Inspector
  const selectedMapRoom = roomMap[selectedMapRoomNumber] || rooms[0];
  const selectedMapBooking = selectedMapRoom?.currentGuest?.bookingId
    ? bookings.find(b => b.id === selectedMapRoom.currentGuest?.bookingId)
    : bookings.find(b => b.roomId === selectedMapRoom?.id && b.status !== 'cancelled');

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
    const isAvailable = room.status === 'available';
    const isOccupied = room.status === 'occupied';
    const isCleaning = room.status === 'cleaning';
    const isMaintenance = room.status === 'maintenance';

    const currentBooking = room.currentGuest?.bookingId 
      ? bookings.find(b => b.id === room.currentGuest?.bookingId)
      : undefined;

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
              <span className={`w-8 h-8 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${
                isAvailable ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' :
                isOccupied ? 'bg-blue-600 text-white shadow-blue-500/20' :
                isCleaning ? 'bg-amber-500 text-white' : 'bg-slate-300 text-slate-700'
              }`}>
                {room.roomNumber}
              </span>
              <div className="min-w-0">
                <span className="font-extrabold text-xs text-slate-900 truncate block">
                  {room.name}
                </span>
                <span className="text-[10px] text-slate-500 font-bold">
                  ฿{room.pricePerNight.toLocaleString()}/คืน
                </span>
              </div>
            </div>

            {/* Status Badge */}
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black shrink-0 ${
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
              <span className="font-bold text-slate-900 flex items-center gap-1 truncate">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{room.currentGuest.name}</span>
              </span>
              <span className="text-[10px] text-slate-500 block font-medium">
                ออก {formatThaiDate(room.currentGuest.checkOut)}
              </span>

              {/* Payment Alert Banner */}
              {remainingBalance > 0 ? (
                <div className="p-1.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-950 font-bold text-[10px] flex items-center justify-between">
                  <span className="flex items-center gap-1 truncate">
                    <AlertTriangle className="w-3 h-3 text-amber-700 shrink-0" />
                    ค้างชำระ:
                  </span>
                  <span className="font-black text-amber-950">฿{remainingBalance.toLocaleString()}</span>
                </div>
              ) : (
                <div className="p-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold text-[10px] flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>ชำระครบแล้ว (฿{grandTotal.toLocaleString()})</span>
                </div>
              )}

              {/* Add-on Summary Pill */}
              {currentBooking?.addOns && currentBooking.addOns.length > 0 && (
                <div className="pt-1 border-t border-slate-200 flex flex-wrap gap-1">
                  {currentBooking.addOns.map((a) => (
                    <span key={a.id} className="text-[9px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-slate-200 truncate">
                      {a.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Cleaning notice */}
          {isCleaning && (
            <div className="mt-2 p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-bold flex items-center gap-1 shadow-xs">
              <Clock className="w-3 h-3 text-amber-600 shrink-0" />
              <span>กำลังทำความสะอาด</span>
            </div>
          )}
        </div>

        {/* Card Bottom Actions */}
        <div className="mt-3 pt-2.5 border-t border-slate-100 space-y-1.5">
          {isAvailable && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(room.id);
                else onOpenNewBooking();
              }}
              className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm shadow-emerald-600/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
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
      
      {/* Top Banner: Overview KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 md:gap-4">
        <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 rounded-3xl p-4 md:p-5 text-white shadow-lg shadow-emerald-700/10">
          <div className="flex items-center justify-between">
            <span className="text-emerald-100 font-bold text-xs">บ้านพักว่างพร้อมขาย</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Home className="w-4 h-4 text-emerald-100" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-black">{availableRooms}</span>
            <span className="text-xs text-emerald-200 font-medium">/ {totalRooms} หลัง</span>
          </div>
          <div className="mt-2 text-[10px] text-emerald-200/90 font-medium">
            เปิดจองได้ทันที
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 rounded-3xl p-4 md:p-5 text-white shadow-lg shadow-blue-700/10">
          <div className="flex items-center justify-between">
            <span className="text-blue-100 font-bold text-xs">มีผู้เข้าพักอยู่</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Users className="w-4 h-4 text-blue-100" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-black">{occupiedRooms}</span>
            <span className="text-xs text-blue-200 font-medium">/ {totalRooms} หลัง</span>
          </div>
          <div className="mt-2 text-[10px] text-blue-200/90 font-medium">
            อัตราเข้าพัก {totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(0) : 0}%
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-700 rounded-3xl p-4 md:p-5 text-white shadow-lg shadow-amber-600/10">
          <div className="flex items-center justify-between">
            <span className="text-amber-100 font-bold text-xs">รอทำความสะอาด</span>
            <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center backdrop-blur-md">
              <Sparkles className="w-4 h-4 text-amber-100" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1.5">
            <span className="text-2xl md:text-3xl font-black">
              {rooms.filter(r => r.status === 'cleaning').length}
            </span>
            <span className="text-xs text-amber-200 font-medium">หลัง</span>
          </div>
          <div className="mt-2 text-[10px] text-amber-200/90 font-medium">
            เตรียมพร้อมสำหรับแขกใหม่
          </div>
        </div>

        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-4 md:p-5 text-white shadow-lg shadow-slate-900/10">
          <div className="flex items-center justify-between">
            <span className="text-slate-300 font-bold text-xs">รายได้รวมเดือนนี้</span>
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center backdrop-blur-md">
              <Coins className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-xl md:text-2xl font-black text-emerald-400">
              ฿{totalMonthRevenue.toLocaleString()}
            </span>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-medium">
            รวมค่าห้องและหมูกระทะ
          </div>
        </div>
      </div>

      {/* Main Header & View Mode Switcher */}
      <div className="flex items-center justify-between gap-3 pt-1 flex-wrap">
        <div>
          <h1 className="text-lg md:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trees className="w-6 h-6 text-emerald-600" />
            <span>ผังบ้านพัก Swan HILL Resort</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            ผัง 3D เสมือนจริง &bull; ตรวจสอบสถานะห้องว่างและรายละเอียดการชำระเงิน
          </p>
        </div>

        {/* View Switcher: 3D แผนผัง vs รายการแยกขนาด */}
        <div className="flex p-1 bg-slate-100 rounded-2xl border border-slate-200/80 shadow-inner">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              viewMode === 'map'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>3D แผนผังรีสอร์ท</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all ${
              viewMode === 'grid'
                ? 'bg-emerald-600 text-white shadow-sm shadow-emerald-600/30'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>รายการบ้านพัก</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: 3D REALISTIC RESORT MASTERPLAN & ROOMSCOPE INSPECTOR */}
      {viewMode === 'map' && (
        <div className="space-y-4">
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
                  const isAvailable = room.status === 'available';
                  const isOccupied = room.status === 'occupied';
                  const isCleaning = room.status === 'cleaning';

                  return (
                    <button
                      key={room.id}
                      onClick={() => setSelectedMapRoomNumber(room.roomNumber)}
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

            {/* RIGHT: RoomScope-style Inspector & 30-Day Availability Calendar (5 cols on desktop) */}
            {selectedMapRoom && (
              <div className="lg:col-span-5 bg-white rounded-3xl border border-slate-200 shadow-xl p-4 md:p-5 space-y-4">
                
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
      )}

      {/* VIEW 2: CATEGORIZED GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95">
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

    </div>
  );
};
