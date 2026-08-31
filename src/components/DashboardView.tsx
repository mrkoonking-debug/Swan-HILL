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
  Car,
  Receipt
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../types/pms';
import { HouseLogo } from './HouseLogo';
import { formatThaiDate } from '../utils/dateUtils';

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
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  rooms,
  bookings,
  onUpdateRoomStatus,
  onCheckOutGuest,
  onOpenNewBookingForRoom,
  onOpenNewBooking,
  onOpenAddOrder,
  onOpenReceipt,
}) => {
  const [selectedRoomModal, setSelectedRoomModal] = useState<Room | null>(null);
  const [viewMode, setViewMode] = useState<'map' | 'grid'>('map');

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;

  const totalMonthRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);

  // Group rooms by category
  const largeRooms = rooms.filter(r => r.sizeCategory === 'large' || r.roomNumber === 'S3' || r.roomNumber === 'S4');
  const mediumRooms = rooms.filter(r => r.sizeCategory === 'medium' || r.roomNumber === 'S1' || r.roomNumber === 'S2');
  const smallRooms = rooms.filter(r => r.sizeCategory === 'small' || r.roomNumber === 'S5' || r.roomNumber === 'S6');

  // Map room lookup by number
  const roomMap: Record<string, Room | undefined> = {};
  rooms.forEach(r => { roomMap[r.roomNumber] = r; });

  const renderRoomCard = (room: Room) => {
    const isAvailable = room.status === 'available';
    const isOccupied = room.status === 'occupied';
    const isCleaning = room.status === 'cleaning';
    const isMaintenance = room.status === 'maintenance';

    const currentBooking = room.currentGuest?.bookingId 
      ? bookings.find(b => b.id === room.currentGuest?.bookingId)
      : undefined;

    return (
      <div
        key={room.id}
        onClick={() => setSelectedRoomModal(room)}
        className={`rounded-2xl p-3.5 md:p-4 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] bg-white/95 backdrop-blur-md border shadow-[0_4px_16px_rgba(0,0,0,0.03)] hover:shadow-md ${
          isAvailable 
            ? 'border-emerald-200/80 hover:border-emerald-400' 
            : (isOccupied 
                ? 'border-blue-200/80 hover:border-blue-400 bg-blue-50/10' 
                : (isCleaning 
                    ? 'border-amber-200/80 hover:border-amber-400 bg-amber-50/10' 
                    : 'border-rose-200/80 hover:border-rose-400 bg-rose-50/10'))
        }`}
      >
        <div>
          {/* Header with SVG HouseLogo and Status Pill */}
          <div className="flex items-start justify-between gap-1 mb-2">
            <div className="flex items-center gap-2">
              <HouseLogo roomNumber={room.roomNumber} size="sm" />
              <div>
                <span className="text-base font-black text-slate-900 block leading-tight">{room.roomNumber}</span>
                <span className="text-[10px] text-slate-500 font-bold">{room.type}</span>
              </div>
            </div>

            {/* Status Pill */}
            {isAvailable && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600"></span>
                ว่าง
              </span>
            )}
            {isOccupied && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-blue-100 text-blue-800 border border-blue-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                มีคนพัก
              </span>
            )}
            {isCleaning && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600"></span>
                รอแม่บ้าน
              </span>
            )}
            {isMaintenance && (
              <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-rose-100 text-rose-800 border border-rose-300 shrink-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-600"></span>
                ปิดซ่อม
              </span>
            )}
          </div>

          {/* Price */}
          <p className="text-xs font-black text-emerald-700 mt-1">
            ฿{room.pricePerNight.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal"> /คืน</span>
          </p>

          {/* Occupied Guest Info Preview & Add-on badges */}
          {isOccupied && room.currentGuest && (
            <div className="mt-2 p-2 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-slate-800 space-y-1 shadow-xs">
              <span className="font-bold text-blue-900 truncate block flex items-center gap-1">
                <Users className="w-3 h-3 text-blue-600 shrink-0" />
                {room.currentGuest.name}
              </span>
              <span className="text-[10px] text-slate-600 block">ออก {formatThaiDate(room.currentGuest.checkOut)}</span>

              {/* Add-on Summary Pill */}
              {currentBooking?.addOns && currentBooking.addOns.length > 0 && (
                <div className="pt-1 border-t border-blue-200/60 flex flex-wrap gap-1">
                  {currentBooking.addOns.map((a) => (
                    <span key={a.id} className="text-[9px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded border border-blue-200 truncate">
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
            <div className="flex gap-1.5">
              {/* Order Add-on Button */}
              {currentBooking && onOpenAddOrder && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onOpenAddOrder(currentBooking);
                  }}
                  className="px-2 py-2 rounded-xl bg-amber-100 hover:bg-amber-200 text-amber-900 font-bold text-[11px] flex items-center justify-center gap-1 transition-all"
                  title="สั่งหมูกระทะ / บริการเสริม"
                >
                  <UtensilsCrossed className="w-3.5 h-3.5" />
                  <span>สั่งอาหาร</span>
                </button>
              )}

              {/* Check-out Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  const bId = room.currentGuest?.bookingId;
                  if (bId) onCheckOutGuest(bId);
                  else onUpdateRoomStatus(room.id, 'cleaning');
                }}
                className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
              >
                <ArrowRight className="w-3.5 h-3.5" />
                <span>เช็คเอาท์</span>
              </button>
            </div>
          )}

          {isCleaning && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateRoomStatus(room.id, 'available');
              }}
              className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>เปิดห้องว่าง</span>
            </button>
          )}

          {isMaintenance && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdateRoomStatus(room.id, 'available');
              }}
              className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-800 active:scale-98 text-white font-bold text-xs"
            >
              <span>เปิดห้องว่าง</span>
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* Top 3 Summary Metric Cards */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-3.5">
        {/* 1. Available */}
        <div className="bg-white/95 backdrop-blur-xl border border-emerald-200/80 p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_16px_rgba(16,185,129,0.06)]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-800 uppercase truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
            <span className="truncate">ว่างพร้อมขาย</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-emerald-950">{availableRooms}</span>
            <span className="text-[11px] text-slate-500 font-semibold">/{totalRooms} หลัง</span>
          </div>
        </div>

        {/* 2. Occupied */}
        <div className="bg-white/95 backdrop-blur-xl border border-blue-200/80 p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_16px_rgba(59,130,246,0.06)]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-blue-800 uppercase truncate">
            <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
            <span className="truncate">มีคนพักอยู่</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-blue-950">{occupiedRooms}</span>
            <span className="text-[11px] text-slate-500 font-semibold">หลัง</span>
          </div>
        </div>

        {/* 3. Monthly Revenue */}
        <div className="bg-white/95 backdrop-blur-xl border border-amber-200/80 p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-[0_4px_16px_rgba(245,158,11,0.06)]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase truncate">
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">ยอดเดือนนี้</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-base md:text-xl font-black text-amber-900 truncate">฿{(totalMonthRevenue / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>

      {/* View Mode Switcher: Resort Map (L-Shape) vs Grid View */}
      <div className="bg-white/95 backdrop-blur-md p-2 rounded-2xl border border-slate-200/80 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2 pl-2">
          <Map className="w-4 h-4 text-emerald-600" />
          <span className="text-xs font-black text-slate-800">
            {viewMode === 'map' ? 'ผังรีสอร์ทพื้นที่จริงรูปตัว L (Resort Map)' : 'มุมมองรายการการ์ดบ้านพัก (Grid View)'}
          </span>
        </div>

        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setViewMode('map')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'map' 
                ? 'bg-emerald-600 text-white shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Map className="w-3.5 h-3.5" />
            <span>ผังจริง (รูปตัว L)</span>
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              viewMode === 'grid' 
                ? 'bg-emerald-600 text-white shadow-xs font-black' 
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>แยกตามขนาด</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: L-SHAPED INTERACTIVE RESORT MAP (Based on User's Drawing & Photo) */}
      {viewMode === 'map' && (
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl border border-slate-200/90 p-4 md:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.04)] space-y-4">
          {/* Map Legend & Compass */}
          <div className="flex items-center justify-between text-xs text-slate-600 pb-2 border-b border-slate-100 flex-wrap gap-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 font-bold text-slate-800">
                <Trees className="w-4 h-4 text-emerald-600" /> Swan HILL Resort Map
              </span>
              <span className="text-[11px] text-slate-500 font-medium hidden sm:inline">
                แตะที่บ้านพักแต่ละหลังเพื่อดูรายละเอียด หรือเปิดจอง/เช็คเอาท์
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> ว่าง</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> มีคนพัก</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> รอแม่บ้าน</span>
            </div>
          </div>

          {/* L-Shape Layout Container */}
          <div className="relative bg-slate-50/70 border border-slate-200/80 rounded-2xl p-4 md:p-6 min-h-[520px] flex flex-col justify-between overflow-hidden">
            {/* Gravel Driveway in Center */}
            <div className="absolute inset-x-4 inset-y-4 border-2 border-dashed border-slate-300/60 rounded-xl pointer-events-none flex items-center justify-center">
              <div className="text-center text-slate-300 font-extrabold text-xs tracking-widest uppercase flex items-center gap-2">
                <Car className="w-4 h-4" />
                <span>ลานจอดรถ & ทางเดินส่วนกลางรีสอร์ท (Swan HILL Driveway)</span>
              </div>
            </div>

            {/* TOP ROW: Twin Duplex Villas S6 (Left) & S5 (Right) at top-left corner */}
            <div className="relative z-10 w-full sm:w-2/3 lg:w-1/2">
              <div className="bg-amber-50/90 border border-amber-200/90 rounded-2xl p-2.5 shadow-xs mb-3">
                <p className="text-[11px] font-black text-amber-900 flex items-center gap-1.5 mb-1.5">
                  <Home className="w-3.5 h-3.5 text-amber-700" />
                  <span>อาคารบ้านแฝดด้านในสุด (1,000 บาท/คืน) &bull; ห้อง S6 และ S5</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  {roomMap['S6'] && renderRoomCard(roomMap['S6'])}
                  {roomMap['S5'] && renderRoomCard(roomMap['S5'])}
                </div>
              </div>
            </div>

            {/* RIGHT VERTICAL ROW: S4 (Top) -> S3 -> S2 -> S1 (Front Entrance) */}
            <div className="relative z-10 w-full sm:w-2/3 lg:w-1/2 ml-auto space-y-2.5 pt-2">
              <div className="text-right pr-1">
                <span className="text-[10px] font-black text-emerald-800 bg-emerald-100 px-2.5 py-0.5 rounded-full uppercase">
                  แนวบ้านพักฝั่งขวา (S4 &rarr; S3 &rarr; S2 &rarr; S1)
                </span>
              </div>

              {/* S4 (Large ฿1,500) */}
              {roomMap['S4'] && renderRoomCard(roomMap['S4'])}

              {/* S3 (Large ฿1,500) */}
              {roomMap['S3'] && renderRoomCard(roomMap['S3'])}

              {/* S2 (Medium ฿1,200) */}
              {roomMap['S2'] && renderRoomCard(roomMap['S2'])}

              {/* S1 (Medium ฿1,200) - Front Entrance */}
              {roomMap['S1'] && renderRoomCard(roomMap['S1'])}

              {/* Front Entrance Arrow Banner */}
              <div className="p-2 bg-slate-900 text-white rounded-xl text-center font-black text-[11px] flex items-center justify-center gap-1.5 shadow-xs">
                <span>🚪 ทางเข้ารีสอร์ทด้านหน้า (ติดห้อง S1)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: CATEGORIZED GRID VIEW */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* SECTION 1: บ้านพักหลังใหญ่ (S3, S4 - ฿1,500) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-emerald-700" />
                <span>บ้านพักหลังใหญ่ (1,500 บาท/คืน) - ห้อง S3, S4</span>
              </h2>
              <span className="text-[11px] text-emerald-700 font-bold">฿1,500</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
              {largeRooms.map(renderRoomCard)}
            </div>
          </div>

          {/* SECTION 2: บ้านพักหลังกลาง (S1, S2 - ฿1,200) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-blue-700" />
                <span>บ้านพักหลังกลาง (1,200 บาท/คืน) - ห้อง S1, S2</span>
              </h2>
              <span className="text-[11px] text-blue-700 font-bold">฿1,200</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
              {mediumRooms.map(renderRoomCard)}
            </div>
          </div>

          {/* SECTION 3: บ้านพักแฝดหลังเล็ก (1,000 บาท/คืน - บ้านคู่ติดกัน S5 & S6) */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-xs md:text-sm font-extrabold text-slate-900 flex items-center gap-1.5">
                <Home className="w-4 h-4 text-amber-700" />
                <span>บ้านพักแฝดหลังเล็ก (1,000 บาท/คืน) - ห้อง S5 (ฝั่งขวา) & ห้อง S6 (ฝั่งซ้าย)</span>
              </h2>
              <span className="text-[11px] text-amber-700 font-bold">฿1,000</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 md:gap-3">
              {smallRooms.map(renderRoomCard)}
            </div>
          </div>
        </div>
      )}

      {/* Room Detail Modal */}
      {selectedRoomModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <HouseLogo roomNumber={selectedRoomModal.roomNumber} size="sm" />
                <div>
                  <span className="text-base font-black text-slate-900">ห้อง {selectedRoomModal.roomNumber} - {selectedRoomModal.name}</span>
                  <p className="text-xs font-semibold text-emerald-700">{selectedRoomModal.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRoomModal(null)}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500 hover:text-slate-900"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs md:text-sm text-slate-700">
              <div className="flex justify-between">
                <span>ราคาต่อคืน:</span>
                <span className="font-black text-emerald-700">฿{selectedRoomModal.pricePerNight.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between">
                <span>สถานะปัจจุบัน:</span>
                <span className="font-bold text-slate-900">
                  {selectedRoomModal.status === 'available' ? 'ว่างพร้อมขาย' : (selectedRoomModal.status === 'occupied' ? 'มีผู้เข้าพัก' : 'รอทำความสะอาด')}
                </span>
              </div>

              {selectedRoomModal.currentGuest && (
                <div className="p-3 bg-blue-50 rounded-xl border border-blue-200 text-xs space-y-1 mt-2">
                  <p className="font-bold text-blue-950 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    ชื่อผู้พัก: {selectedRoomModal.currentGuest.name}
                  </p>
                  <div className="flex items-center gap-1.5 flex-wrap text-slate-700">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>เบอร์โทร:</span>
                    </span>
                    {selectedRoomModal.currentGuest.phone.split(/[,/\n]+/).map(p => p.trim()).filter(Boolean).map((ph, pIdx) => (
                      <a 
                        key={pIdx}
                        href={`tel:${ph.replace(/[^0-9+]/g, '')}`} 
                        className="text-emerald-700 font-bold bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200"
                        title={`โทรหาเบอร์ ${ph}`}
                      >
                        {ph}
                      </a>
                    ))}
                  </div>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    เข้าพัก: {formatThaiDate(selectedRoomModal.currentGuest.checkIn)} ถึง {formatThaiDate(selectedRoomModal.currentGuest.checkOut)}
                  </p>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="pt-2 space-y-2">
              {selectedRoomModal.status === 'available' && (
                <button
                  onClick={() => {
                    const rId = selectedRoomModal.id;
                    setSelectedRoomModal(null);
                    if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(rId);
                    else onOpenNewBooking();
                  }}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>กดจองห้อง {selectedRoomModal.roomNumber}</span>
                </button>
              )}

              {selectedRoomModal.status === 'occupied' && (
                <div className="space-y-2">
                  {selectedRoomModal.currentGuest?.bookingId && onOpenAddOrder && (
                    <button
                      onClick={() => {
                        const b = bookings.find(item => item.id === selectedRoomModal.currentGuest?.bookingId);
                        if (b) onOpenAddOrder(b);
                        setSelectedRoomModal(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                    >
                      <UtensilsCrossed className="w-4 h-4" />
                      <span>สั่งหมูกระทะ / บริการเสริม</span>
                    </button>
                  )}

                  {selectedRoomModal.currentGuest?.bookingId && onOpenReceipt && (
                    <button
                      onClick={() => {
                        const b = bookings.find(item => item.id === selectedRoomModal.currentGuest?.bookingId);
                        if (b) onOpenReceipt(b);
                        setSelectedRoomModal(null);
                      }}
                      className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98 border border-slate-700"
                    >
                      <Receipt className="w-4 h-4 text-emerald-400" />
                      <span>พิมพ์ใบเสร็จ / บันทึกภาพสลิป</span>
                    </button>
                  )}

                  <button
                    onClick={() => {
                      const bId = selectedRoomModal.currentGuest?.bookingId;
                      if (bId) onCheckOutGuest(bId);
                      else onUpdateRoomStatus(selectedRoomModal.id, 'cleaning');
                      setSelectedRoomModal(null);
                    }}
                    className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                  >
                    <ArrowRight className="w-4 h-4" />
                    <span>กดเช็คเอาท์ (ลูกค้าออก)</span>
                  </button>
                </div>
              )}

              {selectedRoomModal.status === 'cleaning' && (
                <button
                  onClick={() => {
                    onUpdateRoomStatus(selectedRoomModal.id, 'available');
                    setSelectedRoomModal(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-sm active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ทำความสะอาดเสร็จแล้ว (เปิดห้องว่าง)</span>
                </button>
              )}

              <button
                onClick={() => setSelectedRoomModal(null)}
                className="w-full py-2 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
