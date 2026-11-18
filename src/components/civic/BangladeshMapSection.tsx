import {
  AdvancedMarker,
  APIProvider,
  InfoWindow,
  Map as GoogleMap,
  Pin,
  useMap,
} from '@vis.gl/react-google-maps';
import {
  Building2,
  CheckCircle2,
  Compass,
  Filter,
  MapPin,
  Navigation,
  Phone,
  PlusCircle,
  Send,
  Star,
  ThumbsUp,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import {
  BANGLADESH_DISTRICTS,
  BANGLADESH_DIVISIONS,
  BANGLADESH_OUTLINE_PATH,
  projectLatLng,
} from '../../data/bangladeshGeoData';
import type { MapProblemCategory, MapProblemReport } from '../../types/civicsphere';

const PROBLEM_CATEGORIES: Array<{
  id: MapProblemCategory;
  en: string;
  bn: string;
  color: string;
}> = [
  { id: 'Broken Road', en: 'Broken Road', bn: 'ভাঙা রাস্তা', color: '#e11d48' },
  { id: 'Drainage', en: 'Drainage', bn: 'জলাবদ্ধতা ও ড্রেন', color: '#0284c7' },
  { id: 'Unsafe Street', en: 'Unsafe Street', bn: 'অনিরাপদ রাস্তা', color: '#d97706' },
  { id: 'Water Problem', en: 'Water Problem', bn: 'পানির সমস্যা', color: '#0891b2' },
  { id: 'Waste', en: 'Waste', bn: 'বর্জ্য অব্যবস্থাপনা', color: '#65a30d' },
  { id: 'Missing Streetlight', en: 'Missing Streetlight', bn: 'সড়কবাতি বিকল', color: '#7c3aed' },
];

function DistrictCameraSync({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    map.panTo({ lat, lng });
  }, [map, lat, lng]);
  return null;
}

