import type { Room, Booking, AddOnItem } from '../types/pms';
import { formatLocalDate, shiftDateStr, generateBookingCode } from '../utils/dateUtils';

export interface ParsedBookingIntent {
  type: 'booking';
  roomNumbers: string[];
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalNights: number;
  totalGuests: number;
  paymentStatus: 'paid' | 'deposit' | 'pending';
  depositAmount: number;
  addOns: AddOnItem[];
  extraBeds: number;
  mookataSmall: number;
  mookataLarge: number;
  breakfast: number;
  notes?: string;
  isRoomAvailable: boolean;
  conflictDetails?: string;
  estimatedTotal: number;
  sourceText?: string;
}

export interface GeneralAIResponse {
  type: 'info' | 'greeting' | 'unknown';
  message: string;
  suggestedAction?: string;
}

export type AIParseResult = ParsedBookingIntent | GeneralAIResponse;

// Thai Month Name to Month Number (1-12)
const THAI_MONTH_MAP: Record<string, number> = {
  'ม.ค.': 1, 'มกรา': 1, 'มกราคม': 1,
  'ก.พ.': 2, 'กุมภา': 2, 'กุมภาพันธ์': 2,
  'มี.ค.': 3, 'มีนา': 3, 'มีนาคม': 3,
  'เม.ย.': 4, 'เมษา': 4, 'เมษายน': 4,
  'พ.ค.': 5, 'พฤษภา': 5, 'พฤษภาพันธ์': 5,
  'มิ.ย.': 6, 'มิถุนา': 6, 'มิถุนายน': 6,
  'ก.ค.': 7, 'กรกฎา': 7, 'กรกฎาคม': 7,
  'ส.ค.': 8, 'สิงหา': 8, 'สิงหาคม': 8,
  'ก.ย.': 9, 'กันยา': 9, 'กันยายน': 9,
  'ต.ค.': 10, 'ตุลา': 10, 'ตุลาคม': 10,
  'พ.ย.': 11, 'พฤศจิกา': 11, 'พฤศจิกายน': 11,
  'ธ.ค.': 12, 'ธันวา': 12, 'ธันวาคม': 12,
};

// Known senders and family names to ignore as guest names
const KNOWN_SENDERS = new Set([
  'พ่อ', 'แม่', 'z', 'Z', 'ᴬᴼᴹ', 'พี่คิว', 'ออม', 'น้องออม', 'sayan', 'eid', 
  'admin', 'แอดมิน', 'user', 'me', 'staff'
]);

// Non-guest keywords that might follow "คุณ" or "ชื่อ"
const NON_GUEST_WORDS = new Set([
  'ลูกค้า', 'จอง', 'ห้อง', 'บ้าน', 'วัน', 'มัดจำ', 'หมูกระทะ', 'คน', 'ท่าน', 'หลัง',
  'พ่อ', 'แม่', 'ออม', 'พี่คิว', 'โอน', 'เงิน', 'แล้ว', 'ครับ', 'ค่ะ', 'ว่าง', 'เต็ม'
]);

/**
 * Clean LINE export text:
 * Strips date headers, timestamps, sender names, media notes (Photos, Videos, Stickers)
 */
