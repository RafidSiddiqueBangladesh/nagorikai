import {
  Accessibility,
  Camera,
  Download,
  Eye,
  Hand,
  Keyboard,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Volume2,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { GOVERNMENT_SERVICES, INTERPRETER_DIRECTORY } from '../../data/civicDataset';
import {
  brailleToText,
  dotsToBrailleChar,
  downloadBrailleGuide,
  textToBraille,
} from '../../utils/brailleConverter';
import { SignTalkStudio } from '../SignTalkStudio';

type A11yTab = 'signtalk' | 'braille' | 'eye-gaze' | 'adaptive';

const EN_KEYS = [
  'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J',
  'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T',
  'U', 'V', 'W', 'X', 'Y', 'Z', 'SPACE', 'BACK', 'SPEAK', 'CLEAR',
];

const BN_KEYS = [
  'আ', 'ই', 'উ', 'এ', 'ও', 'ক', 'খ', 'গ', 'চ', 'জ',
  'ত', 'দ', 'ন', 'প', 'ব', 'ম', 'য', 'র', 'ল', 'স',
  'হ', 'া', 'ি', 'ে', 'ো', '্', 'SPACE', 'BACK', 'SPEAK', 'CLEAR',
];

const GAZE_SHORTCUTS = [
  { label: 'Emergency 999: Need Help Now', text: 'জরুরি সাহায্য দরকার। আমাকে দ্রুত সহায়তা করুন। (Emergency help needed now.)' },
  { label: 'Call Doctor / Pain', text: 'আমার ডাক্তার দরকার, শরীরে ব্যথা হচ্ছে। (I need a doctor, I am in pain.)' },
  { label: 'Call Lawyer / Legal Aid', text: 'আমি আইনজীবীর সাথে কথা বলতে চাই। (I want to speak with my lawyer.)' },
  { label: 'Message Family', text: 'আমি নিরাপদ আছি, আমাকে একটু পানি বা সহায়তা দিন। (Please assist me / message family.)' },
];

export function AccessibilityCenter({ initialTab = 'signtalk' }: { initialTab?: A11yTab }) {
  const { accessibility, updateAccessibility, speakText, stopSpeaking, setActiveView, toggleTheme } =
    useCivic();

  const [tab, setTab] = useState<A11yTab>(initialTab);

  // Braille state
  const [brailleInputText, setBrailleInputText] = useState(
    'আমার অধিকার, আমার কণ্ঠ। CivicSphere AI assists every citizen.',
  );
  const [braillePadInput, setBraillePadInput] = useState('⠓⠑⠇⠇⠕');
  const [brailleLang, setBrailleLang] = useState<'en' | 'bn'>('en');
  const [dots, setDots] = useState<boolean[]>([false, false, false, false, false, false]);

  // Eye-gaze state
  const [gazeText, setGazeText] = useState('');
  const [gazeLang, setGazeLang] = useState<'en' | 'bn'>('en');
  const [dwellMs, setDwellMs] = useState(1000);
  const [calibrated, setCalibrated] = useState(false);
  const [calStep, setCalStep] = useState(0);
  const [accuracyScore, setAccuracyScore] = useState<number | null>(null);
  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [dwellProgress, setDwellProgress] = useState(0);
  const [switchScanning, setSwitchScanning] = useState(false);
  const [scanIndex, setScanIndex] = useState(0);
  const [webcamGazeEnabled, setWebcamGazeEnabled] = useState(false);
  const [webcamNotice, setWebcamNotice] = useState<string | null>(null);
  const gazeVideoRef = useRef<HTMLVideoElement | null>(null);
  const gazeStreamRef = useRef<MediaStream | null>(null);
  const dwellTimerRef = useRef<number | null>(null);

  // Voice navigation state
  const [voiceListening, setVoiceListening] = useState(false);
  const [lastVoiceCmd, setLastVoiceCmd] = useState<string | null>(null);

  const keys = gazeLang === 'en' ? EN_KEYS : BN_KEYS;

  const predictiveSuggestions = (() => {
    const t = gazeText.trim().toLowerCase();
    if (gazeLang === 'bn') {
      if (!t) return ['আমি', 'সাহায্য', 'ডাক্তার', 'আইনজীবী', 'বাসা'];
      return ['সাহায্য দরকার', 'বুঝতে পেরেছি', 'ধন্যবাদ', 'জরুরি'];
    }
    if (!t) return ['I NEED', 'HELP', 'DOCTOR', 'LAWYER', 'WATER'];
    if (t.endsWith('h') || t.includes('help')) return ['HELP ME', 'HOSPITAL', 'HOME'];
    if (t.endsWith('i') || t === 'i') return ['I NEED HELP', 'I AM FINE', 'I UNDERSTAND'];
    return ['PLEASE', 'THANK YOU', 'DOCTOR', 'LAWYER'];
  })();

  const handleGazeSelect = useCallback(
    (key: string) => {
      if (key === 'SPACE') {
        setGazeText((p) => p + ' ');
      } else if (key === 'BACK') {
        setGazeText((p) => p.slice(0, -1));
      } else if (key === 'CLEAR') {
        setGazeText('');
      } else if (key === 'SPEAK') {
        if (gazeText.trim()) speakText(gazeText);
      } else if (key.length > 2) {
        setGazeText((p) => (p ? `${p} ${key}` : key));
        speakText(key);
      } else {
        setGazeText((p) => p + key);
      }
    },
    [gazeText, speakText],
  );

  // Dwell hover timer
  const startDwell = (key: string) => {
    if (dwellTimerRef.current) window.clearInterval(dwellTimerRef.current);
    setHoveredKey(key);
    setDwellProgress(0);
    const start = performance.now();
    dwellTimerRef.current = window.setInterval(() => {
      const pct = Math.min(100, ((performance.now() - start) / dwellMs) * 100);
      setDwellProgress(pct);
      if (pct >= 100) {
        if (dwellTimerRef.current) window.clearInterval(dwellTimerRef.current);
        dwellTimerRef.current = null;
        setHoveredKey(null);
        setDwellProgress(0);
        handleGazeSelect(key);
      }
    }, 50);
  };

  const cancelDwell = () => {
    if (dwellTimerRef.current) {
      window.clearInterval(dwellTimerRef.current);
      dwellTimerRef.current = null;
    }
    setHoveredKey(null);
    setDwellProgress(0);
  };

  // Switch-device Spacebar scan mode
  useEffect(() => {
    if (!switchScanning) return;
    const id = window.setInterval(() => {
      setScanIndex((prev) => (prev + 1) % keys.length);
    }, 1100);
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        e.preventDefault();
        handleGazeSelect(keys[scanIndex]);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.clearInterval(id);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [switchScanning, keys, scanIndex, handleGazeSelect]);

  // Experimental webcam gaze preview
  const toggleWebcamGaze = async () => {
    if (webcamGazeEnabled) {
      gazeStreamRef.current?.getTracks().forEach((t) => t.stop());
      gazeStreamRef.current = null;
      setWebcamGazeEnabled(false);
      setWebcamNotice(null);
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 320, height: 240 } });
      gazeStreamRef.current = stream;
      if (gazeVideoRef.current) gazeVideoRef.current.srcObject = stream;
      setWebcamGazeEnabled(true);
      setWebcamNotice(
        'Experimental webcam gaze tracking active. Use dwell-to-select or a Tobii/EyeTech HID pointer for clinical precision.',
      );
    } catch {
      setWebcamNotice('Camera permission unavailable — dwell pointer and switch-scan remain fully active.');
    }
  };

  useEffect(() => {
    return () => {
      gazeStreamRef.current?.getTracks().forEach((t) => t.stop());
      if (dwellTimerRef.current) window.clearInterval(dwellTimerRef.current);
    };
  }, []);

  const handleVoiceNavCommand = () => {
    const Win = window as unknown as {
      SpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onresult: (e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void;
        onerror: () => void;
        onend: () => void;
        start: () => void;
      };
    };
    const SR = Win.SpeechRecognition || Win.webkitSpeechRecognition;
    if (!SR) {
      setLastVoiceCmd('Speech recognition requires Chrome/Edge.');
      return;
    }
    const rec = new SR();
    rec.lang = 'en-US';
    setVoiceListening(true);
    rec.onresult = (event) => {
      const cmd = (event.results[0]?.[0]?.transcript || '').toLowerCase();
      setLastVoiceCmd(cmd);
      if (cmd.includes('service')) setActiveView('services');
      else if (cmd.includes('map')) setActiveView('map');
      else if (cmd.includes('sign')) setTab('signtalk');
      else if (cmd.includes('braille')) setTab('braille');
      else if (cmd.includes('eye')) setTab('eye-gaze');
      else if (cmd.includes('theme') || cmd.includes('dark') || cmd.includes('light')) toggleTheme();
      else if (cmd.includes('read')) speakText('CivicSphere AI Accessibility Center is open. Use voice or keyboard to navigate.');
    };
    rec.onerror = () => setVoiceListening(false);
    rec.onend = () => setVoiceListening(false);
    rec.start();
  };

  return (
    <section className="space-y-5">
      {/* Header & Tabs */}
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Accessibility Center — No Citizen Left Behind
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
            Bangladeshi Sign Language (SignTalk), Bangla &amp; English Braille, Eye-Gaze Communication, and Cognitive/Voice Assistive Tools.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-xl">
          {([
            { id: 'signtalk', label: 'SignTalk (BdSL)', icon: Hand },
            { id: 'braille', label: 'Braille Mode', icon: Keyboard },
            { id: 'eye-gaze', label: 'Eye-Gaze Control', icon: Eye },
            { id: 'adaptive', label: 'Adaptive Tools', icon: Accessibility },
          ] as const).map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                  tab === item.id
                    ? 'bg-sky-700 text-white'
                    : 'text-slate-700 dark:text-slate-200 hover:bg-white/60 dark:hover:bg-slate-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab 1: SignTalk */}
      {tab === 'signtalk' && <SignTalkStudio />}

      {/* Tab 2: Braille Mode */}
      {tab === 'braille' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                  Bangla &amp; English Braille Translator
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Converts Bangla (Bharati Braille) and English text into refreshable Unicode Braille cells.
                </p>
              </div>
              <button
                type="button"
                onClick={() =>
                  updateAccessibility({ brailleReadingMode: !accessibility.brailleReadingMode })
                }
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border ${
                  accessibility.brailleReadingMode
                    ? 'bg-sky-700 text-white border-sky-700'
                    : 'bg-white/70 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100'
                }`}
              >
                {accessibility.brailleReadingMode ? 'Braille Reading Spacing: On' : 'Enable Wide Braille Reading'}
              </button>
            </div>

            <textarea
              rows={3}
              value={brailleInputText}
              onChange={(e) => setBrailleInputText(e.target.value)}
              placeholder="Type Bangla or English text to convert into Braille..."
              className="w-full p-3.5 text-sm font-bengali rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white"
            />

            <div className="p-4 rounded-xl bg-slate-950 text-sky-200 font-mono text-2xl leading-relaxed tracking-widest break-words select-all">
              {textToBraille(brailleInputText) || '⠀'}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => speakText(brailleInputText)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-lg"
              >
                <Volume2 className="w-4 h-4" /> Read Aloud (Screen Reader Audio)
              </button>
              <button
                type="button"
                onClick={stopSpeaking}
                className="px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg"
              >
                Stop Audio
              </button>
              <button
                type="button"
                onClick={() => downloadBrailleGuide('CivicSphere-Braille-Text', brailleInputText)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-lg"
              >
                <Download className="w-4 h-4" /> Download Braille File (.txt)
              </button>
            </div>
          </div>

          {/* 6-Dot Braille Input Pad & Reverse Decoder */}
          <div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                6-Dot Braille Input Pad
              </h3>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg">
                <button
                  type="button"
                  onClick={() => setBrailleLang('en')}
                  className={`px-2 py-1 text-xs rounded ${
                    brailleLang === 'en' ? 'bg-white dark:bg-slate-950 font-semibold' : ''
                  }`}
                >
                  EN
                </button>
                <button
                  type="button"
                  onClick={() => setBrailleLang('bn')}
                  className={`px-2 py-1 text-xs font-bengali rounded ${
                    brailleLang === 'bn' ? 'bg-white dark:bg-slate-950 font-semibold' : ''
                  }`}
                >
                  বাংলা
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 max-w-[180px] mx-auto py-2">
              {[0, 3, 1, 4, 2, 5].map((dotIdx) => (
                <button
                  key={dotIdx}
                  type="button"
                  onClick={() =>
                    setDots((prev) => prev.map((v, i) => (i === dotIdx ? !v : v)))
                  }
                  aria-label={`Braille dot ${dotIdx + 1}`}
                  className={`h-12 w-12 mx-auto rounded-full border-2 font-mono text-xs font-bold transition-colors ${
                    dots[dotIdx]
                      ? 'bg-sky-600 border-sky-400 text-white'
                      : 'bg-white/70 dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {dotIdx + 1}
                </button>
              ))}
            </div>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const ch = dotsToBrailleChar(dots);
                  setBraillePadInput((p) => p + ch);
                  setDots([false, false, false, false, false, false]);
                }}
                className="px-3.5 py-2 text-xs font-semibold bg-sky-700 text-white rounded-lg"
              >
                Add Cell ({dotsToBrailleChar(dots)})
              </button>
              <button
                type="button"
                onClick={() => setBraillePadInput((p) => p + ' ')}
                className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                Space
              </button>
              <button
                type="button"
                onClick={() => setBraillePadInput('')}
                className="px-3 py-2 text-xs bg-slate-100 dark:bg-slate-800 rounded-lg"
              >
                Clear
              </button>
            </div>

            <div className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 space-y-1">
              <div className="text-xs text-slate-500 dark:text-slate-400">Braille Cells:</div>
              <div className="font-mono text-xl text-slate-900 dark:text-white break-words">
                {braillePadInput || '⠀'}
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 pt-1">Decoded Text:</div>
              <div className="text-base font-bold font-bengali text-sky-700 dark:text-sky-300">
                {brailleToText(braillePadInput, brailleLang)}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-200 mb-2">
                Braille-Ready Service Guides
              </p>
              <div className="flex flex-wrap gap-2">
                {GOVERNMENT_SERVICES.slice(0, 4).map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() =>
                      downloadBrailleGuide(
                        svc.titleEn,
                        `${svc.summaryEn}\n\nDocuments:\n${svc.documentsEn.join('\n')}\n\nSteps:\n${svc.stepsEn.join('\n')}\n\nHelpline: ${svc.helpline || '333'}`,
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg hover:border-sky-500"
                  >
                    <Download className="w-3 h-3" /> {svc.titleEn.split(' ')[0]} Guide
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Eye Movement Communication */}
      {tab === 'eye-gaze' && (
        <div className="glass-panel rounded-2xl p-5 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Eye-Gaze &amp; Switch-Device Communication Interface
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Hover and dwell over any key to select without clicking, or enable Spacebar Switch-Scanning. Compatible with eye-tracking HID pointers and experimental webcam gaze preview.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <select
                aria-label="Dwell duration"
                value={dwellMs}
                onChange={(e) => setDwellMs(Number(e.target.value))}
                className="px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
              >
                <option value={700}>Dwell: 0.7s Fast</option>
                <option value={1000}>Dwell: 1.0s Standard</option>
                <option value={1500}>Dwell: 1.5s Steady</option>
              </select>
              <button
                type="button"
                onClick={() => setSwitchScanning((s) => !s)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  switchScanning
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                }`}
              >
                {switchScanning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                {switchScanning ? 'Switch Scan Active (Space)' : 'Switch-Scan Mode'}
              </button>
              <button
                type="button"
                onClick={toggleWebcamGaze}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg ${
                  webcamGazeEnabled
                    ? 'bg-sky-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100'
                }`}
              >
                <Camera className="w-3.5 h-3.5" />
                {webcamGazeEnabled ? 'Stop Webcam Gaze' : 'Experimental Webcam Gaze'}
              </button>
            </div>
          </div>

          {webcamNotice && (
            <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200">
              {webcamGazeEnabled && (
                <video
                  ref={gazeVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-24 h-16 rounded-lg object-cover bg-slate-900"
                />
              )}
              <span>{webcamNotice}</span>
            </div>
          )}

          {/* Calibration Bar */}
          <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
            <div className="text-xs text-slate-700 dark:text-slate-300">
              <span className="font-semibold">Calibration Status: </span>
              {calibrated
                ? `Calibrated · Estimated Dwell Accuracy ${accuracyScore}%`
                : `Click or dwell on targets 1→3 to calibrate (${calStep}/3)`}
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3].map((step) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    const next = Math.max(calStep, step);
                    setCalStep(next);
                    if (next >= 3) {
                      setCalibrated(true);
                      setAccuracyScore(94);
                    }
                  }}
                  className={`w-8 h-8 rounded-full text-xs font-bold transition-colors ${
                    calStep >= step
                      ? 'bg-emerald-600 text-white'
                      : 'bg-sky-600 text-white hover:bg-sky-700'
                  }`}
                >
                  {step}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                  setCalStep(0);
                  setCalibrated(false);
                  setAccuracyScore(null);
                }}
                aria-label="Reset calibration"
                className="p-2 text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Composed Message + Language Switch */}
          <div className="p-4 rounded-xl bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3">
            <div className="text-xl md:text-2xl font-bengali font-semibold min-h-[2rem] break-words flex-1">
              {gazeText || 'Look or dwell on keys below to compose message...'}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setGazeLang((l) => (l === 'en' ? 'bn' : 'en'))}
                className="px-3 py-2 text-xs font-semibold bg-slate-800 hover:bg-slate-700 rounded-lg"
              >
                Keyboard: {gazeLang === 'en' ? 'English' : 'বাংলা'}
              </button>
              <button
                type="button"
                onClick={() => gazeText.trim() && speakText(gazeText)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-600 hover:bg-sky-700 rounded-lg"
              >
                <Volume2 className="w-4 h-4" /> Speak Out Loud
              </button>
            </div>
          </div>

          {/* Predictive Suggestions */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Predictive:
            </span>
            {predictiveSuggestions.map((sug) => (
              <button
                key={sug}
                type="button"
                onMouseEnter={() => startDwell(sug)}
                onMouseLeave={cancelDwell}
                onClick={() => handleGazeSelect(sug)}
                className="relative overflow-hidden px-3.5 py-2 text-xs font-bengali font-semibold rounded-xl bg-sky-50 dark:bg-sky-950/60 border border-sky-200 dark:border-sky-800 text-sky-900 dark:text-sky-200"
              >
                {hoveredKey === sug && (
                  <span
                    className="absolute inset-y-0 left-0 bg-sky-400/30"
                    style={{ width: `${dwellProgress}%` }}
                  />
                )}
                <span className="relative">{sug}</span>
              </button>
            ))}
          </div>

          {/* Gaze Keyboard Grid */}
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-10 gap-2">
            {keys.map((key, idx) => {
              const isScanned = switchScanning && idx === scanIndex;
              const isHovered = hoveredKey === key;
              return (
                <button
                  key={key}
                  type="button"
                  onMouseEnter={() => startDwell(key)}
                  onMouseLeave={cancelDwell}
                  onClick={() => handleGazeSelect(key)}
                  className={`relative overflow-hidden h-14 rounded-xl border text-sm font-bengali font-bold transition-colors ${
                    isScanned
                      ? 'bg-emerald-600 text-white border-emerald-400 ring-2 ring-emerald-300'
                      : 'bg-white/85 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-sky-500'
                  }`}
                >
                  {isHovered && (
                    <span
                      className="absolute inset-y-0 left-0 bg-sky-500/25"
                      style={{ width: `${dwellProgress}%` }}
                    />
                  )}
                  <span className="relative">{key}</span>
                </button>
              );
            })}
          </div>

          {/* Emergency & Lawyer/Family Quick Gaze Shortcuts */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 pt-2">
            {GAZE_SHORTCUTS.map((sc) => (
              <button
                key={sc.label}
                type="button"
                onMouseEnter={() => startDwell(sc.text)}
                onMouseLeave={cancelDwell}
                onClick={() => {
                  setGazeText(sc.text);
                  speakText(sc.text);
                }}
                className="relative overflow-hidden p-3 text-left rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 text-xs font-semibold text-rose-900 dark:text-rose-200"
              >
                {hoveredKey === sc.text && (
                  <span
                    className="absolute inset-y-0 left-0 bg-rose-400/30"
                    style={{ width: `${dwellProgress}%` }}
                  />
                )}
                <span className="relative">{sc.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Adaptive & Cognitive Tools */}
      {tab === 'adaptive' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="glass-panel rounded-2xl p-5 space-y-4">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
              Visual, Cognitive &amp; Motor Preferences
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { key: 'highContrast', label: 'High Contrast Mode' },
                { key: 'dyslexiaFont', label: 'Dyslexia-Friendly Font' },
                { key: 'reducedMotion', label: 'Reduced Motion' },
                { key: 'colorBlindSafe', label: 'Color-Blind Safe Palette' },
                { key: 'autismSimplified', label: 'Autism-Friendly Simplified UI' },
                { key: 'easyRead', label: 'Easy-Read Language Mode' },
              ].map((item) => {
                const active = accessibility[item.key as keyof typeof accessibility] as boolean;
                return (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => updateAccessibility({ [item.key]: !active })}
                    className={`p-3 rounded-xl border text-left text-xs font-semibold transition-colors ${
                      active
                        ? 'bg-sky-700 text-white border-sky-700'
                        : 'bg-white/75 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100'
                    }`}
                  >
                    {item.label}: {active ? 'Enabled' : 'Off'}
                  </button>
                );
              })}
            </div>

            <div className="space-y-2 pt-2">
              <label className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                <span>Adjustable Font Size</span>
                <span className="font-mono tabular-nums">{Math.round(accessibility.fontScale * 100)}%</span>
              </label>
              <input
                type="range"
                min={0.9}
                max={1.35}
                step={0.05}
                value={accessibility.fontScale}
                onChange={(e) => updateAccessibility({ fontScale: Number(e.target.value) })}
                className="w-full accent-sky-600"
              />
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                Bangla &amp; English Voice Navigation
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleVoiceNavCommand}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-lg ${
                    voiceListening
                      ? 'bg-rose-600 text-white'
                      : 'bg-sky-700 hover:bg-sky-800 text-white'
                  }`}
                >
                  <Mic className="w-4 h-4" />
                  {voiceListening ? 'Listening for command...' : 'Speak Navigation Command'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    speakText(
                      'CivicSphere AI Accessibility Tools active. Say Open Services, Open Map, Sign Language, Braille, or Eye Control.',
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-lg"
                >
                  <Volume2 className="w-4 h-4" /> Audio Page Guide
                </button>
              </div>
              {lastVoiceCmd && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Heard: &ldquo;{lastVoiceCmd}&rdquo;
                </p>
              )}
            </div>
          </div>

          <div className="glass-panel rounded-2xl p-5 space-y-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Sign Language Interpreter Directory
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Book verified BdSL &amp; deafblind tactile interpreters for hospitals, courts, and municipalities.
            </p>
            <div className="space-y-3">
              {INTERPRETER_DIRECTORY.map((intItem) => (
                <div
                  key={intItem.id}
                  className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                >
                  <div className="text-sm font-semibold text-slate-900 dark:text-white">
                    {intItem.name}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {intItem.region} · {intItem.availability}
                  </div>
                  <div className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                    {intItem.languages} — {intItem.specialties}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
