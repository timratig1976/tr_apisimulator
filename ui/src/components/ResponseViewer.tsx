"use client";
import { useState } from 'react';
import type { ProxyResponse } from '@/types';
import { JsonView, allExpanded, defaultStyles, darkStyles } from 'react-json-view-lite';
import 'react-json-view-lite/dist/index.css';

export interface ResponseViewerProps {
  response?: ProxyResponse;
}

export default function ResponseViewer({ response }: ResponseViewerProps) {
  const [tab, setTab] = useState<'json' | 'raw' | 'headers'>('json');

  if (!response) return <div className="text-sm text-gray-500">Noch keine Antwort. Führe einen Request aus.</div>;

  const isDark = typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  return (
    <div className="border rounded">
      <div className="flex items-center gap-2 border-b p-2 bg-gray-50">
        <div className="text-sm">Status: <span className={response.ok ? 'text-green-600' : 'text-red-600'}>{response.status} {response.statusText}</span></div>
        {typeof response.durationMs === 'number' && (
          <div className="text-sm text-gray-600">• Dauer: {response.durationMs} ms</div>
        )}
        <div className="flex-1" />
        <div className="flex gap-2 text-sm">
          <button className={`btn ${tab === 'json' ? 'bg-blue-100' : ''}`} onClick={() => setTab('json')}>JSON</button>
          <button className={`btn ${tab === 'raw' ? 'bg-blue-100' : ''}`} onClick={() => setTab('raw')}>Raw</button>
          <button className={`btn ${tab === 'headers' ? 'bg-blue-100' : ''}`} onClick={() => setTab('headers')}>Headers</button>
        </div>
      </div>
      <div className="p-3 overflow-auto max-h-[60vh]">
        {tab === 'json' && (
          response.data !== undefined ? (
            <JsonView data={response.data as any} shouldExpandNode={allExpanded} style={isDark ? darkStyles : defaultStyles} />
          ) : (
            <div className="text-sm text-gray-500">Keine JSON-Daten verfügbar.</div>
          )
        )}
        {tab === 'raw' && (
          <pre className="whitespace-pre-wrap text-sm">{response.rawText || ''}</pre>
        )}
        {tab === 'headers' && (
          <table className="w-full text-sm">
            <tbody>
              {Object.entries(response.headers || {}).map(([k, v]) => (
                <tr key={k}>
                  <td className="font-mono pr-3 align-top text-gray-600">{k}</td>
                  <td className="font-mono break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
