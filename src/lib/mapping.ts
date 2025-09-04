export type MappingRule = {
  from: string; // external path, dot notation e.g. "user.email"
  to: string; // hubspot property name e.g. "email" or "firstname"
  transform?: (value: any) => any;
};

export function get(obj: any, path: string): any {
  if (!path) return obj;
  return path.split('.').reduce((acc: any, key: string) => (acc ? acc[key] : undefined), obj);
}

export function mapExternalToHubspot(rules: MappingRule[], externalRow: any): Record<string, any> {
  const props: Record<string, any> = {};
  for (const r of rules) {
    const raw = get(externalRow, r.from);
    const val = r.transform ? r.transform(raw) : raw;
    if (val !== undefined) props[r.to] = val;
  }
  return props;
}

export function diffProperties(current: Record<string, any>, next: Record<string, any>) {
  const changes: Record<string, { from: any; to: any }> = {};
  const keys = new Set([...(Object.keys(current || {})), ...(Object.keys(next || {}))]);
  for (const k of keys) {
    const a = current?.[k];
    const b = next?.[k];
    if (JSON.stringify(a) !== JSON.stringify(b)) {
      changes[k] = { from: a, to: b };
    }
  }
  return changes;
}
