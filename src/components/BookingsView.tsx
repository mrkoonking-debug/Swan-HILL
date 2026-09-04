import React, { useState, useMemo } from 'react';
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
  Calendar,
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
import { LiquidSegmentedControl } from './LiquidSegmentedControl';
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
  onOpenCloneBooking?: (booking: Booking) => void;
  onUpdateBookingAddOns?: (bookingId: string, updatedAddOns: AddOnItem[]) => void;
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
  onOpenCloneBooking,
  onUpdateBookingAddOns,
  settings,
}) => {
  // Mode: Daily Operations View (Default) vs All Bookings List
  const [viewMode, setViewMode] = useState<'daily' | 'all'>('daily');
  const [copyMookataSuccess, setCopyMookataSuccess] = useState(false);
  const [copiedHouseId, setCopiedHouseId] = useState<string | null>(null);
  const [localOrderedMap, setLocalOrderedMap] = useState<Record<string, boolean>>(() => {
    try {
      const saved = localStorage.getItem('swanhill_mookata_ordered_v1');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // Local Timezone Safe Date Helpers
  const getLocalDateStr = (d: Date = new Date()) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const todayStr = getLocalDateStr(new Date());

  // Daily View Date State
  const [selectedDate, setSelectedDate] = useState<string>(() => {
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

  // Status mapping for visual badges
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">● รอลูกค้าเช็คอิน</span>;
      case 'checked_in':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200">● กำลังพักอยู่</span>;
      case 'checked_out':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">✓ เช็คเอาท์แล้ว</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-600 border border-red-200">✕ ยกเลิก</span>;
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

  // Active bookings filter (Memoized)
  const activeBookings = useMemo(() => {
    return bookings.filter(b => !b.deletedAt && b.status !== 'cancelled');
  }, [bookings]);

  // Daily View Filters & Kitchen prep summary for selectedDate (Memoized)
  const { arrivalsToday, departuresToday, stayoverToday, activeOnDate, kitchenSummary, housesWithMookata } = useMemo(() => {
    const arrivals = activeBookings.filter(b => b.checkInDate === selectedDate);
    const departures = activeBookings.filter(b => b.checkOutDate === selectedDate);
    const stayover = activeBookings.filter(b => b.checkInDate < selectedDate && b.checkOutDate > selectedDate);
    const activeOnDate = activeBookings.filter(b => b.checkInDate <= selectedDate && b.checkOutDate >= selectedDate);

    const kSummary = activeOnDate.reduce((acc, b) => {
      b.addOns?.forEach(item => {
        if (item.category === 'mookata_large') acc.mookataLarge += item.quantity;
        else if (item.category === 'mookata_small') acc.mookataSmall += item.quantity;
        else if (item.category === 'breakfast') acc.breakfast += item.quantity;
        else if (item.category === 'bed') acc.extraBeds += item.quantity;
      });
      return acc;
    }, { mookataLarge: 0, mookataSmall: 0, breakfast: 0, extraBeds: 0 });

    const mookataHouses = activeOnDate.filter(b => 
      b.addOns?.some(a => (a.category === 'mookata_large' || a.category === 'mookata_small') && a.quantity > 0)
    );

    return {
      arrivalsToday: arrivals,
      departuresToday: departures,
      stayoverToday: stayover,
      activeOnDate,
      kitchenSummary: kSummary,
      housesWithMookata: mookataHouses,
    };
  }, [activeBookings, selectedDate]);

  const handleToggleMookataOrdered = (b: Booking) => {
    const isAlreadyOrdered = b.addOns?.some(
      a => (a.category === 'mookata_large' || a.category === 'mookata_small') && a.isOrdered
    ) || !!localOrderedMap[b.id];

    const nextState = !isAlreadyOrdered;
    setLocalOrderedMap(prev => {
      const updated = { ...prev, [b.id]: nextState };
      try {
        localStorage.setItem('swanhill_mookata_ordered_v1', JSON.stringify(updated));
      } catch {}
      return updated;
    });

    if (b.addOns && onUpdateBookingAddOns) {
      const updatedAddOns = b.addOns.map(a => {
        if (a.category === 'mookata_large' || a.category === 'mookata_small') {
          return {
            ...a,
            isOrdered: nextState,
            orderedAt: nextState ? new Date().toISOString() : undefined,
          };
        }
        return a;
      });
      onUpdateBookingAddOns(b.id, updatedAddOns);
    }
  };

  const handleCopyHouseMookata = (b: Booking) => {
    const large = b.addOns?.filter(a => a.category === 'mookata_large').reduce((s, a) => s + a.quantity, 0) || 0;
    const small = b.addOns?.filter(a => a.category === 'mookata_small').reduce((s, a) => s + a.quantity, 0) || 0;
    const items: string[] = [];
    if (large > 0) items.push(`- หมูกระทะชุดใหญ่ (500.-): ${large} ชุด`);
    if (small > 0) items.push(`- หมูกระทะชุดเล็ก (350.-): ${small} ชุด`);

    const text = `🛵 สั่งหมูกระทะสำหรับ สวอนฮิลล์ รีสอร์ท (Swan HILL)\n📅 ประจำวันที่: ${formatThaiDate(selectedDate)}\n📍 ส่งที่: บ้าน ${b.roomNumber} (${b.guestName})\n${items.join('\n')}\n📞 เบอร์ติดต่อลูกค้า: ${b.guestPhone}\n📍 พิกัดส่ง: สวอนฮิลล์ รีสอร์ท`;

    navigator.clipboard.writeText(text);
    setCopiedHouseId(b.id);
    setTimeout(() => setCopiedHouseId(null), 2500);
  };

  // All Bookings View Filters (Memoized)
  const displayedAllBookings = useMemo(() => {
    return bookings.filter((b) => {
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
  }, [bookings, statusFilter, searchTerm]);

  // Tab Badge Counts in a single optimized pass (Memoized)
  const { countTotal, countCheckedIn, countConfirmed, countFullyPaid, countTrash } = useMemo(() => {
    let checkedIn = 0;
    let confirmed = 0;
    let fullyPaid = 0;
    activeBookings.forEach(b => {
      if (b.status === 'checked_in') checkedIn++;
      if (b.status === 'confirmed') confirmed++;
      if (b.paidAmount >= b.totalAmount) fullyPaid++;
    });
    const trash = bookings.filter(b => !!b.deletedAt || b.status === 'cancelled').length;
    return {
      countTotal: activeBookings.length,
      countCheckedIn: checkedIn,
      countConfirmed: confirmed,
      countFullyPaid: fullyPaid,
      countTrash: trash,
    };
  }, [activeBookings, bookings]);

  // Render a Single Room Card in Daily View (Clean, Proportional & Friendly)
  const renderDailyRoomCard = (b: Booking, _category: 'arrival' | 'stayover' | 'departure') => {
    const remainingBalance = Math.max(0, b.totalAmount - b.paidAmount);
    const hasMookata = b.addOns?.some(a => (a.category === 'mookata_large' || a.category === 'mookata_small') && a.quantity > 0);
    const isMookataOrdered = b.addOns?.some(a => (a.category === 'mookata_large' || a.category === 'mookata_small') && a.isOrdered) || !!localOrderedMap[b.id];

    return (
      <div 
        key={b.id}
        className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-4 sm:p-4.5 shadow-xs transition-all space-y-3"
      >
        {/* Top Row: Room & Guest Info */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-2.5 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <HouseLogo roomNumber={b.roomNumber} size="md" />
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm sm:text-base font-bold text-slate-900">
                  บ้าน {b.roomNumber}
                </span>
                <span className="text-xs text-slate-500 font-normal">
                  ({b.roomType})
                </span>

                {getStatusBadge(b.status)}

                {b.groupId && (
                  <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    <Users className="w-3 h-3 text-indigo-600" />
                    กรุ๊ป {b.groupRoomNumbers?.join(' + ') || 'หลายห้อง'}
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mt-0.5">
                {b.guestName}
                {b.checkInTime && <span className="ml-2 text-[11px] font-normal text-slate-500">({b.checkInTime} - {b.checkOutTime || ''} น.)</span>}
              </h3>
            </div>
          </div>

          {/* Quick Call & Guest Details */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <a 
              href={`tel:${b.guestPhone.replace(/[^0-9+]/g, '')}`}
              className="flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 active:scale-95 text-emerald-800 font-medium text-xs rounded-xl border border-emerald-200 transition-all"
            >
              <Phone className="w-3.5 h-3.5 text-emerald-600" />
              <span>{b.guestPhone}</span>
            </a>
            <span className="px-2.5 py-1 bg-slate-100 text-slate-600 font-medium text-xs rounded-xl">
              {b.totalGuests} ท่าน &bull; {b.totalNights} คืน
            </span>
          </div>
        </div>

        {/* Middle Row: 1-Line Details Bar strictly on 1 single line */}
        <div className="bg-slate-50/90 hover:bg-slate-100/70 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center justify-between gap-2 text-xs transition-colors overflow-hidden">
          {/* Left: 1-Line Order Details (Scrollable if multiple items) */}
          <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto no-scrollbar py-0.5 flex-1">
            <span className="text-xs font-semibold text-slate-600 shrink-0">รายละเอียด:</span>
            {b.addOns && b.addOns.length > 0 ? (
              <div className="flex items-center gap-1.5 shrink-0 flex-nowrap">
                {b.addOns.map((ad: AddOnItem) => (
                  <span 
                    key={ad.id} 
                    className="inline-flex items-center gap-1 text-[11px] font-normal bg-white text-slate-800 px-2 py-0.5 rounded-md border border-slate-200 shadow-2xs shrink-0 whitespace-nowrap"
                  >
                    <span>{ad.name}</span>
                    <span className="text-emerald-700 font-semibold">฿{(ad.price * ad.quantity).toLocaleString()}</span>
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-xs font-normal text-slate-400 shrink-0">ยังไม่มีรายการสั่งเสริม</span>
            )}

            {/* Mookata Ordered Status Pill */}
            {hasMookata && (
              <button
                type="button"
                onClick={() => handleToggleMookataOrdered(b)}
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-md border shrink-0 cursor-pointer transition-all whitespace-nowrap ${
                  isMookataOrdered
                    ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                    : 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                }`}
                title="แตะเพื่อเปลี่ยนสถานะโทรสั่งร้านหมูกระทะ"
              >
                {isMookataOrdered ? (
                  <>
                    <Check className="w-3 h-3 stroke-2 text-emerald-700" />
                    <span>โทรสั่งแล้ว</span>
                  </>
                ) : (
                  <>
                    <Clock className="w-3 h-3 text-amber-700" />
                    <span>ยังไม่สั่ง</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right: 1-Line Total & Payment Balance */}
          <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap pl-2 border-l border-slate-200/80">
            <span className="text-xs text-slate-500 font-normal">ยอดรวม:</span>
            <span className="text-xs sm:text-sm font-bold text-slate-900">
              ฿{b.totalAmount.toLocaleString()}
            </span>
            {remainingBalance > 0 ? (
              <span className="text-[10px] font-semibold text-red-600 bg-red-50 px-1.5 py-0.5 rounded-md border border-red-200 whitespace-nowrap">
                ค้าง ฿{remainingBalance.toLocaleString()}
              </span>
            ) : (
              <span className="text-[10px] font-medium text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200 flex items-center gap-0.5 whitespace-nowrap">
                <Check className="w-3 h-3 text-emerald-600" /> ครบแล้ว
              </span>
            )}
          </div>
        </div>

        {/* Bottom Row: Fast Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-0.5">
          {/* Fast Mookata / Add Order Buttons */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 sm:flex-none">
            {onOpenAddOrder && (
              <button
                onClick={() => onOpenAddOrder(b)}
                disabled={b.status === 'checked_out'}
                className="flex items-center justify-center gap-1.5 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs cursor-pointer transition-all disabled:opacity-50"
              >
                <UtensilsCrossed className="w-3.5 h-3.5" />
                <span>+ สั่งหมูกระทะ / อาหาร</span>
              </button>
            )}

            {/* Quick Copy for this house if Mookata ordered */}
            {hasMookata && (
              <button
                type="button"
                onClick={() => handleCopyHouseMookata(b)}
                className="flex items-center gap-1 px-3 py-2 bg-orange-50 hover:bg-orange-100 active:scale-95 text-orange-800 text-xs font-semibold rounded-xl border border-orange-200 transition-all cursor-pointer"
                title={`คัดลอกข้อความสั่งหมูกระทะเฉพาะบ้าน ${b.roomNumber}`}
              >
                {copiedHouseId === b.id ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 stroke-2" />
                    <span className="text-emerald-700 font-bold">คัดลอกแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-orange-600" />
                    <span>ส่งร้าน (บ้าน {b.roomNumber})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Quick Payment / Receipt / Checkin Actions */}
          <div className="flex items-center gap-1.5 flex-wrap flex-1 sm:flex-none justify-end">
            {/* Clone Room for this guest */}
            {onOpenCloneBooking && b.status !== 'checked_out' && (
              <button
                type="button"
                onClick={() => onOpenCloneBooking(b)}
                className="flex items-center gap-1 px-3 py-2 bg-gradient-to-r from-indigo-50 to-teal-50 hover:from-indigo-100 hover:to-teal-100 active:scale-95 text-indigo-800 text-xs font-semibold rounded-xl border border-indigo-200 transition-all cursor-pointer"
                title={`จองห้องเพิ่มให้คุณ ${b.guestName}`}
              >
                <Plus className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
                <span>+ จองเพิ่มอีกห้อง</span>
              </button>
            )}

            {/* Payment Button */}
            {onOpenAddPayment && remainingBalance > 0 && b.status !== 'checked_out' && (
              <button
                onClick={() => onOpenAddPayment(b)}
                className="flex items-center gap-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-medium rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>รับเงิน (฿{remainingBalance.toLocaleString()})</span>
              </button>
            )}

            {/* Receipt Button */}
            {onOpenReceipt && (
              <button
                onClick={() => onOpenReceipt(b)}
                className="flex items-center gap-1 px-2.5 py-2 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs font-medium rounded-xl border border-slate-200 transition-all cursor-pointer"
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <DoorOpen className="w-3.5 h-3.5" />
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
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 active:scale-95 text-white text-xs font-semibold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                <DoorOpen className="w-3.5 h-3.5" />
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-slate-200 shadow-xs">
        {/* Toggle between Daily Operations View and All Bookings (Apple Liquid Glass) */}
        <LiquidSegmentedControl<'daily' | 'all'>
          options={[
            { value: 'daily', label: '📅 สมุดงานรายวัน (Daily View)', icon: <CalendarDays className="w-4 h-4" /> },
            { value: 'all', label: `📋 รายการทั้งหมด (${countTotal})`, icon: <FileSpreadsheet className="w-4 h-4" /> },
          ]}
          value={viewMode}
          onChange={(val) => setViewMode(val)}
          variant="emerald"
          size="md"
        />

        <button
          onClick={onOpenNewBooking}
          className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-medium text-xs sm:text-sm py-2 px-3.5 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ สร้างการจองใหม่</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* 1. DAILY OPERATIONS VIEW (สมุดงานประจำวัน)                               */}
      {/* ========================================================================= */}
      {viewMode === 'daily' && (
        <div className="space-y-4 animate-in fade-in">
          
          {/* Date Navigation Bar */}
          <div className="bg-white rounded-2xl border border-slate-200 p-2.5 sm:p-3 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Previous Day Button */}
              <button
                type="button"
                onClick={() => handleShiftDate(-1)}
                className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title="ย้อนดูวันก่อนหน้า"
              >
                <ChevronLeft className="w-4 h-4 shrink-0" />
                <span>{selectedDate === todayStr ? 'เมื่อวาน' : 'วันก่อน'}</span>
              </button>

              {/* Today Reset Button */}
              <button
                type="button"
                onClick={handleResetToToday}
                className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-semibold rounded-xl border transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                  selectedDate === todayStr 
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs' 
                    : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                }`}
                title="กลับมาดูสถานะวันปัจจุบัน"
              >
                <Clock className="w-3.5 h-3.5 shrink-0" />
                <span>📌 วันนี้</span>
              </button>

              {/* Next Day Button */}
              <button
                type="button"
                onClick={() => handleShiftDate(1)}
                className="flex items-center justify-center gap-1 px-2.5 sm:px-3 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 text-xs sm:text-sm font-semibold rounded-xl border border-slate-200 transition-all cursor-pointer shrink-0 whitespace-nowrap"
                title="ดูสถานะวันถัดไป"
              >
                <span>{selectedDate === todayStr ? 'พรุ่งนี้' : 'ถัดไป'}</span>
                <ChevronRight className="w-4 h-4 shrink-0" />
              </button>
            </div>

            {/* Date Display Pill with Integrated Native Picker - STRICTLY 1 SINGLE LINE */}
            <div className="relative flex items-center justify-between sm:justify-end gap-2 px-3 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 transition-all cursor-pointer shadow-2xs group">
              <div className="flex items-center gap-2 min-w-0">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="text-xs sm:text-sm font-bold text-slate-900 whitespace-nowrap">
                  {formatThaiFullDate(selectedDate)}
                </span>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0 whitespace-nowrap ${
                  selectedDate === todayStr 
                    ? 'text-emerald-700 bg-emerald-100' 
                    : 'text-amber-700 bg-amber-100'
                }`}>
                  {selectedDate === todayStr ? 'ตารางวันนี้' : 'ดูสถานะล่วงหน้า'}
                </span>
              </div>

              <ChevronRight className="w-3.5 h-3.5 text-slate-400 rotate-90 shrink-0 sm:hidden" />

              <input
                type="date"
                value={selectedDate}
                onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
                className="absolute inset-0 opacity-0 w-full h-full cursor-pointer"
                title="แตะเพื่อเลือกวันที่ในปฏิทิน"
              />
            </div>
          </div>

          {/* Kitchen & External Supplier Summary Bar */}
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-4 border border-slate-800 shadow-md space-y-3">
            
            {/* Header with date info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-amber-500/30">
                  <UtensilsCrossed className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-semibold flex items-center gap-2 text-white">
                    <span>ยอดอาหาร & สั่งร้านนอก</span>
                    <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                      รวม {activeOnDate.length} ห้อง
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-400 font-normal mt-0.5 truncate">
                    สรุปยอดหมูกระทะและอาหารเช้า &bull; {formatThaiDate(selectedDate)}
                  </p>
                </div>
              </div>
            </div>

            {/* PART 1: หมูกระทะ (สั่งร้านนอก) */}
            <div className="p-3 sm:p-3.5 rounded-2xl bg-slate-800/95 border border-orange-500/30 space-y-2.5 shadow-sm">
              {/* Header: 1 Single Clean Line */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/60 pb-2 text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 text-xs font-semibold shrink-0">
                    🛵 สั่งร้านนอก
                  </span>
                  <span className="text-xs sm:text-sm font-bold text-white whitespace-nowrap truncate">
                    {(settings?.mookataSupplierName || 'ร้านหมูกระทะ').replace(/\s*\(.*?\)/g, '') || 'ร้านหมูกระทะ'}
                  </span>
                  {settings?.mookataSupplierPhone && (
                    <a
                      href={`tel:${settings.mookataSupplierPhone.replace(/[^0-9+]/g, '')}`}
                      className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-semibold whitespace-nowrap shrink-0 ml-0.5"
                      title="โทรด่วนหาร้าน"
                    >
                      <Phone className="w-3 h-3 shrink-0" />
                      <span className="whitespace-nowrap">{settings.mookataSupplierPhone}</span>
                    </a>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                  <span className="text-xs text-slate-300 font-medium">
                    สั่งหมูกระทะ <strong className="text-orange-400 font-bold">{housesWithMookata.length}</strong> หลัง
                  </span>
                </div>
              </div>

              {/* LIST OF HOUSES (แยกตามรายบ้าน) */}
              {housesWithMookata.length === 0 ? (
                <div className="p-3 text-center bg-slate-900/60 rounded-xl border border-slate-800 text-xs text-slate-400 font-normal">
                  ไม่มีบ้านไหนสั่งหมูกระทะในวันที่ {formatThaiDate(selectedDate)}
                </div>
              ) : (
                <div className="space-y-2.5">
                  {housesWithMookata.map((b) => {
                    const large = b.addOns?.filter(a => a.category === 'mookata_large').reduce((s, a) => s + a.quantity, 0) || 0;
                    const small = b.addOns?.filter(a => a.category === 'mookata_small').reduce((s, a) => s + a.quantity, 0) || 0;
                    const isOrdered = b.addOns?.some(a => (a.category === 'mookata_large' || a.category === 'mookata_small') && a.isOrdered) || !!localOrderedMap[b.id];
                    const isCopied = copiedHouseId === b.id;

                    return (
                      <div
                        key={b.id}
                        className={`p-3 sm:p-3.5 rounded-xl border transition-all space-y-2.5 ${
                          isOrdered
                            ? 'bg-slate-900/60 border-emerald-500/40'
                            : 'bg-slate-900 border-amber-500/50 shadow-xs'
                        }`}
                      >
                        {/* House Info & Sets */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <HouseLogo roomNumber={b.roomNumber} size="sm" />
                            <div>
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="text-sm font-bold text-white">บ้าน {b.roomNumber}</span>
                                <span className="text-xs text-slate-300 font-medium">({b.guestName})</span>
                                {isOrdered ? (
                                  <span className="px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[11px] font-semibold inline-flex items-center gap-1">
                                    <Check className="w-3 h-3 stroke-2" /> โทรสั่งร้านแล้ว
                                  </span>
                                ) : (
                                  <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-semibold inline-flex items-center gap-1">
                                    <Clock className="w-3 h-3" /> ยังไม่ได้โทรสั่งร้าน
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400 block mt-0.5">
                                โทรศัพท์ลูกค้า: <a href={`tel:${b.guestPhone}`} className="text-emerald-400 hover:underline">{b.guestPhone}</a>
                              </span>
                            </div>
                          </div>

                          {/* Sets Ordered by this house */}
                          <div className="flex items-center gap-1.5 flex-wrap self-start sm:self-auto">
                            {large > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-red-500/20 text-red-300 border border-red-500/30 text-xs font-semibold inline-flex items-center gap-1">
                                <MookataLargeIcon size={14} />
                                <span>ชุดใหญ่ {large} ชุด (฿{(large * 500).toLocaleString()})</span>
                              </span>
                            )}
                            {small > 0 && (
                              <span className="px-2.5 py-1 rounded-lg bg-orange-500/20 text-orange-300 border border-orange-500/30 text-xs font-semibold inline-flex items-center gap-1">
                                <MookataSmallIcon size={14} />
                                <span>ชุดเล็ก {small} ชุด (฿{(small * 350).toLocaleString()})</span>
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions for this house */}
                        <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-800 flex-wrap">
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* Copy Order Text specifically for this house */}
                            <button
                              type="button"
                              onClick={() => handleCopyHouseMookata(b)}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 active:scale-95 text-orange-300 font-semibold text-xs rounded-xl border border-orange-500/40 transition-all cursor-pointer"
                              title={`คัดลอกข้อความสั่งหมูกระทะเฉพาะของบ้าน ${b.roomNumber}`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400 stroke-2" />
                                  <span className="text-emerald-300 font-bold">คัดลอกส่งร้าน (บ้าน {b.roomNumber}) แล้ว!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5 text-orange-400" />
                                  <span>คัดลอกส่ง LINE (บ้าน {b.roomNumber})</span>
                                </>
                              )}
                            </button>

                            {/* Direct Phone Call to Supplier */}
                            {settings?.mookataSupplierPhone && (
                              <a
                                href={`tel:${settings.mookataSupplierPhone.replace(/[^0-9+]/g, '')}`}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 active:scale-95 text-white font-medium text-xs rounded-xl border border-slate-700 transition-all"
                                title="กดโทรสั่งร้านหมูกระทะ"
                              >
                                <Phone className="w-3.5 h-3.5 text-emerald-400" />
                                <span>โทรสั่งร้าน</span>
                              </a>
                            )}
                          </div>

                          {/* Checkbox / Toggle Ordered Status */}
                          <button
                            type="button"
                            onClick={() => handleToggleMookataOrdered(b)}
                            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-xs active:scale-95 ${
                              isOrdered
                                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                : 'bg-amber-600 hover:bg-amber-700 text-white'
                            }`}
                          >
                            {isOrdered ? (
                              <>
                                <Check className="w-3.5 h-3.5 stroke-2" />
                                <span>โทรสั่งร้านแล้ว (แตะเพื่อเปลี่ยน)</span>
                              </>
                            ) : (
                              <>
                                <span>✓ ติ๊กเมื่อโทรสั่งร้านแล้ว</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Compact Daily Total Summary Bar */}
              <div className="bg-slate-900/80 border border-slate-700/80 p-2.5 sm:px-3.5 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-3 text-slate-300 font-medium flex-wrap">
                  <span className="text-slate-400">สรุปยอดรวมทั้งวัน:</span>
                  <span className="text-red-400">ชุดใหญ่: <strong>{kitchenSummary.mookataLarge}</strong> ชุด</span>
                  <span className="text-orange-400">ชุดเล็ก: <strong>{kitchenSummary.mookataSmall}</strong> ชุด</span>
                  <span className="text-white">รวมทั้งหมด: <strong>{kitchenSummary.mookataLarge + kitchenSummary.mookataSmall}</strong> ชุด</span>
                </div>

                {kitchenSummary.mookataLarge + kitchenSummary.mookataSmall > 0 && (
                  <button
                    type="button"
                    onClick={() => {
                      const totalMookata = kitchenSummary.mookataLarge + kitchenSummary.mookataSmall;
                      const text = `สั่งหมูกระทะสำหรับ สวอนฮิลล์ รีสอร์ท (Swan HILL)\n📅 ประจำวันที่: ${formatThaiDate(selectedDate)}\n- หมูกระทะชุดใหญ่: ${kitchenSummary.mookataLarge} ชุด\n- หมูกระทะชุดเล็ก: ${kitchenSummary.mookataSmall} ชุด\nรวมทั้งหมด: ${totalMookata} ชุด\n📍 ส่งที่: สวอนฮิลล์ รีสอร์ท`;
                      navigator.clipboard.writeText(text);
                      setCopyMookataSuccess(true);
                      setTimeout(() => setCopyMookataSuccess(false), 2500);
                    }}
                    className="text-[11px] text-slate-400 hover:text-white underline text-left sm:text-right cursor-pointer"
                    title="คัดลอกข้อความสรุปยอดรวมทุกบ้านในครั้งเดียว (กรณีสั่งพร้อมกัน)"
                  >
                    {copyMookataSuccess ? '✓ คัดลอกยอดรวมแล้ว' : 'คัดลอกยอดรวมทุกบ้าน (กรณีสั่งพร้อมกัน)'}
                  </button>
                )}
              </div>
            </div>

            {/* PART 2: อาหารเช้า & ที่นอนเสริม */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Breakfast */}
              <div className="bg-slate-800/60 border border-teal-500/30 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-400 flex items-center justify-center shrink-0">
                    <BreakfastIcon size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">อาหารเช้า</span>
                    <span className="text-[11px] text-slate-400 font-normal">ครัวจัดเตรียม</span>
                  </div>
                </div>
                <span className="text-base font-bold text-teal-400">
                  {kitchenSummary.breakfast} <span className="text-xs text-slate-400 font-normal">ท่าน</span>
                </span>
              </div>

              {/* Extra Beds */}
              <div className="bg-slate-800/60 border border-amber-500/30 p-2.5 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ExtraBedIcon size={18} />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-200 block">ที่นอนเสริม</span>
                    <span className="text-[11px] text-slate-400 font-normal">ปูเตียงเพิ่ม</span>
                  </div>
                </div>
                <span className="text-base font-bold text-amber-400">
                  {kitchenSummary.extraBeds} <span className="text-xs text-slate-400 font-normal">หลัง</span>
                </span>
              </div>
            </div>

          </div>

          {/* Categorized Daily Rooms List */}
          <div className="space-y-4">
            
            {/* Category 1: เช็คอินเข้าพักวันนี้ (Arrivals) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                  เช็คอินเข้าพักวันนี้ (Arrivals)
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                  {arrivalsToday.length} ห้อง
                </span>
              </div>

              {arrivalsToday.length === 0 ? (
                <div className="p-3 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 font-normal">
                  ไม่มีลูกค้าเช็คอินเข้าพักใหม่ในวันนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {arrivalsToday.map(b => renderDailyRoomCard(b, 'arrival'))}
                </div>
              )}
            </div>

            {/* Category 2: พักอยู่ต่อเนื่อง (Stayover) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                  พักอยู่ต่อเนื่อง (Stayover)
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                  {stayoverToday.length} ห้อง
                </span>
              </div>

              {stayoverToday.length === 0 ? (
                <div className="p-3 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 font-normal">
                  ไม่มีห้องที่พักต่อเนื่องในวันนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
                  {stayoverToday.map(b => renderDailyRoomCard(b, 'stayover'))}
                </div>
              )}
            </div>

            {/* Category 3: เช็คเอาท์ออกวันนี้ (Departures) */}
            <div className="space-y-2.5">
              <div className="flex items-center gap-2 px-1">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400" />
                <h3 className="text-xs sm:text-sm font-semibold text-slate-900">
                  เช็คเอาท์ออกวันนี้ (Departures)
                </h3>
                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
                  {departuresToday.length} ห้อง
                </span>
              </div>

              {departuresToday.length === 0 ? (
                <div className="p-3 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-400 font-normal">
                  ไม่มีลูกค้าเช็คเอาท์คืนห้องในวันนี้
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-2.5">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            <div 
              onClick={() => setStatusFilter('all')}
              className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                statusFilter === 'all' 
                  ? 'bg-slate-900 text-white border-slate-900' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium opacity-80">ทั้งหมด</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${statusFilter === 'all' ? 'bg-white/10 text-emerald-400' : 'bg-slate-100 text-slate-600'}`}>
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold">{countTotal}</span>
            </div>

            <div 
              onClick={() => setStatusFilter('checked_in')}
              className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                statusFilter === 'checked_in' 
                  ? 'bg-blue-600 text-white border-blue-600' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-blue-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium opacity-80">กำลังพัก</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${statusFilter === 'checked_in' ? 'bg-white/20 text-white' : 'bg-blue-50 text-blue-600'}`}>
                  <Users className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold">{countCheckedIn}</span>
            </div>

            <div 
              onClick={() => setStatusFilter('confirmed')}
              className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs ${
                statusFilter === 'confirmed' 
                  ? 'bg-emerald-600 text-white border-emerald-600' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium opacity-80">รอเช็คอิน</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${statusFilter === 'confirmed' ? 'bg-white/20 text-white' : 'bg-emerald-50 text-emerald-600'}`}>
                  <Clock className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold">{countConfirmed}</span>
            </div>

            <div className="p-3 rounded-xl border border-slate-200/90 bg-white text-slate-900 shadow-2xs">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium text-slate-500">ชำระครบ</span>
                <div className="w-6 h-6 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold text-slate-900">{countFullyPaid}</span>
            </div>

            <div 
              onClick={() => setStatusFilter('trash')}
              className={`p-3 rounded-xl border transition-all cursor-pointer shadow-2xs col-span-2 sm:col-span-1 ${
                statusFilter === 'trash' 
                  ? 'bg-red-600 text-white border-red-600' 
                  : 'bg-white text-slate-900 border-slate-200/90 hover:border-red-300'
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-medium opacity-80">ถังขยะ</span>
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${statusFilter === 'trash' ? 'bg-white/20 text-white' : 'bg-red-50 text-red-600'}`}>
                  <Trash2 className="w-3.5 h-3.5" />
                </div>
              </div>
              <span className="text-lg sm:text-xl font-bold">{countTrash}</span>
            </div>
          </div>

          {/* Filter Sub-Tabs (Apple Liquid Glass Sliding Capsule) */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <LiquidSegmentedControl
              options={[
                { value: 'all', label: `ทั้งหมด (${countTotal})` },
                { value: 'confirmed', label: 'รอลูกค้ามา' },
                { value: 'checked_in', label: 'กำลังพักอยู่' },
                { value: 'checked_out', label: 'เช็คเอาท์แล้ว' },
                { value: 'trash', label: `ถังขยะ (${countTrash})` },
              ]}
              value={statusFilter}
              onChange={(val) => setStatusFilter(val)}
              variant="light"
              size="sm"
            />
          </div>

          {/* Full Bookings Cards List */}
          <div className="space-y-3">
            {displayedAllBookings.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-dashed border-slate-200">
                <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-600 font-medium text-xs sm:text-sm">ไม่พบรายการจองในหมวดนี้</p>
                <p className="text-slate-400 text-[11px] mt-0.5">ลองค้นหาด้วยคำอื่น หรือกดสร้างรายการจองใหม่</p>
              </div>
            ) : (
              displayedAllBookings.map((b) => {
                const remainingBalance = Math.max(0, b.totalAmount - b.paidAmount);

                return (
                  <div
                    key={b.id}
                    className={`bg-white rounded-xl border p-3 md:p-3.5 transition-all shadow-xs hover:shadow-sm ${
                      b.status === 'cancelled' || !!b.deletedAt 
                        ? 'border-red-200 bg-red-50/20' 
                        : 'border-slate-200/90 hover:border-emerald-300'
                    }`}
                  >
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-3 items-center">
                      
                      {/* Customer Profile */}
                      <div className="xl:col-span-3 flex items-center gap-2.5">
                        {b.status === 'checked_in' && (
                          <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex flex-col items-center justify-center p-1 shadow-2xs shrink-0 border border-blue-500">
                            <Users className="w-3.5 h-3.5 mb-0.5 text-blue-100" />
                            <span className="text-[9px] font-normal leading-none">กำลังพัก</span>
                          </div>
                        )}
                        {b.status === 'confirmed' && (
                          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex flex-col items-center justify-center p-1 shadow-2xs shrink-0 border border-emerald-500">
                            <Clock className="w-3.5 h-3.5 mb-0.5 text-emerald-100" />
                            <span className="text-[9px] font-normal leading-none">รอเช็คอิน</span>
                          </div>
                        )}
                        {b.status === 'checked_out' && (
                          <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-200 flex flex-col items-center justify-center p-1 shadow-2xs shrink-0 border border-slate-700">
                            <CheckCircle2 className="w-3.5 h-3.5 mb-0.5 text-slate-400" />
                            <span className="text-[9px] font-normal leading-none">เช็คเอาท์</span>
                          </div>
                        )}
                        {(b.status === 'cancelled' || !!b.deletedAt) && (
                          <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex flex-col items-center justify-center p-1 shadow-2xs shrink-0 border border-red-500">
                            <Trash2 className="w-3.5 h-3.5 mb-0.5 text-red-100" />
                            <span className="text-[9px] font-normal leading-none">ยกเลิก</span>
                          </div>
                        )}

                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-slate-700 font-medium text-[10px]">
                              {b.bookingCode}
                            </span>
                            <span className="text-[9px] text-slate-400 font-normal truncate">
                              {formatThaiDate(b.createdAt)}
                            </span>
                          </div>
                          <h3 className="text-xs sm:text-sm font-semibold text-slate-900 truncate mt-0.5">
                            {b.guestName}
                          </h3>
                          <div className="flex items-center gap-1 text-xs text-slate-600 mt-0.5">
                            <a 
                              href={`tel:${b.guestPhone.replace(/[^0-9+]/g, '')}`} 
                              className="flex items-center gap-1 font-medium text-emerald-700 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-md border border-emerald-200 text-[11px] transition-colors"
                            >
                              <Phone className="w-2.5 h-2.5 text-emerald-600" />
                              <span>{b.guestPhone}</span>
                            </a>
                            {b.groupId && (
                              <span className="inline-flex items-center gap-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Users className="w-2.5 h-2.5 text-indigo-600" />
                                {b.groupRoomNumbers?.join('+') || 'กรุ๊ป'}
                              </span>
                            )}
                          </div>
                          {statusFilter === 'trash' && (
                            <p className="text-[10px] text-red-600 font-medium mt-1">
                              ลบถาวรในอีก {getDaysRemainingInTrash(b.deletedAt)} วัน
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Room & Dates */}
                      <div className="xl:col-span-4 flex items-center gap-2.5 bg-slate-50/90 p-2.5 rounded-xl border border-slate-200/90 shadow-2xs">
                        <HouseLogo roomNumber={b.roomNumber} size="sm" />
                        <div className="flex-1 min-w-0 space-y-1">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-xs font-semibold text-slate-900 truncate">
                              บ้าน {b.roomNumber} &bull; {b.roomType}
                            </span>
                            {getStatusBadge(b.status)}
                          </div>

                          <div className="flex items-center gap-1.5 text-[11px] text-slate-600 font-normal flex-wrap">
                            <span className="font-medium text-slate-800 truncate">
                              {formatThaiDate(b.checkInDate)} {b.checkInTime ? `(${b.checkInTime} น.)` : ''}
                            </span>
                            <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                              {b.totalNights} คืน
                            </span>
                            <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                            <span className="font-medium text-slate-800 truncate">{formatThaiDate(b.checkOutDate)}</span>
                          </div>

                          {b.addOns && b.addOns.length > 0 && (
                            <div className="flex items-center gap-1 pt-0.5 overflow-x-auto no-scrollbar flex-nowrap whitespace-nowrap">
                              <span className="text-[10px] text-slate-400 font-normal shrink-0">สั่งเพิ่ม:</span>
                              {b.addOns.map((ad) => (
                                <span key={ad.id} className="text-[9px] font-normal bg-white text-slate-800 px-1.5 py-0.2 rounded border border-slate-200 shadow-2xs shrink-0">
                                  {ad.name} <strong className="text-emerald-700 font-medium">(฿{(ad.price * ad.quantity).toLocaleString()})</strong>
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Total & Remaining */}
                      <div className="xl:col-span-2 text-left xl:text-right border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100">
                        <span className="text-[9px] text-slate-400 font-normal block uppercase">ยอดรวมสุทธิ</span>
                        <span className="text-sm sm:text-base font-bold text-slate-900 block leading-tight">
                          ฿{b.totalAmount.toLocaleString()}
                        </span>
                        {remainingBalance > 0 ? (
                          <span className="text-[10px] font-medium text-red-600 block">
                            ค้างชำระ: ฿{remainingBalance.toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-emerald-600 block">
                            ✓ ชำระครบแล้ว
                          </span>
                        )}
                      </div>

                      {/* Standardized Actions */}
                      <div className="xl:col-span-3 flex items-center justify-start xl:justify-end gap-1.5 flex-wrap border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100">
                        {statusFilter !== 'trash' ? (
                          <>
                            {onOpenCloneBooking && b.status !== 'checked_out' && (
                              <button
                                type="button"
                                onClick={() => onOpenCloneBooking(b)}
                                className="px-2.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-all active:scale-95 bg-indigo-50 text-indigo-800 border border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                                title={`จองห้องเพิ่มให้คุณ ${b.guestName}`}
                              >
                                <Plus className="w-3.5 h-3.5 text-indigo-600 stroke-[3]" />
                                <span>จองเพิ่ม</span>
                              </button>
                            )}

                            {onOpenAddOrder && (
                              <button
                                onClick={() => onOpenAddOrder(b)}
                                disabled={b.status === 'checked_out'}
                                className="px-2.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 cursor-pointer disabled:opacity-40"
                              >
                                <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                                <span>สั่งอาหาร</span>
                              </button>
                            )}

                            {onOpenAddPayment && remainingBalance > 0 && b.status !== 'checked_out' && (
                              <button
                                onClick={() => onOpenAddPayment(b)}
                                className="px-2.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1.5 transition-all active:scale-95 bg-emerald-600 text-white hover:bg-emerald-700 shadow-xs cursor-pointer"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                <span>รับเงิน</span>
                              </button>
                            )}

                            {onOpenReceipt && (
                              <button
                                onClick={() => onOpenReceipt(b)}
                                className="px-2 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-all active:scale-95 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 cursor-pointer"
                                title="ดูใบเสร็จรับเงิน"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>
                            )}

                            {b.status === 'confirmed' && (
                              <button
                                onClick={() => onCheckInGuest(b.id)}
                                className="px-2.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-all active:scale-95 bg-blue-600 text-white hover:bg-blue-700 shadow-xs cursor-pointer"
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
                                className="px-2.5 py-1.5 rounded-lg font-medium text-xs flex items-center gap-1 transition-all active:scale-95 bg-slate-900 text-white hover:bg-slate-800 shadow-xs cursor-pointer"
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
