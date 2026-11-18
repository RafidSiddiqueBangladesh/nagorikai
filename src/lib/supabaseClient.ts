import { createClient, type Session, type SupabaseClient } from '@supabase/supabase-js';
import type { MapProblemReport, UserProfile } from '../types/civicsphere';

let supabaseInstance: SupabaseClient | null = null;
let configuredUrl = '';
let configuredAnonKey = '';

export function initSupabaseClient(url?: string, anonKey?: string): SupabaseClient | null {
  const resolvedUrl = (url || import.meta.env.VITE_SUPABASE_URL || '').trim();
  const resolvedKey = (anonKey || import.meta.env.VITE_SUPABASE_ANON_KEY || '').trim();

  if (
    !resolvedUrl ||
    !resolvedKey ||
    resolvedUrl.includes('YOUR_PROJECT') ||
    resolvedKey.includes('YOUR_SUPABASE')
  ) {
    return null;
  }

  if (supabaseInstance && configuredUrl === resolvedUrl && configuredAnonKey === resolvedKey) {
    return supabaseInstance;
  }

  try {
    supabaseInstance = createClient(resolvedUrl, resolvedKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
    configuredUrl = resolvedUrl;
    configuredAnonKey = resolvedKey;
    return supabaseInstance;
  } catch {
    return null;
  }
}

export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseInstance) {
    return initSupabaseClient();
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(getSupabaseClient());
}

export async function getSupabaseSession(): Promise<Session | null> {
  const client = getSupabaseClient();
  if (!client) return null;
  try {
    const { data } = await client.auth.getSession();
    return data.session ?? null;
  } catch {
    return null;
  }
}

export async function signInWithGoogleSupabase(): Promise<{ ok: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return {
      ok: false,
      error: 'Supabase is not connected yet. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Settings > Secrets.',
    };
  }
  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) return { ok: false, error: error.message };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'Google Sign-In failed.' };
  }
}

export async function signInWithEmailSupabase(
  email: string,
  password: string,
): Promise<{ ok: boolean; session?: Session | null; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase not configured.' };
  }
  const { data, error } = await client.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: data.session };
}

export async function signUpWithEmailSupabase(
  email: string,
  password: string,
  fullName: string,
): Promise<{ ok: boolean; session?: Session | null; needsVerification?: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (!client) {
    return { ok: false, error: 'Supabase not configured.' };
  }
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: window.location.origin,
    },
  });
  if (error) return { ok: false, error: error.message };
  return {
    ok: true,
    session: data.session,
    needsVerification: !data.session,
  };
}

export async function signOutSupabase(): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.auth.signOut();
  } catch {
    // ignore
  }
}

// Best-effort cloud sync to Supabase tables if user has created matching tables
export async function syncCitizenProfileToSupabase(profile: UserProfile): Promise<void> {
  const client = getSupabaseClient();
  if (!client || profile.isGuest) return;
  try {
    await client.from('civic_profiles').upsert(
      {
        id: profile.id,
        full_name: profile.name,
        email: profile.email || null,
        district: profile.district,
        language: profile.language,
        role: profile.role,
        civic_points: profile.civicPoints,
        communication_preference: profile.communicationPreference,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'id' },
    );
  } catch {
    // Table optional; local persistence always active
  }
}

export async function syncMapReportToSupabase(report: MapProblemReport): Promise<void> {
  const client = getSupabaseClient();
  if (!client) return;
  try {
    await client.from('map_problem_reports').upsert(
      {
        id: report.id,
        category: report.category,
        district: report.district,
        lat: report.lat,
        lng: report.lng,
        address_label: report.addressLabel,
        title: report.title,
        description: report.description,
        status: report.status,
        upvotes: report.upvotes,
        created_at: report.createdAt,
      },
      { onConflict: 'id' },
    );
  } catch {
    // Table optional; server JSON store persists all reports
  }
}
