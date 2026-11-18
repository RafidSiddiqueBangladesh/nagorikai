import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type {
  AccessibilitySettings,
  AdminAuditLog,
  AppLanguage,
  BudgetProposal,
  BudgetSector,
  CitizenComplaint,
  CitizenInitiative,
  CitizenVoicePost,
  CivicNewsItem,
  CivicPoll,
  CommunityEvent,
  HelpMatchRequest,
  LeaderboardEntry,
  MapProblemCategory,
  MapProblemReport,
  ProjectVerificationNote,
  SphereAiStructuredAnswer,
  ThemeMode,
  TrustedEmergencyContact,
  UserProfile,
  UserRole,
  WorkspaceView,
} from '../types/civicsphere';
import {
  CIVIC_NEWS_ITEMS,
  GOVERNMENT_SERVICES,
  INITIAL_BUDGET_PROPOSALS,
  INITIAL_EVENTS,
  INITIAL_INITIATIVES,
  INITIAL_LEADERBOARD,
  INITIAL_MAP_REPORTS,
  INITIAL_POLLS,
  INITIAL_VOICE_POSTS,
} from '../data/civicDataset';
import {
  getSupabaseClient,
  getSupabaseSession,
  initSupabaseClient,
  isSupabaseConfigured,
  signInWithGoogleSupabase,
  signOutSupabase,
  syncCitizenProfileToSupabase,
  syncMapReportToSupabase,
} from '../lib/supabaseClient';

export interface AiConversationEntry {
  id: string;
  question: string;
  answer: SphereAiStructuredAnswer;
  timestamp: string;
}

export interface ServiceChecklistState {
  serviceId: string;
  title: string;
  items: Array<{ id: string; label: string; done: boolean }>;
}

interface CivicContextValue {
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (t: ThemeMode) => void;
  language: AppLanguage;
  setLanguage: (l: AppLanguage) => void;
  activeView: WorkspaceView;
  setActiveView: (v: WorkspaceView) => void;
  accessibility: AccessibilitySettings;
  updateAccessibility: (patch: Partial<AccessibilitySettings>) => void;
  speakText: (text: string) => void;
  stopSpeaking: () => void;

  // Persistent platform data
  polls: CivicPoll[];
  votedPollIds: string[];
  castVote: (pollId: string, optionId: string) => Promise<{ ok: boolean; error?: string }>;
  addPollComment: (pollId: string, text: string) => Promise<void>;

  voicePosts: CitizenVoicePost[];
  submitVoicePost: (payload: {
    visibility: 'public' | 'pseudonymous' | 'confidential';
    district: string;
    category: string;
    title: string;
    body: string;
  }) => Promise<void>;
  supportVoicePost: (id: string) => Promise<void>;

  initiatives: CitizenInitiative[];
  submitInitiative: (payload: {
    title: string;
    problem: string;
    solution: string;
    location: string;
    category: string;
    attachmentNote?: string;
  }) => Promise<void>;
  supportInitiative: (id: string) => Promise<void>;

  events: CommunityEvent[];
  registeredEventIds: string[];
  createEvent: (payload: {
    titleEn: string;
    titleBn: string;
    category: string;
    date: string;
    time: string;
    location: string;
    district: string;
    mode: 'In-Person' | 'Online' | 'Hybrid';
    accessibility: {
      liveCaptions: boolean;
      signLanguageInterpreter: boolean;
      audioDescription: boolean;
      wheelchairAccessible: boolean;
    };
  }) => Promise<void>;
  registerForEvent: (eventId: string) => Promise<void>;
  askEventQuestion: (eventId: string, question: string) => Promise<void>;

  complaints: CitizenComplaint[];
  submitComplaint: (payload: {
    category: string;
    district: string;
    ward: string;
    title: string;
    description: string;
  }) => Promise<CitizenComplaint | null>;

  leaderboard: LeaderboardEntry[];
  auditLogs: AdminAuditLog[];
  notices: Array<{
    id: string;
    district: string;
    titleEn: string;
    titleBn: string;
    publishedBy: string;
    publishedAt: string;
  }>;
  newsItems: CivicNewsItem[];

