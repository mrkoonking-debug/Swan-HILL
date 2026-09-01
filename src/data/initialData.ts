import type { Room, Booking, ResortSettings, ActivityLog } from '../types/pms';

export const initialRooms: Room[] = [
  // 1. บ้านพักหลังใหญ่ (1,500 บาท/คืน)
  {
    id: 'room-s3',
    roomNumber: 'S3',
    name: 'สวอน วิลล่า S3 (หลังใหญ่)',
    type: 'บ้านพักหลังใหญ่',
    sizeCategory: 'large',
    pricePerNight: 1500,
    status: 'occupied',
    capacity: 4,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงชมวิว', 'ที่จอดรถส่วนตัว'],
    currentGuest: {
      name: 'คุณสุรชัย วงศ์สว่าง',
      phone: '081-987-6543',
      checkIn: '2026-08-30',
      checkOut: '2026-09-02',
      bookingId: 'b-101'
    }
  },
  {
    id: 'room-s4',
    roomNumber: 'S4',
    name: 'สวอน วิลล่า S4 (หลังใหญ่)',
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
    name: 'สวอน วิลล่า S1 (หลังกลาง)',
    type: 'บ้านพักหลังกลาง',
    sizeCategory: 'medium',
    pricePerNight: 1200,
    status: 'occupied',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงส่วนตัว'],
    currentGuest: {
      name: 'คุณกิตติศักดิ์ พรเจริญ',
      phone: '089-456-7890',
      checkIn: '2026-08-31',
      checkOut: '2026-09-01',
      bookingId: 'b-102'
    }
  },
  {
    id: 'room-s2',
    roomNumber: 'S2',
    name: 'สวอน วิลล่า S2 (หลังกลาง)',
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
    name: 'สวอน วิลล่า S5 (บ้านแฝดซ้าย)',
    type: 'บ้านพักแฝดหลังเล็ก',
    sizeCategory: 'small',
    pricePerNight: 1000,
    status: 'cleaning',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'วิวธรรมชาติ'],
  },
  {
    id: 'room-s6',
    roomNumber: 'S6',
    name: 'สวอน วิลล่า S6 (บ้านแฝดขวา)',
    type: 'บ้านพักแฝดหลังเล็ก',
    sizeCategory: 'small',
    pricePerNight: 1000,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'วิวธรรมชาติ'],
  },
];

