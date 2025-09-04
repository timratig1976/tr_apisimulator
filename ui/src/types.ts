export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';

export type AuthType = 'none' | 'apiKeyHeader' | 'apiKeyQuery' | 'bearer';

export interface ApiProfile {
  name?: string;
  baseUrl: string;
  path: string;
  method: HttpMethod;
  headers: Record<string, string>;
  query: Record<string, string>;
  body?: unknown;
  auth: {
    type: AuthType;
    apiKey?: string; // for apiKeyHeader/apiKeyQuery
    apiKeyHeaderName?: string; // default: 'Authorization' or custom header
    apiKeyQueryName?: string; // default: 'api_key'
    bearerToken?: string; // for bearer
  };
}

export interface ProxyRequest {
  url: string;
  method: HttpMethod;
  headers?: Record<string, string>;
  body?: unknown;
}

export interface ProxyResponse<T = unknown> {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  data?: T;
  rawText?: string;
  durationMs?: number;
}
