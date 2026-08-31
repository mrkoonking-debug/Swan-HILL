import React from 'react';
import { 
  Home,
  CalendarDays,
  ListOrdered,
  DollarSign, 
  LogOut, 
  Plus,
  User
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { BrandLogo } from './BrandLogo';

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
    <aside className="hidden md:flex w-60 bg-slate-900 text-white flex-col h-screen sticky top-0 border-r border-slate-800 select-none shrink-0">
      {/* Official Brand Header (Clickable to Home) */}
      <div className="p-4 border-b border-slate-800 bg-slate-950 flex items-center justify-between">
        <BrandLogo 
          theme="dark" 
          onClick={() => setActiveTab('dashboard')} 
        />
      </div>

      {/* Action Button */}
      <div className="p-3">
        <button
          onClick={onOpenNewBooking}
          className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-sm py-2.5 px-3 rounded-xl shadow-md shadow-emerald-500/20 transition-all"
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
                  ? 'bg-emerald-600 text-white shadow-sm' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Info & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-center gap-2 mb-2 px-1 text-slate-300 text-xs font-medium truncate">
          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{userEmail || 'ผู้ดูแลระบบ'}</span>
        </div>

        <button
          onClick={() => auth.signOut()}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-lg transition-colors border border-red-900/30"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};
