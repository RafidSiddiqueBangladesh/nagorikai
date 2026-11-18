export type ThemeMode = 'light' | 'dark';
export type AppLanguage = 'en' | 'bn';

export type WorkspaceView =
  | 'home'
  | 'sphere-ai'
  | 'doc-reader'
  | 'signtalk'
  | 'accessibility'
  | 'services'
  | 'map'
  | 'voice'
  | 'events'
  | 'legal'
  | 'help-network'
  | 'support'
  | 'disability'
  | 'transparency'
  | 'emergency'
  | 'news'
  | 'rewards'
  | 'dashboard'
  | 'admin';

export type UserRole =
  | 'Citizen'
  | 'Volunteer'
  | 'Event Organizer'
  | 'Legal Professional'
  | 'News Editor'
  | 'Community Moderator'
  | 'Verified Government Representative'
  | 'Municipality Admin'
  | 'Super Admin';

export interface AccessibilitySettings {
  highContrast: boolean;
  dyslexiaFont: boolean;
  fontScale: number; // 0.9 to 1.4
  reducedMotion: boolean;
  colorBlindSafe: boolean;
  autismSimplified: boolean;
  easyRead: boolean;
  brailleReadingMode: boolean;
  eyeControlActive: boolean;
  voiceNavActive: boolean;
  ttsRate: number;
}

export type ServiceCategoryId =
  | 'nid'
  | 'civil'
  | 'local'
  | 'social'
  | 'health'
  | 'legal'
  | 'business';

export interface GovernmentService {
  id: string;
  category: ServiceCategoryId;
  categoryLabelEn: string;
  categoryLabelBn: string;
  titleEn: string;
  titleBn: string;
  summaryEn: string;
  summaryBn: string;
  eligibilityEn: string[];
  eligibilityBn: string[];
  documentsEn: string[];
  documentsBn: string[];
  stepsEn: string[];
  stepsBn: string[];
  feeNote: string;
  feeVerified: boolean;
  officeEn: string;
  officeBn: string;
  officialPortalUrl?: string;
  officialPortalLabel?: string;
  offlineMethodEn: string;
  offlineMethodBn: string;
  helpline?: string;
  rejectionGuidanceEn: string;
  rejectionGuidanceBn: string;
}

export interface BangladeshDistrict {
  id: string;
  nameEn: string;
  nameBn: string;
  divisionId: string;
  divisionEn: string;
  divisionBn: string;
  lat: number;
  lng: number;
  populationEst: string;
  municipalityType: 'City Corporation' | 'Pourashava' | 'District HQ';
  mayorOrAdmin: string;
  upazilas: string[];
  wards: string[];
  offices: Array<{
    name: string;
    type: 'Municipality' | 'Ward Office' | 'Hospital' | 'Clinic' | 'Police' | 'Fire' | 'School' | 'Legal Aid';
    address: string;
    phone?: string;
    accessible: boolean;
  }>;
  dashboard: {
    activeProjects: number;
    completedProjects: number;
    allocatedBudgetCrore: number;
    spentBudgetCrore: number;
    complaintsReceived: number;
    complaintResolutionRate: number;
    satisfactionRating: number;
    transparencyScore: number;
    projects: Array<{
      id: string;
      titleEn: string;
      titleBn: string;
      budgetCrore: number;
      spentCrore: number;
      status: 'Completed' | 'On Track' | 'Delayed';
      progress: number;
    }>;
    councillors: Array<{ name: string; ward: string; portfolio: string }>;
    notices: Array<{ id: string; titleEn: string; titleBn: string; date: string }>;
  };
}

export interface PollOption {
  id: string;
  labelEn: string;
  labelBn: string;
  votes: number;
}

export interface CivicPoll {
  id: string;
  category: string;
  questionEn: string;
  questionBn: string;
  backgroundEn: string;
  backgroundBn: string;
  supportingArgs: string[];
  opposingArgs: string[];
  options: PollOption[];
  districtBreakdown: Array<{ district: string; yesPct: number; total: number }>;
  comments: Array<{ id: string; author: string; text: string; timestamp: string }>;
  closesAt: string;
}

