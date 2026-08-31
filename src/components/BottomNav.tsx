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
  onOpenNewBooking 
}) => {
  return (
    <div className="md:hidden fixed bottom-4 left-4 right-4 z-50 pointer-events-none">
      <div className="bg-[#111827]/95 backdrop-blur-2xl border border-slate-700/60 rounded-full px-3 py-2 flex items-center justify-between shadow-[0_12px_32px_rgba(0,0,0,0.4)] pointer-events-auto">
        {/* Tab 1: หน้าหลัก */}
        <button
          onClick={() => setActiveTab('dashboard')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'dashboard' 
              ? 'text-emerald-400 font-black scale-105' 
              : 'text-slate-400 font-bold hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-emerald-500/15' : ''}`}>
            <Home className={`w-5 h-5 ${activeTab === 'dashboard' ? 'text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">หน้าหลัก</span>
        </button>

        {/* Tab 2: ปฏิทิน */}
        <button
          onClick={() => setActiveTab('timeline')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'timeline' 
              ? 'text-emerald-400 font-black scale-105' 
              : 'text-slate-400 font-bold hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'timeline' ? 'bg-emerald-500/15' : ''}`}>
            <CalendarDays className={`w-5 h-5 ${activeTab === 'timeline' ? 'text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">ปฏิทิน</span>
        </button>

        {/* Center: Glowing Floating Action Button (+) like user reference */}
        <div className="flex-1 flex items-center justify-center -mt-7">
          <button
            onClick={onOpenNewBooking}
            className="w-14 h-14 rounded-full bg-gradient-to-tr from-emerald-500 via-teal-400 to-cyan-400 active:scale-90 text-white flex items-center justify-center shadow-[0_6px_20px_rgba(16,185,129,0.5)] transition-all border-[3.5px] border-[#111827]"
            title="เพิ่มการจองใหม่"
          >
            <Plus className="w-8 h-8 stroke-[3]" />
          </button>
        </div>

        {/* Tab 3: รายการจอง */}
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'bookings' 
              ? 'text-emerald-400 font-black scale-105' 
              : 'text-slate-400 font-bold hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'bookings' ? 'bg-emerald-500/15' : ''}`}>
            <ListOrdered className={`w-5 h-5 ${activeTab === 'bookings' ? 'text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">รายการจอง</span>
        </button>

        {/* Tab 4: ยอดเงิน */}
        <button
          onClick={() => setActiveTab('finance')}
          className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
            activeTab === 'finance' 
              ? 'text-emerald-400 font-black scale-105' 
              : 'text-slate-400 font-bold hover:text-slate-200'
          }`}
        >
          <div className={`p-1 rounded-xl transition-all ${activeTab === 'finance' ? 'bg-emerald-500/15' : ''}`}>
            <DollarSign className={`w-5 h-5 ${activeTab === 'finance' ? 'text-emerald-400 stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[10px] mt-0.5 tracking-tight">ยอดเงิน</span>
        </button>
      </div>
    </div>
  );
};
