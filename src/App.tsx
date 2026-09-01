import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
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
import { usePWA } from './hooks/usePWA';
import { PWAInstallModal, PWAUpdateBanner } from './components/PWAInstallModal';
import { initialRooms, initialBookings, initialSettings, initialLogs } from './data/initialData';
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

// Main PMS Dashboard Layout Component
const MainDashboard = ({ user }: { user: User }) => {
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
  
  // Use IDs for dynamic reactive booking modals
  const [selectedBookingForAddOrderId, setSelectedBookingForAddOrderId] = useState<string | null>(null);
  const [selectedBookingForReceiptId, setSelectedBookingForReceiptId] = useState<string | null>(null);
  const [selectedBookingForPaymentId, setSelectedBookingForPaymentId] = useState<string | null>(null);
  const [selectedBookingForCheckoutId, setSelectedBookingForCheckoutId] = useState<string | null>(null);

  const [prefillRoomId, setPrefillRoomId] = useState<string | undefined>();
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
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
    const saved = localStorage.getItem('swanhill_logs_v1');
    if (!saved) return initialLogs;
    try {
      return JSON.parse(saved);
    } catch {
      return initialLogs;
    }
  });

  // PMS Rooms State
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('swanhill_rooms_v3');
    if (!saved) return initialRooms;
    try {
      const parsed: Room[] = JSON.parse(saved);
      if (parsed.length !== 6 || !parsed.some(r => r.roomNumber === 'S6')) {
        return initialRooms;
      }
      return parsed;
    } catch {
      return initialRooms;
    }
  });

  // PMS Bookings State
  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swanhill_bookings_v3');
    if (!saved) return initialBookings;
    try {
      const parsed: Booking[] = JSON.parse(saved);
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
    const unsubBookings = subscribeToBookings((liveBookings) => {
      setBookings(liveBookings);
      localStorage.setItem('swanhill_bookings_v3', JSON.stringify(liveBookings));
    });

    const unsubRooms = subscribeToRooms((liveRooms) => {
      setRooms(liveRooms);
      localStorage.setItem('swanhill_rooms_v3', JSON.stringify(liveRooms));
    });

    const unsubSettings = subscribeToSettings((liveSettings) => {
      setSettings(liveSettings);
      localStorage.setItem('swanhill_settings_v1', JSON.stringify(liveSettings));
    });

    const unsubLogs = subscribeToLogs((liveLogs) => {
      setLogs(liveLogs);
      localStorage.setItem('swanhill_logs_v1', JSON.stringify(liveLogs));
    });

    return () => {
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
    const r = rooms.find(item => item.id === roomId);
    const updatedRooms = rooms.map(item => item.id === roomId ? { ...item, status: newStatus } : item);
    setRooms(updatedRooms);
    if (r) {
      saveRoomToFirestore({ ...r, status: newStatus });
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
    setIsNewBookingOpen(true);
  };

  // Action: Open timeline booking modal with prefilled room and date
  const handleOpenTimelineBooking = (roomId: string, date: string) => {
    setPrefillRoomId(roomId);
    setPrefillDate(date);
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
    const roomBase = b.roomPrice * b.totalNights;
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
    const roomBase = b.roomPrice * b.totalNights;
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
    const roomBase = b.roomPrice * b.totalNights;
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

    const updatedBooking: Booking = {
      ...b,
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

  // Action: Add New Booking (Saved to Firebase Firestore)
  const handleAddBooking = (newBooking: Booking) => {
    if (newBooking.paidAmount > 0) {
      newBooking.transactions = [
        {
          id: 'tx-init-' + Date.now(),
          amount: newBooking.paidAmount,
          method: 'transfer',
          note: newBooking.paymentStatus === 'paid' ? 'ชำระค่าห้องพักเต็มจำนวน' : 'ชำระเงินมัดจำค่าห้อง',
          paidAt: new Date().toISOString()
        }
      ];
    }

    setBookings(prev => [newBooking, ...prev]);
    saveBookingToFirestore(newBooking);

    // If checkInDate is today, set room status to occupied
    const today = new Date().toISOString().slice(0, 10);
    if (newBooking.checkInDate === today) {
      setRooms(prev => prev.map(r => {
        if (r.id === newBooking.roomId) {
          const updatedRoom: Room = {
            ...r,
            status: 'occupied',
            currentGuest: {
              name: newBooking.guestName,
              phone: newBooking.guestPhone,
              checkIn: newBooking.checkInDate,
              checkOut: newBooking.checkOutDate,
              bookingId: newBooking.id
            }
          };
          saveRoomToFirestore(updatedRoom);
          return updatedRoom;
        }
        return r;
      }));
    }

    addLog(
      'บันทึกการจองใหม่',
      `จองห้อง ${newBooking.roomNumber} (${newBooking.guestName}) รหัส ${newBooking.bookingCode} รวม ฿${newBooking.totalAmount.toLocaleString()} บาท`,
      'booking',
      newBooking.roomNumber,
      newBooking.bookingCode
    );
  };

  // Action: Update Add-Ons for Booking (In-Stay Ordering)
  const handleUpdateBookingAddOns = (bookingId: string, newAddOns: AddOnItem[]) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    const roomBase = b.roomPrice * b.totalNights;
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
    <div className="flex h-screen bg-slate-100 text-slate-900 overflow-hidden font-['Prompt'] select-none">
      {/* Desktop Navigation Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenNewBooking={handleOpenNormalBooking}
        userEmail={user.email}
        onOpenInstallPWA={() => setIsInstallModalOpen(true)}
        isPWAInstalled={isInstalled}
      />

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewBooking={handleOpenNormalBooking}
        userEmail={user.email}
        onOpenInstallPWA={() => setIsInstallModalOpen(true)}
        isPWAInstalled={isInstalled}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          availableRoomsCount={rooms.filter(r => r.status === 'available').length}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onLogoClick={() => setActiveTab('dashboard')}
          onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenInstallPWA={() => setIsInstallModalOpen(true)}
          isPWAInstalled={isInstalled}
        />

        {/* Dynamic Viewport Container */}
        <main className="flex-1 p-3 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full">
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
                setIsNewBookingOpen(true);
              }}
              onOpenNewBooking={handleOpenNormalBooking}
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
              onOpenReceipt={(booking) => setSelectedBookingForReceiptId(booking.id)}
              onOpenAddPayment={(booking) => setSelectedBookingForPaymentId(booking.id)}
              onOpenAddOrder={(booking) => setSelectedBookingForAddOrderId(booking.id)}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              bookings={bookings}
              searchTerm={searchTerm}
              onOpenNewBooking={handleOpenNormalBooking}
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
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation (Hidden when modals are open) */}
      {!isNewBookingOpen && !selectedBookingForAddOrderId && !selectedBookingForReceiptId && !selectedBookingForPaymentId && !selectedBookingForCheckoutId && !isMobileDrawerOpen && (
        <BottomNav
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenNewBooking={handleOpenNormalBooking}
        />
      )}

      {/* New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => setIsNewBookingOpen(false)}
        rooms={rooms}
        onAddBooking={handleAddBooking}
        prefillRoomId={prefillRoomId}
        prefillDate={prefillDate}
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

// Top-Level App Component with Routing and Firebase Auth Guard
export function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-['Prompt']">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-sm font-medium text-slate-300">กำลังเชื่อมต่อฐานข้อมูล Swan HILL...</p>
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
