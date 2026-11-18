import { Mic, Search, Sparkles } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshGeoData';
import {
  GOVERNMENT_SERVICES,
  INTERPRETER_DIRECTORY,
  LAWYER_DIRECTORY,
  POLICY_TRACKER_ITEMS,
} from '../../data/civicDataset';

interface SearchResultItem {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  action: () => void;
}

// Typo-tolerant character similarity score (handles minor misspellings cleanly)
function fuzzyScore(query: string, target: string): number {
  const q = query.toLowerCase().trim();
  const t = target.toLowerCase();
  if (!q) return 0;
  if (t.includes(q)) return 100;
  const words = q.split(/\s+/);
  let matched = 0;
  for (const w of words) {
    if (t.includes(w)) {
      matched += 1;
    } else if (w.length >= 4) {
      // Check 1-edit / prefix tolerance
      const prefix = w.slice(0, Math.max(3, w.length - 2));
      if (t.includes(prefix)) matched += 0.65;
    }
  }
  return matched > 0 ? Math.round((matched / words.length) * 80) : 0;
}

export function UniversalSearchBar() {
  const {
    language,
    events,
    initiatives,
    newsItems,
    setActiveView,
    setSelectedServiceId,
    setSelectedDistrictId,
    openSphereWithPrompt,
  } = useCivic();

  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [listening, setListening] = useState(false);

  const results = useMemo<SearchResultItem[]>(() => {
    const q = query.trim();
    if (!q) return [];

    const pool: Array<{ score: number; item: SearchResultItem }> = [];

    GOVERNMENT_SERVICES.forEach((s) => {
      const score = fuzzyScore(
        q,
        `${s.titleEn} ${s.titleBn} ${s.summaryEn} ${s.categoryLabelEn} nid birth allowance krishok gd`,
      );
      if (score >= 40) {
        pool.push({
          score,
          item: {
            id: `svc_${s.id}`,
            type: 'Government Service',
            title: language === 'bn' ? s.titleBn : s.titleEn,
            subtitle: `${s.officeEn} · Helpline ${s.helpline || '333'}`,
            action: () => {
              setSelectedServiceId(s.id);
              setActiveView('services');
              setFocused(false);
            },
          },
        });
      }
    });

    BANGLADESH_DISTRICTS.forEach((d) => {
      const score = fuzzyScore(
        q,
        `${d.nameEn} ${d.nameBn} ${d.divisionEn} ${d.upazilas.join(' ')} hospital police municipality`,
      );
      if (score >= 45) {
        pool.push({
          score,
          item: {
            id: `dist_${d.id}`,
            type: 'District & Municipality',
            title: `${d.nameEn} (${d.nameBn})`,
            subtitle: `${d.divisionEn} Division · ${d.municipalityType} · ${d.offices.length} Public Offices`,
            action: () => {
              setSelectedDistrictId(d.id);
              setActiveView('map');
              setFocused(false);
            },
          },
        });
      }
    });

    LAWYER_DIRECTORY.forEach((l) => {
      const score = fuzzyScore(q, `${l.name} ${l.specialties.join(' ')} ${l.district} lawyer legal`);
      if (score >= 45) {
        pool.push({
          score,
          item: {
            id: `law_${l.id}`,
            type: 'Verified Lawyer',
            title: l.name,
            subtitle: `${l.district} · ${l.specialties[0]}`,
            action: () => {
              setActiveView('legal');
              setFocused(false);
            },
          },
        });
      }
    });

    events.forEach((e) => {
      const score = fuzzyScore(q, `${e.titleEn} ${e.titleBn} ${e.category} ${e.district}`);
      if (score >= 45) {
        pool.push({
          score,
          item: {
            id: `ev_${e.id}`,
            type: 'Community Event',
            title: e.titleEn,
            subtitle: `${e.date} · ${e.district}`,
            action: () => {
              setActiveView('events');
              setFocused(false);
            },
          },
        });
      }
    });

    initiatives.forEach((initItem) => {
      const score = fuzzyScore(q, `${initItem.title} ${initItem.category} ${initItem.location}`);
      if (score >= 45) {
        pool.push({
          score,
          item: {
            id: `in_${initItem.id}`,
            type: 'Citizen Initiative',
            title: initItem.title,
            subtitle: `${initItem.location} · ${initItem.supporters} supporters`,
            action: () => {
              setActiveView('voice');
              setFocused(false);
            },
          },
        });
      }
    });

    POLICY_TRACKER_ITEMS.forEach((p) => {
      const score = fuzzyScore(q, `${p.titleEn} ${p.titleBn} ${p.ministry}`);
      if (score >= 45) {
        pool.push({
          score,
          item: {
            id: `pol_${p.id}`,
            type: 'Law & Policy',
            title: p.titleEn,
            subtitle: `${p.stage} · ${p.ministry}`,
            action: () => {
              setActiveView('voice');
              setFocused(false);
            },
          },
        });
      }
    });

    newsItems.forEach((n) => {
      const score = fuzzyScore(q, `${n.titleEn} ${n.titleBn} ${n.category} ${n.district}`);
      if (score >= 45) {
        pool.push({
          score,
          item: {
            id: `news_${n.id}`,
            type: 'Civic News',
            title: n.titleEn,
            subtitle: `${n.category} · ${n.publishedAt}`,
            action: () => {
              setActiveView('news');
              setFocused(false);
            },
          },
        });
      }
    });

    INTERPRETER_DIRECTORY.forEach((it) => {
      const score = fuzzyScore(q, `${it.name} ${it.languages} ${it.specialties} sign bdsl disability`);
      if (score >= 45) {
        pool.push({
          score,
          item: {
            id: `int_${it.id}`,
            type: 'Accessibility Resource',
            title: it.name,
            subtitle: `${it.region} · ${it.languages}`,
            action: () => {
              setActiveView('signtalk');
              setFocused(false);
            },
          },
        });
      }
    });

    return pool
      .sort((a, b) => b.score - a.score)
      .slice(0, 8)
      .map((p) => p.item);
  }, [
    events,
    initiatives,
    language,
    newsItems,
    query,
    setActiveView,
    setSelectedDistrictId,
    setSelectedServiceId,
  ]);

  const handleVoiceSearch = () => {
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
    if (!SR) return;
    const rec = new SR();
    rec.lang = language === 'bn' ? 'bn-BD' : 'en-US';
    setListening(true);
    rec.onresult = (e) => {
      const t = e.results[0]?.[0]?.transcript || '';
      if (t) {
        setQuery(t);
        setFocused(true);
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => setListening(false);
    rec.start();
  };

  return (
    <div className="relative w-full">
      <div className="glass-panel rounded-2xl p-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <div className="flex-1 flex items-center gap-2.5 px-3">
          <Search className="w-5 h-5 text-emerald-600 dark:text-emerald-300 shrink-0" />
          <input
            type="text"
            value={query}
            onFocus={() => setFocused(true)}
            onChange={(e) => {
              setQuery(e.target.value);
              setFocused(true);
            }}
            placeholder={
              language === 'bn'
                ? 'এনআইডি, জন্ম নিবন্ধন, ৬৪ জেলা, হাসপাতাল, আইনজীবী বা ইশারা ভাষা খুঁজুন...'
                : 'Search Everything: NID, Birth Certificate, 64 Districts, Hospitals, Lawyers, Events, Sign Language...'
            }
            className="w-full py-2.5 text-sm bg-transparent text-slate-900 dark:text-white placeholder:text-slate-500 dark:placeholder:text-slate-400 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 px-1">
          <button
            type="button"
            onClick={handleVoiceSearch}
            aria-label="Voice search"
            className={`inline-flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium rounded-xl transition-colors ${
              listening
                ? 'bg-rose-600 text-white'
                : 'bg-slate-100/90 dark:bg-white/10 text-slate-700 dark:text-slate-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/60'
            }`}
          >
            <Mic className="w-4 h-4" />
            {listening ? 'Listening' : 'Voice'}
          </button>
          <button
            type="button"
            onClick={() => openSphereWithPrompt(query.trim() || 'How can I make a National ID?')}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl shadow-md shadow-emerald-900/15 transition-all whitespace-nowrap"
          >
            <Sparkles className="w-4 h-4" />
            Ask Sphere AI
          </button>
        </div>
      </div>

      {/* Live Search Results Dropdown */}
      {focused && query.trim().length > 0 && (
        <div className="absolute left-0 right-0 mt-2 z-40 glass-panel rounded-2xl p-2 shadow-2xl max-h-96 overflow-y-auto">
          {results.length > 0 ? (
            <div className="divide-y divide-slate-200/60 dark:divide-emerald-900/50">
              {results.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={item.action}
                  className="w-full text-left px-3.5 py-2.5 rounded-xl hover:bg-emerald-50/80 dark:hover:bg-emerald-950/50 transition-colors flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {item.subtitle}
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-emerald-700 dark:text-emerald-300 shrink-0">
                    {item.type}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="p-4 text-xs text-slate-600 dark:text-slate-300 flex items-center justify-between gap-3">
              <span>No exact match in local directory for &ldquo;{query}&rdquo;.</span>
              <button
                type="button"
                onClick={() => {
                  setFocused(false);
                  openSphereWithPrompt(query);
                }}
                className="px-3 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shrink-0"
              >
                Ask Sphere AI Instead
              </button>
            </div>
          )}
          <div className="pt-1 flex justify-end">
            <button
              type="button"
              onClick={() => setFocused(false)}
              className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-900 dark:hover:text-white"
            >
              Close results
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
