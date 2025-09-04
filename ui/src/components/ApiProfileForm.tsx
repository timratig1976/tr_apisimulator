"use client";
import { useState } from 'react';
import type { ApiProfile, AuthType, HttpMethod } from '@/types';

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];
const AUTH_TYPES: { value: AuthType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'apiKeyHeader', label: 'API Key in Header' },
  { value: 'apiKeyQuery', label: 'API Key in Query' },
  { value: 'bearer', label: 'Bearer Token' },
];

export interface ApiProfileFormProps {
  value: ApiProfile;
  onChange: (next: ApiProfile) => void;
  onRun?: () => void;
  presets?: { name: string; profile: Partial<ApiProfile> }[];
  onApplyPreset?: (presetName: string) => void;
}

export default function ApiProfileForm({ value, onChange, onRun, presets, onApplyPreset }: ApiProfileFormProps) {
  const [localBody, setLocalBody] = useState<string>(value.body ? JSON.stringify(value.body, null, 2) : '');

  const update = (patch: Partial<ApiProfile>) => onChange({ ...value, ...patch });

  const updateHeader = (k: string, v: string) => {
    const next = { ...(value.headers || {}) };
    if (k) next[k] = v;
    onChange({ ...value, headers: next });
  };

  const removeHeader = (k: string) => {
    const next = { ...(value.headers || {}) };
    delete next[k];
    onChange({ ...value, headers: next });
  };

  const updateQuery = (k: string, v: string) => {
    const next = { ...(value.query || {}) };
    if (k) next[k] = v;
    onChange({ ...value, query: next });
  };

  const removeQuery = (k: string) => {
    const next = { ...(value.query || {}) };
    delete next[k];
    onChange({ ...value, query: next });
  };

  const parseBody = () => {
    if (!localBody.trim()) return update({ body: undefined });
    try {
      update({ body: JSON.parse(localBody) });
    } catch {
      // keep as string
      update({ body: localBody });
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <input className="input" placeholder="Name (optional)" value={value.name || ''} onChange={(e) => update({ name: e.target.value })} />
        <select className="input" value={value.method} onChange={(e) => update({ method: e.target.value as HttpMethod })}>
          {METHODS.map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select className="input" value={value.auth?.type || 'none'} onChange={(e) => update({ auth: { ...(value.auth || { type: 'none' }), type: e.target.value as AuthType } })}>
          {AUTH_TYPES.map((a) => (
            <option key={a.value} value={a.value}>{a.label}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <input className="input" placeholder="Base URL (https://api.example.com)" value={value.baseUrl} onChange={(e) => update({ baseUrl: e.target.value })} />
        <input className="input" placeholder="Path (/v1/resource)" value={value.path} onChange={(e) => update({ path: e.target.value })} />
      </div>

      {value.auth?.type === 'apiKeyHeader' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="Header Name (default Authorization)" value={value.auth.apiKeyHeaderName || ''} onChange={(e) => update({ auth: { ...(value.auth || { type: 'apiKeyHeader' }), apiKeyHeaderName: e.target.value } })} />
          <input className="input" placeholder="API Key Value" value={value.auth.apiKey || ''} onChange={(e) => update({ auth: { ...(value.auth || { type: 'apiKeyHeader' }), apiKey: e.target.value } })} />
        </div>
      )}

      {value.auth?.type === 'apiKeyQuery' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <input className="input" placeholder="Query Param Name (default api_key)" value={value.auth.apiKeyQueryName || ''} onChange={(e) => update({ auth: { ...(value.auth || { type: 'apiKeyQuery' }), apiKeyQueryName: e.target.value } })} />
          <input className="input" placeholder="API Key Value" value={value.auth.apiKey || ''} onChange={(e) => update({ auth: { ...(value.auth || { type: 'apiKeyQuery' }), apiKey: e.target.value } })} />
        </div>
      )}

      {value.auth?.type === 'bearer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input className="input" placeholder="Bearer Token" value={value.auth.bearerToken || ''} onChange={(e) => update({ auth: { ...(value.auth || { type: 'bearer' }), bearerToken: e.target.value } })} />
        </div>
      )}

      <div>
        <div className="font-medium mb-2">Headers</div>
        <div className="space-y-2">
          {Object.entries(value.headers || {} as Record<string, string>).map(([k, v]) => (
            <div key={k} className="grid grid-cols-12 gap-2">
              <input className="input col-span-5" value={k} onChange={(e) => {
                const next = { ...(value.headers || {}) } as Record<string, string>;
                const val = next[k];
                delete next[k];
                next[e.target.value] = val;
                onChange({ ...value, headers: next });
              }} />
              <input className="input col-span-6" value={v as string} onChange={(e) => updateHeader(k, e.target.value)} />
              <button className="btn col-span-1" onClick={() => removeHeader(k)}>✕</button>
            </div>
          ))}
          <div className="grid grid-cols-12 gap-2">
            <input className="input col-span-5" placeholder="Header name" onBlur={(e) => e.target.value && updateHeader(e.target.value, '')} />
            <div className="col-span-7 text-sm text-gray-500 self-center">Tip: Focus out to add</div>
          </div>
        </div>
      </div>

      <div>
        <div className="font-medium mb-2">Query Params</div>
        <div className="space-y-2">
          {Object.entries(value.query || {} as Record<string, string>).map(([k, v]) => (
            <div key={k} className="grid grid-cols-12 gap-2">
              <input className="input col-span-5" value={k} onChange={(e) => {
                const next = { ...(value.query || {}) } as Record<string, string>;
                const val = next[k];
                delete next[k];
                next[e.target.value] = val;
                onChange({ ...value, query: next });
              }} />
              <input className="input col-span-6" value={v as string} onChange={(e) => updateQuery(k, e.target.value)} />
              <button className="btn col-span-1" onClick={() => removeQuery(k)}>✕</button>
            </div>
          ))}
          <div className="grid grid-cols-12 gap-2">
            <input className="input col-span-5" placeholder="Query name" onBlur={(e) => e.target.value && updateQuery(e.target.value, '')} />
            <div className="col-span-7 text-sm text-gray-500 self-center">Tip: Focus out to add</div>
          </div>
        </div>
      </div>

      {!['GET', 'HEAD'].includes(value.method) && (
        <div>
          <div className="font-medium mb-2">Body (JSON oder Text)</div>
          <textarea className="input min-h-[160px] font-mono" value={localBody} onChange={(e) => setLocalBody(e.target.value)} onBlur={parseBody} placeholder={`{\n  \"example\": true\n}`} />
        </div>
      )}

      <div className="flex items-center gap-2">
        {presets && presets.length > 0 && (
          <select className="input w-64" aria-label="Presets" onChange={(e) => onApplyPreset?.(e.target.value)}>
            <option value="">Preset auswählen…</option>
            {presets.map((p) => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>
        )}
        <div className="flex-1" />
        <button className="btn-primary" onClick={onRun}>Request ausführen</button>
      </div>
    </div>
  );
}
