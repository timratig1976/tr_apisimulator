import type { ApiProfile, ProxyRequest, ProxyResponse } from '@/types';

export function buildUrl(baseUrl: string, path: string, query: Record<string, string>) {
  const base = baseUrl.replace(/\/$/, '');
  const p = path ? (path.startsWith('/') ? path : `/${path}`) : '';
  const url = new URL(base + p);
  for (const [k, v] of Object.entries(query || {})) {
    if (v !== undefined && v !== null && `${v}` !== '') url.searchParams.set(k, `${v}`);
  }
  return url.toString();
}

export function applyAuth(profile: ApiProfile): { headers: Record<string, string>; query: Record<string, string> } {
  const headers: Record<string, string> = { ...(profile.headers || {}) };
  const query: Record<string, string> = { ...(profile.query || {}) };

  switch (profile.auth?.type) {
    case 'apiKeyHeader': {
      const headerName = profile.auth.apiKeyHeaderName || 'Authorization';
      if (profile.auth.apiKey) headers[headerName] = profile.auth.apiKey;
      break;
    }
    case 'apiKeyQuery': {
      const queryName = profile.auth.apiKeyQueryName || 'api_key';
      if (profile.auth.apiKey) query[queryName] = profile.auth.apiKey;
      break;
    }
    case 'bearer': {
      if (profile.auth.bearerToken) headers['Authorization'] = `Bearer ${profile.auth.bearerToken}`;
      break;
    }
    case 'none':
    default:
      break;
  }
  return { headers, query };
}

export async function runRequest(profile: ApiProfile): Promise<ProxyResponse> {
  const { headers, query } = applyAuth(profile);
  const url = buildUrl(profile.baseUrl, profile.path, query);

  const payload: ProxyRequest = {
    url,
    method: profile.method,
    headers,
    body: profile.body,
  };

  const started = Date.now();
  const res = await fetch('/api/proxy', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const json = (await res.json()) as ProxyResponse;
  return { ...json, durationMs: json.durationMs ?? Date.now() - started };
}
