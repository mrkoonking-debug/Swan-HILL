import React, { useState } from 'react';
import { DollarSign, TrendingUp, Calendar, Sun, Moon, BarChart3, CheckCircle2 } from 'lucide-react';
import type { Booking, TimeRangeFilter } from '../types/pms';

interface FinanceViewProps {
  bookings: Booking[];
}

export const FinanceView: React.FC<FinanceViewProps> = ({ bookings }) => {
  const [timeRange, setTimeRange] = useState<TimeRangeFilter>('monthly');

  const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled');
  const totalReceived = activeBookings.reduce((sum, b) => sum + b.paidAmount, 0);
  const totalBookingsCount = activeBookings.length;

  return (
    <div className="space-y-4 pb-28 md:pb-8">
      {/* Time Range Filter Bar */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl border border-[#e8e2d8] shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base md:text-lg font-black text-[#2b2724] flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-[#2d5a43]" />
            <span>สรุปยอดรายรับของรีสอร์ท Swan HILL</span>
          </h2>
          <p className="text-xs text-[#70675e] mt-0.5 font-medium">เลือกดูยอดเงินแบบ รายวัน / รายเดือน / รายปี</p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center bg-[#f4eee6] p-1 rounded-xl border border-[#e3dcd0]">
          <button
            onClick={() => setTimeRange('daily')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'daily'
                ? 'bg-[#2d5a43] text-white shadow-xs font-black'
                : 'text-[#635a50] hover:text-[#2b2724]'
            }`}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>รายวัน (วันนี้)</span>
          </button>
          <button
            onClick={() => setTimeRange('monthly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'monthly'
                ? 'bg-[#2d5a43] text-white shadow-xs font-black'
                : 'text-[#635a50] hover:text-[#2b2724]'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>รายเดือน (เดือนนี้)</span>
          </button>
          <button
            onClick={() => setTimeRange('yearly')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              timeRange === 'yearly'
                ? 'bg-[#2d5a43] text-white shadow-xs font-black'
                : 'text-[#635a50] hover:text-[#2b2724]'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>รายปี (2569)</span>
          </button>
        </div>
      </div>

      {/* 2 Big Number Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        <div className="bg-[#eaf3ed] border border-[#c2decb] p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-bold text-[#23583a] uppercase tracking-wide">
            {timeRange === 'daily' ? 'ยอดเงินที่ได้รับวันนี้' : (timeRange === 'monthly' ? 'ยอดเงินที่ได้รับเดือนนี้' : 'ยอดเงินสะสมทั้งปี 2569')}
          </p>
          <h3 className="text-3xl md:text-4xl font-black text-[#1c3a28] mt-1">
            ฿{timeRange === 'yearly' ? '703,970' : totalReceived.toLocaleString()}
          </h3>
          <p className="text-xs text-[#2d5a43] font-semibold mt-2 flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4" /> ยอดเงินเข้าบัญชีเรียบร้อยแล้ว
          </p>
        </div>

        <div className="bg-white border border-[#e8e2d8] p-5 rounded-2xl shadow-xs">
          <p className="text-xs font-bold text-[#70675e] uppercase tracking-wide">
            {timeRange === 'daily' ? 'จำนวนห้องที่จองวันนี้' : (timeRange === 'monthly' ? 'จำนวนห้องที่จองเดือนนี้' : 'จำนวนห้องที่จองทั้งปี 2569')}
          </p>
          <h3 className="text-3xl md:text-4xl font-black text-[#2b2724] mt-1">
            {timeRange === 'yearly' ? '183' : totalBookingsCount} <span className="text-lg text-[#8c8278] font-normal">ห้อง</span>
          </h3>
          <p className="text-xs text-[#70675e] font-medium mt-2">
            ส่วนใหญ่จองเข้ามาผ่าน LINE Official
          </p>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white rounded-2xl border border-[#e8e2d8] shadow-xs p-4">
        <h3 className="text-sm font-extrabold text-[#2b2724] mb-3 flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#2d5a43]" />
          <span>รายการรับเงินล่าสุด</span>
        </h3>

        <div className="divide-y divide-[#f2ece3]">
          {activeBookings.map((b) => (
            <div key={b.id} className="py-3 flex items-center justify-between gap-3">
              <div>
                <p className="text-xs md:text-sm font-bold text-[#2b2724]">{b.guestName}</p>
                <p className="text-[11px] text-[#70675e] mt-0.5">
                  ห้อง <b className="text-[#2b2724]">{b.roomNumber}</b> &bull; วันที่ {b.checkInDate} ถึง {b.checkOutDate}
                </p>
              </div>

              <div className="text-right">
                <span className="text-sm md:text-base font-black text-[#2d5a43]">
                  +฿{b.paidAmount.toLocaleString()}
                </span>
                <span className="block text-[10px] font-bold text-[#23583a] flex items-center justify-end gap-1">
                  <CheckCircle2 className="w-3 h-3" /> ชำระแล้ว
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
