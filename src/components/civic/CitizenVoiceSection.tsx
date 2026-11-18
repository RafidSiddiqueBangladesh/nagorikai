import {
  CheckCircle2,
  Coins,
  FileText,
  MessageSquare,
  Plus,
  ShieldAlert,
  ThumbsUp,
  Vote,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshGeoData';
import { POLICY_TRACKER_ITEMS } from '../../data/civicDataset';
import type { BudgetSector } from '../../types/civicsphere';

type VoiceTab = 'polls' | 'budget' | 'raise-voice' | 'initiatives' | 'policies';

const BUDGET_SECTORS: Array<{ id: BudgetSector; en: string; bn: string }> = [
  { id: 'Roads', en: 'Roads', bn: 'সড়ক ও ফুটপাত' },
  { id: 'Schools', en: 'Schools', bn: 'স্কুল ও শিক্ষা' },
  { id: 'Drainage', en: 'Drainage', bn: 'ড্রেনেজ ও জলাবদ্ধতা' },
  { id: 'Hospitals', en: 'Hospitals', bn: 'হাসপাতাল ও ক্লিনিক' },
  { id: 'Parks', en: 'Parks', bn: 'পার্ক ও পরিবেশ' },
];

export function CitizenVoiceSection({ compact = false }: { compact?: boolean }) {
  const {
    language,
    polls,
    votedPollIds,
    castVote,
    addPollComment,
    budgetProposals,
    voteBudgetProposal,
    submitBudgetProposal,
    voicePosts,
    submitVoicePost,
    supportVoicePost,
    initiatives,
    submitInitiative,
    supportInitiative,
    user,
    setActiveView,
  } = useCivic();

  const isBn = language === 'bn';
  const [tab, setTab] = useState<VoiceTab>('polls');
  const [voteFeedback, setVoteFeedback] = useState<Record<string, string>>({});
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});

  // Participatory Budgeting state
  const [budgetSectorFilter, setBudgetSectorFilter] = useState<'All' | BudgetSector>('All');
  const [budSector, setBudSector] = useState<BudgetSector>('Roads');
  const [budDistrict, setBudDistrict] = useState(user.district || 'Dhaka');
  const [budTitle, setBudTitle] = useState('');
  const [budDesc, setBudDesc] = useState('');
  const [budCrore, setBudCrore] = useState('1.5');

  // Raise Your Voice form
  const [voiceTitle, setVoiceTitle] = useState('');
  const [voiceBody, setVoiceBody] = useState('');
  const [voiceDistrict, setVoiceDistrict] = useState('Dhaka');
  const [voiceCategory, setVoiceCategory] = useState('Community Problem');
  const [voiceVisibility, setVoiceVisibility] = useState<'public' | 'pseudonymous' | 'confidential'>('pseudonymous');

  // Initiative form
  const [initTitle, setInitTitle] = useState('');
  const [initProblem, setInitProblem] = useState('');
  const [initSolution, setInitSolution] = useState('');
  const [initLocation, setInitLocation] = useState('Dhaka');
  const [initCat, setInitCat] = useState('Accessibility & Inclusion');
  const [initDoc, setInitDoc] = useState('');

  const sectorShares = useMemo(() => {
    const totals: Record<BudgetSector, number> = {
      Roads: 0,
      Schools: 0,
      Drainage: 0,
      Hospitals: 0,
      Parks: 0,
    };
    let grand = 0;
    for (const p of budgetProposals) {
      totals[p.sector] = (totals[p.sector] || 0) + p.votes;
      grand += p.votes;
    }
    return BUDGET_SECTORS.map((sec) => ({
      ...sec,
      votes: totals[sec.id],
      pct: grand > 0 ? Math.round((totals[sec.id] / grand) * 100) : 20,
    }));
  }, [budgetProposals]);

  const filteredBudgetProposals = useMemo(() => {
    return budgetProposals.filter(
      (p) => budgetSectorFilter === 'All' || p.sector === budgetSectorFilter,
    );
  }, [budgetProposals, budgetSectorFilter]);

  const handleVote = async (pollId: string, optionId: string) => {
    const res = await castVote(pollId, optionId);
    setVoteFeedback((prev) => ({
      ...prev,
      [pollId]: res.ok
        ? isBn
          ? 'আপনার মতামত ভোটটি সফলভাবে সংরক্ষিত হয়েছে (+১৫ পয়েন্ট)।'
          : 'Your anonymous consultation vote has been recorded (+15 Civic Points).'
        : res.error || 'Unable to vote.',
    }));
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isBn
                ? 'নাগরিক কণ্ঠ — ডিজিটাল গণতন্ত্র, অংশগ্রহণমূলক বাজেট ও নীতি পর্যবেক্ষণ'
                : 'Citizen Voice — Digital Democracy & Participatory Budgeting'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {isBn
                ? 'জনমত জরিপে অংশ নিন, স্থানীয় উন্নয়ন বাজেটের অগ্রাধিকার নির্ধারণ করুন, এবং নাগরিক উদ্যোগ চালু করুন।'
                : 'Vote in anonymous consultations, prioritize local budget allocations, raise neighborhood concerns, and track policies in Bangla.'}
            </p>
          </div>
          {compact && (
            <button
              type="button"
              onClick={() => setActiveView('voice')}
              className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl transition-all"
            >
              {isBn ? 'সম্পূর্ণ গণতন্ত্র কেন্দ্র খুলুন' : 'Open Full Democracy Hub'}
            </button>
          )}
        </div>

        {/* Consultation Disclaimer */}
        <div className="px-3.5 py-2.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 text-xs text-amber-900 dark:text-amber-200 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            {isBn
              ? 'নাগরিক পরামর্শ বিজ্ঞপ্তি: এই জরিপ ও বাজেট ভোট পৌর ও জনসংলাপের মতামত পরিমাপ করে; এটি জাতীয় সংসদীয় নির্বাচনের বিকল্প নয়।'
              : 'Civic Consultation Notice: Platform polls & participatory budgets measure resident priorities for municipal dialogue, not statutory national elections.'}
          </span>
        </div>

        {/* Sub-tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl w-fit">
          {(
            [
              { id: 'polls', en: 'Anonymous Public Voting', bn: 'জনমত ভোট' },
              { id: 'budget', en: 'Participatory Budgeting', bn: 'অংশগ্রহণমূলক বাজেট' },
              { id: 'raise-voice', en: 'Raise Your Voice', bn: 'কণ্ঠ তুলুন' },
              { id: 'initiatives', en: 'Citizen Initiatives', bn: 'নাগরিক উদ্যোগ' },
              { id: 'policies', en: 'Policy Tracker', bn: 'নীতি ট্র্যাকার' },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                tab === t.id
                  ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {isBn ? t.bn : t.en}
            </button>
          ))}
        </div>

        {/* TAB 1: Anonymous Polls */}
        {tab === 'polls' && (
          <div className="gsap-stagger-grid grid grid-cols-1 lg:grid-cols-2 gap-5">
            {(compact ? polls.slice(0, 2) : polls).map((poll) => {
              const totalVotes = poll.options.reduce((s, o) => s + o.votes, 0);
              const hasVoted = votedPollIds.includes(poll.id);

              return (
                <article
                  key={poll.id}
                  className="civic-card-hover p-5 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/15 space-y-4"
                >
                  <div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {poll.category} · {isBn ? 'শেষ তারিখ' : 'Closes'} {poll.closesAt} ·{' '}
                      <span className="font-mono tabular-nums">
                        {totalVotes.toLocaleString()} {isBn ? 'ভোট' : 'votes'}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {isBn ? poll.questionBn : poll.questionEn}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5">
                      {isBn ? poll.backgroundBn : poll.backgroundEn}
                    </p>
                  </div>

                  {/* Supporting & Opposing Arguments */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                    <div className="p-3 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-900/60">
                      <div className="font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                        {isBn ? 'পক্ষে যুক্তি' : 'Supporting Arguments'}
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                        {poll.supportingArgs.map((arg, i) => (
                          <li key={i}>{arg}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-100/80 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
                      <div className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                        {isBn ? 'বিবেচ্য দিক' : 'Opposing Considerations'}
                      </div>
                      <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                        {poll.opposingArgs.map((arg, i) => (
                          <li key={i}>{arg}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Voting Options */}
                  <div className="space-y-2">
                    {poll.options.map((opt) => {
                      const pct = totalVotes > 0 ? Math.round((opt.votes / totalVotes) * 100) : 0;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          disabled={hasVoted}
                          onClick={() => handleVote(poll.id, opt.id)}
                          className="w-full text-left p-3 rounded-xl border border-slate-200 dark:border-emerald-500/20 bg-white/85 dark:bg-slate-950/60 hover:border-emerald-500 disabled:cursor-default relative overflow-hidden transition-colors"
                        >
                          <div
                            className="gsap-bar-fill absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500/20 to-sky-500/20 transition-all"
                            style={{ width: `${pct}%` }}
                          />
                          <div className="relative flex items-center justify-between gap-2 text-xs">
                            <span className="font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                              <Vote className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-300 shrink-0" />
                              {isBn ? opt.labelBn : opt.labelEn}
                            </span>
                            <span className="font-mono tabular-nums font-semibold text-emerald-700 dark:text-emerald-300 shrink-0">
                              {pct}% ({opt.votes})
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {voteFeedback[poll.id] && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {voteFeedback[poll.id]}
                    </p>
                  )}

                  {/* Discussion */}
                  <div className="pt-2 border-t border-slate-200/70 dark:border-slate-800 space-y-2">
                    <div className="text-xs font-semibold flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-sky-600" />
                      {isBn ? `উন্মুক্ত আলোচনা (${poll.comments.length})` : `Public Discussion (${poll.comments.length})`}
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={commentInputs[poll.id] || ''}
                        onChange={(e) =>
                          setCommentInputs((p) => ({ ...p, [poll.id]: e.target.value }))
                        }
                        placeholder={isBn ? 'আপনার মতামত লিখুন...' : 'Add constructive comment...'}
                        className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const txt = commentInputs[poll.id]?.trim();
                          if (!txt) return;
                          addPollComment(poll.id, txt);
                          setCommentInputs((p) => ({ ...p, [poll.id]: '' }));
                        }}
                        className="px-3 py-1.5 text-xs font-semibold bg-sky-700 text-white rounded-lg"
                      >
                        {isBn ? 'পোস্ট' : 'Post'}
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-24 overflow-y-auto">
                      {poll.comments.map((c) => (
                        <div key={c.id} className="text-xs text-slate-700 dark:text-slate-300">
                          <span className="font-semibold">{c.author}:</span> {c.text}
                        </div>
                      ))}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* TAB 2: Participatory Budgeting */}
        {tab === 'budget' && (
          <div className="space-y-5">
            {/* Live Community Allocation Bars across 5 sectors */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/20 space-y-3 text-xs">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Coins className="w-4 h-4 text-emerald-600" />
                  {isBn
                    ? 'ওয়ার্ড উন্নয়ন তহবিল নাগরিক অগ্রাধিকার (সড়ক, স্কুল, ড্রেনেজ, হাসপাতাল, পার্ক)'
                    : 'Resident Local Budget Prioritization (Roads, Schools, Drainage, Hospitals & Parks)'}
                </h3>
                <span className="font-mono text-emerald-700 dark:text-emerald-300 font-semibold">
                  {isBn ? 'মোট তহবিল: ৳১০.০ কোটি' : 'Pilot Ward Allocation: ৳10.0 Cr'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                {sectorShares.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() =>
                      setBudgetSectorFilter((prev) => (prev === s.id ? 'All' : s.id))
                    }
                    className={`p-3 rounded-xl border text-left transition-all space-y-1.5 ${
                      budgetSectorFilter === s.id
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500'
                        : 'bg-slate-50/80 dark:bg-slate-950/60 border-slate-200 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                      <span>{isBn ? s.bn : s.en}</span>
                      <span className="font-mono text-emerald-700 dark:text-emerald-300">
                        {s.pct}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full civic-gradient-bar rounded-full"
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                    <div className="text-[11px] font-mono text-slate-500">
                      {s.votes} {isBn ? 'ভোট' : 'votes'}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 text-xs">
              {/* Proposals list */}
              <div className="lg:col-span-7 space-y-3">
                {filteredBudgetProposals.map((prop) => (
                  <div
                    key={prop.id}
                    className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {isBn
                          ? BUDGET_SECTORS.find((b) => b.id === prop.sector)?.bn || prop.sector
                          : prop.sector}{' '}
                        · {prop.district}
                      </span>
                      <span className="font-mono font-bold">
                        {isBn ? `প্রাক্কলন: ৳${prop.estimatedCrore} কোটি` : `Est. ৳${prop.estimatedCrore} Cr`}
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                      {isBn ? prop.titleBn : prop.titleEn}
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300">
                      {isBn ? prop.descriptionBn : prop.descriptionEn}
                    </p>
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        {isBn ? 'প্রস্তাবক:' : 'Proposed by:'} {prop.proposedBy}
                      </span>
                      <button
                        type="button"
                        onClick={() => voteBudgetProposal(prop.id)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        {isBn ? `অগ্রাধিকার ভোট (${prop.votes})` : `Prioritize (${prop.votes})`}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Propose New Local Budget Project */}
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  if (!budTitle.trim() || !budDesc.trim()) return;
                  await submitBudgetProposal({
                    district: budDistrict,
                    sector: budSector,
                    titleEn: budTitle,
                    titleBn: budTitle,
                    descriptionEn: budDesc,
                    descriptionBn: budDesc,
                    estimatedCrore: Number(budCrore) || 1.2,
                  });
                  setBudTitle('');
                  setBudDesc('');
                }}
                className="lg:col-span-5 p-4 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-3 h-fit"
              >
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn ? 'নতুন বাজেট অগ্রাধিকার প্রস্তাব করুন' : 'Suggest a Local Budget Priority'}
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <select
                    aria-label={isBn ? 'খাত' : 'Budget sector'}
                    value={budSector}
                    onChange={(e) => setBudSector(e.target.value as BudgetSector)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  >
                    {BUDGET_SECTORS.map((s) => (
                      <option key={s.id} value={s.id}>
                        {isBn ? s.bn : s.en}
                      </option>
                    ))}
                  </select>
                  <select
                    aria-label={isBn ? 'জেলা' : 'District'}
                    value={budDistrict}
                    onChange={(e) => setBudDistrict(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  >
                    {BANGLADESH_DISTRICTS.slice(0, 16).map((d) => (
                      <option key={d.id} value={d.nameEn}>
                        {isBn ? d.nameBn : d.nameEn}
                      </option>
                    ))}
                  </select>
                </div>
                <input
                  type="text"
                  required
                  value={budTitle}
                  onChange={(e) => setBudTitle(e.target.value)}
                  placeholder={isBn ? 'প্রস্তাবিত প্রকল্পের নাম...' : 'Proposed neighborhood project title...'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  max="50"
                  value={budCrore}
                  onChange={(e) => setBudCrore(e.target.value)}
                  placeholder={isBn ? 'আনুমানিক ব্যয় (কোটি টাকা)' : 'Estimated cost (Crore BDT)'}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <textarea
                  rows={3}
                  required
                  value={budDesc}
                  onChange={(e) => setBudDesc(e.target.value)}
                  placeholder={
                    isBn
                      ? 'কেন এই প্রকল্পে অর্থ বরাদ্দ জরুরি তা লিখুন...'
                      : 'Explain why your neighborhood needs this funding...'
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 font-bold bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-xl"
                >
                  {isBn ? 'প্রস্তাব জমা দিন (+৩০ পয়েন্ট)' : 'Submit Budget Proposal (+30 Points)'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 3: Raise Your Voice */}
        {tab === 'raise-voice' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!voiceTitle.trim() || !voiceBody.trim()) return;
                await submitVoicePost({
                  visibility: voiceVisibility,
                  district: voiceDistrict,
                  category: voiceCategory,
                  title: voiceTitle,
                  body: voiceBody,
                });
                setVoiceTitle('');
                setVoiceBody('');
              }}
              className="lg:col-span-5 p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isBn ? 'জনস্বার্থে প্রশ্ন বা সমস্যা তুলুন' : 'Ask a Public Question or Raise an Issue'}
              </h3>
              <div className="grid grid-cols-2 gap-2">
                <select
                  aria-label="Visibility option"
                  value={voiceVisibility}
                  onChange={(e) =>
                    setVoiceVisibility(
                      e.target.value as 'public' | 'pseudonymous' | 'confidential',
                    )
                  }
                  className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  <option value="public">{isBn ? 'প্রকাশ্য নাম' : 'Public Name'}</option>
                  <option value="pseudonymous">{isBn ? 'ছদ্মনাম' : 'Pseudonymous'}</option>
                  <option value="confidential">{isBn ? 'গোপনীয়' : 'Confidential'}</option>
                </select>
                <input
                  type="text"
                  value={voiceDistrict}
                  onChange={(e) => setVoiceDistrict(e.target.value)}
                  placeholder={isBn ? 'জেলা' : 'District'}
                  className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <select
                aria-label="Issue category"
                value={voiceCategory}
                onChange={(e) => setVoiceCategory(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                <option>Community Problem</option>
                <option>Policy Suggestion</option>
                <option>Accessibility Barrier</option>
                <option>Public Healthcare</option>
                <option>Education &amp; Youth</option>
              </select>
              <input
                type="text"
                required
                value={voiceTitle}
                onChange={(e) => setVoiceTitle(e.target.value)}
                placeholder={isBn ? 'প্রশ্ন বা সমস্যার শিরোনাম...' : 'Question or concern headline...'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <textarea
                rows={3}
                required
                value={voiceBody}
                onChange={(e) => setVoiceBody(e.target.value)}
                placeholder={isBn ? 'বিস্তারিত লিখুন...' : 'Describe the concern or proposed policy improvement...'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-xl"
              >
                {isBn ? 'মতামত জমা দিন (+২০ পয়েন্ট)' : 'Submit Citizen Voice (+20 Points)'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {voicePosts.map((post) => (
                <div
                  key={post.id}
                  className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2"
                >
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {post.authorDisplay} · {post.district} · {post.category} · {post.status}
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">{post.title}</h4>
                  <p className="text-xs text-slate-700 dark:text-slate-300">{post.body}</p>
                  <button
                    type="button"
                    onClick={() => supportVoicePost(post.id)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-sky-50 dark:hover:bg-sky-900/40 rounded-lg"
                  >
                    <ThumbsUp className="w-3.5 h-3.5 text-sky-600" />
                    {isBn ? `সমর্থন (${post.supporters})` : `Support (${post.supporters})`}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Citizen Initiatives */}
        {tab === 'initiatives' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                if (!initTitle.trim() || !initProblem.trim() || !initSolution.trim()) return;
                await submitInitiative({
                  title: initTitle,
                  problem: initProblem,
                  solution: initSolution,
                  location: initLocation,
                  category: initCat,
                  attachmentNote: initDoc || undefined,
                });
                setInitTitle('');
                setInitProblem('');
                setInitSolution('');
                setInitDoc('');
              }}
              className="lg:col-span-5 p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-3"
            >
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-sky-600" />
                {isBn ? 'নাগরিক উদ্যোগ শুরু করুন' : 'Start a Citizen Initiative'}
              </h3>
              <input
                type="text"
                required
                value={initTitle}
                onChange={(e) => setInitTitle(e.target.value)}
                placeholder={isBn ? 'উদ্যোগের শিরোনাম...' : 'Initiative title...'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={initLocation}
                  onChange={(e) => setInitLocation(e.target.value)}
                  placeholder={isBn ? 'জেলা / উপজেলা' : 'District / Upazila'}
                  className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="text"
                  value={initCat}
                  onChange={(e) => setInitCat(e.target.value)}
                  placeholder={isBn ? 'বিভাগ' : 'Category'}
                  className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <textarea
                rows={2}
                required
                value={initProblem}
                onChange={(e) => setInitProblem(e.target.value)}
                placeholder={isBn ? 'সমস্যার বিবরণ...' : 'Problem description...'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <textarea
                rows={2}
                required
                value={initSolution}
                onChange={(e) => setInitSolution(e.target.value)}
                placeholder={isBn ? 'প্রস্তাবিত বাস্তবসম্মত সমাধান...' : 'Proposed practical solution...'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={initDoc}
                onChange={(e) => setInitDoc(e.target.value)}
                placeholder={isBn ? 'সহায়ক নথি (ঐচ্ছিক)' : 'Supporting document link (optional)'}
                className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                className="w-full py-2.5 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-xl"
              >
                {isBn ? 'উদ্যোগ চালু করুন (+৪০ পয়েন্ট)' : 'Launch Initiative (+40 Points)'}
              </button>
            </form>

            <div className="lg:col-span-7 space-y-3">
              {initiatives.map((item) => {
                const pct = Math.min(100, Math.round((item.supporters / item.targetSupporters) * 100));
                return (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2.5"
                  >
                    <div className="text-xs text-slate-500 dark:text-slate-400">
                      {item.category} · {item.location} · {item.progressStatus}
                    </div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {item.title}
                    </h4>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{isBn ? 'সমস্যা:' : 'Problem:'}</span> {item.problem}
                    </p>
                    <p className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{isBn ? 'সমাধান:' : 'Solution:'}</span> {item.solution}
                    </p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs font-mono tabular-nums">
                        <span>{item.supporters} supporters</span>
                        <span>Goal: {item.targetSupporters}</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div className="h-full bg-sky-600 rounded-full" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => supportInitiative(item.id)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-lg"
                    >
                      <ThumbsUp className="w-3.5 h-3.5" /> {isBn ? 'সমর্থন দিন' : 'Support Initiative'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: Policy Tracker */}
        {tab === 'policies' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {POLICY_TRACKER_ITEMS.map((pol) => (
              <div
                key={pol.id}
                className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2"
              >
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {pol.stage} · {pol.ministry} · {pol.updatedAt}
                </div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn ? pol.titleBn : pol.titleEn}
                </h3>
                <p className="text-xs font-bengali text-slate-700 dark:text-slate-300 leading-relaxed">
                  {pol.summaryBn}
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1 pt-1">
                  <FileText className="w-3.5 h-3.5 text-sky-600" /> {pol.summaryEn}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
