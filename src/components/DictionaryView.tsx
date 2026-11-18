import { Camera, Play, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { ALL_BDSL_SIGNS, HAND_SHAPE_MAP } from '../data/bdslDataset';
import type { BdslSign, SignCategory } from '../types/signtalk';

interface DictionaryViewProps {
  initialCategory?: SignCategory | 'All';
  onExplainSign: (sign: BdslSign) => void;
  onPracticeSign: (sign: BdslSign) => void;
}

const CATEGORIES: Array<SignCategory | 'All'> = [
  'All',
  'Medical & Care',
  'Legal & Advisory',
  'Family & People',
  'Time & Days',
  'Pronouns & Questions',
  'Actions & Verbs',
  'Feelings & Qualities',
  'Objects & Home',
  'Media & Tech',
  'Numbers',
  'Alphabets',
  'Hand Shapes',
];

export function DictionaryView({
  initialCategory = 'All',
  onExplainSign,
  onPracticeSign,
}: DictionaryViewProps) {
  const [category, setCategory] = useState<SignCategory | 'All'>(initialCategory);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ALL_BDSL_SIGNS.filter((item) => {
      if (category !== 'All' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.bangla.toLowerCase().includes(q) ||
        item.english.toLowerCase().includes(q) ||
        item.pdfDescription.toLowerCase().includes(q) ||
        item.synonyms.some((s) => s.toLowerCase().includes(q))
      );
    });
  }, [category, search]);

  return (
    <div className="flex flex-col h-full bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 rounded-xl overflow-hidden">
      {/* Header & Search */}
      <div className="p-4 border-b border-slate-200 dark:border-white/10 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Bangla Sign Language (BdSL) Lexicon
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 tabular-nums">
              {filtered.length} signs shown · 33 Hand Shapes, Numbers ০–১ কোটি, A–Z, Medical, Legal &amp; Daily Vocabulary
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search Bangla or English sign..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-white/10 rounded-lg text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-slate-900"
            />
          </div>
        </div>

        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategory(cat)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                category === cat
                  ? 'bg-slate-900 dark:bg-sky-600 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Signs Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        {filtered.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-medium text-slate-600 dark:text-slate-300">No matching signs found</p>
            <p className="text-xs text-slate-400 mt-1">Try another Bangla or English keyword.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {filtered.map((sign) => {
              const shape = HAND_SHAPE_MAP.get(sign.rightHand.shapeId);
              return (
                <div
                  key={sign.id}
                  className="p-4 border border-slate-200 dark:border-white/10 rounded-lg bg-white dark:bg-slate-800/70 hover:border-slate-300 dark:hover:border-white/20 transition-colors flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-baseline justify-between gap-2">
                      <h3 className="text-base font-bengali font-bold text-slate-900 dark:text-white">
                        {sign.bangla}
                      </h3>
                      <span className="text-[11px] font-mono text-slate-400 tabular-nums shrink-0">
                        Shape #{sign.rightHand.shapeId}
                      </span>
                    </div>
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-300 mt-0.5">
                      {sign.english} · {sign.category}
                    </p>
                    <p className="text-xs font-bengali text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                      {sign.pdfDescription}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1.5">
                      Shape #{sign.rightHand.shapeId} ({shape?.banglaName}) · Palm: {sign.rightHand.palm} · Zone: {sign.rightHand.zone}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-white/10">
                    <button
                      type="button"
                      onClick={() => onExplainSign(sign)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors whitespace-nowrap"
                    >
                      <Play className="w-3.5 h-3.5" />
                      Explain 3D
                    </button>
                    <button
                      type="button"
                      onClick={() => onPracticeSign(sign)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-2.5 py-1.5 text-xs font-medium bg-slate-100 dark:bg-slate-700 text-slate-800 dark:text-slate-100 rounded-md hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors whitespace-nowrap"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      Practice
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
