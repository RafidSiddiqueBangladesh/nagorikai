import {
  Accessibility,
  Hand,
  Keyboard,
  Moon,
  Sparkles,
  Sun,
  Volume2,
  X,
} from 'lucide-react';
import { useCivic } from '../../context/CivicContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshGeoData';
import { SignInModal } from './SignInModal';
import { SphereAiPanel } from './SphereAiAssistant';

export function FloatingCivicTools() {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    accessibility,
    updateAccessibility,
    speakText,
    sphereDrawerOpen,
    setSphereDrawerOpen,
    a11yDrawerOpen,
    setA11yDrawerOpen,
    onboardingOpen,
    setOnboardingOpen,
    user,
    updateUserProfile,
    setActiveView,
  } = useCivic();

  const isBn = language === 'bn';

  return (
    <>
      <SignInModal />

      {/* Bottom Corner Floating Action Triggers */}
      <div className="fixed bottom-4 right-4 z-40 flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => {
            setSphereDrawerOpen(false);
            setA11yDrawerOpen(!a11yDrawerOpen);
          }}
          aria-label={isBn ? 'সহায়ক ও থিম নিয়ন্ত্রণ খুলুন' : 'Open Accessibility Quick Center'}
          className="inline-flex items-center gap-2 px-4 py-3 text-xs font-bold rounded-full glass-panel text-slate-900 dark:text-white hover:border-emerald-500 transition-transform active:scale-95 shadow-xl"
        >
          <Accessibility className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
          <span className="hidden sm:inline">{isBn ? 'অ্যাক্সেসিবিলিটি' : 'Accessibility'}</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setA11yDrawerOpen(false);
            setSphereDrawerOpen(!sphereDrawerOpen);
          }}
          aria-label={isBn ? 'Sphere AI সহায়ক খুলুন' : 'Open Sphere AI Assistant'}
          className="inline-flex items-center gap-2 px-5 py-3 text-xs font-bold rounded-full bg-gradient-to-r from-emerald-600 via-teal-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white shadow-xl transition-transform active:scale-95"
        >
          <Sparkles className="w-5 h-5" />
          <span>{isBn ? 'নাগরিক AI' : 'Sphere AI'}</span>
        </button>
      </div>

      {/* Floating Sphere AI Drawer */}
      {sphereDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sphere AI Civic Assistant"
          className="fixed inset-0 z-50 bg-slate-950/55 backdrop-blur-sm flex justify-end p-2 sm:p-4"
        >
          <div className="glass-panel w-full max-w-2xl h-full rounded-2xl overflow-hidden flex flex-col">
            <SphereAiPanel onClose={() => setSphereDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Floating Accessibility Quick Control Drawer */}
      {a11yDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Accessibility Controls"
          className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-sm flex justify-end p-2 sm:p-4"
        >
          <div className="glass-panel w-full max-w-md h-full rounded-2xl p-5 overflow-y-auto space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isBn ? 'অ্যাক্সেসিবিলিটি ও থিম নিয়ন্ত্রণ' : 'Accessibility & Theme Controls'}
              </h2>
              <button
                type="button"
                onClick={() => setA11yDrawerOpen(false)}
                aria-label="Close accessibility controls"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Theme & Language */}
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold"
              >
                {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
                {theme === 'light'
                  ? isBn
                    ? 'ডার্ক গ্লাস'
                    : 'Dark Glass'
                  : isBn
                    ? 'লাইট গ্লাস'
                    : 'Light Glass'}
              </button>
              <button
                type="button"
                onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
                className="py-2.5 px-3 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-semibold font-bengali"
              >
                {language === 'en' ? 'বাংলায় পরিবর্তন করুন' : 'Switch to English'}
              </button>
            </div>

            {/* Quick Mode Launchers */}
            <div className="space-y-2 text-xs">
              <div className="font-semibold text-slate-600 dark:text-slate-300">
                {isBn ? 'বিশেষায়িত যোগাযোগ কর্মক্ষেত্র' : 'Dedicated Communication Workspaces'}
              </div>
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setA11yDrawerOpen(false);
                    setActiveView('signtalk');
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-700 text-white font-semibold text-left"
                >
                  <Hand className="w-4 h-4 shrink-0" />
                  {isBn
                    ? 'SignTalk বাংলা ইশারা ভাষা ৩ডি ও ক্যামেরা স্টুডিও'
                    : 'Open SignTalk BdSL 3D & Camera Studio'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setA11yDrawerOpen(false);
                    setActiveView('accessibility');
                  }}
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 dark:bg-slate-800 text-white font-semibold text-left"
                >
                  <Keyboard className="w-4 h-4 shrink-0" />
                  {isBn
                    ? 'ব্রেইল কনভার্টার ও আই-গেজ কীবোর্ড খুলুন'
                    : 'Open Braille Mode & Eye-Gaze Keyboard'}
                </button>
              </div>
            </div>

            {/* Toggles */}
            <div className="space-y-2 text-xs">
              {[
                {
                  key: 'highContrast',
                  en: 'High Contrast (WCAG AAA)',
                  bn: 'উচ্চ বৈসাদৃশ্য (WCAG AAA)',
                },
                {
                  key: 'dyslexiaFont',
                  en: 'Dyslexia-Friendly Typography',
                  bn: 'ডিসলেক্সিয়া-বান্ধব ফন্ট',
                },
                { key: 'reducedMotion', en: 'Reduced Motion', bn: 'কম অ্যানিমেশন' },
                { key: 'colorBlindSafe', en: 'Color-Blind Safe Mode', bn: 'বর্ণান্ধ নিরাপদ মোড' },
                {
                  key: 'autismSimplified',
                  en: 'Autism-Friendly Simplified View',
                  bn: 'অটিজম-বান্ধব সহজ ভিউ',
                },
                { key: 'easyRead', en: 'Easy-Read Language Mode', bn: 'সহজ-পাঠ্য মোড' },
                {
                  key: 'brailleReadingMode',
                  en: 'Braille-Friendly Wide Spacing',
                  bn: 'ব্রেইল প্রশস্ত স্পেসিং',
                },
              ].map((opt) => {
                const val = accessibility[opt.key as keyof typeof accessibility] as boolean;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => updateAccessibility({ [opt.key]: !val })}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl border font-medium ${
                      val
                        ? 'bg-emerald-700 text-white border-emerald-700'
                        : 'bg-white/75 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    <span>{isBn ? opt.bn : opt.en}</span>
                    <span>{val ? (isBn ? 'চালু' : 'On') : isBn ? 'বন্ধ' : 'Off'}</span>
                  </button>
                );
              })}
            </div>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between font-semibold">
                <span>{isBn ? 'লেখার আকার' : 'Text Size'}</span>
                <span className="font-mono tabular-nums">{Math.round(accessibility.fontScale * 100)}%</span>
              </div>
              <input
                type="range"
                min={0.9}
                max={1.35}
                step={0.05}
                value={accessibility.fontScale}
                onChange={(e) => updateAccessibility({ fontScale: Number(e.target.value) })}
                className="w-full accent-emerald-600"
              />
            </div>

            <button
              type="button"
              onClick={() =>
                speakText(
                  isBn
                    ? 'নাগরিক এআই ও সিভিকস্ফিয়ার। আপনার অধিকার, আপনার সেবা, আপনার কণ্ঠ।'
                    : 'Nagarik AI, CivicSphere. Your Rights, Your Services, Your Voice.',
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 py-2.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 rounded-xl"
            >
              <Volume2 className="w-4 h-4" />
              {isBn ? 'পেজ সারসংক্ষেপ পড়ে শোনান' : 'Read Page Summary Aloud'}
            </button>
          </div>
        </div>
      )}

      {/* Citizen Onboarding & Preferences Modal */}
      {onboardingOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Personalize CivicSphere AI"
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="glass-panel max-w-lg w-full rounded-2xl p-6 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                {isBn ? 'আপনার নাগরিক অভিজ্ঞতা সাজিয়ে নিন' : 'Personalize Your Civic Experience'}
              </h2>
              <button
                type="button"
                onClick={() => setOnboardingOpen(false)}
                aria-label="Close onboarding"
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="font-semibold block mb-1">
                  {isBn ? 'প্রদর্শিত নাম' : 'Display Name'}
                </label>
                <input
                  type="text"
                  value={user.name}
                  onChange={(e) => updateUserProfile({ name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="font-semibold block mb-1">{isBn ? 'ভাষা' : 'Language'}</label>
                  <select
                    value={language}
                    onChange={(e) => {
                      const l = e.target.value as 'en' | 'bn';
                      setLanguage(l);
                      updateUserProfile({ language: l });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option value="en">English</option>
                    <option value="bn">বাংলা (Bangla)</option>
                  </select>
                </div>
                <div>
                  <label className="font-semibold block mb-1">{isBn ? 'জেলা' : 'District'}</label>
                  <select
                    value={user.district}
                    onChange={(e) => updateUserProfile({ district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    {BANGLADESH_DISTRICTS.map((d) => (
                      <option key={d.id} value={d.nameEn}>
                        {isBn ? d.nameBn : d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {isBn ? 'যোগাযোগের পছন্দসই মাধ্যম' : 'Preferred Communication Mode'}
                </label>
                <select
                  value={user.communicationPreference}
                  onChange={(e) =>
                    updateUserProfile({
                      communicationPreference: e.target.value as typeof user.communicationPreference,
                    })
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Text & Visual">Text &amp; Visual</option>
                  <option value="Voice & Audio">Voice &amp; Audio Reading</option>
                  <option value="Sign Language (BdSL)">Sign Language (SignTalk BdSL)</option>
                  <option value="Braille & Screen Reader">Braille &amp; Screen Reader</option>
                  <option value="Eye-Gaze Control">Eye-Gaze Control</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  updateUserProfile({ onboarded: true });
                  setOnboardingOpen(false);
                }}
                className="px-4 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
              >
                {isBn ? 'সংরক্ষণ করুন' : 'Save Preferences'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
