/**
 * Thai Buddhist Era Date Utilities
 * Format: วัน-เดือน-ปี (พ.ศ.)
 */

export const THAI_MONTHS_SHORT = [
  'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
  'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
];

export const THAI_MONTHS_FULL = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
];

/**
 * Format a Date or date string into local YYYY-MM-DD without UTC timezone drift
 */
export const formatLocalDate = (dateInput: Date | string = new Date()): string => {
  if (typeof dateInput === 'string') {
    if (/^\d{4}-\d{2}-\d{2}$/.test(dateInput)) return dateInput;
    const d = new Date(dateInput);
    if (isNaN(d.getTime())) return dateInput;
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  const y = dateInput.getFullYear();
  const m = String(dateInput.getMonth() + 1).padStart(2, '0');
  const day = String(dateInput.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

/**
 * Add or subtract days from a YYYY-MM-DD date string safely
 */
export const shiftDateStr = (dateStr: string, days: number): string => {
  const parts = dateStr.split('-').map(Number);
  const y = parts[0] || new Date().getFullYear();
  const m = parts[1] || (new Date().getMonth() + 1);
  const d = parts[2] || new Date().getDate();
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  return formatLocalDate(date);
};

/**
 * Formats YYYY-MM-DD or ISO date into Thai Buddhist Era format: วัน เดือน ปี (พ.ศ.)
 * Example: "2026-08-31" -> "31 ส.ค. 2569"
 */
export const formatThaiDate = (dateInput?: string | Date): string => {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-').map(Number);
    const month = THAI_MONTHS_SHORT[m - 1] || '';
    const yearBE = y + 543;
    return `${d} ${month} ${yearBE}`;
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const day = d.getDate();
  const month = THAI_MONTHS_SHORT[d.getMonth()];
  const yearBE = d.getFullYear() + 543;

  return `${day} ${month} ${yearBE}`;
};

/**
 * Formats YYYY-MM-DD into numeric Thai format: วว/ดด/ปปปป (พ.ศ.)
 * Example: "2026-08-31" -> "31/08/2569"
 */
export const formatThaiDateNumeric = (dateInput?: string | Date): string => {
  if (!dateInput) return '-';
  if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
    const [y, m, d] = dateInput.split('-').map(Number);
    const day = String(d).padStart(2, '0');
    const month = String(m).padStart(2, '0');
    const yearBE = y + 543;
    return `${day}/${month}/${yearBE}`;
  }
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const yearBE = d.getFullYear() + 543;

  return `${day}/${month}/${yearBE}`;
};

/**
 * Formats full Thai date with day of the week:
 * Example: "วันจันทร์ที่ 31 สิงหาคม 2569"
 */
export const formatThaiDateFull = (dateInput?: string | Date): string => {
  if (!dateInput) return '-';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (isNaN(d.getTime())) return String(dateInput);

  const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const dayName = dayNames[d.getDay()];
  const day = d.getDate();
  const month = THAI_MONTHS_FULL[d.getMonth()];
  const yearBE = d.getFullYear() + 543;

  return `${dayName}ที่ ${day} ${month} ${yearBE}`;
};

/**
 * Generates unified standard booking code: BK-YYYYMMDD-XXX
 * Example: BK-20260831-101
 */
export const generateBookingCode = (dateInput: string | Date = new Date()): string => {
  const cleanDate = formatLocalDate(dateInput).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `BK-${cleanDate}-${rand}`;
};
