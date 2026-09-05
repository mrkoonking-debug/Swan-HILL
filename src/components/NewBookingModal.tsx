import React, { useState, useEffect } from 'react';
import { 
  X, 
  Check, 
  Calendar, 
  CreditCard, 
  FileText,
  Plus,
  Minus,
  UtensilsCrossed,
  Bed,
  Sparkles,
  Coins,
  ChevronRight,
  ArrowLeft,
  ArrowRight,
  Clock,
  User,
  Home,
  Users,
  Moon
} from 'lucide-react';
import type { Room, Booking, PaymentStatus, AddOnItem } from '../types/pms';
import { HouseLogo } from './HouseLogo';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { formatLocalDate, shiftDateStr, formatThaiDate } from '../utils/dateUtils';

interface NewBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings?: Booking[];
  onAddBooking: (booking: Booking | Booking[]) => void;
  prefillRoomId?: string;
  prefillDate?: string;
  prefillCheckOutDate?: string;
  prefillGuestName?: string;
  prefillGuestPhone?: string;
  prefillGroupId?: string;
  prefillGroupBookingCode?: string;
}

// Generate auto booking code like BK-20260902-04
const generateBookingCode = (checkInDateStr: string) => {
  const cleanDate = checkInDateStr.replace(/-/g, '');
  const randomSuffix = Math.floor(10 + Math.random() * 90);
  return `BK-${cleanDate}-${randomSuffix}`;
};

const getCurrentTimeString = () => {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
};

