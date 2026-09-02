import React, { useState } from 'react';
import { 
  Trees, 
  Map, 
  LayoutGrid, 
  Home 
} from 'lucide-react';
import type { Room, Booking, RoomStatus } from '../types/pms';
import { shiftDateStr, formatThaiDate } from '../utils/dateUtils';
import { ConfirmDialogModal, type ConfirmType } from './ConfirmDialogModal';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { QuickAvailabilityModal } from './QuickAvailabilityModal';
import { LiquidSegmentedControl } from './LiquidSegmentedControl';

// Modular Subcomponents
import { RoomCard } from './dashboard/RoomCard';
import { RoomDetailModal } from './dashboard/RoomDetailModal';
import { DashboardDateHeader } from './dashboard/DashboardDateHeader';
import { DashboardKpiCards } from './dashboard/DashboardKpiCards';
import { ResortMapSection } from './dashboard/ResortMapSection';

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
      // If room is available/cleaning/maintenance, do not link to old checked-out guests
      const currentBooking = room.currentGuest?.bookingId 
        ? bookings.find(b => b.id === room.currentGuest?.bookingId && !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out')
        : (room.status === 'occupied' 
            ? bookings.find(b => (b.roomId === room.id || b.roomNumber === room.roomNumber) && b.checkInDate <= todayStr && b.checkOutDate >= todayStr && (b.status === 'checked_in' || b.status === 'confirmed') && !b.deletedAt)
            : undefined);
      return {
        status: room.status,
        booking: currentBooking,
      };
    }

    // For other dates, look for an active booking (exclude checked_out and cancelled)
    const booking = bookings.find(b => 
      (b.roomId === room.id || b.roomNumber === room.roomNumber) && 
      b.checkInDate <= selectedDate && 
      b.checkOutDate > selectedDate && 
      b.status !== 'cancelled' && 
      b.status !== 'checked_out' &&
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

  // Strictly order rooms sequentially: S1, S2 -> S3, S4 -> S5, S6
  const mediumRooms = [roomMap['S1'], roomMap['S2']].filter((r): r is Room => Boolean(r));
  const largeRooms = [roomMap['S3'], roomMap['S4']].filter((r): r is Room => Boolean(r));
  const smallRooms = [roomMap['S5'], roomMap['S6']].filter((r): r is Room => Boolean(r));

  const handleTriggerConfirmClean = (room: Room) => {
    setConfirmDialog({
      isOpen: true,
      type: 'clean',
      roomBadge: `ห้อง ${room.roomNumber}`,
      title: 'ยืนยันทำความสะอาดเสร็จสิ้น',
      description: `คุณต้องการเปลี่ยนสถานะห้อง ${room.roomNumber} เป็น "ห้องว่างพร้อมเปิดรับจอง" ทันทีใช่หรือไม่?`,
      confirmText: 'ยืนยันเปิดห้องว่าง',
      onConfirm: () => onUpdateRoomStatus(room.id, 'available'),
    });
  };

  const handleTriggerConfirmMaintenance = (room: Room) => {
    setConfirmDialog({
      isOpen: true,
      type: 'clean',
      roomBadge: `ห้อง ${room.roomNumber}`,
      title: 'ยืนยันเปิดใช้งานห้องพัก',
      description: `คุณต้องการเปิดใช้งานห้อง ${room.roomNumber} ให้เป็นห้องว่างพร้อมขายใช่หรือไม่?`,
      confirmText: 'ยืนยันเปิดห้องพัก',
      onConfirm: () => onUpdateRoomStatus(room.id, 'available'),
    });
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-12 animate-in fade-in duration-500 font-['Prompt']">
      
      {/* 1. DATE SELECTOR & STATUS BAR */}
      <DashboardDateHeader
        selectedDate={selectedDate}
        isViewingToday={isViewingToday}
        onShiftDate={handleShiftDate}
        onResetToToday={handleResetToToday}
        onSelectDate={(newDate) => setSelectedDate(newDate)}
        rooms={rooms}
        getRoomStatusOnDate={getRoomStatusOnDate}
        onOpenNewBookingForRoom={onOpenNewBookingForRoom}
        onOpenNewBooking={onOpenNewBooking}
        copiedLineAllSuccess={copiedLineAllSuccess}
        onCopyAvailableRoomsOnDate={handleCopyAvailableRoomsOnDate}
        onOpenQuickChecker={() => {
          if (onOpenQuickChecker) onOpenQuickChecker();
          else setIsQuickCheckerOpen(true);
        }}
      />

      {/* 2. OVERVIEW KPI CARDS */}
      <DashboardKpiCards
        availableRooms={availableRooms}
        occupiedRooms={occupiedRooms}
        totalRooms={totalRooms}
        isViewingToday={isViewingToday}
        selectedDate={selectedDate}
        arrivalsCount={arrivalsOnDate.length}
        departuresCount={departuresOnDate.length}
        totalMonthRevenue={totalMonthRevenue}
      />

      {/* 3. VIEW MODE TOGGLE BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
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

      {/* 4. VIEW 1: 3D RESORT MASTERPLAN & INSPECTOR */}
      {viewMode === 'map' && (
        <ResortMapSection
          rooms={rooms}
          bookings={bookings}
          selectedDate={selectedDate}
          isViewingToday={isViewingToday}
          selectedMapRoomNumber={selectedMapRoomNumber}
          onSelectMapRoomNumber={setSelectedMapRoomNumber}
          rightPanelTab={rightPanelTab}
          onRightPanelTabChange={setRightPanelTab}
          copiedLineAllSuccess={copiedLineAllSuccess}
          onCopyAvailableRoomsOnDate={handleCopyAvailableRoomsOnDate}
          getRoomStatusOnDate={getRoomStatusOnDate}
          onOpenNewBookingForRoom={onOpenNewBookingForRoom}
          onOpenNewBooking={onOpenNewBooking}
          onOpenQuickChecker={() => {
            if (onOpenQuickChecker) onOpenQuickChecker();
            else setIsQuickCheckerOpen(true);
          }}
          onOpenAddPayment={onOpenAddPayment}
          onOpenAddOrder={onOpenAddOrder}
          onOpenReceipt={onOpenReceipt}
          onOpenCheckoutModal={onOpenCheckoutModal}
          onCheckOutGuest={onCheckOutGuest}
          onTriggerConfirmClean={handleTriggerConfirmClean}
        />
      )}

      {/* 5. VIEW 2: CATEGORIZED GRID VIEW */}
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
              {mediumRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  roomState={getRoomStatusOnDate(room)}
                  selectedDate={selectedDate}
                  bookings={bookings}
                  onSelectRoomModal={setSelectedRoomModal}
                  onOpenNewBookingForRoom={onOpenNewBookingForRoom}
                  onOpenNewBooking={onOpenNewBooking}
                  onOpenAddPayment={onOpenAddPayment}
                  onOpenAddOrder={onOpenAddOrder}
                  onOpenReceipt={onOpenReceipt}
                  onOpenCheckoutModal={onOpenCheckoutModal}
                  onCheckOutGuest={onCheckOutGuest}
                  onTriggerConfirmClean={handleTriggerConfirmClean}
                  onTriggerConfirmMaintenance={handleTriggerConfirmMaintenance}
                />
              ))}
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
                บ้านเดี่ยวขนาดใหญ่ &bull; ระระเบียงกว้าง
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {largeRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  roomState={getRoomStatusOnDate(room)}
                  selectedDate={selectedDate}
                  bookings={bookings}
                  onSelectRoomModal={setSelectedRoomModal}
                  onOpenNewBookingForRoom={onOpenNewBookingForRoom}
                  onOpenNewBooking={onOpenNewBooking}
                  onOpenAddPayment={onOpenAddPayment}
                  onOpenAddOrder={onOpenAddOrder}
                  onOpenReceipt={onOpenReceipt}
                  onOpenCheckoutModal={onOpenCheckoutModal}
                  onCheckOutGuest={onCheckOutGuest}
                  onTriggerConfirmClean={handleTriggerConfirmClean}
                  onTriggerConfirmMaintenance={handleTriggerConfirmMaintenance}
                />
              ))}
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
              {smallRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  roomState={getRoomStatusOnDate(room)}
                  selectedDate={selectedDate}
                  bookings={bookings}
                  onSelectRoomModal={setSelectedRoomModal}
                  onOpenNewBookingForRoom={onOpenNewBookingForRoom}
                  onOpenNewBooking={onOpenNewBooking}
                  onOpenAddPayment={onOpenAddPayment}
                  onOpenAddOrder={onOpenAddOrder}
                  onOpenReceipt={onOpenReceipt}
                  onOpenCheckoutModal={onOpenCheckoutModal}
                  onCheckOutGuest={onCheckOutGuest}
                  onTriggerConfirmClean={handleTriggerConfirmClean}
                  onTriggerConfirmMaintenance={handleTriggerConfirmMaintenance}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 6. ROOM DETAIL MODAL */}
      <RoomDetailModal
        room={selectedRoomModal}
        onClose={() => setSelectedRoomModal(null)}
        bookings={bookings}
        onUpdateRoomStatus={onUpdateRoomStatus}
        onOpenCheckoutModal={onOpenCheckoutModal}
        onCheckOutGuest={onCheckOutGuest}
        onOpenAddOrder={onOpenAddOrder}
        onOpenAddPayment={onOpenAddPayment}
        onOpenReceipt={onOpenReceipt}
      />

      {/* 7. CUSTOM CONFIRMATION POPUP */}
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

      {/* 8. QUICK AVAILABILITY CHECKER MODAL */}
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
