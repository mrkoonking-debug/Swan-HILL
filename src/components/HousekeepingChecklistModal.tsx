import React, { useState, useEffect, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { 
  X, 
  CheckCircle2, 
  Sparkles, 
  Printer, 
  Lightbulb, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  RotateCcw,
  Bed,
  Bath,
  Coffee,
  Tv,
  User,
  FileText
} from 'lucide-react';
import type { Room } from '../types/pms';
import { HouseLogo } from './HouseLogo';

export interface ChecklistItem {
  id: string;
  category: 'bedding' | 'bathroom' | 'minibar' | 'appliances';
  label: string;
  detail?: string;
  isCrucial?: boolean; // Highlighted as a common mistake (e.g. blanket, toothbrush)
}

export const DEFAULT_CHECKLIST_ITEMS: ChecklistItem[] = [
  // 1. หมวดห้องนอน & เครื่องนอน (Bedding & Bedroom)
  { id: 'bed_sheet', category: 'bedding', label: 'ผ้าปูที่นอนตึงเรียบ ไร้รอยเปื้อน/เส้นผม' },
  { id: 'pillow_cases', category: 'bedding', label: 'ปลอกหมอนสะอาดเรียบร้อย 2-4 ใบ' },
  { id: 'duvet_blanket', category: 'bedding', label: 'ผ้าห่มนวม / ผ้านวมหนานุ่ม กลิ่นหอมสะอาด (วางพับสวยงาม)', isCrucial: true },
  { id: 'extra_bedding', category: 'bedding', label: 'หมอนเสริม / ชุดเครื่องนอนเสริม (กรณีมีเตียงเสริม)' },

  // 2. หมวดห้องน้ำ & ของใช้ส่วนตัว (Bathroom & Amenities)
  { id: 'toothbrush_kit', category: 'bathroom', label: 'แปรงสีฟัน + ยาสีฟัน (ครบตามจำนวนผู้เข้าพัก)', isCrucial: true },
  { id: 'soap_shampoo', category: 'bathroom', label: 'สบู่เหลว & แชมพูสระผม (เติมเต็มขวด พร้อมใช้งาน)' },
  { id: 'bath_towels', category: 'bathroom', label: 'ผ้าเช็ดตัวผืนใหญ่สะอาด (พับวางเรียบร้อยตามจำนวนคน)', isCrucial: true },
  { id: 'face_towels', category: 'bathroom', label: 'ผ้าเช็ดผม / ผ้าเช็ดหน้า' },
  { id: 'hair_dryer', category: 'bathroom', label: 'ไดร์เป่าผม (ทดสอบเสียบปลั๊กติดและทำงานปกติ)' },
  { id: 'toilet_paper', category: 'bathroom', label: 'กระดาษชำระม้วนใหม่ในห้องน้ำ + ม้วนสำรอง 1 ม้วน' },
  { id: 'bathroom_clean', category: 'bathroom', label: 'ล้างห้องน้ำสะอาด พื้นแห้ง ผนังไร้คราบสบู่ ไร้กลิ่นอับ' },

  // 3. หมวดมินิบาร์ & เครื่องดื่ม (Minibar & Refreshments)
  { id: 'drinking_water', category: 'minibar', label: 'น้ำดื่มฟรี 2 ขวด (Swan Hill / วางพร้อมดื่ม)' },
  { id: 'drinking_glasses', category: 'minibar', label: 'แก้วน้ำสะอาด 2 ใบ (วางคว่ำบนกระดาษรอง)' },
  { id: 'electric_kettle', category: 'minibar', label: 'กาน้ำร้อนไฟฟ้า (สะอาด ไม่มีคราบตะกรัน พร้อมใช้งาน)' },
  { id: 'coffee_tea_set', category: 'minibar', label: 'ชุดกาแฟซอง ชา น้ำตาล ครีมเทียม' },
  { id: 'refrigerator', category: 'minibar', label: 'ตู้เย็นสะอาด เสียบปลั๊กเย็นปกติ ไร้กลิ่นตกค้าง' },

  // 4. หมวดอุปกรณ์ไฟฟ้า & ตรวจสอบห้อง (Appliances & Safety)
  { id: 'air_conditioner', category: 'appliances', label: 'แอร์เปิดติด เย็นฉ่ำปกติ + รีโมทแอร์วางบนแท่น' },
  { id: 'television', category: 'appliances', label: 'ทีวีเปิดติด + รีโมททีวีพร้อมถ่านใช้งานได้' },
  { id: 'water_heater', category: 'appliances', label: 'เครื่องทำน้ำอุ่นทำงานปกติ น้ำร้อนไหลสม่ำเสมอ' },
  { id: 'lighting_all', category: 'appliances', label: 'ไฟส่องสว่างติดครบทุกดวง (ห้อง, ห้องน้ำ, ระเบียง)' },
  { id: 'trash_bin', category: 'appliances', label: 'ถังขยะใส่ถุงดำใหม่ทุกถัง (ห้องนอนและห้องน้ำ)' },
  { id: 'doors_balcony', category: 'appliances', label: 'ประตูหน้าต่างล็อคสนิท ระเบียงกวาดสะอาด ไร้ใบไม้' },
];

interface HousekeepingChecklistModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  initialRoomId?: string;
  onConfirmRoomReady?: (roomId: string, inspectorName: string, notes?: string) => void;
}

