import {
  Calendar,
  CheckCircle2,
  MapPin,
  MessageCircle,
  Plus,
  Users,
  Video,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';

const EVENT_CATEGORIES = [
  'All',
  'Public Hearings',
  'Municipality Meetings',
  'Community Discussions',
  'Disability Inclusion Programs',
  'Women Empowerment Events',
  'Youth Events',
  'Environmental Campaigns',
  'Blood Donation',
  'Health Camps',
  'Legal Awareness Programs',
  'Educational Workshops',
  'Volunteer Opportunities',
];

export function CommunityEventsSection({ compact = false }: { compact?: boolean }) {
  const {
    language,
    events,
    registeredEventIds,
    createEvent,
    registerForEvent,
    askEventQuestion,
    setActiveView,
  } = useCivic();

  const [categoryFilter, setCategoryFilter] = useState('All');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [qaInput, setQaInput] = useState<Record<string, string>>({});
  const [streamPreviewId, setStreamPreviewId] = useState<string | null>(null);

  // Create Event form state
  const [titleEn, setTitleEn] = useState('');
  const [category, setCategory] = useState('Public Hearings');
  const [date, setDate] = useState('2026-12-05');
  const [time, setTime] = useState('11:00 AM');
  const [location, setLocation] = useState('');
  const [district, setDistrict] = useState('Dhaka');
  const [mode, setMode] = useState<'In-Person' | 'Online' | 'Hybrid'>('Hybrid');
  const [liveCaptions, setLiveCaptions] = useState(true);
  const [signInterp, setSignInterp] = useState(true);
  const [audioDesc, setAudioDesc] = useState(false);
  const [wheelchair, setWheelchair] = useState(true);

  const filteredEvents = useMemo(
    () =>
      events.filter(
        (ev) => categoryFilter === 'All' || ev.category === categoryFilter,
      ),
    [categoryFilter, events],
  );

  const displayedEvents = compact ? filteredEvents.slice(0, 3) : filteredEvents;

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              Community Events &amp; Accessible Live Participation
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Nationwide public hearings, health camps, legal awareness clinics, and inclusion programs with captions, BdSL interpreters, and Q&amp;A.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCreateForm((v) => !v)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-xl"
            >
              <Plus className="w-3.5 h-3.5" /> Create Event
            </button>
            {compact && (
              <button
                type="button"
                onClick={() => setActiveView('events')}
                className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl transition-all"
              >
                All Events ({events.length})
              </button>
            )}
          </div>
        </div>

        {/* Category Filter Strip */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {EVENT_CATEGORIES.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setCategoryFilter(cat)}
              className={`px-3 py-1.5 text-xs rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                categoryFilter === cat
                  ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950 font-semibold'
                  : 'bg-slate-100/90 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Create Event Form */}
        {showCreateForm && (
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!titleEn.trim() || !location.trim()) return;
              await createEvent({
                titleEn,
                titleBn: titleEn,
                category,
                date,
                time,
                location,
                district,
                mode,
                accessibility: {
                  liveCaptions,
                  signLanguageInterpreter: signInterp,
                  audioDescription: audioDesc,
                  wheelchairAccessible: wheelchair,
                },
              });
              setTitleEn('');
              setLocation('');
              setShowCreateForm(false);
            }}
            className="p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700 space-y-3"
          >
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Host a Community or Municipal Event
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
              <input
                type="text"
                required
                value={titleEn}
                onChange={(e) => setTitleEn(e.target.value)}
                placeholder="Event title..."
                className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <select
                aria-label="Event category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                {EVENT_CATEGORIES.filter((c) => c !== 'All').map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
              <select
                aria-label="Event format"
                value={mode}
                onChange={(e) => setMode(e.target.value as 'In-Person' | 'Online' | 'Hybrid')}
                className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                <option value="Hybrid">Hybrid (In-Person + Stream)</option>
                <option value="In-Person">In-Person</option>
                <option value="Online">Online Stream</option>
              </select>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                placeholder="Time"
                className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <input
                type="text"
                value={district}
                onChange={(e) => setDistrict(e.target.value)}
                placeholder="District"
                className="px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
            </div>
            <input
              type="text"
              required
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Venue address or live stream details..."
              className="w-full px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
            <div className="flex flex-wrap gap-4 text-xs">
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={liveCaptions} onChange={(e) => setLiveCaptions(e.target.checked)} />
                Live Captions
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={signInterp} onChange={(e) => setSignInterp(e.target.checked)} />
                BdSL Interpreter
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={audioDesc} onChange={(e) => setAudioDesc(e.target.checked)} />
                Audio Description
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input type="checkbox" checked={wheelchair} onChange={(e) => setWheelchair(e.target.checked)} />
                Wheelchair Accessible
              </label>
            </div>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-semibold bg-sky-700 text-white rounded-lg"
            >
              Publish Event
            </button>
          </form>
        )}

        {/* Events Grid */}
        <div className="gsap-stagger-grid grid grid-cols-1 lg:grid-cols-3 gap-4">
          {displayedEvents.map((ev) => {
            const isRegistered = registeredEventIds.includes(ev.id);
            const accessFeatures = [
              ev.accessibility.liveCaptions && 'Live Captions',
              ev.accessibility.signLanguageInterpreter && 'BdSL Interpreter',
              ev.accessibility.audioDescription && 'Audio Description',
              ev.accessibility.wheelchairAccessible && 'Wheelchair Access',
            ]
              .filter(Boolean)
              .join(' · ');

            return (
              <article
                key={ev.id}
                className="civic-card-hover p-4 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200 dark:border-emerald-500/15 flex flex-col justify-between gap-3"
              >
                <div className="space-y-2">
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {ev.category} · {ev.mode} · {ev.district}
                  </div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {language === 'bn' ? ev.titleBn : ev.titleEn}
                  </h3>
                  <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-mono tabular-nums">{ev.date}</span> · {ev.time}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span>{ev.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                      <span className="font-mono tabular-nums">{ev.registeredCount} attending</span>
                    </div>
                  </div>
                  {accessFeatures && (
                    <div className="text-[11px] text-emerald-800 dark:text-emerald-300">
                      Accessibility: {accessFeatures}
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => registerForEvent(ev.id)}
                      className={`flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        isRegistered
                          ? 'bg-emerald-700 text-white'
                          : 'bg-sky-700 hover:bg-sky-800 text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isRegistered ? 'Registered' : 'Register (+25 pts)'}
                    </button>
                    {ev.mode !== 'In-Person' && (
                      <button
                        type="button"
                        onClick={() =>
                          setStreamPreviewId((prev) => (prev === ev.id ? null : ev.id))
                        }
                        className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-lg"
                      >
                        <Video className="w-3.5 h-3.5" />
                        {ev.hasRecording ? 'Recording' : 'Live Feed'}
                      </button>
                    )}
                  </div>

                  {streamPreviewId === ev.id && (
                    <div className="p-3 rounded-lg bg-slate-950 text-slate-100 text-xs space-y-2">
                      <div className="font-semibold text-sky-300">
                        Accessible Stream &amp; Live Caption Channel
                      </div>
                      <p className="text-[11px] text-slate-300">
                        Live Bangla/English captions and BdSL interpreter feed ready when event broadcast begins.
                      </p>
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={qaInput[ev.id] || ''}
                          onChange={(e) =>
                            setQaInput((p) => ({ ...p, [ev.id]: e.target.value }))
                          }
                          placeholder="Submit Q&A question..."
                          className="flex-1 px-2.5 py-1.5 text-xs rounded bg-slate-900 border border-slate-700 text-white"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const q = qaInput[ev.id]?.trim();
                            if (!q) return;
                            askEventQuestion(ev.id, q);
                            setQaInput((p) => ({ ...p, [ev.id]: '' }));
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold bg-sky-600 text-white rounded"
                        >
                          Ask
                        </button>
                      </div>
                      {ev.qaList.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-800">
                          {ev.qaList.map((qa) => (
                            <div key={qa.id} className="text-[11px]">
                              <MessageCircle className="w-3 h-3 inline mr-1 text-sky-400" />
                              <span className="font-semibold">{qa.author}:</span> {qa.question}
                              {qa.answer && (
                                <div className="text-emerald-300 pl-4">Reply: {qa.answer}</div>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
