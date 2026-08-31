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

export type AddOnCategory = 'bed' | 'mookata_small' | 'mookata_large' | 'breakfast' | 'drink' | 'custom';

export interface AddOnItem {
  id: string;
  name: string;
  category: AddOnCategory;
  price: number;
  quantity: number;
  createdAt: string;
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
