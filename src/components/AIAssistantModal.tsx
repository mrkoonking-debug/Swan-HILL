import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Sparkles, 
  X, 
  Send, 
  CheckCircle2, 
  AlertCircle, 
  Edit3, 
  Phone, 
  Calendar, 
  Home, 
  CreditCard, 
  UtensilsCrossed, 
  RotateCcw,
  Check,
  Bot,
  FileText,
  Plus
} from 'lucide-react';
import type { Room, Booking } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';
import { useLockBodyScroll } from '../hooks/useLockBodyScroll';
import { 
  parseThaiBookingText, 
  createBookingsFromIntent, 
  type ParsedBookingIntent 
} from '../services/aiBookingService';

interface AIAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  rooms: Room[];
  bookings: Booking[];
  onAddBooking: (newBookings: Booking | Booking[]) => void;
  onOpenNewBookingWithPrefill?: (
    roomId?: string, 
    checkIn?: string, 
    checkOut?: string, 
    guestName?: string, 
    guestPhone?: string
  ) => void;
  onOpenReceipt?: (booking: Booking) => void;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text?: string;
  intent?: ParsedBookingIntent;
  confirmed?: boolean;
  createdBooking?: Booking;
}

interface BookingTemplate {
  id: string;
  icon: string;
  label: string;
  badge?: string;
  text: string;
}

const BOOKING_TEMPLATES: BookingTemplate[] = [
  {
    id: 'single-room',
    icon: '🏠',
    label: 'จอง 1 ห้อง',
    badge: 'ยอดนิยม',
    text: 'จองห้อง S1 วันที่ 26 ก.ย. ชื่อ คุณสมชาย โทร. 0812345678 มัดจำ 1,000 บาท',
  },
  {
    id: 'multi-room',
    icon: '🏘️',
    label: 'จอง 2 ห้อง',
    badge: '2 ห้อง',
    text: 'ลูกค้า 4 ท่าน 2 ห้อง (01 กับ 02) วันที่ 26 ก.ย. ชื่อ พันธิตรา (ออย) โทร. 0839507264',
  },
  {
    id: 'mookata',
    icon: '🥩',
    label: 'จอง + หมูกระทะ',
    badge: 'อาหาร',
    text: 'จองห้อง S3 วันที่ 15 ต.ค. คุณวิภา โทร. 0891112222 สั่งหมูกระทะชุดใหญ่ 1 ชุด มัดจำ 1,000 บาท',
  },
  {
    id: 'extra-bed',
    icon: '🛏️',
    label: 'จอง + เสริมเตียง',
    badge: 'เตียงเสริม',
    text: 'บ้านหลังที่ 4 วันที่ 12 ต.ค. 2,000 บาท เสริมที่นอน 2 คน คุณกานต์ โทร. 0823456789 โอนมัดจำแล้ว 1,000 บาท',
  },
  {
    id: 'paid-full',
    icon: '💰',
    label: 'ชำระเงินครบแล้ว',
    badge: 'จ่ายครบ',
    text: 'บ้านหลังที่ 2 และหลังที่ 3 วันที่ 18 ต.ค. คุณสุชาติ โทร. 0851234567 โอนตังค์มาให้หมดแล้ว',
  },
  {
    id: 'check-vacant',
    icon: '🔍',
    label: 'เช็คห้องว่าง',
    badge: 'สอบถาม',
    text: 'วันนี้มีห้องไหนว่างบ้าง?',
  },
];

