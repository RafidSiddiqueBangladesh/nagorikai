import { ArrowRight, Mic, MicOff } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

interface SpeechInputBarProps {
  onSubmitSpeechText: (text: string, source: 'voice' | 'text', lang: 'bn-BD' | 'en-US') => void;
  isTranslating: boolean;
  liveSessionTrigger?: number;
  onInterimSpeech?: (text: string) => void;
}

interface SpeechRecognitionAlternative {
  transcript: string;
}

interface SpeechRecognitionResultItem {
  isFinal?: boolean;
  0: SpeechRecognitionAlternative;
}

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: ArrayLike<SpeechRecognitionResultItem>;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: { error: string }) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
}

const SAMPLE_PHRASES = [
  { label: 'আমি ভাল, আপনি কেমন আছ?', text: 'আমি ভাল, আপনি কেমন আছ?' },
  { label: 'আমি তোমাকে সাহায্য করব', text: 'আমি সাহায্য তুমি' },
  { label: 'আমার পরিবার ও বাসা', text: 'আমার পরিবার বাসা' },
  { label: 'Please help me understand', text: 'I want to understand and help' },
  { label: 'ধৈর্য্য ধরা এবং চেষ্টা করা', text: 'ধৈর্য্য ধরা এবং চেষ্টা' },
];

