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
  // 5-Column Navigation Index Mapping (matching kwe spring slide physics)
  const getActiveColumnIndex = (tab: ActiveTab): number => {
    switch (tab) {
      case 'dashboard': return 0;
      case 'timeline': return 1;
      case 'bookings': return 3;
      case 'finance': return 4;
      default: return 0;
    }
  };

  const activeColIndex = getActiveColumnIndex(activeTab);

  return (
    <div className="md:hidden fixed bottom-[max(0.75rem,env(safe-area-inset-bottom))] inset-x-0 z-40 px-3 pointer-events-none flex justify-center">
      {/* Dark Luxury Liquid Glass Floating Capsule */}
      <div className="pointer-events-auto w-full max-w-[365px] bg-slate-950/95 backdrop-blur-2xl border border-slate-800/80 shadow-[0_12px_45px_rgba(0,0,0,0.6),0_0_20px_rgba(14,165,233,0.12)] rounded-full p-1.5 relative select-none">
        
        {/* Subtle Liquid Glow Accent in Background */}
        <div className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500/10 via-transparent to-amber-500/10 pointer-events-none" />

        {/* --- Single Sliding Spring Active Indicator (from kwe physics) --- */}
        <div 
          className="absolute top-1.5 bottom-1.5 left-1.5 w-[calc((100%-12px)/5)] flex items-center justify-center pointer-events-none z-10 transition-transform duration-350 ease-[cubic-bezier(0.34,1.56,0.64,1)] will-change-transform"
          style={{ transform: `translateX(${activeColIndex * 100}%)` }}
        >
          <div className="w-[90%] h-[90%] rounded-2xl bg-slate-800/90 shadow-inner border border-slate-700/80 flex flex-col items-center justify-end pb-1">
            <span className="w-1 h-1 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee] animate-pulse" />
          </div>
        </div>

        {/* 5-Column Interactive Grid */}
        <div className="grid grid-cols-5 items-center relative z-20">
          
          {/* Col 0: หน้าหลัก (Dashboard) */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              activeTab === 'dashboard' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Home className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'dashboard' ? 'stroke-[2.5] text-white scale-110' : 'stroke-2 text-slate-400'}`} />
            <span className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-300 ${activeTab === 'dashboard' ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
              หน้าหลัก
            </span>
          </button>

          {/* Col 1: ปฏิทิน (Timeline) */}
          <button
            onClick={() => setActiveTab('timeline')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              activeTab === 'timeline' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <CalendarDays className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'timeline' ? 'stroke-[2.5] text-white scale-110' : 'stroke-2 text-slate-400'}`} />
            <span className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-300 ${activeTab === 'timeline' ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
              ปฏิทิน
            </span>
          </button>

          {/* Col 2: Center Floating Glowing Cyan FAB (+) */}
          <div className="flex items-center justify-center relative -top-3.5">
            <button
              onClick={onOpenNewBooking}
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-sky-500 to-cyan-400 text-white flex items-center justify-center shadow-[0_6px_22px_rgba(14,165,233,0.55)] border-4 border-slate-950 active:scale-90 transition-transform duration-200"
              title="เพิ่มการจองใหม่"
              aria-label="สร้างการจองใหม่"
            >
              <Plus className="w-6 h-6 stroke-[3]" />
            </button>
          </div>

          {/* Col 3: รายการจอง (Bookings) */}
          <button
            onClick={() => setActiveTab('bookings')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              activeTab === 'bookings' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <ListOrdered className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'bookings' ? 'stroke-[2.5] text-white scale-110' : 'stroke-2 text-slate-400'}`} />
            <span className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-300 ${activeTab === 'bookings' ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
              รายการจอง
            </span>
          </button>

          {/* Col 4: สรุปยอดเงิน (Finance) */}
          <button
            onClick={() => setActiveTab('finance')}
            className={`flex flex-col items-center justify-center py-2 px-1 rounded-2xl transition-all duration-200 active:scale-90 ${
              activeTab === 'finance' ? 'text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <DollarSign className={`w-4 h-4 transition-transform duration-300 ${activeTab === 'finance' ? 'stroke-[2.5] text-white scale-110' : 'stroke-2 text-slate-400'}`} />
            <span className={`text-[10px] mt-0.5 tracking-tight transition-colors duration-300 ${activeTab === 'finance' ? 'font-black text-white' : 'font-bold text-slate-400'}`}>
              ยอดเงิน
            </span>
          </button>

        </div>
      </div>
    </div>
  );
};
