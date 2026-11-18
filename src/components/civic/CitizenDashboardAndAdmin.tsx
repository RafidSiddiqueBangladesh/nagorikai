import {
  Bell,
  Bookmark,
  CheckCircle2,
  CheckSquare,
  FileText,
  History,
  LogIn,
  LogOut,
  MapPin,
  Shield,
  ShieldCheck,
  Sliders,
  UserCheck,
} from 'lucide-react';
import { useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshGeoData';
import { GOVERNMENT_SERVICES } from '../../data/civicDataset';
import type { UserRole } from '../../types/civicsphere';

const ALL_ROLES: UserRole[] = [
  'Citizen',
  'Volunteer',
  'Event Organizer',
  'Legal Professional',
  'News Editor',
  'Community Moderator',
  'Verified Government Representative',
  'Municipality Admin',
  'Super Admin',
];

export function CitizenDashboardView() {
  const {
    language,
    user,
    supabaseReady,
    setAuthModalOpen,
    signOutCitizen,
    updateUserProfile,
    savedServiceIds,
    setSelectedServiceId,
    checklists,
    toggleChecklistItem,
    savedDocuments,
    complaints,
    mapReports,
    events,
    registeredEventIds,
    votedPollIds,
    initiatives,
    aiHistory,
    notifications,
    markAllNotificationsRead,
    setOnboardingOpen,
    setActiveView,
  } = useCivic();

  const isBn = language === 'bn';
  const savedServices = GOVERNMENT_SERVICES.filter((s) => savedServiceIds.includes(s.id));
  const myEvents = events.filter((e) => registeredEventIds.includes(e.id));

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          {user.avatarUrl ? (
            <img
              src={user.avatarUrl}
              alt={user.name}
              referrerPolicy="no-referrer"
              className="w-12 h-12 rounded-2xl object-cover border border-emerald-400/40"
            />
          ) : (
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-600 to-sky-600 text-white font-bold text-lg flex items-center justify-center">
              {user.name.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 flex flex-wrap items-center gap-1.5">
              <span>
                {isBn ? 'ব্যক্তিগত নাগরিক ড্যাশবোর্ড' : 'Personal Citizen Dashboard'} · {user.district} ·{' '}
                {user.role}
              </span>
              {!user.isGuest && (
                <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-300 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  {user.authProvider === 'google-supabase'
                    ? 'Google + Supabase'
                    : supabaseReady
                      ? 'Supabase Session'
                      : isBn
                        ? 'সক্রিয় প্রোফাইল'
                        : 'Signed In'}
                </span>
              )}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {isBn ? `স্বাগতম, ${user.name}` : `Welcome, ${user.name}`}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {isBn ? 'যোগাযোগ মাধ্যম:' : 'Communication Mode:'} {user.communicationPreference} ·{' '}
              {isBn ? 'সিভিক পয়েন্ট:' : 'Civic Points:'}{' '}
              <span className="font-mono font-bold text-emerald-700 dark:text-emerald-300">
                {user.civicPoints}
              </span>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {user.isGuest ? (
            <button
              type="button"
              onClick={() => setAuthModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold bg-gradient-to-r from-emerald-600 to-sky-600 text-white rounded-xl shadow-sm"
            >
              <LogIn className="w-3.5 h-3.5" />
              {isBn ? 'Google / Supabase দিয়ে সাইন ইন' : 'Sign In (Google / Email)'}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void signOutCitizen()}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl"
            >
              <LogOut className="w-3.5 h-3.5" />
              {isBn ? 'সাইন আউট' : 'Sign Out'}
            </button>
          )}
          <button
            type="button"
            onClick={() => setOnboardingOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-emerald-600 text-white rounded-xl transition-all"
          >
            <Sliders className="w-3.5 h-3.5" />
            {isBn ? 'পছন্দসমূহ সাজান' : 'Personalize'}
          </button>
          <button
            type="button"
            onClick={() => setActiveView('admin')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-800 text-white rounded-xl"
          >
            <Shield className="w-3.5 h-3.5" />
            {isBn ? 'ভূমিকা ও অ্যাডমিন' : 'Role & Admin'}
          </button>
        </div>
      </div>

      {/* Notifications & Saved Services + Checklists */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-5 glass-panel rounded-2xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <Bell className="w-4 h-4 text-sky-600" />
              {isBn ? 'বিজ্ঞপ্তি' : 'Notifications'}
            </h2>
            <button
              type="button"
              onClick={markAllNotificationsRead}
              className="text-xs font-semibold text-sky-700 dark:text-sky-300 hover:underline"
            >
              {isBn ? 'সব পঠিত চিহ্নিত করুন' : 'Mark all read'}
            </button>
          </div>
          <div className="space-y-2 text-xs">
            {notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl border ${
                  n.read
                    ? 'bg-white/50 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800 opacity-75'
                    : 'bg-sky-50/70 dark:bg-sky-950/40 border-sky-200 dark:border-sky-800'
                }`}
              >
                <div className="font-medium text-slate-900 dark:text-white">{n.title}</div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{n.time}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Saved Services & Checklists */}
        <div className="lg:col-span-7 glass-panel rounded-2xl p-5 space-y-4">
          <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <Bookmark className="w-4 h-4 text-sky-600" />
            {isBn ? 'সংরক্ষিত সরকারি সেবা ও চেকলিস্ট' : 'Saved Government Services & Checklists'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
            {savedServices.map((svc) => (
              <button
                key={svc.id}
                type="button"
                onClick={() => {
                  setSelectedServiceId(svc.id);
                  setActiveView('services');
                }}
                className="p-3 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 text-left hover:border-sky-500"
              >
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {isBn ? svc.categoryLabelBn : svc.categoryLabelEn}
                </div>
                <div className="font-bold text-slate-900 dark:text-white mt-0.5">
                  {isBn ? svc.titleBn : svc.titleEn}
                </div>
              </button>
            ))}
          </div>

          {checklists.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="text-xs font-semibold flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-emerald-600" />
                {isBn ? 'সক্রিয় আবেদন চেকলিস্ট' : 'Active Application Checklists'}
              </div>
              {checklists.map((cl) => (
                <div
                  key={cl.serviceId}
                  className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1.5"
                >
                  <div className="font-bold">{cl.title}</div>
                  {cl.items.map((it) => (
                    <label key={it.id} className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={it.done}
                        onChange={() => toggleChecklistItem(cl.serviceId, it.id)}
                      />
                      <span className={it.done ? 'line-through opacity-60' : ''}>{it.label}</span>
                    </label>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Saved Docs, Map Issues & Activity, AI History & Trusted Contacts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="glass-panel rounded-2xl p-5 space-y-3 text-xs">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <FileText className="w-4 h-4 text-sky-600" />
              {isBn ? 'সংরক্ষিত দলিল ও নোট' : 'Saved Documents & Drafts'}
            </h3>
            <button
              type="button"
              onClick={() => setActiveView('doc-reader')}
              className="font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
            >
              {isBn ? 'AI পাঠক' : 'AI Reader'}
            </button>
          </div>
          {savedDocuments.map((d) => (
            <div
              key={d.id}
              className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1"
            >
              <div className="font-bold">{d.title}</div>
              <p className="text-slate-600 dark:text-slate-300 line-clamp-3 whitespace-pre-wrap">
                {d.content}
              </p>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-sky-600" />
            {isBn ? 'মানচিত্র রিপোর্ট ও নাগরিক সক্রিয়তা' : 'Map Issues & Civic Activity'}
          </h3>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70">
              <div className="font-mono font-bold text-base">{votedPollIds.length}</div>
              <div className="text-[11px] text-slate-500">{isBn ? 'ভোট' : 'Votes'}</div>
            </div>
            <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70">
              <div className="font-mono font-bold text-base">{myEvents.length}</div>
              <div className="text-[11px] text-slate-500">{isBn ? 'ইভেন্ট' : 'Events'}</div>
            </div>
            <div className="p-2 rounded-lg bg-white/70 dark:bg-slate-900/70">
              <div className="font-mono font-bold text-base">{initiatives.length}</div>
              <div className="text-[11px] text-slate-500">{isBn ? 'উদ্যোগ' : 'Initiatives'}</div>
            </div>
          </div>
          {mapReports.slice(0, 2).map((r) => (
            <div
              key={r.id}
              className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
            >
              <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                <MapPin className="w-3 h-3" /> {r.id} · {r.status}
              </div>
              <div className="font-semibold mt-0.5">{r.title}</div>
            </div>
          ))}
          {complaints.slice(0, 2).map((c) => (
            <div
              key={c.id}
              className="p-2.5 rounded-lg bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
            >
              <div className="font-mono text-[11px] text-sky-700 dark:text-sky-300">
                {c.id} · {c.status}
              </div>
              <div className="font-semibold mt-0.5">{c.title}</div>
            </div>
          ))}
        </div>

        <div className="glass-panel rounded-2xl p-5 space-y-3 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
            <History className="w-4 h-4 text-sky-600" />
            {isBn ? 'Sphere AI ইতিহাস ও বিশ্বস্ত পরিচিতি' : 'Sphere AI & Trusted Contacts'}
          </h3>
          {aiHistory.length === 0 ? (
            <p className="text-slate-500 dark:text-slate-400">
              {isBn
                ? 'আপনার Sphere AI প্রশ্নোত্তর এখানে স্বয়ংক্রিয়ভাবে সংরক্ষিত হবে।'
                : 'Your Sphere AI civic queries and checklists will appear here automatically.'}
            </p>
          ) : (
            aiHistory.slice(0, 3).map((entry) => (
              <div
                key={entry.id}
                className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800"
              >
                <div className="font-bold">{entry.question}</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{entry.timestamp}</div>
              </div>
            ))
          )}

          <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
            <label className="text-[11px] font-semibold block">
              {isBn ? 'নিজ জেলা' : 'Home District'}
            </label>
            <select
              aria-label="Home district"
              value={user.district}
              onChange={(e) => updateUserProfile({ district: e.target.value })}
              className="w-full px-3 py-1.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {BANGLADESH_DISTRICTS.map((d) => (
                <option key={d.id} value={d.nameEn}>
                  {isBn ? d.nameBn : d.nameEn}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={() => setActiveView('emergency')}
              className="w-full py-2 font-semibold rounded-xl bg-rose-600/10 text-rose-700 dark:text-rose-300 border border-rose-500/20 hover:bg-rose-600/20"
            >
              {isBn
                ? `জরুরি SOS ও বিশ্বস্ত নম্বর (${user.trustedContacts?.length || 0})`
                : `Manage Trusted SOS Contacts (${user.trustedContacts?.length || 0})`}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}

export function AdminConsoleView() {
  const {
    language,
    user,
    switchUserRole,
    complaints,
    mapReports,
    updateMapReportStatus,
    voicePosts,
    initiatives,
    auditLogs,
    runAdminAction,
  } = useCivic();

  const isBn = language === 'bn';
  const [noticeDistrict, setNoticeDistrict] = useState(user.district || 'Dhaka');
  const [noticeTitleEn, setNoticeTitleEn] = useState('');
  const [noticeTitleBn, setNoticeTitleBn] = useState('');
  const [adminToast, setAdminToast] = useState<string | null>(null);

  const isMunicipalityScoped = user.role === 'Municipality Admin';
  const visibleComplaints = isMunicipalityScoped
    ? complaints.filter((c) => c.district.toLowerCase() === user.district.toLowerCase())
    : complaints;

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
              {isBn ? 'অ্যাডমিন ও পৌর প্রশাসন কনসোল' : 'Admin & Government Partner Console'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {isBn
                ? 'ভূমিকা-ভিত্তিক পৌর পরিচালনা, মানচিত্র সমস্যা আপডেট, গণবিজ্ঞপ্তি প্রকাশ এবং অডিট লগ।'
                : 'Role-based civic governance, map issue status resolution, public notice publishing, and immutable audit logging.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-sky-600" />
            <select
              aria-label="Active governance role"
              value={user.role}
              onChange={(e) => switchUserRole(e.target.value as UserRole)}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
            >
              {ALL_ROLES.map((r) => (
                <option key={r} value={r}>
                  Role: {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        {isMunicipalityScoped && (
          <div className="px-3.5 py-2 rounded-xl bg-sky-50 dark:bg-sky-950/40 border border-sky-200 dark:border-sky-800 text-xs text-sky-900 dark:text-sky-200">
            Geographic Scope Active: As Municipality Admin, your complaint queue is scoped strictly to {user.district}.
          </div>
        )}

        {adminToast && (
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200">
            {adminToast}
          </div>
        )}

        {/* Analytics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500">{isBn ? 'মানচিত্র পিন রিপোর্ট' : 'Map Problem Pins'}</div>
            <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
              {mapReports.length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500">{isBn ? 'নাগরিক কণ্ঠ' : 'Citizen Voices'}</div>
            <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
              {voicePosts.length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500">{isBn ? 'সক্রিয় উদ্যোগ' : 'Active Initiatives'}</div>
            <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
              {initiatives.length}
            </div>
          </div>
          <div className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800">
            <div className="text-slate-500">{isBn ? 'অডিট লগ' : 'Audit Events'}</div>
            <div className="text-lg font-bold font-mono tabular-nums mt-0.5">
              {auditLogs.length}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Map Reports + Complaints Review */}
          <div className="lg:col-span-7 space-y-3 text-xs">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'মানচিত্র সমস্যা ও ওয়ার্ড অভিযোগ সমাধান' : 'Map Problem Pins & Ward Complaints'}
            </h2>
            {mapReports.slice(0, 4).map((mr) => (
              <div
                key={mr.id}
                className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                    {mr.id} · {mr.category} · {mr.district}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">{mr.title}</div>
                </div>
                <select
                  aria-label={`Update status for ${mr.id}`}
                  value={mr.status}
                  onChange={async (e) => {
                    await updateMapReportStatus(mr.id, e.target.value as typeof mr.status);
                    setAdminToast(`Updated map issue ${mr.id} to ${e.target.value}.`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  <option value="Reported">Reported</option>
                  <option value="Verified">Verified</option>
                  <option value="Crew Assigned">Crew Assigned</option>
                  <option value="Resolved">Resolved</option>
                </select>
              </div>
            ))}

            {visibleComplaints.map((c) => (
              <div
                key={c.id}
                className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3"
              >
                <div>
                  <div className="font-mono text-[11px] text-slate-500">
                    {c.id} · {c.district} ({c.ward}) · {c.submittedAt}
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">{c.title}</div>
                </div>
                <select
                  aria-label={`Update status for ${c.id}`}
                  value={c.status}
                  onChange={async (e) => {
                    await runAdminAction({
                      actionType: 'update_complaint',
                      targetId: c.id,
                      payload: { status: e.target.value },
                    });
                    setAdminToast(`Updated ${c.id} status to ${e.target.value} (audit logged).`);
                  }}
                  className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  <option>Submitted</option>
                  <option>Assigned to Ward</option>
                  <option>In Progress</option>
                  <option>Resolved</option>
                </select>
              </div>
            ))}
          </div>

          {/* Publish Official Notice */}
          <form
            onSubmit={async (e) => {
              e.preventDefault();
              if (!noticeTitleEn.trim()) return;
              await runAdminAction({
                actionType: 'publish_notice',
                payload: {
                  district: noticeDistrict,
                  titleEn: noticeTitleEn,
                  titleBn: noticeTitleBn || noticeTitleEn,
                },
              });
              setAdminToast(`Published official notice for ${noticeDistrict}.`);
              setNoticeTitleEn('');
              setNoticeTitleBn('');
            }}
            className="lg:col-span-5 p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-3 text-xs h-fit"
          >
            <h2 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'সরকারি গণবিজ্ঞপ্তি প্রকাশ করুন' : 'Publish Official Municipal / Public Notice'}
            </h2>
            <input
              type="text"
              value={noticeDistrict}
              onChange={(e) => setNoticeDistrict(e.target.value)}
              placeholder="District or Nationwide"
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              required
              value={noticeTitleEn}
              onChange={(e) => setNoticeTitleEn(e.target.value)}
              placeholder="Notice title (English)..."
              className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
            <input
              type="text"
              value={noticeTitleBn}
              onChange={(e) => setNoticeTitleBn(e.target.value)}
              placeholder="নোটিশ শিরোনাম (বাংলা)..."
              className="w-full px-3 py-2 font-bengali rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />
            <button
              type="submit"
              className="w-full py-2.5 font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl transition-all"
            >
              {isBn ? 'প্রকাশ ও অডিট লগ করুন' : 'Publish & Log Audit Entry'}
            </button>
          </form>
        </div>

        {/* Audit Log */}
        <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            {isBn ? 'প্রশাসনিক অডিট লগ' : 'Administrative Audit Log'}
          </h3>
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {auditLogs.map((log) => (
              <div
                key={log.id}
                className="px-3 py-2 rounded-lg bg-white/60 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 flex flex-wrap justify-between gap-2"
              >
                <span>
                  <span className="font-semibold">{log.actor}</span> ({log.role}): {log.action}
                </span>
                <span className="font-mono text-slate-500 tabular-nums">{log.timestamp}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
