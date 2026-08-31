import React, { useState, useMemo } from 'react';
import { 
  History, 
  Search, 
  Filter, 
  Calendar, 
  User, 
  CreditCard, 
  Home, 
  UtensilsCrossed, 
  Settings, 
  Trash2, 
  Download, 
  ShieldCheck, 
  Clock
} from 'lucide-react';
import type { ActivityLog, ActivityLogCategory } from '../types/pms';
import { formatThaiDate } from '../utils/dateUtils';
import { ConfirmDialogModal } from './ConfirmDialogModal';

interface LogsViewProps {
  logs: ActivityLog[];
  onClearLogs?: () => void;
}

export const LogsView: React.FC<LogsViewProps> = ({ logs, onClearLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Filter Categories
  const categories: { id: string; label: string; icon: any }[] = [
    { id: 'all', label: 'ทั้งหมด', icon: Filter },
    { id: 'booking', label: 'การจอง', icon: Calendar },
    { id: 'payment', label: 'การเงิน & รับชำระ', icon: CreditCard },
    { id: 'room', label: 'สถานะห้องพัก', icon: Home },
    { id: 'order', label: 'สั่งอาหาร & หมูกระทะ', icon: UtensilsCrossed },
    { id: 'system', label: 'ตั้งค่าระบบ', icon: Settings },
  ];

  // Filtered Logs
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCategory = selectedCategory === 'all' || log.category === selectedCategory;
      const term = searchTerm.toLowerCase().trim();
      const matchSearch = !term || 
        log.userEmail.toLowerCase().includes(term) ||
        log.userName.toLowerCase().includes(term) ||
        log.action.toLowerCase().includes(term) ||
        log.details.toLowerCase().includes(term) ||
        (log.targetRoomNumber && log.targetRoomNumber.toLowerCase().includes(term)) ||
        (log.targetBookingCode && log.targetBookingCode.toLowerCase().includes(term));

      return matchCategory && matchSearch;
    });
  }, [logs, selectedCategory, searchTerm]);

  // Export Logs to CSV
  const handleExportCSV = () => {
    const headers = ['วันที่เวลา', 'ผู้ใช้งาน', 'อีเมล', 'ประเภท', 'กิจกรรม', 'รายละเอียด', 'เลขห้อง', 'รหัสการจอง'];
    const rows = filteredLogs.map(l => [
      `"${formatThaiDate(l.timestamp)} ${new Date(l.timestamp).toLocaleTimeString('th-TH')}"`,
      `"${l.userName}"`,
      `"${l.userEmail}"`,
      `"${l.category}"`,
      `"${l.action}"`,
      `"${l.details.replace(/"/g, '""')}"`,
      `"${l.targetRoomNumber || ''}"`,
      `"${l.targetBookingCode || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `บันทึกกิจกรรม_SwanHILL_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getCategoryBadge = (cat: ActivityLogCategory) => {
    switch (cat) {
      case 'payment':
        return { bg: 'bg-emerald-50 text-emerald-800 border-emerald-200', label: 'การเงิน', icon: CreditCard };
      case 'booking':
        return { bg: 'bg-blue-50 text-blue-800 border-blue-200', label: 'การจอง', icon: Calendar };
      case 'room':
        return { bg: 'bg-purple-50 text-purple-800 border-purple-200', label: 'ห้องพัก', icon: Home };
      case 'order':
        return { bg: 'bg-amber-50 text-amber-800 border-amber-200', label: 'อาหาร/บริการ', icon: UtensilsCrossed };
      case 'system':
        return { bg: 'bg-slate-100 text-slate-800 border-slate-300', label: 'ระบบ', icon: Settings };
      default:
        return { bg: 'bg-slate-50 text-slate-700 border-slate-200', label: 'ทั่วไป', icon: History };
    }
  };

  return (
    <div className="space-y-4 font-['Prompt']">
      
      {/* Header & Overview Stats */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <h1 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
              <History className="w-5 h-5 text-emerald-600" />
              <span>ประวัติการทำงานและบันทึกกิจกรรม (Audit Trail & Logs)</span>
            </h1>
            <p className="text-xs text-slate-500 font-medium mt-0.5">
              ตรวจสอบประวัติการทำรายการทุกขั้นตอน ใครเป็นคนทำ เวลาใด และรายละเอียดการแก้ไข
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all border border-slate-200"
            >
              <Download className="w-3.5 h-3.5" />
              <span>ส่งออก CSV</span>
            </button>

            {onClearLogs && (
              <button
                onClick={() => setIsClearConfirmOpen(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-all border border-rose-200"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>ล้างประวัติ</span>
              </button>
            )}
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-black">
              <History className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">กิจกรรมทั้งหมด</span>
              <span className="text-sm sm:text-base font-black text-slate-900">{logs.length} รายการ</span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center font-black">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">บันทึกล่าสุด</span>
              <span className="text-xs sm:text-sm font-black text-slate-900">
                {logs.length > 0 ? formatThaiDate(logs[0].timestamp) : '-'}
              </span>
            </div>
          </div>

          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center gap-3 col-span-2 sm:col-span-1">
            <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center font-black">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">ความปลอดภัย</span>
              <span className="text-xs sm:text-sm font-black text-emerald-700">ตรวจสอบได้ 100%</span>
            </div>
          </div>
        </div>

        {/* Search & Category Filter */}
        <div className="space-y-2.5 pt-1">
          {/* Search Input */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="ค้นหาชื่อพนักงาน, อีเมล, รหัสการจอง, เลขห้อง หรือกิจกรรม..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm border border-slate-300 rounded-2xl outline-none focus:border-emerald-500 bg-slate-50 focus:bg-white transition-all shadow-xs"
            />
          </div>

          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
            {categories.map((cat) => {
              const Icon = cat.icon;
              const isActive = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-slate-900 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Logs Timeline List */}
      <div className="bg-white/95 backdrop-blur-md rounded-3xl border border-slate-200 p-4 sm:p-6 shadow-xs space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-black text-slate-800">
            รายการบันทึกกิจกรรม ({filteredLogs.length} รายการ)
          </span>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="text-[11px] font-bold text-emerald-700 hover:underline"
            >
              ล้างการค้นหา
            </button>
          )}
        </div>

        {filteredLogs.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <History className="w-10 h-10 text-slate-300 mx-auto stroke-1" />
            <p className="text-xs font-bold text-slate-500">ไม่พบประวัติการทำรายการที่ตรงกับเงื่อนไข</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {filteredLogs.map((log) => {
              const badge = getCategoryBadge(log.category);
              const BadgeIcon = badge.icon;

              return (
                <div
                  key={log.id}
                  className="p-3 sm:p-4 rounded-2xl border border-slate-200/90 hover:border-slate-300 bg-white hover:bg-slate-50/50 transition-all shadow-2xs space-y-2"
                >
                  {/* Top Row: User & Category & Time */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shrink-0">
                        <User className="w-3.5 h-3.5 text-emerald-600" />
                      </div>
                      <div>
                        <span className="text-xs font-black text-slate-900 block leading-tight">
                          {log.userName}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          {log.userEmail}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${badge.bg}`}>
                        <BadgeIcon className="w-3 h-3" />
                        <span>{badge.label}</span>
                      </span>

                      <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded-full">
                        {formatThaiDate(log.timestamp)} {new Date(log.timestamp).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit', second: '2-digit' })} น.
                      </span>
                    </div>
                  </div>

                  {/* Middle Row: Action & Details */}
                  <div className="pl-9 space-y-1">
                    <p className="text-xs sm:text-sm font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                      <span>{log.action}</span>
                      {log.targetRoomNumber && (
                        <span className="bg-emerald-100 text-emerald-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                          ห้อง {log.targetRoomNumber}
                        </span>
                      )}
                      {log.targetBookingCode && (
                        <span className="bg-blue-100 text-blue-900 text-[10px] font-black px-2 py-0.5 rounded-md">
                          {log.targetBookingCode}
                        </span>
                      )}
                    </p>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed">
                      {log.details}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Clear Logs Confirmation Modal */}
      <ConfirmDialogModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={() => {
          if (onClearLogs) onClearLogs();
        }}
        title="ยืนยันล้างประวัติการทำงานทั้งหมด"
        description="คุณต้องการล้างรายการประวัติการทำงานทั้งหมดในระบบใช่หรือไม่? ข้อมูลประวัติเก่าจะไม่สามารถกู้คืนได้"
        confirmText="ยืนยันล้างประวัติ"
        type="danger"
      />

    </div>
  );
};
