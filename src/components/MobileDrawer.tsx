import React from 'react';
import { 
  Home,
  CalendarDays,
  ListOrdered,
  DollarSign, 
  LogOut, 
  Plus,
  User,
  X,
  Sparkles,
  UtensilsCrossed,
  ShieldCheck,
  History,
  Settings,
  Download
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
  onOpenInstallPWA?: () => void;
  isPWAInstalled?: boolean;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  activeTab,
  setActiveTab,
  onOpenNewBooking,
  userEmail,
  onOpenInstallPWA,
  isPWAInstalled = false,
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
    <div 
      className={`fixed inset-0 z-30 lg:hidden transition-all duration-300 ${
        isOpen ? 'pointer-events-auto visible' : 'pointer-events-none invisible'
      }`}
      aria-hidden={!isOpen}
    >
      {/* Backdrop (over the pushed main screen to the right) */}
      <div 
        onClick={onClose}
        className={`fixed inset-y-0 left-[280px] right-0 bg-slate-950/40 backdrop-blur-[1px] transition-opacity duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] z-20 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      />

      {/* Drawer Container (Revealed as screen slides right) */}
      <aside 
        className={`fixed top-0 bottom-0 left-0 w-[280px] bg-slate-900 text-white flex flex-col z-30 shadow-2xl border-r border-slate-800/80 transition-transform duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] will-change-transform ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        style={{ fontFamily: "'Prompt', sans-serif" }}
      >
        {/* Top Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <BrandLogo 
            theme="dark" 
            onClick={() => {
              setActiveTab('dashboard');
              onClose();
            }} 
          />
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
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

          {/* Additional Features Section (Ready for future expansion) */}
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-2">
              บริการ & แม่บ้าน
            </span>

            <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400 font-bold">
              <UtensilsCrossed className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <span className="text-white block text-xs">สั่งหมูกระทะ & อาหาร</span>
                <span className="text-[10px] text-slate-500">จัดการออเดอร์ในห้องพัก</span>
              </div>
            </div>

            <div className="p-2.5 rounded-2xl bg-slate-800/50 border border-slate-800 flex items-center gap-2.5 text-xs text-slate-400 font-bold">
              <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <span className="text-white block text-xs">สถานะทำความสะอาด</span>
                <span className="text-[10px] text-slate-500">เปิด-ปิดสถานะรอแม่บ้าน</span>
              </div>
            </div>
          </div>

          {/* System Info */}
          <div className="space-y-1 pt-2 border-t border-slate-800">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider px-2">
              ระบบ & ความปลอดภัย
            </span>
            <div className="p-2.5 rounded-2xl bg-slate-800/30 flex items-center gap-2 text-xs text-slate-400 font-medium">
              <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-[11px]">ระบบคลาวด์ Firebase ปลอดภัย 100%</span>
            </div>
          </div>

        </div>

        {/* Footer: User & Sign Out */}
        <div className="p-3 bg-slate-950 border-t border-slate-800 shrink-0 space-y-2">
          {onOpenInstallPWA && !isPWAInstalled && (
            <button
              onClick={() => {
                onOpenInstallPWA();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 rounded-xl transition-all border border-emerald-800/40 cursor-pointer active:scale-95 shadow-xs"
              title="ติดตั้งเป็นแอพลงเครื่อง (PWA)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ติดตั้งแอพลงมือถือ (PWA)</span>
            </button>
          )}

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
    </div>
  );
};
