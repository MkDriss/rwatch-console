import { Component, computed, input } from '@angular/core';
import { severityClass, severityLabel } from '../alert-format';

// The written label carries the meaning; the colour only repeats it.
@Component({
  selector: 'app-severity-badge',
  template: '{{ label() }}',
  host: { '[class]': 'cssClass()' },
  styles: `
    :host {
      display: inline-block;
      min-width: 5.5rem;
      padding: 0.125rem 0.5rem;
      font-weight: 600;
      text-align: center;
      color: var(--sev-text);
      background: var(--sev-fill);
      border: 1px solid var(--sev-line);
    }
  `,
})
export class SeverityBadge {
  readonly severity = input.required<string>();
  protected readonly label = computed(() => severityLabel(this.severity()));
  protected readonly cssClass = computed(() => severityClass(this.severity()));
}