export interface CitizenVoicePost {
  id: string;
  authorDisplay: string;
  visibility: 'public' | 'pseudonymous' | 'confidential';
  district: string;
  category: string;
  title: string;
  body: string;
  supporters: number;
  createdAt: string;
  status: 'Open' | 'Under Review' | 'Forwarded to Municipality';
}

export interface CitizenInitiative {
  id: string;
  title: string;
  problem: string;
  solution: string;
  location: string;
  category: string;
  attachmentNote?: string;
  supporters: number;
  targetSupporters: number;
  progressStatus: 'Gathering Support' | 'Submitted to Council' | 'In Implementation';
  createdBy: string;
  createdAt: string;
}

export interface PolicyItem {
  id: string;
  titleEn: string;
  titleBn: string;
  stage: 'Public Consultation' | 'Draft Bill' | 'Enacted Policy' | 'Municipal Notice';
  ministry: string;
  summaryBn: string;
  summaryEn: string;
  updatedAt: string;
  sourceUrl?: string;
}

export interface CommunityEvent {
  id: string;
  titleEn: string;
  titleBn: string;
  category: string;
  date: string;
  time: string;
  location: string;
  district: string;
  mode: 'In-Person' | 'Online' | 'Hybrid';
  organizer: string;
  registeredCount: number;
  accessibility: {
    liveCaptions: boolean;
    signLanguageInterpreter: boolean;
    audioDescription: boolean;
    wheelchairAccessible: boolean;
  };
  hasRecording: boolean;
  qaList: Array<{ id: string; question: string; answer?: string; author: string }>;
}

export interface LawyerProfile {
  id: string;
  name: string;
  barCouncilId: string;
  specialties: string[];
  district: string;
  languages: string[];
  onlineConsultation: boolean;
  proBonoAvailable: boolean;
  accessibilityFeatures: string[];
  feeRange: string;
}

export interface CorruptionReport {
  referenceId: string;
  category: string;
  district: string;
  officeName: string;
  summary: string;
  evidenceFileName?: string;
  anonymous: boolean;
  status: 'Received (Confidential)' | 'Evidence Verification' | 'Forwarded for Audit';
  submittedAt: string;
}

export interface CitizenComplaint {
  id: string;
  category: string;
  district: string;
  ward: string;
  title: string;
  description: string;
  status: 'Submitted' | 'Assigned to Ward' | 'In Progress' | 'Resolved';
  submittedAt: string;
}

export interface CivicNewsItem {
  id: string;
  category: string;
  district: string;
  titleEn: string;
  titleBn: string;
  summaryEn: string;
  summaryBn: string;
  sourceName: string;
  sourceUrl: string;
  publishedAt: string;
  factStatus: 'Verified Source' | 'Contextualized' | 'Under Fact-Check';
  imageUrl?: string;
}

export interface TransparencyProject {
  id: string;
  titleEn: string;
  titleBn: string;
  district: string;
  implementingAgency: string;
  allocatedCrore: number;
  verifiedExpenditureCrore: number;
  completionPct: number;
  status: 'On Track' | 'Delayed' | 'Completed' | 'Audit Review';
  procurementMethod: string;
  auditNote: string;
  sourceNote: string;
  lastUpdated: string;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  scope: 'National' | 'Division' | 'District' | 'Municipality' | 'University' | 'Community Group';
  location: string;
  points: number;
  badges: string[];
  contributionsSummary: string;
}

export interface SphereAiStructuredAnswer {
  isOfficialInfo: boolean;
  confidenceNote: string;
  shortExplanation: string;
  eligibility: string[];
  requiredDocuments: string[];
  steps: string[];
  estimatedFees: string;
  relevantOffice: string;
  officialLink: string;
  offlineMethod: string;
  helpline: string;
  ifRejected: string;
}

