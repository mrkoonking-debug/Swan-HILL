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
      {/* Japanese Zen Charcoal Floating Capsule with Forest Moss Center Button */}
      <div className="pointer-events-auto w-full max-w-md bg-[#1c1917]/95 backdrop-blur-xl border border-[#38332e] shadow-2xl rounded-3xl px-3 py-1.5 flex items-center justify-between text-white">
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
                  isActive ? 'text-[#a7d4ba] font-black' : 'text-[#a8a29e] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-[#a7d4ba] mt-0.5"></span>}
              </button>
            );
          })}
        </div>

        {/* Elevated Center Glowing + Button */}
        <div className="relative -top-5 px-1">
          <button
            onClick={onOpenNewBooking}
            className="w-13 h-13 rounded-full bg-[#2d5a43] hover:bg-[#234835] text-white flex items-center justify-center shadow-lg shadow-[#2d5a43]/40 border-4 border-[#1c1917] active:scale-95 transition-transform"
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
                  isActive ? 'text-[#a7d4ba] font-black' : 'text-[#a8a29e] hover:text-white'
                }`}
              >
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
                {isActive && <span className="w-1 h-1 rounded-full bg-[#a7d4ba] mt-0.5"></span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
