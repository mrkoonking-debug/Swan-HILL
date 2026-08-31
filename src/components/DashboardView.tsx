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
  Home
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../types/pms';
import { HouseLogo } from './HouseLogo';

interface DashboardViewProps {
  rooms: Room[];
  bookings: Booking[];
  onUpdateRoomStatus: (roomId: string, newStatus: RoomStatus) => void;
  onCheckInGuest?: (bookingId: string) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onOpenNewBookingForRoom?: (roomId: string) => void;
  onOpenNewBooking: () => void;
  onSelectTab?: (tab: any) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  rooms,
  bookings,
  onUpdateRoomStatus,
  onCheckOutGuest,
  onOpenNewBookingForRoom,
  onOpenNewBooking,
}) => {
  const [selectedRoomModal, setSelectedRoomModal] = useState<Room | null>(null);

  const totalRooms = rooms.length;
  const availableRooms = rooms.filter(r => r.status === 'available').length;
  const occupiedRooms = rooms.filter(r => r.status === 'occupied').length;

  // Revenue this month
  const totalMonthRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* 3 Summary Cards (Zero Emojis - Pure SVG Vectors) */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-3.5">
        {/* 1. Available */}
        <div className="bg-white border border-emerald-200/80 p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-[0_2px_8px_rgba(16,185,129,0.06)]">
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
        <div className="bg-white border border-blue-200/80 p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-[0_2px_8px_rgba(59,130,246,0.06)]">
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
        <div className="bg-white border border-amber-200/80 p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-[0_2px_8px_rgba(245,158,11,0.06)]">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-800 uppercase truncate">
            <Coins className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span className="truncate">ยอดเดือนนี้</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-base md:text-xl font-black text-amber-900 truncate">฿{(totalMonthRevenue / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>

      {/* Main Grid Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h2 className="text-sm md:text-base font-extrabold text-slate-900 flex items-center gap-1.5">
          <Home className="w-4 h-4 text-emerald-600" />
          <span>ผังบ้านพักทั้งหมด ({rooms.length} หลัง)</span>
        </h2>
        <span className="text-[11px] text-slate-500 font-medium">แตะการ์ดเพื่อจัดการ</span>
      </div>

      {/* 2-Column Mobile / 3-Column Desktop Grid with Custom SVG Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-2.5 md:gap-3.5">
        {rooms.map((room) => {
          const isAvailable = room.status === 'available';
          const isOccupied = room.status === 'occupied';
          const isCleaning = room.status === 'cleaning';
          const isMaintenance = room.status === 'maintenance';

          return (
            <div
              key={room.id}
              onClick={() => setSelectedRoomModal(room)}
              className={`rounded-2xl p-3 md:p-4 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] bg-white border shadow-[0_2px_8px_rgba(0,0,0,0.03)] ${
                isAvailable 
                  ? 'border-emerald-300 hover:border-emerald-400' 
                  : (isOccupied 
                      ? 'border-blue-300 hover:border-blue-400' 
                      : (isCleaning 
                          ? 'border-amber-300 hover:border-amber-400' 
                          : 'border-rose-300 hover:border-rose-400'))
              }`}
            >
              <div>
                {/* Header with SVG HouseLogo and Status Pill */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <HouseLogo roomNumber={room.roomNumber} size="sm" />

                  {/* Status Indicator Pill */}
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

                {/* Villa Name */}
                <p className="text-xs font-semibold text-slate-700 truncate mt-1">
                  {room.name}
                </p>

                {/* Price */}
                <p className="text-xs font-extrabold text-emerald-700 mt-0.5">
                  ฿{room.pricePerNight.toLocaleString()}<span className="text-[10px] text-slate-400 font-normal"> /คืน</span>
                </p>

                {/* Occupied Guest Info Preview */}
                {isOccupied && room.currentGuest && (
                  <div className="mt-2 p-1.5 rounded-xl bg-blue-50/80 border border-blue-200 text-[11px] text-slate-800 space-y-0.5">
                    <span className="font-bold text-blue-900 truncate block flex items-center gap-1">
                      <Users className="w-3 h-3 text-blue-600 shrink-0" />
                      {room.currentGuest.name}
                    </span>
                    <span className="text-[10px] text-slate-600 block pl-4">ออก {room.currentGuest.checkOut}</span>
                  </div>
                )}

                {/* Cleaning notice */}
                {isCleaning && (
                  <div className="mt-2 p-1.5 rounded-xl bg-amber-50 border border-amber-200 text-[10px] text-amber-900 font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>กำลังทำความสะอาด</span>
                  </div>
                )}
              </div>

              {/* Action Button on bottom of card */}
              <div className="mt-3 pt-2 border-t border-slate-100">
                {isAvailable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(room.id);
                      else onOpenNewBooking();
                    }}
                    className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <Plus className="w-3.5 h-3.5 stroke-[3]" />
                    <span>กดจอง</span>
                  </button>
                )}

                {isOccupied && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      const bId = room.currentGuest?.bookingId;
                      if (bId) onCheckOutGuest(bId);
                      else onUpdateRoomStatus(room.id, 'cleaning');
                    }}
                    className="w-full py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
                  >
                    <ArrowRight className="w-3.5 h-3.5" />
                    <span>เช็คเอาท์</span>
                  </button>
                )}

                {isCleaning && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onUpdateRoomStatus(room.id, 'available');
                    }}
                    className="w-full py-2 rounded-xl bg-amber-600 hover:bg-amber-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm transition-all"
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
                    className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-800 active:scale-95 text-white font-bold text-xs"
                  >
                    <span>เปิดห้องว่าง</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Room Detail & Action Modal */}
      {selectedRoomModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-slate-900 w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-slate-200 shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <HouseLogo roomNumber={selectedRoomModal.roomNumber} size="sm" />
                <div>
                  <span className="text-base font-black text-slate-900">{selectedRoomModal.name}</span>
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
                <span className="font-bold text-emerald-700">฿{selectedRoomModal.pricePerNight.toLocaleString()} บาท</span>
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
                  <p className="flex items-center gap-1.5 text-slate-700">
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    เบอร์โทร: <a href={`tel:${selectedRoomModal.currentGuest.phone.replace(/[^0-9+]/g, '')}`} className="text-emerald-700 font-bold underline">{selectedRoomModal.currentGuest.phone} (กดโทร)</a>
                  </p>
                  <p className="text-slate-600 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    เข้าพัก: {selectedRoomModal.currentGuest.checkIn} ถึง {selectedRoomModal.currentGuest.checkOut}
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
                  <span>กดจองห้องนี้ทันที</span>
                </button>
              )}

              {selectedRoomModal.status === 'occupied' && (
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
                className="w-full py-2.5 rounded-xl bg-slate-100 text-slate-600 font-bold text-xs hover:bg-slate-200"
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