  // Auth & Integrations
  googleMapsApiKey: string;
  supabaseReady: boolean;
  authModalOpen: boolean;
  setAuthModalOpen: (open: boolean) => void;
  signInGoogle: () => Promise<{ ok: boolean; error?: string }>;
  signInLocalProfile: (payload: { name: string; email?: string; district: string; authProvider?: UserProfile['authProvider'] }) => void;
  signOutCitizen: () => Promise<void>;
  addTrustedContact: (contact: Omit<TrustedEmergencyContact, 'id'>) => void;
  removeTrustedContact: (id: string) => void;

  // Map Problem Reports, Participatory Budgets, Help Network, Follow the Money
  mapReports: MapProblemReport[];
  submitMapReport: (payload: {
    category: MapProblemCategory;
    district: string;
    lat: number;
    lng: number;
    addressLabel: string;
    title: string;
    description: string;
    photoName?: string;
  }) => Promise<MapProblemReport | null>;
  upvoteMapReport: (id: string) => Promise<void>;
  updateMapReportStatus: (id: string, status: MapProblemReport['status']) => Promise<void>;

  budgetProposals: BudgetProposal[];
  voteBudgetProposal: (id: string) => Promise<void>;
  submitBudgetProposal: (payload: {
    district: string;
    sector: BudgetSector;
    titleEn: string;
    titleBn?: string;
    descriptionEn: string;
    descriptionBn?: string;
    estimatedCrore: number;
  }) => Promise<void>;

  helpRequests: HelpMatchRequest[];
  submitHelpRequest: (payload: {
    memberId?: string;
    roleType: string;
    district: string;
    preferredMode: HelpMatchRequest['preferredMode'];
    summary: string;
  }) => Promise<HelpMatchRequest | null>;

  projectVerifications: ProjectVerificationNote[];
  submitProjectVerification: (
    projectId: string,
    payload: { verdict: 'Confirmed Progress' | 'Needs Attention'; note: string },
  ) => Promise<void>;
  applyChecklistItems: (checklistId: string, title: string, items: string[]) => void;

  // Personal Citizen State
  user: UserProfile;
  updateUserProfile: (patch: Partial<UserProfile>) => void;
  switchUserRole: (role: UserRole) => void;
  savedServiceIds: string[];
  toggleSaveService: (serviceId: string) => void;
  checklists: ServiceChecklistState[];
  generateChecklistForService: (serviceId: string) => void;
  toggleChecklistItem: (serviceId: string, itemId: string) => void;
  savedDocuments: Array<{ id: string; title: string; content: string; createdAt: string }>;
  saveDocumentNote: (title: string, content: string) => void;
  aiHistory: AiConversationEntry[];
  addAiHistory: (question: string, answer: SphereAiStructuredAnswer) => void;
  notifications: Array<{ id: string; title: string; time: string; read: boolean }>;
  markAllNotificationsRead: () => void;

  // Modals / Drawers
  sphereDrawerOpen: boolean;
  setSphereDrawerOpen: (open: boolean) => void;
  sphereInitialPrompt: string;
  openSphereWithPrompt: (prompt: string) => void;
  a11yDrawerOpen: boolean;
  setA11yDrawerOpen: (open: boolean) => void;
  onboardingOpen: boolean;
  setOnboardingOpen: (open: boolean) => void;
  selectedServiceId: string | null;
  setSelectedServiceId: (id: string | null) => void;
  selectedDistrictId: string;
  setSelectedDistrictId: (id: string) => void;

  // Admin actions
  runAdminAction: (payload: {
    actionType: 'update_complaint' | 'publish_notice' | 'moderate_voice' | 'verify_initiative';
    targetId?: string;
    payload?: { status?: string; district?: string; titleEn?: string; titleBn?: string };
  }) => Promise<void>;
}

const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  highContrast: false,
  dyslexiaFont: false,
  fontScale: 1,
  reducedMotion: false,
  colorBlindSafe: false,
  autismSimplified: false,
  easyRead: false,
  brailleReadingMode: false,
  eyeControlActive: false,
  voiceNavActive: false,
  ttsRate: 0.95,
};

