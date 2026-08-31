import { useState } from 'react';
import { 
  Settings, 
  Building2, 
  DollarSign, 
  UtensilsCrossed, 
  CreditCard, 
  Save, 
  RotateCcw, 
  Check, 
  Sparkles
} from 'lucide-react';
import type { ResortSettings } from '../types/pms';
import { initialSettings } from '../data/initialData';

interface SettingsViewProps {
  settings: ResortSettings;
  onSaveSettings: (newSettings: ResortSettings) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onSaveSettings,
}) => {
  const [formData, setFormData] = useState<ResortSettings>(settings);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const handleChange = (field: keyof ResortSettings, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleNumberChange = (field: keyof ResortSettings, value: string) => {
    const num = Number(value) || 0;
    setFormData(prev => ({
      ...prev,
      [field]: num,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveSettings(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const handleResetDefaults = () => {
    if (window.confirm('คุณต้องการคืนค่าการตั้งค่าทั้งหมดกลับเป็นค่าเริ่มต้นหรือไม่?')) {
      setFormData(initialSettings);
      onSaveSettings(initialSettings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-['Prompt'] max-w-5xl mx-auto pb-10">
      
      {/* Header & Save Action Bar */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 sticky top-16 z-20">
        <div>
          <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Settings className="w-5 h-5 text-emerald-600" />
            <span>ตั้งค่าระบบรีสอร์ท (System Settings)</span>
          </h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">
            ปรับแต่งข้อมูลรีสอร์ท ราคาห้องพัก เมนูอาหาร และบัญชีธนาคารได้ตลอดเวลาโดยไม่ต้องแก้โค้ด
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            type="submit"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
          >
            {saveSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[3]" />
                <span>บันทึกสำเร็จ!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>บันทึกการตั้งค่า</span>
              </>
            )}
          </button>
        </div>
      </div>

      {saveSuccess && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl text-xs font-bold flex items-center justify-center gap-2 animate-in slide-in-from-top">
          <Check className="w-4 h-4" />
          <span>บันทึกข้อมูลการตั้งค่าระบบและอัปเดตลงระบบเรียบร้อยแล้ว</span>
        </div>
      )}

      {/* Grid: 2 Columns of Settings Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* CARD 1: Resort Profile */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">ข้อมูลทั่วไปรีสอร์ท</h2>
              <p className="text-[11px] text-slate-500">ชื่อแบรนด์และข้อมูลติดต่อ</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">ชื่อรีสอร์ท (ภาษาอังกฤษทางการ)</label>
              <input
                type="text"
                required
                value={formData.resortNameEn}
                onChange={(e) => handleChange('resortNameEn', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ชื่อรีสอร์ท (ภาษาไทย)</label>
              <input
                type="text"
                required
                value={formData.resortNameTh}
                onChange={(e) => handleChange('resortNameTh', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-800 mb-1">เบอร์โทรติดต่อ</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => handleChange('phone', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-medium"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-800 mb-1">LINE Official ID</label>
                <input
                  type="text"
                  value={formData.lineId || ''}
                  onChange={(e) => handleChange('lineId', e.target.value)}
                  placeholder="@swanhill"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-medium"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ที่อยู่รีสอร์ท</label>
              <textarea
                rows={2}
                value={formData.address}
                onChange={(e) => handleChange('address', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-medium resize-none"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ข้อความขอบคุณท้ายใบเสร็จรับเงิน</label>
              <textarea
                rows={2}
                value={formData.receiptFooterMessage}
                onChange={(e) => handleChange('receiptFooterMessage', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-medium resize-none"
              />
            </div>
          </div>
        </div>

        {/* CARD 2: Room Rates Configuration */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <DollarSign className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">กำหนดราคาห้องพัก & เตียงเสริม</h2>
              <p className="text-[11px] text-slate-500">ราคามาตรฐานต่อคืน (บาท)</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">
                🛖 บ้านพักหลังกลาง (ห้อง S1 และ S2)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">฿</span>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.rateMediumRoom}
                  onChange={(e) => handleNumberChange('rateMediumRoom', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-black text-blue-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                🛖 บ้านพักหลังใหญ่ (ห้อง S3 และ S4)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">฿</span>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.rateLargeRoom}
                  onChange={(e) => handleNumberChange('rateLargeRoom', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-black text-emerald-900"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">
                🛖 บ้านพักแฝดหลังเล็ก (ห้อง S5 และ S6)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">฿</span>
                <input
                  type="number"
                  required
                  min={0}
                  value={formData.rateSmallRoom}
                  onChange={(e) => handleNumberChange('rateSmallRoom', e.target.value)}
                  className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-black text-amber-900"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  🛏️ เตียงเสริม / ท่าน
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">฿</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.extraBedPrice}
                    onChange={(e) => handleNumberChange('extraBedPrice', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  🍳 อาหารเช้าเสริม / ท่าน
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">฿</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.extraBreakfastPrice}
                    onChange={(e) => handleNumberChange('extraBreakfastPrice', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* CARD 3: Add-on Services & Mookata Prices */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">ราคาอาหาร & หมูกระทะ</h2>
              <p className="text-[11px] text-slate-500">บริการสั่งเพิ่มภายในห้องพัก</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  🥓 หมูกระทะชุดเล็ก (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">฿</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.mookataSmallPrice}
                    onChange={(e) => handleNumberChange('mookataSmallPrice', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold text-amber-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">
                  🥩 หมูกระทะชุดใหญ่ (บาท)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-black">฿</span>
                  <input
                    type="number"
                    min={0}
                    value={formData.mookataLargePrice}
                    onChange={(e) => handleNumberChange('mookataLargePrice', e.target.value)}
                    className="w-full pl-7 pr-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold text-amber-900"
                  />
                </div>
              </div>
            </div>

            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200/80 text-[11px] text-amber-900 space-y-1">
              <span className="font-bold block flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" /> นโยบายราคาห้องพัก
              </span>
              <p>ราคาห้องพักยังไม่รวมอาหารเช้าและหมูกระทะตอนเย็น ลูกค้าสามารถสั่งเพิ่มได้ผ่านระบบตลอดเวลา</p>
            </div>
          </div>
        </div>

        {/* CARD 4: Bank & Payment Info */}
        <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-bold">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900">บัญชีธนาคารรับเงิน</h2>
              <p className="text-[11px] text-slate-500">สำหรับส่งให้ลูกค้าโอนมัดจำและชำระเงิน</p>
            </div>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-800 mb-1">ธนาคาร</label>
              <input
                type="text"
                value={formData.bankName}
                onChange={(e) => handleChange('bankName', e.target.value)}
                placeholder="เช่น กสิกรไทย (KBANK), ไทยพาณิชย์"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block font-bold text-slate-800 mb-1">เลขที่บัญชี</label>
                <input
                  type="text"
                  value={formData.bankAccountNo}
                  onChange={(e) => handleChange('bankAccountNo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold text-purple-900"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">เบอร์พร้อมเพย์</label>
                <input
                  type="text"
                  value={formData.promptPayNo}
                  onChange={(e) => handleChange('promptPayNo', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-800 mb-1">ชื่อบัญชี</label>
              <input
                type="text"
                value={formData.bankAccountName}
                onChange={(e) => handleChange('bankAccountName', e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
              <div>
                <label className="block font-bold text-slate-800 mb-1">เวลาเช็คอินปกติ</label>
                <input
                  type="text"
                  value={formData.checkInTime}
                  onChange={(e) => handleChange('checkInTime', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-800 mb-1">เวลาเช็คเอาท์ปกติ</label>
                <input
                  type="text"
                  value={formData.checkOutTime}
                  onChange={(e) => handleChange('checkOutTime', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-slate-50 focus:bg-white text-xs font-bold"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

    </form>
  );
};
