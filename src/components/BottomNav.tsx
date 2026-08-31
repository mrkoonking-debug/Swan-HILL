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
  // Tabs configuration with numerical index for sliding pill calculation
  const allTabs: { id: ActiveTab; label: string; icon: React.FC<any>; slot: 'left' | 'right' }[] = [
    { id: 'dashboard', label: 'หน้าหลัก', icon: Home, slot: 'left' },
    { id: 'timeline', label: 'ปฏิทิน', icon: CalendarDays, slot: 'left' },
    { id: 'bookings', label: 'รายการจอง', icon: ListOrdered, slot: 'right' },
    { id: 'finance', label: 'ยอดเงิน', icon: DollarSign, slot: 'right' },
  ];

  const leftTabs = allTabs.filter(t => t.slot === 'left');
  const rightTabs = allTabs.filter(t => t.slot === 'right');

  return (
    <div className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-0 z-40 px-3 pointer-events-none flex justify-center">
      {/* Dark Luxury Liquid Glass Floating Capsule */}
      <div className="pointer-events-auto w-full max-w-[365px] bg-slate-950/95 backdrop-blur-2xl border border-slate-800/80 shadow-[0_12px_45px_rgba(0,0,0,0.6),0_0_20px_rgba(14,165,233,0.12)] rounded-full px-2 py-1.5 flex items-center justify-between relative select-none">
        
        {/* Subtle Liquid Glow Accent in Background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 via-transparent to-amber-500/10 pointer-events-none" />

        {/* Left 2 Tabs (Dashboard, Timeline) */}
        <div className="flex items-center justify-around flex-1 relative z-10">
          {leftTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/80 scale-105'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'stroke-[2.5] text-white scale-110' : 'stroke-2 text-slate-400'}`} />
                <span className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-300 ${isActive ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Center Glowing Cyan Action Button */}
        <div className="relative -top-4 px-2 shrink-0 z-20">
          <button
            onClick={onOpenNewBooking}
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_6px_22px_rgba(14,165,233,0.55)] border-4 border-slate-950 active:scale-90 transition-transform duration-200"
            title="เพิ่มการจองใหม่"
            aria-label="สร้างการจองใหม่"
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* Right 2 Tabs (Bookings, Finance) */}
        <div className="flex items-center justify-around flex-1 relative z-10">
          {rightTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-1.5 px-3 rounded-2xl transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${
                  isActive
                    ? 'bg-slate-800/90 text-white shadow-inner border border-slate-700/80 scale-105'
                    : 'text-slate-400 hover:text-slate-200 active:scale-95'
                }`}
              >
                <Icon className={`w-4 h-4 transition-transform duration-300 ${isActive ? 'stroke-[2.5] text-white scale-110' : 'stroke-2 text-slate-400'}`} />
                <span className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-300 ${isActive ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5 shadow-[0_0_6px_#22d3ee] animate-pulse" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
