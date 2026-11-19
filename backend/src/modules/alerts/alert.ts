import { isIP } from 'node:net';

// Alert contract defined by rwatch. This console implements it and never
// reinterprets it: any change is decided on the rwatch side.

export const SEVERITIES = ['low', 'medium', 'high', 'critical'] as const;
export type Severity = (typeof SEVERITIES)[number];

export interface Alert {
  timestamp: string;
  type: string;
  severity: Severity;
  // Always present; null when the offender's IP is unknown.
  source_ip: string | null;
  // Absent (never null) when unknown.
  source_mac?: string;
  target?: string;
  // Text coming from the network, possibly attacker-controlled.
  details: string;
  rule_id: string;
}

const FIELDS: readonly string[] = [
  'timestamp',
  'type',
  'severity',
  'source_ip',
  'source_mac',
  'target',
  'details',
  'rule_id',
];

// RFC 3339, UTC, to the second: exactly what rwatch emits.
const TIMESTAMP_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const MAC_RE = /^[0-9a-f]{2}(:[0-9a-f]{2}){5}$/i;

export type ParseResult =
  { ok: true; alert: Alert } | { ok: false; errors: string[] };

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.length > 0;
}

function isRealUtcSecond(v: string): boolean {
  // Rejects well-formed but impossible dates such as 2026-02-30T00:00:00Z.
  const ms = Date.parse(v);
  return (
    !Number.isNaN(ms) && new Date(ms).toISOString() === v.replace('Z', '.000Z')
  );
}

export function parseAlert(input: unknown): ParseResult {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, errors: ['body must be a JSON object'] };
  }
  const o = input as Record<string, unknown>;
  const has = (k: string) => Object.prototype.hasOwnProperty.call(o, k);
  const errors: string[] = [];

  for (const key of Object.keys(o)) {
    if (!FIELDS.includes(key)) errors.push(`unknown field: ${key}`);
  }

  const {
    timestamp,
    type,
    severity,
    source_ip,
    source_mac,
    target,
    details,
    rule_id,
  } = o;

  if (
    typeof timestamp !== 'string' ||
    !TIMESTAMP_RE.test(timestamp) ||
    !isRealUtcSecond(timestamp)
  ) {
    errors.push(
      'timestamp must be RFC 3339, UTC, to the second (YYYY-MM-DDTHH:MM:SSZ)',
    );
  }
  // type and rule_id: any non-empty string. Unknown values are accepted on
  // purpose: new rwatch rules arrive without notice.
  if (!isNonEmptyString(type)) errors.push('type must be a non-empty string');
  if (!SEVERITIES.includes(severity as Severity)) {
    errors.push(`severity must be one of: ${SEVERITIES.join(', ')}`);
  }
  if (!has('source_ip')) {
    errors.push('source_ip is required (null when unknown)');
  } else if (
    source_ip !== null &&
    (typeof source_ip !== 'string' || isIP(source_ip) === 0)
  ) {
    errors.push('source_ip must be an IP address or null');
  }
  if (
    has('source_mac') &&
    (typeof source_mac !== 'string' || !MAC_RE.test(source_mac))
  ) {
    errors.push(
      'source_mac must be a MAC address (omit the field when unknown)',
    );
  }
  if (has('target') && !isNonEmptyString(target)) {
    errors.push(
      'target must be a non-empty string (omit the field when unknown)',
    );
  }
  if (!isNonEmptyString(details))
    errors.push('details must be a non-empty string');
  if (!isNonEmptyString(rule_id))
    errors.push('rule_id must be a non-empty string');

  if (errors.length > 0) return { ok: false, errors };

  // Rebuilt in contract order with known fields only: this object is also
  // the canonical form used for deduplication.
  const alert: Alert = {
    timestamp: timestamp as string,
    type: type as string,
    severity: severity as Severity,
    source_ip: source_ip as string | null,
    ...(has('source_mac') && { source_mac: source_mac as string }),
    ...(has('target') && { target: target as string }),
    details: details as string,
    rule_id: rule_id as string,
  };
  return { ok: true, alert };
}
