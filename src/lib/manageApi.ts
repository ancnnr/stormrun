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
  territoryClaimed: boolean;
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
