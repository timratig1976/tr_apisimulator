"use client";
import { useCallback, useMemo, useState } from 'react';
import type { ApiProfile, ProxyResponse } from '@/types';
import ApiProfileForm from '@/components/ApiProfileForm';
import ResponseViewer from '@/components/ResponseViewer';
import { runRequest } from '@/lib/request';
import { hubspotPresets } from '@/presets/hubspot';
import { buildN8nHttpRequestNode } from '@/lib/n8n';

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

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">API Runner</h1>
        <div className="flex items-center gap-2">
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
        </div>
        <div>
          <ResponseViewer response={response} />
        </div>
      </section>
    </main>
  );
}
