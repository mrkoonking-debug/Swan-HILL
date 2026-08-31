import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { auth } from './lib/firebase';
import AuthPage from './AuthPage';
import { Sidebar, type ActiveTab } from './components/Sidebar';
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
import { initialRooms, initialBookings } from './data/initialData';
import type { Room, Booking, RoomStatus, AddOnItem, PaymentTransaction, PaymentMethod } from './types/pms';

// Main PMS Dashboard Layout Component
const MainDashboard = ({ user }: { user: User }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedBookingForAddOrder, setSelectedBookingForAddOrder] = useState<Booking | null>(null);
  const [selectedBookingForReceipt, setSelectedBookingForReceipt] = useState<Booking | null>(null);
  const [selectedBookingForPayment, setSelectedBookingForPayment] = useState<Booking | null>(null);
  const [selectedBookingForCheckout, setSelectedBookingForCheckout] = useState<Booking | null>(null);
  const [prefillRoomId, setPrefillRoomId] = useState<string | undefined>();
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  // PMS Core Data States (v3 with S1-S6 real room breakdown & add-ons)
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

  // Save to localStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('swanhill_rooms_v3', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('swanhill_bookings_v3', JSON.stringify(bookings));
  }, [bookings]);

  // Action: Update Room Status
  const handleUpdateRoomStatus = (roomId: string, newStatus: RoomStatus) => {
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status: newStatus } : r));
  };

  // Action: Check-in Guest
  const handleCheckInGuest = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    setBookings(prev => prev.map(item => 
      item.id === bookingId ? { ...item, status: 'checked_in' } : item
    ));

    // Update Room Status to Occupied with guest info
    setRooms(prev => prev.map(r => 
      r.id === b.roomId ? {
        ...r,
        status: 'occupied',
        currentGuest: {
          name: b.guestName,
          phone: b.guestPhone,
          checkIn: b.checkInDate,
          checkOut: b.checkOutDate,
          bookingId: b.id
        }
      } : r
    ));
  };

  // Action: Record Payment Transaction
  const handleRecordPayment = (bookingId: string, transaction: PaymentTransaction) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      
      const newTransactions = [...(b.transactions || []), transaction];
      const newPaidAmount = b.paidAmount + transaction.amount;
      const roomBase = b.roomPrice * b.totalNights;
      const addOnsSum = b.addOns?.reduce((s, a) => s + (a.price * a.quantity), 0) || 0;
      const grandTotal = b.totalAmount || (roomBase + addOnsSum);
      const newPaymentStatus = newPaidAmount >= grandTotal ? 'paid' : 'deposit';

      return {
        ...b,
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
        transactions: newTransactions,
      };
    }));
  };

  // Action: Update Past Payment Transaction
  const handleUpdatePaymentTransaction = (bookingId: string, transactionId: string, updated: Partial<PaymentTransaction>) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      
      const newTransactions = (b.transactions || []).map(tx => 
        tx.id === transactionId ? { ...tx, ...updated } : tx
      );
      const newPaidAmount = newTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const roomBase = b.roomPrice * b.totalNights;
      const addOnsSum = b.addOns?.reduce((s, a) => s + (a.price * a.quantity), 0) || 0;
      const grandTotal = b.totalAmount || (roomBase + addOnsSum);
      const newPaymentStatus = newPaidAmount >= grandTotal ? 'paid' : (newPaidAmount > 0 ? 'deposit' : 'pending');

      return {
        ...b,
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
        transactions: newTransactions,
      };
    }));
  };

  // Action: Delete Payment Transaction
  const handleDeletePaymentTransaction = (bookingId: string, transactionId: string) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      
      const newTransactions = (b.transactions || []).filter(tx => tx.id !== transactionId);
      const newPaidAmount = newTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      const roomBase = b.roomPrice * b.totalNights;
      const addOnsSum = b.addOns?.reduce((s, a) => s + (a.price * a.quantity), 0) || 0;
      const grandTotal = b.totalAmount || (roomBase + addOnsSum);
      const newPaymentStatus = newPaidAmount >= grandTotal ? 'paid' : (newPaidAmount > 0 ? 'deposit' : 'pending');

      return {
        ...b,
        paidAmount: newPaidAmount,
        paymentStatus: newPaymentStatus,
        transactions: newTransactions,
      };
    }));
  };

  // Action: Confirm Checkout (with optional payment collection)
  const handleConfirmCheckout = (bookingId: string, paymentReceived?: { amount: number; method: PaymentMethod }) => {
    const b = bookings.find(item => item.id === bookingId);
    
    setBookings(prev => prev.map(item => {
      if (item.id !== bookingId) return item;

      let updatedPaid = item.paidAmount;
      let updatedTransactions = [...(item.transactions || [])];
      let updatedStatus = item.paymentStatus;

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

      return {
        ...item,
        status: 'checked_out',
        paidAmount: updatedPaid,
        paymentStatus: updatedStatus,
        transactions: updatedTransactions,
      };
    }));

    // Set Room Status to Cleaning
    if (b) {
      setRooms(prev => prev.map(r => 
        r.id === b.roomId ? { ...r, status: 'cleaning', currentGuest: undefined } : r
      ));
    } else {
      setRooms(prev => prev.map(r => 
        r.currentGuest?.bookingId === bookingId ? { ...r, status: 'cleaning', currentGuest: undefined } : r
      ));
    }
  };

  // Action: Add New Booking
  const handleAddBooking = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);

    // Initial transaction if paid or deposited
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

    // If checkInDate is today, set room status to occupied
    const today = '2026-08-31';
    if (newBooking.checkInDate === today) {
      setRooms(prev => prev.map(r => 
        r.id === newBooking.roomId ? {
          ...r,
          status: 'occupied',
          currentGuest: {
            name: newBooking.guestName,
            phone: newBooking.guestPhone,
            checkIn: newBooking.checkInDate,
            checkOut: newBooking.checkOutDate,
            bookingId: newBooking.id
          }
        } : r
      ));
    }
  };

  // Action: Update Add-Ons for Booking (In-Stay Ordering)
  const handleUpdateBookingAddOns = (bookingId: string, newAddOns: AddOnItem[]) => {
    setBookings(prev => prev.map(b => {
      if (b.id !== bookingId) return b;
      const roomBase = b.roomPrice * b.totalNights;
      const addOnsSum = newAddOns.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      const newTotal = roomBase + addOnsSum;
      const newPaymentStatus = b.paidAmount >= newTotal ? 'paid' : (b.paidAmount > 0 ? 'deposit' : 'pending');

      return {
        ...b,
        addOns: newAddOns,
        totalAmount: newTotal,
        paymentStatus: newPaymentStatus,
      };
    }));
  };

  // Action: Cancel Booking (Move to Trash)
  const handleCancelBooking = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    setBookings(prev => prev.map(item => 
      item.id === bookingId ? { ...item, status: 'cancelled', deletedAt: new Date().toISOString() } : item
    ));

    // If room is occupied by this booking, free it up
    setRooms(prev => prev.map(r => 
      r.currentGuest?.bookingId === bookingId ? { ...r, status: 'available', currentGuest: undefined } : r
    ));
  };

  // Action: Restore Booking from Trash
  const handleRestoreBooking = (bookingId: string) => {
    setBookings(prev => prev.map(item => 
      item.id === bookingId ? { ...item, status: 'confirmed', deletedAt: undefined } : item
    ));
  };

  // Action: Permanently Delete Booking from Trash
  const handlePermanentDeleteBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(item => item.id !== bookingId));
  };

  // Handlers for modal opening
  const handleOpenNormalBooking = () => {
    setPrefillRoomId(undefined);
    setPrefillDate(undefined);
    setIsNewBookingOpen(true);
  };

  const handleOpenBookingForRoom = (roomId: string) => {
    setPrefillRoomId(roomId);
    setPrefillDate(undefined);
    setIsNewBookingOpen(true);
  };

  const handleOpenTimelineBooking = (roomId: string, date: string) => {
    setPrefillRoomId(roomId);
    setPrefillDate(date);
    setIsNewBookingOpen(true);
  };

  const availableRoomsCount = rooms.filter(r => r.status === 'available').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex font-['Prompt']">
      {/* Desktop Left Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewBooking={handleOpenNormalBooking}
        userEmail={user.email || user.phoneNumber || 'แอดมิน Swan HILL'}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-0">
        {/* Top Header */}
        <Header
          activeTab={activeTab}
          availableRoomsCount={availableRoomsCount}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          onLogoClick={() => setActiveTab('dashboard')}
        />

        {/* View Routing */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              rooms={rooms}
              bookings={bookings}
              onUpdateRoomStatus={handleUpdateRoomStatus}
              onCheckInGuest={handleCheckInGuest}
              onCheckOutGuest={(bId) => {
                const b = bookings.find(item => item.id === bId);
                if (b) setSelectedBookingForCheckout(b);
                else handleConfirmCheckout(bId);
              }}
              onOpenNewBookingForRoom={handleOpenBookingForRoom}
              onOpenNewBooking={handleOpenNormalBooking}
              onOpenAddOrder={(booking) => setSelectedBookingForAddOrder(booking)}
              onOpenReceipt={(booking) => setSelectedBookingForReceipt(booking)}
              onOpenAddPayment={(booking) => setSelectedBookingForPayment(booking)}
              onOpenCheckoutModal={(booking) => setSelectedBookingForCheckout(booking)}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineCalendarView
              rooms={rooms}
              bookings={bookings}
              onOpenNewBookingWithPrefill={handleOpenTimelineBooking}
              onOpenReceipt={(booking) => setSelectedBookingForReceipt(booking)}
              onOpenAddPayment={(booking) => setSelectedBookingForPayment(booking)}
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
                if (b) setSelectedBookingForCheckout(b);
                else handleConfirmCheckout(bId);
              }}
              onCancelBooking={handleCancelBooking}
              onRestoreBooking={handleRestoreBooking}
              onPermanentDeleteBooking={handlePermanentDeleteBooking}
              onOpenAddOrder={(booking) => setSelectedBookingForAddOrder(booking)}
              onOpenReceipt={(booking) => setSelectedBookingForReceipt(booking)}
              onOpenAddPayment={(booking) => setSelectedBookingForPayment(booking)}
              onOpenCheckoutModal={(booking) => setSelectedBookingForCheckout(booking)}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              bookings={bookings}
            />
          )}
        </main>
      </div>

      {/* Mobile Floating Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewBooking={handleOpenNormalBooking}
      />

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
        isOpen={!!selectedBookingForAddOrder}
        onClose={() => setSelectedBookingForAddOrder(null)}
        booking={selectedBookingForAddOrder}
        onUpdateBookingAddOns={handleUpdateBookingAddOns}
      />

      {/* Printable & Downloadable Customer Receipt Slip Modal */}
      <ReceiptModal
        isOpen={!!selectedBookingForReceipt}
        onClose={() => setSelectedBookingForReceipt(null)}
        booking={selectedBookingForReceipt}
      />

      {/* Record Payment Modal */}
      <PaymentModal
        isOpen={!!selectedBookingForPayment}
        onClose={() => setSelectedBookingForPayment(null)}
        booking={selectedBookingForPayment}
        onRecordPayment={handleRecordPayment}
        onUpdatePaymentTransaction={handleUpdatePaymentTransaction}
        onDeletePaymentTransaction={handleDeletePaymentTransaction}
      />

      {/* Smart Checkout Confirmation Guard Modal */}
      <CheckoutModal
        isOpen={!!selectedBookingForCheckout}
        onClose={() => setSelectedBookingForCheckout(null)}
        booking={selectedBookingForCheckout}
        onConfirmCheckout={handleConfirmCheckout}
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
          <p className="text-slate-400 text-sm font-medium">กำลังโหลดข้อมูลระบบ Swan HILL...</p>
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
          path="/dashboard"
          element={user ? <MainDashboard user={user} /> : <Navigate to="/login" replace />}
        />
        <Route
          path="*"
          element={<Navigate to={user ? "/dashboard" : "/login"} replace />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
