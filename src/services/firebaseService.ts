import { 
  collection, 
  doc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  orderBy, 
  limit,
  writeBatch,
  getDocs,
  deleteField
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import type { Booking, Room, ResortSettings, ActivityLog } from '../types/pms';
import { initialRooms, initialSettings, initialLogs } from '../data/initialData';

// COLLECTIONS
const BOOKINGS_COL = 'bookings';
const ROOMS_COL = 'rooms';
const SETTINGS_COL = 'settings';
const LOGS_COL = 'logs';

/**
 * Permanently wipe all bookings and reset all rooms to available
 */
export const purgeAllBookingsAndResetRooms = async (): Promise<void> => {
  try {
    console.log('[Firebase] Purging all bookings from Firestore...');
    const bookingsSnap = await getDocs(collection(db, BOOKINGS_COL));
    if (!bookingsSnap.empty) {
      const batch = writeBatch(db);
      bookingsSnap.forEach((docSnap) => {
        batch.delete(docSnap.ref);
      });
      await batch.commit();
      console.log(`[Firebase] Successfully deleted ${bookingsSnap.size} bookings.`);
    }

    console.log('[Firebase] Resetting all rooms in Firestore to available...');
    const roomsSnap = await getDocs(collection(db, ROOMS_COL));
    if (!roomsSnap.empty) {
      const batch = writeBatch(db);
      roomsSnap.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          status: 'available',
          currentGuest: deleteField(),
        });
      });
      await batch.commit();
      console.log(`[Firebase] Successfully reset ${roomsSnap.size} rooms to available.`);
    }
  } catch (err) {
    console.error('[Firebase] Error purging all bookings:', err);
  }
};

/**
 * 1. BOOKINGS REALTIME LISTENER & SYNC
 */
export const subscribeToBookings = (onUpdate: (bookings: Booking[]) => void) => {
  try {
    // Auto purge on client startup if not yet purged for this reset
    if (typeof window !== 'undefined' && !localStorage.getItem('swanhill_purged_sept_v1')) {
      localStorage.setItem('swanhill_purged_sept_v1', 'true');
      purgeAllBookingsAndResetRooms();
    }

    const q = query(collection(db, BOOKINGS_COL));
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        onUpdate([]);
      } else {
        const list: Booking[] = [];
        const mockKeywords = ['สุรชัย', 'กิตติศักดิ์', 'พัชราภรณ์', 'ธนากร'];
        const mockIds = ['b-101', 'b-102', 'b-103', 'b-104'];
        let hasLegacyMock = false;

        snapshot.forEach((docSnap) => {
          const b = docSnap.data() as Booking;
          if (mockIds.includes(docSnap.id) || mockKeywords.some(k => b.guestName?.includes(k))) {
            hasLegacyMock = true;
          } else {
            list.push(b);
          }
        });

        if (hasLegacyMock) {
          console.log('[Firebase] Purging legacy mock bookings from Firestore...');
          const batch = writeBatch(db);
          snapshot.forEach((docSnap) => {
            const b = docSnap.data() as Booking;
            if (mockIds.includes(docSnap.id) || mockKeywords.some(k => b.guestName?.includes(k))) {
              batch.delete(docSnap.ref);
            }
          });
          await batch.commit();
          return;
        }

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
        const mockKeywords = ['สุรชัย', 'กิตติศักดิ์'];
        let hasLegacyMockGuest = false;

        snapshot.forEach((docSnap) => {
          const r = docSnap.data() as Room;
          if (mockKeywords.some(k => r.currentGuest?.name?.includes(k))) {
            hasLegacyMockGuest = true;
          }
          list.push(r);
        });

        if (hasLegacyMockGuest || list.length < 6) {
          console.log('[Firebase] Resetting rooms with authentic current occupancy...');
          const batch = writeBatch(db);
          initialRooms.forEach((r) => {
            const ref = doc(db, ROOMS_COL, r.id);
            batch.set(ref, r);
          });
          await batch.commit();
          return;
        }

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
        onUpdate(docSnap.data() as ResortSettings);
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
    const q = query(collection(db, LOGS_COL), orderBy('timestamp', 'desc'), limit(100));
    return onSnapshot(q, async (snapshot) => {
      if (snapshot.empty) {
        onUpdate(initialLogs);
      } else {
        const list: ActivityLog[] = [];
        const mockKeywords = ['สุรชัย', 'กิตติศักดิ์'];
        let hasLegacyMockLog = false;
        snapshot.forEach((docSnap) => {
          const l = docSnap.data() as ActivityLog;
          if (mockKeywords.some(k => l.details?.includes(k))) {
            hasLegacyMockLog = true;
          } else {
            list.push(l);
          }
        });
        if (hasLegacyMockLog) {
          const batch = writeBatch(db);
          snapshot.forEach((docSnap) => {
            const l = docSnap.data() as ActivityLog;
            if (mockKeywords.some(k => l.details?.includes(k))) {
              batch.delete(docSnap.ref);
            }
          });
          initialLogs.forEach((l) => {
            const ref = doc(db, LOGS_COL, l.id);
            batch.set(ref, l);
          });
          await batch.commit();
          return;
        }
        if (list.length === 0) {
          onUpdate(initialLogs);
        } else {
          onUpdate(list);
        }
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
