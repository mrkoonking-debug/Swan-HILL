import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase';
import AuthPage from './AuthPage';
import { Sidebar, type ActiveTab } from './components/Sidebar';
import { MobileDrawer } from './components/MobileDrawer';
import { BottomNav } from './components/BottomNav';
import { Header } from './components/Header';
import { DashboardView } from './components/DashboardView';
import { TimelineCalendarView } from './components/TimelineCalendarView';
import { BookingsView } from './components/BookingsView';
import { FinanceView } from './components/FinanceView';
import { NewBookingModal } from './components/NewBookingModal';
import { AddOrderModal } from './components/AddOrderModal';
import { ReceiptModal } from './components/ReceiptModal';
import { PaymentModal } from './components/PaymentModal';
import { CheckoutModal } from './components/CheckoutModal';
import { LogsView } from './components/LogsView';
import { SettingsView } from './components/SettingsView';
import { QuickAvailabilityModal } from './components/QuickAvailabilityModal';
import { AIAssistantModal } from './components/AIAssistantModal';
import { Sparkles, Calendar } from 'lucide-react';
import { usePWA } from './hooks/usePWA';
import { PWAInstallModal, PWAUpdateBanner } from './components/PWAInstallModal';
import { initialRooms, initialBookings, initialSettings, initialLogs } from './data/initialData';
import { formatLocalDate } from './utils/dateUtils';
import type { Room, Booking, RoomStatus, AddOnItem, PaymentTransaction, PaymentMethod, ResortSettings, ActivityLog, ActivityLogCategory } from './types/pms';
import { 
  subscribeToBookings, 
  saveBookingToFirestore, 
  deleteBookingFromFirestore,
  subscribeToRooms,
  saveRoomToFirestore,
  batchSaveRoomsToFirestore,
  subscribeToSettings,
  saveSettingsToFirestore,
  subscribeToLogs,
  saveLogToFirestore
} from './services/firebaseService';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  phone?: string;
  role?: string;
}

// Safe non-blocking localStorage writer (prevents main thread jank and handles storage quota safely)
const safeSetLocalStorage = (key: string, data: unknown) => {
  try {
    const serialized = JSON.stringify(data);
    localStorage.setItem(key, serialized);
  } catch (err) {
    console.warn(`[LocalStorage] Failed to cache ${key}:`, err);
  }
};

const getTodayThaiLongDate = () => {
  const now = new Date();
  const dayNames = ['วันอาทิตย์', 'วันจันทร์', 'วันอังคาร', 'วันพุธ', 'วันพฤหัสบดี', 'วันศุกร์', 'วันเสาร์'];
  const thaiMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  const dayName = dayNames[now.getDay()];
  const day = now.getDate();
  const month = thaiMonths[now.getMonth()];
  const yearBE = now.getFullYear() + 543;
  return `${dayName}ที่ ${day} ${month} ${yearBE}`;
};

