import React from 'react';
import { 
  Home,
  CalendarDays,
  ListOrdered,
  DollarSign, 
  LogOut, 
  Plus,
  Palmtree,
  User
} from 'lucide-react';
import { auth } from '../lib/firebase';

export type ActiveTab = 'dashboard' | 'timeline' | 'bookings' | 'finance';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
  userEmail: string | null;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenNewBooking,
  userEmail 
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'ผังบ้านพัก', icon: Home },
    { id: 'timeline', label: 'ปฏิทินห้องพัก', icon: CalendarDays },
    { id: 'bookings', label: 'รายการจอง', icon: ListOrdered },
    { id: 'finance', label: 'สรุปยอดเงิน', icon: DollarSign },
  ];

  return (
    <aside className="hidden md:flex w-60 bg-[#1c1917] text-white flex-col h-screen sticky top-0 border-r border-[#2d2926] select-none shrink-0">
      {/* Brand Header */}
      <div className="p-4 border-b border-[#2d2926] bg-[#171412] flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#2d5a43] flex items-center justify-center shadow-md">
          <Palmtree className="w-5 h-5 text-white" />
        </div>
        <div>
          <h1 className="font-extrabold text-base text-white tracking-wide">
            Swan HILL
          </h1>
          <p className="text-[11px] text-[#a7d4ba] font-semibold">ระบบจัดการรีสอร์ท</p>
        </div>
      </div>

      {/* Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenNewBooking}
          className="w-full flex items-center justify-center gap-1.5 bg-[#2d5a43] hover:bg-[#234835] active:scale-98 text-white font-bold text-sm py-2.5 px-3 rounded-xl shadow-md transition-all"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>+ บันทึกการจอง</span>
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2.5 space-y-1 overflow-y-auto pt-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as ActiveTab)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl font-bold text-sm transition-all text-left whitespace-nowrap truncate ${
                isActive 
                  ? 'bg-[#2d5a43] text-white shadow-sm' 
                  : 'text-[#d6cec7] hover:bg-[#292524] hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-[#a8a29e]'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-3 border-t border-[#2d2926] bg-[#171412]/80">
        <div className="flex items-center gap-2 mb-2 px-1 text-[#d6cec7] text-xs font-medium truncate">
          <User className="w-3.5 h-3.5 text-[#a7d4ba] shrink-0" />
          <span className="truncate">{userEmail || 'ผู้ดูแลระบบ'}</span>
        </div>

        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/40 hover:text-red-300 rounded-lg transition-colors border border-red-900/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};
