export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type RoomType = string;

export interface Room {
  id: string;
  roomNumber: string; // S1, S2, S3, S4, S5, S6
  name: string;
  type: string; // บ้านพักหลังใหญ่, บ้านพักหลังกลาง, บ้านพักหลังเล็ก
  sizeCategory?: 'large' | 'medium' | 'small';
  pricePerNight: number;
  status: RoomStatus;
  capacity: number;
  floor?: number;
  imageUrl?: string;
  amenities: string[];
  currentGuest?: {
    name: string;
    phone: string;
    checkIn: string;
    checkOut: string;
    bookingId: string;
  };
}

export type BookingStatus = 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled';
export type PaymentStatus = 'paid' | 'deposit' | 'pending';
export type PaymentMethod = 'transfer' | 'cash' | 'qr' | 'credit_card' | 'other';

export type AddOnCategory = 'bed' | 'mookata_small' | 'mookata_large' | 'breakfast' | 'drink' | 'custom';

export interface AddOnItem {
  id: string;
  name: string;
  category: AddOnCategory;
  price: number;
  quantity: number;
  createdAt: string;
}

export interface PaymentTransaction {
  id: string;
  amount: number;
  method: PaymentMethod;
  bankAccount?: string; // e.g. "กสิกรไทย (098-X-XXXXX)"
  slipImageUrl?: string; // Base64 or URL of payment slip image
  note?: string;
  paidAt: string; // ISO datetime string
  recordedBy?: string;
  cashReceived?: number; // Cash received from guest
  cashChange?: number; // Change given to guest
}

export interface Booking {
  id: string;
  bookingCode: string;
  guestName: string;
  guestPhone: string;
  guestIdCard?: string;
  channel: 'Direct' | 'Walk-in' | 'LINE Official' | 'Phone';
  roomId: string;
  roomNumber: string;
  roomType: string;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  totalNights: number;
  totalGuests: number;
  roomPrice: number; // Base room price
  addOns?: AddOnItem[]; // Extra bed, Mookata, Breakfast, Minibar
  transactions?: PaymentTransaction[]; // History of payments received with timestamps
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  deletedAt?: string; // ISO string when moved to trash
}

export type HousekeepingPriority = 'low' | 'medium' | 'high';
export type HousekeepingStatus = 'pending' | 'in_progress' | 'completed' | 'inspected' | 'dirty' | 'cleaned';

export interface HousekeepingTask {
  id: string;
  roomId?: string;
  roomNumber: string;
  roomType: string;
  type?: 'checkout_clean' | 'stayover_clean' | 'deep_clean' | 'touch_up';
  priority: HousekeepingPriority;
  status: HousekeepingStatus;
  assignedTo?: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  dueTime?: string;
  completedAt?: string;
}

export type TimeRangeFilter = 'daily' | 'monthly' | 'yearly';

export type ActivityLogCategory = 'booking' | 'payment' | 'room' | 'order' | 'system' | 'auth';

export interface ActivityLog {
  id: string;
  userEmail: string;
  userName: string;
  action: string;
  details: string;
  category: ActivityLogCategory;
  timestamp: string; // ISO string
  targetRoomNumber?: string;
  targetBookingCode?: string;
}

export type StaffRole = 'owner' | 'manager' | 'reception' | 'housekeeping';

export interface StaffMember {
  id: string;
  name: string;
  phone: string; // e.g. '0812345678'
  pin: string; // 4-6 digits, e.g. '1234'
  role: StaffRole;
  isActive: boolean;
  notes?: string;
  createdAt: string;
  email?: string;
}

export interface ResortSettings {
  resortNameEn: string;
  resortNameTh: string;
  phone: string;
  address: string;
  lineId?: string;
  facebook?: string;
  checkInTime: string;
  checkOutTime: string;
  receiptFooterMessage: string;
  
  // Room Rates Config
  rateMediumRoom: number; // S1, S2
  rateLargeRoom: number; // S3, S4
  rateSmallRoom: number; // S5, S6
  extraBedPrice: number; // 300
  extraBreakfastPrice: number; // 60
  mookataSmallPrice: number; // 350
  mookataLargePrice: number; // 500

  // Bank & PromptPay
  bankName: string;
  bankAccountNo: string;
  bankAccountName: string;
  promptPayNo: string;

  // Staff & Authorized PIN Access
  staffList?: StaffMember[];

  // External Mookata Supplier / Delivery Shop
  mookataSupplierName?: string;
  mookataSupplierPhone?: string;

  // Google & Email Whitelist Control
  allowedEmails?: string[];
  allowGoogleLogin?: boolean;
}
