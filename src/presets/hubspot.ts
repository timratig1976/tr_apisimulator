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
    name: 'HubSpot: Search Contacts by Email',
    profile: {
      name: 'Search Contacts by Email',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/contacts/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      query: {},
      body: {
        filterGroups: [
          { filters: [{ propertyName: 'email', operator: 'EQ', value: 'someone@example.com' }] },
        ],
        properties: ['email', 'firstname', 'lastname'],
        limit: 10,
      },
      auth: { type: 'bearer' },
    },
  },
  {
    name: 'HubSpot: Create Contact',
    profile: {
      name: 'Create Contact',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/contacts',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      query: {},
      body: { properties: { email: 'someone@example.com', firstname: 'Jane', lastname: 'Doe', ext_id: 'ext-123' } },
      auth: { type: 'bearer' },
    },
  },
  {
    name: 'HubSpot: Update Contact (by ID)',
    profile: {
      name: 'Update Contact by ID',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/contacts/{CONTACT_ID}',
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      query: {},
      body: { properties: { firstname: 'Jane', lastname: 'Doe Updated' } },
      auth: { type: 'bearer' },
    },
  },
  {
    name: 'HubSpot: Batch Create Contacts',
    profile: {
      name: 'Batch Create Contacts',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/contacts/batch/create',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      query: {},
      body: {
        inputs: [
          { properties: { email: 'a@example.com', firstname: 'A', lastname: 'Alpha', ext_id: 'ext-a' } },
          { properties: { email: 'b@example.com', firstname: 'B', lastname: 'Beta', ext_id: 'ext-b' } },
        ],
      },
      auth: { type: 'bearer' },
    },
  },
  {
    name: 'HubSpot: Batch Update Contacts',
    profile: {
      name: 'Batch Update Contacts',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/contacts/batch/update',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      query: {},
      body: {
        inputs: [
          { id: '{CONTACT_ID_1}', properties: { firstname: 'Updated A' } },
          { id: '{CONTACT_ID_2}', properties: { firstname: 'Updated B' } },
        ],
      },
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
    name: 'HubSpot: Search Companies by Domain',
    profile: {
      name: 'Search Companies by Domain',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v3/objects/companies/search',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      query: {},
      body: {
        filterGroups: [
          { filters: [{ propertyName: 'domain', operator: 'EQ', value: 'example.com' }] },
        ],
        properties: ['name', 'domain'],
        limit: 10,
      },
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
  {
    name: 'HubSpot: Associate Contact ↔ Company (batch v4)',
    profile: {
      name: 'Associate Contact to Company',
      baseUrl: 'https://api.hubapi.com',
      path: '/crm/v4/associations/contacts/companies/batch/create',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      query: {},
      body: {
        inputs: [
          { from: { id: '{CONTACT_ID}' }, to: { id: '{COMPANY_ID}' }, type: 'contact_to_company' },
        ],
      },
      auth: { type: 'bearer' },
    },
  },
];
