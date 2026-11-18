import { CheckCircle2, LogIn, Mail, ShieldCheck, UserPlus, X } from 'lucide-react';
import { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshGeoData';
import { signInWithEmailSupabase, signUpWithEmailSupabase } from '../../lib/supabaseClient';

export function SignInModal() {
  const {
    language,
    authModalOpen,
    setAuthModalOpen,
    supabaseReady,
    signInGoogle,
    signInLocalProfile,
    user,
  } = useCivic();

  const isBn = language === 'bn';
  const [mode, setMode] = useState<'signin' | 'register'>('signin');
  const [fullName, setFullName] = useState(user.isGuest ? '' : user.name);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [district, setDistrict] = useState(user.district || 'Dhaka');
  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!authModalOpen) return null;

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setFeedback(null);
    setLoading(true);
    const res = await signInGoogle();
    setLoading(false);
    if (!res.ok) {
      setErrorMsg(
        res.error ||
          (isBn
            ? 'Google লগইনের জন্য Settings > Secrets-এ Supabase কনফিগার করুন অথবা নিচের নাগরিক প্রোফাইল ব্যবহার করুন।'
            : 'Configure Supabase in Settings > Secrets for live Google OAuth, or use the citizen profile sign-in below.'),
      );
    }
  };

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setFeedback(null);

    if (!email.trim()) {
      setErrorMsg(isBn ? 'অনুগ্রহ করে আপনার ইমেইল দিন।' : 'Please enter your email address.');
      return;
    }

    if (supabaseReady && password.length >= 6) {
      setLoading(true);
      if (mode === 'register') {
        const res = await signUpWithEmailSupabase(
          email.trim(),
          password,
          fullName.trim() || email.split('@')[0],
        );
        setLoading(false);
        if (!res.ok) {
          setErrorMsg(res.error || 'Registration failed.');
          return;
        }
        if (res.needsVerification) {
          setFeedback(
            isBn
              ? 'আপনার ইমেইলে ভেরিফিকেশন লিংক পাঠানো হয়েছে। ইনবক্স যাচাই করুন।'
              : 'Verification link sent to your email. Please confirm to complete Supabase sign-in.',
          );
          return;
        }
        setAuthModalOpen(false);
        return;
      }

      const res = await signInWithEmailSupabase(email.trim(), password);
      setLoading(false);
      if (!res.ok) {
        setErrorMsg(res.error || 'Sign-in failed.');
        return;
      }
      setAuthModalOpen(false);
      return;
    }

    // Immediate Citizen Session (when Supabase env keys are not yet added or password omitted)
    signInLocalProfile({
      name: fullName.trim() || email.split('@')[0],
      email: email.trim(),
      district,
      authProvider: 'local',
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={isBn ? 'নাগরিক সাইন ইন' : 'Citizen Sign In'}
      className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-4"
    >
      <div className="glass-panel max-w-md w-full rounded-3xl p-6 space-y-5 text-xs shadow-2xl">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
              <ShieldCheck className="w-3.5 h-3.5" />
              {supabaseReady
                ? isBn
                  ? 'Supabase অথেনটিকেশন সংযুক্ত'
                  : 'Supabase Auth Connected'
                : isBn
                  ? 'নাগরিক ড্যাশবোর্ড সেশন'
                  : 'Citizen Dashboard Session'}
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              {mode === 'signin'
                ? isBn
                  ? 'নাগরিক অ্যাকাউন্টে সাইন ইন করুন'
                  : 'Sign In to My Dashboard'
                : isBn
                  ? 'নতুন নাগরিক অ্যাকাউন্ট খুলুন'
                  : 'Create Citizen Account'}
            </h2>
          </div>

          <button
            type="button"
            onClick={() => setAuthModalOpen(false)}
            aria-label={isBn ? 'বন্ধ করুন' : 'Close sign-in dialog'}
            className="p-2 rounded-full hover:bg-slate-200/70 dark:hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Google OAuth Button */}
        <button
          type="button"
          disabled={loading}
          onClick={handleGoogleLogin}
          className="w-full py-3 px-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-emerald-400/25 hover:border-emerald-500 flex items-center justify-center gap-2.5 text-sm font-semibold text-slate-900 dark:text-white shadow-sm transition-all"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24Z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14Z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96Z"
            />
          </svg>
          {isBn ? 'Google দিয়ে লগইন করুন' : 'Continue with Google'}
        </button>

        <div className="flex items-center gap-3 text-[11px] text-slate-500 dark:text-slate-400">
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
          <span>{isBn ? 'অথবা ইমেইল ব্যবহার করুন' : 'OR USE EMAIL'}</span>
          <div className="flex-1 h-px bg-slate-200 dark:bg-white/10" />
        </div>

        {/* Mode toggle */}
        <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-white/10">
          <button
            type="button"
            onClick={() => setMode('signin')}
            className={`py-1.5 rounded-lg font-semibold transition-colors ${
              mode === 'signin'
                ? 'bg-emerald-600 text-white dark:bg-emerald-300 dark:text-slate-950'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <LogIn className="w-3.5 h-3.5 inline mr-1" />
            {isBn ? 'সাইন ইন' : 'Sign In'}
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-1.5 rounded-lg font-semibold transition-colors ${
              mode === 'register'
                ? 'bg-emerald-600 text-white dark:bg-emerald-300 dark:text-slate-950'
                : 'text-slate-700 dark:text-slate-300'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5 inline mr-1" />
            {isBn ? 'নিবন্ধন' : 'Register'}
          </button>
        </div>

        <form onSubmit={handleEmailSubmit} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="font-semibold block mb-1">
                {isBn ? 'পূর্ণ নাম' : 'Full Name'}
              </label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={isBn ? 'আপনার নাম লিখুন...' : 'Enter your name...'}
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
          )}

          <div>
            <label className="font-semibold block mb-1">
              {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="citizen@example.com"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <div>
              <label className="font-semibold block mb-1">
                {isBn ? 'পাসওয়ার্ড (৬+ অক্ষর)' : 'Password (6+ chars)'}
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div>
              <label className="font-semibold block mb-1">
                {isBn ? 'নিজ জেলা' : 'Home District'}
              </label>
              <select
                aria-label="Home District"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                {BANGLADESH_DISTRICTS.map((d) => (
                  <option key={d.id} value={d.nameEn}>
                    {isBn ? d.nameBn : d.nameEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {errorMsg && (
            <p className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
              {errorMsg}
            </p>
          )}
          {feedback && (
            <p className="p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              {feedback}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 text-sm font-bold rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white shadow-md transition-all"
          >
            {loading
              ? isBn
                ? 'প্রক্রিয়াকরণ হচ্ছে...'
                : 'Authenticating...'
              : mode === 'signin'
                ? isBn
                  ? 'আমার ড্যাশবোর্ডে প্রবেশ করুন'
                  : 'Sign In to Dashboard'
                : isBn
                  ? 'অ্যাকাউন্ট তৈরি করুন'
                  : 'Create Citizen Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