export const NewBookingModal: React.FC<NewBookingModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings = [],
  onAddBooking,
  prefillRoomId,
  prefillDate,
  prefillCheckOutDate,
  prefillGuestName,
  prefillGuestPhone,
  prefillGroupId,
  prefillGroupBookingCode,
}) => {
  useLockBodyScroll(isOpen);
  const defaultCheckIn = formatLocalDate(new Date());
  const defaultCheckOut = shiftDateStr(defaultCheckIn, 1);

  // Guided Stepper (1 = Customer & Room, 2 = Add-ons & Payment)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  const [guestName, setGuestName] = useState('');
  const [guestPhone, setGuestPhone] = useState('');
  const [selectedRoomIds, setSelectedRoomIds] = useState<string[]>([]);
  const [checkInDate, setCheckInDate] = useState(defaultCheckIn);
  const [checkOutDate, setCheckOutDate] = useState(defaultCheckOut);
  const [checkInTime, setCheckInTime] = useState('14:00');
  const [checkOutTime, setCheckOutTime] = useState('12:00');
  const [customPrice, setCustomPrice] = useState<string>('');
  const [autoCheckIn, setAutoCheckIn] = useState<boolean>(true);
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>('paid');
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [notes, setNotes] = useState('');

  // Add-ons state during booking
  const [extraBeds, setExtraBeds] = useState(0);
  const [mookataSmall, setMookataSmall] = useState(0);
  const [mookataLarge, setMookataLarge] = useState(0);
  const [breakfast, setBreakfast] = useState(0);

  // Resolved list of selected rooms
  const selectedRooms = rooms.filter(r => selectedRoomIds.includes(r.id));
  const primaryRoom = selectedRooms[0] || rooms[0];

  // Calculate nights safely without timezone drift
  const diffNights = () => {
    const pIn = checkInDate.split('-').map(Number);
    const pOut = checkOutDate.split('-').map(Number);
    const d1 = new Date(pIn[0], pIn[1] - 1, pIn[2]);
    const d2 = new Date(pOut[0], pOut[1] - 1, pOut[2]);
    const diff = d2.getTime() - d1.getTime();
    return Math.max(1, Math.round(diff / (1000 * 60 * 60 * 24)));
  };
  const totalNights = diffNights();

  // Calculate Totals across all selected rooms with custom price override support
  const baseRoomPricePerNight = selectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0) || (rooms[0]?.pricePerNight || 1200);
  const roomPriceUnit = customPrice !== '' 
    ? (Number(customPrice) || 0) 
    : baseRoomPricePerNight;

  const roomBaseTotal = roomPriceUnit * totalNights;
  const addOnsTotal = (extraBeds * 300) + (mookataSmall * 350) + (mookataLarge * 500) + (breakfast * 60);
  const grandTotal = roomBaseTotal + addOnsTotal;

  useEffect(() => {
    if (prefillRoomId) {
      setSelectedRoomIds([prefillRoomId]);
    } else if (selectedRoomIds.length === 0 && rooms.length > 0) {
      setSelectedRoomIds([rooms[0].id]);
    }
    if (prefillGuestName) {
      setGuestName(prefillGuestName);
    }
    if (prefillGuestPhone) {
      setGuestPhone(prefillGuestPhone);
    }
    if (prefillDate) {
      setCheckInDate(prefillDate);
      if (prefillCheckOutDate) {
        setCheckOutDate(prefillCheckOutDate);
      } else {
        setCheckOutDate(shiftDateStr(prefillDate, 1));
      }
    }
    if (isOpen) {
      setCurrentStep(1);
      setCheckInTime('14:00');
    }
  }, [prefillRoomId, prefillDate, prefillCheckOutDate, prefillGuestName, prefillGuestPhone, isOpen, rooms]);

  // Update default deposit (default to 50% instead of 100%)
  useEffect(() => {
    if (grandTotal > 0) {
      if (depositAmount === 0 || depositAmount > grandTotal) {
        setDepositAmount(Math.round(grandTotal * 0.5));
      }
    }
  }, [grandTotal]);

  if (!isOpen) return null;

  // Deposit percentage calculations
  const effectivePaid = paymentStatus === 'paid' ? grandTotal : (paymentStatus === 'deposit' ? depositAmount : 0);
  const depositPercent = grandTotal > 0 ? Math.round((effectivePaid / grandTotal) * 100) : 0;
  const remainingAtCheckin = Math.max(0, grandTotal - effectivePaid);

  // Active bookings filter to check room conflicts (EXCLUDE checked_out and cancelled!)
  const activeBookings = (bookings || []).filter(b => !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out');

  // Helper: check if a room is occupied during the selected date range
  const isRoomOccupied = (roomId: string, rNum: string) => {
    return activeBookings.some(b => {
      if (b.roomId !== roomId && b.roomNumber !== rNum) return false;
      return checkInDate < b.checkOutDate && checkOutDate > b.checkInDate;
    });
  };

  const handleToggleRoom = (roomId: string) => {
    if (selectedRoomIds.includes(roomId)) {
      if (selectedRoomIds.length > 1) {
        setSelectedRoomIds(selectedRoomIds.filter(id => id !== roomId));
      }
    } else {
      setSelectedRoomIds([...selectedRoomIds, roomId]);
    }
  };

  const sanitizePhoneInput = (val: string) => {
    return val.replace(/[^0-9,\s-]/g, '');
  };

  const handleNextStep = (e: React.FormEvent) => {
    e.preventDefault();
    if (!guestName.trim()) {
      setGuestName('รอลูกค้าแจ้ง');
      setGuestPhone('-');
    }
    setCurrentStep(2);
  };

  const handleSetDepositPercent = (percent: number) => {
    const calculated = Math.round(grandTotal * (percent / 100));
    setDepositAmount(calculated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRooms.length === 0) return;

    const addOnsList: AddOnItem[] = [];
    if (extraBeds > 0) {
      addOnsList.push({
        id: 'eb-' + Date.now(),
        name: `ที่นอนเสริม (${extraBeds} ท่าน)`,
        category: 'bed',
        price: 300,
        quantity: extraBeds,
        createdAt: new Date().toISOString()
      });
    }
    if (mookataSmall > 0) {
      addOnsList.push({
        id: 'ms-' + Date.now(),
        name: `หมูกระทะชุดเล็ก (${mookataSmall} ชุด)`,
        category: 'mookata_small',
        price: 350,
        quantity: mookataSmall,
        createdAt: new Date().toISOString()
      });
    }
    if (mookataLarge > 0) {
      addOnsList.push({
        id: 'ml-' + Date.now(),
        name: `หมูกระทะชุดใหญ่ (${mookataLarge} ชุด)`,
        category: 'mookata_large',
        price: 500,
        quantity: mookataLarge,
        createdAt: new Date().toISOString()
      });
    }
    if (breakfast > 0) {
      addOnsList.push({
        id: 'bf-' + Date.now(),
        name: `อาหารเช้า (${breakfast} ท่าน)`,
        category: 'breakfast',
        price: 60,
        quantity: breakfast,
        createdAt: new Date().toISOString()
      });
    }

    const calculatedPaidAmount = paymentStatus === 'paid' 
      ? grandTotal 
      : (paymentStatus === 'deposit' ? (depositAmount > 0 ? depositAmount : Math.round(grandTotal * 0.5)) : 0);

    const isToday = checkInDate === defaultCheckIn;
    const bookingStatus = (autoCheckIn && isToday) ? 'checked_in' : (autoCheckIn ? 'checked_in' : 'confirmed');

    if (selectedRooms.length === 1) {
      // Single Room Booking
      const singleRoom = selectedRooms[0];
      const newBooking: Booking = {
        id: 'b-' + Date.now(),
        bookingCode: generateBookingCode(checkInDate),
        guestName: guestName.trim() || 'รอลูกค้าแจ้ง',
        guestPhone: guestPhone.trim() || '-',
        roomId: singleRoom.id,
        roomNumber: singleRoom.roomNumber,
        roomType: singleRoom.type,
        checkInDate,
        checkOutDate,
        checkInTime: checkInTime || '14:00',
        checkOutTime: checkOutTime || '12:00',
        totalNights,
        totalGuests: singleRoom.capacity || 2,
        roomPrice: roomPriceUnit,
        addOns: addOnsList,
        totalAmount: grandTotal,
        paidAmount: calculatedPaidAmount,
        paymentStatus: calculatedPaidAmount >= grandTotal ? 'paid' : (calculatedPaidAmount > 0 ? 'deposit' : 'pending'),
        status: bookingStatus,
        specialRequests: notes || undefined,
        createdAt: new Date().toISOString(),
        groupId: prefillGroupId,
        groupBookingCode: prefillGroupBookingCode,
      };

      onAddBooking(newBooking);
    } else {
      // Multi-Room Group Booking!
      const sharedGroupId = prefillGroupId || ('grp-' + Date.now());
      const sharedGroupCode = prefillGroupBookingCode || (`GRP-${checkInDate.replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`);
      const groupRoomNumbers = selectedRooms.map(r => r.roomNumber);

      const bookingsList: Booking[] = selectedRooms.map((room, index) => {
        const isPrimary = index === 0;
        const roomTotal = (room.pricePerNight * totalNights) + (isPrimary ? addOnsTotal : 0);
        const propShare = grandTotal > 0 ? (roomTotal / grandTotal) : (1 / selectedRooms.length);
        const roomPaidAmount = Math.round(calculatedPaidAmount * propShare);

        return {
          id: 'b-' + Date.now() + '-' + index,
          bookingCode: `${sharedGroupCode}-${room.roomNumber}`,
          guestName: guestName.trim() || 'รอลูกค้าแจ้ง',
          guestPhone: guestPhone.trim() || '-',
          roomId: room.id,
          roomNumber: room.roomNumber,
          roomType: room.type,
          checkInDate,
          checkOutDate,
          checkInTime: checkInTime || '14:00',
          checkOutTime: checkOutTime || '12:00',
          totalNights,
          totalGuests: room.capacity || 2,
          roomPrice: room.pricePerNight,
          addOns: isPrimary ? addOnsList : [],
          totalAmount: roomTotal,
          paidAmount: roomPaidAmount,
          paymentStatus: roomPaidAmount >= roomTotal ? 'paid' : (roomPaidAmount > 0 ? 'deposit' : 'pending'),
          status: bookingStatus,
          specialRequests: notes ? (isPrimary ? notes : `(กรุ๊ปร่วมกับ ${groupRoomNumbers.join(', ')}) ${notes}`) : `(จองแบบกลุ่ม ${groupRoomNumbers.join(', ')})`,
          createdAt: new Date().toISOString(),
          groupId: sharedGroupId,
          groupBookingCode: sharedGroupCode,
          groupRoomNumbers,
          isGroupPrimary: isPrimary,
        };
      });

      onAddBooking(bookingsList);
    }

    onClose();

    // Reset form
    setGuestName('');
    setGuestPhone('');
    setNotes('');
    setExtraBeds(0);
    setMookataSmall(0);
    setMookataLarge(0);
    setBreakfast(0);
    setDepositAmount(0);
    setSelectedRoomIds([]);
    setCurrentStep(1);
  };

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/70 backdrop-blur-sm overscroll-contain animate-in fade-in font-['Prompt']"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-white w-full sm:max-w-xl md:max-w-3xl lg:max-w-4xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden max-h-[92dvh] flex flex-col overscroll-contain"
      >
        {/* Modal Header */}
        <div className="p-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shrink-0 border border-emerald-500/30">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-bold text-white">บันทึกการจองห้องพัก</h3>
              <p className="text-slate-400 text-[11px] font-medium">Swan HILL Resort</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Navigation Pill Indicator (2 Steps) */}
        <div className="px-4 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setCurrentStep(1)}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentStep === 1
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${currentStep === 1 ? 'bg-white text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              1
            </span>
            <span>ลูกค้า & ห้องพัก</span>
          </button>

          <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />

          <button
            type="button"
            onClick={() => {
              if (!guestName.trim()) {
                setGuestName('รอลูกค้าแจ้ง');
                setGuestPhone('-');
              }
              setCurrentStep(2);
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              currentStep === 2
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 opacity-90'
            }`}
          >
            <span className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-black ${currentStep === 2 ? 'bg-white text-emerald-700' : 'bg-slate-200 text-slate-600'}`}>
              2
            </span>
            <span>อาหาร & ชำระเงิน</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* STEP 1: ลูกค้า & ห้องพัก (Who & Where)                                    */}
        {/* ========================================================================= */}
        {currentStep === 1 && (
          <form onSubmit={handleNextStep} className="p-4 sm:p-5 overflow-y-auto no-scrollbar text-slate-800 flex-1 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4">
              {/* Group Clone Notification Banner */}
              {prefillGroupId && (
                <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-2xl flex items-center justify-between gap-2 text-xs text-blue-900 font-bold">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>กำลังจองห้องเพิ่มให้: <strong className="text-blue-950">{guestName}</strong></span>
                  </div>
                  <span className="text-[10px] bg-blue-200/80 text-blue-800 px-2 py-0.5 rounded-full">
                    ผูกกลุ่มเดียวกัน
                  </span>
                </div>
              )}

              {/* Responsive 2-Column Grid on Larger Screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                
                {/* ── LEFT COLUMN: Guest Info & Room Selection ── */}
                <div className="space-y-3.5">
                  
                  {/* 1. Guest Name & Phone with Quick Hold Button */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                        <span>ข้อมูลลูกค้า (ใช้ร่วมกันทุกห้อง)</span>
                      </label>
                      
                      {/* Quick Hold button */}
                      <button
                        type="button"
                        onClick={() => {
                          if (guestName === 'รอลูกค้าแจ้ง') {
                            setGuestName('');
                            setGuestPhone('');
                          } else {
                            setGuestName('รอลูกค้าแจ้ง');
                            setGuestPhone('-');
                          }
                        }}
                        className={`text-[11px] px-2.5 py-1 rounded-xl font-bold transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                          guestName === 'รอลูกค้าแจ้ง'
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-amber-100/90 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        }`}
                        title="คลิกเพื่อล็อคห้องไว้ก่อน โดยยังไม่ต้องกรอกชื่อและเบอร์โทร"
                      >
                        <Sparkles className="w-3 h-3" />
                        <span>{guestName === 'รอลูกค้าแจ้ง' ? '✓ รอลูกค้าแจ้ง (ล็อคห้อง)' : '⚡ ยังไม่ระบุ (ค่อยใส่ทีหลัง)'}</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <input
                          type="text"
                          required
                          placeholder="ชื่อลูกค้า (เช่น คุณสมชาย)"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-white transition-all shadow-xs"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          placeholder="เบอร์โทรศัพท์ (ถ้ามี)"
                          value={guestPhone === '-' ? '' : guestPhone}
                          onChange={(e) => setGuestPhone(sanitizePhoneInput(e.target.value))}
                          className="w-full px-3 py-2 text-xs font-semibold border border-slate-300 rounded-xl focus:border-emerald-500 outline-none bg-white transition-all shadow-xs"
                        />
                      </div>
                    </div>

                    {guestName === 'รอลูกค้าแจ้ง' && (
                      <p className="text-[10px] text-amber-800 font-medium bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200">
                        ℹ️ ล็อคห้องไว้ก่อนเรียบร้อยแล้ว สามารถกดถัดไปได้ทันที และกลับมาใส่ชื่อจริงทีหลังได้
                      </p>
                    )}
                  </div>

                  {/* 2. Choose Room(s) */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                        <Home className="w-3.5 h-3.5 text-emerald-600" />
                        <span>เลือกบ้านพัก (แตะเลือกได้หลายหลัง) *</span>
                      </label>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border transition-all ${
                        selectedRoomIds.length > 1
                          ? 'text-emerald-800 bg-emerald-100 border-emerald-300 shadow-2xs'
                          : 'text-slate-600 bg-slate-100 border-slate-200'
                      }`}>
                        {selectedRoomIds.length > 1 ? `👥 จองกลุ่ม ${selectedRoomIds.length} หลัง` : 'จอง 1 หลัง'}
                      </span>
                    </div>

                    {/* Grid of 6 Houses */}
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {rooms.map(room => {
                        const isSelected = selectedRoomIds.includes(room.id);
                        const occupied = isRoomOccupied(room.id, room.roomNumber);

                        return (
                          <button
                            key={room.id}
                            type="button"
                            disabled={occupied}
                            onClick={() => handleToggleRoom(room.id)}
                            className={`p-2.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer active:scale-98 ${
                              occupied
                                ? 'opacity-40 bg-slate-100 border-slate-200 cursor-not-allowed'
                                : isSelected
                                ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white border-emerald-500 shadow-md ring-2 ring-emerald-400/60 scale-[1.02]'
                                : 'bg-white hover:bg-slate-50 text-slate-800 border-slate-200 hover:border-slate-300'
                            }`}
                          >
                            <div className="flex items-start justify-between w-full">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className={`w-6 h-6 rounded-lg flex items-center justify-center font-black text-xs shrink-0 ${
                                  isSelected ? 'bg-white text-emerald-800 shadow-xs' : 'bg-slate-900 text-white'
                                }`}>
                                  {room.roomNumber}
                                </span>
                                <span className={`text-[11px] font-bold truncate ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                                  {room.name}
                                </span>
                              </div>
                              {isSelected && (
                                <span className="w-4 h-4 rounded-full bg-white text-emerald-700 flex items-center justify-center shrink-0 ml-1">
                                  <Check className="w-3 h-3 stroke-[3]" />
                                </span>
                              )}
                            </div>

                            <div className="mt-2 flex items-center justify-between text-[10px]">
                              <span className={`font-black ${isSelected ? 'text-emerald-100' : 'text-emerald-700'}`}>
                                ฿{room.pricePerNight.toLocaleString()}/คืน
                              </span>
                              {occupied ? (
                                <span className="text-[9px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">
                                  ติดจอง
                                </span>
                              ) : (
                                <span className={`text-[9px] ${isSelected ? 'text-emerald-100' : 'text-slate-400'}`}>
                                  {room.capacity} ท่าน
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })}
                    </div>

                    {/* Selected Rooms Summary Banner */}
                    <div className={`p-2.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                      selectedRoomIds.length > 1
                        ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}>
                      <div className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>
                          {selectedRoomIds.length > 1
                            ? `เลือก ${selectedRoomIds.length} หลัง: ${selectedRooms.map(r => r.roomNumber).join(' + ')}`
                            : `เลือก 1 หลัง: ห้อง ${selectedRooms[0]?.roomNumber || ''}`}
                        </span>
                      </div>
                      <span className="font-extrabold text-emerald-800">
                        ฿{baseRoomPricePerNight.toLocaleString()} บาท/คืน
                      </span>
                    </div>
                  </div>

                  {/* 3. Price adjustment row */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium text-slate-600">
                        ราคาห้องต่อคืน:
                      </span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          placeholder={String(baseRoomPricePerNight)}
                          value={customPrice}
                          onChange={(e) => setCustomPrice(e.target.value)}
                          className="w-20 px-2 py-1 text-xs font-bold border border-slate-300 rounded-lg outline-none focus:border-emerald-500 bg-white"
                        />
                        <span className="text-xs text-slate-500">฿</span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-extrabold text-slate-900">
                        ฿{roomBaseTotal.toLocaleString()}
                      </span>
                      <span className="text-[10px] text-slate-500 ml-1 font-normal">
                        ({totalNights} คืน)
                      </span>
                    </div>
                  </div>

                </div>

                {/* ── RIGHT COLUMN: Dates & Nights + Times + Status ── */}
                <div className="space-y-3.5">
                  
                  {/* 4. Check-in & Check-out Dates & Nights (Spacious, Clear & Touch-friendly) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <Calendar className="w-4 h-4 text-emerald-600" />
                        <span>วันเข้าพัก & จำนวนคืน</span>
                      </span>
                      
                      {/* Fast Date Preset Chips */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setCheckInDate(defaultCheckIn);
                            setCheckOutDate(shiftDateStr(defaultCheckIn, totalNights));
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                            checkInDate === defaultCheckIn
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          วันนี้
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const tom = shiftDateStr(defaultCheckIn, 1);
                            setCheckInDate(tom);
                            setCheckOutDate(shiftDateStr(tom, totalNights));
                          }}
                          className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-all cursor-pointer ${
                            checkInDate === shiftDateStr(defaultCheckIn, 1)
                              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          พรุ่งนี้
                        </button>
                      </div>
                    </div>

                    {/* Check-in & Check-out 2 Large Date Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {/* Check-in Date */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block mb-0.5">
                          🟢 วันเช็คอิน (In)
                        </span>
                        <input
                          type="date"
                          required
                          value={checkInDate}
                          onChange={(e) => {
                            setCheckInDate(e.target.value);
                            if (e.target.value >= checkOutDate) {
                              setCheckOutDate(shiftDateStr(e.target.value, totalNights));
                            }
                          }}
                          className="w-full text-xs sm:text-sm font-black text-slate-900 bg-transparent outline-none cursor-pointer py-0.5"
                        />
                        <span className="text-xs text-emerald-700 font-bold block mt-0.5 truncate">
                          {formatThaiDate(checkInDate)}
                        </span>
                      </div>

                      {/* Check-out Date */}
                      <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-xs">
                        <span className="text-[11px] font-bold text-slate-500 block mb-0.5">
                          🔴 วันเช็คเอาท์ (Out)
                        </span>
                        <input
                          type="date"
                          required
                          value={checkOutDate}
                          min={shiftDateStr(checkInDate, 1)}
                          onChange={(e) => setCheckOutDate(e.target.value)}
                          className="w-full text-xs sm:text-sm font-black text-slate-900 bg-transparent outline-none cursor-pointer py-0.5"
                        />
                        <span className="text-xs text-slate-600 font-bold block mt-0.5 truncate">
                          {formatThaiDate(checkOutDate)}
                        </span>
                      </div>
                    </div>

                    {/* Prominent, Tactile Nights Stepper Controller (กดง่าย ชัดเจน ไม่เล็กอีกต่อไป) */}
                    <div className="bg-white p-2.5 sm:p-3 rounded-xl border border-emerald-200 shadow-xs flex flex-wrap items-center justify-between gap-2.5">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
                          <Moon className="w-4 h-4 text-emerald-600" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-slate-800 block">จำนวนคืนที่เข้าพัก</span>
                          <span className="text-[10px] text-slate-500 block">กดปุ่ม + / - หรือเลือกคืน</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        {/* Quick Nights Chips */}
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4].map(n => (
                            <button
                              key={n}
                              type="button"
                              onClick={() => setCheckOutDate(shiftDateStr(checkInDate, n))}
                              className={`px-2 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                                totalNights === n
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              }`}
                            >
                              {n} คืน
                            </button>
                          ))}
                        </div>

                        {/* Big +/- Stepper */}
                        <div className="flex items-center bg-emerald-50 border border-emerald-300 rounded-xl p-0.5 shadow-2xs">
                          <button
                            type="button"
                            onClick={() => {
                              if (totalNights > 1) {
                                setCheckOutDate(shiftDateStr(checkInDate, totalNights - 1));
                              }
                            }}
                            disabled={totalNights <= 1}
                            className="w-8 h-8 rounded-lg bg-white text-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-emerald-100 flex items-center justify-center font-black shadow-2xs active:scale-95 transition-all cursor-pointer"
                            title="ลดจำนวนคืน"
                          >
                            <Minus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>

                          <div className="px-2.5 min-w-[44px] text-center">
                            <span className="text-base font-black text-emerald-950 block leading-tight">{totalNights}</span>
                            <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-tight block leading-none">คืน</span>
                          </div>

                          <button
                            type="button"
                            onClick={() => setCheckOutDate(shiftDateStr(checkInDate, totalNights + 1))}
                            className="w-8 h-8 rounded-lg bg-white text-emerald-800 hover:bg-emerald-100 flex items-center justify-center font-black shadow-2xs active:scale-95 transition-all cursor-pointer"
                            title="เพิ่มจำนวนคืน"
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[3]" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Resort Time Presets (Default 14:00 บ่ายสองปกติ) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-200">
                      {/* Check-in Time */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-emerald-600" />
                            <span>เวลาเข้าพัก</span>
                          </span>
                          <span className="text-xs font-black text-emerald-800">{checkInTime} น.</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {['14:00', '13:00', '15:00'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setCheckInTime(t)}
                              className={`text-xs px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                checkInTime === t
                                  ? 'bg-emerald-600 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {t}{t === '14:00' ? ' (ปกติ)' : ''}
                            </button>
                          ))}
                          <button
                            type="button"
                            onClick={() => setCheckInTime(getCurrentTimeString())}
                            className="text-xs px-2 py-1 rounded-lg font-bold bg-white text-slate-700 border border-slate-200 hover:bg-slate-100 cursor-pointer"
                            title="เวลาตอนนี้"
                          >
                            ตอนนี้
                          </button>
                        </div>
                      </div>

                      {/* Check-out Time */}
                      <div>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5 text-slate-500" />
                            <span>เวลาออก</span>
                          </span>
                          <span className="text-xs font-black text-slate-900">{checkOutTime} น.</span>
                        </div>
                        <div className="flex items-center gap-1 flex-wrap">
                          {['12:00', '11:00', '13:00'].map(t => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => setCheckOutTime(t)}
                              className={`text-xs px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                                checkOutTime === t
                                  ? 'bg-slate-800 text-white shadow-xs'
                                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-100'
                              }`}
                            >
                              {t}{t === '12:00' ? ' (ปกติ)' : ''}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 5. Booking Mode Selector (จองล่วงหน้า vs เช็คอินทันที) */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">
                      สถานะการเข้าพัก <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setAutoCheckIn(false)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          !autoCheckIn
                            ? 'bg-white border-blue-500 ring-2 ring-blue-500/20 shadow-xs'
                            : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${!autoCheckIn ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-500'}`}>
                          📅
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-extrabold block truncate ${!autoCheckIn ? 'text-slate-900' : 'text-slate-600'}`}>จองล่วงหน้า</span>
                          <span className="text-[10px] text-slate-500 block truncate">รอลูกค้ามาเช็คอิน</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setAutoCheckIn(true)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex items-center gap-2.5 ${
                          autoCheckIn
                            ? 'bg-emerald-50 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs'
                            : 'bg-white/80 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 ${autoCheckIn ? 'bg-emerald-200 text-emerald-900' : 'bg-slate-100 text-slate-500'}`}>
                          🔑
                        </div>
                        <div className="min-w-0">
                          <span className={`text-xs font-extrabold block truncate ${autoCheckIn ? 'text-emerald-950' : 'text-slate-600'}`}>เช็คอินทันที</span>
                          <span className="text-[10px] text-emerald-700 font-bold block truncate">ลูกค้าถึงแล้ว (เข้าพักเลย)</span>
                        </div>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Step 1 Action */}
            <div className="pt-3 border-t border-slate-200 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={onClose}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs sm:text-sm hover:bg-slate-100 transition-colors cursor-pointer"
              >
                ยกเลิก
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <span>ถัดไป: อาหาร & ชำระเงิน</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </form>
        )}

        {/* ========================================================================= */}
        {/* STEP 2: อาหาร & ชำระเงิน (Add-ons & Payment)                              */}
        {/* ========================================================================= */}
        {currentStep === 2 && (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto no-scrollbar text-slate-800 flex-1 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4">
              {/* Summary Tag Header */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="flex -space-x-1.5 overflow-hidden">
                    {selectedRooms.map(r => (
                      <HouseLogo key={r.id} roomNumber={r.roomNumber} size="sm" />
                    ))}
                  </div>
                  <div>
                    <span className="font-bold text-slate-900 block">
                      {selectedRooms.length > 1 
                        ? `กรุ๊ป ${selectedRooms.length} หลัง: บ้าน ${selectedRooms.map(r => r.roomNumber).join(' + ')}`
                        : `บ้าน ${primaryRoom.roomNumber} (${primaryRoom.name})`
                      }
                    </span>
                    <span className="text-[11px] text-slate-500 block">
                      ลูกค้า: <strong className="text-slate-700">{guestName}</strong> &bull; {totalNights} คืน ({formatThaiDate(checkInDate)} - {formatThaiDate(checkOutDate)})
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-500 block">ยอดรวมเบื้องต้น</span>
                  <span className="text-sm font-black text-emerald-800">
                    ฿{grandTotal.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Responsive 2-Column Grid on Larger Screens */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                
                {/* ── LEFT COLUMN: Add-ons & Notes ── */}
                <div className="space-y-3.5">
                  
                  {/* 1. Add-on Services & Food (Steppers) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <UtensilsCrossed className="w-3.5 h-3.5 text-amber-600" />
                        <span>อาหาร & บริการเสริมสั่งล่วงหน้า</span>
                      </span>
                      <span className="text-[10px] text-slate-400 font-normal">กด + / - เพื่อปรับจำนวน</span>
                    </div>

                    <div className="space-y-2">
                      {/* Extra Bed (+300) */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                            <Bed className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">ที่นอนเสริม</span>
                            <span className="text-[10px] text-slate-500">฿300 / ท่าน</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setExtraBeds(Math.max(0, extraBeds - 1))}
                            disabled={extraBeds === 0}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer ${
                              extraBeds > 0 ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-black text-sm text-slate-900">{extraBeds}</span>
                          <button
                            type="button"
                            onClick={() => setExtraBeds(extraBeds + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mookata Small (+350) */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">หมูกระทะ (ชุดเล็ก)</span>
                            <span className="text-[10px] text-slate-500">฿350 / ชุด</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMookataSmall(Math.max(0, mookataSmall - 1))}
                            disabled={mookataSmall === 0}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer ${
                              mookataSmall > 0 ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-black text-sm text-slate-900">{mookataSmall}</span>
                          <button
                            type="button"
                            onClick={() => setMookataSmall(mookataSmall + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Mookata Large (+500) */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                            <Sparkles className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">หมูกระทะ (ชุดใหญ่)</span>
                            <span className="text-[10px] text-slate-500">฿500 / ชุด</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMookataLarge(Math.max(0, mookataLarge - 1))}
                            disabled={mookataLarge === 0}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer ${
                              mookataLarge > 0 ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-black text-sm text-slate-900">{mookataLarge}</span>
                          <button
                            type="button"
                            onClick={() => setMookataLarge(mookataLarge + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Breakfast (+60) */}
                      <div className="flex items-center justify-between bg-white p-2.5 rounded-xl border border-slate-200 hover:border-slate-300 transition-colors">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
                            <UtensilsCrossed className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-slate-900 block">อาหารเช้าเพิ่มเติม</span>
                            <span className="text-[10px] text-slate-500">฿60 / ท่าน</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setBreakfast(Math.max(0, breakfast - 1))}
                            disabled={breakfast === 0}
                            className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold active:scale-90 transition-transform cursor-pointer ${
                              breakfast > 0 ? 'bg-slate-100 text-slate-700 hover:bg-slate-200' : 'bg-slate-50 text-slate-300 cursor-not-allowed'
                            }`}
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center font-black text-sm text-slate-900">{breakfast}</span>
                          <button
                            type="button"
                            onClick={() => setBreakfast(breakfast + 1)}
                            className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold hover:bg-emerald-700 active:scale-90 transition-transform cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Notes (Optional) */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                    <label className="block text-xs font-bold text-slate-900">
                      หมายเหตุเพิ่มเติม (ถ้ามี)
                    </label>
                    <input
                      type="text"
                      placeholder="เช่น ขอเตาปิ้งย่าง หรือขอเช็คอินเร็ว"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3 py-2 text-xs border border-slate-200 rounded-xl focus:border-emerald-500 outline-none bg-white shadow-xs font-medium"
                    />
                  </div>

                </div>

                {/* ── RIGHT COLUMN: Calculation & Payment Status ── */}
                <div className="space-y-3.5">
                  
                  {/* Total Calculation Summary Box */}
                  <div className="p-3.5 bg-emerald-50/90 rounded-2xl border border-emerald-200 space-y-1.5 text-xs shadow-xs">
                    <div className="flex justify-between text-slate-700">
                      <span>ค่าห้องพัก ({totalNights} คืน):</span>
                      <span className="font-bold">฿{roomBaseTotal.toLocaleString()}</span>
                    </div>
                    {addOnsTotal > 0 && (
                      <div className="flex justify-between text-slate-700">
                        <span>ค่าบริการเสริม & อาหาร:</span>
                        <span className="font-bold text-emerald-800">+฿{addOnsTotal.toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center text-slate-900 font-black text-sm pt-2 border-t border-emerald-200">
                      <span>ยอดเงินรวมทั้งสิ้น:</span>
                      <span className="text-base text-emerald-950">฿{grandTotal.toLocaleString()} บาท</span>
                    </div>
                  </div>

                  {/* Payment Status */}
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                    <label className="block text-xs font-bold text-slate-900">
                      การชำระเงิน <span className="text-red-500">*</span>
                    </label>

                    {/* 3 Payment Options Grid */}
                    <div className="grid grid-cols-3 gap-2">
                      {/* Option 1: จ่ายมัดจำ */}
                      <button
                        type="button"
                        onClick={() => {
                          setPaymentStatus('deposit');
                          if (depositAmount === 0 || depositAmount >= grandTotal) {
                            setDepositAmount(Math.round(grandTotal * 0.5));
                          }
                        }}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer relative ${
                          paymentStatus === 'deposit'
                            ? 'bg-amber-50 border-amber-500 shadow-xs ring-2 ring-amber-500/30 text-amber-950'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Coins className={`w-5 h-5 mx-auto mb-1 ${paymentStatus === 'deposit' ? 'text-amber-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold block">จ่ายมัดจำ</span>
                        <span className="text-[10px] text-amber-800 font-bold block mt-0.5">
                          ฿{depositAmount.toLocaleString()} ({depositPercent}%)
                        </span>
                      </button>

                      {/* Option 2: ชำระครบ 100% */}
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('paid')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentStatus === 'paid'
                            ? 'bg-emerald-50 border-emerald-500 shadow-xs ring-2 ring-emerald-500/30 text-emerald-950'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <CreditCard className={`w-5 h-5 mx-auto mb-1 ${paymentStatus === 'paid' ? 'text-emerald-600' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold block">ชำระครบ 100%</span>
                        <span className="text-[10px] text-emerald-800 font-bold block mt-0.5">
                          ฿{grandTotal.toLocaleString()}
                        </span>
                      </button>

                      {/* Option 3: รอเก็บเงิน */}
                      <button
                        type="button"
                        onClick={() => setPaymentStatus('pending')}
                        className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer ${
                          paymentStatus === 'pending'
                            ? 'bg-slate-100 border-slate-500 shadow-xs ring-2 ring-slate-500/30 text-slate-900'
                            : 'bg-white border-slate-200 hover:border-slate-300 text-slate-700'
                        }`}
                      >
                        <Clock className={`w-5 h-5 mx-auto mb-1 ${paymentStatus === 'pending' ? 'text-slate-700' : 'text-slate-400'}`} />
                        <span className="text-xs font-bold block">รอเก็บเงิน</span>
                        <span className="text-[10px] text-slate-500 font-bold block mt-0.5">
                          เก็บวันเข้าพัก
                        </span>
                      </button>
                    </div>

                    {/* Fixed-Height Payment Detail Container */}
                    <div className="p-3 rounded-2xl border bg-white border-slate-200 min-h-[96px] flex flex-col justify-center transition-all">
                      {paymentStatus === 'deposit' && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-amber-950 flex items-center gap-1">
                              <span>ยอดมัดจำ:</span>
                              <span className="text-amber-800 font-extrabold">฿{depositAmount.toLocaleString()}</span>
                              <span className="text-[11px] text-slate-500 font-normal">({depositPercent}%)</span>
                            </span>

                            {/* 30%, 50% quick chips */}
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => handleSetDepositPercent(30)}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                  depositPercent === 30
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50'
                                }`}
                              >
                                30% (฿{Math.round(grandTotal * 0.3).toLocaleString()})
                              </button>
                              <button
                                type="button"
                                onClick={() => handleSetDepositPercent(50)}
                                className={`text-[10px] px-2 py-0.5 rounded-md font-bold transition-all cursor-pointer ${
                                  depositPercent === 50
                                    ? 'bg-amber-500 text-white shadow-xs'
                                    : 'bg-white text-slate-700 border border-slate-300 hover:bg-amber-50'
                                }`}
                              >
                                50% (฿{Math.round(grandTotal * 0.5).toLocaleString()})
                              </button>
                            </div>
                          </div>

                          <div className="flex items-center justify-between gap-2 pt-1 border-t border-amber-200/60">
                            <div className="flex items-center gap-1.5 text-xs text-slate-700">
                              <span className="text-[11px] font-medium">ระบุยอดเอง:</span>
                              <div className="flex items-center bg-slate-50 border border-slate-300 rounded-lg px-2 py-0.5 shadow-xs">
                                <span className="text-slate-400 text-xs mr-1">฿</span>
                                <input
                                  type="number"
                                  min="1"
                                  max={grandTotal}
                                  value={depositAmount}
                                  onChange={(e) => setDepositAmount(Math.min(grandTotal, Math.max(0, Number(e.target.value) || 0)))}
                                  className="w-20 text-xs font-black text-amber-900 outline-none bg-transparent"
                                />
                              </div>
                            </div>
                            <span className="text-[11px] text-slate-600 font-medium">
                              เหลือเก็บวันเข้าพัก: <strong className="text-slate-900 font-bold">฿{remainingAtCheckin.toLocaleString()}</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {paymentStatus === 'paid' && (
                        <div className="flex items-center gap-2.5 text-xs text-emerald-900 py-1">
                          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
                            ✓
                          </div>
                          <div>
                            <span className="font-extrabold block text-emerald-950">ชำระเต็มจำนวนแล้ว 100%</span>
                            <span className="text-[11px] text-emerald-700 font-medium">
                              รับชำระวันนี้ ฿{grandTotal.toLocaleString()} &bull; ไม่มียอดค้างชำระในวันเช็คอิน
                            </span>
                          </div>
                        </div>
                      )}

                      {paymentStatus === 'pending' && (
                        <div className="flex items-center gap-2.5 text-xs text-slate-800 py-1">
                          <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-black shrink-0">
                            ⏳
                          </div>
                          <div>
                            <span className="font-extrabold block text-slate-900">รอชำระเงินในวันเข้าพัก</span>
                            <span className="text-[11px] text-slate-500 font-medium">
                              ยังไม่มีการรับเงินมัดจำล่วงหน้า &bull; จะเรียกเก็บยอดรวม ฿{grandTotal.toLocaleString()} ในวันเช็คอิน
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                </div>

              </div>
            </div>

            {/* Bottom Step 2 Actions */}
            <div className="pt-3 border-t border-slate-200 flex gap-3 shrink-0">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="w-1/3 py-2.5 rounded-xl border border-slate-200 text-slate-700 font-bold text-xs sm:text-sm hover:bg-slate-100 flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>ย้อนกลับ</span>
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-bold text-xs sm:text-sm shadow-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>
                  {selectedRoomIds.length > 1 
                    ? `ยืนยันจอง ${selectedRoomIds.length} หลัง (รับ ฿${effectivePaid.toLocaleString()})` 
                    : `ยืนยันบันทึกจอง (รับ ฿${effectivePaid.toLocaleString()})`}
                </span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