export function BangladeshMapSection({ compact = false }: { compact?: boolean }) {
  const {
    language,
    theme,
    selectedDistrictId,
    setSelectedDistrictId,
    complaints,
    submitComplaint,
    mapReports,
    submitMapReport,
    upvoteMapReport,
    events,
    notices,
    googleMapsApiKey,
    setActiveView,
  } = useCivic();

  const isBn = language === 'bn';
  const [mapMode, setMapMode] = useState<'google' | 'vector'>(
    googleMapsApiKey ? 'google' : 'vector',
  );
  const [divisionFilter, setDivisionFilter] = useState<string>('all');
  const [muniFilter, setMuniFilter] = useState<string>('all');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('all');
  const [selectedWard, setSelectedWard] = useState<string>('all');
  const [officeTypeFilter, setOfficeTypeFilter] = useState<string>('all');

  // Map Problem Reporting State
  const [problemFilter, setProblemFilter] = useState<'all' | MapProblemCategory>('all');
  const [draftPin, setDraftPin] = useState<{ lat: number; lng: number } | null>(null);
  const [selectedReport, setSelectedReport] = useState<MapProblemReport | null>(null);
  const [probCategory, setProbCategory] = useState<MapProblemCategory>('Broken Road');
  const [probTitle, setProbTitle] = useState('');
  const [probAddress, setProbAddress] = useState('');
  const [probDesc, setProbDesc] = useState('');
  const [probPhotoName, setProbPhotoName] = useState('');
  const [probSuccess, setProbSuccess] = useState<string | null>(null);

  // District municipal complaint form
  const [cmpTitle, setCmpTitle] = useState('');
  const [cmpCategory, setCmpCategory] = useState('Waste Management');
  const [cmpDesc, setCmpDesc] = useState('');
  const [cmpSuccess, setCmpSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (googleMapsApiKey && mapMode === 'vector') {
      setMapMode('google');
    }
  }, [googleMapsApiKey]);

  const filteredDistricts = useMemo(() => {
    return BANGLADESH_DISTRICTS.filter((d) => {
      if (divisionFilter !== 'all' && d.divisionId !== divisionFilter) return false;
      if (muniFilter !== 'all' && d.municipalityType !== muniFilter) return false;
      return true;
    });
  }, [divisionFilter, muniFilter]);

  const activeDistrict = useMemo(
    () =>
      BANGLADESH_DISTRICTS.find((d) => d.id === selectedDistrictId) ||
      BANGLADESH_DISTRICTS[0],
    [selectedDistrictId],
  );

  // Use Record instead of JS Map to avoid shadowing Google Maps <Map>
  const divisionColorLookup = useMemo(() => {
    const acc: Record<string, string> = {};
    for (const div of BANGLADESH_DIVISIONS) {
      acc[div.id] = div.colorHex;
    }
    return acc;
  }, []);

  const visibleReports = useMemo(() => {
    return mapReports.filter((r) => {
      if (problemFilter !== 'all' && r.category !== problemFilter) return false;
      return true;
    });
  }, [mapReports, problemFilter]);

  const districtOffices = useMemo(() => {
    return activeDistrict.offices.filter(
      (o) => officeTypeFilter === 'all' || o.type === officeTypeFilter,
    );
  }, [activeDistrict, officeTypeFilter]);

  const districtComplaints = useMemo(
    () =>
      complaints.filter(
        (c) => c.district.toLowerCase() === activeDistrict.nameEn.toLowerCase(),
      ),
    [activeDistrict.nameEn, complaints],
  );

  const districtEvents = useMemo(
    () =>
      events.filter(
        (e) =>
          e.district.toLowerCase() === activeDistrict.nameEn.toLowerCase() ||
          e.district === 'Nationwide',
      ),
    [activeDistrict.nameEn, events],
  );

  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      setDraftPin({ lat: activeDistrict.lat, lng: activeDistrict.lng });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setDraftPin({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => {
        setDraftPin({ lat: activeDistrict.lat, lng: activeDistrict.lng });
      },
      { enableHighAccuracy: true, timeout: 6000 },
    );
  };

  const handleSubmitMapIssue = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!probTitle.trim() || !probDesc.trim()) return;
    const pin = draftPin || { lat: activeDistrict.lat, lng: activeDistrict.lng };
    const created = await submitMapReport({
      category: probCategory,
      district: activeDistrict.nameEn,
      lat: pin.lat,
      lng: pin.lng,
      addressLabel:
        probAddress.trim() || `${activeDistrict.nameEn} (${pin.lat.toFixed(4)}, ${pin.lng.toFixed(4)})`,
      title: probTitle,
      description: probDesc,
      photoName: probPhotoName || undefined,
    });
    if (created) {
      setProbSuccess(
        isBn
          ? `আপনার সমস্যাটি মানচিত্রে পিন করা হয়েছে (${created.id}) (+৩৫ পয়েন্ট)।`
          : `Problem pinned on public map under ${created.id} (+35 Civic Points).`,
      );
      setProbTitle('');
      setProbAddress('');
      setProbDesc('');
      setProbPhotoName('');
      setDraftPin(null);
      setSelectedReport(created);
    }
  };

  const handleComplaintSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cmpTitle.trim() || !cmpDesc.trim()) return;
    const created = await submitComplaint({
      category: cmpCategory,
      district: activeDistrict.nameEn,
      ward: selectedWard === 'all' ? 'Ward 01' : selectedWard,
      title: cmpTitle,
      description: cmpDesc,
    });
    if (created) {
      setCmpSuccess(
        isBn
          ? `অভিযোগ নথিভুক্ত হয়েছে (${created.id}) — ${activeDistrict.nameBn}`
          : `Complaint logged under ${created.id} for ${activeDistrict.nameEn}.`,
      );
      setCmpTitle('');
      setCmpDesc('');
    }
  };

  const statusLabel = (s: MapProblemReport['status']) => {
    if (!isBn) return s;
    if (s === 'Reported') return 'প্রতিবেদিত';
    if (s === 'Verified') return 'যাচাইকৃত';
    if (s === 'Crew Assigned') return 'কর্মী নিয়োজিত';
    return 'সমাধানকৃত';
  };

  return (
    <section className="space-y-5">
      {/* Filter & Map Mode Bar */}
      <div className="glass-panel rounded-2xl p-4 md:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {isBn
                ? 'বাংলাদেশ লাইভ নাগরিক মানচিত্র ও সমস্যা প্রতিবেদন'
                : 'Bangladesh Live Civic Map & Problem Reporting'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              {isBn
                ? 'Google মানচিত্রে যেকোনো স্থানে ট্যাপ করে ভাঙা রাস্তা, ড্রেনেজ, পানির সমস্যা, বর্জ্য বা সড়কবাতি রিপোর্ট করুন এবং সমাধান ট্র্যাক করুন।'
                : 'Tap any spot on Google Maps to report broken roads, drainage, unsafe streets, water issues, waste, or missing streetlights and track public resolution.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-white/10 text-xs">
              <button
                type="button"
                onClick={() => setMapMode('google')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  mapMode === 'google'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {isBn ? 'গুগল ম্যাপ (লাইভ)' : 'Google Map'}
              </button>
              <button
                type="button"
                onClick={() => setMapMode('vector')}
                className={`px-3 py-1.5 rounded-lg font-semibold transition-colors ${
                  mapMode === 'vector'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700 dark:text-slate-300'
                }`}
              >
                {isBn ? '৬৪ জেলা মানচিত্র' : '64-District Map'}
              </button>
            </div>

            {compact && (
              <button
                type="button"
                onClick={() => setActiveView('map')}
                className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl transition-all"
              >
                {isBn ? 'সম্পূর্ণ মানচিত্র খুলুন' : 'Open Full Map Hub'}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          <select
            aria-label={isBn ? 'বিভাগ ফিল্টার' : 'Filter by Division'}
            value={divisionFilter}
            onChange={(e) => {
              setDivisionFilter(e.target.value);
              const first = BANGLADESH_DISTRICTS.find(
                (d) => e.target.value === 'all' || d.divisionId === e.target.value,
              );
              if (first) setSelectedDistrictId(first.id);
            }}
            className="px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">{isBn ? 'সকল ৮টি বিভাগ' : 'All 8 Divisions'}</option>
            {BANGLADESH_DIVISIONS.map((div) => (
              <option key={div.id} value={div.id}>
                {isBn ? div.nameBn : div.nameEn}
              </option>
            ))}
          </select>

          <select
            aria-label={isBn ? 'জেলা নির্বাচন' : 'Select District'}
            value={activeDistrict.id}
            onChange={(e) => {
              setSelectedDistrictId(e.target.value);
              setSelectedUpazila('all');
            }}
            className="px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            {filteredDistricts.map((d) => (
              <option key={d.id} value={d.id}>
                {isBn ? `${d.nameBn} (${d.nameEn})` : `${d.nameEn} (${d.nameBn})`}
              </option>
            ))}
          </select>

          <select
            aria-label={isBn ? 'স্থানীয় সরকার ধরন' : 'Filter by Municipality Type'}
            value={muniFilter}
            onChange={(e) => setMuniFilter(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">{isBn ? 'সকল পৌরসভা ও সিটি' : 'All Local Bodies'}</option>
            <option value="City Corporation">{isBn ? 'সিটি কর্পোরেশন' : 'City Corporations'}</option>
            <option value="Pourashava">{isBn ? 'পৌরসভা' : 'Pourashavas'}</option>
          </select>

          <select
            aria-label={isBn ? 'উপজেলা' : 'Filter by Upazila'}
            value={selectedUpazila}
            onChange={(e) => setSelectedUpazila(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">
              {isBn ? `সকল উপজেলা (${activeDistrict.upazilas.length})` : `All Upazilas (${activeDistrict.upazilas.length})`}
            </option>
            {activeDistrict.upazilas.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </select>

          <select
            aria-label={isBn ? 'ওয়ার্ড' : 'Filter by Ward'}
            value={selectedWard}
            onChange={(e) => setSelectedWard(e.target.value)}
            className="px-3 py-2 text-xs rounded-xl bg-white/80 dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
          >
            <option value="all">{isBn ? 'সকল ওয়ার্ড' : 'All Wards'}</option>
            {activeDistrict.wards.map((w) => (
              <option key={w} value={w}>
                {w}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Interactive Map + Report a Problem / Municipality Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: Interactive Google Map OR 64-District Vector Explorer */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-4 flex flex-col justify-between gap-3">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600 dark:text-slate-300">
            <span className="font-semibold flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-emerald-600" />
              {mapMode === 'google' && googleMapsApiKey
                ? isBn
                  ? 'মানচিত্রে ক্লিক করে সমস্যার পিন বসান'
                  : 'Click anywhere on Google Maps to drop a problem pin'
                : isBn
                  ? '৬৪ জেলা · যেকোনো জেলায় ক্লিক করুন'
                  : '64 Districts Plotted · Click any marker'}
            </span>
            <button
              type="button"
              onClick={handleLocateMe}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-semibold"
            >
              <Navigation className="w-3 h-3" />
              {isBn ? 'আমার অবস্থান' : 'My GPS'}
            </button>
          </div>

          {mapMode === 'google' && googleMapsApiKey ? (
            <div className="relative rounded-2xl overflow-hidden border border-slate-200/80 dark:border-slate-700 h-[430px] md:h-[490px] bg-slate-100 dark:bg-slate-950">
              <APIProvider
                apiKey={googleMapsApiKey}
                language={isBn ? 'bn' : 'en'}
                region="BD"
                libraries={['places', 'marker']}
              >
                <GoogleMap
                  mapId="DEMO_MAP_ID"
                  defaultCenter={{ lat: activeDistrict.lat, lng: activeDistrict.lng }}
                  defaultZoom={12}
                  colorScheme={theme === 'dark' ? 'DARK' : 'LIGHT'}
                  gestureHandling="greedy"
                  internalUsageAttributionIds={['gmp_mcp_codeassist_v1_aistudio']}
                  onClick={(ev) => {
                    const latLng = ev.detail?.latLng;
                    if (latLng) {
                      setDraftPin({ lat: latLng.lat, lng: latLng.lng });
                      setSelectedReport(null);
                    }
                  }}
                >
                  <DistrictCameraSync lat={activeDistrict.lat} lng={activeDistrict.lng} />

                  {/* Existing Citizen Problem Pins */}
                  {visibleReports.map((rep) => {
                    const cat = PROBLEM_CATEGORIES.find((c) => c.id === rep.category);
                    const bgColor =
                      rep.status === 'Resolved'
                        ? '#10b981'
                        : cat?.color || '#0284c7';
                    return (
                      <AdvancedMarker
                        key={rep.id}
                        position={{ lat: rep.lat, lng: rep.lng }}
                        title={`${rep.category}: ${rep.title}`}
                        onClick={() => setSelectedReport(rep)}
                      >
                        <Pin background={bgColor} borderColor="#ffffff" glyphColor="#ffffff" />
                      </AdvancedMarker>
                    );
                  })}

                  {/* Draft Pin Dropped by Citizen */}
                  {draftPin && (
                    <AdvancedMarker
                      position={draftPin}
                      title={isBn ? 'নতুন সমস্যার অবস্থান' : 'New Problem Pin'}
                    >
                      <Pin background="#059669" borderColor="#ffffff" glyphColor="#ffffff" scale={1.2} />
                    </AdvancedMarker>
                  )}

                  {/* Selected Report InfoWindow */}
                  {selectedReport && (
                    <InfoWindow
                      position={{ lat: selectedReport.lat, lng: selectedReport.lng }}
                      onCloseClick={() => setSelectedReport(null)}
                    >
                      <div className="p-1 max-w-[230px] text-slate-900 space-y-1 text-xs">
                        <div className="font-bold text-emerald-700">
                          {selectedReport.id} · {statusLabel(selectedReport.status)}
                        </div>
                        <div className="font-bold">{selectedReport.title}</div>
                        <div className="text-slate-600">{selectedReport.addressLabel}</div>
                        <p className="text-slate-700">{selectedReport.description}</p>
                        <button
                          type="button"
                          onClick={() => upvoteMapReport(selectedReport.id)}
                          className="mt-1 inline-flex items-center gap-1 px-2.5 py-1 rounded bg-emerald-600 text-white font-semibold"
                        >
                          <ThumbsUp className="w-3 h-3" /> {selectedReport.upvotes}
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </APIProvider>
            </div>
          ) : (
            <div className="relative rounded-xl bg-sky-50/70 dark:bg-slate-950/75 border border-slate-200/70 dark:border-slate-800 p-2 overflow-hidden">
              <svg
                viewBox="0 0 600 760"
                role="img"
                aria-label="Interactive map of Bangladesh showing all 64 districts"
                className="w-full h-[430px] md:h-[490px] select-none"
              >
                <path
                  d={BANGLADESH_OUTLINE_PATH}
                  className="fill-sky-100/80 dark:fill-slate-900/90 stroke-sky-600/50 dark:stroke-sky-400/40"
                  strokeWidth={2.5}
                />

                {BANGLADESH_DISTRICTS.map((d) => {
                  const { x, y } = projectLatLng(d.lat, d.lng);
                  const isMatched = filteredDistricts.some((fd) => fd.id === d.id);
                  const isSelected = d.id === activeDistrict.id;
                  const fill = divisionColorLookup[d.divisionId] || '#0284c7';

                  return (
                    <g
                      key={d.id}
                      className="cursor-pointer"
                      onClick={() => {
                        setSelectedDistrictId(d.id);
                        setDraftPin({ lat: d.lat, lng: d.lng });
                      }}
                      style={{ opacity: isMatched ? 1 : 0.2 }}
                    >
                      {isSelected && (
                        <circle
                          cx={x}
                          cy={y}
                          r={15}
                          fill="none"
                          stroke="#059669"
                          strokeWidth={2}
                          opacity={0.8}
                        />
                      )}
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 7.5 : d.municipalityType === 'City Corporation' ? 6 : 4.2}
                        fill={isSelected ? '#10b981' : fill}
                        stroke="#ffffff"
                        strokeWidth={1.5}
                      />
                      {(isSelected || d.municipalityType === 'City Corporation') && (
                        <text
                          x={x + 9}
                          y={y + 4}
                          fontSize={isSelected ? 12 : 10}
                          fontWeight={isSelected ? 700 : 500}
                          className="fill-slate-900 dark:fill-slate-100 pointer-events-none"
                        >
                          {isBn ? d.nameBn : d.nameEn}
                        </text>
                      )}
                    </g>
                  );
                })}
              </svg>
            </div>
          )}

          {/* Category Filter Chips for Map Problem Pins */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setProblemFilter('all')}
              className={`px-2.5 py-1 rounded-lg font-semibold border ${
                problemFilter === 'all'
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-white/75 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
              }`}
            >
              {isBn ? `সকল পিন (${mapReports.length})` : `All Issues (${mapReports.length})`}
            </button>
            {PROBLEM_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setProblemFilter(cat.id)}
                className={`px-2.5 py-1 rounded-lg font-semibold border ${
                  problemFilter === cat.id
                    ? 'bg-slate-900 dark:bg-emerald-500 text-white dark:text-slate-950 border-transparent'
                    : 'bg-white/75 dark:bg-slate-900 border-slate-200 dark:border-slate-700'
                }`}
              >
                {isBn ? cat.bn : cat.en}
              </button>
            ))}
          </div>
        </div>

        {/* Right: Report a Problem on the Map + Live Resolution Tracker */}
        <div className="lg:col-span-6 glass-panel rounded-2xl p-5 space-y-5">
          {/* Quick District Header */}
          <div className="flex flex-wrap items-start justify-between gap-3 pb-3 border-b border-slate-200/70 dark:border-slate-800">
            <div>
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isBn ? activeDistrict.divisionBn : activeDistrict.divisionEn} · {activeDistrict.municipalityType}
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {isBn ? `${activeDistrict.nameBn} (${activeDistrict.nameEn})` : `${activeDistrict.nameEn} (${activeDistrict.nameBn})`}
              </h3>
            </div>
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">
                {isBn ? 'নাগরিক সন্তুষ্টি' : 'Citizen Satisfaction'}
              </div>
              <div className="inline-flex items-center gap-1 text-lg font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-300">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                {activeDistrict.dashboard.satisfactionRating}/5.0
              </div>
            </div>
          </div>

          {/* Feature 1: Report a Problem on the Map Form */}
          <form
            onSubmit={handleSubmitMapIssue}
            className="p-4 rounded-2xl bg-white/80 dark:bg-slate-900/75 border border-emerald-500/20 space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                <PlusCircle className="w-4 h-4 text-emerald-600" />
                {isBn ? 'মানচিত্রে নাগরিক সমস্যা রিপোর্ট করুন' : 'Report a Problem on the Map'}
              </h4>
              <span className="font-mono text-[11px] text-emerald-700 dark:text-emerald-300">
                {draftPin
                  ? `${draftPin.lat.toFixed(4)}, ${draftPin.lng.toFixed(4)}`
                  : isBn
                    ? `পিন: ${activeDistrict.nameBn}`
                    : `Pin: ${activeDistrict.nameEn} Center`}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <select
                aria-label={isBn ? 'সমস্যার ধরন' : 'Problem Category'}
                value={probCategory}
                onChange={(e) => setProbCategory(e.target.value as MapProblemCategory)}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              >
                {PROBLEM_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isBn ? c.bn : c.en}
                  </option>
                ))}
              </select>

              <input
                type="text"
                value={probAddress}
                onChange={(e) => setProbAddress(e.target.value)}
                placeholder={isBn ? 'রাস্তা বা এলাকার নাম...' : 'Street / landmark address...'}
                className="px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
              />
            </div>

            <input
              type="text"
              required
              value={probTitle}
              onChange={(e) => setProbTitle(e.target.value)}
              placeholder={
                isBn
                  ? 'সমস্যার সংক্ষিপ্ত শিরোনাম (যেমন: রাস্তার মাঝখানে ম্যানহোল খোলা)...'
                  : 'Short issue headline (e.g. Open manhole on Banani Road 11)...'
              }
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />

            <textarea
              rows={2}
              required
              value={probDesc}
              onChange={(e) => setProbDesc(e.target.value)}
              placeholder={
                isBn
                  ? 'বিস্তারিত বিবরণ লিখুন যাতে পৌর কর্তৃপক্ষ দ্রুত ব্যবস্থা নিতে পারে...'
                  : 'Describe the hazard, broken road, waterlogging, or broken streetlight...'
              }
              className="w-full px-3 py-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700"
            />

            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="inline-flex items-center gap-1.5 text-[11px] text-slate-600 dark:text-slate-300 cursor-pointer">
                <span>{isBn ? 'ছবি সংযুক্তি:' : 'Photo evidence:'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setProbPhotoName(e.target.files?.[0]?.name || '')}
                  className="text-[11px] max-w-[170px]"
                />
              </label>
              <button
                type="submit"
                className="inline-flex items-center gap-1.5 px-4 py-2 font-bold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl"
              >
                <Compass className="w-3.5 h-3.5" />
                {isBn ? 'মানচিত্রে পিন পোস্ট করুন' : 'Pin Issue to Public Map'}
              </button>
            </div>

            {probSuccess && (
              <p className="text-emerald-700 dark:text-emerald-300 flex items-center gap-1 font-medium">
                <CheckCircle2 className="w-3.5 h-3.5" /> {probSuccess}
              </p>
            )}
          </form>

          {/* Public Resolution Tracker Feed */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <h4 className="font-bold text-slate-800 dark:text-slate-100">
                {isBn ? 'পাবলিক সমস্যা সমাধান ট্র্যাকার' : 'Public Map Issue Resolution Tracker'}
              </h4>
              <span className="font-mono text-slate-500">
                {visibleReports.length} {isBn ? 'টি রিপোর্ট' : 'reports'}
              </span>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {visibleReports.slice(0, compact ? 3 : 8).map((rep) => (
                <div
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className="p-3 rounded-xl bg-white/75 dark:bg-slate-900/75 border border-slate-200 dark:border-slate-800 hover:border-emerald-500 cursor-pointer text-xs space-y-1.5 transition-colors"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">
                      {rep.id} ·{' '}
                      {isBn
                        ? PROBLEM_CATEGORIES.find((c) => c.id === rep.category)?.bn || rep.category
                        : rep.category}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                        rep.status === 'Resolved'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-500/20 dark:text-emerald-200'
                          : 'bg-sky-100 text-sky-800 dark:bg-sky-500/20 dark:text-sky-200'
                      }`}
                    >
                      {statusLabel(rep.status)}
                    </span>
                  </div>
                  <div className="font-bold text-slate-900 dark:text-white">{rep.title}</div>
                  <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <span>
                      {rep.addressLabel} · {rep.createdAt}
                    </span>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        void upvoteMapReport(rep.id);
                      }}
                      className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-semibold hover:bg-emerald-100"
                    >
                      <ThumbsUp className="w-3 h-3 text-emerald-600" /> {rep.upvotes}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Public Offices & Municipality Metrics */}
          {!compact && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <div className="p-3 rounded-xl bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'বরাদ্দকৃত বাজেট' : 'Allocated Budget'}
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    ৳{activeDistrict.dashboard.allocatedBudgetCrore} Cr
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'ব্যয়িত অর্থ' : 'Spent (Verified)'}
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
                    ৳{activeDistrict.dashboard.spentBudgetCrore} Cr
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'সমাধানের হার' : 'Resolution Rate'}
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-emerald-700 dark:text-emerald-400 mt-0.5">
                    {activeDistrict.dashboard.complaintResolutionRate}%
                  </div>
                </div>
                <div className="p-3 rounded-xl bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800">
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    {isBn ? 'স্বচ্ছতা সূচক' : 'Transparency Index'}
                  </div>
                  <div className="text-sm font-bold font-mono tabular-nums text-sky-700 dark:text-sky-300 mt-0.5">
                    {activeDistrict.dashboard.transparencyScore}/100
                  </div>
                </div>
              </div>

              {/* Public Offices */}
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-sky-600" />
                    {isBn ? 'সরকারি অফিস, হাসপাতাল ও পুলিশ' : 'Public Offices, Hospitals & Police'}
                  </h4>
                  <div className="flex items-center gap-1">
                    <Filter className="w-3 h-3 text-slate-400" />
                    <select
                      aria-label="Filter public facility type"
                      value={officeTypeFilter}
                      onChange={(e) => setOfficeTypeFilter(e.target.value)}
                      className="px-2 py-1 text-xs rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                    >
                      <option value="all">{isBn ? 'সকল কেন্দ্র' : 'All Facilities'}</option>
                      <option value="Municipality">Municipality</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Clinic">Community Clinic</option>
                      <option value="Police">Police Station</option>
                      <option value="Fire">Fire Station</option>
                      <option value="Legal Aid">Legal Aid</option>
                      <option value="School">School &amp; College</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {districtOffices.map((ofc) => (
                    <div
                      key={ofc.name}
                      className="p-3 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-1"
                    >
                      <div className="font-semibold text-slate-900 dark:text-white">{ofc.name}</div>
                      <div className="text-slate-500 dark:text-slate-400">
                        {ofc.type} · {ofc.address}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                        <span>{ofc.accessible ? 'Wheelchair Accessible' : 'Limited Access Info'}</span>
                        {ofc.phone && (
                          <span className="inline-flex items-center gap-1 font-mono text-sky-700 dark:text-sky-300">
                            <Phone className="w-3 h-3" /> {ofc.phone}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Councillors, Notices & Ward Complaint */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-slate-200/70 dark:border-slate-800">
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {isBn ? 'স্থানীয় প্রতিনিধি ও নোটিশ' : 'Local Representatives & Notices'}
                  </h4>
                  {activeDistrict.dashboard.councillors.map((c) => (
                    <div key={c.name} className="text-xs text-slate-700 dark:text-slate-300">
                      <span className="font-semibold">{c.name}</span> — {c.portfolio}
                    </div>
                  ))}
                  <div className="pt-2 space-y-1.5">
                    {[...activeDistrict.dashboard.notices, ...notices.slice(0, 2)].map((n) => (
                      <div
                        key={n.id}
                        className="p-2.5 rounded-lg bg-sky-50/70 dark:bg-sky-950/40 text-xs text-slate-800 dark:text-slate-200"
                      >
                        <div className="font-medium">{isBn ? n.titleBn : n.titleEn}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {'date' in n ? n.date : n.publishedAt}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {isBn
                      ? `আসন্ন সভা ও ইভেন্ট: ${districtEvents.length}টি নির্ধারিত`
                      : `Upcoming Meetings & Events: ${districtEvents.length} scheduled`}
                  </div>
                </div>

                <form onSubmit={handleComplaintSubmit} className="space-y-2.5">
                  <h4 className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                    {isBn
                      ? `পৌর সেবা অভিযোগ (${activeDistrict.nameBn})`
                      : `Submit Ward Complaint (${activeDistrict.nameEn})`}
                  </h4>
                  <select
                    aria-label="Complaint category"
                    value={cmpCategory}
                    onChange={(e) => setCmpCategory(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  >
                    <option>Waste Management</option>
                    <option>Water &amp; Drainage</option>
                    <option>Road Maintenance</option>
                    <option>Streetlights</option>
                    <option>Local Certificate Delay</option>
                  </select>
                  <input
                    type="text"
                    required
                    value={cmpTitle}
                    onChange={(e) => setCmpTitle(e.target.value)}
                    placeholder={isBn ? 'অভিযোগের শিরোনাম...' : 'Short issue title...'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <textarea
                    rows={2}
                    required
                    value={cmpDesc}
                    onChange={(e) => setCmpDesc(e.target.value)}
                    placeholder={isBn ? 'এলাকা ও বিস্তারিত তথ্য...' : 'Location details and issue summary...'}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-xl"
                  >
                    <Send className="w-3.5 h-3.5" /> {isBn ? 'ওয়ার্ড অভিযোগ পাঠান' : 'Log Ward Complaint'}
                  </button>
                  {cmpSuccess && (
                    <p className="text-xs text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> {cmpSuccess}
                    </p>
                  )}
                  {districtComplaints.length > 0 && (
                    <div className="pt-1 text-[11px] text-slate-500 dark:text-slate-400">
                      Recent in {activeDistrict.nameEn}: {districtComplaints[0].title} ({districtComplaints[0].status})
                    </div>
                  )}
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
