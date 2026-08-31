import React, { useState, useEffect } from 'react';
import { Search, Calendar, Palmtree, LogOut, RotateCw } from 'lucide-react';
import { auth } from '../lib/firebase';
import type { ActiveTab } from './Sidebar';

interface HeaderProps {
  activeTab: ActiveTab;
  availableRoomsCount: number;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  availableRoomsCount,
  searchTerm,
  setSearchTerm,
}) => {
  const [currentDateTime, setCurrentDateTime] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = { 
        weekday: 'short', 
        day: 'numeric',
        month: 'short',
      };
      setCurrentDateTime(now.toLocaleDateString('th-TH', options));
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
  };

  return (
    <header className="bg-white border-b border-[#e8e2d8] sticky top-0 z-30 shadow-xs">
      {/* Mobile Top App Bar */}
      <div className="md:hidden px-4 py-2.5 bg-[#1c1917] text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-[#2d5a43] flex items-center justify-center shadow-md">
            <Palmtree className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="font-extrabold text-sm text-white leading-tight">Swan HILL</h1>
            <p className="text-[10px] text-[#a7d4ba] font-medium">ระบบจัดการรีสอร์ท</p>
          </div>
        </div>

        {/* Right Action Buttons (Mobile) */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleClearCacheAndReload}
            disabled={isClearing}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[#292524] hover:bg-[#38332e] active:scale-95 text-[#a7d4ba] border border-[#44403c] text-[11px] font-bold transition-all"
            title="ล้างแคชและโหลดข้อมูลใหม่"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isClearing ? 'animate-spin' : ''}`} />
            <span>{isClearing ? 'กำลังโหลด...' : 'รีแคช'}</span>
          </button>

          <button
            onClick={() => auth.signOut()}
            className="p-1.5 rounded-xl text-[#a8a29e] hover:text-red-400 bg-[#292524] border border-[#44403c] active:scale-95 transition-all"
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
          <h2 className="text-base md:text-lg font-extrabold text-[#2b2724]">
            {titles[activeTab].title}
          </h2>
          <p className="text-xs text-[#70675e] hidden md:block mt-0.5 font-medium">{titles[activeTab].subtitle}</p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Search Bar */}
          <div className="relative flex-1 md:w-56">
            <Search className="w-3.5 h-3.5 text-[#8c8278] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อลูกค้า, เบอร์โทร..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#faf7f2] border border-[#e3dcd0] rounded-xl focus:bg-white focus:ring-2 focus:ring-[#2d5a43] outline-none font-medium text-[#2b2724]"
            />
          </div>

          {/* Available Badge */}
          <span className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#eaf3ed] text-[#23583a] border border-[#c2decb]">
            <span className="w-2 h-2 rounded-full bg-[#2d5a43]"></span>
            ห้องว่าง {availableRoomsCount} หลัง
          </span>

          {/* Desktop Clear Cache Button */}
          <button
            onClick={handleClearCacheAndReload}
            disabled={isClearing}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#f4eee6] hover:bg-[#eae2d8] active:scale-95 text-[#453d36] border border-[#e0d7cb] text-xs font-bold transition-all"
            title="ล้างแคชและโหลดข้อมูลล่าสุด"
          >
            <RotateCw className={`w-3.5 h-3.5 text-[#2d5a43] ${isClearing ? 'animate-spin' : ''}`} />
            <span>{isClearing ? 'กำลังรีแคช...' : 'รีแคช (Ctrl+Shift+R)'}</span>
          </button>

          {/* Date Display */}
          <div className="hidden lg:flex items-center gap-1.5 text-xs font-bold text-[#544b42] bg-[#f4eee6] px-3 py-1.5 rounded-xl border border-[#e0d7cb] shrink-0">
            <Calendar className="w-3.5 h-3.5 text-[#2d5a43]" />
            <span>{currentDateTime}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
