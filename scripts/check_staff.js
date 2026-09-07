import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

async function checkStaff() {
  try {
    const docRef = doc(db, 'settings', 'resort_config');
    const snap = await getDoc(docRef);
    if (snap.exists()) {
      const data = snap.data();
      console.log("=== FIRESTORE DATA FOUND ===");
      console.log("resortNameTh:", data.resortNameTh);
      console.log("staffList count:", data.staffList?.length || 0);
      console.log("staffList details:", JSON.stringify(data.staffList, null, 2));
      console.log("allowedEmails:", data.allowedEmails);
      console.log("allowGoogleLogin:", data.allowGoogleLogin);
    } else {
      console.log("Document 'settings/resort_config' does not exist in Firestore!");
    }
  } catch (err) {
    console.error("Error reading Firestore:", err);
  }
  process.exit(0);
}

checkStaff();
