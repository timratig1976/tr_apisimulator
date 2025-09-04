"use client";
import { useCallback, useMemo, useState } from 'react';
import type { ApiProfile, ProxyResponse } from '@/types';
import ResponseViewer from '@/components/ResponseViewer';
import { mapExternalToHubspot, type MappingRule } from '@/lib/mapping';
import { planUpsertContactByEmail, executeUpsertContactByEmail, type UpsertPlan } from '@/lib/hubspot';

const HUBSPOT_BASE: ApiProfile = {
  name: 'HubSpot Base',
  baseUrl: 'https://api.hubapi.com',
  path: '',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  query: {},
  auth: { type: 'bearer', bearerToken: '' },
  body: undefined,
};

export default function HubspotSimulatorPage() {
  const [base, setBase] = useState<ApiProfile>(HUBSPOT_BASE);
  const [dryRun, setDryRun] = useState(true);

  // Upsert simulator state
  const [externalJson, setExternalJson] = useState<string>('');
  const [emailPath, setEmailPath] = useState<string>('email');
  const [firstNamePath, setFirstNamePath] = useState<string>('firstName');
  const [lastNamePath, setLastNamePath] = useState<string>('lastName');
  const [extIdPath, setExtIdPath] = useState<string>('id');
  const [upsertPlan, setUpsertPlan] = useState<UpsertPlan | undefined>(undefined);
  const [response, setResponse] = useState<ProxyResponse | undefined>(undefined);
  const [loading, setLoading] = useState(false);

  // Dataset quick loader
  const [savedDatasets, setSavedDatasets] = useState<string[]>(() => {
    if (typeof window === 'undefined') return [];
    try {
      const all = JSON.parse(window.localStorage.getItem('datasets') || '{}');
      return Object.keys(all);
    } catch { return []; }
  });
  const [selectedDataset, setSelectedDataset] = useState<string>('');
  const [datasetRows, setDatasetRows] = useState<any[]>([]);

  const loadDataset = useCallback((name: string) => {
    setSelectedDataset(name);
    if (!name) { setDatasetRows([]); return; }
    try {
      const all = JSON.parse(window.localStorage.getItem('datasets') || '{}');
      const ds = all[name];
      setDatasetRows(Array.isArray(ds?.rows) ? ds.rows.slice(0, 20) : []);
    } catch { setDatasetRows([]); }
  }, []);

  const useRow = useCallback((idx: number) => {
    if (!datasetRows[idx]) return;
    setExternalJson(JSON.stringify(datasetRows[idx], null, 2));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [datasetRows]);

  const planUpsert = useCallback(async () => {
    try {
      const ext = JSON.parse(externalJson || '{}');
      const rules: MappingRule[] = [
        { from: emailPath, to: 'email' },
        { from: firstNamePath, to: 'firstname' },
        { from: lastNamePath, to: 'lastname' },
      ];
      if (extIdPath) rules.push({ from: extIdPath, to: 'ext_id' });
      const properties = mapExternalToHubspot(rules, ext);
      const plan = await planUpsertContactByEmail(base, properties);
      setUpsertPlan(plan);
    } catch (e) {
      alert('Invalid external JSON');
    }
  }, [externalJson, emailPath, firstNamePath, lastNamePath, extIdPath, base]);

  const executeUpsert = useCallback(async () => {
    if (!upsertPlan) return;
    setLoading(true);
    try {
      const res = await executeUpsertContactByEmail(base, upsertPlan, dryRun);
      setResponse(res);
    } finally {
      setLoading(false);
    }
  }, [upsertPlan, dryRun, base]);

  return (
    <main className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">HubSpot Upsert Simulator</h1>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={dryRun} onChange={(e) => setDryRun(e.target.checked)} />
          Dry Run
        </label>
      </div>

      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="p-4 border rounded space-y-3">
            <div className="font-medium">HubSpot Auth</div>
            <input className="input" placeholder="Bearer Token" value={base.auth?.type === 'bearer' ? (base.auth.bearerToken || '') : ''} onChange={(e) => setBase({ ...base, auth: { type: 'bearer', bearerToken: e.target.value } })} />
          </div>

          <div className="p-4 border rounded space-y-3">
            <div className="font-medium">Load Sample Row from Saved Dataset</div>
            <div className="flex gap-2">
              <select className="input" value={selectedDataset} onChange={(e) => loadDataset(e.target.value)}>
                <option value="">Choose dataset…</option>
                {savedDatasets.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            {datasetRows.length > 0 && (
              <div className="border rounded">
                <div className="p-2 border-b text-sm bg-gray-50">Rows (first 10)</div>
                <div className="p-2 space-y-2">
                  {datasetRows.slice(0, 10).map((r, i) => (
                    <div key={i} className="border rounded p-2">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-xs text-gray-500">Row {i}</div>
                        <button className="btn" onClick={() => useRow(i)}>Use in Upsert</button>
                      </div>
                      <pre className="text-xs whitespace-pre-wrap">{JSON.stringify(r, null, 2)}</pre>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border rounded space-y-3">
            <div className="font-medium">Upsert Input & Mapping (Contact by Email)</div>
            <textarea className="input min-h-[140px] font-mono" placeholder='{"email":"a@b.com","firstName":"Ada","lastName":"Lovelace","id":"ext-1"}' value={externalJson} onChange={(e) => setExternalJson(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <input className="input" placeholder="Path to email (e.g. email)" value={emailPath} onChange={(e) => setEmailPath(e.target.value)} />
              <input className="input" placeholder="Path to first name (e.g. firstName)" value={firstNamePath} onChange={(e) => setFirstNamePath(e.target.value)} />
              <input className="input" placeholder="Path to last name (e.g. lastName)" value={lastNamePath} onChange={(e) => setLastNamePath(e.target.value)} />
              <input className="input" placeholder="Path to external id (optional, e.g. id)" value={extIdPath} onChange={(e) => setExtIdPath(e.target.value)} />
            </div>
            <div className="flex gap-2">
              <button className="btn" onClick={planUpsert}>Plan Upsert</button>
              <button className="btn-primary" onClick={executeUpsert} disabled={!upsertPlan || loading}>{loading ? 'Läuft…' : 'Execute Upsert'}</button>
            </div>
          </div>
        </div>
        <div>
          <ResponseViewer response={response} />
          {upsertPlan && (
            <div className="mt-4 border rounded">
              <div className="p-2 border-b text-sm bg-gray-50">Upsert Plan</div>
              <pre className="p-3 text-sm whitespace-pre-wrap">{JSON.stringify(upsertPlan, null, 2)}</pre>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
