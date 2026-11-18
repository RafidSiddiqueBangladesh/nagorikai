import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_EVENTS,
  INITIAL_INITIATIVES,
  INITIAL_LEADERBOARD,
  INITIAL_POLLS,
  INITIAL_VOICE_POSTS,
  GOVERNMENT_SERVICES,
  INITIAL_MAP_REPORTS,
  INITIAL_BUDGET_PROPOSALS,
  HUMAN_HELP_NETWORK,
} from './src/data/civicDataset';
import { BANGLADESH_DISTRICTS } from './src/data/bangladeshGeoData';
import type {
  BudgetProposal,
  BudgetSector,
  HelpMatchRequest,
  MapProblemCategory,
  MapProblemReport,
  NearbyEmergencyPlace,
  ProjectVerificationNote,
} from './src/types/civicsphere';

dotenv.config();

const PORT = 3000;
const CACHE_DIR = path.resolve(process.cwd(), '.cache', 'mediapipe');
const DATA_DIR = path.resolve(process.cwd(), '.data');
const DB_FILE = path.join(DATA_DIR, 'civicsphere-db.json');

const MEDIAPIPE_MODEL_URLS: Record<string, string> = {
  'hand_landmarker.task':
    'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
  'face_landmarker.task':
    'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
};

function getGeminiClient(apiVersion?: string): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    ...(apiVersion ? { apiVersion } : {}),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

interface CivicDatabase {
  polls: typeof INITIAL_POLLS;
  votedKeys: Record<string, string[]>; // pollId -> voterKeys
  voicePosts: typeof INITIAL_VOICE_POSTS;
  initiatives: typeof INITIAL_INITIATIVES;
  events: typeof INITIAL_EVENTS;
  eventRegistrations: Record<string, string[]>;
  complaints: Array<{
    id: string;
    category: string;
    district: string;
    ward: string;
    title: string;
    description: string;
    status: 'Submitted' | 'Assigned to Ward' | 'In Progress' | 'Resolved';
    submittedAt: string;
  }>;
  corruptionReports: Array<{
    referenceId: string;
    category: string;
    district: string;
    officeName: string;
    summary: string;
    evidenceFileName?: string;
    anonymous: boolean;
    status: 'Received (Confidential)' | 'Evidence Verification' | 'Forwarded for Audit';
    submittedAt: string;
  }>;
  leaderboard: typeof INITIAL_LEADERBOARD;
  auditLogs: Array<{
    id: string;
    actor: string;
    role: string;
    action: string;
    target: string;
    timestamp: string;
  }>;
  notices: Array<{
    id: string;
    district: string;
    titleEn: string;
    titleBn: string;
    publishedBy: string;
    publishedAt: string;
  }>;
  mapReports: MapProblemReport[];
  budgetProposals: BudgetProposal[];
  helpRequests: HelpMatchRequest[];
  projectVerifications: ProjectVerificationNote[];
}

function loadDatabase(): CivicDatabase {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw) as Partial<CivicDatabase>;
      return {
        polls: parsed.polls || INITIAL_POLLS,
        votedKeys: parsed.votedKeys || {},
        voicePosts: parsed.voicePosts || INITIAL_VOICE_POSTS,
        initiatives: parsed.initiatives || INITIAL_INITIATIVES,
        events: parsed.events || INITIAL_EVENTS,
        eventRegistrations: parsed.eventRegistrations || {},
        complaints: parsed.complaints || [],
        corruptionReports: parsed.corruptionReports || [],
        leaderboard: parsed.leaderboard || INITIAL_LEADERBOARD,
        auditLogs: parsed.auditLogs || [],
        notices: parsed.notices || [],
        mapReports: parsed.mapReports || INITIAL_MAP_REPORTS,
        budgetProposals: parsed.budgetProposals || INITIAL_BUDGET_PROPOSALS,
        helpRequests: parsed.helpRequests || [],
        projectVerifications: parsed.projectVerifications || [
          {
            id: 'pv-1',
            projectId: 'tp-1',
            citizenName: 'Tanvir Hossain',
            district: 'Rajshahi',
            verdict: 'Confirmed Progress',
            note: 'Visited Ward 04 footpath section — tactile paving alignment is mostly complete; 2 corner ramps marked for gentle slope fix.',
            createdAt: '2026-11-15',
          },
        ],
      };
    } catch {
      // Rebuild if corrupted
    }
  }
  const initial: CivicDatabase = {
    polls: INITIAL_POLLS,
    votedKeys: {},
    voicePosts: INITIAL_VOICE_POSTS,
    initiatives: INITIAL_INITIATIVES,
    events: INITIAL_EVENTS,
    eventRegistrations: {},
    complaints: [
      {
        id: 'CMP-2026-1042',
        category: 'Streetlight & Safety',
        district: 'Dhaka',
        ward: 'Ward 19',
        title: 'Non-functioning solar streetlights near Gulshan Lake walkway',
        description: 'Four solar streetlamps along the pedestrian path have been dark for 5 days.',
        status: 'In Progress',
        submittedAt: '2026-11-15',
      },
      {
        id: 'CMP-2026-1039',
        category: 'Drainage & Water',
        district: 'Rajshahi',
        ward: 'Ward 04',
        title: 'Blocked roadside culvert near Padma Garden lane',
        description: 'Needs silt clearing before seasonal rainfall.',
        status: 'Resolved',
        submittedAt: '2026-11-12',
      },
    ],
    corruptionReports: [],
    leaderboard: INITIAL_LEADERBOARD,
    auditLogs: [
      {
        id: 'aud-1',
        actor: 'System Initializer',
        role: 'Super Admin',
        action: 'Published Municipal Transparency Rubric v2.1',
        target: 'All 64 Districts',
        timestamp: '2026-11-16 09:00',
      },
      {
        id: 'aud-2',
        actor: 'Dhaka Ward Compliance Officer',
        role: 'Municipality Admin',
        action: 'Assigned CMP-2026-1042 to Ward 19 Electrical Team',
        target: 'Dhaka · Ward 19',
        timestamp: '2026-11-16 14:20',
      },
    ],
    notices: [
      {
        id: 'not-1',
        district: 'Nationwide',
        titleEn: 'G2P Elderly & Disability Allowance Verification Camp Schedule',
        titleBn: 'জিটুপি বয়স্ক ও প্রতিবন্ধী ভাতা যাচাই ক্যাম্প সূচি',
        publishedBy: 'Department of Social Services Liaison',
        publishedAt: '2026-11-16',
      },
    ],
    mapReports: INITIAL_MAP_REPORTS,
    budgetProposals: INITIAL_BUDGET_PROPOSALS,
    helpRequests: [],
    projectVerifications: [
      {
        id: 'pv-1',
        projectId: 'tp-1',
        citizenName: 'Tanvir Hossain',
        district: 'Rajshahi',
        verdict: 'Confirmed Progress',
        note: 'Visited Ward 04 footpath section — tactile paving alignment is mostly complete; 2 corner ramps marked for gentle slope fix.',
        createdAt: '2026-11-15',
      },
    ],
  };
  fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
  return initial;
}

