import {
  CalendarCheck,
  CheckCircle2,
  FileText,
  Loader2,
  Lock,
  Scale,
  Shield,
} from 'lucide-react';
import { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { LAWYER_DIRECTORY } from '../../data/civicDataset';

interface LegalAiResult {
  disclaimer: string;
  summaryGuidance: string;
  nextSteps: string[];
  documentChecklist: string[];
  draftTemplate: string;
  supportContacts: string[];
}

export function LegalHelpSection({ compact = false }: { compact?: boolean }) {
  const { language, saveDocumentNote, setActiveView } = useCivic();

  const [helpType, setHelpType] = useState<
    'rights-guidance' | 'gd-draft' | 'police-complaint' | 'checklist'
  >('gd-draft');
  const [situation, setSituation] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [legalResult, setLegalResult] = useState<LegalAiResult | null>(null);
  const [bookingLawyerId, setBookingLawyerId] = useState<string | null>(null);
  const [bookingNote, setBookingNote] = useState('');
  const [bookingConfirmed, setBookingConfirmed] = useState<string | null>(null);

  const handleGenerateGuidance = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!situation.trim()) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/civic/ai/legal-help', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ situation, helpType, language }),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Legal guidance assistant failed.');
        return;
      }
      setLegalResult(data.result as LegalAiResult);
    } catch {
      setErrorMsg('Network error reaching legal guidance service.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Legal Help &amp; Citizen Rights Center
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Prepare confidential GD drafts, police complaint outlines, document checklists, and connect with verified Legal Aid advocates (NLASO Helpline 16430).
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('signtalk')}
              className="px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-xl"
            >
              Open SignTalk Lawyer Call
            </button>
            {compact && (
              <button
                type="button"
                onClick={() => setActiveView('legal')}
                className="px-3.5 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors"
              >
                Full Legal Center
              </button>
            )}
          </div>
        </div>

        {/* Legal Information vs Advice Notice */}
        <div className="px-3.5 py-2.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 text-xs text-slate-700 dark:text-slate-200 flex items-center gap-2">
          <Lock className="w-4 h-4 text-emerald-700 dark:text-emerald-300 shrink-0" />
          <span>
            Confidential &amp; Information-Only Notice: Conversations in this legal workspace are never published publicly. AI outputs provide structured legal information and draft templates—not formal legal representation by an enrolled advocate.
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Private Legal Draft & Rights Assistant */}
          <div className="lg:col-span-6 p-4 rounded-xl glass-subtle space-y-3">
            <div className="flex items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Scale className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Private Legal Preparation Assistant
              </h3>
              <img
                src="/src/assets/images/civic_legal_aid_1794946113104.jpg"
                alt="Citizen Legal Help Center"
                referrerPolicy="no-referrer"
                className="w-16 h-11 rounded-lg object-cover border border-slate-200 dark:border-slate-700"
              />
            </div>

            <div className="flex flex-wrap gap-1.5">
              {([
                { id: 'gd-draft', label: 'GD Draft' },
                { id: 'police-complaint', label: 'Police Complaint' },
                { id: 'rights-guidance', label: 'Citizen Rights' },
                { id: 'checklist', label: 'Document Checklist' },
              ] as const).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setHelpType(m.id)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                    helpType === m.id
                      ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950 font-semibold'
                      : 'bg-slate-100 dark:bg-white/10 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleGenerateGuidance} className="space-y-3">
              <textarea
                rows={3}
                required
                value={situation}
                onChange={(e) => setSituation(e.target.value)}
                placeholder="Describe your issue privately (e.g., lost NID/passport for GD, land boundary dispute, workplace unpaid wages, cyber harassment, domestic protection)..."
                className="w-full p-3 text-xs rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <button
                type="submit"
                disabled={loading || !situation.trim()}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 disabled:opacity-50 text-white rounded-xl transition-all"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileText className="w-4 h-4" />}
                Prepare Structured Guidance
              </button>
            </form>

            {errorMsg && (
              <p className="text-xs text-rose-600 dark:text-rose-400">{errorMsg}</p>
            )}

            {legalResult && (
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="font-semibold text-amber-800 dark:text-amber-300">
                  {legalResult.disclaimer}
                </div>
                <p className="text-slate-700 dark:text-slate-200">{legalResult.summaryGuidance}</p>
                <div>
                  <span className="font-semibold">Next Steps:</span>
                  <ol className="list-decimal pl-4 space-y-1 mt-1">
                    {legalResult.nextSteps.map((s, i) => (
                      <li key={i}>{s}</li>
                    ))}
                  </ol>
                </div>
                {legalResult.draftTemplate && (
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold">Prepared Draft Template:</span>
                      <button
                        type="button"
                        onClick={() =>
                          saveDocumentNote(`Legal Draft (${helpType})`, legalResult.draftTemplate)
                        }
                        className="text-sky-700 dark:text-sky-300 font-semibold hover:underline"
                      >
                        Save to Dashboard
                      </button>
                    </div>
                    <pre className="whitespace-pre-wrap font-sans p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
                      {legalResult.draftTemplate}
                    </pre>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Verified Lawyer Directory */}
          <div className="lg:col-span-6 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Verified Legal Aid &amp; Advocate Directory
              </h3>
              <span className="text-xs font-mono text-emerald-700 dark:text-emerald-300">
                NLASO Toll-Free: 16430
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 gsap-stagger-grid">
              {(compact ? LAWYER_DIRECTORY.slice(0, 2) : LAWYER_DIRECTORY).map((law) => (
                <div
                  key={law.id}
                  className="p-4 rounded-xl glass-subtle civic-card-hover flex flex-col justify-between gap-2.5 text-xs"
                >
                  <div className="space-y-1">
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {law.district} · {law.barCouncilId}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white">
                      {law.name}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300">
                      {law.specialties.join(' · ')}
                    </div>
                    <div className="text-slate-500 dark:text-slate-400">
                      Languages: {law.languages.join(', ')}
                    </div>
                    <div className="text-emerald-700 dark:text-emerald-400 font-medium">
                      {law.feeRange} · {law.accessibilityFeatures.join(' · ')}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setBookingLawyerId(law.id);
                      setBookingConfirmed(null);
                    }}
                    className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
                  >
                    <CalendarCheck className="w-3.5 h-3.5" /> Request Consultation
                  </button>
                </div>
              ))}
            </div>

            {bookingLawyerId && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const chosen = LAWYER_DIRECTORY.find((l) => l.id === bookingLawyerId);
                  setBookingConfirmed(
                    `Confidential consultation request logged for ${chosen?.name}. For urgent legal aid, call 16430.`,
                  );
                  setBookingNote('');
                }}
                className="p-4 rounded-xl bg-sky-50/80 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 space-y-2.5 text-xs"
              >
                <div className="font-semibold text-slate-900 dark:text-white">
                  Request Online / Accessible Legal Consultation
                </div>
                <input
                  type="text"
                  required
                  value={bookingNote}
                  onChange={(e) => setBookingNote(e.target.value)}
                  placeholder="Preferred date, communication mode (Voice / BdSL / Text), and brief topic..."
                  className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 font-semibold bg-sky-700 text-white rounded-lg"
                  >
                    Send Request
                  </button>
                  <button
                    type="button"
                    onClick={() => setBookingLawyerId(null)}
                    className="px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                  >
                    Cancel
                  </button>
                </div>
                {bookingConfirmed && (
                  <p className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {bookingConfirmed}
                  </p>
                )}
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