const QUICK_INSERT_CHIPS = [
  { label: 'ห้อง S1', snippet: 'ห้อง S1' },
  { label: 'ห้อง S2', snippet: 'ห้อง S2' },
  { label: 'ห้อง S3', snippet: 'ห้อง S3' },
  { label: 'ห้อง S4', snippet: 'ห้อง S4' },
  { label: 'ห้อง S5', snippet: 'ห้อง S5' },
  { label: 'ห้อง S6', snippet: 'ห้อง S6' },
  { label: 'วันนี้', snippet: 'วันนี้' },
  { label: 'พรุ่งนี้', snippet: 'พรุ่งนี้' },
  { label: 'หมูกระทะชุดใหญ่', snippet: 'หมูกระทะชุดใหญ่ 1 ชุด' },
  { label: 'หมูกระทะชุดเล็ก', snippet: 'หมูกระทะชุดเล็ก 1 ชุด' },
  { label: 'เสริมที่นอน 1 คน', snippet: 'เสริมที่นอน 1 คน' },
  { label: 'มัดจำ 50%', snippet: 'มัดจำแล้ว 50%' },
  { label: 'จ่ายครบแล้ว', snippet: 'โอนตังค์มาให้หมดแล้ว' },
];

export const AIAssistantModal: React.FC<AIAssistantModalProps> = ({
  isOpen,
  onClose,
  rooms,
  bookings,
  onAddBooking,
  onOpenNewBookingWithPrefill,
  onOpenReceipt,
}) => {
  useLockBodyScroll(isOpen);

  const [input, setInput] = useState('');
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [showHelperHint, setShowHelperHint] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: 'สวัสดีครับ! ผมคือผู้ช่วย AI ของ Swan HILL Resort\n\nพนักงานสามารถเลือก "เทมเพลตด้านล่าง" เพื่อนำข้อความลงช่องพิมพ์แล้วปรับแก้ หรือ "ก็อปปี้แชทจาก LINE" มาวางได้เลยครับ\n(ระบบจะดึงห้อง, ชื่อลูกค้า, เบอร์โทร, วันที่ และเงินมัดจำมาแสดงในหน้าจอตรวจสอบความถูกต้องครับ ✨)'
    }
  ]);

  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleApplyTemplate = (tmpl: BookingTemplate) => {
    setInput(tmpl.text);
    setActiveTemplateId(tmpl.id);
    setShowHelperHint(true);
    setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(tmpl.text.length, tmpl.text.length);
    }, 50);
  };

  const handleAppendChip = (snippet: string) => {
    setInput(prev => {
      const trimmed = prev.trim();
      return trimmed ? `${trimmed} ${snippet}` : snippet;
    });
    setShowHelperHint(true);
    setTimeout(() => {
      inputRef.current?.focus();
    }, 50);
  };

  const handleClearInput = () => {
    setInput('');
    setActiveTemplateId(null);
    setShowHelperHint(false);
    inputRef.current?.focus();
  };

  const handleSendMessage = (textToSend?: string) => {
    const messageText = (textToSend || input).trim();
    if (!messageText || isProcessing) return;

    const userMsgId = 'user-' + Date.now();
    const newMessages: ChatMessage[] = [
      ...messages,
      { id: userMsgId, sender: 'user', text: messageText }
    ];
    setMessages(newMessages);
    setInput('');
    setActiveTemplateId(null);
    setShowHelperHint(false);
    setIsProcessing(true);

    // Simulate snappy AI response time
    setTimeout(() => {
      const parseResult = parseThaiBookingText(messageText, rooms, bookings);

      if (parseResult.type === 'booking') {
        setMessages(prev => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            sender: 'ai',
            text: 'ผมสกัดข้อมูลการจองให้เรียบร้อยแล้วครับ! โปรดตรวจสอบความถูกต้องด้านล่างนี้ก่อนกดยืนยันครับ 👇',
            intent: parseResult
          }
        ]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: 'ai-' + Date.now(),
            sender: 'ai',
            text: parseResult.message
          }
        ]);
      }
      setIsProcessing(false);
    }, 400);
  };

  const handleConfirmSave = (msgId: string, intent: ParsedBookingIntent) => {
    const created = createBookingsFromIntent(intent, rooms);
    onAddBooking(created);

    // Update message state to show confirmed
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        return {
          ...m,
          confirmed: true,
          createdBooking: created[0]
        };
      }
      return m;
    }));
  };

  const handleEditInModal = (intent: ParsedBookingIntent) => {
    if (onOpenNewBookingWithPrefill) {
      const room = rooms.find(r => r.roomNumber === intent.roomNumbers[0]);
      onOpenNewBookingWithPrefill(
        room?.id,
        intent.checkInDate,
        intent.checkOutDate,
        intent.guestName,
        intent.guestPhone
      );
      onClose();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        id: 'welcome-' + Date.now(),
        sender: 'ai',
        text: 'เริ่มต้นการสนทนาใหม่แล้วครับ! พิมพ์หรือวางข้อความเพื่อลงการจองห้องพักได้เลยครับ ✨'
      }
    ]);
  };

  return createPortal(
    <div 
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-slate-900 text-white w-full sm:max-w-xl rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-700 overflow-hidden h-[92dvh] sm:h-[86vh] flex flex-col animate-in slide-in-from-bottom-6 duration-200"
      >
        {/* Top Header Bar */}
        <div className="p-3.5 sm:p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center shadow-xs">
              <Sparkles className="w-5 h-5 fill-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm sm:text-base font-black text-white">ผู้ช่วย AI จองห้องพัก</h3>
                <span className="text-[9px] font-extrabold bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  Swan HILL
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                พิมพ์หรือก็อปปี้แชทเพื่อลงข้อมูลอัตโนมัติ
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleResetChat}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="เริ่มแชทใหม่"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-all cursor-pointer"
              title="ปิดหน้าต่าง"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Chat Stream Area */}
        <div className="flex-1 p-3 sm:p-4 overflow-y-auto space-y-3.5 bg-slate-900/60 no-scrollbar">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'} animate-in fade-in duration-200`}
            >
              {/* Message Bubble */}
              <div className={`max-w-[88%] sm:max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs sm:text-sm leading-relaxed ${
                msg.sender === 'user'
                  ? 'bg-emerald-600 text-white rounded-br-none shadow-xs font-medium'
                  : 'bg-slate-800 text-slate-100 rounded-bl-none border border-slate-700 shadow-sm whitespace-pre-line'
              }`}>
                {msg.text}
              </div>

              {/* VERIFICATION & REVIEW SCREEN CARD (หน้าตรวจสอบความถูกต้อง) */}
              {msg.intent && (
                <div className="w-full max-w-[96%] sm:max-w-[92%] mt-3 bg-white text-slate-900 rounded-2xl sm:rounded-3xl border-2 border-emerald-500 shadow-xl overflow-hidden animate-in zoom-in-95 duration-200">
                  
                  {/* Review Header Banner */}
                  <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-3 sm:p-3.5 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-white/20 flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-emerald-200" />
                      </div>
                      <div>
                        <span className="text-xs sm:text-sm font-black block">
                          หน้าจอตรวจสอบข้อมูลการจอง (Review)
                        </span>
                        <span className="text-[10px] text-emerald-100">
                          โปรดตรวจสอบก่อนกดยืนยันบันทึกเข้าระบบ
                        </span>
                      </div>
                    </div>

                    <span className="text-[11px] font-black bg-white text-emerald-900 px-2 py-0.5 rounded-full shadow-2xs">
                      {msg.intent.roomNumbers.join(' + ')}
                    </span>
                  </div>

                  {/* Room Conflict Warning if occupied */}
                  {!msg.intent.isRoomAvailable && (
                    <div className="p-2.5 bg-rose-50 border-b border-rose-200 text-rose-800 text-xs flex items-center gap-2 font-bold">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                      <span>{msg.intent.conflictDetails || 'ห้องดังกล่าวมีคนจองแล้วในบางช่วงวัน!'}</span>
                    </div>
                  )}

                  {/* Structured Details Summary Grid */}
                  <div className="p-3 sm:p-4 space-y-2.5 text-xs">
                    {/* Guest and Phone */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ชื่อผู้เข้าพัก</span>
                        <span className="font-black text-slate-900 text-xs sm:text-sm">
                          {msg.intent.guestName}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">เบอร์โทรศัพท์</span>
                        <span className="font-black text-blue-600 text-xs sm:text-sm flex items-center gap-1">
                          <Phone className="w-3 h-3" />
                          {msg.intent.guestPhone}
                        </span>
                      </div>
                    </div>

                    {/* Room and Dates */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">บ้านพัก</span>
                        <span className="font-black text-slate-900 flex items-center gap-1">
                          <Home className="w-3.5 h-3.5 text-emerald-600" />
                          ห้อง {msg.intent.roomNumbers.join(', ')}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold block">ระยะเวลาเข้าพัก</span>
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-amber-600" />
                          {formatThaiDate(msg.intent.checkInDate)} - {formatThaiDate(msg.intent.checkOutDate)} ({msg.intent.totalNights} คืน)
                        </span>
                      </div>
                    </div>

                    {/* Add-ons if any */}
                    {msg.intent.addOns.length > 0 && (
                      <div className="p-2.5 bg-amber-50/80 rounded-xl border border-amber-200">
                        <span className="text-[10px] font-black text-amber-900 flex items-center gap-1 mb-1">
                          <UtensilsCrossed className="w-3 h-3 text-amber-700" />
                          บริการเสริม / หมูกระทะ:
                        </span>
                        <div className="space-y-0.5">
                          {msg.intent.addOns.map((a, i) => (
                            <div key={i} className="flex items-center justify-between text-slate-700 font-semibold text-[11px]">
                              <span>• {a.name}</span>
                              <span className="font-black text-amber-900">฿{(a.price * a.quantity).toLocaleString()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Pricing & Deposit Summary */}
                    <div className="p-2.5 bg-emerald-50/70 rounded-xl border border-emerald-200 flex items-center justify-between">
                      <div>
                        <span className="text-[10px] text-emerald-800 font-bold block flex items-center gap-1">
                          <CreditCard className="w-3 h-3" /> ยอดรวมทั้งสิ้น
                        </span>
                        <span className="text-sm font-black text-emerald-950">
                          ฿{msg.intent.estimatedTotal.toLocaleString()} บาท
                        </span>
                      </div>

                      <div className="text-right">
                        <span className="text-[10px] text-slate-500 font-bold block">
                          {msg.intent.paymentStatus === 'paid' ? 'ชำระเต็มจำนวน' : `มัดจำแล้ว (ค้าง ฿${Math.max(0, msg.intent.estimatedTotal - msg.intent.depositAmount).toLocaleString()})`}
                        </span>
                        <span className="text-xs font-black text-blue-700">
                          ฿{msg.intent.depositAmount.toLocaleString()} บาท
                        </span>
                      </div>
                    </div>

                  </div>

                  {/* Actions Bar inside Review Card */}
                  <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2">
                    {msg.confirmed ? (
                      <div className="w-full py-2.5 bg-emerald-100 text-emerald-900 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-2 border border-emerald-300">
                        <Check className="w-4 h-4 text-emerald-700 stroke-[3]" />
                        <span>บันทึกเข้าระบบเรียบร้อยแล้ว</span>
                        {msg.createdBooking && onOpenReceipt && (
                          <button
                            type="button"
                            onClick={() => {
                              onOpenReceipt(msg.createdBooking!);
                              onClose();
                            }}
                            className="ml-2 px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-bold cursor-pointer"
                          >
                            ดูใบเสร็จ
                          </button>
                        )}
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleEditInModal(msg.intent!)}
                          className="flex-1 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 active:scale-95 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>แก้ไขข้อมูล</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleConfirmSave(msg.id, msg.intent!)}
                          className="flex-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md transition-all cursor-pointer"
                        >
                          <Check className="w-4 h-4 stroke-[3]" />
                          <span>✓ ยืนยันบันทึกทันที</span>
                        </button>
                      </>
                    )}
                  </div>

                </div>
              )}

            </div>
          ))}

          {isProcessing && (
            <div className="flex items-center gap-2 text-slate-400 text-xs p-2">
              <Bot className="w-4 h-4 animate-bounce text-emerald-400" />
              <span>AI กำลังอ่านและประมวลผลข้อมูล...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Templates Bar (แถบเทมเพลตตัวอย่าง - กดเพื่อเลือกโหลด ยังไม่ส่งทันที) */}
        <div className="bg-slate-950 border-t border-slate-800 shrink-0">
          <div className="px-3 pt-2 pb-1 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-300 font-bold">
              <FileText className="w-3.5 h-3.5 text-emerald-400" />
              <span>เทมเพลตสำเร็จรูป</span>
              <span className="text-[10px] text-slate-400 font-normal hidden sm:inline">(กดเพื่อโหลดลงช่องพิมพ์ ยังไม่ส่งทันที)</span>
            </div>
            {input && (
              <button
                type="button"
                onClick={handleClearInput}
                className="text-[10px] text-slate-400 hover:text-rose-400 flex items-center gap-1 cursor-pointer transition-colors"
                title="ล้างข้อความในช่องพิมพ์"
              >
                <RotateCcw className="w-3 h-3" /> ล้างช่องพิมพ์
              </button>
            )}
          </div>

          {/* Horizontally scrollable template cards ("เลือกเลื่อนทีละอัน") */}
          <div className="px-3 pb-2 overflow-x-auto no-scrollbar flex items-center gap-2">
            {BOOKING_TEMPLATES.map((tmpl) => {
              const isSelected = activeTemplateId === tmpl.id;
              return (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => handleApplyTemplate(tmpl)}
                  className={`shrink-0 flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-left transition-all cursor-pointer active:scale-95 ${
                    isSelected
                      ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-xs'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
                  }`}
                  title={tmpl.text}
                >
                  <span className="text-sm">{tmpl.icon}</span>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[11px] font-bold block">{tmpl.label}</span>
                      {tmpl.badge && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-slate-800 text-emerald-400 font-semibold border border-slate-700">
                          {tmpl.badge}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Quick Insert Sub-row ("เลือกเลื่อนเติมทีละอัน") */}
          <div className="px-3 py-1.5 bg-slate-900/90 border-t border-slate-800/80 overflow-x-auto no-scrollbar flex items-center gap-1.5 text-[10px]">
            <span className="text-slate-400 font-bold shrink-0 flex items-center gap-1">
              <Plus className="w-3 h-3 text-emerald-400" /> แตะเติมคำ:
            </span>
            {QUICK_INSERT_CHIPS.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleAppendChip(chip.snippet)}
                className="shrink-0 px-2 py-0.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-emerald-300 border border-slate-700/70 cursor-pointer active:scale-95 transition-all font-medium"
              >
                + {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Helper Hint when template is loaded */}
        {showHelperHint && input && (
          <div className="px-3.5 py-1 bg-emerald-950/70 border-t border-emerald-800/50 text-[11px] text-emerald-300 flex items-center justify-between shrink-0 animate-in fade-in">
            <span className="truncate">💡 โหลดเทมเพลตแล้ว — แก้ไขชื่อ, วันที่, หรือห้อง แล้วกดปุ่มส่งได้เลยครับ</span>
            <button 
              type="button" 
              onClick={() => setShowHelperHint(false)}
              className="text-emerald-400 hover:text-white ml-2 text-xs cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form 
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2 shrink-0"
        >
          <div className="relative flex-1 flex items-center">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="พิมพ์หรือวางแชทลูกค้า เช่น: จองห้อง S1 คุณสมชาย..."
              className="w-full bg-slate-800 text-white placeholder-slate-400 text-xs sm:text-sm pl-3.5 pr-8 py-2.5 rounded-xl border border-slate-700 focus:outline-hidden focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
            />
            {input && (
              <button
                type="button"
                onClick={handleClearInput}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-white rounded-md cursor-pointer transition-colors"
                title="ล้างข้อความ"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            type="submit"
            disabled={!input.trim() || isProcessing}
            className="p-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-slate-950 font-black transition-all cursor-pointer active:scale-95 shrink-0"
            title="ส่งข้อความให้ AI ดึงข้อมูล"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>

      </div>
    </div>,
    document.body
  );
};
