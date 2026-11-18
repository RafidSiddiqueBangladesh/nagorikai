import {
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  FileSearch,
  GitCommitHorizontal,
  Lock,
  Search,
  ShieldCheck,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshGeoData';
import { FOLLOW_THE_MONEY_DETAILS, TRANSPARENCY_PROJECTS } from '../../data/civicDataset';

export function TransparencySection({ compact = false }: { compact?: boolean }) {
  const { language, setActiveView, projectVerifications, submitProjectVerification } = useCivic();
  const isBn = language === 'bn';

  const [rankingMetric, setRankingMetric] = useState<
    'transparencyScore' | 'complaintResolutionRate' | 'satisfactionRating'
  >('transparencyScore');

  // Follow the Money active project
  const [activeProjectId, setActiveProjectId] = useState<string>('tp-1');
  const [verifyVerdict, setVerifyVerdict] = useState<'Confirmed Progress' | 'Needs Attention'>(
    'Confirmed Progress',
  );
  const [verifyNote, setVerifyNote] = useState('');
  const [verifySaved, setVerifySaved] = useState<string | null>(null);

  // Corruption Report Form
  const [repCategory, setRepCategory] = useState('Procurement / Tender Irregularity');
  const [repDistrict, setRepDistrict] = useState('Dhaka');
  const [repOffice, setRepOffice] = useState('');
  const [repSummary, setRepSummary] = useState('');
  const [repFileName, setRepFileName] = useState('');
  const [repAnonymous, setRepAnonymous] = useState(true);
  const [repResult, setRepResult] = useState<{ referenceId: string; status: string } | null>(null);
  const [repError, setRepError] = useState<string | null>(null);

  // Report Lookup
  const [lookupRef, setLookupRef] = useState('');
  const [lookupData, setLookupData] = useState<{
    referenceId: string;
    category: string;
    district: string;
    status: string;
    submittedAt: string;
  } | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Appeal / Correction notice
  const [appealMsg, setAppealMsg] = useState<string | null>(null);

  const rankedMunicipalities = useMemo(() => {
    const sorted = [...BANGLADESH_DISTRICTS].sort((a, b) => {
      if (rankingMetric === 'satisfactionRating') {
        return b.dashboard.satisfactionRating - a.dashboard.satisfactionRating;
      }
      return b.dashboard[rankingMetric] - a.dashboard[rankingMetric];
    });
    return sorted.slice(0, compact ? 4 : 10);
  }, [compact, rankingMetric]);

  const activeMoneyTrail =
    FOLLOW_THE_MONEY_DETAILS[activeProjectId] || FOLLOW_THE_MONEY_DETAILS['tp-1'];
  const activeProject =
    TRANSPARENCY_PROJECTS.find((p) => p.id === activeProjectId) || TRANSPARENCY_PROJECTS[0];
  const activeProjectNotes = useMemo(
    () => projectVerifications.filter((v) => v.projectId === activeProjectId),
    [activeProjectId, projectVerifications],
  );

  const handleVerifyProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyNote.trim()) return;
    await submitProjectVerification(activeProjectId, {
      verdict: verifyVerdict,
      note: verifyNote,
    });
    setVerifyNote('');
    setVerifySaved(
      isBn
        ? 'আপনার মাঠ পর্যায় যাচাই নোট যুক্ত হয়েছে (+২৫ পয়েন্ট)।'
        : 'Citizen field verification logged (+25 Civic Points).',
    );
  };

  const handleSubmitCorruptionReport = async (e: React.FormEvent) => {
    e.preventDefault();
    setRepError(null);
    try {
      const res = await fetch('/api/civic/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: repCategory,
          district: repDistrict,
          officeName: repOffice,
          summary: repSummary,
          evidenceFileName: repFileName || undefined,
          anonymous: repAnonymous,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRepError(data.error || 'Could not submit report.');
        return;
      }
      setRepResult({ referenceId: data.referenceId, status: data.status });
      setRepOffice('');
      setRepSummary('');
      setRepFileName('');
    } catch {
      setRepError('Network error submitting confidential report.');
    }
  };

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError(null);
    setLookupData(null);
    if (!lookupRef.trim()) return;
    const res = await fetch(`/api/civic/reports/${encodeURIComponent(lookupRef.trim())}`);
    const data = await res.json();
    if (!res.ok) {
      setLookupError(data.error || 'Reference ID not found.');
      return;
    }
    setLookupData(data);
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isBn
                ? 'স্বচ্ছতা, সরকারি অর্থের হিসাব (Follow the Money) ও জেলা র‍্যাঙ্কিং'
                : 'Follow the Money, Public Works Audit & Municipality Rankings'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {isBn
                ? 'বাজেট বরাদ্দ থেকে ই-জিপি টেন্ডার, নির্মাণ কিস্তি, সমাপ্তি এবং স্বাধীন অডিট পর্যন্ত প্রতিটি ধাপ অনুসরণ করুন।'
                : 'Follow public development projects from budget allocation to e-GP procurement, construction tranches, completion, and independent audit.'}
            </p>
          </div>
          {compact && (
            <button
              type="button"
              onClick={() => setActiveView('transparency')}
              className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-xl"
            >
              {isBn ? 'সম্পূর্ণ স্বচ্ছতা পোর্টাল দেখুন' : 'Open Full Transparency Portal'}
            </button>
          )}
        </div>

        {/* Feature 5: Follow the Money Interactive 5-Stage Lifecycle Tracker */}
        <div className="p-5 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-emerald-500/20 space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
                <GitCommitHorizontal className="w-4 h-4" />
                {isBn ? 'অর্থ প্রবাহ অনুসরণ (Follow the Money)' : 'Follow the Money — 5-Stage Public Audit Trail'}
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-0.5">
                {isBn ? activeProject.titleBn : activeProject.titleEn}
              </h3>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                {activeMoneyTrail.eGpTenderId} · {activeMoneyTrail.contractor} · {activeProject.district}
              </div>
            </div>

            <select
              aria-label={isBn ? 'প্রকল্প নির্বাচন' : 'Select project to trace'}
              value={activeProjectId}
              onChange={(e) => setActiveProjectId(e.target.value)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 font-semibold"
            >
              {TRANSPARENCY_PROJECTS.filter((p) => FOLLOW_THE_MONEY_DETAILS[p.id]).map((p) => (
                <option key={p.id} value={p.id}>
                  {isBn ? p.titleBn : p.titleEn} ({p.district})
                </option>
              ))}
            </select>
          </div>

          {/* 5-Stage Lifecycle Stepper */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {activeMoneyTrail.stages.map((st, idx) => (
              <div
                key={st.stageKey}
                className={`p-3.5 rounded-xl border space-y-1.5 ${
                  st.status === 'Completed'
                    ? 'bg-emerald-50/75 dark:bg-emerald-950/30 border-emerald-300 dark:border-emerald-700'
                    : st.status === 'Active'
                      ? 'bg-sky-50/80 dark:bg-sky-950/40 border-sky-400 dark:border-sky-600'
                      : 'bg-slate-50/80 dark:bg-slate-950/50 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="font-bold">0{idx + 1}</span>
                  <span
                    className={`px-2 py-0.5 rounded-md font-sans font-semibold ${
                      st.status === 'Completed'
                        ? 'bg-emerald-600 text-white'
                        : st.status === 'Active'
                          ? 'bg-sky-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {st.status}
                  </span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {isBn ? st.titleBn : st.titleEn}
                </div>
                <div className="font-mono text-sm font-bold text-emerald-700 dark:text-emerald-300">
                  {st.amountCrore}
                </div>
                <div className="text-[11px] text-slate-500">{st.date}</div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn ? st.detailBn : st.detailEn}
                </p>
              </div>
            ))}
          </div>

          {/* Citizen Field Verification Log */}
          {!compact && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 pt-3 border-t border-slate-200 dark:border-slate-800">
              <form onSubmit={handleVerifyProject} className="lg:col-span-6 space-y-2.5">
                <div className="font-bold text-slate-900 dark:text-white">
                  {isBn ? 'নাগরিক মাঠ পর্যায় পর্যবেক্ষণ যোগ করুন' : 'Add Citizen Field Verification Note'}
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setVerifyVerdict('Confirmed Progress')}
                    className={`flex-1 py-2 rounded-xl font-semibold border ${
                      verifyVerdict === 'Confirmed Progress'
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isBn ? 'কাজের অগ্রগতি সঠিক' : 'Confirmed Progress'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setVerifyVerdict('Needs Attention')}
                    className={`flex-1 py-2 rounded-xl font-semibold border ${
                      verifyVerdict === 'Needs Attention'
                        ? 'bg-amber-600 text-white border-amber-600'
                        : 'bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isBn ? 'সংশোধন প্রয়োজন' : 'Needs Attention'}
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    value={verifyNote}
                    onChange={(e) => setVerifyNote(e.target.value)}
                    placeholder={
                      isBn
                        ? 'মাঠ পর্যায়ে কী দেখলেন লিখুন (যেমন: র‍্যাম্প ও ড্রেন ঢাকনা)...'
                        : 'Share physical site observation...'
                    }
                    className="flex-1 px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl"
                  >
                    {isBn ? 'জমা দিন' : 'Verify'}
                  </button>
                </div>
                {verifySaved && (
                  <p className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {verifySaved}
                  </p>
                )}
              </form>

              <div className="lg:col-span-6 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  {isBn ? 'সাম্প্রতিক নাগরিক যাচাই প্রতিবেদন' : 'Recent Citizen Field Verifications'}
                </div>
                {activeProjectNotes.length === 0 ? (
                  <p className="text-slate-500">
                    {isBn ? 'এই প্রকল্পে প্রথম যাচাই নোট যোগ করুন।' : 'Be the first citizen to submit a field observation for this project.'}
                  </p>
                ) : (
                  activeProjectNotes.map((note) => (
                    <div
                      key={note.id}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                    >
                      <div className="font-semibold text-emerald-700 dark:text-emerald-300">
                        {note.citizenName} ({note.district}) · {note.verdict} · {note.createdAt}
                      </div>
                      <p className="text-slate-700 dark:text-slate-300 mt-0.5">{note.note}</p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Published Methodology & Fairness Rules */}
        <div className="p-3.5 rounded-xl bg-slate-100/80 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 space-y-1">
          <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-sky-600" />
            {isBn ? 'প্রকাশিত মূল্যায়ন পদ্ধতি ও ন্যায্যতা নিয়ম' : 'Published Scoring Methodology & Evidence Rules'}
          </div>
          <p>
            {isBn
              ? 'র‍্যাঙ্কিংয়ে বাজেট প্রকাশ (৩০%), ই-জিপি উন্মুক্ততা (২৫%), অভিযোগ সমাধান (২৫%) এবং নাগরিক সন্তুষ্টি (২০%) বিবেচিত হয়।'
              : 'Rankings weigh Budget Disclosure (30%), Procurement Openness (25%), Complaint Resolution Rate (25%), and Citizen Service Satisfaction (20%). Unverified allegations never alter official scores.'}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Municipality Comparison Chart & Rankings */}
          <div className="lg:col-span-6 p-5 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/15 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <BarChart3 className="w-4 h-4 text-emerald-600 dark:text-emerald-300" />
                {isBn ? 'জেলা ও পৌর স্বচ্ছতা র‍্যাঙ্কিং' : 'District & Municipality Rankings'}
              </h3>
              <select
                aria-label="Ranking metric"
                value={rankingMetric}
                onChange={(e) =>
                  setRankingMetric(
                    e.target.value as
                      | 'transparencyScore'
                      | 'complaintResolutionRate'
                      | 'satisfactionRating',
                  )
                }
                className="px-2.5 py-1 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-emerald-500/20"
              >
                <option value="transparencyScore">Transparency Index (/100)</option>
                <option value="complaintResolutionRate">Complaint Resolution (%)</option>
                <option value="satisfactionRating">Citizen Satisfaction (/5.0)</option>
              </select>
            </div>

            <div className="space-y-3">
              {rankedMunicipalities.map((m, idx) => {
                const val = m.dashboard[rankingMetric];
                const pct =
                  rankingMetric === 'satisfactionRating' ? (val / 5) * 100 : val;
                return (
                  <div
                    key={m.id}
                    className="p-3.5 rounded-xl bg-slate-50/90 dark:bg-slate-950/60 border border-slate-200/70 dark:border-white/10 space-y-2.5 text-xs"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0 ${
                            idx < 3
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                          }`}
                        >
                          #{idx + 1}
                        </span>
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 dark:text-white truncate">
                            {isBn ? m.nameBn : m.nameEn} · {m.municipalityType}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {isBn ? m.divisionBn : m.divisionEn}
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-mono text-base font-bold tabular-nums text-emerald-700 dark:text-emerald-300">
                          {val}
                          {rankingMetric === 'satisfactionRating' ? '/5' : '%'}
                        </div>
                      </div>
                    </div>

                    <div className="h-2.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="gsap-bar-fill h-full rounded-full civic-gradient-bar"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
              <span>{isBn ? 'সর্বশেষ নিরীক্ষা: ২০২৬-১১-১৫' : 'Last rubric audit: 2026-11-15'}</span>
              <button
                type="button"
                onClick={() =>
                  setAppealMsg(
                    isBn
                      ? 'স্বাধীন অডিটের জন্য তথ্য সংশোধন আবেদন নথিভুক্ত হয়েছে।'
                      : 'Municipality data correction & appeal request logged for independent audit verification.',
                  )
                }
                className="text-emerald-700 dark:text-emerald-300 font-semibold hover:underline"
              >
                {isBn ? 'তথ্য সংশোধনের আবেদন' : 'Request Score Correction / Appeal'}
              </button>
            </div>
            {appealMsg && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400">{appealMsg}</p>
            )}
          </div>

          {/* Public Projects & Expenditure */}
          <div className="lg:col-span-6 space-y-3">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileSearch className="w-4 h-4 text-sky-600" />
              {isBn ? 'সরকারি উন্নয়ন প্রকল্প ও ব্যয়' : 'Public Works Budget & Audit Tracker'}
            </h3>
            {TRANSPARENCY_PROJECTS.slice(0, compact ? 3 : 4).map((proj) => (
              <div
                key={proj.id}
                onClick={() => {
                  if (FOLLOW_THE_MONEY_DETAILS[proj.id]) setActiveProjectId(proj.id);
                }}
                className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 cursor-pointer text-xs space-y-1.5 transition-colors"
              >
                <div className="flex items-center justify-between gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                  <span>
                    {proj.district} · {proj.procurementMethod}
                  </span>
                  <span className="font-mono tabular-nums">{proj.lastUpdated}</span>
                </div>
                <div className="font-bold text-slate-900 dark:text-white">
                  {isBn ? proj.titleBn : proj.titleEn}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  <span>{isBn ? `বরাদ্দ: ৳${proj.allocatedCrore} কোটি` : `Allocated: ৳${proj.allocatedCrore} Cr`}</span>
                  <span>{isBn ? `ব্যয়: ৳${proj.verifiedExpenditureCrore} কোটি` : `Spent: ৳${proj.verifiedExpenditureCrore} Cr`}</span>
                  <span>
                    {proj.status} ({proj.completionPct}%)
                  </span>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-400">
                  {proj.auditNote}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Confidential Corruption Reporting & Reference Lookup */}
        {!compact && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-3 border-t border-slate-200/70 dark:border-slate-800">
            <form
              onSubmit={handleSubmitCorruptionReport}
              className="lg:col-span-7 p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-sky-600" />
                  {isBn ? 'গোপনীয় দুর্নীতি প্রতিরোধ প্রতিবেদন' : 'Confidential Anti-Corruption Report'}
                </h3>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">
                  ACC Helpline: 106
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <select
                  aria-label="Report category"
                  value={repCategory}
                  onChange={(e) => setRepCategory(e.target.value)}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  <option>Procurement / Tender Irregularity</option>
                  <option>Bribery Request for Public Service</option>
                  <option>Delayed / Incomplete Public Project</option>
                  <option>Social Allowance Diversion</option>
                </select>
                <input
                  type="text"
                  value={repDistrict}
                  onChange={(e) => setRepDistrict(e.target.value)}
                  placeholder={isBn ? 'জেলা' : 'District'}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <input
                type="text"
                required
                value={repOffice}
                onChange={(e) => setRepOffice(e.target.value)}
                placeholder={isBn ? 'দপ্তর বা প্রকল্পের নাম...' : 'Office or project name...'}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <textarea
                rows={3}
                required
                value={repSummary}
                onChange={(e) => setRepSummary(e.target.value)}
                placeholder={isBn ? 'তথ্যপ্রমাণ ও ঘটনার বিবরণ...' : 'Factual description, dates, and evidence details...'}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <span>{isBn ? 'প্রমাণ ফাইল:' : 'Evidence File:'}</span>
                  <input
                    type="file"
                    onChange={(e) => setRepFileName(e.target.files?.[0]?.name || '')}
                    className="text-[11px]"
                  />
                </label>
                <label className="inline-flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={repAnonymous}
                    onChange={(e) => setRepAnonymous(e.target.checked)}
                  />
                  {isBn ? 'বেনামে জমা দিন' : 'Submit Anonymously'}
                </label>
              </div>
              <button
                type="submit"
                className="px-4 py-2 font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-xl"
              >
                {isBn ? 'গোপনীয় প্রতিবেদন জমা দিন' : 'Submit Confidential Report'}
              </button>
              {repError && <p className="text-rose-600">{repError}</p>}
              {repResult && (
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200">
                  <CheckCircle2 className="w-4 h-4 inline mr-1" />
                  Reference ID: <span className="font-mono font-bold">{repResult.referenceId}</span> ({repResult.status})
                </div>
              )}
            </form>

            <div className="lg:col-span-5 p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 text-xs">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Search className="w-4 h-4 text-sky-600" />
                {isBn ? 'রেফারেন্স নম্বর দিয়ে অবস্থা জানুন' : 'Track Report Reference Status'}
              </h3>
              <form onSubmit={handleLookup} className="flex gap-2">
                <input
                  type="text"
                  value={lookupRef}
                  onChange={(e) => setLookupRef(e.target.value)}
                  placeholder="CS-ACC-XXXXXX"
                  className="flex-1 px-3 py-2 font-mono rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-lg"
                >
                  {isBn ? 'যাচাই' : 'Check'}
                </button>
              </form>
              {lookupError && <p className="text-rose-600">{lookupError}</p>}
              {lookupData && (
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-950 space-y-1">
                  <div className="font-mono font-bold">{lookupData.referenceId}</div>
                  <div>Status: {lookupData.status}</div>
                  <div>
                    {lookupData.category} · {lookupData.district} · {lookupData.submittedAt}
                  </div>
                </div>
              )}

              <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-1 text-slate-600 dark:text-slate-300">
                <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  {isBn ? 'হুইসেলব্লোয়ার সুরক্ষা' : 'Whistleblower Protection'}
                </div>
                <p>
                  {isBn
                    ? 'ই-জিপি টেন্ডার নম্বর ও রশিদ সংরক্ষণ করুন অথবা সরাসরি দুদক ১০৬ নম্বরে কল করুন।'
                    : 'Keep e-GP tender IDs and receipts, or contact the Anti-Corruption Commission directly at 106.'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
