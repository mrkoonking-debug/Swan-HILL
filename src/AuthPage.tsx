import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signInAnonymously,
  setPersistence,
  browserLocalPersistence
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './lib/firebase';
import { initialSettings } from './data/initialData';
import type { ResortSettings, StaffMember } from './types/pms';
import { Phone, Mail, Lock, KeyRound, Eye, EyeOff, ShieldCheck, Sparkles, CheckSquare, Square, UserCheck } from 'lucide-react';

interface AuthPageProps {
  onLoginSuccess?: () => void;
}

export default function AuthPage({ onLoginSuccess }: AuthPageProps) {
  // Prioritize Phone + PIN as default method (easier for elderly staff)
  const [method, setMethod] = useState<'phone_pin' | 'email'>('phone_pin');
  
  // Phone + PIN States
  const [phone, setPhone] = useState('');
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Email / Password States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // UI States
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [staffList, setStaffList] = useState<StaffMember[]>(initialSettings.staffList || []);
  const [allowedEmails, setAllowedEmails] = useState<string[]>(initialSettings.allowedEmails || []);
  const [allowGoogleLogin, setAllowGoogleLogin] = useState<boolean>(true);

  // Fetch latest staff list & email whitelist from Firestore on mount
  useEffect(() => {
    const fetchStaffConfig = async () => {
      try {
        const docRef = doc(db, 'settings', 'resort_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as ResortSettings;
          let list = (data.staffList && Array.isArray(data.staffList) && data.staffList.length > 0)
            ? [...data.staffList]
            : [...(initialSettings.staffList || [])];

          // Ensure owner 0923985962 with PIN 081863 is active and up-to-date
          const ownerIdx = list.findIndex(s => s.phone.replace(/[^0-9]/g, '') === '0923985962');
          if (ownerIdx >= 0) {
            list[ownerIdx] = { ...list[ownerIdx], pin: '081863', isActive: true, role: 'owner' };
          } else {
            list.unshift({
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

          setStaffList(list);
          // Sync into Firestore so remote is always up to date
          setDoc(docRef, { staffList: list }, { merge: true }).catch(() => {});

          if (data.allowedEmails && Array.isArray(data.allowedEmails)) {
            setAllowedEmails(data.allowedEmails);
          }
          if (data.allowGoogleLogin !== undefined) {
            setAllowGoogleLogin(data.allowGoogleLogin);
          }
          return;
        } else {
          // Document does not exist yet -> initialize with defaults
          await setDoc(docRef, initialSettings);
          setStaffList(initialSettings.staffList || []);
        }
      } catch (err) {
        console.warn('[AuthPage] Could not fetch remote staff list, using local fallback:', err);
      }

      // Check localStorage cached settings
      const localSettings = localStorage.getItem('swanhill_settings_v1');
      if (localSettings) {
        try {
          const parsed = JSON.parse(localSettings);
          if (parsed.staffList && Array.isArray(parsed.staffList)) {
            setStaffList(parsed.staffList);
          }
          if (parsed.allowedEmails && Array.isArray(parsed.allowedEmails)) {
            setAllowedEmails(parsed.allowedEmails);
          }
        } catch {
          // ignore
        }
      }
    };

    fetchStaffConfig();
  }, []);

  // Format phone number input nicely on typing (e.g. 0812345678 -> 081-234-5678)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
    if (val.length <= 3) {
      setPhone(val);
    } else if (val.length <= 6) {
      setPhone(`${val.slice(0, 3)}-${val.slice(3)}`);
    } else {
      setPhone(`${val.slice(0, 3)}-${val.slice(3, 6)}-${val.slice(6)}`);
    }
  };

  // 1. Handle Phone + PIN Login (Free 100%, No SMS required, Instant & Easy for Elderly)
  const handlePhonePinLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanInputPhone = phone.replace(/[^0-9]/g, '');
    const cleanInputPin = pin.trim();

    if (!cleanInputPhone || cleanInputPhone.length < 9) {
      setError('กรุณากรอกเบอร์โทรศัพท์ให้ถูกต้อง (9-10 หลัก)');
      setIsLoading(false);
      return;
    }

    if (!cleanInputPin || cleanInputPin.length < 4) {
      setError('กรุณากรอกรหัส PIN อย่างน้อย 4 หลัก');
      setIsLoading(false);
      return;
    }

    // Match against staff list
    let matchedStaff = staffList.find(s => {
      const staffCleanPhone = s.phone.replace(/[^0-9]/g, '');
      return staffCleanPhone === cleanInputPhone && s.pin.trim() === cleanInputPin && s.isActive !== false;
    });

    // Explicit fallback for master owner: 0923985962 / 081863
    if (!matchedStaff && cleanInputPhone === '0923985962' && cleanInputPin === '081863') {
      matchedStaff = {
        id: 'staff-owner',
        name: 'ผู้ดูแลระบบ / เจ้าของ',
        phone: '0923985962',
        pin: '081863',
        role: 'owner',
        isActive: true,
        notes: 'ผู้ดูแลหลัก',
        createdAt: new Date().toISOString(),
      };
    }

    if (!matchedStaff) {
      setError('เบอร์โทรศัพท์หรือรหัส PIN ไม่ถูกต้อง กรุณาตรวจสอบหรือติดต่อผู้ดูแลระบบ Swan HILL');
      setIsLoading(false);
      return;
    }

    try {
      // Save persistent staff session to localStorage (Remember Me)
      const session = {
        id: matchedStaff.id,
        name: matchedStaff.name,
        phone: matchedStaff.phone,
        role: matchedStaff.role,
        rememberMe: rememberMe,
        loggedInAt: new Date().toISOString(),
      };

      if (rememberMe) {
        localStorage.setItem('swanhill_staff_session', JSON.stringify(session));
      } else {
        sessionStorage.setItem('swanhill_staff_session', JSON.stringify(session));
      }

      // Also sign in anonymously to Firebase Auth if not already logged in
      try {
        await setPersistence(auth, browserLocalPersistence);
        if (!auth.currentUser) {
          await signInAnonymously(auth);
        }
      } catch (authErr) {
        console.warn('[AuthPage] Anonymous auth fallback:', authErr);
      }

      // Notify App of auth state change
      window.dispatchEvent(new Event('swanhill_auth_changed'));

      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        window.location.href = '/dashboard';
      }
    } catch (err: any) {
      console.error('[AuthPage] Login error:', err);
      setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบ กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsLoading(false);
    }
  };

  // 2. Handle Email + Password Login (with Whitelist verification)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const cleanEmail = email.toLowerCase().trim();

    // Check Whitelist against latest config
    let currentAllowed = allowedEmails;
    let currentStaff = staffList;
    try {
      const snap = await getDoc(doc(db, 'settings', 'resort_config'));
      if (snap.exists()) {
        const cfg = snap.data() as ResortSettings;
        if (cfg.allowedEmails) currentAllowed = cfg.allowedEmails;
        if (cfg.staffList) currentStaff = cfg.staffList;
      }
    } catch {}

    const isAllowed = currentAllowed.some(e => e.toLowerCase().trim() === cleanEmail) ||
      currentStaff.some(s => s.email?.toLowerCase().trim() === cleanEmail);

    if (!isAllowed) {
      setError(`❌ อีเมลนี้ (${cleanEmail}) ยังไม่ได้รับอนุญาตให้เข้าใช้งาน กรุณาติดต่อผู้ดูแลระบบ Swan HILL`);
      setIsLoading(false);
      return;
    }

    try {
      if (rememberMe) {
        await setPersistence(auth, browserLocalPersistence);
      }
      await signInWithEmailAndPassword(auth, email, password);
      localStorage.removeItem('swanhill_staff_session'); // Clear any legacy staff session
      window.dispatchEvent(new Event('swanhill_auth_changed'));
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('[AuthPage] Email auth error:', err);
      setError('อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Handle Google Login (STRICT WHITELIST - Block any unauthorized Gmail)
  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      // 1. Fetch latest whitelist from Firestore to be 100% up-to-date
      let currentAllowed = allowedEmails;
      let currentStaff = staffList;
      let isGoogleEnabled = allowGoogleLogin;

      try {
        const docRef = doc(db, 'settings', 'resort_config');
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          const data = snap.data() as ResortSettings;
          if (data.allowedEmails) currentAllowed = data.allowedEmails;
          if (data.staffList) currentStaff = data.staffList;
          if (data.allowGoogleLogin !== undefined) isGoogleEnabled = data.allowGoogleLogin;
        }
      } catch (err) {
        console.warn('Could not refresh whitelist:', err);
      }

      if (isGoogleEnabled === false) {
        setError('เจ้าของรีสอร์ทได้ปิดการเข้าสู่ระบบด้วย Google ชั่วคราว กรุณาใช้เบอร์โทร + รหัส PIN');
        setIsLoading(false);
        return;
      }

      await setPersistence(auth, browserLocalPersistence);
      const res = await signInWithPopup(auth, googleProvider);
      const userEmail = res.user.email?.toLowerCase().trim() || '';

      // Check if userEmail is on the Whitelist
      const isAllowed = currentAllowed.some(e => e.toLowerCase().trim() === userEmail) ||
        currentStaff.some(s => s.email?.toLowerCase().trim() === userEmail);

      if (!isAllowed) {
        // KICK THEM OUT IMMEDIATELY!
        await auth.signOut();
        setError(`❌ บัญชี Google (${userEmail}) ยังไม่ได้รับอนุญาตให้เข้าใช้งานระบบ กรุณาติดต่อผู้ดูแลระบบ Swan HILL เพื่อเพิ่มสิทธิ์ในหน้าตั้งค่า`);
        setIsLoading(false);
        return;
      }

      localStorage.removeItem('swanhill_staff_session');
      window.dispatchEvent(new Event('swanhill_auth_changed'));
      if (onLoginSuccess) onLoginSuccess();
    } catch (err: any) {
      console.error('[AuthPage] Google auth error:', err);
      if (!err.message?.includes('popup-closed-by-user')) {
        setError('เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-3 sm:p-4 font-['Prompt'] relative overflow-hidden select-none">
      {/* Ambient Radial Luxury Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/95 border border-slate-800 backdrop-blur-2xl rounded-3xl shadow-2xl p-5 sm:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header with Emblem + Typographic Wordmark */}
        <div className="text-center mb-6 flex flex-col items-center">
          <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/20 border-2 border-emerald-500/40 bg-slate-950 p-1 mb-3 transition-transform hover:scale-105">
            <img 
              src="/pwa-192x192.png" 
              alt="Swan HILL Logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <img 
            src="/swan-hill-white.png" 
            alt="Swan HILL" 
            className="h-6 sm:h-7 object-contain drop-shadow-md mb-1"
          />

          <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] sm:text-[11px] font-extrabold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RESORT MANAGEMENT SYSTEM</span>
          </div>

          <p className="text-xs text-slate-400 font-medium mt-1">
            เข้าสู่ระบบจัดการบ้านพัก การจอง และการเงิน
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-950/50 border border-red-800/80 text-red-300 p-3 rounded-2xl text-xs mb-5 animate-in fade-in flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Mode Selector Tabs */}
        <div className="flex bg-slate-950/80 p-1 rounded-2xl border border-slate-800 mb-5">
          <button
            type="button"
            onClick={() => {
              setMethod('phone_pin');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              method === 'phone_pin' 
                ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>เบอร์โทร + รหัส PIN</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMethod('email');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              method === 'email' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            <span>อีเมลผู้ดูแล</span>
          </button>
        </div>

        {/* 1. Phone Number + PIN Form (Primary & Friendly for Elderly Staff) */}
        {method === 'phone_pin' ? (
          <form onSubmit={handlePhonePinLogin} className="space-y-4">
            {/* Phone Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                เบอร์โทรศัพท์พนักงาน
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                <input
                  type="tel"
                  inputMode="numeric"
                  value={phone}
                  onChange={handlePhoneChange}
                  className="w-full pl-11 pr-4 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-base sm:text-lg font-mono font-bold text-white placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all tracking-wide"
                  placeholder="092-398-5962"
                  autoComplete="tel"
                  required
                />
              </div>
              <p className="text-[11px] text-slate-500 mt-1 pl-1">
                กรอกเบอร์โทรที่ลงทะเบียนไว้กับรีสอร์ท
              </p>
            </div>

            {/* PIN Code Input */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5 flex items-center justify-between">
                <span>รหัส PIN (4 - 6 หลัก)</span>
                <span className="text-[11px] text-emerald-400 font-normal">รหัสประจำตัว</span>
              </label>
              <div className="relative">
                <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-emerald-400" />
                <input
                  type={showPin ? "text" : "password"}
                  inputMode="numeric"
                  value={pin}
                  onChange={(e) => setPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                  className="w-full pl-11 pr-12 py-3 bg-slate-950 border border-slate-800 rounded-2xl text-lg sm:text-xl font-mono font-bold text-emerald-300 placeholder-slate-600 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all tracking-[0.25em]"
                  placeholder="••••"
                  maxLength={6}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 p-1 cursor-pointer"
                  title={showPin ? "ซ่อนรหัส PIN" : "แสดงรหัส PIN"}
                >
                  {showPin ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me Checkbox (Stay Logged In Permanently) */}
            <div 
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2.5 p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 cursor-pointer select-none hover:bg-slate-950 transition-colors"
            >
              <button
                type="button"
                className="text-emerald-400 flex items-center justify-center shrink-0"
              >
                {rememberMe ? (
                  <CheckSquare className="w-5 h-5 fill-emerald-500/20 text-emerald-400 stroke-[2.5]" />
                ) : (
                  <Square className="w-5 h-5 text-slate-500" />
                )}
              </button>
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-200">
                  จดจำการเข้าสู่ระบบไว้ในเครื่องนี้
                </span>
                <span className="text-[11px] text-slate-400">
                  เปิดแอพรอบต่อไปเข้าใช้งานได้ทันที ไม่ต้องกรอกซ้ำ
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold text-sm py-3.5 rounded-2xl shadow-lg shadow-emerald-500/25 transition-all cursor-pointer disabled:opacity-50 flex items-center justify-center gap-2 mt-2"
            >
              <UserCheck className="w-4 h-4 stroke-[2.5]" />
              <span>{isLoading ? 'กำลังตรวจสอบ...' : 'เข้าสู่ระบบ'}</span>
            </button>
          </form>
        ) : (
          /* 2. Email + Password Form */
          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">อีเมล (Email)</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="admin@swanhill.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">รหัสผ่าน (Password)</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            {/* Remember Me Checkbox */}
            <div 
              onClick={() => setRememberMe(!rememberMe)}
              className="flex items-center gap-2 cursor-pointer select-none py-1"
            >
              <button type="button" className="text-emerald-400">
                {rememberMe ? <CheckSquare className="w-4 h-4 text-emerald-400" /> : <Square className="w-4 h-4 text-slate-500" />}
              </button>
              <span className="text-xs text-slate-300 font-medium">จดจำบัญชีไว้ในเครื่องนี้</span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
            </button>

            {/* Google Sign-in */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-slate-950 hover:bg-slate-800/80 active:scale-95 border border-slate-800 text-slate-300 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
              >
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                <span>เข้าสู่ระบบด้วย Google</span>
              </button>
            </div>
          </form>
        )}

        {/* Security Reassurance Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>ระบบคลาวด์ Swan HILL • ปลอดภัย 100% ไม่เสียค่า SMS</span>
        </div>

      </div>
    </div>
  );
}
