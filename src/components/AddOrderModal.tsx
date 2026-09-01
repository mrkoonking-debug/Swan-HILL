import React, { useState, useEffect } from 'react';
import { X, Plus, Minus, Check, Sparkles, UtensilsCrossed } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-sm overscroll-contain animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white text-slate-900 w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] sm:max-h-[90vh] flex flex-col overscroll-contain font-['Prompt']"
      >
        {/* Modal Header */}
        {/* Modal Header */}
        <div className="p-3.5 sm:p-4 bg-slate-950 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 flex items-center justify-center font-bold">
              <UtensilsCrossed className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-semibold flex items-center gap-2 text-white">
                <span>สั่งหมูกระทะ & บริการเสริมด่วน</span>
              </h3>
              <p className="text-xs text-emerald-400 font-medium mt-0.5">
                บ้าน {booking.roomNumber} &bull; {booking.guestName}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 active:scale-95 flex items-center justify-center text-slate-300 hover:text-white cursor-pointer transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Content - Scrollbar Completely Hidden */}
        <div className="p-3.5 sm:p-4 overflow-y-auto no-scrollbar space-y-3.5 flex-1 text-slate-800 overscroll-contain">
          
          {/* Quick 1-Tap Add Buttons */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-medium text-slate-600">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>แตะ 1 ครั้งเพื่อเพิ่มทันที (1-Tap Quick Add)</span>
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Quick Mookata Large */}
              <button
                type="button"
                onClick={() => setMookataLarge(prev => prev + 1)}
                className="p-2.5 rounded-xl bg-red-50/70 hover:bg-red-100/80 active:scale-95 border border-red-200 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-medium text-red-600 block">+ เพิ่ม 1 ชุด</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 block">หมูกระทะชุดใหญ่</span>
                  <span className="text-xs font-medium text-red-700">฿500</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-red-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </button>

              {/* Quick Mookata Small */}
              <button
                type="button"
                onClick={() => setMookataSmall(prev => prev + 1)}
                className="p-2.5 rounded-xl bg-orange-50/70 hover:bg-orange-100/80 active:scale-95 border border-orange-200 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-medium text-orange-600 block">+ เพิ่ม 1 ชุด</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 block">หมูกระทะชุดเล็ก</span>
                  <span className="text-xs font-medium text-orange-700">฿350</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-orange-500 text-white flex items-center justify-center font-bold shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </button>

              {/* Quick Breakfast */}
              <button
                type="button"
                onClick={() => setBreakfast(prev => prev + 1)}
                className="p-2.5 rounded-xl bg-teal-50/70 hover:bg-teal-100/80 active:scale-95 border border-teal-200 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-medium text-teal-600 block">+ เพิ่ม 1 ท่าน</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 block">อาหารเช้า</span>
                  <span className="text-xs font-medium text-teal-700">฿60</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </button>

              {/* Quick Extra Bed */}
              <button
                type="button"
                onClick={() => setExtraBeds(prev => prev + 1)}
                className="p-2.5 rounded-xl bg-amber-50/70 hover:bg-amber-100/80 active:scale-95 border border-amber-200 text-left transition-all cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-medium text-amber-600 block">+ เพิ่ม 1 หลัง</span>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 block">ที่นอนเสริม</span>
                  <span className="text-xs font-medium text-amber-700">฿300</span>
                </div>
                <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center font-bold shrink-0">
                  <Plus className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Menu Items with Big Large Buttons (+ / -) */}
          <div className="space-y-2.5 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">
              ปรับเพิ่ม/ลด จำนวนตามต้องการ
            </h4>

            {/* 1. หมูกระทะชุดใหญ่ ฿500 */}
            <div className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between ${
              mookataLarge > 0 ? 'bg-red-50/70 border-red-300' : 'bg-slate-50/60 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-red-100 text-red-800 flex items-center justify-center shrink-0">
                  <MookataLargeIcon size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">หมูกระทะ (ชุดใหญ่)</p>
                  <p className="text-xs font-medium text-red-700">฿500 <span className="text-slate-500 font-normal">/ชุด</span></p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setMookataLarge(Math.max(0, mookataLarge - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 active:scale-90 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-7 text-center font-bold text-base text-slate-900">{mookataLarge}</span>
                <button
                  type="button"
                  onClick={() => setMookataLarge(mookataLarge + 1)}
                  className="w-8 h-8 rounded-lg bg-red-600 hover:bg-red-700 active:scale-90 text-white flex items-center justify-center font-bold cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 2. หมูกระทะชุดเล็ก ฿350 */}
            <div className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between ${
              mookataSmall > 0 ? 'bg-orange-50/70 border-orange-300' : 'bg-slate-50/60 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-orange-100 text-orange-800 flex items-center justify-center shrink-0">
                  <MookataSmallIcon size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">หมูกระทะ (ชุดเล็ก)</p>
                  <p className="text-xs font-medium text-orange-700">฿350 <span className="text-slate-500 font-normal">/ชุด</span></p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setMookataSmall(Math.max(0, mookataSmall - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 active:scale-90 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-7 text-center font-bold text-base text-slate-900">{mookataSmall}</span>
                <button
                  type="button"
                  onClick={() => setMookataSmall(mookataSmall + 1)}
                  className="w-8 h-8 rounded-lg bg-orange-600 hover:bg-orange-700 active:scale-90 text-white flex items-center justify-center font-bold cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 3. อาหารเช้าเพิ่มเติม ฿60 */}
            <div className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between ${
              breakfast > 0 ? 'bg-teal-50/70 border-teal-300' : 'bg-slate-50/60 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-800 flex items-center justify-center shrink-0">
                  <BreakfastIcon size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">อาหารเช้าเพิ่มเติม</p>
                  <p className="text-xs font-medium text-teal-700">฿60 <span className="text-slate-500 font-normal">/ท่าน</span></p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setBreakfast(Math.max(0, breakfast - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 active:scale-90 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-7 text-center font-bold text-base text-slate-900">{breakfast}</span>
                <button
                  type="button"
                  onClick={() => setBreakfast(breakfast + 1)}
                  className="w-8 h-8 rounded-lg bg-teal-600 hover:bg-teal-700 active:scale-90 text-white flex items-center justify-center font-bold cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 4. ที่นอนเสริม ฿300 */}
            <div className={`p-2.5 sm:p-3 rounded-xl border transition-all flex items-center justify-between ${
              extraBeds > 0 ? 'bg-amber-50/70 border-amber-300' : 'bg-slate-50/60 border-slate-200'
            }`}>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                  <ExtraBedIcon size={20} />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-semibold text-slate-900">ที่นอนเสริม</p>
                  <p className="text-xs font-medium text-amber-700">฿300 <span className="text-slate-500 font-normal">/ท่าน</span></p>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))}
                  className="w-8 h-8 rounded-lg bg-slate-200 hover:bg-slate-300 active:scale-90 text-slate-700 flex items-center justify-center font-bold cursor-pointer transition-all"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-7 text-center font-bold text-base text-slate-900">{extraBeds}</span>
                <button
                  type="button"
                  onClick={() => setExtraBeds(extraBeds + 1)}
                  className="w-8 h-8 rounded-lg bg-amber-600 hover:bg-amber-700 active:scale-90 text-white flex items-center justify-center font-bold cursor-pointer shadow-xs transition-all"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 5. อาหารตามสั่ง & เครื่องดื่มเพิ่มเติม (Custom) */}
          <div className="p-3 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
            <h4 className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
              <CustomDishIcon size={16} />
              <span>อาหารตามสั่ง / เครื่องดื่มในห้องพัก (ถ้ามี)</span>
            </h4>

            <div className="flex gap-2">
              <input
                type="text"
                placeholder="ชื่อรายการ (เช่น น้ำแข็ง, เบียร์)"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="flex-1 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white"
              />
              <input
                type="number"
                placeholder="ราคา"
                value={customPrice}
                onChange={(e) => setCustomPrice(e.target.value ? Number(e.target.value) : '')}
                className="w-20 px-2.5 py-1.5 text-xs border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white font-medium"
              />
              <button
                type="button"
                onClick={handleAddCustom}
                className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium shrink-0 cursor-pointer"
              >
                + เพิ่ม
              </button>
            </div>

            {/* Custom items list */}
            {customList.length > 0 && (
              <div className="space-y-1 pt-1 border-t border-slate-200">
                {customList.map((item) => (
                  <div key={item.id} className="flex items-center justify-between text-xs py-1 px-2.5 bg-white rounded-lg border border-slate-200">
                    <span className="font-medium text-slate-800">{item.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-emerald-800">฿{item.price.toLocaleString()}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveCustom(item.id)}
                        className="text-red-500 hover:text-red-700 font-bold px-1 cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Billing Summary Box */}
          <div className="p-3.5 rounded-xl bg-emerald-50/80 border border-emerald-200 text-xs space-y-1.5">
            <div className="flex justify-between text-slate-600 font-normal">
              <span>ค่าบ้านพัก ({booking.roomNumber} &bull; {booking.totalNights} คืน):</span>
              <span className="font-medium text-slate-800">฿{roomBaseTotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-600 font-normal">
              <span>รวมค่าบริการเสริม & หมูกระทะ:</span>
              <span className="font-semibold text-emerald-700">+฿{totalAddOns.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-slate-900 font-semibold text-xs sm:text-sm pt-1.5 border-t border-emerald-200">
              <span>ยอดรวมทั้งสิ้น (Grand Total):</span>
              <span className="text-emerald-950 font-bold text-sm sm:text-base">฿{grandTotal.toLocaleString()}</span>
            </div>
            {remainingAtCheckout > 0 ? (
              <div className="flex justify-between text-red-700 font-semibold pt-1 border-t border-red-200 text-xs">
                <span>ยอดค้างชำระ:</span>
                <span>฿{remainingAtCheckout.toLocaleString()} บาท</span>
              </div>
            ) : (
              <div className="text-emerald-700 font-medium pt-0.5 text-center">
                ✓ ชำระเงินครบถ้วนแล้ว
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 sm:p-4 bg-slate-50 border-t border-slate-200 flex items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="w-1/3 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-medium text-xs hover:bg-slate-200 cursor-pointer transition-colors"
          >
            ยกเลิก
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="w-2/3 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 active:scale-95 text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-2 cursor-pointer transition-all"
          >
            <Check className="w-4 h-4" />
            <span>บันทึกออเดอร์ (฿{totalAddOns.toLocaleString()})</span>
          </button>
        </div>
      </div>
    </div>
  );
};
