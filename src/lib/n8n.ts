import type { ApiProfile } from '@/types';
import { buildUrl, applyAuth } from '@/lib/request';

// Builds a minimal n8n HTTP Request node configuration for the given profile
export function buildN8nHttpRequestNode(profile: ApiProfile) {
  const { headers, query } = applyAuth(profile);

  // n8n typically wants URL without query, query separate; we will pass full URL and also provide query object
  const url = buildUrl(profile.baseUrl, profile.path, {});

  const node = {
    parameters: {
      url,
      options: {
        allowUnauthorizedCerts: false,
      },
      sendQuery: Object.keys(query).length > 0,
      queryParametersUi: {
        parameter: Object.entries(query).map(([name, value]) => ({ name, value })),
      },
      sendHeaders: Object.keys(headers).length > 0,
      headerParametersUi: {
        parameter: Object.entries(headers).map(([name, value]) => ({ name, value })),
      },
      ...(profile.method !== 'GET' && profile.method !== 'HEAD'
        ? {
            sendBody: true,
            jsonParameters: true,
            options: {
              // keep options here too
              allowUnauthorizedCerts: false,
            },
            // n8n expects bodyParametersJson as stringified JSON
            bodyParametersJson: JSON.stringify(profile.body ?? {}, null, 2),
          }
        : {}),
    },
    name: profile.name || 'HTTP Request',
    type: 'n8n-nodes-base.httpRequest',
    typeVersion: 4,
    position: [540, 300],
    credentials: {},
    // Method setting
    // n8n uses 'requestMethod' parameter; some versions infer from body presence; set explicitly
    // Put requestMethod at top level parameters
  } as any;

  (node.parameters as any).requestMethod = profile.method;

  return node;
}