const DEFAULT_TRUSTED_CONTACTS: TrustedEmergencyContact[] = [
  { id: 'tc-1', name: 'Amina Rahman (Family)', relation: 'Sister', phone: '+880 1711-000109' },
];

const DEFAULT_USER: UserProfile = {
  id: 'citizen-guest-1',
  name: 'Nadia Rahman',
  authProvider: 'guest',
  role: 'Citizen',
  district: 'Dhaka',
  language: 'en',
  communicationPreference: 'Text & Visual',
  accessibilityNeeds: [],
  interests: ['Local Government', 'Accessibility', 'Legal Aid'],
  civicPoints: 340,
  badges: ['Citizen Educator'],
  trustedContacts: DEFAULT_TRUSTED_CONTACTS,
  onboarded: false,
  isGuest: true,
};

const CivicContext = createContext<CivicContextValue | null>(null);

export function CivicProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem('civicsphere_theme');
      return saved === 'dark' ? 'dark' : 'light';
    } catch {
      return 'light';
    }
  });

  const [language, setLanguage] = useState<AppLanguage>('en');
  const [activeView, setActiveView] = useState<WorkspaceView>('home');
  const [accessibility, setAccessibility] = useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);

  const [polls, setPolls] = useState<CivicPoll[]>(INITIAL_POLLS);
  const [votedPollIds, setVotedPollIds] = useState<string[]>([]);
  const [voicePosts, setVoicePosts] = useState<CitizenVoicePost[]>(INITIAL_VOICE_POSTS);
  const [initiatives, setInitiatives] = useState<CitizenInitiative[]>(INITIAL_INITIATIVES);
  const [events, setEvents] = useState<CommunityEvent[]>(INITIAL_EVENTS);
  const [registeredEventIds, setRegisteredEventIds] = useState<string[]>([]);
  const [complaints, setComplaints] = useState<CitizenComplaint[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>(INITIAL_LEADERBOARD);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);
  const [notices, setNotices] = useState<
    Array<{ id: string; district: string; titleEn: string; titleBn: string; publishedBy: string; publishedAt: string }>
  >([]);

  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const savedProfile = localStorage.getItem('civicsphere_user_profile');
      if (savedProfile) {
        return { ...DEFAULT_USER, ...JSON.parse(savedProfile) } as UserProfile;
      }
    } catch {
      // ignore
    }
    return DEFAULT_USER;
  });

  const [googleMapsApiKey, setGoogleMapsApiKey] = useState<string>(() => {
    const envKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
    return envKey && !envKey.includes('MY_') ? envKey : '';
  });
  const [supabaseReady, setSupabaseReady] = useState<boolean>(() => isSupabaseConfigured());
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const [mapReports, setMapReports] = useState<MapProblemReport[]>(INITIAL_MAP_REPORTS);
  const [budgetProposals, setBudgetProposals] = useState<BudgetProposal[]>(INITIAL_BUDGET_PROPOSALS);
  const [helpRequests, setHelpRequests] = useState<HelpMatchRequest[]>([]);
  const [projectVerifications, setProjectVerifications] = useState<ProjectVerificationNote[]>([]);

  const [savedServiceIds, setSavedServiceIds] = useState<string[]>(['nid-new', 'birth-cert', 'elderly-allowance']);
  const [checklists, setChecklists] = useState<ServiceChecklistState[]>([]);
  const [savedDocuments, setSavedDocuments] = useState<
    Array<{ id: string; title: string; content: string; createdAt: string }>
  >([
    {
      id: 'doc-1',
      title: 'General Diary (GD) Preparation Checklist',
      content: '1. National ID Copy\n2. Exact date, time & location of lost item\n3. Serial/IMEI or document number\n4. Online submission via gd.police.gov.bd',
      createdAt: '2026-11-16',
    },
  ]);
  const [aiHistory, setAiHistory] = useState<AiConversationEntry[]>([]);
  const [notifications, setNotifications] = useState([
    {
      id: 'n-1',
      title: 'Dhaka North Open Budget Hearing scheduled for Nov 24 with BdSL & Live Captions.',
      time: 'Today',
      read: false,
    },
    {
      id: 'n-2',
      title: 'Your saved service "Elderly Allowance" updated with direct G2P verification guidance.',
      time: 'Yesterday',
      read: false,
    },
  ]);

  const [sphereDrawerOpen, setSphereDrawerOpen] = useState(false);
  const [sphereInitialPrompt, setSphereInitialPrompt] = useState('');
  const [a11yDrawerOpen, setA11yDrawerOpen] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState<string>('dhaka');

  const [voterKey] = useState(() => {
    try {
      const existing = localStorage.getItem('civicsphere_voter_key');
      if (existing) return existing;
      const created = `vk_${Math.random().toString(36).slice(2, 10)}_${Date.now()}`;
      localStorage.setItem('civicsphere_voter_key', created);
      return created;
    } catch {
      return `vk_${Date.now()}`;
    }
  });

  // Sync Tailwind dark class & accessibility classes on <html>
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('civicsphere_theme', theme);
    } catch {
      // ignore
    }
  }, [theme]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-high-contrast', accessibility.highContrast);
    root.classList.toggle('a11y-dyslexia', accessibility.dyslexiaFont);
    root.classList.toggle('a11y-reduced-motion', accessibility.reducedMotion);
    root.classList.toggle('a11y-colorblind', accessibility.colorBlindSafe);
    root.classList.toggle('a11y-braille-reading', accessibility.brailleReadingMode);
    root.style.fontSize = `${Math.round(accessibility.fontScale * 100)}%`;
  }, [accessibility]);

  // Hydrate persistent state + public integration config from server & Supabase
  useEffect(() => {
    fetch('/api/civic/bootstrap')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (!data) return;
        if (data.polls) setPolls(data.polls);
        if (data.voicePosts) setVoicePosts(data.voicePosts);
        if (data.initiatives) setInitiatives(data.initiatives);
        if (data.events) setEvents(data.events);
        if (data.complaints) setComplaints(data.complaints);
        if (data.leaderboard) setLeaderboard(data.leaderboard);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
        if (data.notices) setNotices(data.notices);
        if (data.mapReports) setMapReports(data.mapReports);
        if (data.budgetProposals) setBudgetProposals(data.budgetProposals);
        if (data.helpRequests) setHelpRequests(data.helpRequests);
        if (data.projectVerifications) setProjectVerifications(data.projectVerifications);
      })
      .catch(() => {
        // Fallback already initialized
      });

    fetch('/api/civic/public-config')
      .then((r) => (r.ok ? r.json() : null))
      .then(async (cfg: { googleMapsApiKey?: string; supabaseUrl?: string; supabaseAnonKey?: string } | null) => {
        if (!cfg) return;
        if (cfg.googleMapsApiKey) {
          setGoogleMapsApiKey(cfg.googleMapsApiKey);
        }
        const client = initSupabaseClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
        if (client) {
          setSupabaseReady(true);
          const session = await getSupabaseSession();
          if (session?.user) {
            const meta = session.user.user_metadata || {};
            const provider = session.user.app_metadata?.provider === 'google' ? 'google-supabase' : 'email-supabase';
            setUser((prev) => ({
              ...prev,
              id: session.user.id,
              name: meta.full_name || meta.name || session.user.email?.split('@')[0] || prev.name,
              email: session.user.email,
              avatarUrl: meta.avatar_url || meta.picture,
              authProvider: provider,
              isGuest: false,
            }));
          }
        }
      })
      .catch(() => {
        // ignore
      });
  }, []);

  useEffect(() => {
    const client = getSupabaseClient();
    if (!client) return;
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        const meta = session.user.user_metadata || {};
        const provider = session.user.app_metadata?.provider === 'google' ? 'google-supabase' : 'email-supabase';
        setUser((prev) => {
          const updated: UserProfile = {
            ...prev,
            id: session.user.id,
            name: meta.full_name || meta.name || session.user.email?.split('@')[0] || prev.name,
            email: session.user.email,
            avatarUrl: meta.avatar_url || meta.picture,
            authProvider: provider,
            isGuest: false,
          };
          void syncCitizenProfileToSupabase(updated);
          return updated;
        });
      }
    });
    return () => {
      subscription.unsubscribe();
    };
  }, [supabaseReady]);

  useEffect(() => {
    try {
      localStorage.setItem('civicsphere_user_profile', JSON.stringify(user));
    } catch {
      // ignore
    }
  }, [user]);

  const toggleTheme = useCallback(() => {
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const setTheme = useCallback((t: ThemeMode) => {
    setThemeState(t);
  }, []);

  const updateAccessibility = useCallback((patch: Partial<AccessibilitySettings>) => {
    setAccessibility((prev) => ({ ...prev, ...patch }));
  }, []);

  const speakText = useCallback(
    (text: string) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      const hasBangla = /[\u0980-\u09FF]/.test(text);
      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find((v) =>
        hasBangla ? v.lang.toLowerCase().startsWith('bn') : v.lang.toLowerCase().startsWith('en'),
      );
      if (preferred) utter.voice = preferred;
      utter.lang = hasBangla ? 'bn-BD' : 'en-US';
      utter.rate = accessibility.ttsRate;
      window.speechSynthesis.speak(utter);
    },
    [accessibility.ttsRate],
  );

  const stopSpeaking = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }, []);

  const castVote = useCallback(
    async (pollId: string, optionId: string): Promise<{ ok: boolean; error?: string }> => {
      if (votedPollIds.includes(pollId)) {
        return { ok: false, error: 'You have already voted in this consultation.' };
      }
      try {
        const res = await fetch('/api/civic/vote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pollId, optionId, voterKey }),
        });
        const data = await res.json();
        if (!res.ok) {
          return { ok: false, error: data.error || 'Unable to submit vote.' };
        }
        setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
        setVotedPollIds((prev) => [...prev, pollId]);
        setUser((u) => ({ ...u, civicPoints: u.civicPoints + 15 }));
        return { ok: true };
      } catch {
        return { ok: false, error: 'Network error while recording vote.' };
      }
    },
    [votedPollIds, voterKey],
  );

  const addPollComment = useCallback(
    async (pollId: string, text: string) => {
      const res = await fetch(`/api/civic/polls/${pollId}/comment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ author: `${user.name} · ${user.district}`, text }),
      });
      if (res.ok) {
        const data = await res.json();
        setPolls((prev) => prev.map((p) => (p.id === pollId ? data.poll : p)));
      }
    },
    [user.district, user.name],
  );

  const submitVoicePost = useCallback(
    async (payload: {
      visibility: 'public' | 'pseudonymous' | 'confidential';
      district: string;
      category: string;
      title: string;
      body: string;
    }) => {
      const res = await fetch('/api/civic/voices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, authorDisplay: user.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setVoicePosts((prev) => [data.post, ...prev]);
        setUser((u) => ({ ...u, civicPoints: u.civicPoints + 20 }));
      }
    },
    [user.name],
  );

  const supportVoicePost = useCallback(async (id: string) => {
    const res = await fetch(`/api/civic/voices/${id}/support`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setVoicePosts((prev) => prev.map((p) => (p.id === id ? data.post : p)));
    }
  }, []);

  const submitInitiative = useCallback(
    async (payload: {
      title: string;
      problem: string;
      solution: string;
      location: string;
      category: string;
      attachmentNote?: string;
    }) => {
      const res = await fetch('/api/civic/initiatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, createdBy: user.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setInitiatives((prev) => [data.initiative, ...prev]);
        setUser((u) => ({ ...u, civicPoints: u.civicPoints + 40 }));
      }
    },
    [user.name],
  );

  const supportInitiative = useCallback(async (id: string) => {
    const res = await fetch(`/api/civic/initiatives/${id}/support`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setInitiatives((prev) => prev.map((i) => (i.id === id ? data.initiative : i)));
    }
  }, []);

  const createEvent = useCallback(
    async (payload: {
      titleEn: string;
      titleBn: string;
      category: string;
      date: string;
      time: string;
      location: string;
      district: string;
      mode: 'In-Person' | 'Online' | 'Hybrid';
      accessibility: {
        liveCaptions: boolean;
        signLanguageInterpreter: boolean;
        audioDescription: boolean;
        wheelchairAccessible: boolean;
      };
    }) => {
      const res = await fetch('/api/civic/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, organizer: user.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents((prev) => [data.event, ...prev]);
      }
    },
    [user.name],
  );

  const registerForEvent = useCallback(
    async (eventId: string) => {
      const res = await fetch(`/api/civic/events/${eventId}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ attendeeKey: voterKey }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
        setRegisteredEventIds((prev) => (prev.includes(eventId) ? prev : [...prev, eventId]));
        setUser((u) => ({ ...u, civicPoints: u.civicPoints + 25 }));
      }
    },
    [voterKey],
  );

  const askEventQuestion = useCallback(
    async (eventId: string, question: string) => {
      const res = await fetch(`/api/civic/events/${eventId}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question, author: user.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setEvents((prev) => prev.map((e) => (e.id === eventId ? data.event : e)));
      }
    },
    [user.name],
  );

  const submitComplaint = useCallback(
    async (payload: {
      category: string;
      district: string;
      ward: string;
      title: string;
      description: string;
    }): Promise<CitizenComplaint | null> => {
      const res = await fetch('/api/civic/complaints', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const data = await res.json();
        setComplaints((prev) => [data.complaint, ...prev]);
        setUser((u) => ({ ...u, civicPoints: u.civicPoints + 30 }));
        return data.complaint as CitizenComplaint;
      }
      return null;
    },
    [],
  );

  const updateUserProfile = useCallback((patch: Partial<UserProfile>) => {
    setUser((prev) => {
      const next = { ...prev, ...patch };
      void syncCitizenProfileToSupabase(next);
      return next;
    });
  }, []);

  const signInGoogle = useCallback(async () => {
    return signInWithGoogleSupabase();
  }, []);

  const signInLocalProfile = useCallback(
    (payload: { name: string; email?: string; district: string; authProvider?: UserProfile['authProvider'] }) => {
      setUser((prev) => {
        const next: UserProfile = {
          ...prev,
          id: payload.email ? `citizen_${payload.email}` : `citizen_${Date.now()}`,
          name: payload.name.trim() || prev.name,
          email: payload.email?.trim() || prev.email,
          district: payload.district || prev.district,
          authProvider: payload.authProvider || 'local',
          isGuest: false,
          onboarded: true,
        };
        void syncCitizenProfileToSupabase(next);
        return next;
      });
      setAuthModalOpen(false);
    },
    [],
  );

  const signOutCitizen = useCallback(async () => {
    await signOutSupabase();
    setUser({ ...DEFAULT_USER, trustedContacts: user.trustedContacts || DEFAULT_TRUSTED_CONTACTS });
  }, [user.trustedContacts]);

  const addTrustedContact = useCallback((contact: Omit<TrustedEmergencyContact, 'id'>) => {
    setUser((prev) => ({
      ...prev,
      trustedContacts: [
        ...(prev.trustedContacts || []),
        { ...contact, id: `tc_${Date.now()}` },
      ],
    }));
  }, []);

  const removeTrustedContact = useCallback((id: string) => {
    setUser((prev) => ({
      ...prev,
      trustedContacts: (prev.trustedContacts || []).filter((c) => c.id !== id),
    }));
  }, []);

  const submitMapReport = useCallback(
    async (payload: {
      category: MapProblemCategory;
      district: string;
      lat: number;
      lng: number;
      addressLabel: string;
      title: string;
      description: string;
      photoName?: string;
    }): Promise<MapProblemReport | null> => {
      const res = await fetch('/api/civic/map-reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, reporterName: user.name }),
      });
      if (!res.ok) return null;
      const data = await res.json();
      const created = data.report as MapProblemReport;
      setMapReports((prev) => [created, ...prev]);
      setUser((u) => ({ ...u, civicPoints: u.civicPoints + 35 }));
      void syncMapReportToSupabase(created);
      return created;
    },
    [user.name],
  );

  const upvoteMapReport = useCallback(async (id: string) => {
    const res = await fetch(`/api/civic/map-reports/${id}/upvote`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setMapReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
    }
  }, []);

  const updateMapReportStatus = useCallback(async (id: string, status: MapProblemReport['status']) => {
    const res = await fetch(`/api/civic/map-reports/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (res.ok) {
      const data = await res.json();
      setMapReports((prev) => prev.map((r) => (r.id === id ? data.report : r)));
    }
  }, []);

  const voteBudgetProposal = useCallback(async (id: string) => {
    const res = await fetch(`/api/civic/budget-proposals/${id}/vote`, { method: 'POST' });
    if (res.ok) {
      const data = await res.json();
      setBudgetProposals((prev) => prev.map((p) => (p.id === id ? data.proposal : p)));
      setUser((u) => ({ ...u, civicPoints: u.civicPoints + 15 }));
    }
  }, []);

  const submitBudgetProposal = useCallback(
    async (payload: {
      district: string;
      sector: BudgetSector;
      titleEn: string;
      titleBn?: string;
      descriptionEn: string;
      descriptionBn?: string;
      estimatedCrore: number;
    }) => {
      const res = await fetch('/api/civic/budget-proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, proposedBy: user.name }),
      });
      if (res.ok) {
        const data = await res.json();
        setBudgetProposals((prev) => [data.proposal, ...prev]);
        setUser((u) => ({ ...u, civicPoints: u.civicPoints + 30 }));
      }
    },
    [user.name],
  );

  const submitHelpRequest = useCallback(
    async (payload: {
      memberId?: string;
      roleType: string;
      district: string;
      preferredMode: HelpMatchRequest['preferredMode'];
      summary: string;
    }): Promise<HelpMatchRequest | null> => {
      const res = await fetch('/api/civic/help-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) return null;
      const data = await res.json();
      setHelpRequests((prev) => [data.helpRequest, ...prev]);
      return data.helpRequest as HelpMatchRequest;
    },
    [],
  );

  const submitProjectVerification = useCallback(
    async (projectId: string, payload: { verdict: 'Confirmed Progress' | 'Needs Attention'; note: string }) => {
      const res = await fetch(`/api/civic/projects/${projectId}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          citizenName: user.name,
          district: user.district,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setProjectVerifications((prev) => [data.verification, ...prev]);
        setUser((u) => ({ ...u, civicPoints: u.civicPoints + 25 }));
      }
    },
    [user.district, user.name],
  );

  const switchUserRole = useCallback((role: UserRole) => {
    setUser((prev) => ({ ...prev, role, isGuest: false }));
  }, []);

  const toggleSaveService = useCallback((serviceId: string) => {
    setSavedServiceIds((prev) =>
      prev.includes(serviceId) ? prev.filter((id) => id !== serviceId) : [...prev, serviceId],
    );
  }, []);

  const generateChecklistForService = useCallback((serviceId: string) => {
    const svc = GOVERNMENT_SERVICES.find((s) => s.id === serviceId);
    if (!svc) return;
    setChecklists((prev) => {
      if (prev.some((c) => c.serviceId === serviceId)) return prev;
      return [
        {
          serviceId,
          title: svc.titleEn,
          items: svc.documentsEn.map((doc, idx) => ({
            id: `${serviceId}_doc_${idx}`,
            label: doc,
            done: false,
          })),
        },
        ...prev,
      ];
    });
  }, []);

  const applyChecklistItems = useCallback((checklistId: string, title: string, items: string[]) => {
    setChecklists((prev) => {
      const filtered = prev.filter((c) => c.serviceId !== checklistId);
      return [
        {
          serviceId: checklistId,
          title,
          items: items.map((label, idx) => ({
            id: `${checklistId}_item_${idx}`,
            label,
            done: false,
          })),
        },
        ...filtered,
      ];
    });
  }, []);

  const toggleChecklistItem = useCallback((serviceId: string, itemId: string) => {
    setChecklists((prev) =>
      prev.map((c) =>
        c.serviceId !== serviceId
          ? c
          : {
              ...c,
              items: c.items.map((it) => (it.id === itemId ? { ...it, done: !it.done } : it)),
            },
      ),
    );
  }, []);

  const saveDocumentNote = useCallback((title: string, content: string) => {
    setSavedDocuments((prev) => [
      {
        id: `doc_${Date.now()}`,
        title,
        content,
        createdAt: new Date().toISOString().slice(0, 10),
      },
      ...prev,
    ]);
  }, []);

  const addAiHistory = useCallback((question: string, answer: SphereAiStructuredAnswer) => {
    setAiHistory((prev) => [
      {
        id: `ai_${Date.now()}`,
        question,
        answer,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
      ...prev,
    ]);
  }, []);

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const openSphereWithPrompt = useCallback((prompt: string) => {
    setSphereInitialPrompt(prompt);
    setSphereDrawerOpen(true);
  }, []);

  const runAdminAction = useCallback(
    async (payload: {
      actionType: 'update_complaint' | 'publish_notice' | 'moderate_voice' | 'verify_initiative';
      targetId?: string;
      payload?: { status?: string; district?: string; titleEn?: string; titleBn?: string };
    }) => {
      const res = await fetch('/api/civic/admin/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          actor: user.name,
          role: user.role,
          ...payload,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.complaints) setComplaints(data.complaints);
        if (data.notices) setNotices(data.notices);
        if (data.voicePosts) setVoicePosts(data.voicePosts);
        if (data.initiatives) setInitiatives(data.initiatives);
        if (data.auditLogs) setAuditLogs(data.auditLogs);
      }
    },
    [user.name, user.role],
  );

  return (
    <CivicContext.Provider
      value={{
        theme,
        toggleTheme,
        setTheme,
        language,
        setLanguage,
        activeView,
        setActiveView,
        accessibility,
        updateAccessibility,
        speakText,
        stopSpeaking,
        polls,
        votedPollIds,
        castVote,
        addPollComment,
        voicePosts,
        submitVoicePost,
        supportVoicePost,
        initiatives,
        submitInitiative,
        supportInitiative,
        events,
        registeredEventIds,
        createEvent,
        registerForEvent,
        askEventQuestion,
        complaints,
        submitComplaint,
        leaderboard,
        auditLogs,
        notices,
        newsItems: CIVIC_NEWS_ITEMS,
        googleMapsApiKey,
        supabaseReady,
        authModalOpen,
        setAuthModalOpen,
        signInGoogle,
        signInLocalProfile,
        signOutCitizen,
        addTrustedContact,
        removeTrustedContact,
        mapReports,
        submitMapReport,
        upvoteMapReport,
        updateMapReportStatus,
        budgetProposals,
        voteBudgetProposal,
        submitBudgetProposal,
        helpRequests,
        submitHelpRequest,
        projectVerifications,
        submitProjectVerification,
        applyChecklistItems,
        user,
        updateUserProfile,
        switchUserRole,
        savedServiceIds,
        toggleSaveService,
        checklists,
        generateChecklistForService,
        toggleChecklistItem,
        savedDocuments,
        saveDocumentNote,
        aiHistory,
        addAiHistory,
        notifications,
        markAllNotificationsRead,
        sphereDrawerOpen,
        setSphereDrawerOpen,
        sphereInitialPrompt,
        openSphereWithPrompt,
        a11yDrawerOpen,
        setA11yDrawerOpen,
        onboardingOpen,
        setOnboardingOpen,
        selectedServiceId,
        setSelectedServiceId,
        selectedDistrictId,
        setSelectedDistrictId,
        runAdminAction,
      }}
    >
      {children}
    </CivicContext.Provider>
  );
}

export function useCivic(): CivicContextValue {
  const ctx = useContext(CivicContext);
  if (!ctx) throw new Error('useCivic must be used inside CivicProvider');
  return ctx;
}
