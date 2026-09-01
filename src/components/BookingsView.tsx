import React, { useState } from 'react';
import { 
  Plus, 
  ArrowRight, 
  Phone, 
  Trash2,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  Receipt,
  CreditCard,
  DoorOpen,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  UtensilsCrossed,
  Copy,
  Check
} from 'lucide-react';
import type { Booking, BookingStatus, AddOnItem, ResortSettings } from '../types/pms';
import { HouseLogo } from './HouseLogo';
import { formatThaiDate, THAI_MONTHS_FULL } from '../utils/dateUtils';
import { ConfirmDialogModal } from './ConfirmDialogModal';
import { 
  ExtraBedIcon, 
  MookataSmallIcon, 
  MookataLargeIcon, 
  BreakfastIcon 
} from './MenuIcons';

interface BookingsViewProps {
  bookings: Booking[];
  searchTerm: string;
  onOpenNewBooking: () => void;
  onCheckInGuest: (bookingId: string) => void;
  onCheckOutGuest: (bookingId: string) => void;
  onCancelBooking: (bookingId: string) => void;
  onRestoreBooking?: (bookingId: string) => void;
  onPermanentDeleteBooking?: (bookingId: string) => void;
  onOpenAddOrder?: (booking: Booking) => void;
  onOpenReceipt?: (booking: Booking) => void;
  onOpenAddPayment?: (booking: Booking) => void;
  onOpenCheckoutModal?: (booking: Booking) => void;
  settings?: ResortSettings;
}

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

