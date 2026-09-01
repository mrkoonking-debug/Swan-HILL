import React, { useState, useEffect } from 'react';
import { Search, Calendar, LogOut, RotateCw, Menu, Download, X } from 'lucide-react';
import { auth } from '../lib/firebase';
import { BrandLogo } from './BrandLogo';
import type { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  availableRoomsCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  onLogoClick?: () => void;
  onOpenMobileDrawer?: () => void;
  onCloseMobileDrawer?: () => void;
  isMobileDrawerOpen?: boolean;
  onOpenInstallPWA?: () => void;
  isPWAInstalled?: boolean;
  onOpenQuickChecker?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  availableRoomsCount,
  searchTerm,
  setSearchTerm,
  onLogoClick,
  onOpenMobileDrawer,
  onCloseMobileDrawer,
  isMobileDrawerOpen = false,
  onOpenInstallPWA,
  isPWAInstalled = false,
  onOpenQuickChecker,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const dayNames = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
      const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      const dayName = dayNames[now.getDay()];
      const day = now.getDate();
      const month = thaiMonths[now.getMonth()];
      const yearBE = now.getFullYear() + 543;
      setCurrentDateTime(`${dayName} ${day} ${month} ${yearBE}`);
    };
    updateTime();
  }, []);

  const handleClearCacheAndReload = async () => {
    setIsClearing(true);
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }
      sessionStorage.clear();
    } catch (e) {
      console.error('Error clearing cache:', e);
    }
    
    const url = new URL(window.location.href);
    url.searchParams.set('reload', Date.now().toString());
    window.location.href = url.toString();
  };

  const titles: Record<ActiveTab, { title: string; subtitle: string }> = {
    dashboard: { 
      title: 'ผังบ้านพักและสถานะห้อง', 
      subtitle: 'ตรวจสอบห้องว่าง เช็คอิน และเช็คเอาท์' 
    },
    timeline: {
      title: 'ปฏิทินตรวจเช็คห้องว่าง',
      subtitle: 'ดูสถานะบ้านพักรายวัน' 
    },
    bookings: { 
      title: 'รายการจองห้องพักทั้งหมด', 
      subtitle: 'ค้นหาชื่อลูกค้า เบอร์โทร หรือเลขห้อง' 
    },
    finance: { 
      title: 'สรุปยอดเงินและรายรับ', 
      subtitle: 'รายงานยอดเงิน รายวัน / รายเดือน / รายปี' 
    },
    logs: {
      title: 'ประวัติการทำงานและบันทึกกิจกรรม',
      subtitle: 'ตรวจสอบ Audit Log ใครเป็นคนแก้ไข เวลาใด'
    },
    settings: {
      title: 'ตั้งค่าระบบรีสอร์ท',
      subtitle: 'ปรับแต่งข้อมูลรีสอร์ท ราคาห้องพัก และเมนูอาหาร'
    },
  };

  return (
    <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 sticky top-0 z-30 shadow-xs">
      {/* Mobile Top App Bar with Menu Button and Official Swan Hill Logo */}
      <div className="md:hidden px-3.5 py-2.5 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          {onOpenMobileDrawer && (
            <button
              onClick={isMobileDrawerOpen ? onCloseMobileDrawer : onOpenMobileDrawer}
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-all shrink-0 shadow-xs active:scale-90 cursor-pointer ${
                isMobileDrawerOpen
                  ? 'bg-rose-950/80 hover:bg-rose-900 border-rose-700/60 text-rose-300'
                  : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-emerald-400'
              }`}
              title={isMobileDrawerOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง (Sidebar Drawer)'}
              aria-label={isMobileDrawerOpen ? 'ปิดเมนูนำทาง' : 'เปิดเมนูนำทาง'}
            >
              {isMobileDrawerOpen ? (
                <X className="w-4 h-4 stroke-[2.5]" />
              ) : (
                <Menu className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          )}
          <BrandLogo 
            theme="dark" 
            onClick={onLogoClick} 
          />
        </div>

        {/* Right Action Buttons (Mobile) */}
        <div className="flex items-center gap-1.5">
          {onOpenQuickChecker && (
            <button
              onClick={onOpenQuickChecker}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              title="เช็คห้องว่างด่วนตามช่วงวัน"
            >
              <Search className="w-3.5 h-3.5" />
              <span>เช็คห้องว่าง</span>
            </button>
          )}

          {onOpenInstallPWA && !isPWAInstalled && (
            <button
              onClick={onOpenInstallPWA}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-emerald-500/20 to-teal-500/20 hover:from-emerald-500/30 hover:to-teal-500/30 active:scale-95 text-emerald-300 border border-emerald-500/40 text-[11px] font-bold transition-all shadow-xs cursor-pointer"
              title="ติดตั้งเป็นแอพลงเครื่อง (PWA)"
            >
              <Download className="w-3.5 h-3.5" />
              <span>โหลดแอพ</span>
            </button>
          )}

          <button
            onClick={handleClearCacheAndReload}
            disabled={isClearing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-emerald-400 border border-slate-700 text-[11px] font-bold transition-all"
            title="ล้างแคชและโหลดข้อมูลใหม่"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
            <span>{isClearing ? 'กำลังโหลด...' : 'รีแคช'}</span>
          </button>

          <button
            onClick={async () => {
              localStorage.removeItem('swanhill_staff_session');
              sessionStorage.removeItem('swanhill_staff_session');
              try { await auth.signOut(); } catch {}
              window.location.href = '/login';
            }}
            className="p-1.5 rounded-xl text-slate-400 hover:text-red-400 bg-slate-800 border border-slate-700 active:scale-95 transition-all cursor-pointer"
            title="ออกจากระบบ"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Header Row (Desktop / Tablet) */}
      <div className="px-4 md:px-6 py-2.5 md:py-3.5 flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        {/* Title */}
        <div>
          <h2 className="text-base md:text-lg font-extrabold text-slate-900">
            {titles[activeTab].title}
          </h2>
          <p className="text-xs text-slate-500 hidden md:block mt-0.5 font-medium">{titles[activeTab].subtitle}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500 outline-none font-medium"
            />
          </div>

          {/* Quick Availability Checker Button */}
          {onOpenQuickChecker && (
            <button
              onClick={onOpenQuickChecker}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white shadow-xs transition-all cursor-pointer"
              title="เช็คห้องว่างด่วนตามช่วงวัน พร้อมคัดลอกส่งตอบลูกค้าใน LINE"
            >
              <Search className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>เช็คห้องว่างด่วน</span>
            </button>
          )}

          {/* Desktop Install PWA Button */}
          {onOpenInstallPWA && !isPWAInstalled && (
            <button
              onClick={onOpenInstallPWA}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-sm transition-all active:scale-95 cursor-pointer"
              title="ติดตั้งเป็นแอพลงเครื่อง (PWA) ลื่นไหลและเร็วขึ้น"
            >
              <Download className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>ติดตั้งแอพ (PWA)</span>
            </button>
          )}

          {/* Available Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <span className="w-2 h-2 rounded-full bg-emerald-600"></span>
            ห้องว่าง {availableRoomsCount} หลัง
          </span>

          {/* Desktop Clear Cache Button */}
          <button
            onClick={handleClearCacheAndReload}
            disabled={isClearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-700 border border-slate-200 text-xs font-bold transition-all"
            title="ล้างแคชและโหลดข้อมูลล่าสุด"
          >
            <RotateCw className={`w-3.5 h-3.5 text-emerald-600 ${isClearing ? 'animate-spin' : ''}`} />
            <span>{isClearing ? 'กำลังรีแคช...' : 'รีแคช (Ctrl+Shift+R)'}</span>
          </button>

          {/* Date Display */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>{currentDateTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
