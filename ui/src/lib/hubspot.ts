import type { ApiProfile, ProxyRequest, ProxyResponse } from '@/types';
import { buildUrl, runProxy } from '@/lib/request';
import { diffProperties } from '@/lib/mapping';

export type UpsertPlan = {
  action: 'create' | 'update' | 'noop';
  matchEmail?: string;
  id?: string;
  properties: Record<string, any>;
  diff?: Record<string, { from: any; to: any }>;
};

function ensureBearerHeaders(profile: ApiProfile): Record<string, string> {
  const headers: Record<string, string> = { ...(profile.headers || {}) };
  if (profile.auth?.type === 'bearer' && profile.auth.bearerToken) {
    headers['Authorization'] = `Bearer ${profile.auth.bearerToken}`;
  }
  headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  return headers;
}

export async function searchContactByEmail(base: ApiProfile, email: string): Promise<ProxyResponse> {
  const headers = ensureBearerHeaders(base);
  const url = buildUrl(base.baseUrl, '/crm/v3/objects/contacts/search', {});
  const payload: ProxyRequest = {
    url,
    method: 'POST',
    headers,
    body: {
      filterGroups: [{ filters: [{ propertyName: 'email', operator: 'EQ', value: email }] }],
      properties: ['email', 'firstname', 'lastname', 'hs_object_id'],
      limit: 1,
    },
  };
  return runProxy(payload);
}

export async function planUpsertContactByEmail(base: ApiProfile, properties: Record<string, any>): Promise<UpsertPlan> {
  const email = properties.email;
  if (!email) return { action: 'create', properties };
  const res = await searchContactByEmail(base, email);
  if (res.ok && (res.data as any)?.total > 0) {
    const first = (res.data as any).results?.[0];
    const id = first.id as string;
    const currentProps = first.properties || {};
    const diff = diffProperties(currentProps, properties);
    const hasChanges = Object.keys(diff).length > 0;
    return { action: hasChanges ? 'update' : 'noop', id, properties, diff };
  }
  return { action: 'create', matchEmail: email, properties };
}

export async function executeUpsertContactByEmail(base: ApiProfile, plan: UpsertPlan, dryRun: boolean): Promise<ProxyResponse> {
  if (dryRun) {
    return {
      ok: true,
      status: 200,
      statusText: 'DryRun',
      headers: {},
      data: plan,
      durationMs: 0,
    };
  }

  const headers = ensureBearerHeaders(base);

  if (plan.action === 'create') {
    const url = buildUrl(base.baseUrl, '/crm/v3/objects/contacts', {});
    const payload: ProxyRequest = { url, method: 'POST', headers, body: { properties: plan.properties } };
    return runProxy(payload);
  }
  if (plan.action === 'update' && plan.id) {
    const url = buildUrl(base.baseUrl, `/crm/v3/objects/contacts/${plan.id}`, {});
    const payload: ProxyRequest = { url, method: 'PATCH', headers, body: { properties: plan.properties } };
    return runProxy(payload);
  }

  return {
    ok: true,
    status: 200,
    statusText: 'Noop',
    headers: {},
    data: plan,
    durationMs: 0,
  };
}
