// Display helpers shared by the list and the detail panel.

// Keyed by string so an unexpected severity still gets a readable fallback.
const SEVERITY_LABELS: Record<string, string> = {
  critical: 'Critique',
  high: 'Élevée',
  medium: 'Moyenne',
  low: 'Faible',
};

export function severityLabel(severity: string): string {
  return SEVERITY_LABELS[severity] ?? severity;
}

/** CSS class carrying the severity colours (see styles.css). */
export function severityClass(severity: string): string {
  return severity in SEVERITY_LABELS ? `sev-${severity}` : 'sev-unknown';
}

/** "2026-01-01T00:06:40Z" -> "2026-01-01 00:06:40" (the column says UTC). */
export function displayTime(timestamp: string): string {
  return timestamp.replace('T', ' ').replace('Z', '');
}
