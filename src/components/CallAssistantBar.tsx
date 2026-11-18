import {
  Phone,
  PhoneOff,
  Play,
  Scale,
  Square,
  Stethoscope,
  Video,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { SIGN_BY_ID } from '../data/bdslDataset';
import type { BdslSign } from '../types/signtalk';

export type CallMode = 'general' | 'doctor' | 'lawyer' | 'gov' | 'emergency';

interface CallAssistantBarProps {
  callMode: CallMode;
  onChangeCallMode: (mode: CallMode) => void;
  onStartLiveSession: () => void;
  onRunLiveDemo: (mode: CallMode) => void;
  onStopLiveDemo: () => void;
  demoState: {
    active: boolean;
    mode: CallMode;
    turnIndex: number;
    totalTurns: number;
    label: string;
  };
  onCallerSpeak: (bangla: string, english: string, callerLabel: string) => void;
  onSignerQuickReply: (signIds: string[], banglaText: string, englishText: string) => void;
  isTranslating: boolean;
}

const DOCTOR_PROMPTS = [
  {
    label: 'কোথায় ব্যথা হচ্ছে?',
    bangla: 'আপনার কোথায় ব্যথা হচ্ছে?',
    english: 'Where are you feeling pain?',
  },
  {
    label: 'কত দিন ধরে অসুস্থ?',
    bangla: 'আপনি কত দিন ধরে অসুস্থ?',
    english: 'How many days have you been sick?',
  },
  {
    label: 'ওষুধ দিনে ২ বার খাবেন',
    bangla: 'এই ওষুধ দিনে ২ বার খাবেন, ভয় পাবেন না।',
    english: 'Take this medicine 2 times a day, do not worry.',
  },
  {
    label: 'জরুরি হাসপাতালে আসুন',
    bangla: 'এখন জরুরি হাসপাতালে আসুন।',
    english: 'Please come to the hospital urgently now.',
  },
];

const DOCTOR_SIGN_REPLIES = [
  {
    label: 'আমি অসুস্থ / ব্যথা',
    signIds: ['ami', 'osustho_byatha'],
    bangla: 'আমি অসুস্থ, আমার শরীরে ব্যথা হচ্ছে।',
    english: 'I am sick, I have body pain.',
  },
  {
    label: 'সাহায্য ও ওষুধ দরকার',
    signIds: ['shahajjo', 'oshudh'],
    bangla: 'আমার সাহায্য এবং ওষুধ দরকার।',
    english: 'I need help and medicine.',
  },
  {
    label: 'বুঝতে পেরেছি, ধন্যবাদ',
    signIds: ['bujhte_para', 'bhalo'],
    bangla: 'আমি বুঝতে পেরেছি, ভাল আছি।',
    english: 'I understand, thank you.',
  },
];

const LAWYER_PROMPTS = [
  {
    label: 'কী আইনি সাহায্য চান?',
    bangla: 'আপনার কী আইনি সাহায্য প্রয়োজন?',
    english: 'What legal help do you need?',
  },
  {
    label: 'কাগজপত্র সাথে আছে?',
    bangla: 'আপনার কাগজপত্র ও দলিল সাথে আছে?',
    english: 'Do you have your documents and papers with you?',
  },
  {
    label: 'চুক্তি / স্বাক্ষর করুন',
    bangla: 'দয়া করে এই চুক্তি পড়ুন এবং স্বাক্ষর করুন।',
    english: 'Please review this agreement and sign it.',
  },
  {
    label: 'আগামীকাল আদালতে কথা বলব',
    bangla: 'ভয় পাবেন না, আমি আগামীকাল সাহায্য করব।',
    english: 'Do not worry, I will help you tomorrow.',
  },
];

const LAWYER_SIGN_REPLIES = [
  {
    label: 'আইনজীবী ও সাহায্য দরকার',
    signIds: ['ami', 'ainjibi', 'shahajjo'],
    bangla: 'আমার একজন আইনজীবীর সাহায্য দরকার।',
    english: 'I need a lawyer to help me.',
  },
  {
    label: 'কাগজপত্র সাথে আছে',
    signIds: ['amar', 'kagojpotro', 'shathe'],
    bangla: 'আমার কাগজপত্র ও দলিল সাথে আছে।',
    english: 'I have my documents with me.',
  },
  {
    label: 'কখন স্বাক্ষর করব?',
    signIds: ['kokhon', 'chukti_swakkhor'],
    bangla: 'আমি কখন চুক্তিতে স্বাক্ষর করব?',
    english: 'When should I sign the agreement?',
  },
];

const GOV_PROMPTS = [
  {
    label: 'কোন সেবা প্রয়োজন?',
    bangla: 'আপনার কোন সরকারি সেবা বা এনআইডি সাহায্য প্রয়োজন?',
    english: 'Which government or NID service do you need?',
  },
  {
    label: 'কাগজপত্র যাচাই করুন',
    bangla: 'আপনার জন্ম নিবন্ধন ও এনআইডি কাগজপত্র সাথে আছে?',
    english: 'Do you have your birth certificate and NID documents?',
  },
];

const EMERGENCY_PROMPTS = [
  {
    label: 'জরুরি সাহায্য আসছে',
    bangla: 'ভয় পাবেন না, এখন জরুরি সাহায্য আসছে।',
    english: 'Do not worry, emergency help is on the way now.',
  },
  {
    label: 'আপনার অবস্থান কোথায়?',
    bangla: 'আপনি এখন কোথায় আছেন? বাসা বা হাসপাতালের নাম বলুন।',
    english: 'Where are you right now? Tell us your home or hospital.',
  },
];

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function CallAssistantBar({
  callMode,
  onChangeCallMode,
  onStartLiveSession,
  onRunLiveDemo,
  onStopLiveDemo,
  demoState,
  onCallerSpeak,
  onSignerQuickReply,
  isTranslating,
}: CallAssistantBarProps) {
  const [callConnected, setCallConnected] = useState(false);
  const [callSeconds, setCallSeconds] = useState(0);

  useEffect(() => {
    setCallConnected(false);
    setCallSeconds(0);
  }, [callMode]);

  useEffect(() => {
    if (!callConnected) return;
    const id = window.setInterval(() => {
      setCallSeconds((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [callConnected]);

  const handleToggleCall = () => {
    if (callConnected) {
      setCallConnected(false);
      setCallSeconds(0);
    } else {
      setCallConnected(true);
      setCallSeconds(0);
      onStartLiveSession();
      if (callMode === 'doctor') {
        onCallerSpeak(
          'হ্যালো, আমি ডাক্তার বলছি। আপনার কোথায় ব্যথা হচ্ছে?',
          'Hello, this is the doctor speaking. Where are you feeling pain?',
          'Dr. Nusrat Jahan (Hospital Desk)',
        );
      } else if (callMode === 'lawyer') {
        onCallerSpeak(
          'হ্যালো, আমি আইনজীবী বলছি। আপনার কী সাহায্য প্রয়োজন?',
          'Hello, this is your lawyer speaking. How can I help you?',
          'Adv. Rashed Karim (Legal Aid)',
        );
      } else if (callMode === 'gov') {
        onCallerSpeak(
          'হ্যালো, নাগরিক সেবা কেন্দ্র। আপনার কোন সরকারি সেবা প্রয়োজন?',
          'Hello, Citizen Service Desk. Which government service do you need?',
          'Municipal Helpdesk Officer',
        );
      } else if (callMode === 'emergency') {
        onCallerSpeak(
          'জরুরি সহায়তা কেন্দ্র ৯৯৯। আপনার কী সাহায্য প্রয়োজন?',
          'Emergency 999 Desk. What urgent help do you need?',
          'Emergency 999 Operator',
        );
      }
    }
  };

  const activePrompts =
    callMode === 'doctor'
      ? DOCTOR_PROMPTS
      : callMode === 'lawyer'
        ? LAWYER_PROMPTS
        : callMode === 'gov'
          ? GOV_PROMPTS
          : EMERGENCY_PROMPTS;

  const activeSignReplies =
    callMode === 'lawyer' ? LAWYER_SIGN_REPLIES : DOCTOR_SIGN_REPLIES;

  return (
    <div className="bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-2.5 space-y-2.5 shrink-0">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg overflow-x-auto">
            <button
              type="button"
              onClick={() => onChangeCallMode('general')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                callMode === 'general'
                  ? 'bg-white dark:bg-slate-950 text-slate-900 dark:text-white shadow-xs font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              General
            </button>
            <button
              type="button"
              onClick={() => onChangeCallMode('doctor')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                callMode === 'doctor'
                  ? 'bg-emerald-700 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Stethoscope className="w-3.5 h-3.5" />
              Hospital
            </button>
            <button
              type="button"
              onClick={() => onChangeCallMode('lawyer')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                callMode === 'lawyer'
                  ? 'bg-indigo-700 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              Lawyer
            </button>
            <button
              type="button"
              onClick={() => onChangeCallMode('gov')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                callMode === 'gov'
                  ? 'bg-sky-700 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Gov Office
            </button>
            <button
              type="button"
              onClick={() => onChangeCallMode('emergency')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                callMode === 'emergency'
                  ? 'bg-rose-700 text-white font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
              }`}
            >
              Emergency 999
            </button>
          </div>

          {callMode !== 'general' && callConnected && (
            <span className="font-mono text-[11px] text-sky-700 dark:text-sky-300 tabular-nums whitespace-nowrap shrink-0">
              Assisted Call {formatDuration(callSeconds)}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {demoState.active ? (
            <button
              type="button"
              onClick={onStopLiveDemo}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Square className="w-3 h-3" />
              Stop Session ({demoState.turnIndex}/{demoState.totalTurns})
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onRunLiveDemo(callMode)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              <Play className="w-3.5 h-3.5" />
              Interactive Walkthrough
            </button>
          )}

          {callMode !== 'general' ? (
            <button
              type="button"
              onClick={handleToggleCall}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                callConnected
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-sky-700 hover:bg-sky-800'
              }`}
            >
              {callConnected ? (
                <>
                  <PhoneOff className="w-3.5 h-3.5" />
                  End Call
                </>
              ) : (
                <>
                  <Phone className="w-3.5 h-3.5" />
                  Connect Assisted Call
                </>
              )}
            </button>
          ) : (
            <button
              type="button"
              onClick={onStartLiveSession}
              className="px-3.5 py-1.5 text-xs font-semibold bg-slate-900 dark:bg-sky-600 hover:bg-slate-800 dark:hover:bg-sky-700 text-white rounded-lg transition-colors whitespace-nowrap shrink-0"
            >
              Start Two-Way Live Session
            </button>
          )}
        </div>
      </div>

      {/* Live Demo Progress Notice */}
      {demoState.active && (
        <div className="px-3 py-1.5 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between gap-2 text-xs text-blue-900">
          <span className="font-medium truncate">{demoState.label}</span>
          <span className="font-mono text-[11px] tabular-nums shrink-0">
            Turn {demoState.turnIndex} of {demoState.totalTurns}
          </span>
        </div>
      )}

      {callMode !== 'general' && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-2">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap shrink-0">
              {callMode === 'doctor'
                ? 'Doctor Says → 3D Sign:'
                : callMode === 'lawyer'
                  ? 'Lawyer Says → 3D Sign:'
                  : callMode === 'gov'
                    ? 'Officer Says → 3D Sign:'
                    : '999 Desk → 3D Sign:'}
            </span>
            {activePrompts.map((p) => (
              <button
                key={p.label}
                type="button"
                disabled={isTranslating}
                onClick={() =>
                  onCallerSpeak(
                    p.bangla,
                    p.english,
                    callMode === 'doctor'
                      ? 'Dr. Nusrat Jahan (Hospital)'
                      : callMode === 'lawyer'
                        ? 'Adv. Rashed Karim (Lawyer)'
                        : callMode === 'gov'
                          ? 'Municipal Helpdesk Officer'
                          : 'Emergency 999 Operator',
                  )
                }
                className="px-2.5 py-1 text-xs font-bengali bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/50 text-slate-800 dark:text-slate-100 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
            <span className="text-[11px] font-semibold text-rose-700 dark:text-rose-300 whitespace-nowrap shrink-0">
              Sign Reply → Bangla Voice:
            </span>
            {activeSignReplies.map((r) => (
              <button
                key={r.label}
                type="button"
                onClick={() => onSignerQuickReply(r.signIds, r.bangla, r.english)}
                className="px-2.5 py-1 text-xs font-bengali bg-rose-50 dark:bg-rose-950/50 hover:bg-rose-100 dark:hover:bg-rose-900/60 text-rose-900 dark:text-rose-200 rounded-md transition-colors whitespace-nowrap shrink-0"
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export function resolveSignTokens(signIds: string[]): BdslSign[] {
  return signIds
    .map((id) => SIGN_BY_ID.get(id))
    .filter((s): s is BdslSign => Boolean(s));
}
