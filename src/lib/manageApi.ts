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
