import React, { useState, useEffect } from 'react';
import { 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  RecaptchaVerifier, 
  signInWithPhoneNumber,
  type ConfirmationResult
} from 'firebase/auth';
import { auth, googleProvider } from './lib/firebase';
import { Phone, Mail, Lock, ShieldCheck, Sparkles } from 'lucide-react';

declare global {
  interface Window {
    recaptchaVerifier: any;
  }
}

export default function AuthPage() {
  const [method, setMethod] = useState<'email' | 'phone'>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Initialize reCAPTCHA for phone auth
    if (!window.recaptchaVerifier) {
      window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
        'size': 'invisible',
      });
    }
  }, []);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError(err.message || 'อีเมลหรือรหัสผ่านไม่ถูกต้อง');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError('');
    setIsLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err: any) {
      setError(err.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบด้วย Google');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      let formattedPhone = phone.trim().replace(/[-\s]/g, '');
      if (formattedPhone.startsWith('0')) {
        formattedPhone = '+66' + formattedPhone.substring(1);
      }
      const appVerifier = window.recaptchaVerifier;
      const confirmation = await signInWithPhoneNumber(auth, formattedPhone, appVerifier);
      setConfirmationResult(confirmation);
    } catch (err: any) {
      setError(err.message || 'ส่งรหัส OTP ไม่สำเร็จ กรุณาตรวจสอบเบอร์โทรศัพท์');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!confirmationResult) return;
    setIsLoading(true);
    try {
      await confirmationResult.confirm(otp);
    } catch (err: any) {
      setError(err.message || 'รหัส OTP ไม่ถูกต้องหรือหมดอายุ');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-950 text-slate-100 p-4 font-['Prompt'] relative overflow-hidden select-none">
      {/* Ambient Radial Luxury Glows */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full bg-emerald-600/15 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full bg-cyan-600/15 blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-slate-900/90 border border-slate-800 backdrop-blur-2xl rounded-3xl shadow-2xl p-6 sm:p-8 relative z-10 animate-in fade-in zoom-in-95 duration-300">
        
        {/* Brand Header with Emblem + Typographic Wordmark */}
        <div className="text-center mb-7 flex flex-col items-center">
          <div className="w-20 h-20 rounded-2xl overflow-hidden shadow-xl shadow-emerald-500/20 border-2 border-emerald-500/40 bg-slate-950 p-1 mb-3.5 transition-transform hover:scale-105">
            <img 
              src="/pwa-192x192.png" 
              alt="Swan HILL Logo" 
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <img 
            src="/swan-hill-white.png" 
            alt="Swan HILL" 
            className="h-7 object-contain drop-shadow-md mb-1.5"
          />

          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-extrabold tracking-widest uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            <span>RESORT MANAGEMENT SYSTEM</span>
          </div>

          <p className="text-xs text-slate-400 font-medium mt-1">
            เข้าสู่ระบบจัดการบ้านพัก การจอง และการเงิน
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="bg-red-950/40 border border-red-800/60 text-red-300 p-3 rounded-2xl text-xs mb-5 animate-in fade-in flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Method Tabs */}
        <div className="flex bg-slate-950/70 p-1 rounded-2xl border border-slate-800 mb-6">
          <button
            onClick={() => {
              setMethod('email');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              method === 'email' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            อีเมลผู้ดูแล
          </button>
          <button
            onClick={() => {
              setMethod('phone');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${
              method === 'phone' 
                ? 'bg-slate-800 text-white shadow-sm border border-slate-700' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            เบอร์โทรศัพท์ (OTP)
          </button>
        </div>

        {/* Email / Password Form */}
        {method === 'email' ? (
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
                  placeholder="admin@resort.com"
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

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'กำลังเข้าสู่ระบบ...' : 'เข้าสู่ระบบ (Sign In)'}
            </button>
          </form>
        ) : (
          <div>
            {!confirmationResult ? (
              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">เบอร์โทรศัพท์</label>
                  <div className="relative">
                    <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                      placeholder="081 234 5678"
                      required
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 active:scale-95 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'กำลังส่งรหัส...' : 'ส่งรหัส OTP'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1.5">กรอกรหัส OTP 6 หลัก</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    className="w-full px-4 py-3 text-center tracking-[0.4em] text-lg font-mono font-bold bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all"
                    placeholder="000000"
                    maxLength={6}
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isLoading ? 'กำลังยืนยัน...' : 'ยืนยันรหัส OTP'}
                </button>
              </form>
            )}
          </div>
        )}

        {/* Or Divider */}
        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="px-3 bg-slate-900 text-slate-500 font-medium">หรือเข้าสู่ระบบด้วย</span>
            </div>
          </div>
          
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="mt-4 w-full flex items-center justify-center gap-2.5 bg-slate-950 hover:bg-slate-800/80 active:scale-95 border border-slate-800 text-slate-200 text-xs font-bold py-2.5 rounded-xl transition-all cursor-pointer shadow-xs"
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
              <path
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                fill="#4285F4"
              />
              <path
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                fill="#34A853"
              />
              <path
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                fill="#FBBC05"
              />
              <path
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                fill="#EA4335"
              />
            </svg>
            <span>Google Account</span>
          </button>
        </div>

        {/* Security Reassurance Footer */}
        <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
          <span>ระบบคลาวด์ Swan HILL • ปลอดภัย 100%</span>
        </div>

      </div>
      <div id="recaptcha-container"></div>
    </div>
  );
}
