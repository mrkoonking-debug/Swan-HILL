import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Sun, Moon, BarChart3, CheckCircle2 } from 'lucide-react';
import type { Booking, TimeRangeFilter } from '../types/pms';
import { formatLocalDate, formatThaiDate } from '../utils/dateUtils';

interface FinanceViewProps {
  bookings: Booking[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ bookings }) => {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('monthly');

  const now = new Date();
  const todayStr = formatLocalDate(now);
  const currentMonthPrefix = todayStr.slice(0, 7); // "YYYY-MM"
  const currentYearPrefix = todayStr.slice(0, 4);  // "YYYY"
  const thaiYear = now.getFullYear() + 543;

  const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled');

  // Filter bookings based on time range
  const filteredBookings = activeBookings.filter(b => {
    if (timeRange === 'daily') {
      // Check if checkIn is today or has transaction today
      const hasTodayTx = b.transactions?.some(t => t.paidAt && t.paidAt.slice(0, 10) === todayStr);
      return b.checkInDate === todayStr || hasTodayTx;
    }
    if (timeRange === 'monthly') {
      const hasMonthTx = b.transactions?.some(t => t.paidAt && t.paidAt.slice(0, 7) === currentMonthPrefix);
      return b.checkInDate.startsWith(currentMonthPrefix) || hasMonthTx;
    }
    // yearly
    return b.checkInDate.startsWith(currentYearPrefix);
  });

  // Calculate revenue for the selected range
  const totalReceived = filteredBookings.reduce((sum, b) => {
    if (timeRange === 'daily') {
      // If transactions exist, sum today's transactions; otherwise if checkIn is today, use paidAmount
      const todayTxSum = b.transactions
        ?.filter(t => t.paidAt && t.paidAt.slice(0, 10) === todayStr)
        .reduce((s, t) => s + t.amount, 0);
      if (todayTxSum && todayTxSum > 0) return sum + todayTxSum;
      return sum + (b.checkInDate === todayStr ? b.paidAmount : 0);
    }
    if (timeRange === 'monthly') {
      const monthTxSum = b.transactions
        ?.filter(t => t.paidAt && t.paidAt.slice(0, 7) === currentMonthPrefix)
        .reduce((s, t) => s + t.amount, 0);
      if (monthTxSum && monthTxSum > 0) return sum + monthTxSum;
      return sum + (b.checkInDate.startsWith(currentMonthPrefix) ? b.paidAmount : 0);
    }
    return sum + b.paidAmount;
  }, 0);

  const totalBookingsCount = filteredBookings.length;

  // Paid bookings list for transaction history (sorted by latest)
  const paidBookings = activeBookings.filter(b => b.paidAmount > 0);

  return (
    <div className="space-y-4 pb-28 md:pb-8 font-['Prompt']">
      {/* Time Range Filter Bar */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-bold text-slate-900 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span>สรุปยอดรายรับของรีสอร์ท Swan HILL</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5 font-normal">เลือกดูยอดเงินแบบ รายวัน / รายเดือน / รายปี</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setTimeRange('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              timeRange === 'daily'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>รายวัน (วันนี้)</span>
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              timeRange === 'monthly'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>รายเดือน (เดือนนี้)</span>
          </button>
          <button
            onClick={() => setTimeRange('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${
              timeRange === 'yearly'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'text-slate-600 hover:text-slate-900 font-medium'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>รายปี ({thaiYear})</span>
          </button>
        </div>
      </div>

      {/* 2 Big Number Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-emerald-50/90 border border-emerald-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-medium text-emerald-800">
            {timeRange === 'daily' ? 'ยอดเงินที่ได้รับวันนี้' : (timeRange === 'monthly' ? 'ยอดเงินที่ได้รับเดือนนี้' : `ยอดเงินสะสมทั้งปี ${thaiYear}`)}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-emerald-950 mt-1">
            ฿{totalReceived.toLocaleString()}
          </h3>
          <p className="text-xs text-emerald-700 font-normal mt-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" /> ยอดเงินเข้าบัญชีตามการชำระจริง
          </p>
        </div>

        <div className="bg-white border border-slate-200 p-4 sm:p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-medium text-slate-500">
            {timeRange === 'daily' ? 'จำนวนห้องที่จองวันนี้' : (timeRange === 'monthly' ? 'จำนวนห้องที่จองเดือนนี้' : `จำนวนห้องที่จองทั้งปี ${thaiYear}`)}
          </p>
          <h3 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">
            {totalBookingsCount} <span className="text-base text-slate-400 font-normal">ห้อง</span>
          </h3>
          <p className="text-xs text-slate-500 font-normal mt-2">
            บันทึกการจองในระบบ Swan HILL
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <h3 className="text-xs sm:text-sm font-semibold text-slate-900 mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-emerald-600" />
          <span>ประวัติรายการรับเงิน ({paidBookings.length} รายการ)</span>
        </h3>

        {paidBookings.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 font-normal">
            ยังไม่มีรายการรับเงินในระบบ
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {paidBookings.map((b) => (
              <div key={b.id} className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-slate-900">{b.guestName}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    บ้าน <b className="text-slate-800 font-semibold">{b.roomNumber}</b> &bull; เข้าพัก {formatThaiDate(b.checkInDate)} - {formatThaiDate(b.checkOutDate)}
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-xs sm:text-sm font-bold text-emerald-700">
                    +฿{b.paidAmount.toLocaleString()}
                  </span>
                  <span className="text-[10px] font-medium text-emerald-600 flex items-center justify-end gap-1 mt-0.5">
                    <CheckCircle2 className="w-3 h-3 text-emerald-500" /> 
                    {b.paymentStatus === 'paid' ? 'ชำระครบแล้ว' : 'มัดจำแล้ว'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
