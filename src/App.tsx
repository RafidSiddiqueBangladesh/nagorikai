import {
  Accessibility,
  ArrowRight,
  Compass,
  Eye,
  FileSearch,
  Hand,
  HeartHandshake,
  Keyboard,
  LogIn,
  Moon,
  Plus,
  Siren,
  Sparkles,
  Sun,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { SignTalkStudio } from './components/SignTalkStudio';
import { AccessibilityCenter } from './components/civic/AccessibilityCenter';
import { AiDocumentReaderSection } from './components/civic/AiDocumentReaderSection';
import { BangladeshMapSection } from './components/civic/BangladeshMapSection';
import {
  AdminConsoleView,
  CitizenDashboardView,
} from './components/civic/CitizenDashboardAndAdmin';
import { CitizenVoiceSection } from './components/civic/CitizenVoiceSection';
import { CommunityEventsSection } from './components/civic/CommunityEventsSection';
import { EmergencyAssistanceSection } from './components/civic/EmergencyAssistanceSection';
import { FloatingCivicTools } from './components/civic/FloatingCivicTools';
import { GovernmentServicesSection } from './components/civic/GovernmentServicesSection';
import { HumanHelpNetworkSection } from './components/civic/HumanHelpNetworkSection';
import { LegalHelpSection } from './components/civic/LegalHelpSection';
import { NewsFactCheckSection } from './components/civic/NewsFactCheckSection';
import { RewardsAndLeaderboardSection } from './components/civic/RewardsAndLeaderboardSection';
import { SphereAiPanel } from './components/civic/SphereAiAssistant';
import { SupportAndInclusionSection } from './components/civic/SupportAndInclusionSection';
import { TransparencySection } from './components/civic/TransparencySection';
import { UniversalSearchBar } from './components/civic/UniversalSearchBar';
import { CivicProvider, useCivic } from './context/CivicContext';
import type { WorkspaceView } from './types/civicsphere';
import { runHeroAndSectionAnimations, runViewTransition } from './utils/gsapAnimations';

const WORKSPACE_TABS: Array<{ id: WorkspaceView; en: string; bn: string }> = [
  { id: 'home', en: 'Home', bn: 'হোম' },
  { id: 'sphere-ai', en: 'Sphere AI', bn: 'Sphere AI' },
  { id: 'doc-reader', en: 'AI Doc Reader', bn: 'দলিল পাঠক' },
  { id: 'signtalk', en: 'SignTalk (BdSL)', bn: 'SignTalk ইশারা' },
  { id: 'accessibility', en: 'Accessibility Center', bn: 'অ্যাক্সেসিবিলিটি' },
  { id: 'services', en: 'Gov Services', bn: 'সরকারি সেবা' },
  { id: 'map', en: 'Bangladesh Map', bn: 'মানচিত্র ও রিপোর্ট' },
  { id: 'voice', en: 'Citizen Voice', bn: 'নাগরিক কণ্ঠ ও বাজেট' },
  { id: 'events', en: 'Events', bn: 'ইভেন্ট' },
  { id: 'legal', en: 'Legal Help', bn: 'আইনি সহায়তা' },
  { id: 'help-network', en: 'Human Help', bn: 'মানবিক সহায়তা' },
  { id: 'support', en: 'Women & Elderly', bn: 'নারী ও প্রবীণ' },
  { id: 'disability', en: 'Disability Network', bn: 'প্রতিবন্ধী নেটওয়ার্ক' },
  { id: 'transparency', en: 'Follow the Money', bn: 'স্বচ্ছতা ও অর্থ' },
  { id: 'emergency', en: 'Emergency SOS', bn: 'জরুরি SOS' },
  { id: 'news', en: 'News & Fact-Check', bn: 'সংবাদ ও যাচাই' },
  { id: 'rewards', en: 'Leaderboard', bn: 'লিডারবোর্ড' },
  { id: 'dashboard', en: 'My Dashboard', bn: 'আমার ড্যাশবোর্ড' },
  { id: 'admin', en: 'Admin Console', bn: 'অ্যাডমিন কনসোল' },
];

function CivicSphereShell() {
  const {
    theme,
    toggleTheme,
    language,
    setLanguage,
    activeView,
    setActiveView,
    accessibility,
    openSphereWithPrompt,
    initiatives,
    supportInitiative,
    setOnboardingOpen,
    setAuthModalOpen,
    user,
  } = useCivic();

  const isBn = language === 'bn';
  const mainRef = useRef<HTMLElement | null>(null);
  const [quotaBannerDismissed, setQuotaBannerDismissed] = useState(false);
  const [quotaExceeded, setQuotaExceeded] = useState(false);

  useEffect(() => {
    const onQuota = () => setQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', onQuota);
    return () => window.removeEventListener('gmp-quota-exceeded', onQuota);
  }, []);

  useEffect(() => {
    if (activeView === 'home') {
      return runHeroAndSectionAnimations(mainRef.current, accessibility.reducedMotion);
    }
    return runViewTransition(mainRef.current, accessibility.reducedMotion);
  }, [activeView, accessibility.reducedMotion]);

  const navigateTo = (view: WorkspaceView) => {
    setActiveView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col relative overflow-x-hidden bg-gradient-to-br from-[#f2fbf7] via-[#eef7ff] to-[#f4f6ff] dark:from-[#03130f] dark:via-[#051a2e] dark:to-[#041226] text-slate-900 dark:text-slate-100">
      {/* Google Maps Quota Exceeded Sticky Top Banner */}
      {quotaExceeded && !quotaBannerDismissed && (
        <div
          role="alert"
          className="sticky top-0 z-50 bg-amber-600 text-white px-4 py-2.5 text-xs font-medium flex flex-wrap items-center justify-between gap-2 shadow-md"
        >
          <span>
            Google Maps demo key daily quota reached. To continue using full interactive map quotas, switch to your own Google Cloud API key:{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-bold"
            >
              Google Maps AI Studio Quota Guide
            </a>
          </span>
          <button
            type="button"
            onClick={() => setQuotaBannerDismissed(true)}
            aria-label="Dismiss quota notice"
            className="p-1 rounded hover:bg-white/20"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Subtle GSAP-animated Ambient Liquid-Glass Orbs */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 overflow-hidden -z-10"
      >
        <div className="gsap-float-slow absolute -top-36 -left-28 w-[520px] h-[520px] rounded-full bg-emerald-400/20 dark:bg-emerald-500/15 blur-3xl" />
        <div className="gsap-float-slow absolute top-1/3 -right-32 w-[540px] h-[540px] rounded-full bg-sky-400/20 dark:bg-sky-500/18 blur-3xl" />
        <div className="gsap-float-slow absolute bottom-0 left-1/3 w-[460px] h-[460px] rounded-full bg-teal-300/15 dark:bg-indigo-600/15 blur-3xl" />
      </div>

      {/* 1. Floating Frosted Emerald Pill Header (Inspired by Green Genesis 2026) */}
      <div className="sticky top-0 z-30 max-w-[1400px] w-full mx-auto px-3 sm:px-6 pt-3">
        <header className="rounded-full px-4 sm:px-6 h-16 flex items-center justify-between gap-4 bg-white/80 dark:bg-[#05261e]/85 backdrop-blur-2xl border border-emerald-500/25 dark:border-emerald-300/20 shadow-[0_14px_40px_-14px_rgba(4,120,87,0.32)]">
          {/* Left: Dual Brand Mark */}
          <a
            href="#home"
            onClick={(e) => {
              e.preventDefault();
              navigateTo('home');
            }}
            className="flex items-center gap-2 whitespace-nowrap shrink-0"
          >
            <span className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-display font-extrabold text-sm flex items-center justify-center shadow-sm">
              ন
            </span>
            <span className="font-display text-base sm:text-lg font-extrabold tracking-tight bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 dark:from-emerald-300 dark:via-teal-200 dark:to-sky-300 bg-clip-text text-transparent">
              {isBn ? 'নাগরিক AI · CivicSphere' : 'Nagarik AI · CivicSphere'}
            </span>
          </a>

          {/* Center: Clean Single-Line Nav Links */}
          <nav
            aria-label={isBn ? 'প্রধান নেভিগেশন' : 'Primary Navigation'}
            className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-700 dark:text-emerald-50/90"
          >
            <button
              type="button"
              onClick={() => navigateTo('services')}
              className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                activeView === 'services'
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              {isBn ? 'সেবাসমূহ' : 'Services'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('map')}
              className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                activeView === 'map' || activeView === 'voice'
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              {isBn ? 'মানচিত্র ও বাজেট' : 'Map & Voice'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('doc-reader')}
              className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                activeView === 'doc-reader' || activeView === 'signtalk'
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              {isBn ? 'দলিল পাঠক ও SignTalk' : 'Docs & SignTalk'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('help-network')}
              className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                activeView === 'help-network' || activeView === 'legal' || activeView === 'support'
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              {isBn ? 'আইন ও মানবিক সহায়তা' : 'Rights & Help'}
            </button>
            <button
              type="button"
              onClick={() => navigateTo('transparency')}
              className={`whitespace-nowrap shrink-0 py-1.5 border-b-2 transition-colors ${
                activeView === 'transparency' || activeView === 'emergency'
                  ? 'border-emerald-500 text-emerald-700 dark:text-emerald-300'
                  : 'border-transparent hover:text-emerald-600 dark:hover:text-emerald-300'
              }`}
            >
              {isBn ? 'স্বচ্ছতা ও জরুরি SOS' : 'Transparency & SOS'}
            </button>
          </nav>

          {/* Right: Crisp Pill Controls (Language + Sign In + My Dashboard) */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setLanguage(language === 'en' ? 'bn' : 'en')}
              className="px-3 py-1.5 text-xs font-bold font-bengali rounded-full border border-emerald-500/30 bg-white/75 dark:bg-white/10 text-slate-800 dark:text-emerald-100 hover:border-emerald-400 transition-colors whitespace-nowrap"
            >
              {language === 'en' ? 'বাংলা' : 'EN'}
            </button>

            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold rounded-full border border-emerald-500/40 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-800 dark:text-emerald-100 transition-colors whitespace-nowrap shrink-0"
            >
              {user.isGuest ? (
                <>
                  <LogIn className="w-3.5 h-3.5" />
                  {isBn ? 'সাইন ইন' : 'Sign In'}
                </>
              ) : (
                <>
                  <UserCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300" />
                  <span className="max-w-[90px] truncate">{user.name.split(' ')[0]}</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => navigateTo('dashboard')}
              className="px-4 py-2 text-xs font-extrabold rounded-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 dark:from-emerald-300 dark:to-teal-200 text-white dark:text-slate-950 shadow-sm transition-all whitespace-nowrap shrink-0"
            >
              {isBn ? 'আমার ড্যাশবোর্ড' : 'My Dashboard'}
            </button>
          </div>
        </header>
      </div>

      {/* Secondary Floating Glass Workspace Dock */}
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 pt-3 flex flex-wrap items-center justify-between gap-2.5">
        <div className="glass-panel rounded-2xl p-1 flex items-center gap-1 overflow-x-auto max-w-full">
          {WORKSPACE_TABS.map((wt) => (
            <button
              key={wt.id}
              type="button"
              onClick={() => navigateTo(wt.id)}
              className={`px-3 py-1.5 text-xs font-medium rounded-xl whitespace-nowrap shrink-0 transition-all ${
                activeView === wt.id
                  ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950 font-semibold shadow-sm'
                  : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-white/10'
              }`}
            >
              {isBn ? wt.bn : wt.en}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => navigateTo('emergency')}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-sm whitespace-nowrap"
          >
            <Siren className="w-3.5 h-3.5" />
            {isBn ? 'জরুরি ৯৯৯' : 'SOS 999'}
          </button>
          <button
            type="button"
            onClick={toggleTheme}
            aria-label="Toggle Light Glass or Dark Glass theme"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl glass-panel text-slate-800 dark:text-slate-100 hover:border-emerald-500 transition-colors whitespace-nowrap"
          >
            {theme === 'light' ? (
              <Moon className="w-3.5 h-3.5 text-sky-700" />
            ) : (
              <Sun className="w-3.5 h-3.5 text-emerald-300" />
            )}
            {theme === 'light'
              ? isBn
                ? 'ডার্ক গ্লাস'
                : 'Dark Glass'
              : isBn
                ? 'লাইট গ্লাস'
                : 'Light Glass'}
          </button>
        </div>
      </div>

      {/* Main Content Container */}
      <main
        ref={mainRef}
        className="flex-1 max-w-[1400px] w-full mx-auto px-4 sm:px-6 py-5 space-y-10"
      >
        {/* =============================================================== */}
        {/* HOMEPAGE                                                        */}
        {/* =============================================================== */}
        {activeView === 'home' && (
          <>
            {/* 2. Emerald-Sapphire Liquid Glass Hero Showcase */}
            <section className="civic-hero-banner relative rounded-3xl overflow-hidden text-white">
              <div
                aria-hidden="true"
                className="civic-grid-pattern absolute inset-0 opacity-60 pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="gsap-float-slow absolute -top-20 -right-16 w-80 h-80 rounded-full bg-emerald-300/20 blur-3xl pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="gsap-float-slow absolute -bottom-24 left-1/4 w-96 h-96 rounded-full bg-sky-300/20 blur-3xl pointer-events-none"
              />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-stretch gap-6 p-6 sm:p-10">
                {/* Left Column */}
                <div className="lg:col-span-7 flex flex-col justify-between gap-7">
                  <div className="space-y-4">
                    <div className="gsap-hero-item inline-flex items-center gap-2 text-xs font-medium text-emerald-100">
                      <span>{isBn ? 'নাগরিক প্রথম' : 'Nagarik AI · Citizen First'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{isBn ? 'প্রতিটি কণ্ঠস্বর গুরুত্বপূর্ণ' : 'Every Voice Matters'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{isBn ? '৬৪ জেলা ডিজিটাল ইকোসিস্টেম' : '64-District Public Ecosystem'}</span>
                    </div>

                    <h1 className="gsap-hero-item font-display text-4xl sm:text-5xl lg:text-[3.35rem] font-bold tracking-tight text-white leading-[1.06] max-w-2xl">
                      {isBn
                        ? 'আপনার অধিকার। আপনার সেবা। আপনার কণ্ঠ।'
                        : 'Your Rights. Your Services. Your Voice.'}
                    </h1>

                    <p className="gsap-hero-item text-base sm:text-lg text-emerald-50/90 max-w-xl leading-relaxed">
                      {isBn
                        ? 'সরকারি সেবা, মানচিত্রে সমস্যা রিপোর্ট, AI দলিল পাঠক, অংশগ্রহণমূলক বাজেট, SignTalk বাংলা ইশারা ভাষা ও জরুরি SOS—সবকিছু এক প্ল্যাটফর্মে।'
                        : 'One intelligent platform for government services, live Google Map problem reporting, AI Bangla document reading, participatory budgeting, SignTalk BdSL, Braille, and Follow-the-Money audits.'}
                    </p>
                  </div>

                  {/* Signature Pill-Trailing CTA Group */}
                  <div className="gsap-hero-item flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() =>
                        openSphereWithPrompt(
                          isBn
                            ? 'জাতীয় পরিচয়পত্র (NID) বা জন্ম নিবন্ধনের জন্য কীভাবে আবেদন করব?'
                            : 'How can I apply for a National ID or Birth Certificate?',
                        )
                      }
                      className="group inline-flex items-center gap-3 pl-5 pr-2 py-2 text-sm font-semibold bg-slate-950/90 hover:bg-slate-950 text-white rounded-full shadow-lg transition-all active:scale-95"
                    >
                      <span className="inline-flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-emerald-300" />
                        {isBn ? 'নাগরিক AI-কে জিজ্ঞাসা করুন' : 'Ask Sphere AI'}
                      </span>
                      <span className="w-8 h-8 rounded-full bg-emerald-300 text-slate-950 flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                        <Plus className="w-4 h-4" />
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('doc-reader')}
                      className="inline-flex items-center gap-2 px-5 py-3 text-sm font-semibold bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white rounded-full transition-all"
                    >
                      <FileSearch className="w-4 h-4 text-emerald-200" />
                      {isBn ? 'AI দলিল পাঠক' : 'AI Document Reader'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setOnboardingOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-emerald-100 hover:text-white transition-colors"
                    >
                      {isBn ? `ব্যক্তিগতকরণ (${user.district})` : `Personalize (${user.district})`}{' '}
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* National Metrics Row */}
                  <div className="gsap-hero-item grid grid-cols-3 gap-4 pt-4 border-t border-white/15 max-w-xl">
                    <div>
                      <div
                        data-gsap-count="64"
                        className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums"
                      >
                        64
                      </div>
                      <div className="text-xs text-emerald-100/85 mt-0.5">
                        {isBn ? 'জেলা ও মানচিত্র পিন' : 'Districts Covered'}
                      </div>
                    </div>
                    <div>
                      <div
                        data-gsap-count="999"
                        className="font-display text-2xl sm:text-3xl font-bold text-white tabular-nums"
                      >
                        999
                      </div>
                      <div className="text-xs text-emerald-100/85 mt-0.5">
                        {isBn ? 'জরুরি SOS ও হেল্পলাইন' : 'Emergency SOS & 333'}
                      </div>
                    </div>
                    <div>
                      <div className="font-display text-2xl sm:text-3xl font-bold text-emerald-200 tabular-nums">
                        24/7
                      </div>
                      <div className="text-xs text-emerald-100/85 mt-0.5">
                        {isBn ? 'AI, SignTalk ও ব্রেইল' : 'AI, SignTalk & Braille'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column: Interactive Civic Launch Cards + Visual */}
                <div className="lg:col-span-5 flex flex-col justify-between gap-3">
                  <div className="gsap-hero-visual grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => navigateTo('map')}
                      className="civic-card-hover p-2.5 rounded-2xl bg-white/12 hover:bg-white/22 backdrop-blur-md border border-white/25 text-left"
                    >
                      <Compass className="w-4 h-4 text-sky-200 mb-1" />
                      <div className="text-xs font-semibold text-white truncate">
                        {isBn ? 'মানচিত্রে সমস্যা রিপোর্ট' : 'Report Map Issue'}
                      </div>
                      <div className="text-[11px] text-emerald-100/80 truncate">
                        {isBn ? 'গুগল ম্যাপ ও ৬৪ জেলা' : 'Google Maps Live'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('signtalk')}
                      className="civic-card-hover p-2.5 rounded-2xl bg-white/12 hover:bg-white/22 backdrop-blur-md border border-white/25 text-left"
                    >
                      <Hand className="w-4 h-4 text-emerald-200 mb-1" />
                      <div className="text-xs font-semibold text-white truncate">SignTalk 3D</div>
                      <div className="text-[11px] text-emerald-100/80 truncate">
                        {isBn ? 'বাংলা ইশারা স্টুডিও' : 'BdSL Interpreter'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('help-network')}
                      className="civic-card-hover p-2.5 rounded-2xl bg-white/12 hover:bg-white/22 backdrop-blur-md border border-white/25 text-left"
                    >
                      <HeartHandshake className="w-4 h-4 text-emerald-200 mb-1" />
                      <div className="text-xs font-semibold text-white truncate">
                        {isBn ? 'মানবিক সহায়তা' : 'Human Help Net'}
                      </div>
                      <div className="text-[11px] text-emerald-100/80 truncate">
                        {isBn ? 'দোভাষী, আইনজীবী ও দল' : 'Volunteers & Legal'}
                      </div>
                    </button>

                    <button
                      type="button"
                      onClick={() => navigateTo('emergency')}
                      className="civic-card-hover p-2.5 rounded-2xl bg-rose-500/25 hover:bg-rose-500/40 backdrop-blur-md border border-rose-300/40 text-left"
                    >
                      <Siren className="w-4 h-4 text-rose-200 mb-1" />
                      <div className="text-xs font-semibold text-white truncate">
                        {isBn ? 'জরুরি SOS ৯৯৯' : 'Emergency SOS'}
                      </div>
                      <div className="text-[11px] text-rose-100/90 truncate">
                        {isBn ? 'হাসপাতাল ও পুলিশ' : 'Hospitals & Police'}
                      </div>
                    </button>
                  </div>

                  {/* Hero Visual Card */}
                  <div className="gsap-hero-visual flex-1 min-h-[210px] relative rounded-2xl overflow-hidden border border-white/25 shadow-2xl bg-slate-900">
                    <img
                      src="/src/assets/images/hero_dhaka_civic_1794946111897.jpg"
                      alt="Modern civic architecture and green boulevard in Dhaka, Bangladesh"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/85 via-slate-950/25 to-transparent flex items-end p-5">
                      <div className="text-xs text-slate-100 space-y-1">
                        <div className="font-semibold text-emerald-200">
                          {isBn
                            ? '৮ বিভাগ · ৬৪ জেলা · গুগল ম্যাপ · SignTalk · ব্রেইল · Follow the Money'
                            : '8 Divisions · 64 Districts · Google Maps · SignTalk · Braille · Follow the Money'}
                        </div>
                        <div className="text-slate-200/90 leading-relaxed">
                          {isBn
                            ? 'নাগরিক-বান্ধব স্বচ্ছ সেবা এবং যাচাইকৃত সরকারি পোর্টাল দিকনির্দেশনা।'
                            : 'Citizen-first transparency tools clearly paired with verified official Bangladesh portals.'}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* 3. Universal Search & Sphere AI */}
            <section aria-label="Universal Search and Sphere AI" className="gsap-reveal space-y-3">
              <UniversalSearchBar />
            </section>

            {/* 4. Quick Government Services */}
            {!accessibility.autismSimplified && (
              <div className="gsap-reveal">
                <GovernmentServicesSection compact />
              </div>
            )}

            {/* 5. Interactive Google Map & Problem Reporting + 64 Districts */}
            <div className="gsap-reveal">
              <BangladeshMapSection compact />
            </div>

            {/* 6. Citizen Voice, Participatory Budgeting & Public Voting */}
            <div className="gsap-reveal">
              <CitizenVoiceSection compact />
            </div>

            {/* 7. Live Community Events */}
            {!accessibility.autismSimplified && (
              <div className="gsap-reveal">
                <CommunityEventsSection compact />
              </div>
            )}

            {/* 8. Accessibility, AI Doc Reader & Human Help Showcase */}
            <section className="gsap-reveal glass-panel rounded-2xl p-6 space-y-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isBn
                      ? 'সবার জন্য প্রবেশগম্যতা — SignTalk, ব্রেইল, AI দলিল পাঠক ও মানবিক সহায়তা'
                      : 'Accessibility, AI Document Reader & Human Support Ecosystem'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
                    {isBn
                      ? 'দৃষ্টিপ্রতিবন্ধী, বধির, বাকপ্রতিবন্ধী, প্রবীণ ও নিউরোডাইভার্স নাগরিকদের জন্য নির্মিত।'
                      : 'Built for blind citizens, deaf BdSL signers, people with paralysis, elderly residents, and neurodivergent citizens.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('accessibility')}
                  className="px-4 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl transition-all"
                >
                  <Accessibility className="w-3.5 h-3.5 inline mr-1" />
                  {isBn ? 'অ্যাক্সেসিবিলিটি কেন্দ্র খুলুন' : 'Open Accessibility Center'}
                </button>
              </div>

              <div className="gsap-stagger-grid grid grid-cols-1 md:grid-cols-4 gap-4">
                <button
                  type="button"
                  onClick={() => navigateTo('signtalk')}
                  className="civic-card-hover p-5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-emerald-500/15 text-left hover:border-emerald-500 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 flex items-center justify-center">
                    <Hand className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBn ? 'SignTalk (বাংলা ইশারা স্টুডিও)' : 'SignTalk (BdSL Studio)'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isBn
                      ? 'ক্যামেরা ইশারা শনাক্তকরণ এবং ডাক্তার, আইনজীবী ও সরকারি কলের জন্য ৩ডি ইশারা মডেল।'
                      : 'Camera sign recognition to Bangla text & voice, plus 3D AI human interpreter for hospital & legal calls.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('doc-reader')}
                  className="civic-card-hover p-5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-emerald-500/15 text-left hover:border-sky-500 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300 flex items-center justify-center">
                    <FileSearch className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBn ? 'AI দলিল ও নোটিশ পাঠক' : 'AI Document Reader'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isBn
                      ? 'সরকারি বিজ্ঞপ্তি, এনআইডি চিঠি বা আইনি ফর্ম আপলোড করুন — সহজ বাংলায় ব্যাখ্যা ও চেকলিস্ট পান।'
                      : 'Upload a government notice, NID form, or legal circular for plain Bangla explanation & action checklists.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('accessibility')}
                  className="civic-card-hover p-5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-emerald-500/15 text-left hover:border-violet-500 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300 flex items-center justify-center">
                    <Keyboard className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBn ? 'বাংলা ব্রেইল ও আই-গেজ' : 'Bangla Braille & Eye-Gaze'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isBn
                      ? 'ভারতী বাংলা ব্রেইল কনভার্টার, ৬-ডট প্যাড এবং প্যারালাইসিস নাগরিকদের জন্য আই-গেজ কীবোর্ড।'
                      : 'Bharati Bangla & English Braille converter plus dwell-to-select Eye-Gaze keyboard.'}
                  </p>
                </button>

                <button
                  type="button"
                  onClick={() => navigateTo('help-network')}
                  className="civic-card-hover p-5 rounded-2xl bg-white/85 dark:bg-slate-900/70 border border-slate-200/80 dark:border-emerald-500/15 text-left hover:border-amber-500 space-y-3"
                >
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 flex items-center justify-center">
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {isBn ? 'মানবিক সহায়তা নেটওয়ার্ক' : 'Human Help Network'}
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {isBn
                      ? 'প্রশিক্ষিত স্বেচ্ছাসেবক, ইশারা দোভাষী, আইনজীবী এবং নারী ও প্রবীণ সহায়তা সংস্থার সাথে যুক্ত হোন।'
                      : 'Connect directly with trained volunteers, BdSL interpreters, pro-bono lawyers, and community groups.'}
                  </p>
                </button>
              </div>
            </section>

            {/* 9. Legal Help and Citizen Rights */}
            <div className="gsap-reveal">
              <LegalHelpSection compact />
            </div>

            {/* 10 & 11. Follow the Money & Municipality Transparency */}
            <div className="gsap-reveal">
              <TransparencySection compact />
            </div>

            {/* 12. Latest Civic News & Fact-Checking */}
            {!accessibility.autismSimplified && (
              <div className="gsap-reveal">
                <NewsFactCheckSection compact />
              </div>
            )}

            {/* 13. Community Initiatives Spotlight */}
            <section className="gsap-reveal glass-panel rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                    {isBn ? 'কমিউনিটি উদ্যোগসমূহ' : 'Community Initiatives'}
                  </h2>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'এলাকাবাসীর প্রস্তাব থেকে পৌর পরিষদের কার্যক্রমে রূপান্তর।'
                      : 'Citizen-led proposals moving from neighborhood feedback to council action.'}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => navigateTo('voice')}
                  className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl"
                >
                  {isBn ? 'নতুন উদ্যোগ চালু করুন' : 'Start an Initiative'}
                </button>
              </div>
              <div className="gsap-stagger-grid grid grid-cols-1 md:grid-cols-2 gap-4">
                {initiatives.slice(0, 2).map((initItem) => {
                  const pct = Math.min(
                    100,
                    Math.round((initItem.supporters / initItem.targetSupporters) * 100),
                  );
                  return (
                    <div
                      key={initItem.id}
                      className="civic-card-hover p-4 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/15 space-y-2.5 text-xs"
                    >
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {initItem.category} · {initItem.location} · {initItem.progressStatus}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        {initItem.title}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-300">{initItem.solution}</p>
                      <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="gsap-bar-fill h-full civic-gradient-bar rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-mono tabular-nums">
                          {initItem.supporters} / {initItem.targetSupporters} {isBn ? 'সমর্থক' : 'supporters'}
                        </span>
                        <button
                          type="button"
                          onClick={() => supportInitiative(initItem.id)}
                          className="px-3 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                        >
                          {isBn ? 'সমর্থন দিন' : 'Support'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* 14. Civic Contribution Leaderboard */}
            <div className="gsap-reveal">
              <RewardsAndLeaderboardSection compact />
            </div>
          </>
        )}

        {/* =============================================================== */}
        {/* DEDICATED FULL WORKSPACES                                       */}
        {/* =============================================================== */}
        {activeView === 'sphere-ai' && <SphereAiPanel embedded />}
        {activeView === 'doc-reader' && <AiDocumentReaderSection />}
        {activeView === 'signtalk' && <SignTalkStudio />}
        {activeView === 'accessibility' && <AccessibilityCenter />}
        {activeView === 'services' && <GovernmentServicesSection />}
        {activeView === 'map' && <BangladeshMapSection />}
        {activeView === 'voice' && <CitizenVoiceSection />}
        {activeView === 'events' && <CommunityEventsSection />}
        {activeView === 'legal' && <LegalHelpSection />}
        {activeView === 'help-network' && <HumanHelpNetworkSection />}
        {activeView === 'support' && <SupportAndInclusionSection initialTab="women" />}
        {activeView === 'disability' && <SupportAndInclusionSection initialTab="disability" />}
        {activeView === 'transparency' && <TransparencySection />}
        {activeView === 'emergency' && <EmergencyAssistanceSection />}
        {activeView === 'news' && <NewsFactCheckSection />}
        {activeView === 'rewards' && <RewardsAndLeaderboardSection />}
        {activeView === 'dashboard' && <CitizenDashboardView />}
        {activeView === 'admin' && <AdminConsoleView />}
      </main>

      {/* 15. Quiet Civic Footer */}
      <footer className="mt-12 border-t border-slate-200/80 dark:border-emerald-500/15 glass-panel border-x-0 border-b-0">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 py-8 grid grid-cols-1 md:grid-cols-4 gap-6 text-xs">
          <div className="space-y-2">
            <div className="font-display text-base font-bold bg-gradient-to-r from-emerald-700 to-sky-700 dark:from-emerald-300 dark:to-sky-300 bg-clip-text text-transparent">
              {isBn ? 'নাগরিক AI · CivicSphere AI' : 'Nagarik AI · CivicSphere AI'}
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              {isBn
                ? 'আপনার অধিকার। আপনার সেবা। আপনার কণ্ঠ। বাংলাদেশের ৬৪ জেলার অন্তর্ভুক্তিমূলক ডিজিটাল নাগরিক প্ল্যাটফর্ম।'
                : 'Your Rights. Your Services. Your Voice. Inclusive digital civic infrastructure for all 64 districts of Bangladesh.'}
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">
              {isBn ? 'যাচাইকৃত জাতীয় হেল্পলাইন' : 'Verified National Helplines'}
            </div>
            <p className="text-slate-600 dark:text-slate-300 font-mono">
              999 Emergency · 333 National Info
            </p>
            <p className="text-slate-600 dark:text-slate-300 font-mono">
              109 Women &amp; Child · 1098 Child Line
            </p>
            <p className="text-slate-600 dark:text-slate-300 font-mono">
              16430 Legal Aid · 106 ACC · 16263 Health
            </p>
          </div>

          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">
              {isBn ? 'নতুন নাগরিক সেবাসমূহ' : 'Core Civic Tools'}
            </div>
            <div className="flex flex-col items-start gap-1 text-slate-600 dark:text-slate-300">
              <button type="button" onClick={() => navigateTo('doc-reader')} className="hover:underline">
                {isBn ? 'AI দলিল ও নোটিশ পাঠক' : 'AI Document Reader'}
              </button>
              <button type="button" onClick={() => navigateTo('help-network')} className="hover:underline">
                {isBn ? 'মানবিক সহায়তা নেটওয়ার্ক' : 'Human Help Network'}
              </button>
              <button type="button" onClick={() => navigateTo('emergency')} className="hover:underline">
                {isBn ? 'জরুরি SOS ও নিকটস্থ হাসপাতাল' : 'Citizen Emergency SOS'}
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="font-semibold text-slate-900 dark:text-white">
              {isBn ? 'অ্যাকাউন্ট ও স্বচ্ছতা' : 'Dashboard & Governance'}
            </div>
            <div className="flex flex-col items-start gap-1 text-slate-600 dark:text-slate-300">
              <button type="button" onClick={() => navigateTo('dashboard')} className="hover:underline">
                {isBn ? 'আমার নাগরিক ড্যাশবোর্ড' : 'My Citizen Dashboard'}
              </button>
              <button type="button" onClick={() => navigateTo('transparency')} className="hover:underline">
                {isBn ? 'অর্থ প্রবাহ অনুসরণ (Follow the Money)' : 'Follow the Money & Audit'}
              </button>
              <button type="button" onClick={() => navigateTo('support')} className="hover:underline">
                {isBn ? 'নারী, প্রবীণ ও শিশু সুরক্ষা' : 'Women, Elderly & Children Support'}
              </button>
            </div>
          </div>
        </div>
      </footer>

      <FloatingCivicTools />
    </div>
  );
}

export default function App() {
  return (
    <CivicProvider>
      <CivicSphereShell />
    </CivicProvider>
  );
}