export interface FactCheckResult {
  claimSummary: string;
  verdictNote: string;
  confidence: 'High' | 'Moderate' | 'Insufficient Evidence';
  supportingEvidence: string[];
  conflictingEvidence: string[];
  limitations: string;
  recommendedSources: string[];
}

export interface TrustedEmergencyContact {
  id: string;
  name: string;
  relation: string;
  phone: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  authProvider?: 'guest' | 'local' | 'google-supabase' | 'email-supabase';
  role: UserRole;
  district: string;
  language: AppLanguage;
  communicationPreference: 'Text & Visual' | 'Voice & Audio' | 'Sign Language (BdSL)' | 'Braille & Screen Reader' | 'Eye-Gaze Control';
  accessibilityNeeds: string[];
  interests: string[];
  civicPoints: number;
  badges: string[];
  trustedContacts?: TrustedEmergencyContact[];
  onboarded: boolean;
  isGuest: boolean;
}

export type MapProblemCategory =
  | 'Broken Road'
  | 'Drainage'
  | 'Unsafe Street'
  | 'Water Problem'
  | 'Waste'
  | 'Missing Streetlight';

export interface MapProblemReport {
  id: string;
  category: MapProblemCategory;
  district: string;
  lat: number;
  lng: number;
  addressLabel: string;
  title: string;
  description: string;
  photoName?: string;
  status: 'Reported' | 'Verified' | 'Crew Assigned' | 'Resolved';
  upvotes: number;
  reporterName: string;
  createdAt: string;
}

export type BudgetSector = 'Roads' | 'Schools' | 'Drainage' | 'Hospitals' | 'Parks';

export interface BudgetProposal {
  id: string;
  district: string;
  sector: BudgetSector;
  titleEn: string;
  titleBn: string;
  descriptionEn: string;
  descriptionBn: string;
  estimatedCrore: number;
  votes: number;
  proposedBy: string;
}

export interface HelpNetworkMember {
  id: string;
  name: string;
  nameBn: string;
  roleType: 'Volunteer' | 'BdSL Interpreter' | 'Legal Professional' | 'Community Support Org';
  district: string;
  languages: string[];
  specialtiesEn: string;
  specialtiesBn: string;
  availability: string;
  verified: boolean;
  accessibilityReady: string[];
}

export interface HelpMatchRequest {
  id: string;
  memberId?: string;
  roleType: string;
  district: string;
  preferredMode: 'Voice Call' | 'SignTalk 3D Video' | 'In-Person Escort' | 'Written / Braille';
  summary: string;
  status: 'Matched' | 'Pending Coordinator' | 'Scheduled';
  createdAt: string;
}

export interface DocumentReaderResult {
  documentType: string;
  issuingAuthority: string;
  simpleExplanationBn: string;
  simpleExplanationEn: string;
  requiredActions: string[];
  checklistItems: Array<{ labelEn: string; labelBn: string }>;
  deadlinesAndFees: string;
  cautionaryNote: string;
}

export interface ProjectMoneyTrail {
  projectId: string;
  eGpTenderId: string;
  contractor: string;
  stages: Array<{
    stageKey: 'allocation' | 'procurement' | 'construction' | 'completion' | 'audit';
    titleEn: string;
    titleBn: string;
    amountCrore: string;
    date: string;
    status: 'Completed' | 'Active' | 'Pending';
    detailEn: string;
    detailBn: string;
  }>;
}

export interface ProjectVerificationNote {
  id: string;
  projectId: string;
  citizenName: string;
  district: string;
  verdict: 'Confirmed Progress' | 'Needs Attention';
  note: string;
  createdAt: string;
}

export interface NearbyEmergencyPlace {
  id: string;
  name: string;
  type: 'hospital' | 'police' | 'fire_station';
  address: string;
  phone?: string;
  lat: number;
  lng: number;
  mapsUri?: string;
  source: 'google_places' | 'civic_directory';
}

export interface AdminAuditLog {
  id: string;
  actor: string;
  role: UserRole;
  action: string;
  target: string;
  timestamp: string;
}
