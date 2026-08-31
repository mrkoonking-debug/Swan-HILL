import React from 'react';
import { Home, CalendarDays, ListOrdered, DollarSign, Plus } from 'lucide-react';
import type { ActiveTab } from './Sidebar';

interface BottomNavProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  setActiveTab,
  onOpenNewBooking,
}) => {
  const tabs = [
    { id: 'dashboard', label: 'หน้าหลัก', icon: Home },
    { id: 'timeline', label: 'ปฏิทิน', icon: CalendarDays },
    { id: 'bookings', label: 'รายการจอง', icon: ListOrdered },
    { id: 'finance', label: 'ยอดเงิน', icon: DollarSign },
  ];

  return (
    <div className="md:hidden fixed bottom-3 inset-x-0 z-40 px-4 pointer-events-none flex justify-center">
      {/* Apple Dark Glass Floating Capsule with Glowing Center Plus Button */}
      <div className="pointer-events-auto w-full max-w-md bg-slate-900/95 backdrop-blur-2xl border border-slate-800 shadow-2xl rounded-3xl px-3 py-1.5 flex items-center justify-between text-white">
        {/* Left 2 Tabs */}
        <div className="flex items-center gap-1 flex-1 justify-around">
          {tabs.slice(0, 2).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
                  isActive ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>}
              </button>
            );
          })}
        </div>

        {/* Elevated Center Glowing + Button */}
        <div className="relative -top-5 px-1">
          <button
            onClick={onOpenNewBooking}
            className="w-13 h-13 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 border-4 border-slate-900 active:scale-95 transition-transform"
            title="เพิ่มการจองใหม่"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Right 2 Tabs */}
        <div className="flex items-center gap-1 flex-1 justify-around">
          {tabs.slice(2, 4).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as ActiveTab)}
                className={`flex flex-col items-center justify-center py-1 px-2 rounded-2xl transition-all ${
                  isActive ? 'text-emerald-400 font-black' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-emerald-400 mt-0.5"></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
