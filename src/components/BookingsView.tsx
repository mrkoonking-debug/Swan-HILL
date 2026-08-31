import React, { useState } from 'react';
import { 
  Plus, 
  Check, 
  ArrowRight, 
  Phone, 
  Trash2,
  RotateCcw,
  AlertCircle,
  Clock,
  CheckCircle2,
  Users,
  FileSpreadsheet,
  UtensilsCrossed,
  Receipt,
  CreditCard,
  DoorOpen
} from 'lucide-react';
import type { Booking, BookingStatus } from '../types/pms';
import { HouseLogo } from './HouseLogo';
import { formatThaiDate } from '../utils/dateUtils';
import { ConfirmDialogModal } from './ConfirmDialogModal';

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
}

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
}) => {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState<Booking | null>(null);

  // Status mapping for visual badges
  const getStatusBadge = (status: BookingStatus) => {
    switch (status) {
      case 'confirmed':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">● รอลูกค้าเช็คอิน</span>;
      case 'checked_in':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">● กำลังพักอยู่</span>;
      case 'checked_out':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-300">✓ เช็คเอาท์ออกแล้ว</span>;
      case 'cancelled':
        return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-700 border border-red-300">✕ ยกเลิกการจอง</span>;
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

  // Filter Bookings by Tab & Search
  const displayedBookings = bookings.filter((b) => {
    const isDeleted = !!b.deletedAt || b.status === 'cancelled';
    
    // Status Tab Filtering
    if (statusFilter === 'trash') {
      if (!isDeleted) return false;
    } else {
      if (isDeleted) return false;
      if (statusFilter === 'confirmed' && b.status !== 'confirmed') return false;
      if (statusFilter === 'checked_in' && b.status !== 'checked_in') return false;
      if (statusFilter === 'checked_out' && b.status !== 'checked_out') return false;
    }

    // Search Query Filtering
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return (
      b.guestName.toLowerCase().includes(q) ||
      b.guestPhone.includes(q) ||
      b.bookingCode.toLowerCase().includes(q) ||
      b.roomNumber.toLowerCase().includes(q)
    );
  });

  // Calculate Metrics
  const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled');
  const countTotal = activeBookings.length;
  const countCheckedIn = activeBookings.filter(b => b.status === 'checked_in').length;
  const countConfirmed = activeBookings.filter(b => b.status === 'confirmed').length;
  const countFullyPaid = activeBookings.filter(b => b.paidAmount >= b.totalAmount).length;
  const countTrash = bookings.filter(b => !!b.deletedAt || b.status === 'cancelled').length;

  return (
    <div className="space-y-4 md:space-y-6 pb-24 md:pb-12 animate-in fade-in duration-500 font-['Prompt']">
      
      {/* 5 Status Cards at the Top */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
        {/* Total Bookings */}
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

        {/* Checked In */}
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

        {/* Confirmed (Waiting check-in) */}
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

        {/* Fully Paid */}
        <div 
          className="p-3.5 sm:p-4 rounded-2xl border border-slate-200/90 bg-white text-slate-900 shadow-xs"
        >
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600">ชำระครบ</span>
            <div className="w-7 h-7 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-3.5 h-3.5" />
            </div>
          </div>
          <span className="text-xl sm:text-2xl font-black text-slate-900">{countFullyPaid}</span>
        </div>

        {/* Trash */}
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

      {/* Filter Tabs & New Booking Button */}
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
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
                statusFilter === tab.id
                  ? 'bg-white text-slate-900 shadow-xs font-black'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <button
          onClick={onOpenNewBooking}
          className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs sm:text-sm py-2 px-4 rounded-xl shadow-md shadow-emerald-600/20 transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>สร้างรายการจองใหม่</span>
        </button>
      </div>

      {/* UNIFORM & EQUAL GRID BOOKING CARDS LIST */}
      <div className="space-y-3">
        {displayedBookings.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-3xl border border-dashed border-slate-200">
            <AlertCircle className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 font-bold text-sm">ไม่พบรายการจองในหมวดนี้</p>
            <p className="text-slate-400 text-xs mt-0.5">ลองค้นหาด้วยคำอื่น หรือกดสร้างรายการจองใหม่</p>
          </div>
        ) : (
          displayedBookings.map((b) => {
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
                {/* 4-COLUMN UNIFORM DESKTOP GRID / FLEX LAYOUT */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-3.5 items-center">
                  
                  {/* COLUMN 1: Customer Profile (xl:col-span-3) */}
                  <div className="xl:col-span-3 flex items-center gap-3">
                    {/* Status Square Badge */}
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

                  {/* COLUMN 2: Room Stay & Timeline Route (xl:col-span-4) */}
                  <div className="xl:col-span-4 flex items-center gap-3 bg-slate-50/90 p-2.5 rounded-2xl border border-slate-200/80">
                    <HouseLogo roomNumber={b.roomNumber} size="sm" />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center justify-between gap-1">
                        <span className="text-xs font-black text-slate-900 truncate">
                          ห้อง {b.roomNumber} &bull; {b.roomType}
                        </span>
                        {getStatusBadge(b.status)}
                      </div>

                      {/* Date route */}
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-700 font-medium">
                        <span className="font-bold text-slate-900 truncate">{formatThaiDate(b.checkInDate)}</span>
                        <span className="text-[9px] font-black text-emerald-800 bg-emerald-100 px-1.5 py-0.2 rounded-full border border-emerald-200 shrink-0">
                          {b.totalNights} คืน
                        </span>
                        <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                        <span className="font-bold text-slate-900 truncate">{formatThaiDate(b.checkOutDate)}</span>
                      </div>

                      {/* Add-ons Chips */}
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

                  {/* COLUMN 3: Price Breakdown (xl:col-span-2) */}
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

                  {/* COLUMN 4: UNIFIED STANDARDIZED ACTIONS (xl:col-span-3) */}
                  <div className="xl:col-span-3 flex items-center justify-start xl:justify-end gap-1.5 flex-wrap border-t xl:border-t-0 pt-2 xl:pt-0 border-slate-100">
                    {statusFilter !== 'trash' ? (
                      <>
                        {/* 1. สั่งอาหาร Button */}
                        {onOpenAddOrder && (
                          <button
                            onClick={() => onOpenAddOrder(b)}
                            disabled={b.status === 'checked_out'}
                            className={`px-2.5 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1 transition-all active:scale-95 ${
                              b.status === 'checked_out'
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-50'
                                : 'bg-amber-100 hover:bg-amber-200 text-amber-950 border border-amber-200'
                            }`}
                            title="สั่งอาหาร / หมูกระทะ / บริการเสริม"
                          >
                            <UtensilsCrossed className="w-3.5 h-3.5 text-amber-700" />
                            <span>สั่งอาหาร</span>
                          </button>
                        )}

                        {/* 2. การชำระเงิน Button */}
                        {onOpenAddPayment && (
                          <button
                            onClick={() => onOpenAddPayment(b)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                            title="จัดการการชำระเงิน / ยอดค้าง / ส่วนลด"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>การชำระเงิน</span>
                          </button>
                        )}

                        {/* 3. Main Status Action (เช็คอิน / เช็คเอาท์) */}
                        {b.status === 'confirmed' && (
                          <button
                            onClick={() => onCheckInGuest(b.id)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                            title="กดเพื่อเช็คอินลูกค้าเข้าห้องพัก"
                          >
                            <Check className="w-3.5 h-3.5 stroke-[3]" />
                            <span>เช็คอิน</span>
                          </button>
                        )}

                        {b.status === 'checked_in' && (
                          <button
                            onClick={() => {
                              if (onOpenCheckoutModal) onOpenCheckoutModal(b);
                              else onCheckOutGuest(b.id);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all flex items-center gap-1"
                            title="กดเพื่อเช็คเอาท์ห้องพัก"
                          >
                            <DoorOpen className="w-3.5 h-3.5" />
                            <span>เช็คเอาท์</span>
                          </button>
                        )}

                        {/* 4. ใบเสร็จ Button */}
                        {onOpenReceipt && (
                          <button
                            onClick={() => onOpenReceipt(b)}
                            className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1 transition-all active:scale-95 border border-slate-200"
                            title="พิมพ์ใบเสร็จรับเงิน"
                          >
                            <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                            <span>ใบเสร็จ</span>
                          </button>
                        )}

                        {/* 5. Move to Trash */}
                        <button
                          onClick={() => setDeleteConfirmBooking(b)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="ย้ายไปถังขยะ"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    ) : (
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => onRestoreBooking && onRestoreBooking(b.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1 shadow-xs transition-all active:scale-95"
                          title="กู้คืนรายการจองนี้"
                        >
                          <RotateCcw className="w-3.5 h-3.5" />
                          <span>กู้คืน</span>
                        </button>
                        <button
                          onClick={() => onPermanentDeleteBooking && onPermanentDeleteBooking(b.id)}
                          className="px-2.5 py-1.5 rounded-xl bg-red-100 hover:bg-red-200 text-red-700 font-bold text-xs flex items-center gap-1 transition-all active:scale-95"
                          title="ลบถาวรทันที"
                        >
                          <span>ลบทันที</span>
                        </button>
                      </div>
                    )}
                  </div>

                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Delete/Cancel Booking Confirmation Modal */}
      {deleteConfirmBooking && (
        <ConfirmDialogModal
          isOpen={!!deleteConfirmBooking}
          onClose={() => setDeleteConfirmBooking(null)}
          onConfirm={() => {
            onCancelBooking(deleteConfirmBooking.id);
            setDeleteConfirmBooking(null);
          }}
          title="ยืนยันการยกเลิก / ย้ายไปถังขยะ"
          roomBadge={`ห้อง ${deleteConfirmBooking.roomNumber}`}
          description={`คุณต้องการย้ายรายการจอง ${deleteConfirmBooking.bookingCode} (${deleteConfirmBooking.guestName}) ไปยังถังขยะใช่หรือไม่?`}
          confirmText="ยืนยันย้ายไปถังขยะ"
          type="danger"
        />
      )}

    </div>
  );
};
