import {
  AlertTriangle,
  BookmarkCheck,
  CheckCircle2,
  FileSearch,
  FileUp,
  Sparkles,
  Volume2,
} from 'lucide-react';
import { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { SAMPLE_CIVIC_DOCUMENTS } from '../../data/civicDataset';
import type { DocumentReaderResult } from '../../types/civicsphere';

export function AiDocumentReaderSection() {
  const {
    language,
    speakText,
    applyChecklistItems,
    saveDocumentNote,
    setActiveView,
  } = useCivic();

  const isBn = language === 'bn';
  const [docText, setDocText] = useState(SAMPLE_CIVIC_DOCUMENTS[0].text);
  const [uploadedName, setUploadedName] = useState<string>('');
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/png');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [result, setResult] = useState<DocumentReaderResult | null>(null);
  const [savedNotice, setSavedNotice] = useState<string | null>(null);
  const [checkedMap, setCheckedMap] = useState<Record<number, boolean>>({});

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadedName(file.name);
    setMimeType(file.type || 'image/png');
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFileBase64(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSavedNotice(null);
    if (!docText.trim() && !fileBase64) {
      setErrorMsg(
        isBn
          ? 'অনুগ্রহ করে একটি সরকারি নোটিশ/ছবি আপলোড করুন অথবা লেখা পেস্ট করুন।'
          : 'Please upload a notice image/PDF or paste document text.',
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/civic/ai/document-reader', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentText: docText,
          fileBase64: fileBase64 || undefined,
          mimeType,
          language,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Could not analyze document.');
        return;
      }
      setResult(data.result as DocumentReaderResult);
      setCheckedMap({});
    } catch {
      setErrorMsg(
        isBn
          ? 'সার্ভারের সাথে সংযোগ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।'
          : 'Network error while analyzing document. Please try again.',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleSaveToDashboard = () => {
    if (!result) return;
    const checklistStrings = result.checklistItems.map((it) =>
      isBn ? `${it.labelBn} (${it.labelEn})` : `${it.labelEn} — ${it.labelBn}`,
    );
    applyChecklistItems(`doc_${Date.now()}`, result.documentType || 'Government Notice Checklist', checklistStrings);
    saveDocumentNote(
      result.documentType || 'AI Explained Notice',
      `${result.simpleExplanationBn}\n\n${result.simpleExplanationEn}\n\nActions:\n${result.requiredActions
        .map((a, i) => `${i + 1}. ${a}`)
        .join('\n')}`,
    );
    setSavedNotice(
      isBn
        ? 'আপনার চেকলিস্ট ও ব্যাখ্যা "আমার ড্যাশবোর্ড"-এ সংরক্ষিত হয়েছে!'
        : 'Checklist & explanation saved to My Dashboard!',
    );
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <FileSearch className="w-4 h-4" />
              {isBn ? 'AI দলিল ও নোটিশ পাঠক' : 'AI Document Reader'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {isBn
                ? 'সরকারি নোটিশ, এনআইডি চিঠি ও আইনি ফর্ম সহজ বাংলায় বুঝুন'
                : 'Understand Government Notices, NID Instructions & Forms in Simple Bangla'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {isBn
                ? 'যেকোনো সরকারি বিজ্ঞপ্তি, এনআইডি সংশোধন চিঠি, আইনি নোটিশ বা আবেদনের ছবি/পিডিএফ দিন — AI সহজ বাংলায় ব্যাখ্যা ও করণীয় চেকলিস্ট তৈরি করবে।'
                : 'Upload an official circular photo/PDF or paste text. Nagarik AI explains what it means in plain Bangla, lists required actions, and creates an interactive checklist.'}
            </p>
          </div>
        </div>

        {/* Sample circulars switcher */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="font-semibold text-slate-600 dark:text-slate-300">
            {isBn ? 'নমুনা নোটিশ লোড করুন:' : 'Load sample notice:'}
          </span>
          {SAMPLE_CIVIC_DOCUMENTS.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => {
                setDocText(s.text);
                setFileBase64(null);
                setUploadedName('');
              }}
              className="px-3 py-1.5 rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/20 hover:border-emerald-500 font-medium"
            >
              {isBn ? s.titleBn : s.titleEn}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Upload + Text Input Column */}
          <form onSubmit={handleAnalyze} className="lg:col-span-5 space-y-3 text-xs">
            <label className="block p-4 rounded-2xl border-2 border-dashed border-emerald-500/35 bg-emerald-50/40 dark:bg-emerald-950/20 hover:border-emerald-500 cursor-pointer text-center space-y-1.5 transition-colors">
              <FileUp className="w-6 h-6 text-emerald-600 dark:text-emerald-300 mx-auto" />
              <div className="font-bold text-slate-900 dark:text-white">
                {uploadedName
                  ? `${isBn ? 'সংযুক্ত ফাইল:' : 'Attached:'} ${uploadedName}`
                  : isBn
                    ? 'নোটিশ, এনআইডি ফর্ম বা দলিলের ছবি/PDF আপলোড করুন'
                    : 'Upload Notice, NID Circular, or Legal Form (Image / PDF)'}
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                PNG, JPG, WEBP, PDF
              </div>
              <input
                type="file"
                accept="image/*,application/pdf"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>

            <div>
              <label className="font-semibold block mb-1 text-slate-700 dark:text-slate-200">
                {isBn
                  ? 'অথবা নোটিশ / ফর্মের লেখা এখানে পেস্ট করুন:'
                  : 'Or paste document / circular text below:'}
              </label>
              <textarea
                rows={7}
                value={docText}
                onChange={(e) => setDocText(e.target.value)}
                placeholder={
                  isBn
                    ? 'সরকারি চিঠি, নোটিশ বা আইনি নির্দেশনা এখানে লিখুন বা পেস্ট করুন...'
                    : 'Paste notice text in Bangla or English...'
                }
                className="w-full p-3.5 rounded-2xl bg-white/85 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 font-bengali leading-relaxed"
              />
            </div>

            {errorMsg && (
              <p className="p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
                {errorMsg}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 text-sm font-bold rounded-2xl bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white shadow-md flex items-center justify-center gap-2 transition-all"
            >
              <Sparkles className="w-4 h-4" />
              {loading
                ? isBn
                  ? 'AI দলিল বিশ্লেষণ করছে...'
                  : 'Analyzing document with AI...'
                : isBn
                  ? 'সহজ বাংলায় ব্যাখ্যা ও চেকলিস্ট তৈরি করুন'
                  : 'Explain in Simple Bangla & Build Checklist'}
            </button>
          </form>

          {/* Output Result Column */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/20 space-y-4 text-xs">
            {!result ? (
              <div className="h-full min-h-[260px] flex flex-col items-center justify-center text-center text-slate-500 dark:text-slate-400 space-y-2 p-6">
                <FileSearch className="w-10 h-10 text-emerald-500/60" />
                <div className="text-sm font-bold text-slate-700 dark:text-slate-200">
                  {isBn ? 'দলিলের সহজ বাংলা সারসংক্ষেপ এখানে দেখা যাবে' : 'Simple Bangla Explanation & Action Checklist Ready'}
                </div>
                <p className="max-w-md leading-relaxed">
                  {isBn
                    ? 'বাম পাশ থেকে নমুনা নোটিশ বেছে নিন অথবা আপনার নিজস্ব কাগজের ছবি আপলোড করে বিশ্লেষণ বোতামে চাপ দিন।'
                    : 'Choose a sample notice or upload your own photo/PDF on the left, then click Explain to generate step-by-step instructions and audio playback.'}
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {result.issuingAuthority}
                    </span>
                    <h2 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                      {result.documentType}
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => speakText(result.simpleExplanationBn)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-semibold"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                    {isBn ? 'বাংলায় শুনুন' : 'Listen in Bangla'}
                  </button>
                </div>

                {/* Simple Bangla Box */}
                <div className="p-4 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/35 border border-emerald-200 dark:border-emerald-800 space-y-1.5">
                  <div className="font-bold text-emerald-900 dark:text-emerald-200">
                    {isBn ? 'সহজ বাংলায় মূল কথা' : 'Plain Bangla Explanation'}
                  </div>
                  <p className="text-sm font-bengali text-slate-800 dark:text-slate-100 leading-relaxed">
                    {result.simpleExplanationBn}
                  </p>
                </div>

                {/* English Summary */}
                <div className="p-3.5 rounded-xl bg-sky-50/70 dark:bg-sky-950/30 border border-sky-200 dark:border-sky-800 space-y-1">
                  <div className="font-bold text-sky-900 dark:text-sky-200">
                    {isBn ? 'ইংরেজি সারসংক্ষেপ' : 'English Summary'}
                  </div>
                  <p className="text-slate-700 dark:text-slate-200 leading-relaxed">
                    {result.simpleExplanationEn}
                  </p>
                </div>

                {/* Deadlines, Fees & Caution */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-1">
                    <div className="font-bold text-slate-900 dark:text-white">
                      {isBn ? 'সময়সীমা ও সরকারি ফি' : 'Deadlines & Official Fees'}
                    </div>
                    <p className="text-slate-600 dark:text-slate-300">{result.deadlinesAndFees}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 space-y-1">
                    <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" />
                      {isBn ? 'সতর্কতা' : 'Safety Note'}
                    </div>
                    <p className="text-amber-900 dark:text-amber-100">{result.cautionaryNote}</p>
                  </div>
                </div>

                {/* Interactive Checklist */}
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="font-bold text-slate-900 dark:text-white">
                      {isBn ? 'আপনার করণীয় চেকলিস্ট' : 'Interactive Action Checklist'}
                    </h3>
                    <button
                      type="button"
                      onClick={handleSaveToDashboard}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-700 hover:bg-sky-800 text-white font-semibold"
                    >
                      <BookmarkCheck className="w-3.5 h-3.5" />
                      {isBn ? 'ড্যাশবোর্ডে সংরক্ষণ করুন' : 'Save Checklist to My Dashboard'}
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {result.checklistItems.map((item, idx) => (
                      <label
                        key={idx}
                        className="flex items-start gap-2.5 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={Boolean(checkedMap[idx])}
                          onChange={() => setCheckedMap((p) => ({ ...p, [idx]: !p[idx] }))}
                          className="mt-0.5 accent-emerald-600"
                        />
                        <span className={checkedMap[idx] ? 'line-through opacity-60' : ''}>
                          <span className="font-semibold font-bengali block text-slate-900 dark:text-white">
                            {item.labelBn}
                          </span>
                          <span className="text-[11px] text-slate-500 dark:text-slate-400">
                            {item.labelEn}
                          </span>
                        </span>
                      </label>
                    ))}
                  </div>

                  {savedNotice && (
                    <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-200">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 shrink-0" /> {savedNotice}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveView('dashboard')}
                        className="font-bold underline"
                      >
                        {isBn ? 'ড্যাশবোর্ড দেখুন' : 'Open My Dashboard'}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
