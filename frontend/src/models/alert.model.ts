// Mirror of the rwatch alert contract, as returned by GET /api/alerts.
export type Severity = 'low' | 'medium' | 'high' | 'critical';

export interface StoredAlert {
  id: number;
  timestamp: string;
  type: string;
  severity: Severity;
  // null when the offender's IP is unknown: never inferred from another field.
  source_ip: string | null;
  // Absent when unknown.
  source_mac?: string;
  target?: string;
  // Network-controlled text: rendered with {{ }} only, never as HTML.
  details: string;
  rule_id: string;
}
