import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastService } from './core/ui';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `
    <router-outlet />
    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts(); track t.id) {
        <div class="toast" [class.toast--error]="t.kind === 'error'" role="status">
          <i class="ph" [class.ph-check-circle]="t.kind === 'ok'" [class.ph-warning-circle]="t.kind === 'error'"
             [class.ph-info]="t.kind === 'info'"></i>
          <span>{{ t.text }}</span>
          <button type="button" class="icon-btn icon-btn--sm" (click)="toast.dismiss(t.id)" aria-label="Cerrar aviso">
            <i class="ph ph-x"></i>
          </button>
        </div>
      }
    </div>
  `,
})
export class App {
  protected readonly toast = inject(ToastService);
}