export function SpeechInputBar({
  onSubmitSpeechText,
  isTranslating,
  liveSessionTrigger = 0,
  onInterimSpeech,
}: SpeechInputBarProps) {
  const [inputText, setInputText] = useState('');
  const [speechLang, setSpeechLang] = useState<'bn-BD' | 'en-US'>('bn-BD');
  const [isListening, setIsListening] = useState(false);
  const [continuousMode, setContinuousMode] = useState(true);
  const [liveInterim, setLiveInterim] = useState('');
  const [voiceNote, setVoiceNote] = useState<string | null>(null);

  useEffect(() => {
    onInterimSpeech?.(liveInterim);
  }, [liveInterim, onInterimSpeech]);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const keepListeningRef = useRef(false);
  const onSubmitRef = useRef(onSubmitSpeechText);
  onSubmitRef.current = onSubmitSpeechText;

  const handleSend = useCallback(
    (textToSend?: string, source: 'voice' | 'text' = 'text') => {
      const clean = (textToSend ?? inputText).trim();
      if (!clean) return;
      onSubmitRef.current(clean, source, speechLang);
      if (!textToSend) setInputText('');
    },
    [inputText, speechLang],
  );

  const stopListening = useCallback(() => {
    keepListeningRef.current = false;
    setLiveInterim('');
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Ignore stop errors
      }
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(async () => {
    setVoiceNote(null);
    const win = window as unknown as {
      SpeechRecognition?: new () => SpeechRecognitionInstance;
      webkitSpeechRecognition?: new () => SpeechRecognitionInstance;
    };
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (SpeechRec) {
      try {
        const rec = new SpeechRec();
        rec.lang = speechLang;
        rec.interimResults = true;
        rec.continuous = continuousMode;
        keepListeningRef.current = continuousMode;

        let latestSingleTranscript = '';

        rec.onresult = (event) => {
          let interim = '';
          for (let i = event.resultIndex || 0; i < event.results.length; i++) {
            const res = event.results[i];
            const transcript = res[0]?.transcript || '';
            if (res.isFinal) {
              const finalClean = transcript.trim();
              if (finalClean) {
                if (continuousMode) {
                  onSubmitRef.current(finalClean, 'voice', speechLang);
                } else {
                  latestSingleTranscript = finalClean;
                }
              }
            } else {
              interim += transcript + ' ';
            }
          }
          setLiveInterim(interim.trim());
          if (!continuousMode && interim.trim()) {
            setInputText(interim.trim());
          }
        };

        rec.onerror = (ev) => {
          if (ev.error === 'no-speech' && keepListeningRef.current) {
            return;
          }
          setVoiceNote(`Mic notice: ${ev.error}`);
          keepListeningRef.current = false;
          setIsListening(false);
        };

        rec.onend = () => {
          setLiveInterim('');
          if (keepListeningRef.current) {
            try {
              rec.start();
              return;
            } catch {
              keepListeningRef.current = false;
            }
          }
          setIsListening(false);
          if (!continuousMode && latestSingleTranscript.trim()) {
            onSubmitRef.current(latestSingleTranscript.trim(), 'voice', speechLang);
            setInputText('');
          }
        };

        recognitionRef.current = rec;
        rec.start();
        setIsListening(true);
        return;
      } catch {
        // Fall through to MediaRecorder + Gemini transcription
      }
    }

    // Fallback: record audio and transcribe via server-side Gemini 3.5 Transcribe
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      audioChunksRef.current = [];

      recorder.ondataavailable = (ev) => {
        if (ev.data.size > 0) audioChunksRef.current.push(ev.data);
      };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: recorder.mimeType || 'audio/webm' });
        if (blob.size < 200) return;

        setVoiceNote('Transcribing speech...');
        try {
          const base64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          const res = await fetch('/api/transcribe-speech', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              audioBase64: base64,
              mimeType: blob.type || 'audio/webm',
            }),
          });
          const data = (await res.json()) as { text?: string; error?: string };
          if (res.ok && data.text) {
            setVoiceNote(null);
            onSubmitRef.current(data.text, 'voice', speechLang);
          } else {
            setVoiceNote(data.error || 'Could not transcribe audio.');
          }
        } catch {
          setVoiceNote('Audio transcription unavailable.');
        }
      };

      mediaRecorderRef.current = recorder;
      recorder.start();
      setIsListening(true);
    } catch {
      setVoiceNote('Microphone access was denied or unavailable.');
    }
  }, [continuousMode, speechLang]);

  const prevLiveTriggerRef = useRef(0);
  useEffect(() => {
    if (liveSessionTrigger > prevLiveTriggerRef.current) {
      prevLiveTriggerRef.current = liveSessionTrigger;
      if (!isListening) {
        startListening();
      }
    }
  }, [liveSessionTrigger, isListening, startListening]);

  useEffect(() => {
    return () => {
      keepListeningRef.current = false;
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className="bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-xl p-2.5 space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-semibold text-slate-900 dark:text-white">
            Hearing Speaker Voice / Text → Slow 3D Sign Language
          </span>
          {isListening && (
            <span className="text-xs font-medium text-rose-600 dark:text-rose-400">
              · Listening continuously...
            </span>
          )}
          {voiceNote && (
            <span className="text-xs text-rose-600 dark:text-rose-400">{voiceNote}</span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <label className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={continuousMode}
              onChange={(e) => setContinuousMode(e.target.checked)}
              className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            Continuous Mic
          </label>

          <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-md">
            <button
              type="button"
              onClick={() => setSpeechLang('bn-BD')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                speechLang === 'bn-BD'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              বাংলা Voice
            </button>
            <button
              type="button"
              onClick={() => setSpeechLang('en-US')}
              className={`px-2 py-1 text-[11px] font-medium rounded transition-colors ${
                speechLang === 'en-US'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              English Voice
            </button>
          </div>
        </div>
      </div>

      {liveInterim && (
        <div className="px-3 py-1.5 text-xs font-bengali bg-blue-50 dark:bg-sky-950/60 border border-blue-200 dark:border-sky-500/30 rounded-lg text-blue-900 dark:text-sky-100">
          Hearing person saying: <span className="font-semibold">{liveInterim}</span>
        </div>
      )}

      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(undefined, 'text');
        }}
        className="flex items-center gap-2"
      >
        <button
          type="button"
          onClick={isListening ? stopListening : startListening}
          className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap shrink-0 ${
            isListening
              ? 'bg-rose-600 text-white hover:bg-rose-700'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
        >
          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isListening ? 'Stop Mic' : 'Talk Live'}
        </button>

        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder={
            speechLang === 'bn-BD'
              ? 'বাংলায় অথবা ইংরেজিতে বলুন বা লিখুন (যেমন: আমি ভাল, কেমন আছ?)...'
              : 'Speak or type any message in Bangla or English...'
          }
          className="flex-1 min-w-0 px-3 py-2 text-sm font-bengali bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
        />

        <button
          type="submit"
          disabled={!inputText.trim() || isTranslating}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-700 text-white rounded-lg hover:bg-blue-800 disabled:opacity-45 transition-colors whitespace-nowrap shrink-0"
        >
          <span>{isTranslating ? 'Translating...' : 'Sign & Explain'}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        <span className="text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap shrink-0">
          Quick Phrases:
        </span>
        {SAMPLE_PHRASES.map((p) => (
          <button
            key={p.label}
            type="button"
            disabled={isTranslating}
            onClick={() => handleSend(p.text, 'text')}
            className="px-2.5 py-1 text-xs font-bengali bg-slate-100 dark:bg-slate-800 hover:bg-blue-50 dark:hover:bg-sky-900/50 hover:text-blue-800 dark:hover:text-sky-300 text-slate-700 dark:text-slate-200 rounded-md transition-colors whitespace-nowrap shrink-0"
          >
            {p.label}
          </button>
        ))}
      </div>
    </div>
  );
}
