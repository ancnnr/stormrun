const API_BASE = process.env.NEXT_PUBLIC_STORMRUN_API_URL ?? '';

export async function apiFetch<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const token = sessionStorage.getItem('sr_token');
  const res = await fetch(API_BASE + path, {
    ...opts,
    headers: {
      'Content-Type': 'application/json',
      ...(opts.headers ?? {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401 || res.status === 403) {
    sessionStorage.clear();
    window.location.href = '/manage';
    throw new Error('Unauthorized');
  }
  const body = await res.json();
  if (!body.success) throw new Error(body.error?.message ?? 'API error');
  return body.data;
}

export async function seedProfile(
  userId: string,
  payload: {
    shelter_lat: number;
    shelter_lng: number;
    shelter_name: string;
    vitals_age?: number;
    vitals_gender?: string;
    vitals_height?: number;
    vitals_weight?: number;
    vitals_height_unit?: string;
    vitals_weight_unit?: string;
    vitals_experience_level?: string;
    vitals_weekly_goal?: number;
  }
): Promise<void> {
  await apiFetch(`/api/admin/users/${userId}/seed-profile`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export interface SimulateResult {
  missionId: string;
  missionTitle: string;
  distanceKm: number;
  timeSeconds: number;
  paceMinPerKm: number;
  routeSaved: boolean;
  newCellsClaimed: number;
  xpAwarded: number;
  goldAwarded: number;
  itemsAwarded: { id: string; name: string; quantity: number }[];
  newLevel: number;
  leveledUp: boolean;
}

export async function simulateMission(
  userId: string,
  payload: {
    mission_id: string;
    start_lat: number;
    start_lng: number;
    seed: number;
    pace_min_per_km: number;
  }
): Promise<SimulateResult> {
  return apiFetch<SimulateResult>(`/api/admin/users/${userId}/simulate-mission`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

// ── Programs API ──────────────────────────────────────────────────────────────

export interface TimelineOption {
  weeks: number;
  label: string;
  sessionsPerWeek: number;
}

export interface Program {
  id: string;
  slug: string;
  title: string;
  description: string | null;
  long_description: string | null;
  category: string;
  difficulty: string;
  icon: string | null;
  cover_image_url: string | null;
  expected_outcomes: string[] | null;
  timeline_options: TimelineOption[];
  default_sessions_per_week: number;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ProgramMission {
  id: string;
  program_id: string;
  mission_id: string;
  week_number: number;
  day_in_week: number;
  sort_order: number;
  is_rest_day: boolean;
  intervals: IntervalStep[] | null;
  timeline_week_mapping: Record<string, number | null>;
  missionTitle: string;
  missionDifficulty: string | null;
  locomotionType: string | null;
  created_at: string;
}

export interface IntervalStep {
  action: 'walk' | 'run';
  durationSec: number;
  label?: string;
}

export async function listPrograms(): Promise<Program[]> {
  return apiFetch<Program[]>('/api/admin/programs');
}

export async function createProgram(data: Omit<Program, 'id' | 'created_at'>): Promise<Program> {
  return apiFetch<Program>('/api/admin/programs', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProgram(id: string, data: Partial<Program>): Promise<Program> {
  return apiFetch<Program>(`/api/admin/programs/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProgram(id: string): Promise<void> {
  await apiFetch<void>(`/api/admin/programs/${id}`, { method: 'DELETE' });
}

export async function listProgramMissions(programId: string): Promise<ProgramMission[]> {
  return apiFetch<ProgramMission[]>(`/api/admin/programs/${programId}/missions`);
}

export async function addProgramMission(
  programId: string,
  data: Omit<ProgramMission, 'id' | 'program_id' | 'created_at' | 'missionTitle' | 'missionDifficulty' | 'locomotionType'>
): Promise<ProgramMission> {
  return apiFetch<ProgramMission>(`/api/admin/programs/${programId}/missions`, {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export async function updateProgramMission(
  programId: string,
  pmId: string,
  data: Partial<ProgramMission>
): Promise<ProgramMission> {
  return apiFetch<ProgramMission>(`/api/admin/programs/${programId}/missions/${pmId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
}

export async function deleteProgramMission(programId: string, pmId: string): Promise<void> {
  await apiFetch<void>(`/api/admin/programs/${programId}/missions/${pmId}`, { method: 'DELETE' });
}

export async function reorderProgramMissions(
  programId: string,
  missions: { id: string; sort_order: number; week_number?: number; day_in_week?: number }[]
): Promise<void> {
  await apiFetch<void>(`/api/admin/programs/${programId}/missions/reorder`, {
    method: 'PUT',
    body: JSON.stringify({ missions }),
  });
}

export async function apiUpload<T>(path: string, formData: FormData): Promise<T> {
  const token = sessionStorage.getItem('sr_token');
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: formData,
  });
  const body = await res.json();
  if (!body.success) throw new Error(body.error?.message ?? 'Upload error');
  return body.data;
}
