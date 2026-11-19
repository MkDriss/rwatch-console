import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { displayTime, severityClass } from '../alert-format';
import type { StoredAlert } from '../alert.model';
import { AlertDetail } from '../alert-detail/alert-detail';
import { AlertsService } from '../alerts.service';
import { SeverityBadge } from '../severity-badge/severity-badge';

@Component({
  selector: 'app-alert-list',
  imports: [AlertDetail, SeverityBadge],
  templateUrl: './alert-list.html',
  styleUrl: './alert-list.css',
})
export class AlertList {
  protected readonly alerts = signal<StoredAlert[] | null>(null);
  protected readonly loadFailed = signal(false);
  /** Alert shown in the detail panel, if any. */
  protected readonly selected = signal<StoredAlert | null>(null);

  protected readonly severityClass = severityClass;
  protected readonly displayTime = displayTime;

  constructor() {
    inject(AlertsService)
      .list()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (alerts) => this.alerts.set(alerts),
        error: () => this.loadFailed.set(true),
      });
  }

  protected summary(count: number): string {
    if (count === 0) return 'Aucune alerte';
    return count === 1 ? '1 alerte' : `${count} alertes`;
  }
}