export const BookingsView: React.FC<BookingsViewProps> = ({
  bookings,
  searchTerm,
  onOpenNewBooking,
  onCheckInGuest,
  onCheckOutGuest,
  onCancelBooking,
  onRestoreBooking,
  onPermanentDeleteBooking,
  onOpenAddOrder,
  onOpenReceipt,
  onOpenAddPayment,
  onOpenCheckoutModal,
  settings,
}) => {
  // Mode: Daily Operations View (Default) vs All Bookings List
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');
  const [copyMookataSuccess, setCopyMookataSuccess] = useState(false);

  // Daily View Date State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    const todayStr = new Date().toISOString().split('T')[0];
    const hasToday = bookings.some(b => b.checkInDate <= todayStr && b.checkOutDate >= todayStr && !b.deletedAt);
    if (hasToday) return todayStr;
    const hasSeptDemo = bookings.some(b => b.checkInDate <= '2026-09-01' && b.checkOutDate >= '2026-09-01' && !b.deletedAt);
    if (hasSeptDemo) return '2026-09-01';
    return todayStr;
  });

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<Booking | null>(null);

  // Date Navigation Handlers
  const handleShiftDate = (days: number) => {
    const d = new Date(selectedDate + 'T00:00:00');
    d.setDate(d.getDate() + days);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    setSelectedDate(`${y}-${m}-${day}`);
  };

  const handleResetToToday = () => {
    const todayStr = new Date().toISOString().split('T')[0];
    setSelectedDate(todayStr);
  };

  // Status mapping for visual badges
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">● รอลูกค้าเช็คอิน</span>;
      case 'checked_in':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-blue-100 text-blue-800 border border-blue-300">● กำลังพักอยู่</span>;
      case 'checked_out':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-slate-100 text-slate-700 border border-slate-300">✓ เช็คเอาท์แล้ว</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-red-100 text-red-700 border border-red-300">✕ ยกเลิก</span>;
      default:
        return null;
    }
  };

  // 30 Days Soft Delete Trash Logic
  const getDaysRemainingInTrash = (deletedAt?: string) => {
    if (!deletedAt) return 30;
    const deletedDate = new Date(deletedAt);
    const now = new Date();
    const diffTime = 30 * 24 * 60 * 60 * 1000 - (now.getTime() - deletedDate.getTime());
    return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
  };

  // Active bookings filter
  const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled');

  // Daily View Filters for selectedDate
  const arrivalsToday = activeBookings.filter(b => b.checkInDate === selectedDate);
  const departuresToday = activeBookings.filter(b => b.checkOutDate === selectedDate);
  const stayoverToday = activeBookings.filter(b => b.checkInDate < selectedDate && b.checkOutDate > selectedDate);
  
  // All active stays overlapping selectedDate (for kitchen & supplies totals)
  const activeOnDate = activeBookings.filter(b => b.checkInDate <= selectedDate && b.checkOutDate >= selectedDate);

  // Kitchen Prep Summary for selectedDate
  const kitchenSummary = activeOnDate.reduce((acc, b) => {
    b.addOns?.forEach(item => {
      if (item.category === 'mookata_large') acc.mookataLarge += item.quantity;
      else if (item.category === 'mookata_small') acc.mookataSmall += item.quantity;
      else if (item.category === 'breakfast') acc.breakfast += item.quantity;
      else if (item.category === 'bed') acc.extraBeds += item.quantity;
    });
    return acc;
  }, { mookataLarge: 0, mookataSmall: 0, breakfast: 0, extraBeds: 0 });

  // All Bookings View Filters
  const displayedAllBookings = bookings.filter((b) => {
    const isDeleted = !!b.deletedAt || b.status === 'cancelled';
    if (statusFilter === 'trash') {
      if (!isDeleted) return false;
    } else {
      if (isDeleted) return false;
      if (statusFilter === 'confirmed' && b.status !== 'confirmed') return false;
      if (statusFilter === 'checked_in' && b.status !== 'checked_in') return false;
      if (statusFilter === 'checked_out' && b.status !== 'checked_out') return false;
    }

    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.guestName.toLowerCase().includes(q) ||
      b.guestPhone.includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.roomNumber.toLowerCase().includes(q)
    );
  });

  const countTotal = activeBookings.length;
  const countCheckedIn = activeBookings.filter(b => b.status === 'checked_in').length;
  const countConfirmed = activeBookings.filter(b => b.status === 'confirmed').length;
  const countFullyPaid = activeBookings.filter(b => b.paidAmount >= b.totalAmount).length;
  const countTrash = bookings.filter(b => !!b.deletedAt || b.status === 'cancelled').length;

  // Render a Single Room Card in Daily View (Designed for Speed & Elderly/Non-tech staff)
  const renderDailyRoomCard = (b: Booking, _category: 'arrival' | 'stayover' | 'departure') => {
    const remainingBalance = Math.max(0, b.totalAmount - b.paidAmount);

    return (
      <div 
        key={b.id}
        className="bg-white rounded-3xl border-2 border-slate-200/90 hover:border-emerald-400 p-4 sm:p-5 shadow-sm transition-all space-y-3.5"
      >
        {/* Top Row: Room & Guest Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <HouseLogo roomNumber={b.roomNumber} size="md" />
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black text-slate-900">
                  บ้าน {b.roomNumber}
                </span>
                <span className="text-xs text-slate-500 font-bold">
                  ({b.roomType})
                </span>
                {getStatusBadge(b.status)}
              </div>
              <h3 className="text-sm sm:text-base font-black text-emerald-950 mt-0.5">
                {b.guestName}
              </h3>
            </div>
          </div>

          {/* Quick Call & Guest Details */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a 
              href={`tel:${b.guestPhone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-bold text-xs rounded-xl border border-emerald-200 transition-all shadow-2xs"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{b.guestPhone}</span>
            </a>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl">
              {b.totalGuests} ท่าน &bull; {b.totalNights} คืน
            </span>
          </div>
        </div>

        {/* Middle Row: Active Orders (Mookata, Extra Bed, Breakfast) */}
        <div className="bg-slate-50/80 p-3 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              รายการอาหาร & บริการเสริมที่สั่งไว้:
            </span>
            {b.addOns && b.addOns.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 pt-0.5">
                {b.addOns.map((ad: AddOnItem) => (
                  <span 
                    key={ad.id} 
                    className="inline-flex items-center gap-1 text-xs font-extrabold bg-white text-slate-900 px-2.5 py-1 rounded-xl border border-slate-200 shadow-2xs"
                  >
                    <span>{ad.name}</span>
                    <span className="text-emerald-700 font-black">(฿{(ad.price * ad.quantity).toLocaleString()})</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs font-bold text-slate-400">ยังไม่มีรายการสั่งอาหารหรือบริการเสริม</p>
            )}
          </div>

          {/* Pricing Balance */}
          <div className="text-left sm:text-right shrink-0">
            <span className="text-[11px] text-slate-500 font-bold block">ยอดรวมทั้งสิ้น</span>
            <span className="text-base sm:text-lg font-black text-slate-900 block leading-tight">
              ฿{b.totalAmount.toLocaleString()}
            </span>
            {remainingBalance > 0 ? (
              <span className="text-xs font-black text-red-600 block mt-0.5">
                ค้างชำระ: ฿{remainingBalance.toLocaleString()}
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600 block mt-0.5">
                ✓ ชำระเงินครบแล้ว
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Fast Action Buttons (Designed for 1-Tap Speed) */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          {/* 1. FAST MOOKATA ORDER BUTTON (Prominent Amber/Orange) */}
          {onOpenAddOrder && (
            <button
              onClick={() => onOpenAddOrder(b)}
              disabled={b.status === 'checked_out'}
              className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs sm:text-sm font-black rounded-2xl shadow-md shadow-amber-500/25 cursor-pointer transition-all disabled:opacity-50"
            >
              <UtensilsCrossed className="w-4 h-4 stroke-[2.5]" />
              <span>+ สั่งหมูกระทะ / อาหาร</span>
            </button>
          )}

          {/* Quick Payment / Receipt / Checkin Actions */}
          <div className="flex items-center gap-2 flex-wrap flex-1 sm:flex-none justify-end">
            {/* Payment Button */}
            {onOpenAddPayment && remainingBalance > 0 && b.status !== 'checked_out' && (
              <button
                onClick={() => onOpenAddPayment(b)}
                className="flex items-center gap-1.5 px-3.5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>รับเงิน (฿{remainingBalance.toLocaleString()})</span>
              </button>
            )}

            {/* Receipt Button */}
            {onOpenReceipt && (
              <button
                onClick={() => onOpenReceipt(b)}
                className="flex items-center gap-1.5 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 transition-all cursor-pointer"
                title="ดูใบเสร็จรับเงิน"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>ใบเสร็จ</span>
              </button>
            )}

            {/* Check-in Action */}
            {b.status === 'confirmed' && (
              <button
                onClick={() => onCheckInGuest(b.id)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-black rounded-xl shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                <span>เช็คอินเข้าพัก</span>
              </button>
            )}

            {/* Check-out Action */}
            {b.status === 'checked_in' && (
              <button
                onClick={() => {
                  if (onOpenCheckoutModal) onOpenCheckoutModal(b);
                  else onCheckOutGuest(b.id);
                }}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-black rounded-xl shadow-md transition-all cursor-pointer"
              >
                <DoorOpen className="w-4 h-4" />
                <span>เช็คเอาท์ออก</span>
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-12 animate-in fade-in duration-500 font-['Prompt'] select-none">
      
      {/* Top Mode Selector & New Booking Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 sm:p-4 rounded-3xl border border-slate-200 shadow-xs">
        {/* Toggle between Daily Operations View and All Bookings */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setViewMode('daily')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
              viewMode === 'daily'
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CalendarDays className="w-4 h-4 stroke-[2.5]" />
            <span>📅 สมุดงานรายวัน (Daily View)</span>
          </button>

          <button
            onClick={() => setViewMode('all')}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-black rounded-xl transition-all cursor-pointer ${
              viewMode === 'all'
                ? 'bg-slate-900 text-white shadow-md'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 stroke-[2.5]" />
            <span>📋 รายการทั้งหมด ({countTotal})</span>
          </button>
        </div>

        <button
          onClick={onOpenNewBooking}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-2xl shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ สร้างการจองใหม่</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY OPERATIONS VIEW (สมุดงานประจำวัน)                               */}
      {/* ========================================================================= */}
      {viewMode === 'daily' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Date Navigation Bar (Huge Buttons, Friendly for Elderly Staff) */}
          <div className="bg-white rounded-3xl border border-slate-200 p-3 sm:p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {/* Previous Day Button */}
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="flex items-center gap-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200 transition-all cursor-pointer shrink-0"
              >
                <ChevronLeft className="w-4 h-4 stroke-[2.5]" />
                <span>เมื่อวาน</span>
              </button>

              {/* Today Reset Button */}
              <button
                type="button"
                onClick={handleResetToToday}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 text-xs sm:text-sm font-black rounded-2xl border border-emerald-200 transition-all cursor-pointer"
              >
                <Clock className="w-4 h-4 text-emerald-600" />
                <span>📌 วันนี้</span>
              </button>

              {/* Next Day Button */}
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="flex items-center gap-1 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 text-xs sm:text-sm font-bold rounded-2xl border border-slate-200 transition-all cursor-pointer shrink-0"
              >
                <span>พรุ่งนี้</span>
                <ChevronRight className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            {/* Current Active Date Title & Date Picker Input */}
            <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
              <div className="text-left sm:text-right">
                <span className="text-[11px] font-bold text-slate-400 block uppercase">ตารางงานประจำวัน</span>
                <span className="text-sm sm:text-base font-black text-slate-900 block">
                  {formatThaiFullDate(selectedDate)}
                </span>
              </div>

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="px-3 py-2 bg-slate-50 hover:bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 outline-none focus:border-emerald-500 cursor-pointer shadow-2xs"
                title="แตะเพื่อเลือกวันที่ในปฏิทิน"
              />
            </div>
          </div>

          {/* Kitchen & External Supplier Summary Bar */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-4 sm:p-6 border border-slate-800 shadow-xl space-y-4">
            
            {/* Header with date info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
                  <UtensilsCrossed className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black flex items-center gap-2 text-white">
                    <span>ยอดที่ต้องจัดเตรียม & สั่งร้านภายนอก</span>
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      รวม {activeOnDate.length} ห้องพัก
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    สรุปยอดหมูกระทะ (สั่งร้านข้างนอก) และอาหารเช้าสำหรับ {formatThaiFullDate(selectedDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* PART 1: หมูกระทะ (สั่งร้านภายนอก • ไม่ได้ทำเอง) */}
            <div className="p-3.5 sm:p-4 rounded-2xl bg-slate-800/90 border border-orange-500/40 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[11px] font-bold">
                    🛵 สั่งร้านภายนอก (ไม่ได้ทำเอง)
                  </span>
                  <span className="text-xs sm:text-sm font-black text-white">
                    {settings?.mookataSupplierName || 'ร้านหมูกระทะประจำรีสอร์ท'}
                  </span>
                </div>

                {/* Copy / Call Actions */}
                <div className="flex items-center gap-2">
                  {/* Copy Order for LINE */}
                  <button
                    type="button"
                    onClick={() => {
                      const totalMookata = kitchenSummary.mookataLarge + kitchenSummary.mookataSmall;
                      const text = `สั่งหมูกระทะสำหรับ สวอนฮิลล์ รีสอร์ท (Swan HILL)\n📅 ประจำวันที่: ${formatThaiDate(selectedDate)}\n- หมูกระทะชุดใหญ่: ${kitchenSummary.mookataLarge} ชุด\n- หมูกระทะชุดเล็ก: ${kitchenSummary.mookataSmall} ชุด\nรวมทั้งหมด: ${totalMookata} ชุด\n📍 ส่งที่: สวอนฮิลล์ รีสอร์ท`;
                      navigator.clipboard.writeText(text);
                      setCopyMookataSuccess(true);
                      setTimeout(() => setCopyMookataSuccess(false), 2500);
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 active:scale-95 text-orange-300 font-bold text-xs rounded-xl border border-orange-500/40 transition-all cursor-pointer shadow-xs"
                    title="คัดลอกข้อความสรุปยอดเพื่อส่งทาง LINE หาร้าน"
                  >
                    {copyMookataSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        <span className="text-emerald-300">คัดลอกส่ง LINE แล้ว!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-orange-400" />
                        <span>คัดลอกส่ง LINE</span>
                      </>
                    )}
                  </button>

                  {/* Phone Call to Supplier */}
                  {settings?.mookataSupplierPhone && (
                    <a
                      href={`tel:${settings.mookataSupplierPhone.replace(/[^0-9+]/g, '')}`}
                      className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs transition-all"
                      title="กดเพื่อโทรสั่งร้านหมูกระทะทันที"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>โทรสั่งร้าน</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Mookata Counters */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                {/* Large */}
                <div className="bg-slate-900/90 border border-red-500/40 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
                      <MookataLargeIcon size={22} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">หมูกระทะ (ชุดใหญ่)</span>
                      <span className="text-xs text-red-300 font-medium">฿500 /ชุด</span>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-red-400">
                    {kitchenSummary.mookataLarge} <span className="text-xs text-slate-400 font-normal">ชุด</span>
                  </span>
                </div>

                {/* Small */}
                <div className="bg-slate-900/90 border border-orange-500/40 p-3 rounded-2xl flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center shrink-0">
                      <MookataSmallIcon size={22} />
                    </div>
                    <div>
                      <span className="text-[11px] font-bold text-slate-400 block">หมูกระทะ (ชุดเล็ก)</span>
                      <span className="text-xs text-orange-300 font-medium">฿350 /ชุด</span>
                    </div>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-orange-400">
                    {kitchenSummary.mookataSmall} <span className="text-xs text-slate-400 font-normal">ชุด</span>
                  </span>
                </div>

                {/* Total Mookata Sets */}
                <div className="bg-slate-900/90 border border-slate-700 p-3 rounded-2xl flex items-center justify-between">
                  <div>
                    <span className="text-[11px] font-bold text-slate-400 block">รวมหมูกระทะที่ต้องสั่ง</span>
                    <span className="text-xs text-emerald-400 font-medium">โทรสั่งร้านล่วงหน้า</span>
                  </div>
                  <span className="text-xl sm:text-2xl font-black text-white">
                    {kitchenSummary.mookataLarge + kitchenSummary.mookataSmall} <span className="text-xs text-slate-400 font-normal">ชุด</span>
                  </span>
                </div>
              </div>
            </div>

            {/* PART 2: รายการที่รีสอร์ทจัดเตรียมเอง (อาหารเช้า & ที่นอนเสริม) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Breakfast */}
              <div className="bg-slate-800/60 border border-teal-500/30 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <BreakfastIcon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-200">อาหารเช้า</span>
                      <span className="text-[10px] font-bold text-teal-400 bg-teal-500/20 px-1.5 py-0.2 rounded border border-teal-500/30">
                        รีสอร์ททำเอง
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">ครัวจัดเตรียม</span>
                  </div>
                </div>
                <span className="text-lg sm:text-xl font-black text-teal-400">
                  {kitchenSummary.breakfast} <span className="text-xs text-slate-400 font-normal">ท่าน</span>
                </span>
              </div>

              {/* Extra Beds */}
              <div className="bg-slate-800/60 border border-amber-500/30 p-3 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ExtraBedIcon size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-slate-200">ที่นอนเสริม</span>
                      <span className="text-[10px] font-bold text-amber-400 bg-amber-500/20 px-1.5 py-0.2 rounded border border-amber-500/30">
                        แม่บ้านจัดเอง
                      </span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-medium">ปูเตียงเพิ่มในห้อง</span>
                  </div>
                </div>
                <span className="text-lg sm:text-xl font-black text-amber-400">
                  {kitchenSummary.extraBeds} <span className="text-xs text-slate-400 font-normal">หลัง</span>
                </span>
              </div>
            </div>

          </div>

          {/* Categorized Daily Rooms List */}
          <div className="space-y-6">
            
            {/* Category 1: เช็คอินเข้าพักวันนี้ (Arrivals) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  เช็คอินเข้าพักวันนี้ (Arrivals)
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {arrivalsToday.length} ห้อง
                </span>
              </div>

              {arrivalsToday.length === 0 ? (
                <div className="p-4 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
                  ไม่มีลูกค้าเช็คอินเข้าพักใหม่ในวันนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {arrivalsToday.map(b => renderDailyRoomCard(b, 'arrival'))}
                </div>
              )}
            </div>

            {/* Category 2: พักอยู่ต่อเนื่อง (Stayover) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-3.5 h-3.5 rounded-full bg-blue-500" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  พักอยู่ต่อเนื่อง (Stayover)
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {stayoverToday.length} ห้อง
                </span>
              </div>

              {stayoverToday.length === 0 ? (
                <div className="p-4 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
                  ไม่มีห้องที่พักต่อเนื่องในวันนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {stayoverToday.map(b => renderDailyRoomCard(b, 'stayover'))}
                </div>
              )}
            </div>

            {/* Category 3: เช็คเอาท์ออกวันนี้ (Departures) */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <span className="w-3.5 h-3.5 rounded-full bg-slate-500" />
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  เช็คเอาท์ออกวันนี้ (Departures)
                </h3>
                <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {departuresToday.length} ห้อง
                </span>
              </div>

              {departuresToday.length === 0 ? (
                <div className="p-4 text-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-500 font-medium">
                  ไม่มีลูกค้าเช็คเอาท์คืนห้องในวันนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {departuresToday.map(b => renderDailyRoomCard(b, 'departure'))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. ALL BOOKINGS VIEW (รายการจองทั้งหมด)                                  */}
      {/* ========================================================================= */}
      {viewMode === 'all' && (
        <div className="space-y-4 md:space-y-6 animate-in fade-in">
          
          {/* 5 Status Cards at the Top */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
            <div 
              onClick={() => setStatusFilter('all')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                statusFilter === 'all' 
                  ? 'bg-slate-900 text-white border-slate-900 ring-2 ring-emerald-500/30' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold opacity-80">ทั้งหมด</span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${statusFilter === 'all' ? 'bg-white/10 text-emerald-400' : 'bg-slate-100 text-slate-600'}`}>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black">{countTotal}</span>
            </div>

            <div 
              onClick={() => setStatusFilter('checked_in')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                statusFilter === 'checked_in' 
                  ? 'bg-blue-600 text-white border-blue-600 ring-2 ring-blue-500/30' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold opacity-80">กำลังพัก</span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${statusFilter === 'checked_in' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black">{countCheckedIn}</span>
            </div>

            <div 
              onClick={() => setStatusFilter('confirmed')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer shadow-xs ${
                statusFilter === 'confirmed' 
                  ? 'bg-emerald-600 text-white border-emerald-600 ring-2 ring-emerald-500/30' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold opacity-80">รอเช็คอิน</span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${statusFilter === 'confirmed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black">{countConfirmed}</span>
            </div>

            <div className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-xs">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold text-slate-600">ชำระครบ</span>
                <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black text-slate-900">{countFullyPaid}</span>
            </div>

            <div 
              onClick={() => setStatusFilter('trash')}
              className={`p-3.5 sm:p-4 rounded-2xl border transition-all cursor-pointer shadow-xs col-span-2 sm:col-span-1 ${
                statusFilter === 'trash' 
                  ? 'bg-red-600 text-white border-red-600 ring-2 ring-red-500/30' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-bold opacity-80">ถังขยะ</span>
                <div className={`w-7 h-7 rounded-xl flex items-center justify-center ${statusFilter === 'trash' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-xl sm:text-2xl font-black">{countTrash}</span>
            </div>
          </div>

          {/* Filter Sub-Tabs */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: `ทั้งหมด (${countTotal})` },
                { id: 'confirmed', label: 'รอลูกค้ามา' },
                { id: 'checked_in', label: 'กำลังพักอยู่' },
                { id: 'checked_out', label: 'เช็คเอาท์แล้ว' },
                { id: 'trash', label: `ถังขยะ (${countTrash})` },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    statusFilter === tab.id
                      ? 'bg-white text-slate-900 shadow-xs font-black'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Full Bookings Cards List */}
          <div className="space-y-3">
            {displayedAllBookings.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
                <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-bold text-sm">ไม่พบรายการจองในหมวดนี้</p>
                <p className="text-slate-400 text-xs mt-0.5">ลองค้นหาด้วยคำอื่น หรือกดสร้างรายการจองใหม่</p>
              </div>
            ) : (
              displayedAllBookings.map((b) => {
                const remainingBalance = Math.max(0, b.totalAmount - b.paidAmount);

                return (
                  <div
                    key={b.id}
                    className={`bg-white/95 backdrop-blur-md rounded-2xl border p-3.5 md:p-4 transition-all shadow-[0_2px_12px_rgba(0,0,0,0.03)] hover:shadow-md ${
                      b.status === 'cancelled' || !!b.deletedAt 
                        ? 'border-red-200 bg-red-50/20' 
                        : 'border-slate-200/90 hover:border-emerald-300'
                    }`}
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-center">
                      
                      {/* Customer Profile */}
                      <div className="xl:col-span-3 flex items-center gap-3">
                        {b.status === 'checked_in' && (
                          <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex flex-col items-center justify-center p-1 shadow-sm shrink-0 border border-blue-500">
                            <Users className="w-4 h-4 mb-0.5 text-blue-100" />
                            <span className="text-[10px] font-medium leading-none">กำลังพัก</span>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <div className="w-12 h-12 rounded-2xl bg-emerald-600 text-white flex flex-col items-center justify-center p-1 shadow-sm shrink-0 border border-emerald-500">
                            <Clock className="w-4 h-4 mb-0.5 text-emerald-100" />
                            <span className="text-[10px] font-medium leading-none">รอเช็คอิน</span>
                          </div>
                        )}
                        {b.status === 'checked_out' && (
                          <div className="w-12 h-12 rounded-2xl bg-slate-800 text-slate-200 flex flex-col items-center justify-center p-1 shadow-sm shrink-0 border border-slate-700">
                            <CheckCircle2 className="w-4 h-4 mb-0.5 text-slate-400" />
                            <span className="text-[10px] font-medium leading-none">เช็คเอาท์</span>
                          </div>
                        )}
                        {(b.status === 'cancelled' || !!b.deletedAt) && (
                          <div className="w-12 h-12 rounded-2xl bg-red-600 text-white flex flex-col items-center justify-center p-1 shadow-sm shrink-0 border border-red-500">
                            <Trash2 className="w-4 h-4 mb-0.5 text-red-100" />
                            <span className="text-[10px] font-medium leading-none">ยกเลิก</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 font-black text-[10px]">
                              {b.bookingCode}
                            </span>
                            <span className="text-[9px] text-slate-400 font-medium truncate">
                              {formatThaiDate(b.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-sm font-black text-slate-900 truncate mt-0.5">
                            {b.guestName}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                            <a 
                              href={`tel:${b.guestPhone.replace(/[^0-9+]/g, '')}`} 
                              className="flex items-center gap-1 font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] transition-colors"
                            >
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{b.guestPhone}</span>
                            </a>
                          </div>
                          {statusFilter === 'trash' && (
                            <p className="text-[10px] text-red-600 font-bold mt-1">
                              ลบถาวรในอีก {getDaysRemainingInTrash(b.deletedAt)} วัน
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Room & Dates */}
                      <div className="xl:col-span-4 flex items-center gap-3 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/80">
                        <HouseLogo roomNumber={b.roomNumber} size="sm" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-black text-slate-900 truncate">
                              ห้อง {b.roomNumber} &bull; {b.roomType}
                            </span>
                            {getStatusBadge(b.status)}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                            <span className="font-bold text-slate-900 truncate">{formatThaiDate(b.checkInDate)}</span>
                            <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                              {b.totalNights} คืน
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-bold text-slate-900 truncate">{formatThaiDate(b.checkOutDate)}</span>
                          </div>

                          {b.addOns && b.addOns.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-0.5">
                              {b.addOns.map((ad) => (
                                <span key={ad.id} className="text-[9px] font-bold bg-white text-slate-800 px-1.5 py-0.2 rounded border border-slate-200 shadow-2xs">
                                  {ad.name} <strong className="text-emerald-700">(฿{(ad.price * ad.quantity).toLocaleString()})</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total & Remaining */}
                      <div className="xl:col-span-2 text-left xl:text-right border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100">
                        <span className="text-[9px] text-slate-500 font-bold block uppercase">ยอดรวมสุทธิ</span>
                        <span className="text-base font-black text-emerald-900 block leading-tight">
                          ฿{b.totalAmount.toLocaleString()}
                        </span>
                        {remainingBalance > 0 ? (
                          <span className="text-[10px] font-extrabold text-red-600 block">
                            ค้างชำระ: ฿{remainingBalance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-emerald-600 block">
                            ✓ ชำระครบแล้ว
                          </span>
                        )}
                      </div>

                      {/* Standardized Actions */}
                      <div className="xl:col-span-3 flex items-center justify-start xl:justify-end gap-1.5 flex-wrap border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100">
                        {statusFilter !== 'trash' ? (
                          <>
                            {onOpenAddOrder && (
                              <button
                                onClick={() => onOpenAddOrder(b)}
                                disabled={b.status === 'checked_out'}
                                className="px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer disabled:opacity-40"
                              >
                                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                                <span>สั่งอาหาร</span>
                              </button>
                            )}

                            {onOpenAddPayment && remainingBalance > 0 && b.status !== 'checked_out' && (
                              <button
                                onClick={() => onOpenAddPayment(b)}
                                className="px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 shadow-sm cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>รับเงิน</span>
                              </button>
                            )}

                            {onOpenReceipt && (
                              <button
                                onClick={() => onOpenReceipt(b)}
                                className="px-2.5 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                                title="ดูใบเสร็จรับเงิน"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => onCheckInGuest(b.id)}
                                className="px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
                              >
                                <DoorOpen className="w-3.5 h-3.5" />
                                <span>เช็คอิน</span>
                              </button>
                            )}

                            {b.status === 'checked_in' && (
                              <button
                                onClick={() => {
                                  if (onOpenCheckoutModal) onOpenCheckoutModal(b);
                                  else onCheckOutGuest(b.id);
                                }}
                                className="px-3 py-2 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 bg-slate-900 text-white hover:bg-slate-800 shadow-xs cursor-pointer"
                              >
                                <DoorOpen className="w-3.5 h-3.5" />
                                <span>เช็คเอาท์</span>
                              </button>
                            )}

                            <button
                              onClick={() => setDeleteConfirmBooking(b)}
                              className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                              title="ย้ายไปถังขยะ"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        ) : (
                          <>
                            {onRestoreBooking && (
                              <button
                                onClick={() => onRestoreBooking(b.id)}
                                className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition-all cursor-pointer"
                              >
                                <span>กู้คืน</span>
                              </button>
                            )}
                            {onPermanentDeleteBooking && (
                              <button
                                onClick={() => onPermanentDeleteBooking(b.id)}
                                className="px-3 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 bg-red-600 text-white hover:bg-red-700 transition-all cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>ลบถาวร</span>
                              </button>
                            )}
                          </>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Delete / Cancel Confirmation Modal */}
      {deleteConfirmBooking && (
        <ConfirmDialogModal
          isOpen={!!deleteConfirmBooking}
          onClose={() => setDeleteConfirmBooking(null)}
          onConfirm={() => {
            if (deleteConfirmBooking) {
              onCancelBooking(deleteConfirmBooking.id);
              setDeleteConfirmBooking(null);
            }
          }}
          title="ยืนยันการลบรายการจอง"
          description={`คุณต้องการย้ายรายการจองของ "${deleteConfirmBooking.guestName}" (ห้อง ${deleteConfirmBooking.roomNumber}) ไปยังถังขยะใช่หรือไม่? (สามารถกู้คืนได้ภายใน 30 วัน)`}
          confirmText="ย้ายไปถังขยะ"
          type="danger"
        />
      )}

    </div>
  );
};
