import {
  CheckCircle2,
  Hand,
  HeartHandshake,
  MapPin,
  Scale,
  Send,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { HUMAN_HELP_NETWORK } from '../../data/civicDataset';
import type { HelpMatchRequest, HelpNetworkMember } from '../../types/civicsphere';

export function HumanHelpNetworkSection() {
  const { language, user, helpRequests, submitHelpRequest, setActiveView } = useCivic();
  const isBn = language === 'bn';

  const [roleFilter, setRoleFilter] = useState<'All' | HelpNetworkMember['roleType']>('All');
  const [districtFilter, setDistrictFilter] = useState<string>('All');
  const [selectedMemberId, setSelectedMemberId] = useState<string>(HUMAN_HELP_NETWORK[0].id);
  const [preferredMode, setPreferredMode] =
    useState<HelpMatchRequest['preferredMode']>('SignTalk 3D Video');
  const [summary, setSummary] = useState('');
  const [submittedReq, setSubmittedReq] = useState<HelpMatchRequest | null>(null);

  const filteredMembers = useMemo(() => {
    return HUMAN_HELP_NETWORK.filter((m) => {
      if (roleFilter !== 'All' && m.roleType !== roleFilter) return false;
      if (districtFilter !== 'All' && m.district !== districtFilter && m.district !== 'Nationwide')
        return false;
      return true;
    });
  }, [districtFilter, roleFilter]);

  const handleRequestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!summary.trim()) return;
    const matched = HUMAN_HELP_NETWORK.find((m) => m.id === selectedMemberId);
    const created = await submitHelpRequest({
      memberId: selectedMemberId,
      roleType: matched?.roleType || 'Volunteer',
      district: user.district || 'Dhaka',
      preferredMode,
      summary,
    });
    if (created) {
      setSubmittedReq(created);
      setSummary('');
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1.5">
              <HeartHandshake className="w-4 h-4" />
              {isBn ? 'মানবিক সহায়তা নেটওয়ার্ক' : 'Human Help Network'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {isBn
                ? 'প্রশিক্ষিত স্বেচ্ছাসেবক, ইশারা ভাষার দোভাষী, আইনজীবী ও কমিউনিটি সংস্থা'
                : 'Verified Volunteers, Sign-Language Interpreters, Lawyers & Support Organizations'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {isBn
                ? 'হাসপাতাল, আদালত, সরকারি অফিস বা দৈনন্দিন নাগরিক সহায়তার জন্য মানুষের সাথে সরাসরি যুক্ত হোন।'
                : 'Connect with verified human specialists across Bangladesh for hospital escorts, BdSL interpretation, pro-bono legal aid, and accessible community guidance.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setActiveView('signtalk')}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Hand className="w-4 h-4" />
            {isBn ? 'SignTalk ৩ডি কল খুলুন' : 'Open SignTalk Live Call'}
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {(
            [
              { id: 'All', en: 'All Specialists', bn: 'সকল সহায়তাকারী' },
              { id: 'Volunteer', en: 'Volunteers', bn: 'স্বেচ্ছাসেবক' },
              { id: 'BdSL Interpreter', en: 'BdSL Interpreters', bn: 'ইশারা দোভাষী' },
              { id: 'Legal Professional', en: 'Legal Professionals', bn: 'আইনজীবী' },
              { id: 'Community Support Org', en: 'Support Orgs', bn: 'কমিউনিটি সংস্থা' },
            ] as const
          ).map((r) => (
            <button
              key={r.id}
              type="button"
              onClick={() => setRoleFilter(r.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition-colors ${
                roleFilter === r.id
                  ? 'bg-emerald-600 text-white dark:bg-emerald-300 dark:text-slate-950'
                  : 'bg-white/75 dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {isBn ? r.bn : r.en}
            </button>
          ))}

          <select
            aria-label={isBn ? 'জেলা ফিল্টার' : 'Filter by district'}
            value={districtFilter}
            onChange={(e) => setDistrictFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="All">{isBn ? 'সব জেলা ও অনলাইন' : 'All Districts & Online'}</option>
            <option value="Dhaka">{isBn ? 'ঢাকা' : 'Dhaka'}</option>
            <option value="Chattogram">{isBn ? 'চট্টগ্রাম' : 'Chattogram'}</option>
            <option value="Sylhet">{isBn ? 'সিলেট' : 'Sylhet'}</option>
            <option value="Rajshahi">{isBn ? 'রাজশাহী' : 'Rajshahi'}</option>
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Directory Cards */}
          <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {filteredMembers.map((m) => (
              <div
                key={m.id}
                className={`p-4 rounded-2xl border transition-all text-xs space-y-2.5 ${
                  selectedMemberId === m.id
                    ? 'bg-emerald-50/80 dark:bg-emerald-950/35 border-emerald-500 shadow-sm'
                    : 'bg-white/80 dark:bg-slate-900/75 border-slate-200 dark:border-slate-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-semibold text-sky-700 dark:text-sky-300 flex items-center gap-1">
                      {m.roleType === 'Legal Professional' ? (
                        <Scale className="w-3 h-3" />
                      ) : m.roleType === 'BdSL Interpreter' ? (
                        <Hand className="w-3 h-3" />
                      ) : (
                        <Users className="w-3 h-3" />
                      )}
                      {m.roleType}
                    </div>
                    <h3 className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                      {isBn ? m.nameBn : m.name}
                    </h3>
                  </div>
                  {m.verified && (
                    <ShieldCheck
                      className="w-4 h-4 text-emerald-600 dark:text-emerald-300 shrink-0"
                      aria-label="Verified"
                    />
                  )}
                </div>

                <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                  {isBn ? m.specialtiesBn : m.specialtiesEn}
                </p>

                <div className="text-[11px] text-slate-500 dark:text-slate-400 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {m.district} · {m.availability}
                  </div>
                  <div>{m.languages.join(' · ')}</div>
                  <div className="text-emerald-700 dark:text-emerald-300 font-medium">
                    {m.accessibilityReady.join(' · ')}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedMemberId(m.id)}
                  className="w-full py-2 font-semibold rounded-xl bg-slate-900 dark:bg-emerald-600 hover:opacity-90 text-white transition-opacity"
                >
                  {selectedMemberId === m.id
                    ? isBn
                      ? 'সহায়তার জন্য নির্বাচিত ✓'
                      : 'Selected for Request ✓'
                    : isBn
                      ? 'সহায়তা চাইতে নির্বাচন করুন'
                      : 'Select Specialist'}
                </button>
              </div>
            ))}
          </div>

          {/* Request Human Help Form + Active Requests */}
          <div className="lg:col-span-5 space-y-4 text-xs">
            <form
              onSubmit={handleRequestSubmit}
              className="p-5 rounded-2xl bg-white/85 dark:bg-slate-900/80 border border-slate-200 dark:border-emerald-500/20 space-y-3"
            >
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {isBn ? 'সরাসরি মানবিক সহায়তার অনুরোধ পাঠান' : 'Request Matched Human Assistance'}
              </h2>

              <div>
                <label className="font-semibold block mb-1">
                  {isBn ? 'নির্বাচিত সহায়তাকারী / সংস্থা' : 'Selected Helper / Organization'}
                </label>
                <select
                  value={selectedMemberId}
                  onChange={(e) => setSelectedMemberId(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  {HUMAN_HELP_NETWORK.map((m) => (
                    <option key={m.id} value={m.id}>
                      {(isBn ? m.nameBn : m.name)} — {m.roleType}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {isBn ? 'যোগাযোগের সহজ মাধ্যম' : 'Preferred Communication Mode'}
                </label>
                <select
                  value={preferredMode}
                  onChange={(e) =>
                    setPreferredMode(e.target.value as HelpMatchRequest['preferredMode'])
                  }
                  className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                >
                  <option value="SignTalk 3D Video">SignTalk 3D / BdSL Video Call</option>
                  <option value="Voice Call">Voice / Phone Call</option>
                  <option value="In-Person Escort">In-Person Escort (Hospital / Office)</option>
                  <option value="Written / Braille">Written / Easy-Read / Braille</option>
                </select>
              </div>

              <div>
                <label className="font-semibold block mb-1">
                  {isBn ? 'কী ধরনের সহায়তা প্রয়োজন?' : 'How can we assist you?'}
                </label>
                <textarea
                  rows={3}
                  required
                  value={summary}
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder={
                    isBn
                      ? 'উদাহরণ: আগামীকাল সকাল ১০টায় ঢাকা মেডিকেল বা সমাজসেবা অফিসে দোভাষী/স্বেচ্ছাসেবক প্রয়োজন...'
                      : 'Example: Need a BdSL interpreter or volunteer escort for hospital / NID hearing tomorrow...'
                  }
                  className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 font-bold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl inline-flex items-center justify-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" />
                {isBn ? 'সহায়তার অনুরোধ পাঠান' : 'Send Help Request'}
              </button>

              {submittedReq && (
                <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold">
                      {submittedReq.id} · {submittedReq.status}
                    </div>
                    <div>
                      {isBn
                        ? `${submittedReq.roleType} (${submittedReq.preferredMode}) এর সাথে আপনার অনুরোধ যুক্ত হয়েছে।`
                        : `Matched with ${submittedReq.roleType} via ${submittedReq.preferredMode}.`}
                    </div>
                  </div>
                </div>
              )}
            </form>

            {helpRequests.length > 0 && (
              <div className="p-4 rounded-2xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-slate-900 dark:text-white">
                  {isBn ? 'সাম্প্রতিক সহায়তার অনুরোধসমূহ' : 'Recent Help Requests'}
                </div>
                {helpRequests.slice(0, 3).map((req) => (
                  <div
                    key={req.id}
                    className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800"
                  >
                    <div className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                      {req.id} · {req.roleType} · {req.status}
                    </div>
                    <div className="text-slate-700 dark:text-slate-300 mt-0.5">{req.summary}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