export function cleanLineChatText(rawText: string): { cleanedLines: string[]; contextDate?: string } {
  const lines = rawText.split(/\r?\n/);
  const cleanedLines: string[] = [];
  let contextDate: string | undefined;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Detect LINE Date Header: 2026.09.04 Friday or 2026-09-04
    const dateHeaderMatch = trimmed.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})/);
    if (dateHeaderMatch) {
      const y = parseInt(dateHeaderMatch[1], 10);
      const m = String(parseInt(dateHeaderMatch[2], 10)).padStart(2, '0');
      const d = String(parseInt(dateHeaderMatch[3], 10)).padStart(2, '0');
      contextDate = `${y}-${m}-${d}`;
      continue;
    }

    // Filter out LINE Media lines
    if (/^(Photos|Videos|Stickers|Group voice call|unsent a message)/i.test(trimmed)) {
      continue;
    }

    // Match LINE message timestamp and sender prefix: "11:27 Z ลูกค้า..." or "20:04 Z คุณโจ้..." or "10:36 พ่อ บ้านหลังที่ 4..."
    const linePrefixRegex = /^(?:\d{1,2}:\d{2}\s+)?([^\s:]+)\s+(.*)$/;
    const prefixMatch = trimmed.match(linePrefixRegex);

    if (prefixMatch) {
      const sender = prefixMatch[1].trim();
      const content = prefixMatch[2].trim();

      // If sender is a known family sender or short sender token, strip it and keep content
      if (KNOWN_SENDERS.has(sender) || KNOWN_SENDERS.has(sender.toLowerCase()) || sender.length <= 4) {
        if (content && !/^(Photos|Videos|Stickers)/i.test(content)) {
          cleanedLines.push(content);
        }
        continue;
      }
    }

    // Normal message line without timestamp/sender
    cleanedLines.push(trimmed);
  }

  return { cleanedLines, contextDate };
}

/**
 * Intelligent Deterministic Thai Natural Language Parser for Hotel Bookings
 * Specially trained on Swan HILL real-world staff LINE chats.
 */
