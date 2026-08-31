import React, { useRef, useState } from 'react';
import { 
  X, 
  Printer, 
  Download, 
  Image as ImageIcon, 
  MapPin, 
  Phone, 
  CheckCircle2, 
  Check
} from 'lucide-react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import type { Booking } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: Booking | null;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  isOpen,
  onClose,
  booking,
}) => {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  if (!isOpen || !booking) return null;

  const roomBaseTotal = booking.roomPrice * booking.totalNights;
  const addOnsTotal = booking.addOns?.reduce((sum, a) => sum + (a.price * a.quantity), 0) || 0;
  const grandTotal = booking.totalAmount || (roomBaseTotal + addOnsTotal);
  const remainingBalance = Math.max(0, grandTotal - booking.paidAmount);

  // 1. Download as Image (PNG)
  const handleDownloadImage = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3, // Ultra high-res crisp rendering
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = imgData;
      link.download = `ใบเสร็จ_${booking.roomNumber}_${booking.bookingCode}.png`;
      link.click();

      setExportSuccess('บันทึกรูปภาพใบเสร็จเรียบร้อยแล้ว');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export image:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Download as PDF
  const handleDownloadPDF = async () => {
    if (!receiptRef.current) return;
    try {
      setIsExporting(true);
      const canvas = await html2canvas(receiptRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save(`ใบเสร็จ_${booking.roomNumber}_${booking.bookingCode}.pdf`);

      setExportSuccess('ดาวน์โหลดไฟล์ PDF เรียบร้อยแล้ว');
      setTimeout(() => setExportSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to export PDF:', err);
    } finally {
      setIsExporting(false);
    }
  };

  // 3. Print
  const handlePrint = () => {
    window.print();
  };

  // Channel Thai Translator
  const getChannelThai = (ch?: string) => {
    if (ch === 'LINE Official') return 'ไลน์ (LINE Official)';
    if (ch === 'Phone') return 'โทรศัพท์';
    if (ch === 'Direct') return 'ติดต่อโดยตรง';
    return ch || 'ไลน์ (LINE Official)';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in">
      <div className="bg-slate-900 border border-slate-700/80 w-full max-w-2xl max-h-[92vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        
        {/* Top Control Bar */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-800 bg-slate-900/90 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-sm sm:text-base font-black text-white">
              ใบเสร็จรับเงิน / ใบยืนยันการจอง
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Download Image Button */}
            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="บันทึกเป็นรูปภาพ"
            >
              <ImageIcon className="w-3.5 h-3.5" />
              <span>บันทึกเป็นรูปภาพ</span>
            </button>

            {/* Download PDF Button */}
            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all active:scale-95 shadow-sm"
              title="ดาวน์โหลดเป็นไฟล์ PDF"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ดาวน์โหลด PDF</span>
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all active:scale-95 border border-slate-700"
              title="สั่งพิมพ์ใบเสร็จ"
            >
              <Printer className="w-3.5 h-3.5 text-amber-400" />
              <span>สั่งพิมพ์</span>
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-white transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Success Alert Banner */}
        {exportSuccess && (
          <div className="bg-emerald-600 text-white text-xs font-bold px-4 py-2 flex items-center justify-center gap-1.5 animate-in slide-in-from-top">
            <Check className="w-4 h-4" />
            <span>{exportSuccess}</span>
          </div>
        )}

        {/* Receipt Container Preview (Will be exported to Image/PDF/Print) */}
        <div className="p-3 sm:p-6 overflow-y-auto no-scrollbar flex-1 bg-slate-900/50 flex justify-center">
          
          {/* Printable Sheet (100% Pure Thai Language) */}
          <div
            ref={receiptRef}
            className="w-full max-w-[540px] bg-white text-slate-900 p-6 sm:p-8 rounded-2xl shadow-xl border border-slate-200 space-y-5 print:p-0 print:border-none print:shadow-none"
            style={{ fontFamily: "'Prompt', sans-serif" }}
          >
            {/* Header: Logo & Resort Info */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4 gap-3">
              <div>
                <img 
                  src="/swan-hill-dark.png" 
                  alt="สวอนฮิลล์ รีสอร์ท" 
                  className="h-10 w-auto object-contain mb-1" 
                />
                <p className="text-xs font-black text-slate-900 tracking-wide">สวอนฮิลล์ รีสอร์ท</p>
                <p className="text-[11px] text-slate-600 flex items-center gap-1 mt-0.5 font-medium">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  บ้านพักธรรมชาติและบรรยากาศส่วนตัว
                </p>
                <p className="text-[11px] text-slate-600 flex items-center gap-1 font-medium">
                  <Phone className="w-3 h-3 text-emerald-600 shrink-0" />
                  ติดต่อ: 081-234-5678
                </p>
              </div>

              <div className="text-right">
                <span className="inline-block bg-slate-900 text-white font-black text-xs px-3 py-1 rounded-md tracking-wide">
                  ใบเสร็จรับเงิน
                </span>
                <p className="text-xs font-black text-slate-900 mt-2">เลขที่: {booking.bookingCode}</p>
                <p className="text-[11px] text-slate-600 mt-0.5">วันที่ออกเอกสาร: {formatThaiDate(new Date())}</p>
              </div>
            </div>

            {/* Guest & Stay Details Grid */}
            <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 font-bold block">ข้อมูลลูกค้าผู้เข้าพัก</span>
                <p className="font-black text-slate-900 text-sm mt-0.5">{booking.guestName}</p>
                <p className="text-slate-700 font-bold mt-0.5">{booking.guestPhone}</p>
                <p className="text-[11px] text-slate-500 mt-0.5">ช่องทางการจอง: {getChannelThai(booking.channel)}</p>
              </div>

              <div className="text-right">
                <span className="text-[11px] text-slate-500 font-bold block">ห้องพักที่จอง</span>
                <p className="font-black text-emerald-900 text-sm mt-0.5">
                  ห้อง {booking.roomNumber} ({booking.roomType})
                </p>
                <p className="text-slate-800 font-bold mt-0.5">
                  วันเข้าพัก: {formatThaiDate(booking.checkInDate)}
                </p>
                <p className="text-slate-800 font-bold">
                  วันออก: {formatThaiDate(booking.checkOutDate)} ({booking.totalNights} คืน)
                </p>
              </div>
            </div>

            {/* Itemized Table */}
            <div>
              <div className="border-b-2 border-slate-300 pb-1.5 mb-2 flex justify-between text-xs font-black text-slate-900">
                <span>รายการ</span>
                <span>จำนวนเงิน (บาท)</span>
              </div>

              <div className="space-y-2 text-xs text-slate-800">
                {/* 1. Room Charge */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-black text-slate-900 block">
                      ค่าที่พักห้อง {booking.roomNumber} ({booking.totalNights} คืน)
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      ราคาคืนละ ฿{booking.roomPrice.toLocaleString()} บาท
                    </span>
                  </div>
                  <span className="font-black text-slate-900">
                    ฿{roomBaseTotal.toLocaleString()}
                  </span>
                </div>

                {/* 2. Add-ons Items */}
                {booking.addOns && booking.addOns.length > 0 && booking.addOns.map((item) => (
                  <div key={item.id} className="flex justify-between items-start pt-1.5 border-t border-slate-100">
                    <div>
                      <span className="font-black text-slate-900 block">{item.name}</span>
                      <span className="text-[11px] text-slate-500 font-medium">
                        จำนวน {item.quantity} รายการ (รายการละ ฿{item.price.toLocaleString()} บาท)
                      </span>
                    </div>
                    <span className="font-black text-emerald-800">
                      +฿{(item.price * item.quantity).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-3 border-t-2 border-slate-900 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600 font-medium">
                <span>ยอดรวมค่าห้องพัก:</span>
                <span className="font-bold text-slate-800">฿{roomBaseTotal.toLocaleString()} บาท</span>
              </div>

              {addOnsTotal > 0 && (
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>ยอดค่าอาหารและบริการเสริม:</span>
                  <span className="text-emerald-800 font-bold">+฿{addOnsTotal.toLocaleString()} บาท</span>
                </div>
              )}

              <div className="flex justify-between text-slate-950 font-black text-sm pt-2 border-t border-slate-200">
                <span>ยอดเงินสุทธิทั้งสิ้น:</span>
                <span className="text-emerald-950 text-base">฿{grandTotal.toLocaleString()} บาท</span>
              </div>

              <div className="flex justify-between text-slate-800 font-bold pt-1">
                <span>ยอดเงินที่ชำระแล้ว:</span>
                <span className="text-emerald-800 font-black">฿{booking.paidAmount.toLocaleString()} บาท</span>
              </div>

              {remainingBalance > 0 ? (
                <div className="flex justify-between text-rose-900 font-black text-xs pt-1.5 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
                  <span>ยอดคงเหลือที่ต้องชำระ (เก็บตอนเช็คเอาท์):</span>
                  <span className="text-rose-700 text-sm">฿{remainingBalance.toLocaleString()} บาท</span>
                </div>
              ) : (
                <div className="flex justify-between text-emerald-950 font-black text-xs pt-1.5 bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    สถานะการชำระเงิน:
                  </span>
                  <span className="text-emerald-800">ชำระเงินครบถ้วนแล้ว</span>
                </div>
              )}
            </div>

            {/* Special Requests */}
            {booking.specialRequests && (
              <div className="p-2.5 bg-slate-50 rounded-xl text-xs text-slate-700 border border-slate-200">
                <span className="font-bold text-slate-900 block mb-0.5">หมายเหตุเพิ่มเติม:</span>
                <span>{booking.specialRequests}</span>
              </div>
            )}

            {/* Footer / Signature */}
            <div className="pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-600">
              <div>
                <p className="font-black text-slate-800">ขอบพระคุณที่ไว้วางใจเลือกพักกับ สวอนฮิลล์ รีสอร์ท</p>
                <p className="text-[11px] text-slate-500 mt-0.5">ขอให้มีความสุขและความสะดวกสบายตลอดการเข้าพัก</p>
              </div>

              <div className="text-center w-40">
                <div className="border-b border-slate-400 pb-5 mb-1.5"></div>
                <p className="font-bold text-slate-800">ผู้รับเงิน / พนักงานต้อนรับ</p>
                <p className="text-[10px] text-slate-500">(ลงชื่อผู้รับเงิน)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
