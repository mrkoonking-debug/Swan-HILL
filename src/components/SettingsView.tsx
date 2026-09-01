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
  Sparkles,
  Users,
  Phone,
  KeyRound,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  UserCheck
} from 'lucide-react';
import type { ResortSettings, StaffMember, StaffRole } from '../types/pms';
import { initialSettings } from '../data/initialData';
import { ConfirmDialogModal } from './ConfirmDialogModal';

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
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);

  // Staff & PIN Access Control
  const currentStaffList: StaffMember[] = formData.staffList || initialSettings.staffList || [];
  const [isAddingStaff, setIsAddingStaff] = useState(false);
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffPhone, setNewStaffPhone] = useState('');
  const [newStaffPin, setNewStaffPin] = useState('');
  const [newStaffRole, setNewStaffRole] = useState<StaffRole>('reception');
  const [showPins, setShowPins] = useState<Record<string, boolean>>({});

  const handleTogglePin = (id: string) => {
    setShowPins(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleAddStaff = () => {
    const cleanPhone = newStaffPhone.replace(/[^0-9]/g, '');
    const cleanPin = newStaffPin.trim();

    if (!newStaffName.trim()) {
      alert('กรุณากรอกชื่อพนักงาน');
      return;
    }
    if (cleanPhone.length < 9) {
      alert('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)');
      return;
    }
    if (cleanPin.length < 4) {
      alert('กรุณากำหนดรหัส PIN อย่างน้อย 4 หลัก');
      return;
    }

    const newStaff: StaffMember = {
      id: 'staff-' + Date.now(),
      name: newStaffName.trim(),
      phone: cleanPhone,
      pin: cleanPin,
      role: newStaffRole,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const updatedList = [...currentStaffList, newStaff];
    setFormData(prev => ({ ...prev, staffList: updatedList }));
    setNewStaffName('');
    setNewStaffPhone('');
    setNewStaffPin('');
    setNewStaffRole('reception');
    setIsAddingStaff(false);
  };

  const handleDeleteStaff = (id: string) => {
    if (currentStaffList.length <= 1) {
      alert('ต้องมีพนักงานหรือผู้ดูแลระบบในระบบอย่างน้อย 1 ท่าน');
      return;
    }
    const updatedList = currentStaffList.filter(s => s.id !== id);
    setFormData(prev => ({ ...prev, staffList: updatedList }));
  };

  const handleUpdateStaffPin = (id: string, newPin: string) => {
    const clean = newPin.replace(/[^0-9]/g, '').slice(0, 6);
    const updatedList = currentStaffList.map(s => s.id === id ? { ...s, pin: clean } : s);
    setFormData(prev => ({ ...prev, staffList: updatedList }));
  };

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

  const handleConfirmReset = () => {
    setFormData(initialSettings);
    onSaveSettings(initialSettings);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 font-['Prompt'] max-w-5xl mx-auto pb-10">
      
      {/* Header & Save Action Bar */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
            onClick={() => setIsResetConfirmOpen(true)}
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

      {/* CARD 5: Staff Management & PIN Access (Full Width) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold shrink-0">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <span>จัดการพนักงาน & กำหนดรหัส PIN เข้าสู่ระบบ</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                  {currentStaffList.length} ท่าน
                </span>
              </h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                พนักงานใช้เบอร์โทร + รหัส PIN นี้ล็อกอินเข้าทำงานได้ทันที ฟรี 100% ไม่เสียค่า SMS
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsAddingStaff(!isAddingStaff)}
            className="flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl border border-emerald-200 transition-all active:scale-95 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingStaff ? 'ปิดฟอร์มเพิ่ม' : '+ เพิ่มพนักงานใหม่'}</span>
          </button>
        </div>

        {/* Add Staff Form (Collapsible) */}
        {isAddingStaff && (
          <div className="p-4 bg-slate-50 border border-emerald-200 rounded-2xl space-y-3 animate-in fade-in zoom-in-95">
            <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
              <UserCheck className="w-4 h-4 text-emerald-600" />
              <span>กรอกข้อมูลพนักงานใหม่</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ชื่อพนักงาน / ชื่อเล่น</label>
                <input
                  type="text"
                  value={newStaffName}
                  onChange={(e) => setNewStaffName(e.target.value)}
                  placeholder="เช่น สมชาย (ต้อนรับ)"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">เบอร์โทรศัพท์</label>
                <input
                  type="tel"
                  value={newStaffPhone}
                  onChange={(e) => setNewStaffPhone(e.target.value)}
                  placeholder="0812345678"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-slate-900 focus:border-emerald-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">กำหนดรหัส PIN (4-6 หลัก)</label>
                <input
                  type="text"
                  maxLength={6}
                  value={newStaffPin}
                  onChange={(e) => setNewStaffPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="เช่น 1234"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-bold text-emerald-600 focus:border-emerald-500 outline-none tracking-widest"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">ตำแหน่งหน้าที่</label>
                <select
                  value={newStaffRole}
                  onChange={(e) => setNewStaffRole(e.target.value as StaffRole)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:border-emerald-500 outline-none"
                >
                  <option value="owner">👑 เจ้าของ / ผู้จัดการ</option>
                  <option value="reception">🛎️ พนักงานต้อนรับ</option>
                  <option value="housekeeping">🧹 แม่บ้าน</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingStaff(false)}
                className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-200 rounded-xl cursor-pointer transition-colors"
              >
                ยกเลิก
              </button>
              <button
                type="button"
                onClick={handleAddStaff}
                className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-sm transition-all cursor-pointer"
              >
                บันทึกพนักงาน
              </button>
            </div>
          </div>
        )}

        {/* Staff Table / List */}
        <div className="divide-y divide-slate-100">
          {currentStaffList.map((staff) => {
            const isOwner = staff.role === 'owner';
            const roleLabels: Record<StaffRole, { label: string; badge: string }> = {
              owner: { label: '👑 เจ้าของ / ผู้ดูแล', badge: 'bg-purple-100 text-purple-800 border-purple-200' },
              manager: { label: '⭐ ผู้จัดการ', badge: 'bg-blue-100 text-blue-800 border-blue-200' },
              reception: { label: '🛎️ พนักงานต้อนรับ', badge: 'bg-amber-100 text-amber-800 border-amber-200' },
              housekeeping: { label: '🧹 แม่บ้าน', badge: 'bg-teal-100 text-teal-800 border-teal-200' },
            };

            const roleInfo = roleLabels[staff.role] || roleLabels.reception;
            const isPinVisible = showPins[staff.id];

            return (
              <div 
                key={staff.id}
                className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/70 p-2 rounded-2xl transition-colors"
              >
                {/* Staff Info */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-emerald-400 flex items-center justify-center font-black text-sm shrink-0 shadow-xs">
                    {staff.name.slice(0, 1)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-xs text-slate-900">{staff.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${roleInfo.badge}`}>
                        {roleInfo.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500 font-mono mt-0.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{staff.phone}</span>
                    </div>
                  </div>
                </div>

                {/* PIN Control & Actions */}
                <div className="flex items-center gap-2 sm:self-center">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 border border-slate-200 rounded-xl text-xs">
                    <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[11px] font-medium text-slate-500">PIN:</span>
                    <input
                      type={isPinVisible ? "text" : "password"}
                      maxLength={6}
                      value={staff.pin}
                      onChange={(e) => handleUpdateStaffPin(staff.id, e.target.value)}
                      className="w-16 bg-transparent font-mono font-bold text-xs text-slate-900 outline-none text-center"
                      title="กดเพื่อแก้ไขรหัส PIN ได้ทันที"
                    />
                    <button
                      type="button"
                      onClick={() => handleTogglePin(staff.id)}
                      className="text-slate-400 hover:text-slate-600 p-0.5 cursor-pointer"
                      title={isPinVisible ? "ซ่อนรหัส PIN" : "แสดงรหัส PIN"}
                    >
                      {isPinVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {!isOwner && (
                    <button
                      type="button"
                      onClick={() => handleDeleteStaff(staff.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
                      title="ลบพนักงานท่านนี้"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Security & Helper Notice */}
        <div className="p-3 bg-emerald-50/60 border border-emerald-100 rounded-2xl flex items-start gap-2.5 text-xs text-emerald-800">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
          <div className="leading-relaxed">
            <strong>คำแนะนำสำหรับผู้ดูแล:</strong> พนักงานสามารถล็อกอินด้วยเบอร์โทรศัพท์และรหัส PIN ข้างต้นได้ทันที และหากติ๊ก <strong>"จดจำการเข้าสู่ระบบไว้ในเครื่องนี้"</strong> ตัวเครื่องจะจำการเข้าสู่ระบบไว้ตลอด ไม่ต้องเสียเวลากรอกซ้ำทุกวัน
          </div>
        </div>
      </div>

      {/* Bottom Save Action Bar */}
      <div className="p-4 bg-white rounded-3xl border border-slate-200 shadow-xs flex items-center justify-between">
        <span className="text-xs text-slate-500 font-medium">
          ตรวจสอบข้อมูลให้ถูกต้องก่อนกดบันทึก
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all border border-slate-200"
          >
            คืนค่าเริ่มต้น
          </button>
          <button
            type="submit"
            className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold shadow-md shadow-emerald-600/20 transition-all"
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

      {/* Reset Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={handleConfirmReset}
        title="ยืนยันคืนค่าเริ่มต้นทั้งหมด"
        description="คุณต้องการคืนค่าการตั้งค่าระบบ ข้อมูลรีสอร์ท ราคาห้องพัก และเมนูอาหารทั้งหมดกลับเป็นค่าเริ่มต้นใช่หรือไม่?"
        confirmText="ยืนยันคืนค่าเริ่มต้น"
        type="reset"
      />

    </form>
  );
};
