import React from 'react';
import { 
  Users, 
  CreditCard, 
  UtensilsCrossed, 
  Receipt, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  Plus, 
  Sparkles 
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../../types/pms';
import { formatThaiDate } from '../../utils/dateUtils';

export interface RoomCardProps {
  room: Room;
  roomState: { status: RoomStatus; booking?: Booking };
  selectedDate: string;
  bookings: Booking[];
  onSelectRoomModal: (room: Room) => void;
  onOpenNewBookingForRoom?: (roomId: string) => void;
  onOpenNewBooking: () => void;
  onOpenAddPayment?: (booking: Booking) => void;
  onOpenAddOrder?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onOpenCheckoutModal?: (booking: Booking) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onTriggerConfirmClean: (room: Room) => void;
  onTriggerConfirmMaintenance: (room: Room) => void;
}

export const RoomCard: React.FC<RoomCardProps> = ({
  room,
  roomState,
  selectedDate,
  bookings,
  onSelectRoomModal,
  onOpenNewBookingForRoom,
  onOpenNewBooking,
  onOpenAddPayment,
  onOpenAddOrder,
  onOpenReceipt,
  onOpenCheckoutModal,
  onCheckOutGuest,
  onTriggerConfirmClean,
  onTriggerConfirmMaintenance,
}) => {
  const isAvailable = roomState.status === 'available';
  const isOccupied = roomState.status === 'occupied';
  const isCleaning = roomState.status === 'cleaning';
  const isMaintenance = roomState.status === 'maintenance';

  const currentBooking = roomState.booking;

  const roomBaseTotal = currentBooking ? (currentBooking.stayType === 'day_use' ? currentBooking.roomPrice : currentBooking.roomPrice * (currentBooking.totalNights || 1)) : 0;
  const addOnsTotal = currentBooking?.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
  const grandTotal = currentBooking?.totalAmount || (roomBaseTotal + addOnsTotal);
  const remainingBalance = currentBooking ? Math.max(0, grandTotal - currentBooking.paidAmount) : 0;

  // Check if this room has a completed checkout today (Same-Day Turnover / Re-sell)
  const checkedOutToday = bookings.find(b => 
    (b.roomId === room.id || b.roomNumber === room.roomNumber) &&
    b.status === 'checked_out' &&
    (b.checkOutDate === selectedDate || b.checkInDate === selectedDate) &&
    !b.deletedAt
  );

  return (
    <div 
      onClick={() => onSelectRoomModal(room)}
      className={`group relative rounded-2xl p-3.5 transition-all duration-300 border cursor-pointer flex flex-col justify-between min-h-[220px] ${
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
            <div className="flex items-center justify-between gap-1">
              <span className="font-medium text-slate-800 flex items-center gap-1 truncate">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span className="truncate">{room.currentGuest.name}</span>
              </span>
              {currentBooking?.stayType === 'day_use' ? (
                <span className="text-[9px] bg-amber-100 text-amber-900 font-bold px-1.5 py-0.5 rounded shrink-0">
                  ⏱️ ชั่วคราว {currentBooking.dayUseHours || 3} ชม.
                </span>
              ) : checkedOutToday ? (
                <span className="text-[9px] bg-blue-100 text-blue-900 font-bold px-1.5 py-0.5 rounded shrink-0">
                  ✨ รอบ 2 วันนี้
                </span>
              ) : null}
            </div>
            <span className="text-[10px] text-slate-500 block font-normal">
              {currentBooking?.stayType === 'day_use' 
                ? `ออกวันนี้ เวลา ${currentBooking.checkOutTime || '17:00'} น.` 
                : `ออก ${formatThaiDate(room.currentGuest.checkOut)}`}
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

        {/* Available Room Info Block (Equalized Height) */}
        {isAvailable && (
          <div className="p-2 rounded-xl bg-emerald-50/60 border border-emerald-200/70 text-[11px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-emerald-950 font-semibold">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>รองรับ {room.capacity} ท่าน</span>
              </span>
              <span className="text-[10px] text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                พร้อมเข้าพัก
              </span>
            </div>

            {checkedOutToday && (
              <div className="px-1.5 py-1 rounded-md bg-emerald-100/90 text-[10px] text-emerald-950 font-bold flex items-center justify-between border border-emerald-200">
                <span className="flex items-center gap-1 truncate">
                  <Sparkles className="w-3 h-3 text-emerald-700 shrink-0" />
                  <span>เคลียร์ห้องเสร็จแล้ว ขายรอบ 2 ได้</span>
                </span>
                <span className="text-[9px] bg-emerald-200 text-emerald-950 px-1 py-0.2 rounded font-black shrink-0">Walk-in</span>
              </div>
            )}

            <span className="text-[10px] text-slate-500 block font-normal truncate">
              {room.type} &bull; เช็คอิน 14:00 น. หรือ Walk-in ทันที
            </span>
            <div className="p-1 rounded-lg bg-white/80 border border-emerald-100 text-[10px] flex items-center justify-between">
              <span className="font-bold text-emerald-900">฿{room.pricePerNight.toLocaleString()} บาท/คืน</span>
              <span className="text-emerald-700 font-medium">รวมอาหารเช้า</span>
            </div>
          </div>
        )}

        {/* Cleaning notice */}
        {isCleaning && (
          <div className="p-2 rounded-xl bg-amber-50/80 border border-amber-200/90 text-[11px] space-y-1 shadow-2xs">
            <div className="flex items-center justify-between text-amber-950 font-semibold">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>กำลังทำความสะอาด</span>
              </span>
              <span className="text-[10px] text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                รอแม่บ้าน
              </span>
            </div>
            <span className="text-[10px] text-slate-500 block font-normal truncate">
              ตรวจเช็คอุปกรณ์ และเปลี่ยนผ้าปูที่นอน
            </span>
            <div className="p-1 rounded-lg bg-white/80 border border-amber-100 text-[10px] flex items-center justify-between">
              <span className="font-bold text-amber-900">ห้อง {room.roomNumber}</span>
              <span className="text-amber-700 font-medium">แตะเพื่อเปิดว่าง</span>
            </div>
          </div>
        )}
      </div>

      {/* Card Bottom Actions */}
      <div className="mt-2.5 pt-2 border-t border-slate-100 min-h-[38px] flex items-center">
        {isAvailable && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (onOpenNewBookingForRoom) onOpenNewBookingForRoom(room.id);
              else onOpenNewBooking();
            }}
            className="w-full py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{checkedOutToday ? `กดจองรอบใหม่ห้อง ${room.roomNumber}` : `กดจองห้อง ${room.roomNumber}`}</span>
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
              onTriggerConfirmClean(room);
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
              onTriggerConfirmMaintenance(room);
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
