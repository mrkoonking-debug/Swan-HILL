import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  writeBatch
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Booking, Room, ResortSettings, ActivityLog } from '../types/pms';
import { initialBookings, initialRooms, initialSettings, initialLogs } from '../data/initialData';

// COLLECTIONS
const BOOKINGS_COL = 'bookings';
const ROOMS_COL = 'rooms';
const SETTINGS_COL = 'settings';
const LOGS_COL = 'logs';

/**
 * 1. BOOKINGS REALTIME LISTENER & SYNC
 */
export const subscribeToBookings = (onUpdate: (bookings: Booking[]) => void) => {
  try {
    const q = query(collection(db, BOOKINGS_COL));
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        // Initialize Firestore with default bookings if empty
        console.log('[Firebase] Initializing default bookings in Firestore...');
        const batch = writeBatch(db);
        initialBookings.forEach((b) => {
          const ref = doc(db, BOOKINGS_COL, b.id);
          batch.set(ref, b);
        });
        await batch.commit();
        onUpdate(initialBookings);
      } else {
        const list: Booking[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Booking);
        });
        // Sort newest first
        list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
        onUpdate(list);
      }
    }, (err) => {
      console.warn('[Firebase] Firestore bookings listener warning/offline:', err);
    });
  } catch (err) {
    console.error('[Firebase] Failed to subscribe to bookings:', err);
    return () => {};
  }
};

/**
 * Save or update a full booking doc
 */
export const saveBookingToFirestore = async (booking: Booking): Promise<void> => {
  try {
    const ref = doc(db, BOOKINGS_COL, booking.id);
    await setDoc(ref, JSON.parse(JSON.stringify(booking)), { merge: true });
    console.log('[Firebase] Saved booking:', booking.bookingCode);
  } catch (err) {
    console.error('[Firebase] Error saving booking to Firestore:', err);
  }
};

/**
 * Update partial booking fields
 */
export const updateBookingInFirestore = async (bookingId: string, updates: Partial<Booking>): Promise<void> => {
  try {
    const ref = doc(db, BOOKINGS_COL, bookingId);
    await updateDoc(ref, JSON.parse(JSON.stringify(updates)));
    console.log('[Firebase] Updated booking in Firestore:', bookingId);
  } catch (err) {
    console.error('[Firebase] Error updating booking in Firestore:', err);
  }
};

/**
 * Delete a booking doc permanently
 */
export const deleteBookingFromFirestore = async (bookingId: string): Promise<void> => {
  try {
    const ref = doc(db, BOOKINGS_COL, bookingId);
    await deleteDoc(ref);
    console.log('[Firebase] Deleted booking from Firestore:', bookingId);
  } catch (err) {
    console.error('[Firebase] Error deleting booking from Firestore:', err);
  }
};

/**
 * 2. ROOMS REALTIME LISTENER & SYNC
 */
export const subscribeToRooms = (onUpdate: (rooms: Room[]) => void) => {
  try {
    const q = query(collection(db, ROOMS_COL));
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        console.log('[Firebase] Initializing default rooms in Firestore...');
        const batch = writeBatch(db);
        initialRooms.forEach((r) => {
          const ref = doc(db, ROOMS_COL, r.id);
          batch.set(ref, r);
        });
        await batch.commit();
        onUpdate(initialRooms);
      } else {
        const list: Room[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as Room);
        });
        // Sort rooms: S1, S2, S3, S4, S5, S6
        const order = ['S1', 'S2', 'S3', 'S4', 'S5', 'S6'];
        list.sort((a, b) => order.indexOf(a.roomNumber) - order.indexOf(b.roomNumber));
        onUpdate(list);
      }
    }, (err) => {
      console.warn('[Firebase] Firestore rooms listener warning:', err);
    });
  } catch (err) {
    console.error('[Firebase] Failed to subscribe to rooms:', err);
    return () => {};
  }
};

export const saveRoomToFirestore = async (room: Room): Promise<void> => {
  try {
    const ref = doc(db, ROOMS_COL, room.id);
    await setDoc(ref, JSON.parse(JSON.stringify(room)), { merge: true });
  } catch (err) {
    console.error('[Firebase] Error saving room to Firestore:', err);
  }
};

export const batchSaveRoomsToFirestore = async (rooms: Room[]): Promise<void> => {
  try {
    const batch = writeBatch(db);
    rooms.forEach(r => {
      const ref = doc(db, ROOMS_COL, r.id);
      batch.set(ref, JSON.parse(JSON.stringify(r)), { merge: true });
    });
    await batch.commit();
  } catch (err) {
    console.error('[Firebase] Error batch saving rooms:', err);
  }
};

/**
 * 3. SETTINGS REALTIME LISTENER & SYNC
 */
export const subscribeToSettings = (onUpdate: (settings: ResortSettings) => void) => {
  try {
    const ref = doc(db, SETTINGS_COL, 'resort_config');
    return onSnapshot(ref, async (docSnap) => {
      if (!docSnap.exists()) {
        console.log('[Firebase] Initializing default settings in Firestore...');
        await setDoc(ref, initialSettings);
        onUpdate(initialSettings);
      } else {
        const liveData = docSnap.data() as ResortSettings;
        const staff = (liveData.staffList && Array.isArray(liveData.staffList) && liveData.staffList.length > 0)
          ? [...liveData.staffList]
          : [...(initialSettings.staffList || [])];

        const ownerIdx = staff.findIndex(s => s.phone.replace(/[^0-9]/g, '') === '0923985962');
        if (ownerIdx >= 0) {
          staff[ownerIdx] = { ...staff[ownerIdx], pin: '081863', isActive: true, role: 'owner' };
        } else {
          staff.unshift({
            id: 'staff-owner',
            name: 'ผู้ดูแลระบบ / เจ้าของ',
            phone: '0923985962',
            pin: '081863',
            role: 'owner',
            isActive: true,
            notes: 'ผู้ดูแลหลัก',
            createdAt: new Date().toISOString(),
          });
        }
        liveData.staffList = staff;
        onUpdate(liveData);
      }
    }, (err) => {
      console.warn('[Firebase] Firestore settings listener warning:', err);
    });
  } catch (err) {
    console.error('[Firebase] Failed to subscribe to settings:', err);
    return () => {};
  }
};

export const saveSettingsToFirestore = async (settings: ResortSettings): Promise<void> => {
  try {
    const ref = doc(db, SETTINGS_COL, 'resort_config');
    await setDoc(ref, JSON.parse(JSON.stringify(settings)), { merge: true });
    console.log('[Firebase] Saved resort settings to Firestore');
  } catch (err) {
    console.error('[Firebase] Error saving settings to Firestore:', err);
  }
};

/**
 * 4. LOGS REALTIME LISTENER & SYNC
 */
export const subscribeToLogs = (onUpdate: (logs: ActivityLog[]) => void) => {
  try {
    const q = query(collection(db, LOGS_COL), orderBy('timestamp', 'desc'));
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        onUpdate(initialLogs);
      } else {
        const list: ActivityLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push(docSnap.data() as ActivityLog);
        });
        onUpdate(list);
      }
    }, (err) => {
      console.warn('[Firebase] Firestore logs listener warning:', err);
    });
  } catch (err) {
    console.error('[Firebase] Failed to subscribe to logs:', err);
    return () => {};
  }
};

export const saveLogToFirestore = async (log: ActivityLog): Promise<void> => {
  try {
    const ref = doc(db, LOGS_COL, log.id);
    await setDoc(ref, JSON.parse(JSON.stringify(log)));
  } catch (err) {
    console.error('[Firebase] Error saving log to Firestore:', err);
  }
};
