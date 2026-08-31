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

  const totalMonthRevenue = bookings.reduce((sum, b) => sum + b.paidAmount, 0);

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* 3 Summary Cards - Japanese Minimalist Earth Tones */}
      <div className="grid grid-cols-3 gap-2.5 md:gap-3.5">
        {/* 1. Available */}
        <div className="bg-white border border-[#d8e8dd] p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#23583a] uppercase truncate">
            <CheckCircle2 className="w-3.5 h-3.5 text-[#2d5a43] shrink-0" />
            <span className="truncate">ว่างพร้อมขาย</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-[#1c3a28]">{availableRooms}</span>
            <span className="text-[11px] text-[#70675e] font-semibold">/{totalRooms} หลัง</span>
          </div>
        </div>

        {/* 2. Occupied */}
        <div className="bg-white border border-[#d2dfec] p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#2c4364] uppercase truncate">
            <Users className="w-3.5 h-3.5 text-[#2c4364] shrink-0" />
            <span className="truncate">มีคนพักอยู่</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1">
            <span className="text-xl md:text-2xl font-black text-[#1f2d3d]">{occupiedRooms}</span>
            <span className="text-[11px] text-[#70675e] font-semibold">หลัง</span>
          </div>
        </div>

        {/* 3. Monthly Revenue */}
        <div className="bg-white border border-[#eedec8] p-3 md:p-4 rounded-2xl flex flex-col justify-between shadow-xs">
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#8a5314] uppercase truncate">
            <Coins className="w-3.5 h-3.5 text-[#8a5314] shrink-0" />
            <span className="truncate">ยอดเดือนนี้</span>
          </div>
          <div className="flex items-baseline gap-1 mt-1 truncate">
            <span className="text-base md:text-xl font-black text-[#5c370d] truncate">฿{(totalMonthRevenue / 1000).toFixed(1)}k</span>
          </div>
        </div>
      </div>

      {/* Main Grid Header */}
      <div className="flex items-center justify-between px-1 pt-1">
        <h2 className="text-sm md:text-base font-extrabold text-[#2b2724] flex items-center gap-1.5">
          <Home className="w-4 h-4 text-[#2d5a43]" />
          <span>ผังบ้านพักทั้งหมด ({rooms.length} หลัง)</span>
        </h2>
        <span className="text-[11px] text-[#786e64] font-medium">แตะการ์ดเพื่อจัดการ</span>
      </div>

      {/* 2-Column Mobile / 3-Column Desktop Grid with Cream-Brown SVG House Badges */}
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
              className={`rounded-2xl p-3 md:p-4 flex flex-col justify-between cursor-pointer transition-all active:scale-[0.98] bg-white border shadow-xs ${
                isAvailable 
                  ? 'border-[#e0d7cb] hover:border-[#2d5a43]/50' 
                  : (isOccupied 
                      ? 'border-[#cbd8e6] bg-[#f7fafc]' 
                      : (isCleaning 
                          ? 'border-[#eedec8] bg-[#fdfaf5]' 
                          : 'border-[#ebd4cf] bg-[#fdf8f7]'))
              }`}
            >
              <div>
                {/* Header with SVG HouseLogo and Status Pill */}
                <div className="flex items-start justify-between gap-1 mb-1.5">
                  <HouseLogo roomNumber={room.roomNumber} size="sm" />

                  {/* Status Indicator Pill */}
                  {isAvailable && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#eaf3ed] text-[#23583a] border border-[#c2decb] shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2d5a43]"></span>
                      ว่าง
                    </span>
                  )}
                  {isOccupied && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#edf2f7] text-[#2c4364] border border-[#cbd8e6] shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#2c4364]"></span>
                      มีคนพัก
                    </span>
                  )}
                  {isCleaning && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#fef6e9] text-[#8a5314] border border-[#f4dbb3] shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8a5314]"></span>
                      รอแม่บ้าน
                    </span>
                  )}
                  {isMaintenance && (
                    <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-[#fdf0ed] text-[#9c2b1b] border border-[#f5c6be] shrink-0">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#9c2b1b]"></span>
                      ปิดซ่อม
                    </span>
                  )}
                </div>

                {/* Villa Name */}
                <p className="text-xs font-semibold text-[#3d3731] truncate mt-1">
                  {room.name}
                </p>

                {/* Price */}
                <p className="text-xs font-extrabold text-[#2d5a43] mt-0.5">
                  ฿{room.pricePerNight.toLocaleString()}<span className="text-[10px] text-[#8c8278] font-normal"> /คืน</span>
                </p>

                {/* Occupied Guest Info Preview */}
                {isOccupied && room.currentGuest && (
                  <div className="mt-2 p-1.5 rounded-xl bg-white border border-[#cbd8e6] text-[11px] text-[#2b2724] space-y-0.5">
                    <span className="font-bold text-[#1f3a5f] truncate block flex items-center gap-1">
                      <Users className="w-3 h-3 text-[#2c4364] shrink-0" />
                      {room.currentGuest.name}
                    </span>
                    <span className="text-[10px] text-[#70675e] block pl-4">ออก {room.currentGuest.checkOut}</span>
                  </div>
                )}

                {/* Cleaning notice */}
                {isCleaning && (
                  <div className="mt-2 p-1.5 rounded-xl bg-white border border-[#eedec8] text-[10px] text-[#8a5314] font-bold flex items-center gap-1">
                    <Clock className="w-3 h-3 text-[#8a5314] shrink-0" />
                    <span>กำลังทำความสะอาด</span>
                  </div>
                )}
              </div>

              {/* Action Button on bottom of card */}
              <div className="mt-3 pt-2 border-t border-[#f0e9df]">
                {isAvailable && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(room.id);
                      else onOpenNewBooking();
                    }}
                    className="w-full py-2 rounded-xl bg-[#2d5a43] hover:bg-[#224432] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
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
                    className="w-full py-2 rounded-xl bg-[#2e4057] hover:bg-[#1e2c3d] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
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
                    className="w-full py-2 rounded-xl bg-[#8a5314] hover:bg-[#6e410d] active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-xs transition-all"
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
                    className="w-full py-2 rounded-xl bg-[#453d36] hover:bg-[#2b2724] active:scale-98 text-white font-bold text-xs"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-[#1c1917]/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white text-[#2b2724] w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl p-5 border border-[#e8e2d8] shadow-2xl space-y-3.5">
            <div className="flex items-center justify-between pb-2.5 border-b border-[#f0e9df]">
              <div className="flex items-center gap-2.5">
                <HouseLogo roomNumber={selectedRoomModal.roomNumber} size="sm" />
                <div>
                  <span className="text-base font-black text-[#2b2724]">{selectedRoomModal.name}</span>
                  <p className="text-xs font-semibold text-[#2d5a43]">{selectedRoomModal.type}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedRoomModal(null)}
                className="w-8 h-8 rounded-full bg-[#f4eee6] flex items-center justify-center text-[#70675e] hover:text-[#2b2724]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-xs md:text-sm text-[#544b42]">
              <div className="flex justify-between">
                <span>ราคาต่อคืน:</span>
                <span className="font-bold text-[#2d5a43]">฿{selectedRoomModal.pricePerNight.toLocaleString()} บาท</span>
              </div>
              <div className="flex justify-between">
                <span>สถานะปัจจุบัน:</span>
                <span className="font-bold text-[#2b2724]">
                  {selectedRoomModal.status === 'available' ? 'ว่างพร้อมขาย' : (selectedRoomModal.status === 'occupied' ? 'มีผู้เข้าพัก' : 'รอทำความสะอาด')}
                </span>
              </div>

              {selectedRoomModal.currentGuest && (
                <div className="p-3 bg-[#f7fafc] rounded-xl border border-[#cbd8e6] text-xs space-y-1 mt-2">
                  <p className="font-bold text-[#1f3a5f] flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#2c4364]" />
                    ชื่อผู้พัก: {selectedRoomModal.currentGuest.name}
                  </p>
                  <p className="flex items-center gap-1.5 text-[#544b42]">
                    <Phone className="w-3.5 h-3.5 text-[#2d5a43]" />
                    เบอร์โทร: <a href={`tel:${selectedRoomModal.currentGuest.phone.replace(/[^0-9+]/g, '')}`} className="text-[#2d5a43] font-bold underline">{selectedRoomModal.currentGuest.phone} (กดโทร)</a>
                  </p>
                  <p className="text-[#70675e] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#8c8278]" />
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
                  className="w-full py-2.5 rounded-xl bg-[#2d5a43] hover:bg-[#224432] text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
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
                  className="w-full py-2.5 rounded-xl bg-[#2e4057] hover:bg-[#1e2c3d] text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
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
                  className="w-full py-2.5 rounded-xl bg-[#8a5314] hover:bg-[#6e410d] text-white font-bold text-sm flex items-center justify-center gap-1.5 shadow-xs active:scale-98"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>ทำความสะอาดเสร็จแล้ว (เปิดห้องว่าง)</span>
                </button>
              )}

              <button
                onClick={() => setSelectedRoomModal(null)}
                className="w-full py-2.5 rounded-xl bg-[#f4eee6] text-[#544b42] font-bold text-xs hover:bg-[#eae2d8]"
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
