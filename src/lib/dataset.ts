import type { ApiProfile, ProxyResponse } from '@/types';
import { buildProxyPayload, runProxy } from '@/lib/request';
import { get } from '@/lib/mapping';

export type BuiltDataset = {
  sourceName?: string;
  rows: any[];
};

export async function runProfile(profile: ApiProfile): Promise<ProxyResponse> {
  const payload = buildProxyPayload(profile);
  return runProxy(payload);
}

export function interpolate(template: string, vars: Record<string, string>): string {
  let out = template || '';
  for (const [k, v] of Object.entries(vars)) {
    out = out.replaceAll(`{${k}}`, v ?? '');
  }
  return out;
}

export function cloneProfile(p: ApiProfile): ApiProfile {
  return JSON.parse(JSON.stringify(p));
}

export async function buildDataset(
  listProfile: ApiProfile,
  arrayPath: string,
  options?: {
    maxItems?: number;
    detailProfile?: ApiProfile; // optional; if omitted, dataset rows = list items
    idPath?: string; // path to id in each list item
    idVarName?: string; // variable name used in detailProfile.path (e.g., {ID})
  }
): Promise<BuiltDataset> {
  const res = await runProfile(listProfile);
  if (!res.ok) throw new Error(`List request failed: ${res.status} ${res.statusText}`);
  const data = res.data;
  const items: any[] = Array.isArray(get(data, arrayPath)) ? get(data, arrayPath) : [];
  const max = options?.maxItems ?? 20;
  const limited = items.slice(0, max);

  if (!options?.detailProfile) {
    return { sourceName: listProfile.name, rows: limited };
  }

  const out: any[] = [];
  for (const it of limited) {
    const id = options.idPath ? get(it, options.idPath) : undefined;
    let dp = cloneProfile(options.detailProfile);
    if (id && options.idVarName) {
      dp.path = interpolate(dp.path || '', { [options.idVarName]: String(id) });
    }
    const dres = await runProfile(dp);
    if (dres.ok) out.push(dres.data);
    else out.push({ __error: true, status: dres.status, statusText: dres.statusText });
  }
  return { sourceName: listProfile.name, rows: out };
}
