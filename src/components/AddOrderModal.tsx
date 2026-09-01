import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check } from 'lucide-react';
import type { Booking, AddOnItem } from '../types/pms';
import { 
  ExtraBedIcon, 
  MookataSmallIcon, 
  MookataLargeIcon, 
  BreakfastIcon, 
  CustomDishIcon 
} from './MenuIcons';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';

interface AddOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
  onUpdateBookingAddOns: (bookingId: string, updatedAddOns: AddOnItem[]) => void;
}

export const AddOrderModal: React.FC<AddOrderModalProps> = ({
  isOpen,
  onClose,
  booking,
  onUpdateBookingAddOns,
}) => {
  useLockBodyScroll(isOpen);

  // Temporary local state for add-on counts
  const [extraBeds, setExtraBeds] = useState<number>(0);
  const [mookataSmall, setMookataSmall] = useState<number>(0);
  const [mookataLarge, setMookataLarge] = useState<number>(0);
  const [breakfast, setBreakfast] = useState<number>(0);

  // Custom order item
  const [customName, setCustomName] = useState('');
  const [customPrice, setCustomPrice] = useState<number | ''>('');
  const [customList, setCustomList] = useState<AddOnItem[]>([]);

  useEffect(() => {
    if (booking && isOpen) {
      const currentAddOns: AddOnItem[] = booking.addOns || [];
      setExtraBeds(
        currentAddOns.filter(a => a.category === 'bed').reduce((sum, a) => sum + a.quantity, 0)
      );
      setMookataSmall(
        currentAddOns.filter(a => a.category === 'mookata_small').reduce((sum, a) => sum + a.quantity, 0)
      );
      setMookataLarge(
        currentAddOns.filter(a => a.category === 'mookata_large').reduce((sum, a) => sum + a.quantity, 0)
      );
      setBreakfast(
        currentAddOns.filter(a => a.category === 'breakfast').reduce((sum, a) => sum + a.quantity, 0)
      );
      setCustomList(
        currentAddOns.filter(a => a.category === 'custom' || a.category === 'drink')
      );
      setCustomName('');
      setCustomPrice('');
    }
  }, [booking, isOpen]);

  if (!isOpen || !booking) return null;

  const handleAddCustom = () => {
    if (!customName || !customPrice || Number(customPrice) <= 0) return;
    const newItem: AddOnItem = {
      id: 'custom-' + Date.now(),
      name: customName,
      category: 'custom',
      price: Number(customPrice),
      quantity: 1,
      createdAt: new Date().toISOString(),
    };
    setCustomList(prev => [...prev, newItem]);
    setCustomName('');
    setCustomPrice('');
  };

  const handleRemoveCustom = (id: string) => {
    setCustomList(prev => prev.filter(item => item.id !== id));
  };

  const calculateAddOnTotal = () => {
    const bedTotal = extraBeds * 300;
    const mookataSTotal = mookataSmall * 350;
    const mookataLTotal = mookataLarge * 500;
    const breakfastTotal = breakfast * 60;
    const customTotal = customList.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    return bedTotal + mookataSTotal + mookataLTotal + breakfastTotal + customTotal;
  };

  const handleSave = () => {
    const newItems: AddOnItem[] = [];

    if (extraBeds > 0) {
      newItems.push({
        id: 'bed-' + Date.now(),
        name: `ที่นอนเสริม (${extraBeds} ท่าน)`,
        category: 'bed',
        price: 300,
        quantity: extraBeds,
        createdAt: new Date().toISOString()
      });
    }

    if (mookataSmall > 0) {
      newItems.push({
        id: 'mks-' + Date.now(),
        name: `หมูกระทะชุดเล็ก (${mookataSmall} ชุด)`,
        category: 'mookata_small',
        price: 350,
        quantity: mookataSmall,
        createdAt: new Date().toISOString()
      });
    }

    if (mookataLarge > 0) {
      newItems.push({
        id: 'mkl-' + Date.now(),
        name: `หมูกระทะชุดใหญ่ (${mookataLarge} ชุด)`,
        category: 'mookata_large',
        price: 500,
        quantity: mookataLarge,
        createdAt: new Date().toISOString()
      });
    }

    if (breakfast > 0) {
      newItems.push({
        id: 'bf-' + Date.now(),
        name: `อาหารเช้า (${breakfast} ท่าน)`,
        category: 'breakfast',
        price: 60,
        quantity: breakfast,
        createdAt: new Date().toISOString()
      });
    }

    customList.forEach(c => newItems.push(c));

    onUpdateBookingAddOns(booking.id, newItems);
    onClose();
  };

  const totalAddOns = calculateAddOnTotal();
  const roomBaseTotal = booking.roomPrice * booking.totalNights;
  const grandTotal = roomBaseTotal + totalAddOns;
  const remainingAtCheckout = Math.max(0, grandTotal - booking.paidAmount);

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overscroll-contain animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-2xl shadow-2xl border border-slate-200 overflow-hidden max-h-[90dvh] sm:max-h-[92vh] flex flex-col overscroll-contain"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div>
            <h3 className="text-base font-bold flex items-center gap-2">
              <span>สั่งบริการเสริม & หมูกระทะ / อาหาร</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 font-medium">
              ห้อง {booking.roomNumber} &bull; {booking.guestName}
            </p>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Scrollbar Completely Hidden */}
        <div className="p-4 overflow-y-auto no-scrollbar space-y-4 flex-1 text-slate-800 overscroll-contain">
          {/* Menu Items Selection Grid */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              รายการบริการเสริม & อาหาร (เลือกจำนวน)
            </h4>

            {/* 1. ที่นอนเสริม ฿300 */}
            <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50 hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                  <ExtraBedIcon size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">ที่นอนเสริม</p>
                  <p className="text-[11px] font-bold text-amber-700">฿300 <span className="text-slate-500 font-normal">/ท่าน</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-black text-sm">{extraBeds}</span>
                <button
                  type="button"
                  onClick={() => setExtraBeds(extraBeds + 1)}
                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 2. หมูกระทะชุดเล็ก ฿350 */}
            <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50 hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-800 flex items-center justify-center">
                  <MookataSmallIcon size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">หมูกระทะ (ชุดเล็ก)</p>
                  <p className="text-[11px] font-bold text-orange-700">฿350 <span className="text-slate-500 font-normal">/ชุด</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMookataSmall(Math.max(0, mookataSmall - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-black text-sm">{mookataSmall}</span>
                <button
                  type="button"
                  onClick={() => setMookataSmall(mookataSmall + 1)}
                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 3. หมูกระทะชุดใหญ่ ฿500 */}
            <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50 hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 text-red-800 flex items-center justify-center">
                  <MookataLargeIcon size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">หมูกระทะ (ชุดใหญ่)</p>
                  <p className="text-[11px] font-bold text-red-700">฿500 <span className="text-slate-500 font-normal">/ชุด</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setMookataLarge(Math.max(0, mookataLarge - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-black text-sm">{mookataLarge}</span>
                <button
                  type="button"
                  onClick={() => setMookataLarge(mookataLarge + 1)}
                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* 4. อาหารเช้าเพิ่มเติม ฿60 */}
            <div className="p-3 rounded-2xl border border-slate-200 flex items-center justify-between bg-slate-50/50 hover:bg-white transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center">
                  <BreakfastIcon size={22} />
                </div>
                <div>
                  <p className="text-xs font-black text-slate-900">อาหารเช้าเพิ่มเติม</p>
                  <p className="text-[11px] font-bold text-teal-700">฿60 <span className="text-slate-500 font-normal">/ท่าน</span></p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setBreakfast(Math.max(0, breakfast - 1))}
                  className="w-7 h-7 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-700 flex items-center justify-center font-bold"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-6 text-center font-black text-sm">{breakfast}</span>
                <button
                  type="button"
                  onClick={() => setBreakfast(breakfast + 1)}
                  className="w-7 h-7 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center font-bold"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. อาหารตามสั่ง & เครื่องดื่มเพิ่มเติม (Custom) */}
          <div className="p-3 rounded-2xl border border-slate-200 bg-slate-50/80 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <CustomDishIcon size={16} />
              <span>อาหารตามสั่ง / เครื่องดื่มในห้องพัก (พิมพ์เพิ่มเอง)</span>
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ชื่อรายการ (เช่น กะเพราหมูสับ, น้ำอัดลม)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white"
              />
              <input
                type="number"
                placeholder="ราคา (บาท)"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-24 px-3 py-1.5 text-xs border border-slate-200 rounded-xl outline-none focus:border-emerald-500 bg-white font-bold"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold shrink-0"
              >
                + เพิ่ม
              </button>
            </div>

            {/* Custom items list */}
            {customList.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-200/60">
                {customList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2 bg-white rounded-lg border border-slate-200">
                    <span className="font-semibold">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-black text-emerald-800">฿{item.price.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(item.id)}
                        className="text-red-500 hover:text-red-700 font-bold px-1"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Summary Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-700">
              <span>ค่าบ้านพัก ({booking.roomNumber} &bull; {booking.totalNights} คืน):</span>
              <span className="font-bold">฿{roomBaseTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-700">
              <span>รวมค่าบริการเสริม & อาหาร:</span>
              <span className="font-bold text-emerald-800">+฿{totalAddOns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-black text-sm pt-1 border-t border-emerald-200/70">
              <span>ยอดรวมทั้งสิ้น (Grand Total):</span>
              <span className="text-emerald-950">฿{grandTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 pt-0.5">
              <span>ยอดที่จ่ายแล้ว:</span>
              <span className="font-semibold text-emerald-700">฿{booking.paidAmount.toLocaleString()}</span>
            </div>
            {remainingAtCheckout > 0 && (
              <div className="flex justify-between text-red-700 font-black pt-1 border-t border-emerald-200/70">
                <span>ยอดค้างชำระที่ต้องเก็บตอนเช็คเอาท์:</span>
                <span className="text-sm">฿{remainingAtCheckout.toLocaleString()} บาท</span>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-100"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-sm shadow-sm flex items-center justify-center gap-1.5 transition-all"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>บันทึกบริการเสริม</span>
          </button>
        </div>
      </div>
    </div>
  );
};
