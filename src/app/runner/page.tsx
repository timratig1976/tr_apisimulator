"use client";
import { useCallback, useMemo, useState } from 'react';
import type { ApiProfile, ProxyResponse } from '@/types';
import ApiProfileForm from '@/components/ApiProfileForm';
import ResponseViewer from '@/components/ResponseViewer';
import { runRequest } from '@/lib/request';
import { hubspotPresets } from '@/presets/hubspot';
import { buildN8nHttpRequestNode } from '@/lib/n8n';
import { buildDataset, type BuiltDataset } from '@/lib/dataset';

const DEFAULT_PROFILE: ApiProfile = {
  name: 'New Request',
  baseUrl: '',
  path: '',
  method: 'GET',
  headers: { 'Content-Type': 'application/json' },
  query: {},
  body: undefined,
  auth: { type: 'none' },
};

export default function RunnerPage() {
  const [profile, setProfile] = useState<ApiProfile>(() => {
    if (typeof window !== 'undefined') {
      const saved = window.localStorage.getItem('apiProfile');
      if (saved) {
        try { return JSON.parse(saved) as ApiProfile; } catch {}
      }
    }
    return DEFAULT_PROFILE;
  });
  const [response, setResponse] = useState<ProxyResponse | undefined>(undefined);
  const [loading, setLoading] = useState(false);
  const [dryRun, setDryRun] = useState(true);

  // Dataset builder state
  const [arrayPath, setArrayPath] = useState<string>('results');
  const [maxItems, setMaxItems] = useState<number>(10);
  const [useDetail, setUseDetail] = useState<boolean>(false);
  const [detailPath, setDetailPath] = useState<string>('');
  const [detailMethod, setDetailMethod] = useState<ApiProfile['method']>('GET');
  const [detailIdPath, setDetailIdPath] = useState<string>('id');
  const [detailIdVar, setDetailIdVar] = useState<string>('ID');
  const [dataset, setDataset] = useState<BuiltDataset | undefined>(undefined);
  const [datasetName, setDatasetName] = useState<string>('my_dataset');
  const [savedDatasets, setSavedDatasets] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const all = JSON.parse(window.localStorage.getItem('datasets') || '{}');
      return Object.keys(all);
    } catch {
      return [];
    }
  });

  const presets = useMemo(() => hubspotPresets, []);

  const onApplyPreset = useCallback((name: string) => {
    const preset = presets.find((p) => p.name === name);
    if (!preset) return;
    const next: ApiProfile = {
      ...DEFAULT_PROFILE,
      ...preset.profile,
      headers: { ...DEFAULT_PROFILE.headers, ...(preset.profile.headers || {}) },
      query: { ...(preset.profile.query || {}) },
      auth: preset.profile.auth || { type: 'none' },
    } as ApiProfile;
    setProfile(next);
    if (typeof window !== 'undefined') window.localStorage.setItem('apiProfile', JSON.stringify(next));
  }, [presets]);

  const onChangeProfile = useCallback((next: ApiProfile) => {
    setProfile(next);
    if (typeof window !== 'undefined') window.localStorage.setItem('apiProfile', JSON.stringify(next));
  }, []);

  const execute = useCallback(async () => {
    setLoading(true);
    setResponse(undefined);
    try {
      const res = await runRequest(profile);
      setResponse(res);
    } catch (e: any) {
      setResponse({ ok: false, status: 0, statusText: 'ClientError', headers: {}, rawText: e?.message || 'Unknown error' });
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const exportN8n = useCallback(() => {
    const node = buildN8nHttpRequestNode(profile);
    const blob = new Blob([JSON.stringify(node, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${profile.name?.replace(/\s+/g, '_') || 'http_request'}.n8n.node.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [profile]);

  // Dataset builder actions
  const buildDatasetAction = useCallback(async () => {
    const listProfile = profile; // reuse current profile as list request
    const detail = useDetail
      ? {
          ...listProfile,
          method: detailMethod,
          path: detailPath,
        }
      : undefined;
    try {
      const ds = await buildDataset(listProfile, arrayPath, {
        maxItems,
        detailProfile: detail,
        idPath: detailIdPath,
        idVarName: detailIdVar,
      });
      setDataset(ds);
    } catch (e: any) {
      alert(e?.message || 'Failed to build dataset');
    }
  }, [profile, arrayPath, maxItems, useDetail, detailPath, detailMethod, detailIdPath, detailIdVar]);

  const saveDataset = useCallback(() => {
    if (!dataset) return;
    try {
      const key = 'datasets';
      const all = JSON.parse(window.localStorage.getItem(key) || '{}');
      all[datasetName] = dataset;
      window.localStorage.setItem(key, JSON.stringify(all));
      setSavedDatasets(Object.keys(all));
    } catch {
      alert('Failed to save dataset');
    }
  }, [dataset, datasetName]);

  const loadDataset = useCallback((name: string) => {
    try {
      const all = JSON.parse(window.localStorage.getItem('datasets') || '{}');
      if (all[name]) setDataset(all[name]);
    } catch {
      /* noop */
    }
  }, []);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">API Runner</h1>
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
            Dry Run
          </label>
          <button className="btn" onClick={exportN8n}>Als n8n Node exportieren</button>
          <button className="btn-primary" onClick={execute} disabled={loading}>{loading ? 'Läuft…' : 'Request ausführen'}</button>
        </div>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <ApiProfileForm
            value={profile}
            onChange={onChangeProfile}
            onRun={execute}
            presets={presets}
            onApplyPreset={onApplyPreset}
          />

          <div className="mt-6 p-4 border rounded space-y-3">
            <div className="font-medium">Dataset Builder (Generic)</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="input" placeholder="Array path in list response (e.g. results or data.items)" value={arrayPath} onChange={(e) => setArrayPath(e.target.value)} />
              <input className="input" type="number" min={1} max={1000} placeholder="Max items" value={maxItems} onChange={(e) => setMaxItems(parseInt(e.target.value || '0') || 0)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={useDetail} onChange={(e) => setUseDetail(e.target.checked)} />
              Fetch per-item detail
            </label>
            {useDetail && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                <input className="input" placeholder="Detail path template (e.g. /v1/users/{ID})" value={detailPath} onChange={(e) => setDetailPath(e.target.value)} />
                <select className="input" value={detailMethod} onChange={(e) => setDetailMethod(e.target.value as any)}>
                  {['GET','POST','PUT','PATCH','DELETE','HEAD'].map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <input className="input" placeholder="ID path in list item (e.g. id or user.id)" value={detailIdPath} onChange={(e) => setDetailIdPath(e.target.value)} />
                <input className="input" placeholder="ID var name in template (default ID)" value={detailIdVar} onChange={(e) => setDetailIdVar(e.target.value)} />
              </div>
            )}
            <div className="flex gap-2">
              <button className="btn" onClick={buildDatasetAction}>Build Dataset</button>
              <input className="input flex-1" placeholder="Dataset name" value={datasetName} onChange={(e) => setDatasetName(e.target.value)} />
              <button className="btn" onClick={saveDataset} disabled={!dataset}>Save</button>
              <select className="input" onChange={(e) => e.target.value && loadDataset(e.target.value)}>
                <option value="">Load…</option>
                {savedDatasets.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {dataset && (
              <div className="text-sm text-gray-600">Rows: {dataset.rows.length}</div>
            )}
            {dataset && (
              <div className="border rounded">
                <div className="p-2 border-b text-sm bg-gray-50">Dataset Preview</div>
                <div className="p-2 space-y-2">
                  {dataset.rows.slice(0, 5).map((r, i) => (
                    <div key={i} className="border rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Row {i}</div>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        <div>
          <ResponseViewer response={response} />
        </div>
      </section>
    </main>
  );
}
