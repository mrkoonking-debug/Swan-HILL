import React from 'react';
import { Calendar } from 'lucide-react';
import { THAI_MONTHS_FULL } from '../utils/dateUtils';

interface ThaiDatePickerProps {
  label: string;
  value: string; // Format: YYYY-MM-DD
  onChange: (newValue: string) => void;
  className?: string;
  minDate?: string;
}

export const ThaiDatePicker: React.FC<ThaiDatePickerProps> = ({
  label,
  value,
  onChange,
  className = '',
}) => {
  // Parse value YYYY-MM-DD
  const dateObj = value ? new Date(value) : new Date('2026-08-31');
  const day = isNaN(dateObj.getTime()) ? 31 : dateObj.getDate();
  const month = isNaN(dateObj.getTime()) ? 7 : dateObj.getMonth(); // 0-indexed (7 = Aug)
  const yearCE = isNaN(dateObj.getTime()) ? 2026 : dateObj.getFullYear();
  const yearBE = yearCE + 543;

  // Days in selected month
  const daysInMonth = new Date(yearCE, month + 1, 0).getDate();
  const daysList = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  // Available Buddhist years (e.g. 2568, 2569, 2570, 2571)
  const yearsBE = [2568, 2569, 2570, 2571];

  const updateDate = (newDay: number, newMonth: number, newYearBE: number) => {
    const newYearCE = newYearBE - 543;
    const maxDays = new Date(newYearCE, newMonth + 1, 0).getDate();
    const safeDay = Math.min(newDay, maxDays);
    
    const formattedStr = `${newYearCE}-${String(newMonth + 1).padStart(2, '0')}-${String(safeDay).padStart(2, '0')}`;
    onChange(formattedStr);
  };

  return (
    <div className={`space-y-1 ${className}`}>
      <label className="block text-xs font-bold text-slate-800 flex items-center gap-1.5">
        <Calendar className="w-3.5 h-3.5 text-emerald-600" />
        <span>{label} (วัน / เดือน / ปี พ.ศ.)</span>
      </label>

      {/* 3 Inline Selectors: วัน -> เดือน -> ปี พ.ศ. */}
      <div className="grid grid-cols-12 gap-1.5 p-1 bg-slate-100/90 rounded-2xl border border-slate-200">
        {/* 1. วัน (Day: 1 - 31) */}
        <div className="col-span-3">
          <select
            value={day}
            onChange={(e) => updateDate(Number(e.target.value), month, yearBE)}
            className="w-full px-2 py-2 text-xs md:text-sm font-black bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 shadow-2xs text-center cursor-pointer"
          >
            {daysList.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        {/* 2. เดือน (Thai Month: มกราคม - ธันวาคม) */}
        <div className="col-span-5">
          <select
            value={month}
            onChange={(e) => updateDate(day, Number(e.target.value), yearBE)}
            className="w-full px-2 py-2 text-xs md:text-sm font-bold bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-slate-900 shadow-2xs text-center cursor-pointer"
          >
            {THAI_MONTHS_FULL.map((mName, mIdx) => (
              <option key={mIdx} value={mIdx}>
                {mName}
              </option>
            ))}
          </select>
        </div>

        {/* 3. ปี พ.ศ. (Buddhist Era: 2569, ...) */}
        <div className="col-span-4">
          <select
            value={yearBE}
            onChange={(e) => updateDate(day, month, Number(e.target.value))}
            className="w-full px-2 py-2 text-xs md:text-sm font-black bg-white rounded-xl border border-slate-200 focus:border-emerald-500 outline-none text-emerald-800 shadow-2xs text-center cursor-pointer"
          >
            {yearsBE.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
