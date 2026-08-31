export type RoomStatus = 'available' | 'occupied' | 'cleaning' | 'maintenance';
export type RoomType = string;

export interface Room {
  id: string;
  roomNumber: string;
  name: string;
  type: RoomType;
  pricePerNight: number;
  capacity: number;
  status: RoomStatus;
  floor?: number;
  amenities: string[];
  imageUrl?: string;
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
export type BookingChannel = 'LINE Official' | 'โทรศัพท์ (Phone)' | 'Walk-in' | 'Facebook Page';

export interface AddOnItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

export interface Booking {
  id: string;
  bookingCode: string;
  guestName: string;
  guestPhone: string;
  guestEmail?: string;
  channel: BookingChannel;
  roomId: string;
  roomNumber: string;
  roomType: RoomType;
  checkInDate: string; // YYYY-MM-DD
  checkOutDate: string; // YYYY-MM-DD
  totalNights: number;
  totalGuests: number;
  addOns?: AddOnItem[];
  totalAmount: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  status: BookingStatus;
  specialRequests?: string;
  createdAt: string;
  deletedAt?: string; // ISO string when moved to trash
}

export type HousekeepingPriority = 'low' | 'medium' | 'high';
export type HousekeepingStatus = 'dirty' | 'in_progress' | 'cleaned' | 'inspected';

export interface HousekeepingTask {
  id: string;
  roomNumber: string;
  roomType: string;
  assignedTo: string;
  status: HousekeepingStatus;
  priority: HousekeepingPriority;
  notes: string;
  updatedAt: string;
}

export type TimeRangeFilter = 'daily' | 'monthly' | 'yearly';
