import {
  Bookmark,
  CheckSquare,
  Download,
  ExternalLink,
  Loader2,
  Mic,
  Send,
  Share2,
  ShieldCheck,
  Volume2,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import type { SphereAiStructuredAnswer } from '../../types/civicsphere';

const SUGGESTED_QUESTIONS = [
  'How can I make a National ID?',
  'How can I correct my NID information?',
  'How do I get a birth certificate?',
  'How do I apply for an elderly allowance?',
  'How can I apply for a Krishok Card?',
  'How do I get a trade license?',
  'How can I register a GD?',
  'How can I get a disability certificate?',
  'How do I apply for a widow allowance?',
  'Where can I get free legal assistance?',
  'How can I report a government officer?',
  'Where can I get my child vaccinated?',
];

export function SphereAiPanel({
  embedded = false,
  onClose,
}: {
  embedded?: boolean;
  onClose?: () => void;
}) {
  const {
    language,
    setLanguage,
    sphereInitialPrompt,
    aiHistory,
    addAiHistory,
    saveDocumentNote,
    speakText,
  } = useCivic();

  const [query, setQuery] = useState(sphereInitialPrompt || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeAnswer, setActiveAnswer] = useState<SphereAiStructuredAnswer | null>(
    aiHistory[0]?.answer || null,
  );
  const [activeQuestion, setActiveQuestion] = useState<string>(aiHistory[0]?.question || '');
  const [checklistProgress, setChecklistProgress] = useState<Record<number, boolean>>({});
  const [listening, setListening] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);

  useEffect(() => {
    if (sphereInitialPrompt) {
      setQuery(sphereInitialPrompt);
    }
  }, [sphereInitialPrompt]);

  const askSphereAi = async (customPrompt?: string) => {
    const q = (customPrompt ?? query).trim();
    if (!q) return;
    setLoading(true);
    setErrorMsg(null);
    setFeedbackMsg(null);
    try {
      const res = await fetch('/api/civic/ai/assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: q,
          language,
          history: aiHistory.slice(0, 3).map((h) => ({
            role: 'user',
            text: `${h.question} -> ${h.answer.shortExplanation}`,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Sphere AI is temporarily unavailable.');
        return;
      }
      if (data.answer) {
        setActiveQuestion(q);
        setActiveAnswer(data.answer as SphereAiStructuredAnswer);
        setChecklistProgress({});
        addAiHistory(q, data.answer as SphereAiStructuredAnswer);
      }
    } catch {
      setErrorMsg('Network error connecting to Sphere AI.');
    } finally {
      setLoading(false);
    }
  };

  const handleVoiceQuestion = () => {
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
      setErrorMsg('Voice input requires Chrome/Edge Web Speech support.');
      return;
    }
    const rec = new SR();
    rec.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    setListening(true);
    rec.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript || '';
      if (transcript) {
        setQuery(transcript);
        askSphereAi(transcript);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  const handleDownloadGuide = () => {
    if (!activeAnswer) return;
    const text = [
      `CivicSphere AI — Sphere AI Civic Guide`,
      `Question: ${activeQuestion}`,
      `Classification: ${activeAnswer.isOfficialInfo ? 'Verified Official Procedure Guidance' : 'General Civic Guidance'}`,
      `Note: ${activeAnswer.confidenceNote}`,
      `\n1. Summary:\n${activeAnswer.shortExplanation}`,
      `\n2. Eligibility:\n${activeAnswer.eligibility.map((e) => `- ${e}`).join('\n')}`,
      `\n3. Required Documents:\n${activeAnswer.requiredDocuments.map((d) => `[ ] ${d}`).join('\n')}`,
      `\n4. Step-by-Step Process:\n${activeAnswer.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
      `\n5. Estimated Fees: ${activeAnswer.estimatedFees}`,
      `\n6. Relevant Office: ${activeAnswer.relevantOffice}`,
      `\n7. Official Link: ${activeAnswer.officialLink}`,
      `\n8. Offline Method: ${activeAnswer.offlineMethod}`,
      `\n9. Helpline: ${activeAnswer.helpline}`,
      `\n10. If Rejected: ${activeAnswer.ifRejected}`,
    ].join('\n');

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sphere-ai-guide-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSaveToDashboard = () => {
    if (!activeAnswer) return;
    saveDocumentNote(
      activeQuestion || 'Sphere AI Civic Guide',
      `${activeAnswer.shortExplanation}\n\nDocuments:\n${activeAnswer.requiredDocuments.join('\n')}\n\nOffice: ${activeAnswer.relevantOffice}\nHelpline: ${activeAnswer.helpline}`,
    );
    setFeedbackMsg('Saved to your Personal Citizen Dashboard.');
  };

  const handleShare = async () => {
    if (!activeAnswer) return;
    const summary = `${activeQuestion}\n${activeAnswer.shortExplanation}\nOffice: ${activeAnswer.relevantOffice}\nHelpline: ${activeAnswer.helpline}`;
    try {
      await navigator.clipboard.writeText(summary);
      setFeedbackMsg('Instructions copied to clipboard for sharing.');
    } catch {
      setFeedbackMsg('Copy the guide text or use Download Guide.');
    }
  };

  return (
    <div
      className={`flex flex-col overflow-hidden ${
        embedded ? 'glass-panel rounded-2xl' : 'h-full'
      }`}
    >
      {/* Emerald-to-Sapphire AI Assistant Header */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-sky-700 text-white px-5 py-4 flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-white">
              Sphere AI — Multilingual Civic Assistant
            </h2>
            <span className="text-[11px] font-medium text-emerald-100">
              · Active
            </span>
          </div>
          <p className="text-xs text-emerald-50/90 mt-0.5">
            Ask in simple Bangla or English. Verified Bangladesh portals and official guidance are clearly separated from general advice.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-1 p-1 bg-white/15 backdrop-blur-md rounded-lg">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors ${
                language === 'en'
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              English
            </button>
            <button
              type="button"
              onClick={() => setLanguage('bn')}
              className={`px-2.5 py-1 text-xs font-bengali font-medium rounded-md transition-colors ${
                language === 'bn'
                  ? 'bg-white text-slate-950 font-semibold'
                  : 'text-white/90 hover:text-white'
              }`}
            >
              বাংলা
            </button>
          </div>
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close Sphere AI"
              className="p-1.5 rounded-lg text-white/85 hover:text-white hover:bg-white/15 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className={`${embedded ? 'p-5 md:p-6' : 'p-4 sm:p-5'} flex-1 flex flex-col overflow-hidden`}>

      {/* Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          askSphereAi();
        }}
        className="mt-4 flex flex-col sm:flex-row gap-2"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={
            language === 'bn'
              ? 'যেকোনো সরকারি সেবা, এনআইডি, ভাতা বা আইনি প্রশ্ন লিখুন...'
              : 'Ask how to get an NID, Birth Certificate, Krishok Card, Trade License, GD, or Legal Aid...'
          }
          className="flex-1 px-4 py-2.5 text-sm rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white placeholder:text-slate-400"
        />
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={handleVoiceQuestion}
            aria-label="Ask by voice"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium rounded-xl border transition-colors ${
              listening
                ? 'bg-rose-600 text-white border-rose-600'
                : 'bg-white/80 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:border-sky-500'
            }`}
          >
            <Mic className="w-4 h-4" />
            {listening ? 'Listening...' : 'Voice'}
          </button>
          <button
            type="submit"
            disabled={loading || !query.trim()}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-900/15 transition-all whitespace-nowrap"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Ask Sphere AI
          </button>
        </div>
      </form>

      {/* Suggested Civic Prompts */}
      <div className="mt-3 flex items-center gap-1.5 overflow-x-auto pb-1">
        {SUGGESTED_QUESTIONS.map((sq) => (
          <button
            key={sq}
            type="button"
            onClick={() => {
              setQuery(sq);
              askSphereAi(sq);
            }}
            className="px-3 py-1.5 text-xs bg-slate-100/90 dark:bg-white/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/60 text-slate-700 dark:text-slate-200 rounded-lg whitespace-nowrap shrink-0 transition-colors"
          >
            {sq}
          </button>
        ))}
      </div>

      {errorMsg && (
        <div className="mt-4 p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 text-xs text-rose-800 dark:text-rose-200">
          {errorMsg}
        </div>
      )}

      {feedbackMsg && (
        <div className="mt-3 px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
          {feedbackMsg}
        </div>
      )}

      {/* Structured 10-Point Civic Response */}
      <div className="mt-4 flex-1 overflow-y-auto space-y-4">
        {loading && (
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 space-y-3">
            <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-full bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
            <div className="h-3 w-4/5 bg-slate-200 dark:bg-slate-800 rounded animate-pulse" />
          </div>
        )}

        {!loading && activeAnswer && (
          <div className="space-y-4">
            {/* Verification Classification & Action Toolbar */}
            <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-xs font-medium text-sky-700 dark:text-sky-300">
                  <ShieldCheck className="w-4 h-4 shrink-0" />
                  <span>
                    {activeAnswer.isOfficialInfo
                      ? 'Verified Official Procedure Reference'
                      : 'General Civic Guidance'}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      speakText(
                        `${activeAnswer.shortExplanation}. Steps: ${activeAnswer.steps.join('. ')}`,
                      )
                    }
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-lg"
                  >
                    <Volume2 className="w-3.5 h-3.5" /> Listen
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const nextLang = language === 'en' ? 'bn' : 'en';
                      setLanguage(nextLang);
                      askSphereAi(activeQuestion);
                    }}
                    className="px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-lg"
                  >
                    {language === 'en' ? 'Translate to বাংলা' : 'Translate to English'}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveToDashboard}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-lg"
                  >
                    <Bookmark className="w-3.5 h-3.5" /> Save
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadGuide}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-lg"
                  >
                    <Download className="w-3.5 h-3.5" /> Guide
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-800 dark:text-slate-100 rounded-lg"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                </div>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white">{activeQuestion}</h3>
              <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
                {activeAnswer.shortExplanation}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Source Scope: {activeAnswer.confidenceNote}
              </p>
            </div>

            {/* 10-Point Structured Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                  01. Eligibility Requirements
                </h4>
                <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-200 list-disc pl-4">
                  {activeAnswer.eligibility.map((item, idx) => (
                    <li key={idx}>{item}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
                <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5">
                  <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
                  02. Interactive Document Checklist
                </h4>
                <div className="space-y-1.5">
                  {activeAnswer.requiredDocuments.map((doc, idx) => (
                    <label
                      key={idx}
                      className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-200 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(checklistProgress[idx])}
                        onChange={() =>
                          setChecklistProgress((p) => ({ ...p, [idx]: !p[idx] }))
                        }
                        className="mt-0.5 rounded border-slate-300 text-sky-600"
                      />
                      <span className={checklistProgress[idx] ? 'line-through opacity-60' : ''}>
                        {doc}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                03. Step-by-Step Application Process
              </h4>
              <ol className="space-y-2 text-xs text-slate-700 dark:text-slate-200 list-decimal pl-4">
                {activeAnswer.steps.map((st, idx) => (
                  <li key={idx} className="leading-relaxed">
                    {st}
                  </li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Estimated Fees: </span>
                  <span className="text-slate-800 dark:text-slate-100">{activeAnswer.estimatedFees}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Relevant Office: </span>
                  <span className="text-slate-800 dark:text-slate-100">{activeAnswer.relevantOffice}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Helpline: </span>
                  <span className="font-mono text-sky-700 dark:text-sky-300">{activeAnswer.helpline}</span>
                </div>
                {activeAnswer.officialLink && activeAnswer.officialLink.startsWith('http') && (
                  <a
                    href={activeAnswer.officialLink}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 font-semibold hover:underline"
                  >
                    Official Portal <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">Offline Method: </span>
                  <span className="text-slate-800 dark:text-slate-100">{activeAnswer.offlineMethod}</span>
                </div>
                <div>
                  <span className="font-semibold text-slate-500 dark:text-slate-400">If Rejected / Delayed: </span>
                  <span className="text-slate-800 dark:text-slate-100">{activeAnswer.ifRejected}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
      </div>
    </div>
  );
}
