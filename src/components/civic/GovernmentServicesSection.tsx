import {
  ArrowRight,
  Bookmark,
  Briefcase,
  Building2,
  CheckSquare,
  Download,
  ExternalLink,
  FileBadge2,
  HeartPulse,
  IdCard,
  Scale,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { useCivic } from '../../context/CivicContext';
import { GOVERNMENT_SERVICES, SERVICE_CATEGORIES } from '../../data/civicDataset';
import type { GovernmentService, ServiceCategoryId } from '../../types/civicsphere';
import { downloadBrailleGuide } from '../../utils/brailleConverter';

const CATEGORY_ICON_STYLE: Record<
  ServiceCategoryId,
  { Icon: typeof IdCard; boxClass: string }
> = {
  nid: {
    Icon: IdCard,
    boxClass: 'bg-sky-100 dark:bg-sky-500/15 text-sky-700 dark:text-sky-300',
  },
  civil: {
    Icon: FileBadge2,
    boxClass: 'bg-emerald-100 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-300',
  },
  local: {
    Icon: Building2,
    boxClass: 'bg-amber-100 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300',
  },
  social: {
    Icon: ShieldCheck,
    boxClass: 'bg-violet-100 dark:bg-violet-500/15 text-violet-700 dark:text-violet-300',
  },
  health: {
    Icon: HeartPulse,
    boxClass: 'bg-rose-100 dark:bg-rose-500/15 text-rose-700 dark:text-rose-300',
  },
  legal: {
    Icon: Scale,
    boxClass: 'bg-indigo-100 dark:bg-indigo-500/15 text-indigo-700 dark:text-indigo-300',
  },
  business: {
    Icon: Briefcase,
    boxClass: 'bg-teal-100 dark:bg-teal-500/15 text-teal-700 dark:text-teal-300',
  },
};

export function GovernmentServicesSection({ compact = false }: { compact?: boolean }) {
  const {
    language,
    savedServiceIds,
    toggleSaveService,
    generateChecklistForService,
    openSphereWithPrompt,
    speakText,
    selectedServiceId,
    setSelectedServiceId,
    setActiveView,
  } = useCivic();

  const [category, setCategory] = useState<ServiceCategoryId | 'all'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [shareToast, setShareToast] = useState<string | null>(null);

  const filteredServices = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return GOVERNMENT_SERVICES.filter((svc) => {
      if (category !== 'all' && svc.category !== category) return false;
      if (!q) return true;
      return (
        svc.titleEn.toLowerCase().includes(q) ||
        svc.titleBn.toLowerCase().includes(q) ||
        svc.summaryEn.toLowerCase().includes(q) ||
        svc.summaryBn.toLowerCase().includes(q)
      );
    });
  }, [category, searchTerm]);

  const activeService: GovernmentService | null = useMemo(
    () => GOVERNMENT_SERVICES.find((s) => s.id === selectedServiceId) || null,
    [selectedServiceId],
  );

  const displayedServices = compact ? filteredServices.slice(0, 6) : filteredServices;

  const handleShareService = async (svc: GovernmentService) => {
    try {
      await navigator.clipboard.writeText(
        `${svc.titleEn} (${svc.titleBn}) — Office: ${svc.officeEn} | Portal: ${svc.officialPortalUrl || 'Local Office'} | Helpline: ${svc.helpline || '333'}`,
      );
      setShareToast('Service instructions copied to clipboard.');
      setTimeout(() => setShareToast(null), 2600);
    } catch {
      setShareToast('Use Guide Export or Sphere AI to share.');
    }
  };

  return (
    <section className="space-y-5">
      <div className="glass-panel rounded-2xl p-6 space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              {language === 'bn' ? 'আমাদের সরকারি সেবাসমূহ' : 'Government Services Directory'}
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Verified guidance for NID, Civil Registration, Municipal Services, Social Protection, Health, Legal Aid, and Business.
            </p>
          </div>
          {compact && (
            <button
              type="button"
              onClick={() => setActiveView('services')}
              className="px-3.5 py-2 text-xs font-semibold bg-gradient-to-r from-emerald-600 to-sky-600 hover:from-emerald-700 hover:to-sky-700 text-white rounded-xl transition-all"
            >
              Browse All {GOVERNMENT_SERVICES.length} Services
            </button>
          )}
        </div>

        {/* Category Filter Tabs + Search */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between">
          <div className="flex items-center gap-1 p-1 bg-slate-100/90 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setCategory('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                category === 'all'
                  ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              All Categories
            </button>
            {SERVICE_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap shrink-0 transition-colors ${
                  category === cat.id
                    ? 'bg-emerald-600 text-white dark:bg-emerald-200 dark:text-slate-950 font-semibold'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {language === 'bn' ? cat.labelBn : cat.labelEn}
              </button>
            ))}
          </div>

          <div className="relative min-w-[220px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter services..."
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-white/85 dark:bg-slate-900 border border-slate-200 dark:border-emerald-500/20"
            />
          </div>
        </div>

        {/* Service Cards Grid */}
        <div className="gsap-stagger-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayedServices.map((svc) => {
            const isSaved = savedServiceIds.includes(svc.id);
            const meta = CATEGORY_ICON_STYLE[svc.category];
            const CatIcon = meta.Icon;

            return (
              <article
                key={svc.id}
                className="civic-card-hover p-5 rounded-2xl bg-white/85 dark:bg-slate-900/75 border border-slate-200/80 dark:border-emerald-500/15 flex flex-col justify-between gap-4"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${meta.boxClass}`}
                    >
                      <CatIcon className="w-5 h-5" />
                    </div>
                    <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 truncate">
                      {language === 'bn' ? svc.categoryLabelBn : svc.categoryLabelEn}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {language === 'bn' ? svc.titleBn : svc.titleEn}
                    </h3>
                    <p className="text-xs text-slate-600 dark:text-slate-300 mt-1.5 leading-relaxed">
                      {language === 'bn' ? svc.summaryBn : svc.summaryEn}
                    </p>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-white/10 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => toggleSaveService(svc.id)}
                      aria-label={isSaved ? 'Remove from saved services' : 'Save service'}
                      className={`p-1.5 rounded-lg border text-xs transition-colors ${
                        isSaved
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-400 text-emerald-700 dark:text-emerald-300'
                          : 'border-slate-200 dark:border-slate-700 text-slate-500 hover:border-emerald-500'
                      }`}
                    >
                      <Bookmark className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        speakText(
                          `${svc.titleEn}. ${svc.summaryEn}. Office: ${svc.officeEn}.`,
                        )
                      }
                      aria-label="Listen to service summary"
                      className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-700 text-slate-500 hover:text-emerald-700 dark:hover:text-emerald-300"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 pl-1">
                      Helpline {svc.helpline || '333'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedServiceId(svc.id)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 hover:text-sky-700 dark:hover:text-sky-300 transition-colors whitespace-nowrap"
                  >
                    View Guide <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {/* Dedicated Service Detail Panel / Modal */}
      {activeService && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={activeService.titleEn}
          className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-sm flex items-center justify-center p-4"
        >
          <div className="glass-panel max-w-3xl w-full max-h-[88vh] overflow-y-auto rounded-2xl p-6 space-y-5">
            <div className="flex items-start justify-between gap-4 pb-3 border-b border-slate-200/70 dark:border-slate-800">
              <div>
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  {activeService.categoryLabelEn} · {activeService.categoryLabelBn}
                </div>
                <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                  {activeService.titleEn}
                </h3>
                <div className="text-sm font-bengali text-sky-700 dark:text-sky-300 font-medium">
                  {activeService.titleBn}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedServiceId(null)}
                aria-label="Close service guide"
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-sm text-slate-700 dark:text-slate-200 leading-relaxed">
              {language === 'bn' ? activeService.summaryBn : activeService.summaryEn}
            </p>

            {/* Action Controls */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  generateChecklistForService(activeService.id);
                  setShareToast('Checklist added to your Personal Citizen Dashboard.');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-sky-700 hover:bg-sky-800 text-white rounded-xl"
              >
                <CheckSquare className="w-4 h-4" /> Add Checklist to Dashboard
              </button>
              <button
                type="button"
                onClick={() => {
                  const title = activeService.titleEn;
                  setSelectedServiceId(null);
                  openSphereWithPrompt(`Explain step-by-step how to apply for ${title} in simple language.`);
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-slate-900 dark:bg-slate-800 text-white rounded-xl"
              >
                <Sparkles className="w-4 h-4" /> Ask Sphere AI
              </button>
              <button
                type="button"
                onClick={() => toggleSaveService(activeService.id)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <Bookmark className="w-4 h-4" />
                {savedServiceIds.includes(activeService.id) ? 'Saved' : 'Save Service'}
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadBrailleGuide(
                    activeService.titleEn,
                    `${activeService.summaryEn}\n\nDocuments:\n${activeService.documentsEn.join('\n')}\n\nSteps:\n${activeService.stepsEn.join('\n')}`,
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <Download className="w-4 h-4" /> Braille Guide
              </button>
              <button
                type="button"
                onClick={() => handleShareService(activeService)}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium bg-slate-100 dark:bg-slate-800 rounded-xl"
              >
                <Share2 className="w-4 h-4" /> Share
              </button>
            </div>

            {shareToast && (
              <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                {shareToast}
              </p>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Who Can Apply</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {(language === 'bn' ? activeService.eligibilityBn : activeService.eligibilityEn).map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-2">
                <h4 className="font-bold text-slate-900 dark:text-white">Documents Needed</h4>
                <ul className="list-disc pl-4 space-y-1 text-slate-700 dark:text-slate-300">
                  {(language === 'bn' ? activeService.documentsBn : activeService.documentsEn).map((d, i) => (
                    <li key={i}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
              <h4 className="font-bold text-slate-900 dark:text-white">Step-by-Step Guide</h4>
              <ol className="list-decimal pl-4 space-y-1.5 text-slate-700 dark:text-slate-300">
                {(language === 'bn' ? activeService.stepsBn : activeService.stepsEn).map((st, i) => (
                  <li key={i}>{st}</li>
                ))}
              </ol>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div>
                  <span className="font-semibold">Relevant Office: </span>
                  {language === 'bn' ? activeService.officeBn : activeService.officeEn}
                </div>
                <div>
                  <span className="font-semibold">Fees: </span>
                  {activeService.feeNote}
                </div>
                {activeService.officialPortalUrl && (
                  <a
                    href={activeService.officialPortalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-sky-700 dark:text-sky-300 hover:underline pt-1"
                  >
                    Official Portal: {activeService.officialPortalLabel}{' '}
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-4 rounded-xl bg-white/70 dark:bg-slate-900/70 border border-slate-200 dark:border-slate-800 space-y-1.5">
                <div>
                  <span className="font-semibold">Offline Method: </span>
                  {language === 'bn' ? activeService.offlineMethodBn : activeService.offlineMethodEn}
                </div>
                <div>
                  <span className="font-semibold">If Rejected: </span>
                  {language === 'bn'
                    ? activeService.rejectionGuidanceBn
                    : activeService.rejectionGuidanceEn}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
