import React from 'react';
import { 
  Download, 
  X, 
  Smartphone, 
  Zap, 
  WifiOff, 
  Share, 
  PlusSquare, 
  Sparkles,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';

interface PWAInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInstall: () => void;
  isIOS: boolean;
  isInstalled: boolean;
}

export const PWAInstallModal: React.FC<PWAInstallModalProps> = ({
  isOpen,
  onClose,
  onInstall,
  isIOS,
  isInstalled,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/80 backdrop-blur-md transition-opacity duration-300 animate-in fade-in" 
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-700/80 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in zoom-in-95 duration-200 text-white font-['Prompt']">
        
        {/* Decorative Top Gradient */}
        <div className="h-2 bg-gradient-to-r from-emerald-500 via-cyan-500 to-sky-500" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          title="ปิด"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Header with App Icon */}
          <div className="flex items-center gap-4 mb-5">
            <div className="w-16 h-16 rounded-2xl overflow-hidden border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/10 shrink-0 bg-slate-950 p-1">
              <img 
                src="/pwa-192x192.png" 
                alt="Swan HILL App Icon" 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Progressive Web App</span>
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Swan HILL Resort
              </h3>
              <p className="text-xs text-slate-400 font-medium">
                {isInstalled ? 'ติดตั้งลงบนอุปกรณ์แล้ว' : 'ติดตั้งเป็นแอพลงมือถือ & คอมพิวเตอร์'}
              </p>
            </div>
          </div>

          {/* Value Propositions / Why PWA is smoother */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mb-5 space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 border border-emerald-500/20">
                <Zap className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">เร็ว & ลื่นไหลกว่าเปิดในเบราว์เซอร์</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  ระบบแคชข้อมูลไว้ในเครื่อง เปิดใช้งานได้ทันที ไม่ต้องโหลดหน้าเว็บซ้ำ
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center shrink-0 mt-0.5 border border-cyan-500/20">
                <Smartphone className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">เต็มจอไร้ขอบ (Fullscreen Native App)</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  ไม่มีแถบ URL bar หรือแท็บเกะกะสายตา สัมผัสตอบสนองลื่นไหลแบบแอพจริง
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-sky-500/10 text-sky-400 flex items-center justify-center shrink-0 mt-0.5 border border-sky-500/20">
                <WifiOff className="w-4 h-4 stroke-[2.5]" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-slate-200">ทนทานต่อเน็ตช้าหรือเน็ตหลุด</h4>
                <p className="text-xs text-slate-400 mt-0.5 leading-relaxed">
                  โครงสร้างแอพพร้อมทำงานตลอดเวลา ไม่ติดขัดแม้สัญญาณเน็ตไม่เสถียร
                </p>
              </div>
            </div>
          </div>

          {/* Installation Instructions / CTA */}
          {isInstalled ? (
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-3 text-emerald-400">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div className="text-xs font-bold leading-tight">
                คุณกำลังใช้งานผ่านแอพ Swan HILL แล้ว! ประสิทธิภาพทำงานรวดเร็วสูงสุด
              </div>
            </div>
          ) : isIOS ? (
            /* iOS Safari Step-by-Step Guide */
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-3">
              <p className="text-xs font-bold text-emerald-400 flex items-center gap-1.5">
                <span>วิธีติดตั้งบน iPhone / iPad (Safari):</span>
              </p>
              <div className="space-y-2.5 text-xs text-slate-300">
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">1</span>
                  <span>แตะปุ่ม <strong>แชร์ (Share)</strong></span>
                  <Share className="w-4 h-4 text-sky-400 inline shrink-0" />
                  <span>ที่แถบด้านล่าง Safari</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">2</span>
                  <span>เลื่อนลงแล้วแตะ <strong>"เพิ่มไปยังหน้าจอโฮม"</strong></span>
                  <PlusSquare className="w-4 h-4 text-emerald-400 inline shrink-0" />
                </div>
                <div className="flex items-center gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-slate-700 text-white font-bold flex items-center justify-center text-[10px] shrink-0">3</span>
                  <span>แตะ <strong>"เพิ่ม" (Add)</strong> ที่มุมขวาบน เป็นอันเสร็จสิ้น!</span>
                </div>
              </div>
            </div>
          ) : (
            /* Android / Desktop Direct 1-Click Install Button */
            <button
              onClick={() => {
                onInstall();
                onClose();
              }}
              className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600 active:scale-95 text-white font-bold text-sm rounded-2xl shadow-lg shadow-emerald-500/25 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-5 h-5 stroke-[2.5]" />
              <span>กดติดตั้งแอพ Swan HILL ทันที (ฟรี)</span>
            </button>
          )}

          {/* Close / Dismiss */}
          <button
            onClick={onClose}
            className="w-full mt-3 py-2 text-center text-xs text-slate-400 hover:text-slate-200 transition-colors"
          >
            {isInstalled ? 'ปิดหน้าต่าง' : 'ไว้คราวหลัง'}
          </button>
        </div>
      </div>
    </div>
  );
};

interface PWAUpdateBannerProps {
  onReload: () => void;
}

export const PWAUpdateBanner: React.FC<PWAUpdateBannerProps> = ({ onReload }) => {
  return (
    <div className="fixed top-3 inset-x-3 md:inset-x-auto md:right-4 z-50 max-w-sm bg-slate-900/95 border border-cyan-500/50 shadow-2xl backdrop-blur-md rounded-2xl p-3 text-white flex items-center justify-between gap-3 animate-in slide-in-from-top duration-300">
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div>
          <h5 className="text-xs font-bold text-white">มีอัปเดตเวอร์ชันใหม่</h5>
          <p className="text-[11px] text-slate-300">กดอัปเดตเพื่อรับฟีเจอร์ล่าสุด</p>
        </div>
      </div>
      <button
        onClick={onReload}
        className="px-3 py-1.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 active:scale-95 text-slate-950 font-black text-xs flex items-center gap-1.5 transition-all cursor-pointer shrink-0"
      >
        <RefreshCw className="w-3.5 h-3.5" />
        <span>อัปเดต</span>
      </button>
    </div>
  );
};