export const initialBookings: Booking[] = [
  {
    id: 'b-101',
    bookingCode: 'BK-20260830-01',
    guestName: 'คุณสุรชัย วงศ์สว่าง',
    guestPhone: '081-987-6543',
    channel: 'LINE Official',
    roomId: 'room-s3',
    roomNumber: 'S3',
    roomType: 'บ้านพักหลังใหญ่',
    checkInDate: '2026-08-30',
    checkOutDate: '2026-09-02',
    totalNights: 3,
    totalGuests: 4,
    roomPrice: 1500,
    addOns: [
      { id: 'ad-1', name: 'ที่นอนเสริม 1 ชุด', category: 'bed', price: 300, quantity: 1, createdAt: '2026-08-30T14:00:00Z' },
      { id: 'ad-2', name: 'หมูกระทะชุดใหญ่', category: 'mookata_large', price: 500, quantity: 1, createdAt: '2026-08-30T18:00:00Z' }
    ],
    totalAmount: 5300,
    paidAmount: 4500,
    paymentStatus: 'deposit',
    status: 'checked_in',
    specialRequests: 'ขอเตาหมูกระทะตอน 18:00 น.',
    createdAt: '2026-08-25T10:00:00Z'
  },
  {
    id: 'b-102',
    bookingCode: 'BK-20260831-02',
    guestName: 'คุณกิตติศักดิ์ พรเจริญ',
    guestPhone: '089-456-7890',
    channel: 'Phone',
    roomId: 'room-s1',
    roomNumber: 'S1',
    roomType: 'บ้านพักหลังกลาง',
    checkInDate: '2026-08-31',
    checkOutDate: '2026-09-01',
    totalNights: 1,
    totalGuests: 2,
    roomPrice: 1200,
    addOns: [
      { id: 'ad-3', name: 'หมูกระทะชุดเล็ก', category: 'mookata_small', price: 350, quantity: 1, createdAt: '2026-08-31T15:00:00Z' }
    ],
    totalAmount: 1550,
    paidAmount: 1550,
    paymentStatus: 'paid',
    status: 'checked_in',
    specialRequests: 'เช็คอินช่วงบ่าย',
    createdAt: '2026-08-28T11:00:00Z'
  },
  {
    id: 'b-103',
    bookingCode: 'BK-20260901-03',
    guestName: 'คุณพัชราภรณ์ สดใส',
    guestPhone: '092-333-4455',
    channel: 'LINE Official',
    roomId: 'room-s5',
    roomNumber: 'S5',
    roomType: 'บ้านพักแฝดหลังเล็ก',
    checkInDate: '2026-09-01',
    checkOutDate: '2026-09-03',
    totalNights: 2,
    totalGuests: 2,
    roomPrice: 1000,
    addOns: [
      { id: 'ad-4', name: 'อาหารเช้า 2 ท่าน', category: 'breakfast', price: 60, quantity: 2, createdAt: '2026-08-29T10:00:00Z' }
    ],
    totalAmount: 2120,
    paidAmount: 2120,
    paymentStatus: 'paid',
    status: 'confirmed',
    specialRequests: 'โอนมัดจำครบแล้ว',
    createdAt: '2026-08-29T09:00:00Z'
  },
  {
    id: 'b-104',
    bookingCode: 'BK-20260902-04',
    guestName: 'คุณธนากร เลิศวิริยะ',
    guestPhone: '083-777-8899',
    channel: 'Direct',
    roomId: 'room-s4',
    roomNumber: 'S4',
    roomType: 'บ้านพักหลังใหญ่',
    checkInDate: '2026-09-02',
    checkOutDate: '2026-09-04',
    totalNights: 2,
    totalGuests: 4,
    roomPrice: 1500,
    addOns: [
      { id: 'ad-5', name: 'ที่นอนเสริม 1 ชุด', category: 'bed', price: 300, quantity: 1, createdAt: '2026-08-30T10:00:00Z' }
    ],
    totalAmount: 3300,
    paidAmount: 1500,
    paymentStatus: 'deposit',
    status: 'confirmed',
    specialRequests: 'ผู้ใหญ่ 4 ท่าน เด็ก 1 คน',
    createdAt: '2026-08-30T08:30:00Z'
  }
];

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
  allowedEmails: [
    '67708153@chonburi.spu.ac.th',
    'admin@swanhill.com',
  ],
  allowGoogleLogin: true,
};

export const initialLogs: ActivityLog[] = [
  {
    id: 'log-1',
    userEmail: 'admin@swanhill.com',
    userName: 'ผู้ดูแลระบบ Swan HILL',
    action: 'บันทึกการจองห้องพักใหม่',
    details: 'จองห้อง S3 (คุณสุรชัย วงศ์สว่าง) รหัส BK-20260830-01 วันที่ 30 ส.ค. - 02 ก.ย.',
    category: 'booking',
    targetRoomNumber: 'S3',
    targetBookingCode: 'BK-20260830-01',
    timestamp: '2026-08-30T10:00:00Z',
  },
  {
    id: 'log-2',
    userEmail: 'admin@swanhill.com',
    userName: 'ผู้ดูแลระบบ Swan HILL',
    action: 'บันทึกรับเงินมัดจำ',
    details: 'รับโอนเงินมัดจำ ฿4,500 บาท สำหรับห้อง S3 (BK-20260830-01)',
    category: 'payment',
    targetRoomNumber: 'S3',
    targetBookingCode: 'BK-20260830-01',
    timestamp: '2026-08-30T10:05:00Z',
  },
  {
    id: 'log-3',
    userEmail: 'staff@swanhill.com',
    userName: 'พนักงานต้อนรับ',
    action: 'เช็คอินลูกค้าเข้าพัก',
    details: 'เช็คอินห้อง S1 (คุณกิตติศักดิ์ พรเจริญ) รหัส BK-20260831-02',
    category: 'room',
    targetRoomNumber: 'S1',
    targetBookingCode: 'BK-20260831-02',
    timestamp: '2026-08-31T14:10:00Z',
  },
  {
    id: 'log-4',
    userEmail: 'staff@swanhill.com',
    userName: 'พนักงานต้อนรับ',
    action: 'เพิ่มออเดอร์หมูกระทะ',
    details: 'สั่งหมูกระทะชุดเล็ก 1 ชุด (฿350) ให้ห้อง S1',
    category: 'order',
    targetRoomNumber: 'S1',
    targetBookingCode: 'BK-20260831-02',
    timestamp: '2026-08-31T15:00:00Z',
  },
];
