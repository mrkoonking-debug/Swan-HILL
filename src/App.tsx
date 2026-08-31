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
import { initialRooms, initialBookings } from './data/initialData';
import type { Room, Booking, RoomStatus } from './types/pms';

// Main PMS Dashboard Layout Component
const MainDashboard = ({ user }: { user: User }) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [prefillRoomId, setPrefillRoomId] = useState<string | undefined>();
  const [prefillDate, setPrefillDate] = useState<string | undefined>();
  const [searchTerm, setSearchTerm] = useState('');

  // PMS Core Data States (with localStorage persistence)
  const [rooms, setRooms] = useState<Room[]>(() => {
    const saved = localStorage.getItem('swanhill_rooms_v2');
    return saved ? JSON.parse(saved) : initialRooms;
  });

  const [bookings, setBookings] = useState<Booking[]>(() => {
    const saved = localStorage.getItem('swanhill_bookings_v2');
    if (!saved) return initialBookings;
    try {
      const parsed: Booking[] = JSON.parse(saved);
      // Auto-purge items in trash older than 15 days
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
    localStorage.setItem('swanhill_rooms_v2', JSON.stringify(rooms));
  }, [rooms]);

  useEffect(() => {
    localStorage.setItem('swanhill_bookings_v2', JSON.stringify(bookings));
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

  // Action: Check-out Guest
  const handleCheckOutGuest = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) {
      // Find by room's current guest
      setRooms(prev => prev.map(r => 
        r.currentGuest?.bookingId === bookingId ? { ...r, status: 'cleaning', currentGuest: undefined } : r
      ));
      return;
    }

    setBookings(prev => prev.map(item => 
      item.id === bookingId ? { ...item, status: 'checked_out' } : item
    ));

    // Set Room Status to Cleaning
    setRooms(prev => prev.map(r => 
      r.id === b.roomId ? { ...r, status: 'cleaning', currentGuest: undefined } : r
    ));
  };

  // Action: Move Booking to Trash (Soft Delete)
  const handleCancelBooking = (bookingId: string) => {
    const b = bookings.find(item => item.id === bookingId);
    if (!b) return;

    setBookings(prev => prev.map(item => 
      item.id === bookingId ? { 
        ...item, 
        status: 'cancelled', 
        deletedAt: new Date().toISOString() 
      } : item
    ));

    // Free the room if currently checked in
    if (b.status === 'checked_in') {
      setRooms(prev => prev.map(r => 
        r.id === b.roomId ? { ...r, status: 'available', currentGuest: undefined } : r
      ));
    }
  };

  // Action: Restore Booking from Trash
  const handleRestoreBooking = (bookingId: string) => {
    setBookings(prev => prev.map(item => 
      item.id === bookingId ? { 
        ...item, 
        status: 'confirmed', 
        deletedAt: undefined 
      } : item
    ));
  };

  // Action: Permanently Delete Booking
  const handlePermanentDeleteBooking = (bookingId: string) => {
    setBookings(prev => prev.filter(item => item.id !== bookingId));
  };

  // Action: Add New Booking
  const handleAddBooking = (newBooking: Booking) => {
    setBookings(prev => [newBooking, ...prev]);

    // If booking starts today (2026-08-31), set to confirmed or occupied
    if (newBooking.checkInDate === '2026-08-31') {
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

  const handleOpenTimelineBooking = (roomId: string, date: string) => {
    setPrefillRoomId(roomId);
    setPrefillDate(date);
    setIsNewBookingOpen(true);
  };

  const handleOpenBookingForRoom = (roomId: string) => {
    setPrefillRoomId(roomId);
    setPrefillDate('2026-08-31');
    setIsNewBookingOpen(true);
  };

  const handleOpenNormalBooking = () => {
    setPrefillRoomId(undefined);
    setPrefillDate(undefined);
    setIsNewBookingOpen(true);
  };

  const availableRoomsCount = rooms.filter(r => r.status === 'available').length;

  return (
    <div className="flex min-h-screen bg-[#f8fafc] font-sans text-slate-900">
      {/* Desktop Sidebar Navigation */}
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
        />

        {/* View Routing */}
        <main className="flex-1 p-3.5 sm:p-5 md:p-6 overflow-y-auto max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              rooms={rooms}
              bookings={bookings}
              onUpdateRoomStatus={handleUpdateRoomStatus}
              onCheckInGuest={handleCheckInGuest}
              onCheckOutGuest={handleCheckOutGuest}
              onOpenNewBookingForRoom={handleOpenBookingForRoom}
              onOpenNewBooking={handleOpenNormalBooking}
            />
          )}

          {activeTab === 'timeline' && (
            <TimelineCalendarView
              rooms={rooms}
              bookings={bookings}
              onOpenNewBookingWithPrefill={handleOpenTimelineBooking}
              onCheckInGuest={handleCheckInGuest}
              onCheckOutGuest={handleCheckOutGuest}
            />
          )}

          {activeTab === 'bookings' && (
            <BookingsView
              bookings={bookings}
              searchTerm={searchTerm}
              onOpenNewBooking={handleOpenNormalBooking}
              onCheckInGuest={handleCheckInGuest}
              onCheckOutGuest={handleCheckOutGuest}
              onCancelBooking={handleCancelBooking}
              onRestoreBooking={handleRestoreBooking}
              onPermanentDeleteBooking={handlePermanentDeleteBooking}
            />
          )}

          {activeTab === 'finance' && (
            <FinanceView
              bookings={bookings}
            />
          )}
        </main>
      </div>

      {/* Mobile Smartphone Bottom Navigation Bar */}
      <BottomNav
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenNewBooking={handleOpenNormalBooking}
      />

      {/* Simplified Mobile-Friendly New Booking Modal */}
      <NewBookingModal
        isOpen={isNewBookingOpen}
        onClose={() => {
          setIsNewBookingOpen(false);
          setPrefillRoomId(undefined);
          setPrefillDate(undefined);
        }}
        rooms={rooms}
        onAddBooking={handleAddBooking}
        prefillRoomId={prefillRoomId}
        prefillDate={prefillDate}
      />
    </div>
  );
};

function App() {
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
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-900 text-white">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mb-4"></div>
        <p className="text-sm font-bold text-emerald-400">กำลังเปิดระบบ Swan HILL...</p>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={user ? <Navigate to="/dashboard" /> : <AuthPage />} 
        />
        <Route 
          path="/dashboard" 
          element={user ? <MainDashboard user={user} /> : <Navigate to="/login" />} 
        />
        <Route 
          path="*" 
          element={<Navigate to={user ? "/dashboard" : "/login"} />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
