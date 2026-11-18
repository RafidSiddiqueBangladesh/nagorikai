import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Maximize2,
  MessageSquare,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Users,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CallAssistantBar,
  type CallMode,
  resolveSignTokens,
} from './CallAssistantBar';
import { DictionaryView } from './DictionaryView';
import { LiveDetectorPanel } from './LiveDetectorPanel';
import { SignAvatar3D } from './SignAvatar3D';
import { SpeechInputBar } from './SpeechInputBar';
import { TranscriptSidebar } from './TranscriptSidebar';
import {
  BDSL_ALPHABETS,
  BDSL_NUMBERS,
  BDSL_VOCABULARY,
  HAND_SHAPE_MAP,
  SIGN_BY_ID,
  buildLocalSignSequence,
} from '../data/bdslDataset';
import { INTERPRETER_DIRECTORY } from '../data/civicDataset';
import type {
  BdslSign,
  SignSequenceStep,
  TranscriptMessage,
} from '../types/signtalk';

type StudioTab = 'studio' | 'dictionary' | 'interpreters';

interface ScriptTurn {
  role: 'speaker' | 'signer';
  callerLabel: string;
  bangla: string;
  english: string;
  signIds?: string[];
}

const INTERACTIVE_SCRIPTS: Record<CallMode, ScriptTurn[]> = {
  general: [
    {
      role: 'speaker',
      callerLabel: 'Hearing Citizen',
      bangla: 'হ্যালো, আপনি কেমন আছেন? আমি সাহায্য করতে চাই।',
      english: 'Hello, how are you? I want to help.',
      signIds: ['apni', 'kemon_acho', 'ami', 'shahajjo'],
    },
    {
      role: 'signer',
      callerLabel: 'Sign Language User',
      bangla: 'আমি ভাল আছি, বুঝতে পেরেছি।',
      english: 'I am fine, I understand.',
      signIds: ['ami', 'bhalo', 'bujhte_para'],
    },
  ],
  doctor: [
    {
      role: 'speaker',
      callerLabel: 'Dr. Nusrat Jahan (Hospital)',
      bangla: 'হ্যালো, আমি ডাক্তার বলছি। আপনার কোথায় ব্যথা হচ্ছে?',
      english: 'Hello, this is the doctor. Where are you feeling pain?',
      signIds: ['daktar', 'kotha_bola', 'apni', 'osustho_byatha'],
    },
    {
      role: 'signer',
      callerLabel: 'Sign Language User',
      bangla: 'আমি অসুস্থ, আমার শরীরে ব্যথা ও সাহায্য দরকার।',
      english: 'I am sick, I have pain and need help.',
      signIds: ['ami', 'osustho_byatha', 'shahajjo'],
    },
    {
      role: 'speaker',
      callerLabel: 'Dr. Nusrat Jahan (Hospital)',
      bangla: 'ভয় পাবেন না। এই ওষুধ দিনে ২ বার খাবেন।',
      english: 'Do not worry. Take this medicine twice a day.',
      signIds: ['bhoy', 'oshudh', 'din', 'num_2'],
    },
  ],
  lawyer: [
    {
      role: 'speaker',
      callerLabel: 'Adv. Rashed Karim (Lawyer)',
      bangla: 'হ্যালো, আমি আইনজীবী। আপনার কী সাহায্য প্রয়োজন?',
      english: 'Hello, I am a lawyer. What help do you need?',
      signIds: ['ainjibi', 'apni', 'ki', 'shahajjo'],
    },
    {
      role: 'signer',
      callerLabel: 'Sign Language User',
      bangla: 'আমার কাগজপত্র ও দলিল সাথে আছে।',
      english: 'I have my documents and papers with me.',
      signIds: ['amar', 'kagojpotro', 'shathe'],
    },
  ],
  gov: [
    {
      role: 'speaker',
      callerLabel: 'Municipal Helpdesk Officer',
      bangla: 'নাগরিক সেবা কেন্দ্রে স্বাগতম। আপনার কী সাহায্য প্রয়োজন?',
      english: 'Welcome to Citizen Service Desk. What help do you need?',
      signIds: ['apni', 'ki', 'shahajjo'],
    },
    {
      role: 'signer',
      callerLabel: 'Sign Language User',
      bangla: 'আমার কাগজপত্র ও সাহায্য দরকার।',
      english: 'I need document assistance and help.',
      signIds: ['amar', 'kagojpotro', 'shahajjo'],
    },
  ],
  emergency: [
    {
      role: 'speaker',
      callerLabel: 'Emergency 999 Desk',
      bangla: 'ভয় পাবেন না, সাহায্য আসছে। আপনার বাসা কোথায়?',
      english: 'Do not worry, help is coming. Where is your home?',
      signIds: ['bhoy', 'shahajjo', 'basha', 'kothay'],
    },
    {
      role: 'signer',
      callerLabel: 'Sign Language User',
      bangla: 'আমার এখন জরুরি সাহায্য দরকার।',
      english: 'I need urgent help right now.',
      signIds: ['ami', 'ekhon', 'shahajjo'],
    },
  ],
};

