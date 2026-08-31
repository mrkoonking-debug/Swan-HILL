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
 * Formats YYYY-MM-DD or ISO date into Thai Buddhist Era format: วัน เดือน ปี (พ.ศ.)
 * Example: "2026-08-31" -> "31 ส.ค. 2569"
 */
export const formatThaiDate = (dateInput?: string | Date): string => {
  if (!dateInput) return '-';
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
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  const dateStr = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10).replace(/-/g, '') : new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const rand = Math.floor(100 + Math.random() * 900);
  return `BK-${dateStr}-${rand}`;
};
