import {
  Bookmark,
  ExternalLink,
  ImagePlus,
  Loader2,
  Newspaper,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { useCivic } from '../../context/CivicContext';

const NEWS_CATEGORIES = [
  'All',
  'Disability Rights',
  'Municipality Updates',
  'Human Rights',
  'Healthcare',
  'Education',
  'Anti-Corruption',
  'Environment',
];

export function NewsFactCheckSection({ compact = false }: { compact?: boolean }) {
  const { language, newsItems, openSphereWithPrompt, saveDocumentNote, setActiveView } = useCivic();

  const [catFilter, setCatFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [savedNewsIds, setSavedNewsIds] = useState<string[]>([]);

  // Fact-Check State
  const [claimText, setClaimText] = useState('');
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [factError, setFactError] = useState<string | null>(null);
  const [factAnalysis, setFactAnalysis] = useState<string | null>(null);
  const [factSources, setFactSources] = useState<Array<{ title: string; uri: string }>>([]);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const filteredNews = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return newsItems.filter((n) => {
      if (catFilter !== 'All' && n.category !== catFilter) return false;
      if (!q) return true;
      return (
        n.titleEn.toLowerCase().includes(q) ||
        n.titleBn.toLowerCase().includes(q) ||
        n.district.toLowerCase().includes(q)
      );
    });
  }, [catFilter, newsItems, searchTerm]);

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') setScreenshotPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleFactCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!claimText.trim() && !screenshotPreview) return;
    setChecking(true);
    setFactError(null);
    setFactAnalysis(null);
    setFactSources([]);

    try {
      const res = await fetch('/api/civic/ai/fact-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          claimText,
          imageBase64: screenshotPreview || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setFactError(data.error || 'Fact-check service could not evaluate this claim.');
        return;
      }
      setFactAnalysis(data.analysis);
      setFactSources(data.sources || []);
    } catch {
      setFactError('Network error running fact-check.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Civic News &amp; AI Fact-Checking Center
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Verified public announcements, district civic journalism in Bangla &amp; English, and grounded claim verification.
            </p>
          </div>
          {compact && (
            <button
              type="button"
              onClick={() => setActiveView('news')}
              className="px-3.5 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-xl"
            >
              News &amp; Fact-Check Studio
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-2.5 justify-between">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
            {NEWS_CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCatFilter(c)}
                className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap shrink-0 ${
                  catFilter === c
                    ? 'bg-sky-700 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          <div className="relative min-w-[200px]">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search news or district..."
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>

        {/* News Cards */}
        <div className="gsap-stagger-grid grid grid-cols-1 md:grid-cols-3 gap-4">
          {filteredNews.map((item) => {
            const isSaved = savedNewsIds.includes(item.id);
            const isVerified = item.factStatus.toLowerCase().includes('verified');
            return (
              <article
                key={item.id}
                className="civic-card-hover rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/15 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  {item.imageUrl && (
                    <div className="h-40 w-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <img
                        src={item.imageUrl}
                        alt={item.titleEn}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                      />
                    </div>
                  )}
                  <div className="p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2 text-[11px]">
                      <span className="text-slate-500 dark:text-slate-400 truncate">
                        {item.category} · {item.district} · {item.publishedAt}
                      </span>
                      <span
                        className={`font-semibold shrink-0 ${
                          isVerified
                            ? 'text-emerald-700 dark:text-emerald-300'
                            : 'text-amber-700 dark:text-amber-300'
                        }`}
                      >
                        {item.factStatus}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {language === 'bn' ? item.titleBn : item.titleEn}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                      {language === 'bn' ? item.summaryBn : item.summaryEn}
                    </p>
                  </div>
                </div>

                <div className="px-4 py-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      openSphereWithPrompt(`Explain this civic update in simple Bangla and English: ${item.titleEn}`)
                    }
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                  >
                    <Sparkles className="w-3.5 h-3.5" /> Explain
                  </button>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      aria-label="Save article"
                      onClick={() => {
                        setSavedNewsIds((p) =>
                          p.includes(item.id) ? p.filter((x) => x !== item.id) : [...p, item.id],
                        );
                        saveDocumentNote(item.titleEn, item.summaryEn);
                      }}
                      className={`p-1.5 rounded-lg border ${
                        isSaved
                          ? 'border-emerald-500 text-emerald-600'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      aria-label="Share article"
                      onClick={() => navigator.clipboard?.writeText(`${item.titleEn} — ${item.sourceUrl}`)}
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
                    >
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                    <a
                      href={item.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      aria-label="Open source link"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              </article>
            );
          })}
        </div>

        {/* Civic Literacy & Misinformation Spotting Quick Guides (Inspired by Education Hub) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/90 to-sky-50/70 dark:from-emerald-950/40 dark:to-sky-950/30 border border-emerald-200/70 dark:border-emerald-500/20 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {language === 'bn'
                  ? 'ভুয়া সংবাদ ও গুজব চেনার সহজ উপায়'
                  : 'How to Spot Rumors & Edited Documents'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Verify source domain (.gov.bd), check official Election Commission or Ministry notices, and cross-check timestamps before sharing.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openSphereWithPrompt(
                  'Teach me a 5-point checklist to spot fake civic notices or edited screenshots in Bangladesh.',
                )
              }
              className="px-3 py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0 whitespace-nowrap"
            >
              Learn Checklist
            </button>
          </div>

          <div className="p-4 rounded-2xl bg-gradient-to-br from-sky-50/90 to-indigo-50/70 dark:from-sky-950/40 dark:to-indigo-950/30 border border-sky-200/70 dark:border-sky-500/20 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="font-bold text-slate-900 dark:text-white">
                {language === 'bn'
                  ? 'ভোটার নিবন্ধন ও নাগরিক অধিকার গাইড'
                  : 'Voter Registration & Citizen Rights Walkthrough'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                Step-by-step Bangla &amp; English preparation for NID registration, polling center verification, and inclusive accessible voting.
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                openSphereWithPrompt(
                  'Explain step-by-step how to register as a voter and verify my NID polling center in Bangladesh.',
                )
              }
              className="px-3 py-2 font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-xl shrink-0 whitespace-nowrap"
            >
              Open Guide
            </button>
          </div>
        </div>

        {/* AI Fact-Checking Assistant */}
        <div className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-sky-600" /> AI Fact-Checking Assistant
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300">
                Paste a social media claim, news URL, or upload a screenshot. Uses grounded search and states confidence and limitations clearly.
              </p>
            </div>
            <Newspaper className="w-5 h-5 text-slate-400" />
          </div>

          <form onSubmit={handleFactCheck} className="space-y-3">
            <textarea
              rows={2}
              value={claimText}
              onChange={(e) => setClaimText(e.target.value)}
              placeholder="Paste claim text, forwarded message, or news URL to verify..."
              className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  onChange={handleScreenshotUpload}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-xl"
                >
                  <ImagePlus className="w-3.5 h-3.5" />
                  {screenshotPreview ? 'Screenshot Attached' : 'Attach Screenshot'}
                </button>
                {screenshotPreview && (
                  <button
                    type="button"
                    onClick={() => setScreenshotPreview(null)}
                    className="text-xs text-rose-600"
                  >
                    Remove
                  </button>
                )}
              </div>
              <button
                type="submit"
                disabled={checking || (!claimText.trim() && !screenshotPreview)}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 disabled:opacity-50 text-white rounded-xl"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                Verify Claim
              </button>
            </div>
          </form>

          {factError && <p className="text-xs text-rose-600">{factError}</p>}

          {factAnalysis && (
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="whitespace-pre-wrap text-slate-800 dark:text-slate-200 leading-relaxed">
                {factAnalysis}
              </div>
              {factSources.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1">
                  <div className="font-semibold text-slate-600 dark:text-slate-400">
                    Grounded Web Sources:
                  </div>
                  <ul className="space-y-1">
                    {factSources.map((src, i) => (
                      <li key={i}>
                        <a
                          href={src.uri}
                          target="_blank"
                          rel="noreferrer"
                          className="text-sky-700 dark:text-sky-300 hover:underline inline-flex items-center gap-1"
                        >
                          {src.title} <ExternalLink className="w-3 h-3" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
