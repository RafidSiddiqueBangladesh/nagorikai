import { Award, ShieldCheck, Trophy } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';

const SCOPES = ['All', 'National', 'District', 'Municipality', 'University', 'Community Group'] as const;

const BADGES_INFO = [
  { name: 'Community Hero', criteria: 'Guided citizens through public service applications or emergency help.' },
  { name: 'Accessibility Champion', criteria: 'Supported blind, deaf, or paralysis inclusion and WCAG reviews.' },
  { name: 'Transparency Advocate', criteria: 'Submitted verified infrastructure or budget audit observations.' },
  { name: 'Citizen Educator', criteria: 'Translated public procedures into clear Bangla audio or easy-read guides.' },
  { name: 'Volunteer Leader', criteria: 'Hosted or volunteered at community clinics and civic workshops.' },
  { name: 'Environmental Guardian', criteria: 'Led local waste, clean water, or green corridor initiatives.' },
];

export function RewardsAndLeaderboardSection({ compact = false }: { compact?: boolean }) {
  const { leaderboard, user, setActiveView } = useCivic();
  const [scopeFilter, setScopeFilter] = useState<(typeof SCOPES)[number]>('All');

  const filtered = useMemo(
    () =>
      leaderboard.filter((entry) => scopeFilter === 'All' || entry.scope === scopeFilter),
    [leaderboard, scopeFilter],
  );

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Civic Contribution Leaderboard &amp; Recognition
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Earn Civic Points for helping elderly citizens, volunteering, attending hearings, verifying infrastructure issues, and championing accessibility—never for mass voting or partisan campaigning.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-[11px] text-slate-500 dark:text-slate-400">Your Civic Points</div>
              <div className="text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                {user.civicPoints} pts
              </div>
            </div>
            {compact && (
              <button
                type="button"
                onClick={() => setActiveView('rewards')}
                className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl transition-all"
              >
                Full Leaderboards
              </button>
            )}
          </div>
        </div>

        {/* Scope Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl w-fit">
          {SCOPES.map((sc) => (
            <button
              key={sc}
              type="button"
              onClick={() => setScopeFilter(sc)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                scopeFilter === sc
                  ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950'
                  : 'text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {sc}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Rankings Table */}
          <div className="lg:col-span-7 overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                  <th className="py-2.5 pr-3">Rank</th>
                  <th className="py-2.5 pr-3">Contributor</th>
                  <th className="py-2.5 pr-3">Scope &amp; Location</th>
                  <th className="py-2.5 text-right">Points</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((entry, idx) => (
                  <tr
                    key={entry.id}
                    className="border-b border-slate-100 dark:border-slate-800/70 hover:bg-white/50 dark:hover:bg-slate-900/40 transition-colors"
                  >
                    <td className="py-3 pr-3 font-mono tabular-nums font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                          idx < 3
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-200'
                        }`}
                      >
                        #{idx + 1}
                      </span>
                    </td>
                    <td className="py-3 pr-3">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        <Trophy className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                        {entry.name}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {entry.badges.join(' · ')}
                      </div>
                    </td>
                    <td className="py-3 pr-3 text-slate-600 dark:text-slate-300">
                      <div>{entry.scope}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {entry.location}
                      </div>
                    </td>
                    <td className="py-3 text-right font-mono tabular-nums font-bold text-emerald-700 dark:text-emerald-300">
                      {entry.points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Badges Rubric */}
          <div className="lg:col-span-5 space-y-2.5">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Award className="w-4 h-4 text-emerald-600 dark:text-emerald-300" /> Civic Badges &amp; Ethical Criteria
            </h3>
            <div className="gsap-stagger-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {BADGES_INFO.slice(0, compact ? 4 : 6).map((b) => (
                <div
                  key={b.name}
                  className="civic-card-hover p-3 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/15 text-xs"
                >
                  <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    {b.name}
                  </div>
                  <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                    {b.criteria}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
