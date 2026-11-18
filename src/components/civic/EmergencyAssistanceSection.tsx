import {
  AlertOctagon,
  Copy,
  ExternalLink,
  Flame,
  Hospital,
  MapPin,
  Navigation,
  PhoneCall,
  Plus,
  ShieldAlert,
  Siren,
  Trash2,
  UserPlus,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { BANGLADESH_DISTRICTS } from '../../data/bangladeshGeoData';
import type { NearbyEmergencyPlace } from '../../types/civicsphere';

const VERIFIED_HOTLINES = [
  {
    code: '999',
    en: 'National Emergency (Police, Fire & Ambulance)',
    bn: 'জাতীয় জরুরি সেবা (পুলিশ, ফায়ার সার্ভিস ও অ্যাম্বুলেন্স)',
    tone: 'rose',
  },
  {
    code: '109',
    en: 'Women & Child Violence Prevention Helpline',
    bn: 'নারী ও শিশু নির্যাতন প্রতিরোধ হেল্পলাইন',
    tone: 'amber',
  },
  {
    code: '1098',
    en: 'Child Helpline Bangladesh',
    bn: 'জাতীয় শিশু সহায়তা হেল্পলাইন',
    tone: 'sky',
  },
  {
    code: '16263',
    en: 'Shastho Batayon (24/7 Health & Ambulance)',
    bn: 'স্বাস্থ্য বাতায়ন (২৪/৭ চিকিৎসক পরামর্শ)',
    tone: 'emerald',
  },
  {
    code: '16430',
    en: 'NLASO Free Government Legal Aid',
    bn: 'সরকারি বিনামূল্যে আইনি সহায়তা (NLASO)',
    tone: 'indigo',
  },
  {
    code: '106',
    en: 'Anti-Corruption Commission (ACC)',
    bn: 'দুর্নীতি দমন কমিশন হটলাইন (দুদক)',
    tone: 'slate',
  },
];

export function EmergencyAssistanceSection() {
  const {
    language,
    user,
    addTrustedContact,
    removeTrustedContact,
    speakText,
  } = useCivic();
  const isBn = language === 'bn';

  const activeDistrict =
    BANGLADESH_DISTRICTS.find((d) => d.nameEn.toLowerCase() === user.district.toLowerCase()) ||
    BANGLADESH_DISTRICTS[0];

  const [coords, setCoords] = useState<{ lat: number; lng: number }>({
    lat: activeDistrict.lat,
    lng: activeDistrict.lng,
  });
  const [locStatus, setLocStatus] = useState<string>('');
  const [facilityFilter, setFacilityFilter] = useState<'all' | 'hospital' | 'police' | 'fire_station'>('all');
  const [nearbyPlaces, setNearbyPlaces] = useState<NearbyEmergencyPlace[]>([]);
  const [loadingPlaces, setLoadingPlaces] = useState(false);
  const [placesSource, setPlacesSource] = useState<string>('civic_directory');
  const [sosActivated, setSosActivated] = useState(false);
  const [copiedSos, setCopiedSos] = useState(false);

  const [contactName, setContactName] = useState('');
  const [contactRelation, setContactRelation] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const fetchNearbyServices = useCallback(
    async (lat: number, lng: number, distName: string) => {
      setLoadingPlaces(true);
      try {
        const types =
          facilityFilter === 'all' ? ['hospital', 'police', 'fire_station'] : [facilityFilter];
        const res = await fetch('/api/civic/maps-nearby', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lat, lng, includedTypes: types, districtName: distName }),
        });

        const payload = await res.json();
        if (
          res.status === 429 ||
          payload?.error === 'RESOURCE_EXHAUSTED' ||
          payload?.error === 'OVER_QUERY_LIMIT'
        ) {
          window.dispatchEvent(new CustomEvent('gmp-quota-exceeded'));
          return;
        }
        if (res.ok && payload.places) {
          setNearbyPlaces(payload.places);
          setPlacesSource(payload.source || 'civic_directory');
        }
      } catch {
        // Keep current list on error
      } finally {
        setLoadingPlaces(false);
      }
    },
    [facilityFilter],
  );

  useEffect(() => {
    void fetchNearbyServices(coords.lat, coords.lng, activeDistrict.nameEn);
  }, [activeDistrict.nameEn, coords.lat, coords.lng, fetchNearbyServices]);

  const handleUseGps = () => {
    if (!('geolocation' in navigator)) {
      setLocStatus(isBn ? 'ব্রাউজার GPS সমর্থন করে না।' : 'Geolocation unavailable in browser.');
      return;
    }
    setLocStatus(isBn ? 'অবস্থান নির্ণয় করা হচ্ছে...' : 'Locating your GPS coordinates...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCoords(next);
        setLocStatus(
          isBn
            ? `GPS অবস্থান নিশ্চিত হয়েছে (${next.lat.toFixed(4)}, ${next.lng.toFixed(4)})`
            : `GPS location locked (${next.lat.toFixed(4)}, ${next.lng.toFixed(4)})`,
        );
      },
      () => {
        setLocStatus(
          isBn
            ? `${activeDistrict.nameBn} কেন্দ্রের অবস্থান ব্যবহার করা হচ্ছে।`
            : `Using ${activeDistrict.nameEn} center coordinates.`,
        );
      },
      { enableHighAccuracy: true, timeout: 7000 },
    );
  };

  const sosMessage = isBn
    ? `জরুরি SOS সতর্কতা (${user.name}): আমার জরুরি সহায়তা প্রয়োজন। অবস্থান: ${activeDistrict.nameBn} (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}) — https://maps.google.com/?q=${coords.lat},${coords.lng}`
    : `URGENT SOS ALERT (${user.name}): Immediate assistance requested near ${activeDistrict.nameEn} (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}) — https://maps.google.com/?q=${coords.lat},${coords.lng}`;

  const handleTriggerSos = () => {
    setSosActivated(true);
    speakText(
      isBn
        ? 'জরুরি সহায়তা প্যানেল সক্রিয় হয়েছে। অবিলম্বে ৯৯৯ নম্বরে কল করুন অথবা বিশ্বস্ত পরিচিতজনকে অবস্থান পাঠান।'
        : 'Accessible SOS prepared. Dial 999 directly for immediate emergency dispatch or share your location with trusted contacts.',
    );
  };

  const handleCopySos = async () => {
    try {
      await navigator.clipboard.writeText(sosMessage);
      setCopiedSos(true);
      setTimeout(() => setCopiedSos(false), 3000);
    } catch {
      // ignore
    }
  };

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactPhone.trim()) return;
    addTrustedContact({
      name: contactName.trim(),
      relation: contactRelation.trim() || (isBn ? 'বিশ্বস্ত পরিচিত' : 'Trusted Contact'),
      phone: contactPhone.trim(),
    });
    setContactName('');
    setContactRelation('');
    setContactPhone('');
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-3xl p-5 sm:p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-xs font-semibold text-rose-600 dark:text-rose-300 flex items-center gap-1.5">
              <Siren className="w-4 h-4" />
              {isBn ? 'নাগরিক জরুরি সহায়তা ও এসওএস' : 'Citizen Emergency Assistance'}
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              {isBn
                ? 'প্রবেশগম্য SOS, যাচাইকৃত জরুরি হেল্পলাইন ও নিকটস্থ সেবা'
                : 'Accessible SOS, Verified Hotlines & Nearby Hospitals, Police & Fire'}
            </h1>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              {isBn
                ? 'দৃষ্টিপ্রতিবন্ধী, বধির ও প্রবীণ নাগরিকসহ সবার জন্য এক-ট্যাপ কল, জিপিএস এসওএস বার্তা এবং নিকটস্থ জরুরি কেন্দ্র।'
                : 'One-tap direct Bangladesh national emergency lines, shareable GPS SOS card, trusted contacts, and nearby facility lookup.'}
            </p>
          </div>

          <button
            type="button"
            onClick={handleUseGps}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-900 dark:bg-emerald-600 text-white"
          >
            <Navigation className="w-3.5 h-3.5" />
            {isBn ? 'আমার GPS অবস্থান ব্যবহার করুন' : 'Use My GPS Location'}
          </button>
        </div>

        {/* Accessible Big SOS Card */}
        <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-red-700 text-white shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-7 space-y-2">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/15 px-3 py-1 rounded-full">
              <AlertOctagon className="w-3.5 h-3.5" />
              {isBn ? 'তাৎক্ষণিক অ্যাক্সেসযোগ্য SOS প্যানেল' : 'Instant Accessible SOS Card'}
            </div>
            <h2 className="text-xl font-bold">
              {isBn
                ? 'জীবন-সংশয় জরুরি অবস্থায় সরাসরি ৯৯৯-এ কল করুন'
                : 'In life-threatening emergencies, dial 999 directly'}
            </h2>
            <p className="text-xs text-rose-100 leading-relaxed">
              {locStatus ||
                (isBn
                  ? `সক্রিয় অবস্থান: ${activeDistrict.nameBn} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`
                  : `Active coordinates: ${activeDistrict.nameEn} (${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)})`)}
            </p>
          </div>

          <div className="lg:col-span-5 flex flex-wrap gap-2.5 justify-start lg:justify-end">
            <a
              href="tel:999"
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-white text-rose-700 hover:bg-rose-50 rounded-2xl shadow-md"
            >
              <PhoneCall className="w-4 h-4" />
              {isBn ? 'কল ৯৯৯ (জরুরি)' : 'Call 999 Now'}
            </a>
            <button
              type="button"
              onClick={handleTriggerSos}
              className="inline-flex items-center gap-2 px-5 py-3 text-sm font-bold bg-slate-950/90 hover:bg-slate-950 text-white rounded-2xl border border-white/25"
            >
              <ShieldAlert className="w-4 h-4 text-amber-300" />
              {isBn ? 'SOS বার্তা প্রস্তুত করুন' : 'Prepare SOS Message'}
            </button>
          </div>

          {sosActivated && (
            <div className="lg:col-span-12 p-3.5 rounded-xl bg-slate-950/75 border border-white/20 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="font-mono break-all text-rose-100">{sosMessage}</div>
              <button
                type="button"
                onClick={handleCopySos}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-white text-slate-950 font-bold shrink-0"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedSos ? (isBn ? 'কপি হয়েছে ✓' : 'Copied ✓') : isBn ? 'বার্তা কপি করুন' : 'Copy SOS Text'}
              </button>
            </div>
          )}
        </div>

        {/* Verified National Emergency Hotlines Grid */}
        <div className="space-y-2.5">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white">
            {isBn ? 'বাংলাদেশের যাচাইকৃত জরুরি হটলাইনসমূহ' : 'Verified Bangladesh Emergency Hotlines'}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
            {VERIFIED_HOTLINES.map((h) => (
              <a
                key={h.code}
                href={`tel:${h.code}`}
                className="p-4 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 flex items-center justify-between gap-3 transition-colors"
              >
                <div>
                  <div className="font-mono text-xl font-bold text-emerald-700 dark:text-emerald-300">
                    {h.code}
                  </div>
                  <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                    {isBn ? h.bn : h.en}
                  </div>
                </div>
                <span className="p-2.5 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 shrink-0">
                  <PhoneCall className="w-4 h-4" />
                </span>
              </a>
            ))}
          </div>
        </div>

        {/* Nearby Hospitals / Police / Fire + Trusted Support Contacts */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
          {/* Nearby Emergency Places */}
          <div className="lg:col-span-7 space-y-3 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-emerald-600" />
                  {isBn
                    ? `নিকটস্থ হাসপাতাল, পুলিশ ও ফায়ার সার্ভিস (${activeDistrict.nameBn})`
                    : `Nearby Hospitals, Police & Fire Services (${activeDistrict.nameEn})`}
                </h3>
                <div className="text-[11px] text-slate-500 dark:text-slate-400">
                  {placesSource === 'google_places'
                    ? isBn
                      ? 'উৎস: Google Maps Places API'
                      : 'Source: Google Maps Places API'
                    : isBn
                      ? 'উৎস: যাচাইকৃত জেলা ডিরেক্টরি'
                      : 'Source: Verified District Civic Directory'}
                </div>
              </div>

              <div className="flex flex-wrap gap-1">
                {(
                  [
                    { id: 'all', en: 'All', bn: 'সব' },
                    { id: 'hospital', en: 'Hospitals', bn: 'হাসপাতাল' },
                    { id: 'police', en: 'Police', bn: 'পুলিশ' },
                    { id: 'fire_station', en: 'Fire', bn: 'ফায়ার সার্ভিস' },
                  ] as const
                ).map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setFacilityFilter(f.id)}
                    className={`px-2.5 py-1 rounded-lg font-semibold ${
                      facilityFilter === f.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700'
                    }`}
                  >
                    {isBn ? f.bn : f.en}
                  </button>
                ))}
              </div>
            </div>

            {loadingPlaces ? (
              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 text-slate-500">
                {isBn ? 'নিকটস্থ কেন্দ্র খোঁজা হচ্ছে...' : 'Searching nearby emergency facilities...'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {nearbyPlaces.map((p) => (
                  <div
                    key={p.id}
                    className="p-3.5 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-1.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                        {p.type === 'hospital' ? (
                          <Hospital className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        ) : p.type === 'fire_station' ? (
                          <Flame className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        ) : (
                          <ShieldAlert className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                        )}
                        {p.name}
                      </div>
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">{p.address}</div>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      {p.phone ? (
                        <a
                          href={`tel:${p.phone}`}
                          className="font-mono font-semibold text-emerald-700 dark:text-emerald-300 hover:underline"
                        >
                          {p.phone}
                        </a>
                      ) : (
                        <span className="font-mono text-slate-500">999 Dispatch</span>
                      )}
                      <a
                        href={p.mapsUri || `https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-sky-700 dark:text-sky-300 font-semibold hover:underline"
                      >
                        {isBn ? 'ম্যাপে দেখুন' : 'Directions'} <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Personal Trusted Support Contacts */}
          <div className="lg:col-span-5 space-y-3 text-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
              <UserPlus className="w-4 h-4 text-sky-600" />
              {isBn ? 'আপনার বিশ্বস্ত জরুরি পরিচিতজন' : 'Your Trusted Support Contacts'}
            </h3>

            <div className="space-y-2">
              {(user.trustedContacts || []).map((tc) => (
                <div
                  key={tc.id}
                  className="p-3 rounded-xl bg-white/80 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 flex items-center justify-between gap-2"
                >
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">
                      {tc.name} <span className="font-normal text-slate-500">({tc.relation})</span>
                    </div>
                    <a
                      href={`tel:${tc.phone}`}
                      className="font-mono text-emerald-700 dark:text-emerald-300 hover:underline"
                    >
                      {tc.phone}
                    </a>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeTrustedContact(tc.id)}
                    aria-label={`Remove ${tc.name}`}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <form
              onSubmit={handleAddContact}
              className="p-3.5 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 space-y-2"
            >
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                {isBn ? 'নতুন বিশ্বস্ত নম্বর যোগ করুন' : 'Add Trusted Contact'}
              </div>
              <input
                type="text"
                required
                value={contactName}
                onChange={(e) => setContactName(e.target.value)}
                placeholder={isBn ? 'নাম (যেমন: রফিক ভাই)' : 'Name (e.g. Rafiq Ahmed)'}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={contactRelation}
                  onChange={(e) => setContactRelation(e.target.value)}
                  placeholder={isBn ? 'সম্পর্ক' : 'Relation'}
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
                <input
                  type="tel"
                  required
                  value={contactPhone}
                  onChange={(e) => setContactPhone(e.target.value)}
                  placeholder="+880 1XXX-XXXXXX"
                  className="px-3 py-2 rounded-lg bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
                />
              </div>
              <button
                type="submit"
                className="w-full py-2 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl inline-flex items-center justify-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                {isBn ? 'সংরক্ষণ করুন' : 'Save Trusted Contact'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
