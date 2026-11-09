import { Component, inject, input, output, signal } from '@angular/core';
import { compressImage, ToastService } from '../core/ui';

/** Zona para subir una imagen (comprobante). Comprime antes de entregarla. */
@Component({
  selector: 'app-image-drop',
  template: `
    @if (value()) {
      <div class="preview">
        <img [src]="value()" alt="Vista previa del comprobante" />
        <div class="actions">
          <span class="ok"><i class="ph-fill ph-check-circle"></i> Imagen lista</span>
          <label class="btn btn--ghost btn--sm">
            Cambiar
            <input type="file" accept="image/*" (change)="pick($event)" class="sr-only" />
          </label>
        </div>
      </div>
    } @else {
      <label
        class="drop"
        [class.is-over]="over()"
        (dragover)="$event.preventDefault(); over.set(true)"
        (dragleave)="over.set(false)"
        (drop)="drop($event)"
      >
        @if (busy()) {
          <i class="ph ph-spinner-gap spin"></i>
          <strong>Procesando imagen…</strong>
        } @else {
          <i class="ph ph-image-square"></i>
          <strong>{{ label() }}</strong>
          <span>Toca para elegir una foto o captura. JPG o PNG.</span>
        }
        <input type="file" accept="image/*" (change)="pick($event)" class="sr-only" />
      </label>
    }
  `,
  styles: `
    .drop {
      display: grid;
      justify-items: center;
      text-align: center;
      gap: 6px;
      padding: 32px 16px;
      border: 2px dashed var(--line);
      border-radius: var(--r-card);
      background: var(--surface);
      cursor: pointer;
      transition:
        border-color var(--t) var(--ease),
        background var(--t) var(--ease);
    }
    .drop:hover,
    .drop.is-over {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 5%, var(--surface));
    }
    .drop i {
      font-size: 2.2rem;
      color: var(--accent);
    }
    .drop span {
      font-size: 0.875rem;
      color: var(--ink-3);
    }
    .preview {
      display: grid;
      grid-template-columns: 96px 1fr;
      gap: 16px;
      align-items: center;
      padding: 12px;
      border: 1px solid var(--line);
      border-radius: var(--r-card);
      background: var(--surface);
    }
    .preview img {
      width: 96px;
      height: 120px;
      object-fit: cover;
      border-radius: 10px;
      background: var(--surface-2);
    }
    .actions {
      display: grid;
      gap: 10px;
      justify-items: start;
    }
    .ok {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--ok);
      font-weight: 600;
    }
    .spin {
      animation: spin 1s linear infinite;
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }
  `,
})
export class ImageDrop {
  readonly value = input<string>('');
  readonly label = input('Sube la foto del comprobante');
  readonly maxSide = input(1400);
  readonly changed = output<string>();

  readonly over = signal(false);
  readonly busy = signal(false);
  private readonly toast = inject(ToastService);

  pick(e: Event) {
    const el = e.target as HTMLInputElement;
    const f = el.files?.[0];
    el.value = '';
    if (f) this.load(f);
  }

  drop(e: DragEvent) {
    e.preventDefault();
    this.over.set(false);
    const f = e.dataTransfer?.files?.[0];
    if (f) this.load(f);
  }

  private async load(f: File) {
    this.busy.set(true);
    try {
      this.changed.emit(await compressImage(f, this.maxSide()));
    } catch (err) {
      this.toast.error((err as Error).message);
    } finally {
      this.busy.set(false);
    }
  }
}