export function parseThaiBookingText(
  text: string,
  rooms: Room[],
  bookings: Booking[]
): AIParseResult {
  const { cleanedLines, contextDate } = cleanLineChatText(text);
  const normalized = cleanedLines.join(' ');
  const lower = normalized.toLowerCase();

  // 1. Check for availability / room status queries
  if (
    lower.includes('ว่างไหม') ||
    lower.includes('ห้องว่าง') ||
    lower.includes('มีห้องไหนว่าง') ||
    lower.includes('ว่างกี่ห้อง')
  ) {
    const targetDate = contextDate || formatLocalDate(new Date());
    const activeOnDate = bookings.filter(
      b => !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out' &&
      b.checkInDate <= targetDate && b.checkOutDate > targetDate
    );
    const bookedRooms = activeOnDate.map(b => b.roomNumber);
    const vacant = rooms.filter(r => !bookedRooms.includes(r.roomNumber));

    if (vacant.length === 0) {
      return {
        type: 'info',
        message: `วันที่ ${targetDate} บ้านพัก Swan HILL เต็มทุกหลังครับ (S1 - S6)`,
      };
    }

    const vacantList = vacant.map(r => `ห้อง ${r.roomNumber} (${r.type || 'บ้านพัก'} ฿${r.pricePerNight.toLocaleString()}/คืน)`).join(', ');
    return {
      type: 'info',
      message: `วันที่ ${targetDate} มีห้องว่าง ${vacant.length} หลัง ได้แก่:\n${vacantList}`,
      suggestedAction: 'คลิกเพื่อสร้างการจองใหม่'
    };
  }

  // 2. Detect Rooms: S1 to S6
  // Patterns:
  // - "บ้านหลังที่ 4", "บ้านหลังที่ 2 และหลังที่ 3", "บ้านหลังที่ 2 และ 3"
  // - "ห้อง 01 กับ 02", "(01 กับ 02)"
  // - "ห้อง 2", "ห้องที่ 6", "ห้องที่ 1", "หลังที่ S6"
  // - "S1", "S2", "S3", "S4", "S5", "S6"
  // - "บ้านหลังใหญ่" (S3, S4), "บ้านหลังกลาง" (S1, S2), "บ้านหลังเล็ก" (S5, S6)
  const roomMatches = new Set<string>();

  // Pattern A: "บ้านหลังที่ X" or "หลังที่ X"
  const houseOrderRegex = /(?:บ้าน|ห้อง)?\s*หลังที่\s*([sS]?[1-6])(?:\s*(?:และ|กับ|,|\+)\s*(?:หลังที่\s*)?([sS]?[1-6]))?/g;
  let hMatch: RegExpExecArray | null;
  while ((hMatch = houseOrderRegex.exec(normalized)) !== null) {
    if (hMatch[1]) {
      let r = hMatch[1].toUpperCase();
      if (!r.startsWith('S')) r = 'S' + r;
      if (['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(r)) roomMatches.add(r);
    }
    if (hMatch[2]) {
      let r = hMatch[2].toUpperCase();
      if (!r.startsWith('S')) r = 'S' + r;
      if (['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(r)) roomMatches.add(r);
    }
  }

  // Pattern B: "01 กับ 02" or "(01 กับ 02)" or "ห้อง 01"
  const zeroNumberRegex = /(?:ห้อง|จำนวน)?\s*\(?0?([1-6])\s*(?:และ|กับ|,|\+)\s*0?([1-6])\)?/g;
  let zMatch: RegExpExecArray | null;
  while ((zMatch = zeroNumberRegex.exec(normalized)) !== null) {
    if (zMatch[1]) roomMatches.add('S' + zMatch[1]);
    if (zMatch[2]) roomMatches.add('S' + zMatch[2]);
  }

  // Pattern C: Standard S1-S6 or "ห้องที่ 6", "ห้อง 2"
  const standardRoomRegex = /(?:ห้องที่|ห้อง|room)?\s*([sS][1-6]|[1-6])\b/g;
  let sMatch: RegExpExecArray | null;
  while ((sMatch = standardRoomRegex.exec(normalized)) !== null) {
    let r = sMatch[1].toUpperCase();
    if (!r.startsWith('S')) r = 'S' + r;
    if (['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(r)) {
      // Exclude false positives like "1 คน", "1 ท่าน", "1 หลัง", "1 คืน"
      const matchIndex = sMatch.index;
      const followingText = normalized.substring(matchIndex + sMatch[0].length, matchIndex + sMatch[0].length + 10).trim();
      if (!/^(คน|ท่าน|คืน|บาท|ชุด|แก้ว|ขวด|บ่อ)/.test(followingText)) {
        roomMatches.add(r);
      }
    }
  }

  // Pattern D: "บ้านหลังใหญ่" -> S3, "บ้านหลังเล็ก" -> S5
  if (roomMatches.size === 0) {
    if (normalized.includes('บ้านหลังใหญ่')) {
      roomMatches.add('S3');
    } else if (normalized.includes('บ้านหลังเล็ก')) {
      roomMatches.add('S5');
    } else if (normalized.includes('บ้านหลังกลาง')) {
      roomMatches.add('S1');
    }
  }

  // 3. Detect Phone Number (e.g. 0839507264, 081-234-5678, โทร. 0839507264)
  const phoneRegex = /(?:โทร\.?|เบอร์)?\s*(0[689]\d{1}[- ]?\d{3}[- ]?\d{4}|0[2-57]\d{1}[- ]?\d{3}[- ]?\d{3,4})\b/;
  const phoneMatch = normalized.match(phoneRegex);
  const guestPhone = phoneMatch ? phoneMatch[1].replace(/[- ]/g, '') : '';

  // 4. Detect Guest Name
  // Patterns from real chat:
  // - "ชื่อ พันธิตรา (ออย)"
  // - "คุณโจ้", "คุณสมชาย"
  // - "ลูกค้าชื่อ..."
  let guestName = '';

  // Pattern A: explicit "ชื่อ พันธิตรา (ออย)" or "ชื่อ: ..."
  const explicitNameMatch = normalized.match(/ชื่อ\s*(?::|\.)?\s*([ก-๙a-zA-Z]+(?:\s*\([ก-๙a-zA-Z]+\))?(?:\s+[ก-๙a-zA-Z]+)?)/);
  if (explicitNameMatch) {
    const raw = explicitNameMatch[1].trim();
    if (!NON_GUEST_WORDS.has(raw)) {
      guestName = raw.startsWith('คุณ') ? raw : `คุณ${raw}`;
    }
  }

  // Pattern B: "คุณโจ้เข้าพัก", "คุณสมชาย"
  if (!guestName) {
    const khunMatch = normalized.match(/(?:คุณ|k\.|khun)\s*([ก-๙a-zA-Z]+(?:\s*\([ก-๙a-zA-Z]+\))?(?:\s+[ก-๙a-zA-Z]+)?)/);
    if (khunMatch) {
      const raw = khunMatch[1].trim();
      if (!NON_GUEST_WORDS.has(raw)) {
        guestName = `คุณ${raw}`;
      }
    }
  }

  // Pattern C: "ลูกค้าชื่อ..."
  if (!guestName) {
    const customerMatch = normalized.match(/ลูกค้าชื่อ\s*([ก-๙a-zA-Z]+)/);
    if (customerMatch) {
      const raw = customerMatch[1].trim();
      if (!NON_GUEST_WORDS.has(raw)) {
        guestName = `คุณ${raw}`;
      }
    }
  }

  // 5. Detect Total Guests & Extra Beds
  let totalGuests = 2;
  const guestCountMatch = normalized.match(/เข้าพัก\s*(\d+)\s*(?:คน|ท่าน)/) || normalized.match(/(\d+)\s*(?:คน|ท่าน)/);
  if (guestCountMatch) {
    totalGuests = parseInt(guestCountMatch[1], 10);
  }

  let extraBeds = 0;
  const extraBedMatch = normalized.match(/(?:เสริมที่นอน|ที่นอนเสริม|เตียงเสริม)\s*(\d+)\s*(?:คน|ท่าน|หลัง|เตียง)?/);
  if (extraBedMatch) {
    extraBeds = parseInt(extraBedMatch[1], 10);
  }

  // 6. Detect Dates
  const today = new Date();
  const currentYear = today.getFullYear();
  let checkInDate = contextDate || formatLocalDate(today);
  let checkOutDate = shiftDateStr(checkInDate, 1);
  let totalNights = 1;

  // Pattern A: "วันที่ 26 กันยายน 2569" or "วันที่ 19 กันยายน"
  const fullThaiDateRegex = /วันที่\s*(\d{1,2})\s*([ก-๙.]+)\s*(?:พ\.ศ\.\s*)?(\d{2,4})?/;
  const fullThaiMatch = normalized.match(fullThaiDateRegex);

  // Pattern B: "วันที่ 11-12" or "10-12 ก.ย."
  const rangeDateRegex = /(\d{1,2})\s*(?:-|ถึง|to)\s*(\d{1,2})\s*([ก-๙.]+)?(?:\s*(\d{2,4}))?/;
  const rangeMatch = normalized.match(rangeDateRegex);

  // Pattern C: "วันที่5/9/69" or "5/9/2569"
  const slashDateRegex = /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/;
  const slashMatch = normalized.match(slashDateRegex);

  if (rangeMatch) {
    const d1 = parseInt(rangeMatch[1], 10);
    const d2 = parseInt(rangeMatch[2], 10);
    const monthText = rangeMatch[3] ? rangeMatch[3].trim() : '';
    let m = today.getMonth() + 1;

    if (monthText) {
      for (const [key, val] of Object.entries(THAI_MONTH_MAP)) {
        if (monthText.includes(key)) {
          m = val;
          break;
        }
      }
    } else if (contextDate) {
      m = parseInt(contextDate.split('-')[1], 10);
    }

    let y = currentYear;
    if (rangeMatch[4]) {
      let rawY = parseInt(rangeMatch[4], 10);
      if (rawY > 2500) rawY -= 543;
      else if (rawY < 100) rawY += 2000;
      y = rawY;
    }

    checkInDate = `${y}-${String(m).padStart(2, '0')}-${String(d1).padStart(2, '0')}`;
    checkOutDate = `${y}-${String(m).padStart(2, '0')}-${String(d2).padStart(2, '0')}`;
    totalNights = d2 > d1 ? d2 - d1 : 1;
  } else if (slashMatch) {
    const d = parseInt(slashMatch[1], 10);
    const m = parseInt(slashMatch[2], 10);
    let y = parseInt(slashMatch[3], 10);
    if (y > 2500) y -= 543;
    else if (y < 100) y += 2000;

    checkInDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    checkOutDate = shiftDateStr(checkInDate, 1);
  } else if (fullThaiMatch) {
    const d = parseInt(fullThaiMatch[1], 10);
    const monthText = fullThaiMatch[2].trim();
    let m = today.getMonth() + 1;
    for (const [key, val] of Object.entries(THAI_MONTH_MAP)) {
      if (monthText.includes(key)) {
        m = val;
        break;
      }
    }

    let y = currentYear;
    if (fullThaiMatch[3]) {
      let rawY = parseInt(fullThaiMatch[3], 10);
      if (rawY > 2500) rawY -= 543;
      else if (rawY < 100) rawY += 2000;
      y = rawY;
    }

    checkInDate = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    checkOutDate = shiftDateStr(checkInDate, 1);
  } else if (normalized.includes('พรุ่งนี้')) {
    checkInDate = shiftDateStr(contextDate || formatLocalDate(today), 1);
    checkOutDate = shiftDateStr(checkInDate, 1);
  } else {
    // Single date pattern: "วันที่ 12", "วันที่ 5"
    const singleDateMatch = normalized.match(/วันที่\s*(\d{1,2})\b/);
    if (singleDateMatch) {
      const d = parseInt(singleDateMatch[1], 10);
      let m = today.getMonth() + 1;
      if (contextDate) m = parseInt(contextDate.split('-')[1], 10);
      checkInDate = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      checkOutDate = shiftDateStr(checkInDate, 1);
    }
  }

  // Detect explicit nights: "จอง 2 คืน", "พัก 2 คืน", "3 คืน"
  const nightsMatch = normalized.match(/(?:จอง|พัก)?\s*(\d+)\s*คืน/);
  if (nightsMatch) {
    totalNights = Math.max(1, parseInt(nightsMatch[1], 10));
    checkOutDate = shiftDateStr(checkInDate, totalNights);
  }

  // 7. Detect Add-ons (Mookata, Breakfast, etc.)
  let mookataSmall = 0;
  let mookataLarge = 0;
  let breakfast = 0;

  if (normalized.includes('หมูกระทะ') || normalized.includes('หมูกะทะ')) {
    if (normalized.includes('ชุดใหญ่') || normalized.includes('ใหญ่')) {
      const q = normalized.match(/หมูกระ?ทะ.*(?:ใหญ่|ชุดใหญ่)(?:\s*(\d+))?/);
      mookataLarge = q && q[1] ? parseInt(q[1], 10) : 1;
    } else if (normalized.includes('ชุดเล็ก') || normalized.includes('เล็ก')) {
      const q = normalized.match(/หมูกระ?ทะ.*(?:เล็ก|ชุดเล็ก)(?:\s*(\d+))?/);
      mookataSmall = q && q[1] ? parseInt(q[1], 10) : 1;
    } else {
      mookataLarge = 1; // Default
    }
  }

  if (normalized.includes('อาหารเช้า')) {
    const q = normalized.match(/อาหารเช้า(?:\s*(\d+))?/);
    breakfast = q && q[1] ? parseInt(q[1], 10) : 2;
  }

  // 8. Detect Payments & Deposits
  let paymentStatus: 'paid' | 'deposit' | 'pending' = 'pending';
  let depositAmount = 0;

  // Detect explicit total, e.g. "2,000 บาท เสริมที่นอน...", "3,000 บาท"
  const priceRegex = /([1-9][0-9]{2,4}|[1-9],[0-9]{3})\s*บาท/g;
  let pMatch: RegExpExecArray | null;
  const foundPrices: number[] = [];
  while ((pMatch = priceRegex.exec(normalized)) !== null) {
    const val = parseInt(pMatch[1].replace(/,/g, ''), 10);
    foundPrices.push(val);
  }

  // Check paid full
  if (
    normalized.includes('โอนตังค์มาให้หมดแล้ว') ||
    normalized.includes('จ่ายตังค์หมดแล้ว') ||
    normalized.includes('จ่ายครบ') ||
    normalized.includes('โอนเต็ม') ||
    normalized.includes('เก็บตังค์มาแล้ว') ||
    normalized.includes('จ่ายหมดแล้ว')
  ) {
    paymentStatus = 'paid';
  }

  // Detect deposit: "มัดจำแล้ว 50% = 600 บาท", "โอนตังค์มาแล้ว 1,000 บาท", "มัดจำ 1000"
  const depositMatch = normalized.match(/(?:มัดจำ(?:แล้ว)?|โอน(?:ตังค์)?(?:มาแล้ว)?)\s*(?:(?:50%|=|\s)*)?([0-9,]+)\s*(?:บาท)?/);
  if (depositMatch) {
    depositAmount = parseInt(depositMatch[1].replace(/,/g, ''), 10);
    if (depositAmount > 0 && paymentStatus !== 'paid') {
      paymentStatus = 'deposit';
    }
  }

  // 9. If rooms or booking intent detected, build structured object
  const finalRoomNumbers = Array.from(roomMatches);
  const hasBookingKeywords = normalized.includes('จอง') || normalized.includes('เข้าพัก') || normalized.includes('โอน') || normalized.includes('มัดจำ') || finalRoomNumbers.length > 0;

  if (hasBookingKeywords && (finalRoomNumbers.length > 0 || guestName || guestPhone)) {
    const targetRoomNumbers = finalRoomNumbers.length > 0 ? finalRoomNumbers : ['S1'];
    const matchedRooms = rooms.filter(r => targetRoomNumbers.includes(r.roomNumber));
    const roomRatePerNight = matchedRooms.reduce((sum, r) => sum + r.pricePerNight, 0) || (targetRoomNumbers.length * 1200);

    const addOnsTotal = (mookataLarge * 500) + (mookataSmall * 350) + (extraBeds * 300) + (breakfast * 60);
    let calculatedTotal = (roomRatePerNight * totalNights) + addOnsTotal;

    // If explicit total was stated in chat (e.g. 2,000 บาท or 3,000 บาท) and is higher or matches, use it
    if (foundPrices.length > 0) {
      const maxFound = Math.max(...foundPrices);
      if (maxFound >= 1000 && maxFound !== depositAmount) {
        calculatedTotal = maxFound;
      }
    }

    if (paymentStatus === 'paid') {
      depositAmount = calculatedTotal;
    } else if (paymentStatus === 'deposit' && depositAmount === 0) {
      depositAmount = Math.round(calculatedTotal * 0.5);
    }

    // Build Add-ons list
    const addOnsList: AddOnItem[] = [];
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

    // Check Room Conflicts against active bookings
    const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out');
    const conflicts: string[] = [];
    targetRoomNumbers.forEach(rNum => {
      const conflict = activeBookings.find(b => 
        b.roomNumber === rNum &&
        checkInDate < b.checkOutDate &&
        checkOutDate > b.checkInDate
      );
      if (conflict) {
        conflicts.push(`ห้อง ${rNum} มีการจองแล้วโดยคุณ ${conflict.guestName} (${conflict.checkInDate} ถึง ${conflict.checkOutDate})`);
      }
    });

    return {
      type: 'booking',
      roomNumbers: targetRoomNumbers,
      guestName: guestName || 'ลูกค้าจาก LINE',
      guestPhone: guestPhone || '-',
      checkInDate,
      checkOutDate,
      totalNights,
      totalGuests,
      paymentStatus,
      depositAmount,
      addOns: addOnsList,
      extraBeds,
      mookataSmall,
      mookataLarge,
      breakfast,
      isRoomAvailable: conflicts.length === 0,
      conflictDetails: conflicts.length > 0 ? conflicts.join(', ') : undefined,
      estimatedTotal: calculatedTotal,
      sourceText: text
    };
  }

  // Greeting
  if (lower.includes('สวัสดี') || lower.includes('hello') || lower.includes('hi')) {
    return {
      type: 'greeting',
      message: 'สวัสดีครับ! ผมคือผู้ช่วย AI ของ Swan HILL Resort\n\nพนักงานสามารถวางข้อความแชทจาก LINE ได้เลยครับ ผมจะตัดเวลาและชื่อคนพิมพ์ออกให้อัตโนมัติ แล้วดึงเฉพาะข้อมูลลูกค้า ห้องพัก และวันที่เข้าพักขึ้นมาให้ตรวจสอบครับ ✨'
    };
  }

  return {
    type: 'unknown',
    message: 'ยังไม่พบข้อมูลการจองในข้อความนี้ครับ\n\nลองวางข้อความที่มีเลขห้อง (เช่น ห้อง 2, บ้านหลังที่ 4, S1) หรือชื่อลูกค้าและวันที่เข้าพัก หรือคลิกตัวอย่างด้านล่างได้เลยครับ'
  };
}

/**
 * Convert Parsed Intent into official Booking objects ready to save
 */
export function createBookingsFromIntent(
  intent: ParsedBookingIntent,
  rooms: Room[]
): Booking[] {
  const isMultiRoom = intent.roomNumbers.length > 1;
  const groupId = isMultiRoom ? 'grp-ai-' + Date.now() : undefined;
  const groupCode = isMultiRoom ? `GRP-${intent.checkInDate.replace(/-/g, '')}` : undefined;

  const result: Booking[] = [];

  intent.roomNumbers.forEach((rNum, idx) => {
    const room = rooms.find(r => r.roomNumber === rNum) || rooms[0];
    const roomRate = room.pricePerNight || 1200;
    const roomBase = roomRate * intent.totalNights;
    
    // Distribute add-ons to first room
    const roomAddOns = idx === 0 ? intent.addOns : [];
    const addOnsTotal = roomAddOns.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const roomTotal = roomBase + addOnsTotal;

    // Distribute deposit
    let paidAmt = 0;
    if (intent.paymentStatus === 'paid') {
      paidAmt = roomTotal;
    } else if (idx === 0) {
      paidAmt = intent.depositAmount;
    }

    const booking: Booking = {
      id: 'b-ai-' + Date.now() + '-' + idx,
      bookingCode: generateBookingCode(intent.checkInDate),
      guestName: intent.guestName,
      guestPhone: intent.guestPhone,
      channel: 'LINE Official',
      roomId: room.id,
      roomNumber: room.roomNumber,
      roomType: room.type || 'บ้านพักรีสอร์ท',
      checkInDate: intent.checkInDate,
      checkOutDate: intent.checkOutDate,
      checkInTime: '14:00',
      checkOutTime: '12:00',
      totalNights: intent.totalNights,
      totalGuests: Math.ceil(intent.totalGuests / intent.roomNumbers.length),
      roomPrice: roomRate,
      addOns: roomAddOns,
      totalAmount: roomTotal,
      paidAmount: paidAmt,
      paymentStatus: intent.paymentStatus,
      status: 'confirmed',
      specialRequests: 'บันทึกอัตโนมัติผ่านผู้ช่วยแชท AI จากข้อความ LINE',
      createdAt: new Date().toISOString(),
      groupId,
      groupBookingCode: groupCode,
      groupRoomNumbers: isMultiRoom ? intent.roomNumbers : undefined,
    };

    result.push(booking);
  });

  return result;
}
