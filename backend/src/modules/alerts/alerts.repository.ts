import { createHash } from 'node:crypto';
import { DatabaseSync, type StatementSync } from 'node:sqlite';
import { Injectable, OnModuleDestroy } from '@nestjs/common';
import type { Alert, Severity } from './alert.js';

/** An alert as stored by the console: the contract fields plus a local id. */
export type StoredAlert = Alert & { id: number };

interface AlertRow {
  id: number;
  timestamp: string;
  type: string;
  severity: Severity;
  source_ip: string | null;
  source_mac: string | null;
  target: string | null;
  details: string;
  rule_id: string;
}

// Back to the contract's two ways of saying "unknown": source_ip stays null,
// source_mac and target are omitted.
function toStoredAlert(row: AlertRow): StoredAlert {
  return {
    id: row.id,
    timestamp: row.timestamp,
    type: row.type,
    severity: row.severity,
    source_ip: row.source_ip,
    ...(row.source_mac !== null && { source_mac: row.source_mac }),
    ...(row.target !== null && { target: row.target }),
    details: row.details,
    rule_id: row.rule_id,
  };
}

@Injectable()
export class AlertsRepository implements OnModuleDestroy {
  private readonly db: DatabaseSync;
  private readonly insertStmt: StatementSync;

  constructor() {
    this.db = new DatabaseSync(process.env.DB_PATH ?? 'alerts.db');
    // fingerprint = SHA-256 of the canonical alert. A UNIQUE constraint over
    // the columns themselves would not work: SQLite treats NULLs as distinct,
    // so duplicates with source_ip = null would all be inserted.
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS alerts (
        id          INTEGER PRIMARY KEY,
        fingerprint TEXT NOT NULL UNIQUE,
        timestamp   TEXT NOT NULL,
        type        TEXT NOT NULL,
        severity    TEXT NOT NULL,
        source_ip   TEXT,
        source_mac  TEXT,
        target      TEXT,
        details     TEXT NOT NULL,
        rule_id     TEXT NOT NULL
      )
    `);
    this.insertStmt = this.db.prepare(`
      INSERT INTO alerts
        (fingerprint, timestamp, type, severity, source_ip, source_mac, target, details, rule_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT (fingerprint) DO NOTHING
    `);
  }

  /** Returns true if the alert was new, false if it was a duplicate. */
  insert(alert: Alert): boolean {
    const fingerprint = createHash('sha256')
      .update(JSON.stringify(alert))
      .digest('hex');
    const { changes } = this.insertStmt.run(
      fingerprint,
      alert.timestamp,
      alert.type,
      alert.severity,
      alert.source_ip,
      alert.source_mac ?? null,
      alert.target ?? null,
      alert.details,
      alert.rule_id,
    );
    return Number(changes) === 1;
  }

  /**
   * Most recent first, by event time (capture time), not arrival time.
   * Sorting the TEXT column is correct because every timestamp has the exact
   * same RFC 3339 shape (UTC, "Z", no fractional seconds); id breaks ties.
   */
  findAll(): StoredAlert[] {
    const rows = this.db
      .prepare(
        `SELECT id, timestamp, type, severity, source_ip, source_mac, target, details, rule_id
         FROM alerts ORDER BY timestamp DESC, id DESC`,
      )
      .all() as unknown as AlertRow[];
    return rows.map(toStoredAlert);
  }

  count(): number {
    const row = this.db.prepare('SELECT COUNT(*) AS n FROM alerts').get() as {
      n: number;
    };
    return row.n;
  }

  onModuleDestroy(): void {
    this.db.close();
  }
}
