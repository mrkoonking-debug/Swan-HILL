import React from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CreditCard, 
  UtensilsCrossed, 
  Receipt, 
  ArrowRight,
  Plus,
  Users
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../../types/pms';

export interface RoomDetailModalProps {
  room: Room | null;
  onClose: () => void;
  bookings: Booking[];
  onUpdateRoomStatus: (roomId: string, status: RoomStatus) => void;
  onOpenCheckoutModal?: (booking: Booking) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onOpenAddOrder?: (booking: Booking) => void;
  onOpenAddPayment?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onOpenCloneBooking?: (booking: Booking) => void;
}

export const RoomDetailModal: React.FC<RoomDetailModalProps> = ({
  room,
  onClose,
  bookings,
  onUpdateRoomStatus,
  onOpenCheckoutModal,
  onCheckOutGuest,
  onOpenAddOrder,
  onOpenAddPayment,
  onOpenReceipt,
  onOpenCloneBooking,
}) => {
  if (!room) return null;
  const currentBooking = bookings.find(item => item.id === room.currentGuest?.bookingId);

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-md overflow-hidden animate-in zoom-in-95 overscroll-contain"
      >
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-9 h-9 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-black text-sm">
              {room.roomNumber}
            </span>
            <div>
              <h3 className="font-bold text-sm">ห้อง {room.roomNumber} - {room.name}</h3>
              <p className="text-[11px] text-slate-400">฿{room.pricePerNight.toLocaleString()}/คืน &bull; {room.capacity} ท่าน</p>
            </div>
          </div>
          <button 
            onClick={onClose}
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
                  onUpdateRoomStatus(room.id, 'available');
                  onClose();
                }}
                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                  room.status === 'available' ? 'bg-emerald-100 border-emerald-300 text-emerald-900 ring-2 ring-emerald-500/20' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                🟢 ว่างพร้อมขาย
              </button>
              <button
                onClick={() => {
                  onUpdateRoomStatus(room.id, 'cleaning');
                  onClose();
                }}
                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                  room.status === 'cleaning' ? 'bg-amber-100 border-amber-300 text-amber-900 ring-2 ring-amber-500/20' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                🟡 รอทำความสะอาด
              </button>
              <button
                onClick={() => {
                  onUpdateRoomStatus(room.id, 'maintenance');
                  onClose();
                }}
                className={`p-2 rounded-xl border text-xs font-bold transition-all ${
                  room.status === 'maintenance' ? 'bg-rose-100 border-rose-300 text-rose-900 ring-2 ring-rose-500/20' : 'bg-slate-50 border-slate-200 text-slate-700'
                }`}
              >
                ⚪ ปิดปรับปรุง
              </button>
            </div>
          </div>

          {/* Occupied Actions */}
          {room.status === 'occupied' && (
            <div className="space-y-2">
              {currentBooking?.groupId && (
                <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs">
                  <span className="font-bold text-indigo-900 flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-indigo-600" />
                    <span>จองกลุ่ม: บ้าน <strong>{currentBooking.groupRoomNumbers?.join(' + ') || 'หลายห้อง'}</strong></span>
                  </span>
                  {currentBooking.groupBookingCode && (
                    <span className="text-[10px] font-mono font-bold text-indigo-700 bg-white px-2 py-0.5 rounded-lg border border-indigo-200">
                      #{currentBooking.groupBookingCode}
                    </span>
                  )}
                </div>
              )}

              {onOpenCloneBooking && currentBooking && (
                <button
                  onClick={() => {
                    onOpenCloneBooking(currentBooking);
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-teal-600 hover:from-indigo-700 hover:to-teal-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <Plus className="w-4 h-4 stroke-[3]" />
                  <span>จองเพิ่มอีกห้องให้ลูกค้ารายนี้ ({room.currentGuest?.name})</span>
                </button>
              )}

              {onOpenAddPayment && (
                <button
                  onClick={() => {
                    const b = bookings.find(item => item.id === room.currentGuest?.bookingId);
                    if (b) onOpenAddPayment(b);
                    onClose();
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
                    const b = bookings.find(item => item.id === room.currentGuest?.bookingId);
                    if (b) onOpenAddOrder(b);
                    onClose();
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
                    const b = bookings.find(item => item.id === room.currentGuest?.bookingId);
                    if (b) onOpenReceipt(b);
                    onClose();
                  }}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 border border-slate-200"
                >
                  <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                  <span>พิมพ์ใบเสร็จ / บันทึกภาพสลิป</span>
                </button>
              )}

              <button
                onClick={() => {
                  const bId = room.currentGuest?.bookingId;
                  onClose();
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
    </div>,
    document.body
  );
};