export const HousekeepingChecklistModal: React.FC<HousekeepingChecklistModalProps> = ({
  isOpen,
  onClose,
  rooms,
  initialRoomId,
  onConfirmRoomReady,
}) => {
  if (!isOpen) return null;

  const [selectedRoomId, setSelectedRoomId] = useState<string>(() => {
    if (initialRoomId) return initialRoomId;
    // Prefer first room that is cleaning, otherwise S1
    const cleaningRoom = rooms.find(r => r.status === 'cleaning');
    return cleaningRoom?.id || rooms[0]?.id || '';
  });

  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});
  const [inspectorName, setInspectorName] = useState('แม่บ้านประจำรีสอร์ท');
  const [inspectionNotes, setInspectionNotes] = useState('');
  const [showSOPTips, setShowSOPTips] = useState(false);

  // Sync selectedRoomId if initialRoomId changes when modal opens
  useEffect(() => {
    if (initialRoomId) {
      setSelectedRoomId(initialRoomId);
    }
  }, [initialRoomId]);

  // Load saved checklist progress from localStorage per room if exists
  useEffect(() => {
    if (!selectedRoomId) return;
    try {
      const saved = localStorage.getItem(`swanhill_checklist_${selectedRoomId}`);
      if (saved) {
        setCheckedIds(JSON.parse(saved));
      } else {
        setCheckedIds({});
      }
    } catch {
      setCheckedIds({});
    }
  }, [selectedRoomId]);

  const currentRoom = useMemo(() => {
    return rooms.find(r => r.id === selectedRoomId) || rooms[0];
  }, [rooms, selectedRoomId]);

  const toggleItem = (id: string) => {
    setCheckedIds(prev => {
      const next = { ...prev, [id]: !prev[id] };
      try {
        localStorage.setItem(`swanhill_checklist_${selectedRoomId}`, JSON.stringify(next));
      } catch {}
      return next;
    });
  };

  const handleCheckAll = () => {
    const allChecked: Record<string, boolean> = {};
    DEFAULT_CHECKLIST_ITEMS.forEach(item => {
      allChecked[item.id] = true;
    });
    setCheckedIds(allChecked);
    try {
      localStorage.setItem(`swanhill_checklist_${selectedRoomId}`, JSON.stringify(allChecked));
    } catch {}
  };

  const handleClearAll = () => {
    setCheckedIds({});
    try {
      localStorage.removeItem(`swanhill_checklist_${selectedRoomId}`);
    } catch {}
  };

  const totalItems = DEFAULT_CHECKLIST_ITEMS.length;
  const checkedCount = Object.values(checkedIds).filter(Boolean).length;
  const progressPercent = Math.round((checkedCount / totalItems) * 100);

  const handleConfirmReady = () => {
    if (onConfirmRoomReady && currentRoom) {
      onConfirmRoomReady(currentRoom.id, inspectorName.trim() || 'แม่บ้าน', inspectionNotes.trim() || undefined);
    }
    // Clear checklist for this room
    try {
      localStorage.removeItem(`swanhill_checklist_${currentRoom.id}`);
    } catch {}
    onClose();
  };

  const handlePrint = () => {
    window.print();
  };

  const categories = [
    { key: 'bedding', label: 'ห้องนอน & เครื่องนอน', icon: <Bed className="w-4 h-4 text-indigo-600" /> },
    { key: 'bathroom', label: 'ห้องน้ำ & ของใช้จำเป็น', icon: <Bath className="w-4 h-4 text-blue-600" /> },
    { key: 'minibar', label: 'มินิบาร์ & เครื่องดื่ม', icon: <Coffee className="w-4 h-4 text-amber-600" /> },
    { key: 'appliances', label: 'เครื่องใช้ไฟฟ้า & ตรวจระบบ', icon: <Tv className="w-4 h-4 text-emerald-600" /> },
  ] as const;

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overscroll-contain animate-in fade-in duration-200 font-['Prompt']"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[92vh]"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-600 via-teal-600 to-slate-900 text-white flex items-center justify-between shadow-xs shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-yellow-300" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg flex items-center gap-2">
                <span>เช็คลิสต์ตรวจห้องพัก & ของใช้แม่บ้าน</span>
              </h3>
              <p className="text-xs text-emerald-100">
                มาตรฐาน Swan HILL Resort &bull; ป้องกันลืมผ้าห่ม / แปรงสีฟัน / ของใช้
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 active:scale-95 text-white transition-all cursor-pointer hidden sm:flex items-center gap-1.5 text-xs font-bold"
              title="พิมพ์ใบเช็คลิสต์แม่บ้าน"
            >
              <Printer className="w-4 h-4" />
              <span>พิมพ์</span>
            </button>
            <button 
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 active:scale-95 flex items-center justify-center text-white transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Room Switcher Tabs */}
        <div className="p-3 bg-slate-50 border-b border-slate-200 shrink-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] font-bold text-slate-600">เลือกบ้านพักที่ต้องการตรวจ:</span>
            {currentRoom && (
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                currentRoom.status === 'cleaning' 
                  ? 'bg-amber-100 text-amber-800 border border-amber-300 animate-pulse'
                  : currentRoom.status === 'available'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-slate-200 text-slate-700'
              }`}>
                {currentRoom.status === 'cleaning' ? '🟡 กำลังทำความสะอาด' : currentRoom.status === 'available' ? '🟢 ว่างพร้อมขาย' : 'มีคนพัก'}
              </span>
            )}
          </div>
          <div className="grid grid-cols-6 gap-1.5 sm:gap-2">
            {rooms.map((r) => {
              const isSelected = r.id === selectedRoomId;
              const isCleaning = r.status === 'cleaning';
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => setSelectedRoomId(r.id)}
                  className={`p-1.5 sm:p-2 rounded-xl border flex flex-col items-center justify-center transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <HouseLogo roomNumber={r.roomNumber} size="sm" />
                  <span className="font-extrabold text-[11px] sm:text-xs mt-1">บ้าน {r.roomNumber}</span>
                  {isCleaning && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-amber-500 border border-white" title="รอทำความสะอาด" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Inspection Progress Bar */}
        <div className="px-4 py-2.5 bg-emerald-50/70 border-b border-emerald-100 flex items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <CheckCircle2 className={`w-4 h-4 shrink-0 ${progressPercent === 100 ? 'text-emerald-600' : 'text-slate-400'}`} />
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1">
                <span>ความพร้อมห้อง {currentRoom?.roomNumber}: {checkedCount}/{totalItems} รายการ</span>
                <span className={progressPercent === 100 ? 'text-emerald-700 font-black' : 'text-slate-600'}>
                  {progressPercent}%
                </span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full transition-all duration-300 rounded-full ${
                    progressPercent === 100 
                      ? 'bg-emerald-600' 
                      : progressPercent >= 70 
                      ? 'bg-teal-500' 
                      : 'bg-amber-500'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleCheckAll}
              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold active:scale-95 transition-all cursor-pointer shadow-2xs"
            >
              ผ่านทั้งหมด
            </button>
            <button
              type="button"
              onClick={handleClearAll}
              className="px-2 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 text-[11px] font-medium active:scale-95 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Scrollable Checklist Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs sm:text-sm text-slate-800">

          {/* SOP Tips Collapsible Box (Hospitality Best Practices) */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl overflow-hidden transition-all">
            <button
              type="button"
              onClick={() => setShowSOPTips(!showSOPTips)}
              className="w-full p-3 flex items-center justify-between text-left cursor-pointer hover:bg-amber-100/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-600 shrink-0" />
                <span className="font-bold text-xs sm:text-sm text-amber-950">
                  💡 3 เทคนิคป้องกันแม่บ้านลืมของ (ผ้าห่ม, แปรงสีฟัน, ของใช้)
                </span>
              </div>
              {showSOPTips ? <ChevronUp className="w-4 h-4 text-amber-700" /> : <ChevronDown className="w-4 h-4 text-amber-700" />}
            </button>

            {showSOPTips && (
              <div className="px-3 pb-3 pt-1 border-t border-amber-200/60 space-y-2 text-xs text-amber-900 animate-in fade-in">
                <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-950 font-bold block mb-0.5">
                    1. เทคนิค "Amenity Caddy" (จัดถุงของใช้สำเร็จรูป 1 ห้อง = 1 ถุง):
                  </strong>
                  <p className="text-slate-700 leading-relaxed">
                    ก่อนเริ่มทำความสะอาด ให้จัดตะกร้าหรือถุงซิปไว้ล่วงหน้า 6 ถุงสำหรับ 6 ห้อง (ในถุงมีแปรงสีฟัน 2 อัน, สบู่, แชมพู, ทิชชู่, กาแฟ) พอแม่บ้านเดินเข้าห้องไหน ก็ยก 1 ถุงไปวางทันที <em>หมดปัญหาลืมหยิบของชิ้นเล็กชิ้นน้อยแน่นอน 100%</em>
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-950 font-bold block mb-0.5">
                    2. เทคนิค "Clockwise Inspection" (เดินตรวจวนตามเข็มนาฬิกา):
                  </strong>
                  <p className="text-slate-700 leading-relaxed">
                    สอนแม่บ้านให้เดินตรวจเป็นแนววงกลมเสมอ: เริ่มจากเตียงนอน (เช็คผ้าห่ม/หมอน) &rarr; วนเข้าห้องน้ำ (เช็คแปรงสีฟัน/ผ้าเช็ดตัว) &rarr; วนมาโต๊ะมินิบาร์ (เช็คน้ำ/แก้ว) &rarr; จบที่ระเบียงและสวิตช์ไฟหน้าประตู
                  </p>
                </div>

                <div className="p-2.5 bg-white rounded-xl border border-amber-100">
                  <strong className="text-amber-950 font-bold block mb-0.5">
                    3. เทคนิค "3-Second Final Glance" (หยุดมอง 3 วิ ก่อนล็อคห้อง):
                  </strong>
                  <p className="text-slate-700 leading-relaxed">
                    ก่อนปิดประตูล็อคห้อง ให้ยืนหน้าประตูแล้วกวาดตามอง 3 จุดสำคัญ: <strong>(1) ผ้าห่มนวมบนเตียง (2) แปรงสีฟันในห้องน้ำ (3) รีโมทแอร์วางอยู่คู่กับรีโมททีวีหรือไม่</strong>
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Checklist by Category */}
          {categories.map((cat) => {
            const items = DEFAULT_CHECKLIST_ITEMS.filter(item => item.category === cat.key);
            const catCheckedCount = items.filter(item => checkedIds[item.id]).length;
            const isCatAllChecked = catCheckedCount === items.length;

            return (
              <div key={cat.key} className="bg-slate-50 border border-slate-200/90 rounded-2xl overflow-hidden">
                <div className="p-3 bg-white border-b border-slate-200/70 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {cat.icon}
                    <span className="font-bold text-xs sm:text-sm text-slate-900">{cat.label}</span>
                  </div>
                  <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                    isCatAllChecked ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {catCheckedCount}/{items.length}
                  </span>
                </div>

                <div className="p-2 divide-y divide-slate-100">
                  {items.map((item) => {
                    const isChecked = !!checkedIds[item.id];
                    return (
                      <label
                        key={item.id}
                        className={`flex items-start gap-3 p-2.5 rounded-xl cursor-pointer transition-colors ${
                          isChecked 
                            ? 'bg-emerald-50/50 hover:bg-emerald-50' 
                            : item.isCrucial 
                            ? 'bg-amber-50/40 hover:bg-amber-50/80 border border-amber-200/60' 
                            : 'hover:bg-white'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleItem(item.id)}
                          className="w-4 h-4 mt-0.5 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className={`text-xs sm:text-sm ${
                              isChecked 
                                ? 'line-through text-slate-400 font-normal' 
                                : 'text-slate-800 font-medium'
                            }`}>
                              {item.label}
                            </span>
                            {item.isCrucial && !isChecked && (
                              <span className="text-[10px] font-bold text-rose-700 bg-rose-100 px-1.5 py-0.5 rounded-md border border-rose-200 shrink-0">
                                ⚠️ จุดที่มักลืมบ่อย
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}

          {/* Inspector Signature & Notes */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <User className="w-3.5 h-3.5 text-slate-500" />
                <span>ผู้ตรวจความพร้อมห้องพัก:</span>
              </label>
              <input
                type="text"
                value={inspectorName}
                onChange={(e) => setInspectorName(e.target.value)}
                placeholder="ระบุชื่อแม่บ้าน / ผู้ตรวจ"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:border-emerald-500 outline-none bg-white"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-1">
                <FileText className="w-3.5 h-3.5 text-slate-500" />
                <span>หมายเหตุเพิ่มเติม (ถ้ามี):</span>
              </label>
              <input
                type="text"
                value={inspectionNotes}
                onChange={(e) => setInspectionNotes(e.target.value)}
                placeholder="เช่น เปลี่ยนหลอดไฟระเบียงใหม่, กลิ่นหอมเรียบร้อย"
                className="w-full px-3 py-1.5 border border-slate-300 rounded-xl text-xs font-medium focus:border-emerald-500 outline-none bg-white"
              />
            </div>
          </div>

          {/* Warning if items remain unchecked */}
          {progressPercent < 100 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-center gap-2 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                ยังมีอีก <strong>{totalItems - checkedCount} รายการ</strong> ที่ยังไม่ได้ติ๊กตรวจ หากมั่นใจว่าจัดเตรียมครบแล้ว สามารถกดยืนยันเพื่อเปิดห้องว่างได้เลยครับ
              </span>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="py-2.5 px-4 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 active:scale-95 transition-all cursor-pointer"
          >
            ปิดหน้าต่าง
          </button>

          <button
            type="button"
            onClick={handleConfirmReady}
            className={`flex-1 py-2.5 px-4 rounded-xl text-white font-bold text-xs sm:text-sm active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2 shadow-md ${
              progressPercent === 100
                ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-600/20'
                : 'bg-gradient-to-r from-teal-600 to-slate-800 hover:from-teal-700 hover:to-slate-900'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {currentRoom?.status === 'cleaning' 
                ? `ตรวจผ่าน & เปิดบ้าน ${currentRoom?.roomNumber} ว่างพร้อมขายทันที` 
                : `บันทึกผลการตรวจบ้าน ${currentRoom?.roomNumber}`}
            </span>
          </button>
        </div>

      </div>
    </div>,
    document.body
  );
};
