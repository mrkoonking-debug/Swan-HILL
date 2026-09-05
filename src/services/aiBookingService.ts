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
  'พ.ค.': 5, 'พฤษภา': 5, 'พฤษภาคม': 5,
  'มิ.ย.': 6, 'มิถุนา': 6, 'มิถุนายน': 6,
  'ก.ค.': 7, 'กรกฎา': 7, 'กรกฎาคม': 7,
  'ส.ค.': 8, 'สิงหา': 8, 'สิงหาคม': 8,
  'ก.ย.': 9, 'กันยา': 9, 'กันยายน': 9,
  'ต.ค.': 10, 'ตุลา': 10, 'ตุลาคม': 10,
  'พ.ย.': 11, 'พฤศจิกา': 11, 'พฤศจิกายน': 11,
  'ธ.ค.': 12, 'ธันวา': 12, 'ธันวาคม': 12,
};

/**
 * Intelligent Deterministic Thai Natural Language Parser for Hotel Bookings
 */
export function parseThaiBookingText(
  text: string,
  rooms: Room[],
  bookings: Booking[]
): AIParseResult {
  const normalized = text.trim();
  const lower = normalized.toLowerCase();

  // Check for status queries first
  if (
    lower.includes('ว่างไหม') ||
    lower.includes('ห้องว่าง') ||
    lower.includes('มีห้องไหนว่าง') ||
    lower.includes('ว่างกี่ห้อง')
  ) {
    const today = formatLocalDate(new Date());
    const activeToday = bookings.filter(
      b => !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out' &&
      b.checkInDate <= today && b.checkOutDate > today
    );
    const bookedRooms = activeToday.map(b => b.roomNumber);
    const vacant = rooms.filter(r => !bookedRooms.includes(r.roomNumber));

    if (vacant.length === 0) {
      return {
        type: 'info',
        message: 'วันนี้บ้านพัก Swan HILL เต็มทุกหลังครับ (S1 - S6)',
      };
    }

    const vacantList = vacant.map(r => `ห้อง ${r.roomNumber} (${r.type || 'บ้านพัก'} ฿${r.pricePerNight.toLocaleString()}/คืน)`).join(', ');
    return {
      type: 'info',
      message: `วันนี้มีห้องว่างพร้อมรับ ${vacant.length} หลังครับ ได้แก่:\n${vacantList}`,
      suggestedAction: 'คลิกเพื่อสร้างการจองใหม่'
    };
  }

  // Detect Rooms: S1, S2, S3, S4, S5, S6
  const roomMatches = new Set<string>();
  const roomRegex = /(?:ห้อง|บ้าน|room)?\s*([sS][1-6]|[1-6])\b/g;
  let rMatch: RegExpExecArray | null;
  while ((rMatch = roomRegex.exec(normalized)) !== null) {
    let rNum = rMatch[1].toUpperCase();
    if (!rNum.startsWith('S')) rNum = 'S' + rNum;
    if (['S1', 'S2', 'S3', 'S4', 'S5', 'S6'].includes(rNum)) {
      roomMatches.add(rNum);
    }
  }

  // Detect Phone: 10 digits starting with 0 (e.g. 0812345678, 081-234-5678, 098 765 4321)
  const phoneRegex = /(0[689]\d{1}[- ]?\d{3}[- ]?\d{4}|0[2-57]\d{1}[- ]?\d{3}[- ]?\d{3,4})/;
  const phoneMatch = normalized.match(phoneRegex);
  const guestPhone = phoneMatch ? phoneMatch[0].replace(/[- ]/g, '') : '';

  // Detect Guest Name
  let guestName = '';
  const namePrefixMatch = normalized.match(/(?:ชื่อ|ลูกค้า|คุณ|k\.|khun)\s*([ก-๙a-zA-Z]+(?:\s+[ก-๙a-zA-Z]+)?)/);
  if (namePrefixMatch) {
    const rawName = namePrefixMatch[1].trim();
    // Exclude common keywords
    if (!['จอง', 'ห้อง', 'บ้าน', 'วัน', 'มัดจำ', 'หมูกระทะ'].includes(rawName)) {
      guestName = rawName.startsWith('คุณ') ? rawName : `คุณ${rawName}`;
    }
  }

  // Detect Dates
  const today = new Date();
  const currentYear = today.getFullYear();
  let checkInDate = formatLocalDate(today);
  let checkOutDate = shiftDateStr(checkInDate, 1);
  let totalNights = 1;

  // Pattern: วันที่ 10-12 ก.ย., 10 - 12 กันยายน, 15-16/09
  const rangeDateRegex = /(\d{1,2})\s*(?:-|ถึง|to)\s*(\d{1,2})\s*([ก-๙.]+)?(?:\s*(\d{2,4}))?/;
  const rangeMatch = normalized.match(rangeDateRegex);

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
    
    // Safety check
    if (d2 > d1) {
      totalNights = d2 - d1;
    } else {
      totalNights = 1;
      checkOutDate = shiftDateStr(checkInDate, 1);
    }
  } else if (normalized.includes('พรุ่งนี้')) {
    checkInDate = shiftDateStr(formatLocalDate(today), 1);
    checkOutDate = shiftDateStr(checkInDate, 1);
  } else if (normalized.includes('มะรืน') || normalized.includes('มะรืนนี้')) {
    checkInDate = shiftDateStr(formatLocalDate(today), 2);
    checkOutDate = shiftDateStr(checkInDate, 1);
  } else {
    // Single date pattern: วันที่ 15 ก.ย.
    const singleDateRegex = /(?:วันที่|วัน)?\s*(\d{1,2})\s*([ก-๙.]+)?(?:\s*(\d{2,4}))?/;
    const singleMatch = normalized.match(singleDateRegex);
    if (singleMatch && parseInt(singleMatch[1], 10) <= 31) {
      const d = parseInt(singleMatch[1], 10);
      const monthText = singleMatch[2] ? singleMatch[2].trim() : '';
      let m = today.getMonth() + 1;
      if (monthText) {
        for (const [key, val] of Object.entries(THAI_MONTH_MAP)) {
          if (monthText.includes(key)) {
            m = val;
            break;
          }
        }
      }
      checkInDate = `${currentYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      checkOutDate = shiftDateStr(checkInDate, 1);
    }
  }

  // Detect Nights: 2 คืน, 3 คืน
  const nightMatch = normalized.match(/(\d+)\s*คืน/);
  if (nightMatch) {
    totalNights = Math.max(1, parseInt(nightMatch[1], 10));
    checkOutDate = shiftDateStr(checkInDate, totalNights);
  }

  // Detect Add-Ons: หมูกระทะ & ที่นอนเสริม & อาหารเช้า
  let mookataSmall = 0;
  let mookataLarge = 0;
  let extraBeds = 0;
  let breakfast = 0;

  // หมูกระทะชุดใหญ่
  const mookataLargeMatch = normalized.match(/หมูกระทะ.*(?:ใหญ่|ชุดใหญ่)(?:\s*(\d+))?/);
  if (mookataLargeMatch) {
    mookataLarge = mookataLargeMatch[1] ? parseInt(mookataLargeMatch[1], 10) : 1;
  }

  // หมูกระทะชุดเล็ก
  const mookataSmallMatch = normalized.match(/หมูกระทะ.*(?:เล็ก|ชุดเล็ก)(?:\s*(\d+))?/);
  if (mookataSmallMatch) {
    mookataSmall = mookataSmallMatch[1] ? parseInt(mookataSmallMatch[1], 10) : 1;
  } else if (!mookataLarge && normalized.includes('หมูกระทะ')) {
    // If just "หมูกระทะ" without specifying size, default to large or small
    const qtyMatch = normalized.match(/หมูกระทะ(?:\s*(\d+))?/);
    mookataLarge = qtyMatch && qtyMatch[1] ? parseInt(qtyMatch[1], 10) : 1;
  }

  // ที่นอนเสริม
  const bedMatch = normalized.match(/(?:ที่นอนเสริม|เตียงเสริม|เสริมเตียง)(?:\s*(\d+))?/);
  if (bedMatch) {
    extraBeds = bedMatch[1] ? parseInt(bedMatch[1], 10) : 1;
  }

  // อาหารเช้า
  const bfMatch = normalized.match(/(?:อาหารเช้า|breakfast)(?:\s*(\d+))?/);
  if (bfMatch) {
    breakfast = bfMatch[1] ? parseInt(bfMatch[1], 10) : 1;
  }

  // Detect Deposit & Payments
  let depositAmount = 0;
  let paymentStatus: 'paid' | 'deposit' | 'pending' = 'pending';

  if (
    normalized.includes('จ่ายครบ') ||
    normalized.includes('โอนครบ') ||
    normalized.includes('จ่ายเต็ม') ||
    normalized.includes('โอนเต็ม') ||
    normalized.includes('ชำระครบ')
  ) {
    paymentStatus = 'paid';
  } else {
    // Look for deposit numbers: มัดจำ 1000, โอนมัดจำ 1,500, โอน 500
    const depositMatch = normalized.match(/(?:มัดจำ|โอน|จ่าย)(?:\s*แล้ว)?(?:\s*มา)?\s*([0-9,]+)/);
    if (depositMatch) {
      depositAmount = parseInt(depositMatch[1].replace(/,/g, ''), 10);
      if (depositAmount > 0) {
        paymentStatus = 'deposit';
      }
    }
  }

  // If at least a room is detected, construct the structured booking intent
  const detectedRoomNumbers = Array.from(roomMatches);
  if (detectedRoomNumbers.length > 0 || guestName || guestPhone) {
    const finalRoomNumbers = detectedRoomNumbers.length > 0 ? detectedRoomNumbers : ['S1'];
    
    // Calculate total price
    const selectedRooms = rooms.filter(r => finalRoomNumbers.includes(r.roomNumber));
    const roomRatePerNight = selectedRooms.reduce((sum, r) => sum + r.pricePerNight, 0) || 1200;
    const addOnsTotal = (mookataLarge * 500) + (mookataSmall * 350) + (extraBeds * 300) + (breakfast * 60);
    const estimatedTotal = (roomRatePerNight * totalNights) + addOnsTotal;

    if (paymentStatus === 'paid') {
      depositAmount = estimatedTotal;
    } else if (paymentStatus === 'deposit' && depositAmount === 0) {
      depositAmount = Math.round(estimatedTotal * 0.5);
    }

    // Construct Add-ons array
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

    // Check room conflicts in bookings list
    const activeBookings = bookings.filter(b => !b.deletedAt && b.status !== 'cancelled' && b.status !== 'checked_out');
    const conflicts: string[] = [];
    finalRoomNumbers.forEach(rNum => {
      const conflict = activeBookings.find(b => 
        b.roomNumber === rNum &&
        checkInDate < b.checkOutDate &&
        checkOutDate > b.checkInDate
      );
      if (conflict) {
        conflicts.push(`ห้อง ${rNum} ติดจองโดยคุณ ${conflict.guestName} (${conflict.checkInDate} ถึง ${conflict.checkOutDate})`);
      }
    });

    return {
      type: 'booking',
      roomNumbers: finalRoomNumbers,
      guestName: guestName || 'ลูกค้ารอแจ้งชื่อ',
      guestPhone: guestPhone || '-',
      checkInDate,
      checkOutDate,
      totalNights,
      paymentStatus,
      depositAmount,
      addOns: addOnsList,
      extraBeds,
      mookataSmall,
      mookataLarge,
      breakfast,
      isRoomAvailable: conflicts.length === 0,
      conflictDetails: conflicts.length > 0 ? conflicts.join(', ') : undefined,
      estimatedTotal
    };
  }

  // Greeting or general query
  if (lower.includes('สวัสดี') || lower.includes('hello') || lower.includes('hi')) {
    return {
      type: 'greeting',
      message: 'สวัสดีครับ! ผมคือผู้ช่วย AI ของ Swan HILL Resort\nคุณสามารถพิมพ์หรือวางข้อความแชทเพื่อบันทึกการจองได้ทันที เช่น:\n"จองห้อง S1 คุณสมชาย 081-234-5678 วันที่ 10-12 ก.ย. มัดจำ 1000 หมูกระทะชุดใหญ่ 1 ชุด"'
    };
  }

  return {
    type: 'unknown',
    message: 'ผมยังไม่ค่อยเข้าใจข้อมูลการจองครับ ลองพิมพ์หรือวางข้อความระบุ:\n1. เลขห้องพัก (เช่น S1, S2, S3...)\n2. ชื่อลูกค้าและเบอร์โทร\n3. วันที่เข้าพัก (เช่น 10-12 ก.ย. หรือ พรุ่งนี้)\n\nหรือคลิกที่ตัวอย่างด้านล่างได้เลยครับ'
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

    // Distribute deposit proportionally or put on first room
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
      totalGuests: room.capacity || 2,
      roomPrice: roomRate,
      addOns: roomAddOns,
      totalAmount: roomTotal,
      paidAmount: paidAmt,
      paymentStatus: intent.paymentStatus,
      status: 'confirmed',
      specialRequests: 'บันทึกอัตโนมัติผ่านผู้ช่วยแชท AI',
      createdAt: new Date().toISOString(),
      groupId,
      groupBookingCode: groupCode,
      groupRoomNumbers: isMultiRoom ? intent.roomNumbers : undefined,
    };

    result.push(booking);
  });

  return result;
}
