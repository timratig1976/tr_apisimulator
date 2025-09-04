import type { ApiProfile } from '@/types';

export const hubspotPresets: { name: string; profile: Partial<ApiProfile> }[] = [
  {
    name: 'HubSpot: List Contacts',
    profile: {
      name: 'HubSpot Contacts',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/contacts',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      query: { limit: '10' },
      auth: { type: 'bearer' },
    },
  },
  {
    name: 'HubSpot: List Companies',
    profile: {
      name: 'HubSpot Companies',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/companies',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      query: { limit: '10' },
      auth: { type: 'bearer' },
    },
  },
  {
    name: 'HubSpot: List Deals',
    profile: {
      name: 'HubSpot Deals',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/deals',
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      query: { limit: '10' },
      auth: { type: 'bearer' },
    },
  },
];
