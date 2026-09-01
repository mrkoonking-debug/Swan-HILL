import React from 'react';
import { 
  Home,
  CalendarDays,
  ListOrdered,
  DollarSign, 
  LogOut, 
  Plus,
  User,
  History,
  Settings
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { BrandLogo } from './BrandLogo';
import type { ActiveTab } from './Sidebar';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
  userEmail: string | null;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenNewBooking,
  userEmail,
}) => {
  const menuItems = [
    { id: 'dashboard', label: 'ผังบ้านพัก', subtitle: 'ตรวจสอบสถานะห้องพักและเช็คอิน', icon: Home },
    { id: 'timeline', label: 'ปฏิทินห้องพัก', subtitle: 'ตารางปฏิทินรายเดือน 30-31 วัน', icon: CalendarDays },
    { id: 'bookings', label: 'รายการจอง', subtitle: 'ค้นหาและจัดการข้อมูลลูกค้า', icon: ListOrdered },
    { id: 'finance', label: 'สรุปยอดเงิน', subtitle: 'รายงานรายรับและการเงิน', icon: DollarSign },
    { id: 'logs', label: 'ประวัติการทำงาน (Logs)', subtitle: 'ตรวจสอบว่าใครทำอะไร เมื่อไหร่', icon: History },
    { id: 'settings', label: 'ตั้งค่าระบบรีสอร์ท', subtitle: 'ปรับราคา ข้อมูล และเมนูอาหาร', icon: Settings },
  ];

  return (
    <aside 
      className={`fixed top-0 bottom-0 left-0 w-[280px] bg-slate-900 text-white flex flex-col z-30 shadow-[6px_0_24px_rgba(0,0,0,0.5)] border-r border-slate-800 transition-transform duration-220 ease-out will-change-transform lg:hidden ${
        isOpen ? 'translate-x-0' : '-translate-x-full pointer-events-none'
      }`}
      style={{ fontFamily: "'Prompt', sans-serif" }}
      aria-hidden={!isOpen}
    >
        {/* Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center">
          <BrandLogo 
            theme="dark" 
            onClick={() => {
              setActiveTab('dashboard');
              onClose();
            }} 
          />
        </div>

        {/* Quick Action: New Booking */}
        <div className="p-3.5 border-b border-slate-800/80">
          <button
            onClick={() => {
              onClose();
              onOpenNewBooking();
            }}
            className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-95 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-emerald-500/20 transition-all"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>+ บันทึกการจองใหม่</span>
          </button>
        </div>

        {/* Main Navigation Menu */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3 space-y-4">
          
          {/* Main Category */}
          <div className="space-y-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-2">
              ระบบจัดการรีสอร์ท (PMS Core)
            </span>
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setActiveTab(item.id as ActiveTab);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-3 p-2.5 rounded-2xl transition-all text-left ${
                    isActive
                      ? 'bg-emerald-600 text-white shadow-sm font-black'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white font-bold'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                    isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-xs block leading-tight">{item.label}</span>
                    <span className={`text-[10px] truncate block ${isActive ? 'text-emerald-100' : 'text-slate-500'}`}>
                      {item.subtitle}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer: User & Sign Out */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2">
          <div className="flex items-center gap-2 px-1 text-slate-300 text-xs font-medium truncate">
            <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">{userEmail || 'ผู้ดูแลระบบ Swan HILL'}</span>
          </div>

          <button
            onClick={async () => {
              localStorage.removeItem('swanhill_staff_session');
              sessionStorage.removeItem('swanhill_staff_session');
              try { await auth.signOut(); } catch {}
              window.location.href = '/login';
            }}
            className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-xl transition-colors border border-red-900/40 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>ออกจากระบบ</span>
          </button>
        </div>

      </aside>
  );
};
