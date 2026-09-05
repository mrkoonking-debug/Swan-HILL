import { 
  Home,
  CalendarDays,
  ListOrdered,
  DollarSign, 
  LogOut, 
  Plus,
  User,
  History,
  Settings,
  Download,
  Sparkles
} from 'lucide-react';
import { auth } from '../lib/firebase';
import { BrandLogo } from './BrandLogo';

export type ActiveTab = 'dashboard' | 'timeline' | 'bookings' | 'finance' | 'logs' | 'settings';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onOpenNewBooking: () => void;
  userEmail: string | null;
  onOpenInstallPWA?: () => void;
  isPWAInstalled?: boolean;
  onOpenAIAssistant?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeTab, 
  setActiveTab, 
  onOpenNewBooking,
  userEmail,
  onOpenInstallPWA,
  isPWAInstalled = false,
  onOpenAIAssistant,
}) => {
  const coreMenuItems = [
    { id: 'dashboard', label: 'ผังบ้านพัก', icon: Home },
    { id: 'timeline', label: 'ปฏิทินห้องพัก', icon: CalendarDays },
    { id: 'bookings', label: 'รายการจอง', icon: ListOrdered },
    { id: 'finance', label: 'สรุปยอดเงิน', icon: DollarSign },
  ];

  const systemMenuItems = [
    { id: 'logs', label: 'ประวัติการทำงาน', icon: History },
    { id: 'settings', label: 'ตั้งค่าระบบ', icon: Settings },
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

      {/* Action Buttons */}
      <div className="p-2.5 space-y-2">
        <button
          onClick={onOpenNewBooking}
          className="w-full flex items-center justify-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>+ บันทึกการจอง</span>
        </button>

        {onOpenAIAssistant && (
          <button
            onClick={onOpenAIAssistant}
            className="w-full flex items-center justify-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 active:scale-95 text-white font-semibold text-xs py-2 px-3 rounded-xl shadow-xs transition-all cursor-pointer border border-purple-400/30"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current text-yellow-300" />
            <span>✨ แชท AI ลงข้อมูล</span>
          </button>
        )}
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-2 space-y-3 overflow-y-auto pt-1">
        {/* Category 1: ระบบจัดการรีสอร์ท */}
        <div className="space-y-1">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block">
            ระบบจัดการรีสอร์ท
          </span>
          {coreMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-all text-left whitespace-nowrap truncate cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Category 2: ประวัติ & ตั้งค่าระบบ */}
        <div className="space-y-1 pt-2 border-t border-slate-800/80">
          <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block">
            ประวัติ & ตั้งค่าระบบ
          </span>
          {systemMenuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as ActiveTab)}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl font-medium text-xs transition-all text-left whitespace-nowrap truncate cursor-pointer ${
                  isActive 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* User Info, PWA Install & Sign Out */}
      <div className="p-3 border-t border-slate-800 bg-slate-950/60 space-y-2">
        {onOpenInstallPWA && !isPWAInstalled && (
          <button
            onClick={onOpenInstallPWA}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 text-xs font-bold text-emerald-300 bg-emerald-950/60 hover:bg-emerald-900/80 rounded-xl transition-all border border-emerald-800/40 cursor-pointer active:scale-95 shadow-xs"
            title="ติดตั้งเป็นแอพลงเครื่อง (PWA)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>ติดตั้งแอพ (PWA)</span>
          </button>
        )}

        <div className="flex items-center gap-2 px-1 text-slate-300 text-xs font-medium truncate">
          <User className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span className="truncate">{userEmail || 'ผู้ดูแลระบบ'}</span>
        </div>

        <button
          onClick={async () => {
            localStorage.removeItem('swanhill_staff_session');
            sessionStorage.removeItem('swanhill_staff_session');
            try { await auth.signOut(); } catch {}
            window.location.href = '/login';
          }}
          className="w-full flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-950/50 hover:text-red-300 rounded-lg transition-colors border border-red-900/30 cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>ออกจากระบบ</span>
        </button>
      </div>
    </aside>
  );
};