// Main PMS Dashboard Layout Component
const MainDashboard = ({ user }: { user: AuthUser }) => {
  const location = useLocation();
  const navigate = useNavigate();

  // Derive activeTab cleanly from the browser URL path
  const currentPath = location.pathname.replace('/', '') as ActiveTab;
  const validTabs: ActiveTab[] = ['dashboard', 'timeline', 'bookings', 'finance', 'logs', 'settings'];
  const activeTab: ActiveTab = validTabs.includes(currentPath) ? currentPath : 'dashboard';

  // PWA Install & Update Lifecycle
  const {
    isInstalled,
    isIOS,
    showIOSModal,
    setShowIOSModal,
    needRefresh,
    installApp,
    reloadApp,
  } = usePWA();
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);

  const setActiveTab = (tab: ActiveTab) => {
    navigate(`/${tab}`);
  };

  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [isQuickCheckerOpen, setIsQuickCheckerOpen] = useState(false);
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);
  
  // Use IDs for dynamic reactive booking modals
  const [selectedBookingForAddOrderId, setSelectedBookingForAddOrderId] = useState<string | null>(null);
  const [selectedBookingForReceiptId, setSelectedBookingForReceiptId] = useState<string | null>(null);
  const [selectedBookingForPaymentId, setSelectedBookingForPaymentId] = useState<string | null>(null);
  const [selectedBookingForCheckoutId, setSelectedBookingForCheckoutId] = useState<string | null>(null);

  const [prefillRoomId, setPrefillRoomId] = useState<string | undefined>();
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [prefillCheckOutDate, setPrefillCheckOutDate] = useState<string | undefined>();
  const [prefillGuestName, setPrefillGuestName] = useState<string | undefined>();
  const [prefillGuestPhone, setPrefillGuestPhone] = useState<string | undefined>();
  const [prefillGroupId, setPrefillGroupId] = useState<string | undefined>();
  const [prefillGroupBookingCode, setPrefillGroupBookingCode] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  // Resort Settings State (with Firebase Sync + Local fallback)
  const [settings, setSettings] = useState<ResortSettings>(() => {
    const saved = localStorage.getItem('swanhill_settings_v1');
    if (!saved) return initialSettings;
    try {
      return JSON.parse(saved);
    } catch {
      return initialSettings;
    }
  });

  // Audit Logs State (with Firebase Sync + Local fallback)
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    localStorage.removeItem('swanhill_logs_v1');
    const saved = localStorage.getItem('swanhill_logs_v2');
    if (!saved) return initialLogs;
    try {
      return JSON.parse(saved);
    } catch {
      return initialLogs;
    }
  });

  // PMS Rooms State
  const [rooms, setRooms] = useState<Room[]>(() => {
    // Purge legacy mock caches
    localStorage.removeItem('swanhill_rooms_v3');
    localStorage.removeItem('swanhill_rooms_v2');
    localStorage.removeItem('swanhill_rooms');
    const saved = localStorage.getItem('swanhill_rooms_v4');
    if (!saved) return initialRooms;
    try {
      const parsed: Room[] = JSON.parse(saved);
      if (parsed.length !== 6 || !parsed.some(r => r.roomNumber === 'S6') || parsed.some(r => r.currentGuest?.name?.includes('สุรชัย') || r.currentGuest?.name?.includes('กิตติศักดิ์'))) {
        return initialRooms;
      }
      return parsed;
    } catch {
      return initialRooms;
    }
  });

  // PMS Bookings State
  const [bookings, setBookings] = useState<Booking[]>(() => {
    // Purge legacy mock caches
    localStorage.removeItem('swanhill_bookings_v3');
    localStorage.removeItem('swanhill_bookings_v2');
    localStorage.removeItem('swanhill_bookings');
    const saved = localStorage.getItem('swanhill_bookings_v4');
    if (!saved) return initialBookings;
    try {
      const parsed: Booking[] = JSON.parse(saved);
      if (parsed.some(b => b.guestName?.includes('สุรชัย') || b.guestName?.includes('กิตติศักดิ์') || b.id === 'b-101')) {
        return initialBookings;
      }
      const now = Date.now();
      const fifteenDaysMs = 15 * 24 * 60 * 60 * 1000;
      return parsed.filter(b => {
        if (!b.deletedAt) return true;
        const deleteTime = new Date(b.deletedAt).getTime();
        return (now - deleteTime) < fifteenDaysMs;
      });
    } catch {
      return initialBookings;
    }
  });

  // FIREBASE REALTIME SUBSCRIPTIONS
  useEffect(() => {
    let bookingsTimer: ReturnType<typeof setTimeout> | undefined;
    let logsTimer: ReturnType<typeof setTimeout> | undefined;

    const unsubBookings = subscribeToBookings((liveBookings) => {
      setBookings(liveBookings);
      if (bookingsTimer) clearTimeout(bookingsTimer);
      bookingsTimer = setTimeout(() => {
        safeSetLocalStorage('swanhill_bookings_v4', liveBookings);
      }, 500);
    });

    const unsubRooms = subscribeToRooms((liveRooms) => {
      setRooms(liveRooms);
      safeSetLocalStorage('swanhill_rooms_v4', liveRooms);
    });

    const unsubSettings = subscribeToSettings((liveSettings) => {
      setSettings(liveSettings);
      safeSetLocalStorage('swanhill_settings_v1', liveSettings);
    });

    const unsubLogs = subscribeToLogs((liveLogs) => {
      setLogs(liveLogs);
      if (logsTimer) clearTimeout(logsTimer);
      logsTimer = setTimeout(() => {
        safeSetLocalStorage('swanhill_logs_v2', liveLogs);
      }, 500);
    });

    return () => {
      if (bookingsTimer) clearTimeout(bookingsTimer);
      if (logsTimer) clearTimeout(logsTimer);
      unsubBookings();
      unsubRooms();
      unsubSettings();
      unsubLogs();
    };
  }, []);

  // Dynamically resolve active modal bookings from live bookings state
  const selectedBookingForPayment = bookings.find(b => b.id === selectedBookingForPaymentId) || null;
  const selectedBookingForAddOrder = bookings.find(b => b.id === selectedBookingForAddOrderId) || null;
  const selectedBookingForReceipt = bookings.find(b => b.id === selectedBookingForReceiptId) || null;
  const selectedBookingForCheckout = bookings.find(b => b.id === selectedBookingForCheckoutId) || null;

  // Helper: Auto-Record Audit Log
  const addLog = (
    action: string, 
    details: string, 
    category: ActivityLogCategory, 
    targetRoomNumber?: string, 
    targetBookingCode?: string
  ) => {
    const newLog: ActivityLog = {
      id: 'log-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
      userEmail: user.email || 'admin@swanhill.com',
      userName: user.displayName || user.email?.split('@')[0] || 'ผู้ดูแลระบบ Swan HILL',
      action,
      details,
      category,
      timestamp: new Date().toISOString(),
      targetRoomNumber,
      targetBookingCode,
    };
    setLogs(prev => [newLog, ...prev]);
    saveLogToFirestore(newLog);
  };

  // Action: Update Room Status
  const handleUpdateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    const r = rooms.find(item => item.id === roomId || item.roomNumber === roomId);
    const targetId = r ? r.id : roomId;
    const updatedRooms = rooms.map(item => {
      if (item.id === targetId || item.roomNumber === targetId) {
        return {
          ...item,
          status: newStatus,
          currentGuest: newStatus === 'available' ? undefined : item.currentGuest,
        };
      }
      return item;
    });
    setRooms(updatedRooms);
    if (r) {
      saveRoomToFirestore({
        ...r,
        status: newStatus,
        currentGuest: newStatus === 'available' ? undefined : r.currentGuest,
      });
    }
    addLog(
      'เปลี่ยนสถานะห้องพัก',
      `เปลี่ยนสถานะห้อง ${r?.roomNumber || roomId} เป็น ${newStatus === 'available' ? 'ว่างพร้อมขาย' : newStatus === 'cleaning' ? 'กำลังทำความสะอาด' : newStatus === 'maintenance' ? 'ปิดปรับปรุง' : 'มีคนพัก'}`,
      'room',
      r?.roomNumber
    );
  };

  // Action: Open normal new booking modal
  const handleOpenNormalBooking = () => {
    setPrefillRoomId(undefined);
    setPrefillDate(undefined);
    setPrefillCheckOutDate(undefined);
    setPrefillGuestName(undefined);
    setPrefillGuestPhone(undefined);
    setPrefillGroupId(undefined);
    setPrefillGroupBookingCode(undefined);
    setIsNewBookingOpen(true);
  };

  // Action: Open clone / add another room for the same guest
  const handleOpenCloneBooking = (existingBooking: Booking) => {
    setPrefillGuestName(existingBooking.guestName);
    setPrefillGuestPhone(existingBooking.guestPhone);
    setPrefillDate(existingBooking.checkInDate);
    setPrefillCheckOutDate(existingBooking.checkOutDate);
    const groupId = existingBooking.groupId || ('grp-' + existingBooking.id);
    const groupCode = existingBooking.groupBookingCode || (`GRP-${existingBooking.checkInDate.replace(/-/g, '')}-${existingBooking.roomNumber}`);
    setPrefillGroupId(groupId);
    setPrefillGroupBookingCode(groupCode);
    setPrefillRoomId(undefined);
    setIsNewBookingOpen(true);
  };

  // Action: Open timeline booking modal with prefilled room and date
  const handleOpenTimelineBooking = (roomId: string, date: string) => {
    setPrefillRoomId(roomId);
    setPrefillDate(date);
    setPrefillCheckOutDate(undefined);
    setPrefillGuestName(undefined);
    setPrefillGuestPhone(undefined);
    setPrefillGroupId(undefined);
    setPrefillGroupBookingCode(undefined);
    setIsNewBookingOpen(true);
  };

  // Action: Check-In Guest
  const handleCheckInGuest = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const updatedBooking: Booking = { ...b, status: 'checked_in' };
    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    // Update Room to Occupied
    setRooms(prev => prev.map(r => {
      if (r.id === b.roomId) {
        const updatedRoom: Room = {
          ...r,
          status: 'occupied',
          currentGuest: {
            name: b.guestName,
            phone: b.guestPhone,
            checkIn: b.checkInDate,
            checkOut: b.checkOutDate,
            bookingId: b.id
          }
        };
        saveRoomToFirestore(updatedRoom);
        return updatedRoom;
      }
      return r;
    }));

    addLog('เช็คอินลูกค้า', `เช็คอินห้อง ${b.roomNumber} (${b.guestName}) รหัส ${b.bookingCode}`, 'room', b.roomNumber, b.bookingCode);
  };

  // Action: Record Payment Transaction (Saved to Firebase Firestore)
  const handleRecordPayment = (bookingId: string, transaction: PaymentTransaction) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;
    
    const newTransactions = [...(b.transactions || []), transaction];
    const newPaidAmount = newTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const roomBase = b.roomPrice * (b.totalNights || 1);
    const addOnsSum = b.addOns?.reduce((s, a) => s + (a.price * a.quantity), 0) || 0;
    const grandTotal = b.totalAmount || (roomBase + addOnsSum);
    const newPaymentStatus = newPaidAmount >= grandTotal ? 'paid' : (newPaidAmount > 0 ? 'deposit' : 'pending');

    const updatedBooking: Booking = {
      ...b,
      paidAmount: newPaidAmount,
      paymentStatus: newPaymentStatus,
      transactions: newTransactions,
    };

    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    addLog(
      'บันทึกรับชำระเงิน',
      `รับเงิน ${transaction.method === 'transfer' ? 'โอนเงิน' : transaction.method === 'cash' ? 'เงินสด' : 'บัตร'} ฿${transaction.amount.toLocaleString()} บาท ห้อง ${b.roomNumber} (${transaction.note || 'รับชำระ'})`,
      'payment',
      b.roomNumber,
      b.bookingCode
    );
  };

  // Action: Update Past Payment Transaction (Saved to Firebase Firestore)
  const handleUpdatePaymentTransaction = (bookingId: string, transactionId: string, updated: Partial<PaymentTransaction>) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;
    
    const newTransactions = (b.transactions || []).map(tx => 
      tx.id === transactionId ? { ...tx, ...updated } : tx
    );
    const newPaidAmount = newTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const roomBase = b.roomPrice * (b.totalNights || 1);
    const addOnsSum = b.addOns?.reduce((s, a) => s + (a.price * a.quantity), 0) || 0;
    const grandTotal = b.totalAmount || (roomBase + addOnsSum);
    const newPaymentStatus = newPaidAmount >= grandTotal ? 'paid' : (newPaidAmount > 0 ? 'deposit' : 'pending');

    const updatedBooking: Booking = {
      ...b,
      paidAmount: newPaidAmount,
      paymentStatus: newPaymentStatus,
      transactions: newTransactions,
    };

    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    addLog('แก้ไขยอดรับเงิน', `แก้ไขข้อมูลการรับเงิน ห้อง ${b.roomNumber} (${b.bookingCode})`, 'payment', b.roomNumber, b.bookingCode);
  };

  // Action: Delete Payment Transaction (Saved to Firebase Firestore)
  const handleDeletePaymentTransaction = (bookingId: string, transactionId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;
    
    const newTransactions = (b.transactions || []).filter(tx => tx.id !== transactionId);
    const newPaidAmount = newTransactions.reduce((sum, tx) => sum + tx.amount, 0);
    const roomBase = b.roomPrice * (b.totalNights || 1);
    const addOnsSum = b.addOns?.reduce((s, a) => s + (a.price * a.quantity), 0) || 0;
    const grandTotal = b.totalAmount || (roomBase + addOnsSum);
    const newPaymentStatus = newPaidAmount >= grandTotal ? 'paid' : (newPaidAmount > 0 ? 'deposit' : 'pending');

    const updatedBooking: Booking = {
      ...b,
      paidAmount: newPaidAmount,
      paymentStatus: newPaymentStatus,
      transactions: newTransactions,
    };

    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    addLog('ลบรายการรับเงิน', `ลบรายการรับเงินในห้อง ${b.roomNumber} (${b.bookingCode})`, 'payment', b.roomNumber, b.bookingCode);
  };

  // Action: Confirm Checkout (with optional payment collection)
  const handleConfirmCheckout = (bookingId: string, paymentReceived?: { amount: number; method: PaymentMethod }) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    let updatedPaid = b.paidAmount;
    let updatedTransactions = [...(b.transactions || [])];
    let updatedStatus = b.paymentStatus;

    if (paymentReceived) {
      updatedPaid += paymentReceived.amount;
      updatedTransactions.push({
        id: 'tx-' + Date.now(),
        amount: paymentReceived.amount,
        method: paymentReceived.method,
        note: 'ชำระยอดคงเหลือตอนเช็คเอาท์',
        paidAt: new Date().toISOString(),
      });
      updatedStatus = 'paid';
    }

    const today = formatLocalDate(new Date());
    let finalCheckOutDate = b.checkOutDate;
    let finalTotalNights = b.totalNights;

    // Smart Early Checkout: If guest departs today before original check-out date,
    // adjust checkOutDate to today so tonight is instantly unlocked for new guests!
    if (b.checkInDate <= today && b.checkOutDate > today) {
      finalCheckOutDate = today;
      const d1 = new Date(b.checkInDate + 'T00:00:00');
      const d2 = new Date(today + 'T00:00:00');
      const diff = Math.round((d2.getTime() - d1.getTime()) / (1000 * 60 * 60 * 24));
      finalTotalNights = Math.max(1, diff);
    }

    const updatedBooking: Booking = {
      ...b,
      checkOutDate: finalCheckOutDate,
      totalNights: finalTotalNights,
      status: 'checked_out',
      paidAmount: updatedPaid,
      paymentStatus: updatedStatus,
      transactions: updatedTransactions,
    };

    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    // Set Room Status to Cleaning in Firestore
    setRooms(prev => prev.map(r => {
      if (r.id === b.roomId || r.currentGuest?.bookingId === bookingId) {
        const updatedRoom: Room = { ...r, status: 'cleaning', currentGuest: undefined };
        saveRoomToFirestore(updatedRoom);
        return updatedRoom;
      }
      return r;
    }));

    addLog('เช็คเอาท์ลูกค้า', `เช็คเอาท์ห้อง ${b.roomNumber} (${b.guestName}) รหัส ${b.bookingCode}`, 'room', b.roomNumber, b.bookingCode);
  };

  // Action: Add New Booking (Supports Single and Multi-Room Group Bookings)
  const handleAddBooking = (newBookingOrList: Booking | Booking[]) => {
    const newBookings = Array.isArray(newBookingOrList) ? newBookingOrList : [newBookingOrList];
    const today = formatLocalDate(new Date());

    newBookings.forEach(newBooking => {
      if (newBooking.paidAmount > 0) {
        newBooking.transactions = [
          {
            id: 'tx-init-' + Date.now() + '-' + Math.random().toString(36).substr(2, 4),
            amount: newBooking.paidAmount,
            method: 'transfer',
            note: newBooking.paymentStatus === 'paid' ? 'ชำระค่าห้องพักเต็มจำนวน' : 'ชำระเงินมัดจำค่าห้อง',
            paidAt: new Date().toISOString()
          }
        ];
      }
      saveBookingToFirestore(newBooking);
    });

    setBookings(prev => [...newBookings, ...prev]);

    // If checkInDate is today, set room status to occupied
    const checkInTodayRooms = newBookings.filter(b => b.checkInDate === today);
    if (checkInTodayRooms.length > 0) {
      setRooms(prev => prev.map(r => {
        const matching = checkInTodayRooms.find(b => b.roomId === r.id || b.roomNumber === r.roomNumber);
        if (matching) {
          const updatedRoom: Room = {
            ...r,
            status: 'occupied',
            currentGuest: {
              name: matching.guestName,
              phone: matching.guestPhone,
              checkIn: matching.checkInDate,
              checkOut: matching.checkOutDate,
              bookingId: matching.id
            }
          };
          saveRoomToFirestore(updatedRoom);
          return updatedRoom;
        }
        return r;
      }));
    }

    if (newBookings.length > 1) {
      const roomNames = newBookings.map(b => b.roomNumber).join(', ');
      const totalCost = newBookings.reduce((sum, b) => sum + b.totalAmount, 0);
      addLog(
        'บันทึกการจองแบบกลุ่ม',
        `จองห้อง ${roomNames} (${newBookings[0].guestName}) รหัสกลุ่ม ${newBookings[0].groupBookingCode} รวม ฿${totalCost.toLocaleString()} บาท`,
        'booking',
        roomNames,
        newBookings[0].groupBookingCode
      );
    } else {
      const b = newBookings[0];
      addLog(
        'บันทึกการจองใหม่',
        `จองห้อง ${b.roomNumber} (${b.guestName}) รหัส ${b.bookingCode} รวม ฿${b.totalAmount.toLocaleString()} บาท`,
        'booking',
        b.roomNumber,
        b.bookingCode
      );
    }
  };

  // Action: Update Add-Ons for Booking (In-Stay Ordering)
  const handleUpdateBookingAddOns = (bookingId: string, newAddOns: AddOnItem[]) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const roomBase = b.roomPrice * (b.totalNights || 1);
    const addOnsSum = newAddOns.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const newTotal = roomBase + addOnsSum;
    const newPaymentStatus = b.paidAmount >= newTotal ? 'paid' : (b.paidAmount > 0 ? 'deposit' : 'pending');

    const updatedBooking: Booking = {
      ...b,
      addOns: newAddOns,
      totalAmount: newTotal,
      paymentStatus: newPaymentStatus,
    };

    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    addLog('เพิ่มออเดอร์ในห้องพัก', `อัปเดตรายการอาหาร/บริการเสริม ห้อง ${b.roomNumber} (${newAddOns.length} รายการ)`, 'order', b.roomNumber, b.bookingCode);
  };

  // Action: Cancel Booking (Move to Trash)
  const handleCancelBooking = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const updatedBooking: Booking = { ...b, status: 'cancelled', deletedAt: new Date().toISOString() };
    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    // If room is occupied by this booking, free it up
    setRooms(prev => prev.map(r => {
      if (r.currentGuest?.bookingId === bookingId) {
        const updatedRoom: Room = { ...r, status: 'available', currentGuest: undefined };
        saveRoomToFirestore(updatedRoom);
        return updatedRoom;
      }
      return r;
    }));

    addLog('ยกเลิกการจอง', `ย้ายการจองห้อง ${b.roomNumber} (${b.guestName}) รหัส ${b.bookingCode} ไปถังขยะ`, 'booking', b.roomNumber, b.bookingCode);
  };

  // Action: Restore Booking from Trash
  const handleRestoreBooking = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const updatedBooking: Booking = { ...b, status: 'confirmed', deletedAt: undefined };
    setBookings(prev => prev.map(item => item.id === bookingId ? updatedBooking : item));
    saveBookingToFirestore(updatedBooking);

    addLog('กู้คืนการจอง', `กู้คืนการจองห้อง ${b.roomNumber} (${b.guestName}) รหัส ${b.bookingCode}`, 'booking', b.roomNumber, b.bookingCode);
  };

  // Action: Permanently Delete Booking from Trash
  const handlePermanentDeleteBooking = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    setBookings(prev => prev.filter(item => item.id !== bookingId));
    deleteBookingFromFirestore(bookingId);

    addLog('ลบการจองถาวร', `ลบข้อมูลการจองห้อง ${b?.roomNumber || ''} (${b?.guestName || ''}) รหัส ${b?.bookingCode || ''} ถาวร`, 'booking', b?.roomNumber, b?.bookingCode);
  };

  // Action: Save System Settings & Dynamically Update Room Rates
  const handleSaveSettings = (newSettings: ResortSettings) => {
    setSettings(newSettings);
    saveSettingsToFirestore(newSettings);

    // Update live room prices dynamically based on settings
    const updatedRooms = rooms.map(r => {
      if (r.roomNumber === 'S1' || r.roomNumber === 'S2') {
        return { ...r, pricePerNight: newSettings.rateMediumRoom };
      }
      if (r.roomNumber === 'S3' || r.roomNumber === 'S4') {
        return { ...r, pricePerNight: newSettings.rateLargeRoom };
      }
      if (r.roomNumber === 'S5' || r.roomNumber === 'S6') {
        return { ...r, pricePerNight: newSettings.rateSmallRoom };
      }
      return r;
    });

    setRooms(updatedRooms);
    batchSaveRoomsToFirestore(updatedRooms);

    addLog('อัปเดตการตั้งค่ารีสอร์ท', 'บันทึกการตั้งค่าระบบและอัปเดตราคาห้องพักตามโครงสร้างใหม่', 'system');
  };

  return (
    <div className="flex h-screen bg-slate-100 lg:bg-slate-900 text-slate-900 overflow-hidden font-['Prompt'] select-none">
      {/* Desktop Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenNewBooking={handleOpenNormalBooking}
        userEmail={user.email}
        onOpenInstallPWA={() => setIsInstallModalOpen(true)}
        isPWAInstalled={isInstalled}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewBooking={handleOpenNormalBooking}
        userEmail={user.email}
        onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
      />

      {/* Main Content Area (Shifts right when Mobile Drawer is opened) */}
      <div 
        className={`flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-100 transition-transform duration-220 ease-out relative z-10 ${
          isMobileDrawerOpen ? 'translate-x-[280px] lg:translate-x-0 will-change-transform' : 'translate-x-0'
        }`}
      >
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          availableRoomsCount={rooms.filter(r => r.status === 'available').length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onLogoClick={() => setActiveTab('dashboard')}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onCloseMobileDrawer={() => setIsMobileDrawerOpen(false)}
          isMobileDrawerOpen={isMobileDrawerOpen}
          onOpenInstallPWA={() => setIsInstallModalOpen(true)}
          isPWAInstalled={isInstalled}
          onOpenQuickChecker={() => setIsQuickCheckerOpen(true)}
          onOpenAIAssistant={() => setIsAIAssistantOpen(true)}
        />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-2 sm:p-4 md:p-6 overflow-y-auto overflow-x-hidden max-w-7xl mx-auto w-full">
          <div key={activeTab} className="animate-view-transition">
            {activeTab === 'dashboard' && (
              <DashboardView
                rooms={rooms}
                bookings={bookings}
                onUpdateRoomStatus={handleUpdateRoomStatus}
                onCheckInGuest={handleCheckInGuest}
                onCheckOutGuest={(bId) => {
                  const b = bookings.find(item => item.id === bId);
                  if (b) setSelectedBookingForCheckoutId(b.id);
                  else handleConfirmCheckout(bId);
                }}
                onOpenNewBookingForRoom={(roomId) => {
                  setPrefillRoomId(roomId);
                  setPrefillDate(undefined);
                  setPrefillCheckOutDate(undefined);
                  setPrefillGuestName(undefined);
                  setPrefillGuestPhone(undefined);
                  setPrefillGroupId(undefined);
                  setPrefillGroupBookingCode(undefined);
                  setIsNewBookingOpen(true);
                }}
                onOpenNewBooking={handleOpenNormalBooking}
                onOpenNewBookingWithDates={(roomId, checkIn, checkOut) => {
                  setPrefillRoomId(roomId);
                  setPrefillDate(checkIn);
                  setPrefillCheckOutDate(checkOut);
                  setPrefillGuestName(undefined);
                  setPrefillGuestPhone(undefined);
                  setPrefillGroupId(undefined);
                  setPrefillGroupBookingCode(undefined);
                  setIsNewBookingOpen(true);
                }}
                onOpenCloneBooking={handleOpenCloneBooking}
                onOpenQuickChecker={() => setIsQuickCheckerOpen(true)}
                onOpenAddOrder={(booking) => setSelectedBookingForAddOrderId(booking.id)}
                onOpenReceipt={(booking) => setSelectedBookingForReceiptId(booking.id)}
                onOpenAddPayment={(booking) => setSelectedBookingForPaymentId(booking.id)}
                onOpenCheckoutModal={(booking) => setSelectedBookingForCheckoutId(booking.id)}
              />
            )}

            {activeTab === 'timeline' && (
              <TimelineCalendarView
                rooms={rooms}
                bookings={bookings}
                onOpenNewBookingWithPrefill={handleOpenTimelineBooking}
                onOpenCloneBooking={handleOpenCloneBooking}
                onOpenReceipt={(booking) => setSelectedBookingForReceiptId(booking.id)}
                onOpenAddPayment={(booking) => setSelectedBookingForPaymentId(booking.id)}
                onOpenAddOrder={(booking) => setSelectedBookingForAddOrderId(booking.id)}
              />
            )}

            {activeTab === 'bookings' && (
              <BookingsView
                bookings={bookings}
                settings={settings}
                searchTerm={searchTerm}
                onOpenNewBooking={handleOpenNormalBooking}
                onOpenCloneBooking={handleOpenCloneBooking}
                onCheckInGuest={handleCheckInGuest}
                onCheckOutGuest={(bId) => {
                  const b = bookings.find(item => item.id === bId);
                  if (b) setSelectedBookingForCheckoutId(b.id);
                  else handleConfirmCheckout(bId);
                }}
                onCancelBooking={handleCancelBooking}
                onRestoreBooking={handleRestoreBooking}
                onPermanentDeleteBooking={handlePermanentDeleteBooking}
                onOpenAddOrder={(booking) => setSelectedBookingForAddOrderId(booking.id)}
                onOpenReceipt={(booking) => setSelectedBookingForReceiptId(booking.id)}
                onOpenAddPayment={(booking) => setSelectedBookingForPaymentId(booking.id)}
                onOpenCheckoutModal={(booking) => setSelectedBookingForCheckoutId(booking.id)}
                onUpdateBookingAddOns={handleUpdateBookingAddOns}
              />
            )}

            {activeTab === 'finance' && (
              <FinanceView
                bookings={bookings}
              />
            )}

            {activeTab === 'logs' && (
              <LogsView
                logs={logs}
                onClearLogs={() => setLogs([])}
              />
            )}

            {activeTab === 'settings' && (
              <SettingsView
                settings={settings}
                onSaveSettings={handleSaveSettings}
              />
            )}
          </div>

          {/* Mobile Bottom Date Indicator (moved from header right to bottom on mobile) */}
          <div className="md:hidden mt-6 mb-24 flex items-center justify-center gap-2 text-xs font-bold text-slate-500 bg-white/90 backdrop-blur-xs py-2 px-4 rounded-full border border-slate-200/80 shadow-2xs mx-auto w-fit select-none">
            <Calendar className="w-3.5 h-3.5 text-emerald-600" />
            <span>วันนี้: {getTodayThaiLongDate()}</span>
          </div>
        </main>
        {/* Snappy Dimming Overlay on the Pushed Canvas (Moves with canvas, covers header fully, zero blur lag) */}
        <div 
          onClick={() => setIsMobileDrawerOpen(false)}
          className={`absolute inset-0 z-40 bg-black/40 transition-opacity duration-220 ease-out lg:hidden ${
            isMobileDrawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
          }`}
          title="แตะเพื่อปิดเมนู"
        />
      </div>

      {/* Mobile Floating AI Assistant Button (Floating quick access on smartphones) */}
      {!isNewBookingOpen && !isAIAssistantOpen && !selectedBookingForAddOrderId && !selectedBookingForReceiptId && !selectedBookingForPaymentId && !selectedBookingForCheckoutId && (
        <div 
          className={`fixed bottom-20 right-3.5 z-30 md:hidden transition-transform duration-220 ease-out will-change-transform ${
            isMobileDrawerOpen ? 'translate-x-[280px]' : 'translate-x-0'
          }`}
        >
          <button
            type="button"
            onClick={() => setIsAIAssistantOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-full bg-gradient-to-r from-purple-600 via-indigo-600 to-emerald-600 text-white font-black text-xs shadow-lg shadow-purple-600/30 active:scale-90 transition-all border border-white/30 cursor-pointer"
            title="แชทผู้ช่วย AI สำหรับลงข้อมูลอัตโนมัติ"
          >
            <Sparkles className="w-3.5 h-3.5 fill-current text-yellow-300 animate-pulse" />
            <span>แชท AI</span>
          </button>
        </div>
      )}

      {/* Mobile Floating Bottom Navigation (Hidden when modals are open, shifts right with main screen) */}
      {!isNewBookingOpen && !selectedBookingForAddOrderId && !selectedBookingForReceiptId && !selectedBookingForPaymentId && !selectedBookingForCheckoutId && (
        <div 
          className={`fixed bottom-0 inset-x-0 z-30 pointer-events-none transition-transform duration-220 ease-out will-change-transform ${
            isMobileDrawerOpen ? 'translate-x-[280px] lg:translate-x-0' : 'translate-x-0'
          }`}
        >
          <BottomNav
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            onOpenNewBooking={handleOpenNormalBooking}
          />
        </div>
      )}

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setPrefillCheckOutDate(undefined);
          setPrefillGuestName(undefined);
          setPrefillGuestPhone(undefined);
          setPrefillGroupId(undefined);
          setPrefillGroupBookingCode(undefined);
        }}
        rooms={rooms}
        bookings={bookings}
        onAddBooking={handleAddBooking}
        prefillRoomId={prefillRoomId}
        prefillDate={prefillDate}
        prefillCheckOutDate={prefillCheckOutDate}
        prefillGuestName={prefillGuestName}
        prefillGuestPhone={prefillGuestPhone}
        prefillGroupId={prefillGroupId}
        prefillGroupBookingCode={prefillGroupBookingCode}
      />

      {/* Quick Room Availability Checker Modal (Access from anywhere) */}
      <QuickAvailabilityModal
        isOpen={isQuickCheckerOpen}
        onClose={() => setIsQuickCheckerOpen(false)}
        rooms={rooms}
        bookings={bookings}
        onSelectRoomForBooking={(roomId, checkIn, checkOut) => {
          setPrefillRoomId(roomId);
          setPrefillDate(checkIn);
          setPrefillCheckOutDate(checkOut);
          setIsNewBookingOpen(true);
        }}
      />

      {/* AI Smart Booking Assistant Modal (Chat & Auto Fill with Review Screen) */}
      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        onClose={() => setIsAIAssistantOpen(false)}
        rooms={rooms}
        bookings={bookings}
        onAddBooking={handleAddBooking}
        onOpenNewBookingWithPrefill={(roomId, checkIn, checkOut, guestName, guestPhone) => {
          setPrefillRoomId(roomId);
          setPrefillDate(checkIn);
          setPrefillCheckOutDate(checkOut);
          setPrefillGuestName(guestName);
          setPrefillGuestPhone(guestPhone);
          setPrefillGroupId(undefined);
          setPrefillGroupBookingCode(undefined);
          setIsNewBookingOpen(true);
        }}
        onOpenReceipt={(booking) => setSelectedBookingForReceiptId(booking.id)}
      />

      {/* In-Stay Add-Ons & Food Ordering Modal */}
      <AddOrderModal
        isOpen={!!selectedBookingForAddOrderId}
        onClose={() => setSelectedBookingForAddOrderId(null)}
        booking={selectedBookingForAddOrder}
        onUpdateBookingAddOns={handleUpdateBookingAddOns}
      />

      {/* Printable & Downloadable Customer Receipt Slip Modal */}
      <ReceiptModal
        isOpen={!!selectedBookingForReceiptId}
        onClose={() => setSelectedBookingForReceiptId(null)}
        booking={selectedBookingForReceipt}
      />

      {/* Record Payment Modal (FlowAccount Standard with Realtime Firestore Persistence) */}
      <PaymentModal
        isOpen={!!selectedBookingForPaymentId}
        onClose={() => setSelectedBookingForPaymentId(null)}
        booking={selectedBookingForPayment}
        settings={settings}
        onRecordPayment={handleRecordPayment}
        onUpdatePaymentTransaction={handleUpdatePaymentTransaction}
        onDeletePaymentTransaction={handleDeletePaymentTransaction}
        onOpenReceipt={(b) => {
          setSelectedBookingForPaymentId(null);
          setSelectedBookingForReceiptId(b.id);
        }}
      />

      {/* Smart Checkout Confirmation Guard Modal */}
      <CheckoutModal
        isOpen={!!selectedBookingForCheckoutId}
        onClose={() => setSelectedBookingForCheckoutId(null)}
        booking={selectedBookingForCheckout}
        onConfirmCheckout={handleConfirmCheckout}
      />

      {/* PWA Update Banner */}
      {needRefresh && <PWAUpdateBanner onReload={reloadApp} />}

      {/* PWA Installation Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen || showIOSModal}
        onClose={() => {
          setIsInstallModalOpen(false);
          setShowIOSModal(false);
        }}
        onInstall={installApp}
        isIOS={isIOS}
        isInstalled={isInstalled}
      />
    </div>
  );
};

export function App() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const isEmailAuthorized = (emailToCheck?: string | null): boolean => {
    if (!emailToCheck) return false;
    const clean = emailToCheck.toLowerCase().trim();
    let allowed: string[] = initialSettings.allowedEmails || [];
    let staffList = initialSettings.staffList || [];
    try {
      const cached = localStorage.getItem('swanhill_settings_v1');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.allowedEmails && Array.isArray(parsed.allowedEmails)) {
          allowed = parsed.allowedEmails;
        }
        if (parsed.staffList && Array.isArray(parsed.staffList)) {
          staffList = parsed.staffList;
        }
      }
    } catch {}

    if (allowed.some((e: string) => e.toLowerCase().trim() === clean)) return true;
    if (staffList.some((s: any) => s.email?.toLowerCase().trim() === clean)) return true;
    return false;
  };

  const checkAuth = () => {
    // 1. Check persistent staff session in localStorage (Remember Me)
    const savedStaff = localStorage.getItem('swanhill_staff_session') || sessionStorage.getItem('swanhill_staff_session');
    if (savedStaff) {
      try {
        const staffData = JSON.parse(savedStaff);
        setUser({
          uid: staffData.id || `staff-${staffData.phone}`,
          email: `${staffData.phone} (${staffData.name})`,
          displayName: staffData.name,
          phone: staffData.phone,
          role: staffData.role,
        });
        setLoading(false);
        return;
      } catch {
        localStorage.removeItem('swanhill_staff_session');
      }
    }

    // 2. Check Firebase Auth user (Strict Whitelist Check)
    if (auth.currentUser) {
      if (!auth.currentUser.isAnonymous && auth.currentUser.email) {
        if (!isEmailAuthorized(auth.currentUser.email)) {
          auth.signOut();
          localStorage.removeItem('swanhill_staff_session');
          setUser(null);
          setLoading(false);
          return;
        }
      }
      setUser({
        uid: auth.currentUser.uid,
        email: auth.currentUser.email,
        displayName: auth.currentUser.displayName || auth.currentUser.email?.split('@')[0] || 'ผู้ดูแลระบบ',
      });
      setLoading(false);
      return;
    }

    setUser(null);
    setLoading(false);
  };

  useEffect(() => {
    checkAuth();

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      const savedStaff = localStorage.getItem('swanhill_staff_session') || sessionStorage.getItem('swanhill_staff_session');
      if (savedStaff) {
        try {
          const staffData = JSON.parse(savedStaff);
          setUser({
            uid: staffData.id || `staff-${staffData.phone}`,
            email: `${staffData.phone} (${staffData.name})`,
            displayName: staffData.name,
            phone: staffData.phone,
            role: staffData.role,
          });
          setLoading(false);
          return;
        } catch {
          // ignore
        }
      }

      if (currentUser) {
        if (!currentUser.isAnonymous && currentUser.email) {
          if (!isEmailAuthorized(currentUser.email)) {
            auth.signOut();
            localStorage.removeItem('swanhill_staff_session');
            setUser(null);
            setLoading(false);
            return;
          }
        }
        setUser({
          uid: currentUser.uid,
          email: currentUser.email,
          displayName: currentUser.displayName || currentUser.email?.split('@')[0] || 'ผู้ดูแลระบบ',
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    const handleAuthChange = () => {
      checkAuth();
    };

    window.addEventListener('swanhill_auth_changed', handleAuthChange);

    return () => {
      unsubscribe();
      window.removeEventListener('swanhill_auth_changed', handleAuthChange);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white font-['Prompt'] relative overflow-hidden select-none">
        {/* Ambient Radial Luxury Glow */}
        <div className="absolute w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none" />

        <div className="text-center space-y-4 relative z-10 px-4 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/20 border-2 border-emerald-500/40 bg-slate-900 p-1 animate-pulse">
            <img src="/pwa-192x192.png" alt="Swan HILL Logo" className="w-full h-full object-cover rounded-xl" />
          </div>
          <div>
            <img src="/swan-hill-white.png" alt="Swan HILL" className="h-7 mx-auto object-contain drop-shadow-md mb-1.5" />
            <p className="text-[10px] font-extrabold text-emerald-400 tracking-widest uppercase">RESORT MANAGEMENT SYSTEM</p>
          </div>
          <div className="flex items-center justify-center gap-2 pt-2">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-xs font-medium text-slate-400">กำลังเชื่อมต่อฐานข้อมูล Swan HILL...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={!user ? <AuthPage /> : <Navigate to="/dashboard" replace />}
        />
        <Route
          path="/*"
          element={user ? <MainDashboard user={user} /> : <Navigate to="/login" replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
