import type { Room, Booking, ResortSettings, ActivityLog } from '../types/pms';

export const initialRooms: Room[] = [
  // 1. บ้านพักหลังใหญ่ (1,500 บาท/คืน)
  {
    id: 'room-s3',
    roomNumber: 'S3',
    name: 'บ้าน S3 (หลังใหญ่)',
    type: 'บ้านพักหลังใหญ่',
    sizeCategory: 'large',
    pricePerNight: 1500,
    status: 'available',
    capacity: 4,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงชมวิว', 'ที่จอดรถส่วนตัว'],
  },
  {
    id: 'room-s4',
    roomNumber: 'S4',
    name: 'บ้าน S4 (หลังใหญ่)',
    type: 'บ้านพักหลังใหญ่',
    sizeCategory: 'large',
    pricePerNight: 1500,
    status: 'available',
    capacity: 4,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงชมวิว', 'ที่จอดรถส่วนตัว'],
  },

  // 2. บ้านพักหลังกลาง (1,200 บาท/คืน)
  {
    id: 'room-s1',
    roomNumber: 'S1',
    name: 'บ้าน S1 (หลังกลาง)',
    type: 'บ้านพักหลังกลาง',
    sizeCategory: 'medium',
    pricePerNight: 1200,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงส่วนตัว'],
  },
  {
    id: 'room-s2',
    roomNumber: 'S2',
    name: 'บ้าน S2 (หลังกลาง)',
    type: 'บ้านพักหลังกลาง',
    sizeCategory: 'medium',
    pricePerNight: 1200,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงส่วนตัว'],
  },

  // 3. บ้านพักแฝดหลังเล็ก (1,000 บาท/คืน - บ้านคู่ติดกัน S5 & S6)
  {
    id: 'room-s5',
    roomNumber: 'S5',
    name: 'บ้าน S5 (บ้านแฝดซ้าย)',
    type: 'บ้านพักแฝดหลังเล็ก',
    sizeCategory: 'small',
    pricePerNight: 1000,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'วิวธรรมชาติ'],
  },
  {
    id: 'room-s6',
    roomNumber: 'S6',
    name: 'บ้าน S6 (บ้านแฝดขวา)',
    type: 'บ้านพักแฝดหลังเล็ก',
    sizeCategory: 'small',
    pricePerNight: 1000,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'วิวธรรมชาติ'],
  },
];

export const initialBookings: Booking[] = [];

export const initialSettings: ResortSettings = {
  resortNameEn: 'SWAN HILL RESORT',
  resortNameTh: 'สวอนฮิลล์ รีสอร์ท',
  phone: '081-234-5678',
  address: 'ตำบลหนองรี อำเภอเมือง จังหวัดชลบุรี',
  lineId: '@swanhill',
  facebook: 'Swan HILL Resort',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  receiptFooterMessage: 'ขอบพระคุณที่ไว้วางใจเลือกพักกับ Swan HILL Resort ขอให้มีความสุขและความสะดวกสบายตลอดการเข้าพัก',
  
  // Room Rates Config
  rateMediumRoom: 1200, // S1, S2
  rateLargeRoom: 1500, // S3, S4
  rateSmallRoom: 1000, // S5, S6
  extraBedPrice: 300,
  extraBreakfastPrice: 60,
  mookataSmallPrice: 350,
  mookataLargePrice: 500,

  // Bank Account
  bankName: 'กสิกรไทย (KBANK)',
  bankAccountNo: '123-4-56789-0',
  bankAccountName: 'สวอนฮิลล์ รีสอร์ท',
  promptPayNo: '081-234-5678',

  // Staff & Authorized PIN Access
  staffList: [],

  // External Mookata Supplier
  mookataSupplierName: 'ร้านหมูกระทะ',
  mookataSupplierPhone: '081-234-5678',

  // Google & Email Whitelist Control
  allowedEmails: [],
  allowGoogleLogin: true,
};

export const initialLogs: ActivityLog[] = [];


