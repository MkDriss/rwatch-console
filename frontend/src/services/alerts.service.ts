import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import type { Observable } from 'rxjs';
import type { StoredAlert } from '../models/alert.model';

@Injectable({ providedIn: 'root' })
export class AlertsService {
  private readonly http = inject(HttpClient);

  /** Most recent first (sorted by event time on the backend). */
  list(): Observable<StoredAlert[]> {
    return this.http.get<StoredAlert[]>('/api/alerts');
  }
}
