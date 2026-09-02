import React from 'react';
import { Home, Users, DoorOpen, Coins } from 'lucide-react';
import { formatThaiDate } from '../../utils/dateUtils';

export interface DashboardKpiCardsProps {
  availableRooms: number;
  occupiedRooms: number;
  totalRooms: number;
  isViewingToday: boolean;
  selectedDate: string;
  arrivalsCount: number;
  departuresCount: number;
  totalMonthRevenue: number;
}

export const DashboardKpiCards: React.FC<DashboardKpiCardsProps> = ({
  availableRooms,
  occupiedRooms,
  totalRooms,
  isViewingToday,
  selectedDate,
  arrivalsCount,
  departuresCount,
  totalMonthRevenue,
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      {/* 1. Available Rooms */}
      <div className="relative overflow-hidden bg-gradient-to-br from-emerald-600 to-teal-800 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-emerald-100 font-medium text-xs">บ้านพักว่างพร้อมขาย</span>
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
            <Home className="w-3.5 h-3.5 text-emerald-100" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl md:text-2xl font-bold">{availableRooms}</span>
          <span className="text-xs text-emerald-200 font-normal">/ {totalRooms} หลัง</span>
        </div>
        <div className="mt-1 text-[10px] text-emerald-200/90 font-normal">
          {isViewingToday ? 'เปิดรับแขกได้ทันที' : `ว่างวันที่ ${formatThaiDate(selectedDate)}`}
        </div>
      </div>

      {/* 2. Occupied Rooms */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-blue-100 font-medium text-xs">มีคนพัก / จองแล้ว</span>
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
            <Users className="w-3.5 h-3.5 text-blue-100" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl md:text-2xl font-bold">{occupiedRooms}</span>
          <span className="text-xs text-blue-200 font-normal">/ {totalRooms} หลัง</span>
        </div>
        <div className="mt-1 text-[10px] text-blue-200/90 font-normal">
          อัตราเข้าพัก {totalRooms > 0 ? ((occupiedRooms / totalRooms) * 100).toFixed(0) : 0}%
        </div>
      </div>

      {/* 3. Check-in Today */}
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-500 to-orange-700 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-amber-100 font-medium text-xs">เช็คอินเข้าพักวันนี้</span>
          <div className="w-7 h-7 rounded-lg bg-white/15 flex items-center justify-center backdrop-blur-md">
            <DoorOpen className="w-3.5 h-3.5 text-amber-100" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-xl md:text-2xl font-bold">
            {arrivalsCount}
          </span>
          <span className="text-xs text-amber-200 font-normal">ห้อง</span>
        </div>
        <div className="mt-1 text-[10px] text-amber-200/90 font-normal">
          ออกวันนี้ {departuresCount} ห้อง
        </div>
      </div>

      {/* 4. Total Month Revenue */}
      <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-3.5 md:p-4 text-white shadow-xs">
        <div className="flex items-center justify-between">
          <span className="text-slate-300 font-medium text-xs">รายได้รวมเดือนนี้</span>
          <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center backdrop-blur-md">
            <Coins className="w-3.5 h-3.5 text-emerald-400" />
          </div>
        </div>
        <div className="mt-1.5 flex items-baseline gap-1">
          <span className="text-lg md:text-xl font-bold text-emerald-400">
            ฿{totalMonthRevenue.toLocaleString()}
          </span>
        </div>
        <div className="mt-1 text-[10px] text-slate-400 font-normal">
          รวมค่าห้องและหมูกระทะ
        </div>
      </div>
    </div>
  );
};
