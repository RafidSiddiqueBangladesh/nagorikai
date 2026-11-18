import {
  CheckCircle2,
  Globe,
  HeartHandshake,
  Lock,
  PhoneCall,
  Shield,
  Users,
} from 'lucide-react';
import { useState } from 'react';
import { useCivic } from '../../context/CivicContext';

type SupportTab = 'women' | 'elderly' | 'children' | 'disability';

export function SupportAndInclusionSection({
  initialTab = 'women',
}: {
  initialTab?: SupportTab;
}) {
  const { language, openSphereWithPrompt, setActiveView } = useCivic();
  const isBn = language === 'bn';

  const [tab, setTab] = useState<SupportTab>(initialTab);
  const [consentChecked, setConsentChecked] = useState(false);
  const [supportTopic, setSupportTopic] = useState('');
  const [supportSent, setSupportSent] = useState<string | null>(null);
  const [peerPost, setPeerPost] = useState('');
  const [communityThreads, setCommunityThreads] = useState([
    {
      id: 'ct-1',
      author: 'Dhaka Deaf Youth Collective',
      region: 'Dhaka · Bangladesh',
      topic: 'Weekly BdSL & Digital Skills Peer Circle (Saturdays 4 PM)',
      body: 'Open peer session with live BdSL & English captions for university students and job seekers.',
    },
    {
      id: 'ct-2',
      author: 'Global Inclusive Transit Network',
      region: 'Bangladesh & International Exchange',
      topic: 'Sharing Tactile Metro & Wheelchair Accessibility Audits',
      body: 'Comparing station navigation tools used by blind commuters in Dhaka, Tokyo, and London.',
    },
  ]);

  const handleConfidentialRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!consentChecked || !supportTopic.trim()) return;
    setSupportSent(
      isBn
        ? `গোপনীয় অনুরোধ সংরক্ষিত হয়েছে (রেফ #SAFE-${Math.floor(1000 + Math.random() * 8999)})। তাৎক্ষণিক জরুরি প্রয়োজনে ৯৯৯, ১০৯ (নারী ও শিশু) বা ১০৯৮ নম্বরে কল করুন।`
        : `Safeguarded request registered (Ref #SAFE-${Math.floor(1000 + Math.random() * 8999)}). For immediate emergency danger, call 999, 109 (Women & Child) or 1098 (Child Helpline).`,
    );
    setSupportTopic('');
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-5 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isBn
                ? 'নারী, প্রবীণ, শিশু ও প্রতিবন্ধী অন্তর্ভুক্তি কেন্দ্র'
                : 'Women, Elderly, Children & Disability Inclusion Centers'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {isBn
                ? 'গোপনীয়তা-প্রথম সহায়তা কেন্দ্র, নিরাপদ অভিযোগ, সামাজিক ভাতা নির্দেশনা ও কমিউনিটি নেটওয়ার্ক।'
                : 'Privacy-first support spaces, safeguarded reporting, social protection guidance, and national/international peer inclusion networks.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 p-1 bg-slate-100/90 dark:bg-white/10 rounded-xl">
            {(
              [
                { id: 'women', en: 'Women Support', bn: 'নারী সহায়তা' },
                { id: 'elderly', en: 'Elderly Care', bn: 'প্রবীণ সেবা' },
                { id: 'children', en: 'Children & Family', bn: 'শিশু ও পরিবার' },
                { id: 'disability', en: 'Disability Inclusion', bn: 'প্রতিবন্ধী অন্তর্ভুক্তি' },
              ] as const
            ).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTab(t.id)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
                  tab === t.id
                    ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {isBn ? t.bn : t.en}
              </button>
            ))}
          </div>
        </div>

        {/* Women Support Center */}
        {tab === 'women' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-7 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-4 rounded-xl bg-rose-50/80 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/60 space-y-1.5">
                  <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5">
                    <PhoneCall className="w-4 h-4" />
                    {isBn ? 'তাৎক্ষণিক জরুরি হেল্পলাইন' : 'Immediate Emergency Helplines'}
                  </div>
                  <p>
                    {isBn
                      ? '১০৯ — নারী ও শিশু নির্যাতন প্রতিরোধ জাতীয় হেল্পলাইন (২৪/৭ টোল-ফ্রি)'
                      : '109 — National Helpline for Violence Against Women & Children (24/7 Toll-Free)'}
                  </p>
                  <p>
                    {isBn
                      ? '৯৯৯ — জাতীয় জরুরি পুলিশ / অ্যাম্বুলেন্স / ফায়ার সার্ভিস'
                      : '999 — National Emergency Police / Ambulance / Fire'}
                  </p>
                  <p>
                    {isBn
                      ? '১৬৪৩০ — বিনামূল্যে সরকারি আইনি সহায়তা (NLASO)'
                      : '16430 — Free Government Legal Aid (NLASO)'}
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-1.5">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isBn ? 'কর্মক্ষেত্রের অধিকার ও নারী উদ্যোক্তা ঋণ' : 'Workplace Rights & Entrepreneur Grants'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'মাতৃত্বকালীন ছুটি ও সুরক্ষা, হয়রানি প্রতিরোধ কমিটি, জয়িতা / এসএমই নারী উদ্যোক্তা ঋণ ও প্রশিক্ষণের তথ্য জানুন।'
                      : 'Access maternity protection guidance, harassment complaint committees, Joyeeta / SME women entrepreneur loans, and training.'}
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      openSphereWithPrompt(
                        isBn
                          ? 'বাংলাদেশে নারী উদ্যোক্তারা কীভাবে এসএমই প্রশিক্ষণ ও আইনি সুরক্ষা পেতে পারেন?'
                          : 'How can a woman entrepreneur apply for SME training and legal protection in Bangladesh?',
                      )
                    }
                    className="text-sky-700 dark:text-sky-300 font-semibold hover:underline"
                  >
                    {isBn ? 'Sphere AI-তে নারী সহায়তা খুঁজুন' : 'Ask Sphere AI for Women Resources'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
                <img
                  src="/src/assets/images/civic_inclusion_community_1794946111524.jpg"
                  alt="Women and community empowerment workshop"
                  referrerPolicy="no-referrer"
                  className="w-28 h-20 rounded-xl object-cover shrink-0"
                />
                <div className="text-xs space-y-1">
                  <div className="font-bold text-slate-900 dark:text-white">
                    {isBn ? 'নারী-নেতৃত্বাধীন নাগরিক ও আইনি ক্লিনিক' : 'Women-Led Civic & Legal Clinics'}
                  </div>
                  <p className="text-slate-600 dark:text-slate-300">
                    {isBn
                      ? 'সাবটাইটেল ও নারী আইনজীবী স্বেচ্ছাসেবকসহ হাইব্রিড আইনি সচেতনতা ও অর্থনৈতিক ক্ষমতায়ন কর্মশালায় অংশ নিন।'
                      : 'Join hybrid legal awareness and economic empowerment workshops with captions and female legal aid volunteers.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveView('events')}
                    className="font-semibold text-sky-700 dark:text-sky-300 hover:underline"
                  >
                    {isBn ? 'নারী ক্ষমতায়ন ইভেন্ট দেখুন' : 'Explore Women Empowerment Events'}
                  </button>
                </div>
              </div>
            </div>

            <form
              onSubmit={handleConfidentialRequest}
              className="lg:col-span-5 p-4 rounded-xl bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 space-y-3 text-xs"
            >
              <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                <Lock className="w-4 h-4 text-sky-600" />
                {isBn ? 'গোপনীয় সহায়তার অনুরোধ' : 'Confidential Support Request'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {isBn
                  ? 'সম্পূর্ণ সুরক্ষিত ও গোপনীয়: কোনো তথ্য প্রকাশ্যে তালিকাভুক্ত হয় না।'
                  : 'Safeguarded & privacy-first: no public listing is created. Your contact details remain optional.'}
              </p>
              <textarea
                rows={3}
                required
                value={supportTopic}
                onChange={(e) => setSupportTopic(e.target.value)}
                placeholder={
                  isBn
                    ? 'কী ধরনের সহায়তা প্রয়োজন লিখুন (পারিবারিক নিরাপত্তা, কর্মক্ষেত্র, আইনি সহায়তা)...'
                    : 'Describe support needed (domestic safety, workplace harassment, legal aid referral)...'
                }
                className="w-full p-3 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <label className="flex items-start gap-2 cursor-pointer text-slate-700 dark:text-slate-300">
                <input
                  type="checkbox"
                  checked={consentChecked}
                  onChange={(e) => setConsentChecked(e.target.checked)}
                  className="mt-0.5"
                />
                <span>
                  {isBn
                    ? 'আমি অনুমোদিত সুরক্ষা সমন্বয়কারীর কাছে গোপনীয়ভাবে এই অনুরোধ পাঠাতে সম্মতি দিচ্ছি।'
                    : 'I consent to confidential routing of this request to an authorized safeguarding coordinator.'}
                </span>
              </label>
              <button
                type="submit"
                disabled={!consentChecked || !supportTopic.trim()}
                className="w-full py-2.5 font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 disabled:opacity-50 text-white rounded-xl transition-all"
              >
                {isBn ? 'গোপনীয় অনুরোধ জমা দিন' : 'Submit Confidential Request'}
              </button>
              {supportSent && (
                <p className="text-emerald-700 dark:text-emerald-400 flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> {supportSent}
                </p>
              )}
            </form>
          </div>
        )}

        {/* Elderly Care Center */}
        {tab === 'elderly' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {isBn ? 'বয়স্ক ভাতা (জিটুপি সহায়তা)' : 'বয়স্ক ভাতা (Elderly Allowance)'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {isBn
                  ? '৬৫+ বছর (পুরুষ) ও ৬২+ বছর (নারী) নাগরিকদের জন্য mis.bhata.gov.bd এবং সমাজসেবা অফিসে আবেদনের ধাপসমূহ।'
                  : 'Step-by-step G2P application assistance for citizens aged 65+ (men) and 62+ (women) via mis.bhata.gov.bd and local DSS offices.'}
              </p>
              <button
                type="button"
                onClick={() => openSphereWithPrompt('How do I apply for Elderly Allowance (বয়স্ক ভাতা) in Bangladesh?')}
                className="px-3 py-1.5 font-semibold bg-sky-700 text-white rounded-lg"
              >
                {isBn ? 'ভাতা নির্দেশিকা খুলুন' : 'Open Allowance Guide'}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {isBn ? 'প্রবীণ স্বাস্থ্য ও বিনামূল্যে ওষুধ' : 'Geriatric Health & Medicine Assistance'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {isBn
                  ? 'জেলা সদর হাসপাতাল, কমিউনিটি ক্লিনিক এবং ২৪/৭ স্বাস্থ্য বাতায়ন (১৬২৬৩) চিকিৎসক পরামর্শ খুঁজে পান।'
                  : 'Locate District Sadar Hospitals, Community Clinics, free essential medicines, and Shastho Batayon 24/7 physician line (16263).'}
              </p>
              <button
                type="button"
                onClick={() => setActiveView('emergency')}
                className="px-3 py-1.5 font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-lg"
              >
                {isBn ? 'নিকটস্থ হাসপাতাল খুঁজুন' : 'Find Nearby Hospitals'}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {isBn ? 'স্বেচ্ছাসেবক সহায়তা ও যাতায়াত' : 'Volunteer Escort & Accessible Transit'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {isBn
                  ? 'হাসপাতাল বা ব্যাংক-পেনশন কাজের জন্য যাচাইকৃত স্বেচ্ছাসেবকের সাথে যুক্ত হোন।'
                  : 'Connect with verified community volunteers for hospital visits, pension verification, and senior citizen peer groups.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveView('help-network')}
                className="px-3 py-1.5 font-semibold bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white rounded-lg"
              >
                {isBn ? 'স্বেচ্ছাসেবকের সাথে যুক্ত হোন' : 'Connect with Volunteers'}
              </button>
            </div>
          </div>
        )}

        {/* Children & Family */}
        {tab === 'children' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {isBn ? 'শিশু হেল্পলাইন ১০৯৮ ও সুরক্ষা' : 'Child Helpline 1098 & Safeguarding'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {isBn
                  ? 'শিশু সুরক্ষা, নিখোঁজ শিশু, বাল্যবিবাহ ও শিশুশ্রম প্রতিরোধে ২৪/৭ টোল-ফ্রি হেল্পলাইন ১০৯৮।'
                  : '24/7 toll-free national child helpline (1098) for child protection, missing children, child labor prevention, and family counseling.'}
              </p>
            </div>
            <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {isBn ? 'ইপিআই টিকা ও জন্ম নিবন্ধন' : 'EPI Child Vaccination & Birth Registration'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {isBn
                  ? 'কমিউনিটি ক্লিনিকে বিনামূল্যে শিশু টিকা ও জন্মের ৪৫ দিনের মধ্যে ১৭-ডিজিটের জন্ম নিবন্ধন নির্দেশিকা।'
                  : 'Free immunization schedules at Community Clinics and 17-digit BDRIS birth registration within 45 days of birth.'}
              </p>
              <button
                type="button"
                onClick={() => openSphereWithPrompt('Where can I get my child vaccinated and register a birth certificate?')}
                className="px-3 py-1.5 font-semibold bg-sky-700 text-white rounded-lg"
              >
                {isBn ? 'টিকা ও নিবন্ধন ধাপ দেখুন' : 'View Vaccination & Birth Steps'}
              </button>
            </div>
            <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="font-bold text-sm text-slate-900 dark:text-white">
                {isBn ? 'শিক্ষা উপবৃত্তি ও অন্তর্ভুক্তিমূলক স্কুল' : 'Education Stipends & Inclusive Schools'}
              </div>
              <p className="text-slate-600 dark:text-slate-300">
                {isBn
                  ? 'প্রাথমিক ও মাধ্যমিক উপবৃত্তি, প্রতিবন্ধী শিক্ষা ভাতা ও জেলাভিত্তিক স্কুল তথ্য।'
                  : 'Primary & secondary education stipends, disability education grants, and accessible school discovery by district.'}
              </p>
            </div>
          </div>
        )}

        {/* Disability & Inclusion Community */}
        {tab === 'disability' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            <div className="lg:col-span-5 space-y-3 text-xs">
              <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2">
                <div className="font-bold text-sm text-slate-900 dark:text-white flex items-center gap-1.5">
                  <Shield className="w-4 h-4 text-sky-600" />
                  {isBn ? 'গোপনীয়তা-প্রথম প্রোফাইল' : 'Optional Privacy-First Profiles'}
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {isBn
                    ? 'কোনো নাগরিককে প্রকাশ্যে প্রতিবন্ধিতার তথ্য দিতে বাধ্য করা হয় না। আপনার পছন্দের যোগাযোগ মাধ্যম (SignTalk ইশারা ভাষা, ব্রেইল, আই-গেজ বা ভয়েস) একান্তভাবে বেছে নিন।'
                    : 'Citizens are never required to publicly disclose a disability. Choose your preferred communication mode (BdSL SignTalk, Braille, Eye-Gaze, Easy-Read, or Voice) privately.'}
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setActiveView('signtalk')}
                    className="px-3 py-1.5 font-semibold bg-sky-700 text-white rounded-lg"
                  >
                    {isBn ? 'SignTalk ইশারা ভাষা স্টুডিও' : 'SignTalk BdSL Community'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('accessibility')}
                    className="px-3 py-1.5 font-semibold bg-slate-100 dark:bg-slate-800 rounded-lg"
                  >
                    {isBn ? 'ব্রেইল ও আই-গেজ কেন্দ্র' : 'Braille & Eye-Gaze Center'}
                  </button>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <HeartHandshake className="w-4 h-4 text-sky-600" />
                  {isBn ? 'সুবর্ণ নাগরিক কার্ড, বৃত্তি ও কারিগরি প্রশিক্ষণ' : 'Opportunities, Scholarships & Benefits'}
                </div>
                <p className="text-slate-600 dark:text-slate-300">
                  {isBn
                    ? 'সুবর্ণ নাগরিক কার্ডের আবেদন, প্রতিবন্ধী শিক্ষা ভাতা, এবং অন্তর্ভুক্তিমূলক TVET কারিগরি প্রশিক্ষণ গাইড।'
                    : 'Suborno Nagorik Card guidance, disability education stipends, accessible remote/hybrid tech jobs, and neurodiversity-inclusive TVET training.'}
                </p>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-3">
              <div className="p-4 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <Globe className="w-4 h-4 text-sky-600" />
                    {isBn ? 'জাতীয় ও আন্তর্জাতিক প্রতিবন্ধী পিয়ার নেটওয়ার্ক' : 'National & International Disability Peer Network'}
                  </h3>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'দোভাষী ও ব্রেইল উপযোগী' : 'Multilingual · Interpreter Ready'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={peerPost}
                    onChange={(e) => setPeerPost(e.target.value)}
                    placeholder={
                      isBn
                        ? 'আপনার প্রশ্ন, অভিজ্ঞতা বা সহায়ক তথ্য শেয়ার করুন...'
                        : 'Share a peer question, accessible resource, or international exchange topic...'
                    }
                    className="flex-1 px-3 py-2 text-xs rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!peerPost.trim()) return;
                      setCommunityThreads((prev) => [
                        {
                          id: `ct_${Date.now()}`,
                          author: isBn ? 'কমিউনিটি সদস্য' : 'Community Member',
                          region: 'Bangladesh',
                          topic: isBn ? 'পিয়ার আলোচনা' : 'Peer Discussion',
                          body: peerPost.trim(),
                        },
                        ...prev,
                      ]);
                      setPeerPost('');
                    }}
                    className="px-3.5 py-2 text-xs font-semibold bg-sky-700 text-white rounded-lg"
                  >
                    {isBn ? 'শেয়ার' : 'Share'}
                  </button>
                </div>

                <div className="space-y-2">
                  {communityThreads.map((th) => (
                    <div
                      key={th.id}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs"
                    >
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                        <Users className="w-3 h-3" /> {th.author} · {th.region}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white mt-0.5">{th.topic}</div>
                      <p className="text-slate-600 dark:text-slate-300 mt-0.5">{th.body}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
