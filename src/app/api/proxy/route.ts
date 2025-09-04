import { NextResponse } from 'next/server';
import type { ProxyRequest, ProxyResponse } from '@/types';

export const dynamic = 'force-dynamic';

function toHeaderRecord(headers: Headers): Record<string, string> {
  const out: Record<string, string> = {};
  headers.forEach((value, key) => {
    out[key] = value;
  });
  return out;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as ProxyRequest;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const started = Date.now();

    const forwardHeaders: Record<string, string> = {};
    if (body.headers) {
      for (const [k, v] of Object.entries(body.headers)) {
        if (!k.toLowerCase().startsWith('host')) {
          forwardHeaders[k] = v;
        }
      }
    }

    const res = await fetch(body.url, {
      method: body.method,
      headers: forwardHeaders,
      body: ['GET', 'HEAD'].includes(body.method) ? undefined : (body.body !== undefined ? JSON.stringify(body.body) : undefined),
      signal: controller.signal,
    });

    clearTimeout(timeout);

    const durationMs = Date.now() - started;
    const text = await res.text();
    let data: unknown | undefined = undefined;
    try {
      data = JSON.parse(text);
    } catch {
      // non-json
    }

    const payload: ProxyResponse = {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers: toHeaderRecord(res.headers),
      data,
      rawText: data === undefined ? text : undefined,
      durationMs,
    };

    return NextResponse.json(payload, { status: 200 });
  } catch (error: any) {
    const message = error?.name === 'AbortError' ? 'Request timed out' : (error?.message || 'Unexpected error');
    const payload: ProxyResponse = {
      ok: false,
      status: 0,
      statusText: 'NetworkError',
      headers: {},
      rawText: message,
    };
    return NextResponse.json(payload, { status: 200 });
  }
}
