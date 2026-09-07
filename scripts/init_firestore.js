import { initializeApp } from "firebase/app";
import { getFirestore, doc, setDoc, getDoc } from "firebase/firestore";

const firebaseConfig = {
  projectId: "swan-hill-0474",
  appId: "1:957462872673:web:485245c444d697c460e020",
  storageBucket: "swan-hill-0474.firebasestorage.app",
  apiKey: "AIzaSyBoEmO55NGaqg6GSI_Nr2E3JB2_lUnYZU0",
  authDomain: "swan-hill-0474.firebaseapp.com",
  messagingSenderId: "957462872673",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const initialRooms = [
  {
    id: 'room-s3',
    roomNumber: 'S3',
    name: 'บ้าน S3 (หลังใหญ่)',
    type: 'บ้านพักหลังใหญ่',
    sizeCategory: 'large',
    pricePerNight: 1500,
    status: 'available',
    capacity: 4,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงชมวิว', 'ที่จอดรถส่วนตัว'],
  },
  {
    id: 'room-s4',
    roomNumber: 'S4',
    name: 'บ้าน S4 (หลังใหญ่)',
    type: 'บ้านพักหลังใหญ่',
    sizeCategory: 'large',
    pricePerNight: 1500,
    status: 'available',
    capacity: 4,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงชมวิว', 'ที่จอดรถส่วนตัว'],
  },
  {
    id: 'room-s1',
    roomNumber: 'S1',
    name: 'บ้าน S1 (หลังกลาง)',
    type: 'บ้านพักหลังกลาง',
    sizeCategory: 'medium',
    pricePerNight: 1200,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงส่วนตัว'],
  },
  {
    id: 'room-s2',
    roomNumber: 'S2',
    name: 'บ้าน S2 (หลังกลาง)',
    type: 'บ้านพักหลังกลาง',
    sizeCategory: 'medium',
    pricePerNight: 1200,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'สมาร์ททีวี', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'ระเบียงส่วนตัว'],
  },
  {
    id: 'room-s5',
    roomNumber: 'S5',
    name: 'บ้าน S5 (บ้านแฝดซ้าย)',
    type: 'บ้านพักแฝดหลังเล็ก',
    sizeCategory: 'small',
    pricePerNight: 1000,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'วิวธรรมชาติ'],
  },
  {
    id: 'room-s6',
    roomNumber: 'S6',
    name: 'บ้าน S6 (บ้านแฝดขวา)',
    type: 'บ้านพักแฝดหลังเล็ก',
    sizeCategory: 'small',
    pricePerNight: 1000,
    status: 'available',
    capacity: 2,
    amenities: ['เครื่องปรับอากาศ', 'เครื่องทำน้ำอุ่น', 'ตู้เย็น', 'วิวธรรมชาติ'],
  },
];

const initialSettings = {
  resortNameEn: 'SWAN HILL RESORT',
  resortNameTh: 'สวอนฮิลล์ รีสอร์ท',
  phone: '081-234-5678',
  address: 'ตำบลหนองรี อำเภอเมือง จังหวัดชลบุรี',
  lineId: '@swanhill',
  facebook: 'Swan HILL Resort',
  checkInTime: '14:00',
  checkOutTime: '12:00',
  receiptFooterMessage: 'ขอบพระคุณที่ไว้วางใจเลือกพักกับ Swan HILL Resort ขอให้มีความสุขและความสะดวกสบายตลอดการเข้าพัก',
  rateMediumRoom: 1200,
  rateLargeRoom: 1500,
  rateSmallRoom: 1000,
  extraBedPrice: 300,
  extraBreakfastPrice: 60,
  mookataSmallPrice: 350,
  mookataLargePrice: 500,
  bankName: 'กสิกรไทย (KBANK)',
  bankAccountNo: '123-4-56789-0',
  bankAccountName: 'สวอนฮิลล์ รีสอร์ท',
  promptPayNo: '081-234-5678',
  staffList: [
    {
      id: 'staff-owner-master',
      name: 'ผู้ดูแลระบบ / เจ้าของ',
      phone: '0923985962',
      pin: '081863',
      password: '081863',
      role: 'owner',
      isActive: true,
      notes: 'บัญชีหลักเจ้าของระบบ',
      createdAt: new Date().toISOString(),
    }
  ],
  mookataSupplierName: 'ร้านหมูกระทะ',
  mookataSupplierPhone: '081-234-5678',
  allowedEmails: [],
  allowGoogleLogin: true,
};

async function init() {
  console.log("Seeding Firestore cloud database...");
  try {
    // 1. Seed Settings
    await setDoc(doc(db, 'settings', 'resort_config'), initialSettings);
    console.log("✓ Successfully saved settings/resort_config to Firestore!");

    // 2. Seed Rooms
    for (const room of initialRooms) {
      await setDoc(doc(db, 'rooms', room.id), room);
    }
    console.log("✓ Successfully saved all 6 rooms to Firestore!");

    console.log("All data successfully seeded into Cloud Firestore!");
  } catch (err) {
    console.error("Error seeding Firestore:", err);
  }
  process.exit(0);
}

init();