function saveDatabase(db: CivicDatabase) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '12mb' }));

  let db = loadDatabase();

  // Serve MediaPipe WASM runtime locally from installed @mediapipe/tasks-vision package
  const wasmDir = path.resolve(process.cwd(), 'node_modules', '@mediapipe', 'tasks-vision', 'wasm');
  if (fs.existsSync(wasmDir)) {
    app.use('/mediapipe-wasm', express.static(wasmDir));
  }

  // Serve public assets
  const publicDir = path.resolve(process.cwd(), 'public');
  if (fs.existsSync(publicDir)) {
    app.use(express.static(publicDir));
  }

  // Proxy & locally cache official Google MediaPipe task models
  app.get('/api/mediapipe/models/:filename', async (req, res) => {
    const filename = req.params.filename;
    const remoteUrl = MEDIAPIPE_MODEL_URLS[filename];
    if (!remoteUrl) {
      res.status(404).json({ error: 'Unknown MediaPipe model requested.' });
      return;
    }

    try {
      fs.mkdirSync(CACHE_DIR, { recursive: true });
      const cachedPath = path.join(CACHE_DIR, filename);

      if (fs.existsSync(cachedPath)) {
        res.setHeader('Content-Type', 'application/octet-stream');
        res.setHeader('Cache-Control', 'public, max-age=86400');
        fs.createReadStream(cachedPath).pipe(res);
        return;
      }

      const upstream = await fetch(remoteUrl);
      if (!upstream.ok) {
        res.status(502).json({ error: `Failed to fetch MediaPipe model: ${upstream.status}` });
        return;
      }

      const arrayBuffer = await upstream.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(cachedPath, buffer);

      res.setHeader('Content-Type', 'application/octet-stream');
      res.setHeader('Cache-Control', 'public, max-age=86400');
      res.send(buffer);
    } catch (error) {
      console.error('MediaPipe model proxy error:', error);
      res.status(500).json({ error: 'Failed to load MediaPipe model.' });
    }
  });

  // =========================================================================
  // CIVICSPHERE AI PERSISTENT DATA & WORKFLOW ROUTES
  // =========================================================================

  app.get('/api/civic/public-config', (_req, res) => {
    const rawMapsKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY || '';
    const googleMapsApiKey =
      rawMapsKey && !rawMapsKey.includes('MY_') ? rawMapsKey : '';
    const rawSupabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const rawSupabaseAnon = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    res.json({
      googleMapsApiKey,
      supabaseUrl: rawSupabaseUrl.includes('YOUR_') ? '' : rawSupabaseUrl,
      supabaseAnonKey: rawSupabaseAnon.includes('YOUR_') ? '' : rawSupabaseAnon,
    });
  });

  app.get('/api/civic/bootstrap', (_req, res) => {
    res.json({
      polls: db.polls,
      voicePosts: db.voicePosts,
      initiatives: db.initiatives,
      events: db.events,
      complaints: db.complaints,
      leaderboard: db.leaderboard,
      auditLogs: db.auditLogs,
      notices: db.notices,
      mapReports: db.mapReports,
      budgetProposals: db.budgetProposals,
      helpRequests: db.helpRequests,
      projectVerifications: db.projectVerifications,
      reportCount: db.corruptionReports.length,
    });
  });

  app.post('/api/civic/vote', (req, res) => {
    const { pollId, optionId, voterKey } = req.body as {
      pollId?: string;
      optionId?: string;
      voterKey?: string;
    };
    if (!pollId || !optionId || !voterKey) {
      res.status(400).json({ error: 'pollId, optionId, and voterKey are required.' });
      return;
    }
    const existingVoters = db.votedKeys[pollId] || [];
    if (existingVoters.includes(voterKey)) {
      res.status(409).json({ error: 'Duplicate vote prevented: you have already participated in this consultation.' });
      return;
    }
    const poll = db.polls.find((p) => p.id === pollId);
    if (!poll) {
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }
    const opt = poll.options.find((o) => o.id === optionId);
    if (!opt) {
      res.status(404).json({ error: 'Poll option not found.' });
      return;
    }
    opt.votes += 1;
    db.votedKeys[pollId] = [...existingVoters, voterKey];
    saveDatabase(db);
    res.json({ poll });
  });

  app.post('/api/civic/polls/:pollId/comment', (req, res) => {
    const { pollId } = req.params;
    const { author, text } = req.body as { author?: string; text?: string };
    if (!text || !text.trim()) {
      res.status(400).json({ error: 'Comment text is required.' });
      return;
    }
    const poll = db.polls.find((p) => p.id === pollId);
    if (!poll) {
      res.status(404).json({ error: 'Poll not found.' });
      return;
    }
    poll.comments.unshift({
      id: `cmt_${Date.now()}`,
      author: author?.trim() || 'Citizen Contributor',
      text: text.trim(),
      timestamp: 'Just now',
    });
    saveDatabase(db);
    res.json({ poll });
  });

  app.post('/api/civic/voices', (req, res) => {
    const { authorDisplay, visibility, district, category, title, body } = req.body as {
      authorDisplay?: string;
      visibility?: 'public' | 'pseudonymous' | 'confidential';
      district?: string;
      category?: string;
      title?: string;
      body?: string;
    };
    if (!title?.trim() || !body?.trim()) {
      res.status(400).json({ error: 'Title and details are required.' });
      return;
    }
    const post = {
      id: `voice_${Date.now()}`,
      authorDisplay:
        visibility === 'confidential'
          ? 'Confidential Citizen Report'
          : visibility === 'pseudonymous'
            ? `Civic Voice #${Math.floor(1000 + Math.random() * 9000)}`
            : authorDisplay?.trim() || 'Citizen',
      visibility: visibility || 'public',
      district: district || 'Dhaka',
      category: category || 'Community Issue',
      title: title.trim(),
      body: body.trim(),
      supporters: 1,
      createdAt: new Date().toISOString().slice(0, 10),
      status: 'Open' as const,
    };
    db.voicePosts.unshift(post);
    saveDatabase(db);
    res.json({ post });
  });

  app.post('/api/civic/voices/:id/support', (req, res) => {
    const post = db.voicePosts.find((p) => p.id === req.params.id);
    if (!post) {
      res.status(404).json({ error: 'Post not found.' });
      return;
    }
    post.supporters += 1;
    saveDatabase(db);
    res.json({ post });
  });

  app.post('/api/civic/initiatives', (req, res) => {
    const { title, problem, solution, location, category, attachmentNote, createdBy } = req.body as {
      title?: string;
      problem?: string;
      solution?: string;
      location?: string;
      category?: string;
      attachmentNote?: string;
      createdBy?: string;
    };
    if (!title?.trim() || !problem?.trim() || !solution?.trim()) {
      res.status(400).json({ error: 'Title, problem, and proposed solution are required.' });
      return;
    }
    const initItem = {
      id: `init_${Date.now()}`,
      title: title.trim(),
      problem: problem.trim(),
      solution: solution.trim(),
      location: location?.trim() || 'Dhaka Division',
      category: category || 'Community Improvement',
      attachmentNote: attachmentNote?.trim() || undefined,
      supporters: 1,
      targetSupporters: 500,
      progressStatus: 'Gathering Support' as const,
      createdBy: createdBy?.trim() || 'Citizen Initiator',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.initiatives.unshift(initItem);
    saveDatabase(db);
    res.json({ initiative: initItem });
  });

  app.post('/api/civic/initiatives/:id/support', (req, res) => {
    const item = db.initiatives.find((i) => i.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Initiative not found.' });
      return;
    }
    item.supporters += 1;
    if (item.supporters >= item.targetSupporters && item.progressStatus === 'Gathering Support') {
      item.progressStatus = 'Submitted to Council';
    }
    saveDatabase(db);
    res.json({ initiative: item });
  });

  app.post('/api/civic/events', (req, res) => {
    const {
      titleEn,
      titleBn,
      category,
      date,
      time,
      location,
      district,
      mode,
      organizer,
      accessibility,
    } = req.body as {
      titleEn?: string;
      titleBn?: string;
      category?: string;
      date?: string;
      time?: string;
      location?: string;
      district?: string;
      mode?: 'In-Person' | 'Online' | 'Hybrid';
      organizer?: string;
      accessibility?: {
        liveCaptions?: boolean;
        signLanguageInterpreter?: boolean;
        audioDescription?: boolean;
        wheelchairAccessible?: boolean;
      };
    };
    if (!titleEn?.trim() || !date || !location?.trim()) {
      res.status(400).json({ error: 'Event title, date, and location are required.' });
      return;
    }
    const ev = {
      id: `ev_${Date.now()}`,
      titleEn: titleEn.trim(),
      titleBn: titleBn?.trim() || titleEn.trim(),
      category: category || 'Community Discussions',
      date,
      time: time?.trim() || '10:00 AM',
      location: location.trim(),
      district: district || 'Dhaka',
      mode: mode || 'Hybrid',
      organizer: organizer?.trim() || 'Community Group',
      registeredCount: 1,
      accessibility: {
        liveCaptions: Boolean(accessibility?.liveCaptions),
        signLanguageInterpreter: Boolean(accessibility?.signLanguageInterpreter),
        audioDescription: Boolean(accessibility?.audioDescription),
        wheelchairAccessible: Boolean(accessibility?.wheelchairAccessible),
      },
      hasRecording: false,
      qaList: [],
    };
    db.events.unshift(ev);
    saveDatabase(db);
    res.json({ event: ev });
  });

  app.post('/api/civic/events/:id/register', (req, res) => {
    const { attendeeKey } = req.body as { attendeeKey?: string };
    const ev = db.events.find((e) => e.id === req.params.id);
    if (!ev) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    const list = db.eventRegistrations[ev.id] || [];
    const key = attendeeKey || `guest_${Date.now()}`;
    if (!list.includes(key)) {
      db.eventRegistrations[ev.id] = [...list, key];
      ev.registeredCount += 1;
      saveDatabase(db);
    }
    res.json({ event: ev, registered: true });
  });

  app.post('/api/civic/events/:id/qa', (req, res) => {
    const { question, author } = req.body as { question?: string; author?: string };
    const ev = db.events.find((e) => e.id === req.params.id);
    if (!ev) {
      res.status(404).json({ error: 'Event not found.' });
      return;
    }
    if (!question?.trim()) {
      res.status(400).json({ error: 'Question is required.' });
      return;
    }
    ev.qaList.push({
      id: `qa_${Date.now()}`,
      author: author?.trim() || 'Participant',
      question: question.trim(),
    });
    saveDatabase(db);
    res.json({ event: ev });
  });

  app.post('/api/civic/complaints', (req, res) => {
    const { category, district, ward, title, description } = req.body as {
      category?: string;
      district?: string;
      ward?: string;
      title?: string;
      description?: string;
    };
    if (!title?.trim() || !description?.trim()) {
      res.status(400).json({ error: 'Title and description are required.' });
      return;
    }
    const complaint = {
      id: `CMP-2026-${Math.floor(1050 + Math.random() * 8900)}`,
      category: category || 'Municipal Service',
      district: district || 'Dhaka',
      ward: ward || 'Ward 01',
      title: title.trim(),
      description: description.trim(),
      status: 'Submitted' as const,
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    db.complaints.unshift(complaint);
    saveDatabase(db);
    res.json({ complaint });
  });

  app.post('/api/civic/reports', (req, res) => {
    const { category, district, officeName, summary, evidenceFileName, anonymous } = req.body as {
      category?: string;
      district?: string;
      officeName?: string;
      summary?: string;
      evidenceFileName?: string;
      anonymous?: boolean;
    };
    if (!summary?.trim() || !officeName?.trim()) {
      res.status(400).json({ error: 'Office name and detailed summary are required.' });
      return;
    }
    const referenceId = `CS-ACC-${Math.floor(100000 + Math.random() * 899999)}`;
    const report = {
      referenceId,
      category: category || 'Service Bribery / Irregularity',
      district: district || 'Dhaka',
      officeName: officeName.trim(),
      summary: summary.trim(),
      evidenceFileName: evidenceFileName?.trim() || undefined,
      anonymous: anonymous !== false,
      status: 'Received (Confidential)' as const,
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    db.corruptionReports.unshift(report);
    saveDatabase(db);
    res.json({
      referenceId: report.referenceId,
      status: report.status,
      submittedAt: report.submittedAt,
    });
  });

  app.get('/api/civic/reports/:ref', (req, res) => {
    const ref = req.params.ref.trim().toUpperCase();
    const found = db.corruptionReports.find((r) => r.referenceId.toUpperCase() === ref);
    if (!found) {
      res.status(404).json({ error: 'No confidential report matches that reference number.' });
      return;
    }
    // Never expose sensitive identity or full private narrative on public lookup
    res.json({
      referenceId: found.referenceId,
      category: found.category,
      district: found.district,
      status: found.status,
      submittedAt: found.submittedAt,
    });
  });

  app.post('/api/civic/admin/action', (req, res) => {
    const { actor, role, actionType, targetId, payload } = req.body as {
      actor?: string;
      role?: string;
      actionType?: 'update_complaint' | 'publish_notice' | 'moderate_voice' | 'verify_initiative';
      targetId?: string;
      payload?: { status?: string; district?: string; titleEn?: string; titleBn?: string };
    };
    if (!actionType) {
      res.status(400).json({ error: 'actionType is required.' });
      return;
    }
    let summary = '';
    if (actionType === 'update_complaint' && targetId && payload?.status) {
      const cmp = db.complaints.find((c) => c.id === targetId);
      if (cmp) {
        cmp.status = payload.status as typeof cmp.status;
        summary = `Updated complaint ${targetId} status to ${payload.status}`;
      }
    } else if (actionType === 'publish_notice' && payload?.titleEn) {
      const notice = {
        id: `not_${Date.now()}`,
        district: payload.district || 'Nationwide',
        titleEn: payload.titleEn,
        titleBn: payload.titleBn || payload.titleEn,
        publishedBy: actor || 'Municipality Admin',
        publishedAt: new Date().toISOString().slice(0, 10),
      };
      db.notices.unshift(notice);
      summary = `Published public notice for ${notice.district}: ${notice.titleEn}`;
    } else if (actionType === 'moderate_voice' && targetId && payload?.status) {
      const vp = db.voicePosts.find((v) => v.id === targetId);
      if (vp) {
        vp.status = payload.status as typeof vp.status;
        summary = `Updated citizen voice ${targetId} to ${payload.status}`;
      }
    } else if (actionType === 'verify_initiative' && targetId && payload?.status) {
      const initItem = db.initiatives.find((i) => i.id === targetId);
      if (initItem) {
        initItem.progressStatus = payload.status as typeof initItem.progressStatus;
        summary = `Updated initiative ${targetId} stage to ${payload.status}`;
      }
    }

    if (summary) {
      db.auditLogs.unshift({
        id: `aud_${Date.now()}`,
        actor: actor || 'Administrator',
        role: role || 'Municipality Admin',
        action: summary,
        target: targetId || payload?.district || 'Platform',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 16),
      });
      saveDatabase(db);
    }

    res.json({
      complaints: db.complaints,
      notices: db.notices,
      voicePosts: db.voicePosts,
      initiatives: db.initiatives,
      auditLogs: db.auditLogs,
    });
  });

  // =========================================================================
  // MAP PROBLEM REPORTING, PARTICIPATORY BUDGETING, HELP NETWORK & AUDIT
  // =========================================================================
  app.post('/api/civic/map-reports', (req, res) => {
    const { category, district, lat, lng, addressLabel, title, description, photoName, reporterName } =
      req.body as {
        category?: MapProblemCategory;
        district?: string;
        lat?: number;
        lng?: number;
        addressLabel?: string;
        title?: string;
        description?: string;
        photoName?: string;
        reporterName?: string;
      };
    if (!title?.trim() || !description?.trim() || typeof lat !== 'number' || typeof lng !== 'number') {
      res.status(400).json({ error: 'Location coordinates, title, and description are required.' });
      return;
    }
    const report: MapProblemReport = {
      id: `MAP-2026-${Math.floor(400 + Math.random() * 599)}`,
      category: category || 'Broken Road',
      district: district || 'Dhaka',
      lat,
      lng,
      addressLabel: addressLabel?.trim() || `${district || 'Dhaka'} (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      title: title.trim(),
      description: description.trim(),
      photoName: photoName?.trim() || undefined,
      status: 'Reported',
      upvotes: 1,
      reporterName: reporterName?.trim() || 'Citizen Reporter',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.mapReports.unshift(report);
    saveDatabase(db);
    res.json({ report });
  });

  app.post('/api/civic/map-reports/:id/upvote', (req, res) => {
    const item = db.mapReports.find((r) => r.id === req.params.id);
    if (!item) {
      res.status(404).json({ error: 'Map report not found.' });
      return;
    }
    item.upvotes += 1;
    saveDatabase(db);
    res.json({ report: item });
  });

  app.patch('/api/civic/map-reports/:id/status', (req, res) => {
    const { status } = req.body as { status?: MapProblemReport['status'] };
    const item = db.mapReports.find((r) => r.id === req.params.id);
    if (!item || !status) {
      res.status(404).json({ error: 'Map report or status invalid.' });
      return;
    }
    item.status = status;
    saveDatabase(db);
    res.json({ report: item });
  });

  app.post('/api/civic/budget-proposals', (req, res) => {
    const { district, sector, titleEn, titleBn, descriptionEn, descriptionBn, estimatedCrore, proposedBy } =
      req.body as {
        district?: string;
        sector?: BudgetSector;
        titleEn?: string;
        titleBn?: string;
        descriptionEn?: string;
        descriptionBn?: string;
        estimatedCrore?: number;
        proposedBy?: string;
      };
    if (!titleEn?.trim() || !descriptionEn?.trim()) {
      res.status(400).json({ error: 'Proposal title and description are required.' });
      return;
    }
    const proposal: BudgetProposal = {
      id: `bud_${Date.now()}`,
      district: district || 'Dhaka',
      sector: sector || 'Roads',
      titleEn: titleEn.trim(),
      titleBn: titleBn?.trim() || titleEn.trim(),
      descriptionEn: descriptionEn.trim(),
      descriptionBn: descriptionBn?.trim() || descriptionEn.trim(),
      estimatedCrore: Number(estimatedCrore) > 0 ? Number(estimatedCrore) : 1.2,
      votes: 1,
      proposedBy: proposedBy?.trim() || 'Citizen Resident',
    };
    db.budgetProposals.unshift(proposal);
    saveDatabase(db);
    res.json({ proposal });
  });

  app.post('/api/civic/budget-proposals/:id/vote', (req, res) => {
    const prop = db.budgetProposals.find((p) => p.id === req.params.id);
    if (!prop) {
      res.status(404).json({ error: 'Budget proposal not found.' });
      return;
    }
    prop.votes += 1;
    saveDatabase(db);
    res.json({ proposal: prop });
  });

  app.post('/api/civic/help-requests', (req, res) => {
    const { memberId, roleType, district, preferredMode, summary } = req.body as {
      memberId?: string;
      roleType?: string;
      district?: string;
      preferredMode?: HelpMatchRequest['preferredMode'];
      summary?: string;
    };
    if (!summary?.trim()) {
      res.status(400).json({ error: 'Please describe how a volunteer or specialist can help.' });
      return;
    }
    const matched = HUMAN_HELP_NETWORK.find((m) => m.id === memberId);
    const request: HelpMatchRequest = {
      id: `HLP-${Math.floor(1000 + Math.random() * 8999)}`,
      memberId,
      roleType: matched?.roleType || roleType || 'Volunteer',
      district: district || matched?.district || 'Dhaka',
      preferredMode: preferredMode || 'Voice Call',
      summary: summary.trim(),
      status: matched ? 'Matched' : 'Pending Coordinator',
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.helpRequests.unshift(request);
    saveDatabase(db);
    res.json({ helpRequest: request });
  });

  app.post('/api/civic/projects/:id/verify', (req, res) => {
    const { citizenName, district, verdict, note } = req.body as {
      citizenName?: string;
      district?: string;
      verdict?: 'Confirmed Progress' | 'Needs Attention';
      note?: string;
    };
    if (!note?.trim()) {
      res.status(400).json({ error: 'Verification observation is required.' });
      return;
    }
    const entry: ProjectVerificationNote = {
      id: `pv_${Date.now()}`,
      projectId: req.params.id,
      citizenName: citizenName?.trim() || 'Citizen Auditor',
      district: district || 'Dhaka',
      verdict: verdict || 'Confirmed Progress',
      note: note.trim(),
      createdAt: new Date().toISOString().slice(0, 10),
    };
    db.projectVerifications.unshift(entry);
    saveDatabase(db);
    res.json({ verification: entry });
  });

  // =========================================================================
  // AI DOCUMENT READER (MULTIMODAL BANGLA + ENGLISH EXPLAINER & CHECKLIST)
  // =========================================================================
  app.post('/api/civic/ai/document-reader', async (req, res) => {
    try {
      const { documentText, fileBase64, mimeType, language } = req.body as {
        documentText?: string;
        fileBase64?: string;
        mimeType?: string;
        language?: 'en' | 'bn';
      };

      if (!documentText?.trim() && !fileBase64) {
        res.status(400).json({ error: 'Please upload a notice/form or paste document text.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'AI Document Reader requires a configured GEMINI_API_KEY in Settings > Secrets.',
        });
        return;
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      if (fileBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: fileBase64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }

      parts.push({
        text: `Analyze this Bangladesh government notice, NID circular, legal document, or application form.
Explain it in very simple, everyday Bangla (simpleExplanationBn) and clear English (simpleExplanationEn), identify concrete required actions, deadlines/fees mentioned (never invent fees not stated in the doc or verified law), any caution against brokers/scams, and build a clear step-by-step checklist with both English and Bangla labels.
Preferred focus language: ${language === 'bn' ? 'Bangla primary' : 'Bilingual Bangla + English'}.

Document text (if provided):
${documentText?.trim() || 'Extract and read all visible text from the attached image or PDF document.'}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          systemInstruction:
            'You are the Nagarik AI / CivicSphere AI Document Reader for citizens of Bangladesh. Translate dense bureaucratic Bangla or English documents into warm, crystal-clear everyday Bangla and English with actionable steps and a checklist. Never invent fees or deadlines that are absent from the document.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              documentType: { type: Type.STRING },
              issuingAuthority: { type: Type.STRING },
              simpleExplanationBn: { type: Type.STRING },
              simpleExplanationEn: { type: Type.STRING },
              requiredActions: { type: Type.ARRAY, items: { type: Type.STRING } },
              checklistItems: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    labelEn: { type: Type.STRING },
                    labelBn: { type: Type.STRING },
                  },
                },
              },
              deadlinesAndFees: { type: Type.STRING },
              cautionaryNote: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ result: parsed });
    } catch (error) {
      console.error('AI document-reader error:', error);
      res.status(500).json({ error: 'Unable to analyze this document right now. Please try again.' });
    }
  });

  // =========================================================================
  // GOOGLE PLACES API (NEW) PROXY FOR NEARBY HOSPITALS, POLICE & FIRE STATIONS
  // =========================================================================
  app.post('/api/civic/maps-nearby', async (req, res) => {
    const { lat, lng, includedTypes, districtName } = req.body as {
      lat?: number;
      lng?: number;
      includedTypes?: Array<'hospital' | 'police' | 'fire_station'>;
      districtName?: string;
    };

    const centerLat = typeof lat === 'number' ? lat : 23.8103;
    const centerLng = typeof lng === 'number' ? lng : 90.4125;
    const types: Array<'hospital' | 'police' | 'fire_station'> =
      includedTypes && includedTypes.length > 0 ? includedTypes : ['hospital', 'police', 'fire_station'];

    const mapsApiKey = process.env.VITE_GOOGLE_MAPS_API_KEY || process.env.GOOGLE_MAPS_API_KEY;
    if (mapsApiKey && !mapsApiKey.includes('MY_')) {
      try {
        const upstream = await fetch('https://places.googleapis.com/v1/places:searchNearby', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': mapsApiKey,
            'X-Goog-FieldMask':
              'places.id,places.displayName,places.formattedAddress,places.location,places.nationalPhoneNumber,places.googleMapsUri,places.primaryType',
            'X-Goog-Maps-Solution-ID': 'gmp_mcp_codeassist_v1_aistudio',
          },
          body: JSON.stringify({
            includedTypes: types,
            maxResultCount: 12,
            locationRestriction: {
              circle: {
                center: { latitude: centerLat, longitude: centerLng },
                radius: 8000.0,
              },
            },
          }),
        });

        const payloadText = await upstream.text();
        if (
          upstream.status === 429 ||
          payloadText.includes('RESOURCE_EXHAUSTED') ||
          payloadText.includes('OVER_QUERY_LIMIT')
        ) {
          res.status(429).json({
            error: 'RESOURCE_EXHAUSTED',
            message: 'Google Maps Places quota exceeded.',
          });
          return;
        }

        if (upstream.ok) {
          const parsed = JSON.parse(payloadText) as {
            places?: Array<{
              id?: string;
              displayName?: { text?: string };
              formattedAddress?: string;
              nationalPhoneNumber?: string;
              googleMapsUri?: string;
              primaryType?: string;
              location?: { latitude?: number; longitude?: number };
            }>;
          };

          const mapped: NearbyEmergencyPlace[] = (parsed.places || []).map((p, idx) => {
            const pType = (p.primaryType || types[0]) as 'hospital' | 'police' | 'fire_station';
            const normalizedType: NearbyEmergencyPlace['type'] =
              pType === 'police' || pType === 'fire_station' || pType === 'hospital'
                ? pType
                : types[0];
            return {
              id: p.id || `gp_${idx}`,
              name: p.displayName?.text || 'Public Service Facility',
              type: normalizedType,
              address: p.formattedAddress || `${districtName || 'Bangladesh'} Area`,
              phone: p.nationalPhoneNumber,
              lat: p.location?.latitude || centerLat,
              lng: p.location?.longitude || centerLng,
              mapsUri: p.googleMapsUri,
              source: 'google_places',
            };
          });

          if (mapped.length > 0) {
            res.json({ places: mapped, source: 'google_places' });
            return;
          }
        }
      } catch (err) {
        console.warn('Places API proxy fallback triggered:', err);
      }
    }

    // Fallback to verified CivicSphere district directory entries
    const districtMatch =
      BANGLADESH_DISTRICTS.find((d) => d.nameEn.toLowerCase() === (districtName || '').toLowerCase()) ||
      BANGLADESH_DISTRICTS[0];

    const typeMap: Record<string, NearbyEmergencyPlace['type']> = {
      Hospital: 'hospital',
      Clinic: 'hospital',
      Police: 'police',
      Fire: 'fire_station',
    };

    const fallbackPlaces: NearbyEmergencyPlace[] = districtMatch.offices
      .filter((o) => {
        const mappedType = typeMap[o.type];
        return mappedType && types.includes(mappedType);
      })
      .map((o, i) => ({
        id: `dir_${districtMatch.id}_${i}`,
        name: o.name,
        type: typeMap[o.type] || 'hospital',
        address: o.address,
        phone: o.phone,
        lat: districtMatch.lat + (i - 1) * 0.008,
        lng: districtMatch.lng + (i - 1) * 0.008,
        source: 'civic_directory',
      }));

    res.json({ places: fallbackPlaces, source: 'civic_directory' });
  });

  // =========================================================================
  // SPHERE AI MULTILINGUAL CIVIC ASSISTANT (SERVER-SIDE GEMINI)
  // =========================================================================
  app.post('/api/civic/ai/assistant', async (req, res) => {
    try {
      const { question, language, history } = req.body as {
        question?: string;
        language?: 'en' | 'bn';
        history?: Array<{ role: string; text: string }>;
      };

      if (!question?.trim()) {
        res.status(400).json({ error: 'Question is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Sphere AI requires a configured Gemini API key on the server (Settings > Secrets).',
        });
        return;
      }

      const verifiedCatalog = GOVERNMENT_SERVICES.map(
        (s) =>
          `- ${s.titleEn} (${s.titleBn}) | Office: ${s.officeEn} | Portal: ${s.officialPortalUrl || 'Offline/Local'} | Helpline: ${s.helpline || '333'} | Fee Note: ${s.feeNote}`,
      ).join('\n');

      const historyText = (history || [])
        .slice(-4)
        .map((h) => `${h.role}: ${h.text}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Previous context:\n${historyText}\n\nCitizen Question (${language === 'bn' ? 'Respond in clear, simple Bangla' : 'Respond in clear English, with helpful Bangla terms where relevant'}): ${question.trim()}`,
        config: {
          systemInstruction: `You are Sphere AI, the verified civic guidance assistant for CivicSphere AI in Bangladesh.
CRITICAL ACCURACY RULES:
1. NEVER invent official portal URLs, statutory fees, legal sections, or government office addresses.
2. Only cite official portals and helplines that are verified in Bangladesh (such as services.nidw.gov.bd, bdris.gov.bd, gd.police.gov.bd, nlaso.gov.bd, mis.bhata.gov.bd, dis.gov.bd, secure.incometax.gov.bd, bidaquickserv.org, dae.gov.bd, dghs.gov.bd, and helplines 999, 333, 105, 106, 109, 1098, 16263, 16430, 16123).
3. If an exact fee or online URL is not verified or varies by municipality, explicitly write "Verify current statutory schedule at the local office or official portal" rather than guessing a taka figure.
4. Clearly set isOfficialInfo=true when grounded in verified official Bangladesh procedures, and explain clearly in confidenceNote what is official procedure vs general civic guidance.

Verified Service Reference:\n${verifiedCatalog}`,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              isOfficialInfo: { type: Type.BOOLEAN },
              confidenceNote: { type: Type.STRING },
              shortExplanation: { type: Type.STRING },
              eligibility: { type: Type.ARRAY, items: { type: Type.STRING } },
              requiredDocuments: { type: Type.ARRAY, items: { type: Type.STRING } },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedFees: { type: Type.STRING },
              relevantOffice: { type: Type.STRING },
              officialLink: { type: Type.STRING },
              offlineMethod: { type: Type.STRING },
              helpline: { type: Type.STRING },
              ifRejected: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ answer: parsed });
    } catch (error) {
      console.error('Sphere AI error:', error);
      res.status(500).json({ error: 'Sphere AI could not process this request right now. Please try again.' });
    }
  });

  // =========================================================================
  // AI FACT-CHECKING ASSISTANT (GEMINI + GOOGLE SEARCH GROUNDING)
  // =========================================================================
  app.post('/api/civic/ai/fact-check', async (req, res) => {
    try {
      const { claimText, imageBase64, mimeType } = req.body as {
        claimText?: string;
        imageBase64?: string;
        mimeType?: string;
      };

      if (!claimText?.trim() && !imageBase64) {
        res.status(400).json({ error: 'Please provide a claim, link, or screenshot to verify.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Fact-checking requires a configured Gemini API key on the server.',
        });
        return;
      }

      const parts: Array<{ text?: string; inlineData?: { mimeType: string; data: string } }> = [];
      if (imageBase64) {
        parts.push({
          inlineData: {
            mimeType: mimeType || 'image/png',
            data: imageBase64.replace(/^data:[^;]+;base64,/, ''),
          },
        });
      }
      parts.push({
        text: `Analyze this civic claim/article/post from Bangladesh carefully using grounded web verification. Identify the core factual claims, list supporting evidence, list conflicting or missing context, state explicit limitations, and assess confidence honestly. Never invent fact-check outcomes or fabricate sources.\n\nClaim/URL/Text:\n${claimText?.trim() || 'Extract and evaluate the claim shown in the attached screenshot.'}`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: { parts },
        config: {
          tools: [{ googleSearch: {} }],
          systemInstruction:
            'You are a careful, impartial civic fact-checking analyst for Bangladesh. Format your response clearly with headings: 1. Core Claim Identified, 2. Evidence Assessment, 3. Supporting & Conflicting Context, 4. Confidence & Limitations. Never invent citations.',
        },
      });

      const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
      const sources = chunks
        .map((c: { web?: { uri?: string; title?: string } }) =>
          c.web?.uri ? { title: c.web.title || c.web.uri, uri: c.web.uri } : null,
        )
        .filter(Boolean);

      res.json({
        analysis: response.text || 'Unable to verify claim with available sources.',
        sources,
      });
    } catch (error) {
      console.error('Fact-check AI error:', error);
      res.status(500).json({ error: 'Fact-checking service failed to verify this claim.' });
    }
  });

  // =========================================================================
  // LEGAL HELP & GD DRAFT GENERATOR AI
  // =========================================================================
  app.post('/api/civic/ai/legal-help', async (req, res) => {
    try {
      const { situation, helpType, language } = req.body as {
        situation?: string;
        helpType?: 'rights-guidance' | 'gd-draft' | 'police-complaint' | 'checklist';
        language?: 'en' | 'bn';
      };

      if (!situation?.trim()) {
        res.status(400).json({ error: 'Please describe your situation.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Legal guidance AI requires a configured Gemini API key on the server.',
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Mode: ${helpType || 'rights-guidance'}\nPreferred Language: ${language === 'bn' ? 'Bangla (with clear legal structure)' : 'English (with key Bangla terms)'}\n\nCitizen Situation:\n${situation.trim()}`,
        config: {
          systemInstruction:
            'You provide structured, confidential civic legal information for Bangladesh (General Diary / GD drafts, citizen rights explanations, NLASO free legal aid 16430, domestic violence helpline 109, emergency 999, cybercrime guidance). Always clearly state that this is general legal information and document preparation guidance, not formal professional legal advice from an enrolled advocate. Never invent statute numbers.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              disclaimer: { type: Type.STRING },
              summaryGuidance: { type: Type.STRING },
              nextSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              documentChecklist: { type: Type.ARRAY, items: { type: Type.STRING } },
              draftTemplate: { type: Type.STRING },
              supportContacts: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ result: parsed });
    } catch (error) {
      console.error('Legal AI error:', error);
      res.status(500).json({ error: 'Unable to generate legal guidance right now.' });
    }
  });

  // =========================================================================
  // SIGNTALK BDSL ROUTES (PRESERVED)
  // =========================================================================
  app.post('/api/translate-to-sign', async (req, res) => {
    try {
      const { text, availableSigns } = req.body as {
        text?: string;
        availableSigns?: Array<{ id: string; bangla: string; english: string }>;
      };

      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.json({ usedGemini: false, steps: null });
        return;
      }

      const lexiconSummary = (availableSigns || [])
        .map((s) => `${s.id}: ${s.bangla} (${s.english})`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Translate the following spoken message into a natural Bangla Sign Language (BdSL) sequence using the reference PDF signs whenever possible.\n\nSpoken message: "${text.trim()}"\n\nAvailable PDF Signs:\n${lexiconSummary}`,
        config: {
          systemInstruction:
            'You are an expert Bangla Sign Language (BdSL / বাংলা ইশারা ভাষা) interpreter trained on the BBDN Inclusive TVET Disability Inclusion Manual. Given any Bangla or English sentence, break it down into an ordered list of BdSL sign steps. Map concepts to the exact signId from Available PDF Signs whenever a semantic match exists.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              banglaNormalized: { type: Type.STRING },
              englishNormalized: { type: Type.STRING },
              steps: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    signId: { type: Type.STRING },
                    spokenToken: { type: Type.STRING },
                    explanationBn: { type: Type.STRING },
                    explanationEn: { type: Type.STRING },
                  },
                },
              },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({ usedGemini: true, ...parsed });
    } catch (error) {
      console.error('translate-to-sign error:', error);
      res.json({ usedGemini: false, steps: null });
    }
  });

  app.post('/api/compose-bangla', async (req, res) => {
    try {
      const { tokens } = req.body as { tokens?: string[] };
      if (!tokens || tokens.length === 0) {
        res.status(400).json({ error: 'Sign tokens are required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.json({
          banglaText: tokens.join(' '),
          englishText: tokens.join(' '),
          usedGemini: false,
        });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: `Convert these sequential Bangla Sign Language (BdSL) gloss tokens into a natural, grammatically smooth Bangla sentence and an English translation.\nTokens: ${JSON.stringify(tokens)}`,
        config: {
          systemInstruction:
            'You convert Bangla Sign Language gloss sequences into natural, polite, grammatically accurate Bangla sentences and concise English equivalents.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              banglaText: { type: Type.STRING },
              englishText: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json({
        banglaText: parsed.banglaText || tokens.join(' '),
        englishText: parsed.englishText || tokens.join(' '),
        usedGemini: true,
      });
    } catch (error) {
      console.error('compose-bangla error:', error);
      res.json({
        banglaText: (req.body?.tokens || []).join(' '),
        englishText: (req.body?.tokens || []).join(' '),
        usedGemini: false,
      });
    }
  });

  app.post('/api/interpret-sign-image', async (req, res) => {
    try {
      const { imageBase64, mimeType, availableSigns } = req.body as {
        imageBase64?: string;
        mimeType?: string;
        availableSigns?: Array<{ id: string; bangla: string; english: string; desc: string }>;
      };

      if (!imageBase64) {
        res.status(400).json({ error: 'Image data is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key is not configured on the server.' });
        return;
      }

      const cleanBase64 = imageBase64.replace(/^data:[^;]+;base64,/, '');
      const lexiconList = (availableSigns || [])
        .slice(0, 100)
        .map((s) => `${s.id} => ${s.bangla} (${s.english}): ${s.desc}`)
        .join('\n');

      const response = await ai.models.generateContent({
        model: 'gemini-4-hydrogen',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'image/jpeg',
                data: cleanBase64,
              },
            },
            {
              text: `Identify which Bangla Sign Language (BdSL) sign from the list below is being performed in this image.\n\nReference BdSL Signs:\n${lexiconList}`,
            },
          ],
        },
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              signId: { type: Type.STRING },
              bangla: { type: Type.STRING },
              english: { type: Type.STRING },
              confidence: { type: Type.NUMBER },
              observationBn: { type: Type.STRING },
            },
          },
        },
      });

      const parsed = JSON.parse((response.text ?? '{}').trim());
      res.json(parsed);
    } catch (error) {
      console.error('interpret-sign-image error:', error);
      res.status(500).json({ error: 'Failed to analyze sign image.' });
    }
  });

  app.post('/api/transcribe-speech', async (req, res) => {
    try {
      const { audioBase64, mimeType } = req.body as {
        audioBase64?: string;
        mimeType?: string;
      };

      if (!audioBase64) {
        res.status(400).json({ error: 'Audio data is required.' });
        return;
      }

      const ai = getGeminiClient();
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured for audio transcription.' });
        return;
      }

      const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-transcribe',
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: mimeType || 'audio/webm',
                data: cleanBase64,
              },
            },
            {
              text: 'Transcribe this speech accurately in Bangla or English (whichever language is spoken). Output only the spoken transcript.',
            },
          ],
        },
      });

      res.json({ text: (response.text ?? '').trim() });
    } catch (error) {
      console.error('transcribe-speech error:', error);
      res.status(500).json({ error: 'Failed to transcribe speech audio.' });
    }
  });

  app.post('/api/tts-bangla', async (req, res) => {
    try {
      const { text } = req.body as { text?: string };
      if (!text || !text.trim()) {
        res.status(400).json({ error: 'Text is required for TTS.' });
        return;
      }

      const ai = getGeminiClient('v1beta');
      if (!ai) {
        res.status(503).json({ error: 'Gemini API key not configured.' });
        return;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash-lite-tts',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: text.trim(),
                speechMetadata: {
                  style: 'Clear, warm, natural Bangla/English interpreter voice',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Kore' },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        res.status(500).json({ error: 'No audio returned by TTS model.' });
        return;
      }

      res.json({ audioBase64: base64Audio, mimeType: 'audio/wav' });
    } catch (error) {
      console.error('tts-bangla error:', error);
      res.status(500).json({ error: 'TTS generation failed.' });
    }
  });

  // Dev Vite middleware or production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CivicSphere AI & SignTalk server listening on http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
