import type { Room, Booking, HousekeepingTask } from '../types/pms';

export const initialRooms: Room[] = [
  // 4 หลังเดี่ยว (Standalone Villas)
  {
    id: 'r-v1',
    roomNumber: 'บ้าน 1',
    name: 'สวอน วิลล่า 1 (หลังเดี่ยว)',
    type: 'วิลล่าเดี่ยวส่วนตัว',
    pricePerNight: 3500,
    capacity: 2,
    amenities: ['สระว่ายน้ำส่วนตัว', 'เตียงคิงไซส์', 'อ่างอาบน้ำ', 'วิวทะเลสาบ', 'Wi-Fi'],
    status: 'occupied',
    currentGuest: {
      name: 'คุณสุรชัย วงศ์สว่าง',
      phone: '081-987-6543',
      checkIn: '2026-08-30',
      checkOut: '2026-09-02',
      bookingId: 'b-101'
    }
  },
  {
    id: 'r-v2',
    roomNumber: 'บ้าน 2',
    name: 'สวอน วิลล่า 2 (หลังเดี่ยว)',
    type: 'วิลล่าเดี่ยวส่วนตัว',
    pricePerNight: 3500,
    capacity: 2,
    amenities: ['สระว่ายน้ำส่วนตัว', 'เตียงคิงไซส์', 'อ่างอาบน้ำ', 'วิวทะเลสาบ', 'Wi-Fi'],
    status: 'available'
  },
  {
    id: 'r-v3',
    roomNumber: 'บ้าน 3',
    name: 'สวอน วิลล่า 3 (หลังเดี่ยว)',
    type: 'วิลล่าเดี่ยวส่วนตัว',
    pricePerNight: 3500,
    capacity: 2,
    amenities: ['สระว่ายน้ำส่วนตัว', 'เตียงคิงไซส์', 'อ่างอาบน้ำ', 'วิวทะเลสาบ', 'Wi-Fi'],
    status: 'occupied',
    currentGuest: {
      name: 'คุณกิตติศักดิ์ พรเจริญ',
      phone: '089-456-7890',
      checkIn: '2026-08-31',
      checkOut: '2026-09-01',
      bookingId: 'b-102'
    }
  },
  {
    id: 'r-v4',
    roomNumber: 'บ้าน 4',
    name: 'สวอน วิลล่า 4 (หลังเดี่ยว)',
    type: 'วิลล่าเดี่ยวส่วนตัว',
    pricePerNight: 3500,
    capacity: 2,
    amenities: ['สระว่ายน้ำส่วนตัว', 'เตียงคิงไซส์', 'อ่างอาบน้ำ', 'วิวทะเลสาบ', 'Wi-Fi'],
    status: 'cleaning'
  },

  // 1 หลังคู่ (2 ห้องแยก รับลูกค้าได้ 2 เจ้า)
  {
    id: 'r-v5a',
    roomNumber: 'บ้าน 5 (ห้อง A)',
    name: 'สวอน ทวินวิลล่า 5 (ห้อง A)',
    type: 'บ้านแฝด 2 ห้อง (ห้อง A)',
    pricePerNight: 2800,
    capacity: 2,
    amenities: ['เตียงคิงไซส์', 'ห้องน้ำในตัว', 'ระเบียงชมวิว', 'แอร์', 'Wi-Fi'],
    status: 'available'
  },
  {
    id: 'r-v5b',
    roomNumber: 'บ้าน 5 (ห้อง B)',
    name: 'สวอน ทวินวิลล่า 5 (ห้อง B)',
    type: 'บ้านแฝด 2 ห้อง (ห้อง B)',
    pricePerNight: 2800,
    capacity: 2,
    amenities: ['เตียงคิงไซส์', 'ห้องน้ำในตัว', 'ระเบียงชมวิว', 'แอร์', 'Wi-Fi'],
    status: 'available'
  }
];

export const initialBookings: Booking[] = [
  {
    id: 'b-101',
    bookingCode: 'BK-20260830-01',
    guestName: 'คุณสุรชัย วงศ์สว่าง',
    guestPhone: '081-987-6543',
    channel: 'LINE Official',
    roomId: 'r-v1',
    roomNumber: 'บ้าน 1',
    roomType: 'วิลล่าเดี่ยวส่วนตัว',
    checkInDate: '2026-08-30',
    checkOutDate: '2026-09-02',
    totalNights: 3,
    totalGuests: 2,
    totalAmount: 10500,
    paidAmount: 10500,
    paymentStatus: 'paid',
    status: 'checked_in',
    specialRequests: 'จองทาง LINE ขอน้ำแข็งเพิ่มช่วงค่ำ',
    createdAt: '2026-08-25T10:00:00Z'
  },
  {
    id: 'b-102',
    bookingCode: 'BK-20260831-02',
    guestName: 'คุณกิตติศักดิ์ พรเจริญ',
    guestPhone: '089-456-7890',
    channel: 'LINE Official',
    roomId: 'r-v3',
    roomNumber: 'บ้าน 3',
    roomType: 'วิลล่าเดี่ยวส่วนตัว',
    checkInDate: '2026-08-31',
    checkOutDate: '2026-09-01',
    totalNights: 1,
    totalGuests: 2,
    totalAmount: 3500,
    paidAmount: 3500,
    paymentStatus: 'paid',
    status: 'checked_in',
    specialRequests: 'เช็คอินช่วง 15:00 น.',
    createdAt: '2026-08-28T14:30:00Z'
  },
  {
    id: 'b-103',
    bookingCode: 'BK-20260902-03',
    guestName: 'คุณพัชราภรณ์ สดใส',
    guestPhone: '092-333-4455',
    channel: 'LINE Official',
    roomId: 'r-v5a',
    roomNumber: 'บ้าน 5 (ห้อง A)',
    roomType: 'บ้านแฝด 2 ห้อง (ห้อง A)',
    checkInDate: '2026-09-02',
    checkOutDate: '2026-09-04',
    totalNights: 2,
    totalGuests: 2,
    totalAmount: 5600,
    paidAmount: 2800,
    paymentStatus: 'deposit',
    status: 'confirmed',
    specialRequests: 'จองทาง LINE โอนมัดจำแล้ว 2,800 บาท',
    createdAt: '2026-08-30T11:20:00Z'
  }
];

export const initialHousekeeping: HousekeepingTask[] = [
  {
    id: 'hk-1',
    roomNumber: 'บ้าน 4',
    roomType: 'วิลล่าเดี่ยวส่วนตัว',
    assignedTo: 'แม่บ้านสมศรี',
    status: 'in_progress',
    priority: 'high',
    notes: 'เปลี่ยนชุดเครื่องนอน และเติมของใช้ในห้องน้ำ',
    updatedAt: '10:30'
  }
];
