import {
  AfterViewInit,
  Component,
  ElementRef,
  computed,
  input,
  output,
  viewChild,
} from '@angular/core';
import type { StoredAlert } from '../alert.model';
import { SeverityBadge } from '../severity-badge/severity-badge';

@Component({
  selector: 'app-alert-detail',
  imports: [SeverityBadge],
  templateUrl: './alert-detail.html',
  styleUrl: './alert-detail.css',
})
export class AlertDetail implements AfterViewInit {
  readonly alert = input.required<StoredAlert>();
  readonly closed = output<void>();

  private readonly dialog = viewChild.required<ElementRef<HTMLDialogElement>>('dialog');

  /** The alert in the rwatch contract format: the console's local id is left out. */
  protected readonly json = computed(() => {
    const { id: _localId, ...contract } = this.alert();
    return JSON.stringify(contract, null, 2);
  });

  ngAfterViewInit(): void {
    // Native modal dialog: focus moves inside, the page behind becomes inert,
    // Escape closes it and focus goes back to the button that opened it.
    this.dialog().nativeElement.showModal();
  }

  protected close(): void {
    this.dialog().nativeElement.close();
  }
}