function formatTime(): string {
  return new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function createInitialConversation(): {
  messages: TranscriptMessage[];
  initialSteps: SignSequenceStep[];
} {
  const s1 = SIGN_BY_ID.get('ami')!;
  const s2 = SIGN_BY_ID.get('bhalo')!;
  const s3 = SIGN_BY_ID.get('apni')!;
  const s4 = SIGN_BY_ID.get('kemon_acho')!;

  const speakerSteps: SignSequenceStep[] = [s1, s2, s3, s4].map((sign, i) => ({
    id: `init_sp_${i}`,
    sign,
    spokenToken: sign.bangla,
    explanationBn: sign.pdfDescription,
    explanationEn: sign.englishExplanation,
  }));

  const r1 = SIGN_BY_ID.get('ami')!;
  const r2 = SIGN_BY_ID.get('bujhte_para')!;
  const r3 = SIGN_BY_ID.get('shahajjo')!;
  const signerSteps: SignSequenceStep[] = [r1, r2, r3].map((sign, i) => ({
    id: `init_sg_${i}`,
    sign,
    spokenToken: sign.bangla,
    explanationBn: sign.pdfDescription,
    explanationEn: sign.englishExplanation,
  }));

  return {
    messages: [
      {
        id: 'msg_init_1',
        role: 'speaker',
        timestamp: '09:00',
        banglaText: 'আমি ভাল, আপনি কেমন আছেন?',
        englishText: 'I am fine, how are you?',
        originalText: 'আমি ভাল, আপনি কেমন আছ?',
        signSteps: speakerSteps,
        source: 'voice',
      },
      {
        id: 'msg_init_2',
        role: 'signer',
        timestamp: '09:01',
        banglaText: 'আমি বুঝতে পেরেছি, আপনার সাহায্য দরকার।',
        englishText: 'I understand, I need help.',
        originalText: 'আমি বুঝতে পারা সাহায্য',
        signSteps: signerSteps,
        confidence: 0.92,
        source: 'mediapipe',
      },
    ],
    initialSteps: speakerSteps,
  };
}

export function SignTalkStudio({ initialMode = 'general' }: { initialMode?: CallMode }) {
  const initial = useMemo(() => createInitialConversation(), []);

  const [studioTab, setStudioTab] = useState<StudioTab>('studio');
  const [callMode, setCallMode] = useState<CallMode>(initialMode);
  const [messages, setMessages] = useState<TranscriptMessage[]>(initial.messages);
  const [activeSteps, setActiveSteps] = useState<SignSequenceStep[]>(initial.initialSteps);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(0.6);
  const [activePlaybackMessageId, setActivePlaybackMessageId] = useState<string | null>('msg_init_1');
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [stageLayout, setStageLayout] = useState<'both' | 'camera-only' | 'model-only'>('both');
  const [liveSpokenInterim, setLiveSpokenInterim] = useState('');

  const [isTranslating, setIsTranslating] = useState(false);
  const [autoSpeakBangla, setAutoSpeakBangla] = useState(true);
  const [practiceTarget, setPracticeTarget] = useState<BdslSign | null>(null);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [liveSessionTrigger, setLiveSessionTrigger] = useState(0);

  const [walkthroughState, setWalkthroughState] = useState<{
    active: boolean;
    mode: CallMode;
    turnIndex: number;
    totalTurns: number;
    label: string;
  }>({
    active: false,
    mode: 'general',
    turnIndex: 0,
    totalTurns: 0,
    label: '',
  });
  const timersRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const speakBanglaText = useCallback(async (text: string) => {
    const clean = text.trim();
    if (!clean) return;

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      const voices = window.speechSynthesis.getVoices();
      const bnVoice = voices.find((v) => v.lang.toLowerCase().startsWith('bn'));
      if (bnVoice) {
        window.speechSynthesis.cancel();
        const utter = new SpeechSynthesisUtterance(clean);
        utter.voice = bnVoice;
        utter.lang = bnVoice.lang;
        utter.rate = 0.92;
        window.speechSynthesis.speak(utter);
        return;
      }
    }

    try {
      const res = await fetch('/api/tts-bangla', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: clean }),
      });
      if (res.ok) {
        const data = (await res.json()) as { audioBase64?: string };
        if (data.audioBase64) {
          if (audioRef.current) audioRef.current.pause();
          const audio = new Audio(`data:audio/wav;base64,${data.audioBase64}`);
          audioRef.current = audio;
          await audio.play();
          return;
        }
      }
    } catch {
      // Fallback below
    }

    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(clean);
      utter.lang = 'bn-BD';
      utter.rate = 0.9;
      window.speechSynthesis.speak(utter);
    }
  }, []);

  const stopWalkthrough = useCallback(() => {
    timersRef.current.forEach((id) => window.clearTimeout(id));
    timersRef.current = [];
    setWalkthroughState((prev) => ({ ...prev, active: false }));
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((id) => window.clearTimeout(id));
    };
  }, []);

  const handleStepComplete = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (activeSteps.length === 0) return 0;
      return prev + 1 < activeSteps.length ? prev + 1 : 0;
    });
  }, [activeSteps.length]);

  const handleSubmitSpeechText = useCallback(
    async (
      text: string,
      source: 'voice' | 'text',
      _lang: 'bn-BD' | 'en-US',
      callerLabel?: string,
      presetEnglish?: string,
    ) => {
      setIsTranslating(true);
      try {
        const availableSigns = [...BDSL_VOCABULARY, ...BDSL_NUMBERS].map((s) => ({
          id: s.id,
          bangla: s.bangla,
          english: s.english,
        }));

        let finalSteps: SignSequenceStep[] = [];
        let banglaText = text;
        let englishText = presetEnglish || text;

        try {
          const res = await fetch('/api/translate-to-sign', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, availableSigns }),
          });
          const data = (await res.json()) as {
            usedGemini?: boolean;
            banglaNormalized?: string;
            englishNormalized?: string;
            steps?: Array<{
              signId: string;
              spokenToken: string;
              explanationBn: string;
              explanationEn: string;
            }> | null;
          };

          if (data.usedGemini && data.steps && data.steps.length > 0) {
            banglaText = data.banglaNormalized || text;
            englishText = presetEnglish || data.englishNormalized || text;
            const mapped: SignSequenceStep[] = [];

            data.steps.forEach((st, idx) => {
              const found = SIGN_BY_ID.get(st.signId);
              if (found) {
                mapped.push({
                  id: `gem_${Date.now()}_${idx}_${found.id}`,
                  sign: found,
                  spokenToken: st.spokenToken || found.bangla,
                  explanationBn: st.explanationBn || found.pdfDescription,
                  explanationEn: st.explanationEn || found.englishExplanation,
                });
              } else {
                const ascii = (st.spokenToken || '').replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
                if (ascii.length > 0 && ascii.length <= 6) {
                  for (const ch of ascii) {
                    const letter = BDSL_ALPHABETS.find((a) => a.synonyms.includes(ch));
                    if (letter) {
                      mapped.push({
                        id: `gem_fs_${Date.now()}_${idx}_${ch}`,
                        sign: letter,
                        spokenToken: `${st.spokenToken} (${ch})`,
                        explanationBn: st.explanationBn || letter.pdfDescription,
                        explanationEn: st.explanationEn || letter.englishExplanation,
                      });
                    }
                  }
                } else {
                  const baseSpeak = SIGN_BY_ID.get('kotha_bola')!;
                  mapped.push({
                    id: `gem_cust_${Date.now()}_${idx}`,
                    sign: {
                      ...baseSpeak,
                      id: `custom_${idx}`,
                      bangla: st.spokenToken || text,
                      english: st.spokenToken || text,
                      pdfDescription: st.explanationBn || baseSpeak.pdfDescription,
                      englishExplanation: st.explanationEn || baseSpeak.englishExplanation,
                    },
                    spokenToken: st.spokenToken || text,
                    explanationBn: st.explanationBn || baseSpeak.pdfDescription,
                    explanationEn: st.explanationEn || baseSpeak.englishExplanation,
                  });
                }
              }
            });
            finalSteps = mapped;
          }
        } catch {
          // Deterministic local matcher fallback
        }

        if (finalSteps.length === 0) {
          finalSteps = buildLocalSignSequence(text);
        }

        const newMsgId = `msg_${Date.now()}`;
        const newMessage: TranscriptMessage = {
          id: newMsgId,
          role: 'speaker',
          timestamp: formatTime(),
          banglaText,
          englishText,
          originalText: text,
          signSteps: finalSteps,
          source,
          callerLabel,
        };

        setMessages((prev) => [newMessage, ...prev]);
        if (finalSteps.length > 0) {
          setActiveSteps(finalSteps);
          setCurrentStepIndex(0);
          setIsPlaying(true);
          setActivePlaybackMessageId(newMsgId);
        }
      } finally {
        setIsTranslating(false);
      }
    },
    [],
  );

  const handleEmitBanglaSentence = useCallback(
    (payload: {
      tokens: BdslSign[];
      banglaText: string;
      englishText: string;
      confidence: number;
      source: 'mediapipe' | 'image' | 'call-demo';
      callerLabel?: string;
    }) => {
      const steps: SignSequenceStep[] = payload.tokens.map((sign, idx) => ({
        id: `det_${Date.now()}_${idx}_${sign.id}`,
        sign,
        spokenToken: sign.bangla,
        explanationBn: sign.pdfDescription,
        explanationEn: sign.englishExplanation,
      }));

      const newMsgId = `msg_${Date.now()}`;
      const newMsg: TranscriptMessage = {
        id: newMsgId,
        role: 'signer',
        timestamp: formatTime(),
        banglaText: payload.banglaText,
        englishText: payload.englishText,
        originalText: payload.tokens.map((t) => t.bangla).join(' '),
        signSteps: steps,
        confidence: payload.confidence,
        source: payload.source,
        callerLabel: payload.callerLabel,
      };

      setMessages((prev) => [newMsg, ...prev]);
      if (steps.length > 0) {
        setActiveSteps(steps);
        setCurrentStepIndex(0);
        setIsPlaying(true);
        setActivePlaybackMessageId(newMsgId);
      }

      if (autoSpeakBangla) {
        speakBanglaText(payload.banglaText);
      }
    },
    [autoSpeakBangla, speakBanglaText],
  );

  const runInteractiveWalkthrough = useCallback(
    (targetMode: CallMode) => {
      stopWalkthrough();
      const turns = INTERACTIVE_SCRIPTS[targetMode];
      if (!turns || turns.length === 0) return;

      setCallMode(targetMode);
      setStudioTab('studio');

      const triggerTurn = (index: number) => {
        const turn = turns[index];
        if (!turn) {
          setWalkthroughState((prev) => ({ ...prev, active: false }));
          return;
        }

        const tokens = turn.signIds ? resolveSignTokens(turn.signIds) : [];
        const steps: SignSequenceStep[] =
          tokens.length > 0
            ? tokens.map((sign, idx) => ({
                id: `wt_${Date.now()}_${index}_${idx}_${sign.id}`,
                sign,
                spokenToken: sign.bangla,
                explanationBn: sign.pdfDescription,
                explanationEn: sign.englishExplanation,
              }))
            : buildLocalSignSequence(turn.bangla);

        const msgId = `msg_wt_${Date.now()}_${index}`;
        const newMsg: TranscriptMessage = {
          id: msgId,
          role: turn.role,
          timestamp: formatTime(),
          banglaText: turn.bangla,
          englishText: turn.english,
          originalText: turn.bangla,
          signSteps: steps,
          confidence: turn.role === 'signer' ? 0.94 : undefined,
          source: 'call-demo',
          callerLabel: turn.callerLabel,
        };

        setMessages((prev) => [newMsg, ...prev]);
        if (steps.length > 0) {
          setActiveSteps(steps);
          setCurrentStepIndex(0);
          setIsPlaying(true);
          setActivePlaybackMessageId(msgId);
        }

        if (autoSpeakBangla) {
          speakBanglaText(turn.bangla);
        }

        setWalkthroughState({
          active: true,
          mode: targetMode,
          turnIndex: index + 1,
          totalTurns: turns.length,
          label: `${turn.callerLabel}: ${turn.bangla}`,
        });
      };

      triggerTurn(0);
      for (let i = 1; i < turns.length; i++) {
        const timerId = window.setTimeout(() => triggerTurn(i), i * 5200);
        timersRef.current.push(timerId);
      }
      const endTimer = window.setTimeout(() => {
        setWalkthroughState((prev) => ({ ...prev, active: false }));
      }, turns.length * 5200);
      timersRef.current.push(endTimer);
    },
    [autoSpeakBangla, speakBanglaText, stopWalkthrough],
  );

  const handleReplaySequence = (messageId: string, steps: SignSequenceStep[], startIndex = 0) => {
    if (steps.length === 0) return;
    setActiveSteps(steps);
    setCurrentStepIndex(startIndex);
    setIsPlaying(true);
    setActivePlaybackMessageId(messageId);
    setStudioTab('studio');
    setMobileSidebarOpen(false);
  };

  const handleExplainSingleSign = (sign: BdslSign) => {
    const step: SignSequenceStep = {
      id: `single_${Date.now()}_${sign.id}`,
      sign,
      spokenToken: sign.bangla,
      explanationBn: sign.pdfDescription,
      explanationEn: sign.englishExplanation,
    };
    const msgId = `msg_${Date.now()}`;
    setMessages((prev) => [
      {
        id: msgId,
        role: 'speaker',
        timestamp: formatTime(),
        banglaText: sign.bangla,
        englishText: sign.english,
        originalText: sign.bangla,
        signSteps: [step],
        source: 'practice',
      },
      ...prev,
    ]);
    setActiveSteps([step]);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setActivePlaybackMessageId(msgId);
    setStudioTab('studio');
  };

  const handlePracticeSign = (sign: BdslSign) => {
    setPracticeTarget(sign);
    setActiveSteps([
      {
        id: `prac_${Date.now()}_${sign.id}`,
        sign,
        spokenToken: sign.bangla,
        explanationBn: sign.pdfDescription,
        explanationEn: sign.englishExplanation,
      },
    ]);
    setCurrentStepIndex(0);
    setIsPlaying(true);
    setStudioTab('studio');
  };

  const currentStep = activeSteps[currentStepIndex] || null;
  const currentShape = currentStep ? HAND_SHAPE_MAP.get(currentStep.sign.rightHand.shapeId) : undefined;

  return (
    <div className="glass-panel rounded-2xl overflow-hidden flex flex-col min-h-[760px]">
      {/* Studio Sub-header */}
      <div className="px-4 py-3 border-b border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            SignTalk — Bangladeshi Sign Language (BdSL) Interpreter
          </h2>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            Camera recognition with confidence indicator, 3D human signing model, and assisted human interpreter escalation.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800/90 rounded-lg">
            {([
              { id: 'studio', label: 'Live Studio' },
              { id: 'dictionary', label: 'BdSL Dictionary' },
              { id: 'interpreters', label: 'Human Interpreters' },
            ] as const).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setStudioTab(t.id)}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  studioTab === t.id
                    ? 'bg-white dark:bg-slate-950 text-slate-950 dark:text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMobileSidebarOpen((v) => !v)}
            className="lg:hidden inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-lg"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Transcript ({messages.length})
          </button>
        </div>
      </div>

      {/* Main Studio Body */}
      <div className="flex-1 min-h-0 flex relative">
        <div className="flex-1 min-w-0 flex flex-col p-3 lg:p-4 gap-3">
          {studioTab === 'studio' && (
            <>
              <CallAssistantBar
                callMode={callMode}
                onChangeCallMode={setCallMode}
                onStartLiveSession={() => {
                  setAutoSpeakBangla(true);
                  setLiveSessionTrigger((n) => n + 1);
                }}
                onRunLiveDemo={runInteractiveWalkthrough}
                onStopLiveDemo={stopWalkthrough}
                demoState={walkthroughState}
                onCallerSpeak={(bangla, english, callerLabel) => {
                  handleSubmitSpeechText(bangla, 'voice', 'bn-BD', callerLabel, english);
                  if (autoSpeakBangla) speakBanglaText(bangla);
                }}
                onSignerQuickReply={(signIds, banglaText, englishText) => {
                  const tokens = resolveSignTokens(signIds);
                  handleEmitBanglaSentence({
                    tokens,
                    banglaText,
                    englishText,
                    confidence: 0.96,
                    source: 'call-demo',
                    callerLabel: 'Sign Language User',
                  });
                }}
                isTranslating={isTranslating}
              />

              {/* Dual Stage */}
              <div
                className={
                  stageLayout === 'both'
                    ? 'flex-1 min-h-[440px] grid grid-cols-1 xl:grid-cols-12 gap-3'
                    : 'flex-1 min-h-[500px] flex flex-col gap-2.5'
                }
              >
                {stageLayout === 'camera-only' && (
                  <div className="shrink-0 bg-[#0b1222] border border-slate-800 rounded-xl px-4 py-2 flex flex-wrap items-center justify-between gap-2 text-slate-100">
                    <span className="text-xs font-semibold text-sky-300">
                      3D Sign Model Minimized
                      {currentStep ? ` · ${currentStep.sign.bangla} (${currentStep.sign.english})` : ''}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {activeSteps.length > 0 && (
                        <button
                          type="button"
                          onClick={() => setIsPlaying((p) => !p)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-md"
                        >
                          {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                          {isPlaying ? 'Pause' : 'Play'}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setStageLayout('both')}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded-md"
                      >
                        <Maximize2 className="w-3.5 h-3.5" /> Expand 3D Model
                      </button>
                    </div>
                  </div>
                )}

                {stageLayout !== 'camera-only' && (
                  <section
                    className={`${
                      stageLayout === 'model-only' ? 'flex-1' : 'xl:col-span-7'
                    } flex flex-col bg-[#0b1222] rounded-xl overflow-hidden border border-slate-800 relative min-h-[380px]`}
                  >
                    <div className="absolute top-3 left-3 right-3 z-10 pointer-events-none flex items-start justify-between gap-3">
                      <div className="bg-slate-950/92 border border-slate-700/80 rounded-lg px-3.5 py-2.5 max-w-md pointer-events-auto">
                        <div className="flex items-center gap-2 text-[11px] text-sky-300 font-medium">
                          <span>3D BdSL Human Interpreter</span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">
                            Step {activeSteps.length > 0 ? currentStepIndex + 1 : 0}/{activeSteps.length}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums">{playbackSpeed}x</span>
                        </div>

                        {currentStep ? (
                          <div className="mt-1 space-y-1">
                            <div className="flex items-baseline gap-2 flex-wrap">
                              <span className="text-lg font-bengali font-bold text-white">
                                {currentStep.sign.bangla}
                              </span>
                              <span className="text-xs font-medium text-slate-300">
                                ({currentStep.sign.english})
                              </span>
                            </div>
                            <p className="text-xs font-bengali text-slate-200 leading-relaxed">
                              {currentStep.explanationBn}
                            </p>
                            <p className="text-[11px] text-slate-400">
                              Shape #{currentStep.sign.rightHand.shapeId}: {currentShape?.banglaName} ·{' '}
                              {currentStep.sign.category}
                            </p>
                          </div>
                        ) : (
                          <p className="text-xs text-slate-300 mt-1">
                            Type or speak Bangla/English below to see 3D BdSL signing.
                          </p>
                        )}

                        {(liveSpokenInterim || messages[0]) && (
                          <div className="mt-2 pt-2 border-t border-slate-800/90">
                            {liveSpokenInterim ? (
                              <p className="text-xs font-bengali text-amber-300">
                                Listening: <span className="font-semibold text-white">{liveSpokenInterim}</span>
                              </p>
                            ) : (
                              messages[0] && (
                                <p className="text-xs font-bengali text-slate-200 truncate">
                                  <span className="text-sky-300 font-semibold">
                                    {messages[0].role === 'signer' ? 'Signed:' : 'Spoken:'}
                                  </span>{' '}
                                  {messages[0].banglaText}
                                </p>
                              )
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() => setStageLayout('camera-only')}
                        className="pointer-events-auto inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium bg-slate-950/92 hover:bg-slate-800 text-slate-200 border border-slate-700/80 rounded-lg transition-colors whitespace-nowrap"
                      >
                        <Minimize2 className="w-3.5 h-3.5" /> Minimize
                      </button>
                    </div>

                    <div className="flex-1 min-h-0">
                      <SignAvatar3D
                        steps={activeSteps}
                        currentStepIndex={currentStepIndex}
                        isPlaying={isPlaying}
                        playbackSpeed={playbackSpeed}
                        onStepComplete={handleStepComplete}
                      />
                    </div>

                    {/* Collapsible Bottom Control Dock */}
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center w-[94%] max-w-xl">
                      <button
                        type="button"
                        onClick={() => setDockCollapsed((c) => !c)}
                        className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] font-medium bg-slate-950/90 text-slate-300 hover:text-white border border-slate-700 border-b-0 rounded-t-md"
                      >
                        {dockCollapsed ? (
                          <>
                            <ChevronUp className="w-3 h-3" /> Show Controls
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3" /> Hide Controls
                          </>
                        )}
                      </button>

                      {!dockCollapsed && (
                        <div className="w-full bg-slate-950/95 border border-slate-700/90 rounded-lg px-3 py-2 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentStepIndex((prev) =>
                                  prev > 0 ? prev - 1 : Math.max(0, activeSteps.length - 1),
                                )
                              }
                              disabled={activeSteps.length <= 1}
                              aria-label="Previous sign step"
                              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40"
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setIsPlaying((p) => !p)}
                              disabled={activeSteps.length === 0}
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-sky-600 hover:bg-sky-700 text-white rounded"
                            >
                              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                              {isPlaying ? 'Pause' : 'Play'}
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setCurrentStepIndex((prev) =>
                                  prev + 1 < activeSteps.length ? prev + 1 : 0,
                                )
                              }
                              disabled={activeSteps.length <= 1}
                              aria-label="Next sign step"
                              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40"
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                setCurrentStepIndex(0);
                                setIsPlaying(true);
                              }}
                              disabled={activeSteps.length === 0}
                              aria-label="Replay sequence"
                              className="p-1.5 text-slate-300 hover:text-white hover:bg-slate-800 rounded disabled:opacity-40"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1 p-0.5 bg-slate-800 rounded-md">
                            {[
                              { label: '0.35x', val: 0.35 },
                              { label: '0.6x', val: 0.6 },
                              { label: '1.0x', val: 1.0 },
                            ].map((sp) => (
                              <button
                                key={sp.val}
                                type="button"
                                onClick={() => setPlaybackSpeed(sp.val)}
                                className={`px-2 py-1 text-[11px] font-medium rounded ${
                                  playbackSpeed === sp.val
                                    ? 'bg-slate-100 text-slate-950 font-semibold'
                                    : 'text-slate-300 hover:text-white'
                                }`}
                              >
                                {sp.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}

                <section
                  className={
                    stageLayout === 'model-only'
                      ? 'shrink-0'
                      : stageLayout === 'camera-only'
                        ? 'flex-1 min-h-0 flex flex-col'
                        : 'xl:col-span-5 min-h-[340px] flex flex-col'
                  }
                >
                  <LiveDetectorPanel
                    practiceTarget={practiceTarget}
                    onClearPracticeTarget={() => setPracticeTarget(null)}
                    onEmitBanglaSentence={handleEmitBanglaSentence}
                    onPreviewSignOn3D={(steps) => {
                      setActiveSteps(steps);
                      setCurrentStepIndex(0);
                      setIsPlaying(true);
                      setActivePlaybackMessageId(null);
                    }}
                    autoSpeakBangla={autoSpeakBangla}
                    onToggleAutoSpeak={() => setAutoSpeakBangla((v) => !v)}
                    liveSessionTrigger={liveSessionTrigger}
                    isMinimized={stageLayout === 'model-only'}
                    isExpanded={stageLayout === 'camera-only'}
                    onToggleMinimize={() =>
                      setStageLayout((prev) => (prev === 'model-only' ? 'both' : 'model-only'))
                    }
                    latestWatchMessage={messages[0] || null}
                    liveSpokenInterim={liveSpokenInterim}
                  />
                </section>
              </div>

              {/* Reliability & Human Interpreter Notice */}
              <div className="px-3.5 py-2 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200/70 dark:border-sky-800/60 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-700 dark:text-slate-200">
                <span>
                  Automated MediaPipe recognition prioritizes core BdSL vocabulary and includes confidence scoring. For legal, medical, or critical hearings, escalate to a verified human interpreter.
                </span>
                <button
                  type="button"
                  onClick={() => setStudioTab('interpreters')}
                  className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 hover:underline whitespace-nowrap"
                >
                  <Users className="w-3.5 h-3.5" /> Request Human Interpreter
                </button>
              </div>

              <SpeechInputBar
                onSubmitSpeechText={(text, source, lang) =>
                  handleSubmitSpeechText(text, source, lang)
                }
                isTranslating={isTranslating}
                liveSessionTrigger={liveSessionTrigger}
                onInterimSpeech={setLiveSpokenInterim}
              />
            </>
          )}

          {studioTab === 'dictionary' && (
            <div className="flex-1 min-h-[540px]">
              <DictionaryView
                initialCategory="All"
                onExplainSign={handleExplainSingleSign}
                onPracticeSign={handlePracticeSign}
              />
            </div>
          )}

          {studioTab === 'interpreters' && (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800">
                <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                  Verified BdSL Human Interpreter Directory
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
                  Connect with certified Bangladeshi Sign Language interpreters for hospital visits, court hearings, and municipal service offices.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {INTERPRETER_DIRECTORY.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="text-sm font-semibold text-slate-900 dark:text-white">{item.name}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.region} · {item.availability}
                    </div>
                    <p className="text-xs text-slate-700 dark:text-slate-300">{item.languages}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-400">Focus: {item.specialties}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setStudioTab('studio');
                        setCallMode('gov');
                      }}
                      className="w-full mt-2 px-3 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-lg transition-colors"
                    >
                      Open Assisted Call Channel
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Transcript Sidebar */}
        <div
          className={`${
            mobileSidebarOpen
              ? 'fixed inset-y-0 right-0 z-50 w-full max-w-sm shadow-xl bg-white dark:bg-slate-950'
              : 'hidden lg:block lg:w-[340px] xl:w-[380px]'
          } shrink-0 border-l border-slate-200 dark:border-slate-800`}
        >
          {mobileSidebarOpen && (
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(false)}
              className="lg:hidden absolute top-3 right-3 z-50 px-2.5 py-1 text-xs font-medium bg-slate-900 text-white rounded"
            >
              Close
            </button>
          )}
          <TranscriptSidebar
            messages={messages}
            activePlaybackMessageId={activePlaybackMessageId}
            onReplaySequence={handleReplaySequence}
            onSpeakBangla={speakBanglaText}
            onClearMessages={() => setMessages([])}
          />
        </div>
      </div>
    </div>
  );
}
