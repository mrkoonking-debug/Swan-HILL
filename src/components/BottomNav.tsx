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
  const leftTabs = [
    { id: 'dashboard' as ActiveTab, label: 'หน้าหลัก', icon: Home },
    { id: 'timeline' as ActiveTab, label: 'ปฏิทิน', icon: CalendarDays },
  ];

  const rightTabs = [
    { id: 'bookings' as ActiveTab, label: 'รายการจอง', icon: ListOrdered },
    { id: 'finance' as ActiveTab, label: 'ยอดเงิน', icon: DollarSign },
  ];

  return (
    <div className="md:hidden fixed bottom-4 inset-x-0 z-40 px-3 pointer-events-none flex justify-center">
      {/* Luxury White Frosted Liquid Glass Capsule */}
      <nav 
        className="pointer-events-auto w-full max-w-[360px] bg-white/85 backdrop-blur-2xl border border-white/70 shadow-[0_12px_40px_rgba(0,0,0,0.12),0_2px_12px_rgba(0,0,0,0.06)] ring-1 ring-slate-900/5 rounded-full px-2.5 py-1.5 flex items-center justify-between transition-all"
        aria-label="Mobile Bottom Navigation"
      >
        {/* Left 2 Tabs */}
        <div className="flex items-center justify-around flex-1 gap-1">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white rounded-2xl px-3 py-1.5 shadow-md shadow-slate-900/20 scale-102'
                    : 'text-slate-500 hover:text-slate-800 px-2 py-1'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>

        {/* Center Glowing Floating Plus Button (Inspired by Reference) */}
        <div className="relative -top-4 px-1.5 shrink-0">
          <button
            onClick={onOpenNewBooking}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_8px_24px_rgba(14,165,233,0.45)] border-4 border-white active:scale-90 transition-transform"
            title="เพิ่มการจองใหม่"
            aria-label="สร้างการจองใหม่"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Right 2 Tabs */}
        <div className="flex items-center justify-around flex-1 gap-1">
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center transition-all duration-200 ${
                  isActive
                    ? 'bg-slate-900 text-white rounded-2xl px-3 py-1.5 shadow-md shadow-slate-900/20 scale-102'
                    : 'text-slate-500 hover:text-slate-800 px-2 py-1'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className={`text-[10px] font-bold mt-0.5 tracking-tight ${isActive ? 'text-white' : 'text-slate-500'}`}>
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
