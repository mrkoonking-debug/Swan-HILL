import React, { useState } from 'react';
import { 
  X, 
  Search, 
  Calendar, 
  Users, 
  Check, 
  Copy, 
  Plus, 
  AlertCircle, 
  CheckCircle2
} from 'lucide-react';
import type { Room, Booking } from '../types/pms';
import { HouseLogo } from './HouseLogo';
import { formatLocalDate, shiftDateStr, formatThaiDate } from '../utils/dateUtils';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

interface QuickAvailabilityModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings: Booking[];
  onSelectRoomForBooking: (roomId: string, checkIn: string, checkOut: string) => void;
}

export const QuickAvailabilityModal: React.FC<QuickAvailabilityModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings,
  onSelectRoomForBooking,
}) => {
  useLockBodyScroll(isOpen);

  const todayStr = formatLocalDate(new Date());
  const tomorrowStr = shiftDateStr(todayStr, 1);

  const [checkInDate, setCheckInDate] = useState<string>(todayStr);
  const [checkOutDate, setCheckOutDate] = useState<string>(tomorrowStr);
  const [capacityFilter, setCapacityFilter] = useState<'all' | '2' | '4'>('all');
  const [copiedSuccess, setCopiedSuccess] = useState(false);

  if (!isOpen) return null;

  // Calculate nights safely
  const diffNights = Math.max(
    1,
    Math.round(
      (new Date(checkOutDate + 'T12:00:00').getTime() - new Date(checkInDate + 'T12:00:00').getTime()) /
        (1000 * 60 * 60 * 24)
    )
  );

  // Active bookings filter (exclude cancelled and checked_out bookings)
  const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out');

  // Check each room's availability for the selected date range [checkInDate, checkOutDate)
  const roomStatusList = rooms.map(room => {
    if (room.status === 'maintenance') {
      return {
        room,
        isAvailable: false,
        reason: 'ปิดปรับปรุง / ซ่อมบำรุง',
        conflictBooking: null
      };
    }

    const conflict = activeBookings.find(b => 
      (b.roomId === room.id || b.roomNumber === room.roomNumber) &&
      b.checkInDate < checkOutDate && b.checkOutDate > checkInDate
    );

    // Check if this room has a completed checkout today (Same-day Turnover / Re-sell)
    const checkedOutToday = bookings.find(b =>
      !b.deletedAt &&
      (b.roomId === room.id || b.roomNumber === room.roomNumber) &&
      b.status === 'checked_out' &&
      (b.checkOutDate === checkInDate || b.checkInDate === checkInDate)
    );

    let reason = 'ว่างพร้อมจอง';
    if (conflict) {
      reason = `ติดจอง: ${conflict.guestName} (${formatThaiDate(conflict.checkInDate)} - ${formatThaiDate(conflict.checkOutDate)})`;
    } else if (checkedOutToday && room.status === 'available') {
      reason = '✨ ว่างพร้อมขายรอบใหม่ (เคลียร์ห้องเสร็จแล้ว)';
    } else if (room.status === 'cleaning') {
      reason = '🟡 รอแม่บ้านทำความสะอาด (เปิดรับจองได้)';
    }

    return {
      room,
      isAvailable: !conflict,
      reason,
      conflictBooking: conflict || null
    };
  });

  // Filter by capacity if selected
  const filteredList = roomStatusList.filter(item => {
    if (capacityFilter === 'all') return true;
    if (capacityFilter === '2') return item.room.capacity <= 3;
    if (capacityFilter === '4') return item.room.capacity >= 4;
    return true;
  });

  const availableRooms = filteredList.filter(item => item.isAvailable);
  const occupiedRooms = filteredList.filter(item => !item.isAvailable);

  // Quick preset dates
  const handleSetQuickDates = (daysOffset: number, nights: number = 1) => {
    const newIn = shiftDateStr(todayStr, daysOffset);
    const newOut = shiftDateStr(newIn, nights);
    setCheckInDate(newIn);
    setCheckOutDate(newOut);
  };

  // Generate polite LINE reply message
  const handleCopyLineReply = () => {
    if (availableRooms.length === 0) {
      const text = `สวอนฮิลล์ รีสอร์ท (Swan HILL) ขออภัยครับ 🙏\n📅 วันที่: ${formatThaiDate(checkInDate)} - ${formatThaiDate(checkOutDate)} (${diffNights} คืน)\nขณะนี้บ้านพักเต็มทุกหลังแล้วครับ หากสนใจวันอื่นสามารถสอบถามเพิ่มเติมได้เลยนะครับ 🌿`;
      navigator.clipboard.writeText(text);
      setCopiedSuccess(true);
      setTimeout(() => setCopiedSuccess(false), 2500);
      return;
    }

    const houseLines = availableRooms.map((item, idx) => {
      const r = item.room;
      const total = r.pricePerNight * diffNights;
      return `${idx + 1}. บ้าน ${r.roomNumber} (${r.type})\n   - รองรับ: ${r.capacity} ท่าน\n   - ราคา: ฿${r.pricePerNight.toLocaleString()} /คืน ${diffNights > 1 ? `(รวม ${diffNights} คืน = ฿${total.toLocaleString()})` : ''}`;
    }).join('\n');

    const text = `🌿 สวอนฮิลล์ รีสอร์ท (Swan HILL)\nขอแจ้งบ้านพักที่ว่างพร้อมให้บริการครับ ✨\n\n📅 วันที่เข้าพัก: ${formatThaiDate(checkInDate)} ถึง ${formatThaiDate(checkOutDate)} (${diffNights} คืน)\n\n🏡 บ้านที่ว่างมีดังนี้ครับ:\n${houseLines}\n\n🍲 มีบริการสั่งหมูกระทะส่งตรงถึงหน้าบ้านพัก\nสนใจจองหรือสอบถามข้อมูลเพิ่มเติมแจ้งได้เลยนะครับ 😊`;

    navigator.clipboard.writeText(text);
    setCopiedSuccess(true);
    setTimeout(() => setCopiedSuccess(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-in fade-in">
      <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Search className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
                <span>เช็คห้องว่างด่วน (ไม่ต้องเลือกห้องก่อน)</span>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-white/20 text-emerald-100 border border-white/20 hidden sm:inline">
                  ดูทั้ง 6 หลังทันที
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 font-normal mt-0.5">
                เลือกรอบวันที่ลูกค้าต้องการเข้าพัก ระบบจะแสดงบ้านที่ว่างพร้อมราคาให้ทันที
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            title="ปิดหน้าต่าง"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Bar (Date Selectors & Quick Chips) */}
        <div className="p-4 sm:p-5 bg-slate-50 border-b border-slate-200/80 space-y-3 shrink-0">
          {/* Quick Date Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
            <span className="text-xs font-semibold text-slate-500 shrink-0 mr-1">ทางลัด:</span>
            <button
              type="button"
              onClick={() => handleSetQuickDates(0, 1)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-all shrink-0 cursor-pointer"
            >
              📌 วันนี้ (1 คืน)
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDates(1, 1)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-all shrink-0 cursor-pointer"
            >
              พรุ่งนี้ (1 คืน)
            </button>
            <button
              type="button"
              onClick={() => handleSetQuickDates(0, 2)}
              className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white text-slate-700 hover:bg-emerald-50 hover:text-emerald-800 border border-slate-200 transition-all shrink-0 cursor-pointer"
            >
              พัก 2 คืน (เริ่มวันนี้)
            </button>
          </div>

          {/* Date Picker Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-end">
            {/* Check-in */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                <span>วันที่เช็คอิน</span>
              </label>
              <input
                type="date"
                value={checkInDate}
                onChange={(e) => {
                  const val = e.target.value;
                  if (!val) return;
                  setCheckInDate(val);
                  if (val >= checkOutDate) {
                    setCheckOutDate(shiftDateStr(val, 1));
                  }
                }}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-emerald-500 outline-none shadow-2xs cursor-pointer"
              />
            </div>

            {/* Check-out */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-blue-600" />
                <span>วันที่เช็คเอาท์ ({diffNights} คืน)</span>
              </label>
              <input
                type="date"
                value={checkOutDate}
                min={shiftDateStr(checkInDate, 1)}
                onChange={(e) => e.target.value && setCheckOutDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-900 focus:border-emerald-500 outline-none shadow-2xs cursor-pointer"
              />
            </div>

            {/* Capacity Filter (Apple Liquid Glass Sliding Capsule) */}
            <div className="sm:col-span-4 space-y-1">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-purple-600" />
                <span>จำนวนผู้เข้าพัก</span>
              </label>
              <LiquidSegmentedControl<'all' | '2' | '4'>
                options={[
                  { value: 'all', label: 'ทั้งหมด' },
                  { value: '2', label: '2 ท่าน' },
                  { value: '4', label: '4+ ท่าน' },
                ]}
                value={capacityFilter}
                onChange={(val) => setCapacityFilter(val)}
                variant="light"
                size="sm"
                fullWidth
              />
            </div>
          </div>
        </div>

        {/* Summary Counter & One-Click Copy for LINE Action */}
        <div className="px-4 sm:px-5 py-3 bg-slate-100 border-b border-slate-200/80 flex items-center justify-between gap-3 flex-wrap shrink-0">
          <div className="flex items-center gap-3 text-xs">
            <span className="flex items-center gap-1.5 font-bold text-emerald-800 bg-emerald-100 border border-emerald-200 px-2.5 py-1 rounded-lg">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>ว่าง {availableRooms.length} หลัง</span>
            </span>
            <span className="flex items-center gap-1.5 font-bold text-slate-700 bg-slate-200/80 px-2.5 py-1 rounded-lg">
              <span>ไม่ว่าง {occupiedRooms.length} หลัง</span>
            </span>
          </div>

          {/* COPY LINE MESSAGE BUTTON */}
          <button
            type="button"
            onClick={handleCopyLineReply}
            className="flex items-center gap-1.5 px-3.5 py-1.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-semibold text-xs rounded-xl shadow-xs transition-all cursor-pointer"
            title="คัดลอกข้อความสรุปบ้านที่ว่างและราคา เพื่อส่งตอบลูกค้าใน LINE ได้ทันที"
          >
            {copiedSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-2 text-white" />
                <span>คัดลอกแล้ว นำไปวางใน LINE ได้เลย!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>📋 คัดลอกข้อความตอบลูกค้า (LINE)</span>
              </>
            )}
          </button>
        </div>

        {/* Rooms Availability List (Scrollable Area) */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          
          {/* AVAILABLE ROOMS GROUP */}
          <div className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <h3 className="text-xs sm:text-sm font-bold text-slate-900">
                บ้านพักที่ว่างพร้อมจอง ({availableRooms.length} หลัง)
              </h3>
              <span className="text-[11px] text-slate-500 font-normal">
                {formatThaiDate(checkInDate)} &bull; {diffNights} คืน
              </span>
            </div>

            {availableRooms.length === 0 ? (
              <div className="p-5 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-xs text-slate-500 space-y-1">
                <AlertCircle className="w-6 h-6 text-amber-500 mx-auto mb-1" />
                <p className="font-semibold text-slate-800">ไม่มีบ้านพักว่างในช่วงวันที่เลือกนี้</p>
                <p className="text-slate-400 font-normal">ลองเลื่อนวันเข้าพักไปวันอื่น หรือกดปุ่มด้านบนเพื่อดูวันอื่น</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {availableRooms.map(({ room }) => {
                  const totalPrice = room.pricePerNight * diffNights;

                  return (
                    <div
                      key={room.id}
                      className="bg-white rounded-2xl border-2 border-emerald-300 hover:border-emerald-500 p-3.5 sm:p-4 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-3 group"
                    >
                      {/* Top info */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <HouseLogo roomNumber={room.roomNumber} size="md" />
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className="text-base font-bold text-slate-900">
                                บ้าน {room.roomNumber}
                              </span>
                              <span className="px-2 py-0.2 rounded-md bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                ว่างพร้อมจอง
                              </span>
                            </div>
                            <span className="text-xs text-slate-600 font-normal block">
                              {room.type}
                            </span>
                            <span className="text-[11px] text-slate-500 font-normal flex items-center gap-1 mt-0.5">
                              <Users className="w-3 h-3 text-slate-400" />
                              <span>พักได้สูงสุด {room.capacity} ท่าน</span>
                            </span>
                          </div>
                        </div>

                        {/* Pricing */}
                        <div className="text-right shrink-0">
                          <span className="text-xs text-slate-400 font-normal block">ราคาต่อคืน</span>
                          <span className="text-sm sm:text-base font-bold text-slate-900 block leading-tight">
                            ฿{room.pricePerNight.toLocaleString()}
                          </span>
                          {diffNights > 1 && (
                            <span className="text-[10px] text-emerald-700 font-semibold block mt-0.5">
                              รวม {diffNights} คืน: ฿{totalPrice.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Action Button: Book this Room */}
                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                        <span className="text-[11px] text-slate-400 font-normal">
                          {room.amenities?.slice(0, 2).join(' • ') || 'แอร์, เครื่องทำน้ำอุ่น'}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            onSelectRoomForBooking(room.id, checkInDate, checkOutDate);
                            onClose();
                          }}
                          className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>กดจองบ้าน {room.roomNumber}</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* OCCUPIED / UNAVAILABLE ROOMS GROUP */}
          {occupiedRooms.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="text-xs font-semibold text-slate-600">
                  บ้านพักที่ไม่ว่าง ({occupiedRooms.length} หลัง)
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {occupiedRooms.map(({ room, reason }) => (
                  <div
                    key={room.id}
                    className="p-2.5 sm:p-3 rounded-xl bg-slate-100/80 border border-slate-200/90 text-xs text-slate-600 flex items-center justify-between gap-2"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <HouseLogo roomNumber={room.roomNumber} size="sm" />
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-slate-800 text-xs">บ้าน {room.roomNumber}</span>
                          <span className="text-[11px] text-slate-500">({room.type})</span>
                        </div>
                        <span className="text-[10px] text-red-600 font-medium block truncate mt-0.5">
                          {reason}
                        </span>
                      </div>
                    </div>

                    <span className="px-2 py-0.5 rounded-md bg-red-100 text-red-700 text-[10px] font-semibold shrink-0 border border-red-200">
                      ไม่ว่าง
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span className="text-[11px] font-normal">
            💡 กดปุ่ม "คัดลอกข้อความตอบลูกค้า" เพื่อนำข้อความไปส่งใน LINE ให้ลูกค้าได้ทันที
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl border border-slate-300 transition-all cursor-pointer"
          >
            ปิด
          </button>
        </div>

      </div>
    </div>
  );
};
