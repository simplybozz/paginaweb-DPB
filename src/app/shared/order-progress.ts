import { Component, computed, input } from '@angular/core';
import { Order } from '../core/models';

/** Barra de pasos del pedido: revisión, pago, envío/retiro y entrega. */
@Component({
  selector: 'app-order-progress',
  template: `
    @if (order().status === 'cancelado') {
      <p class="cancel"><i class="ph ph-x-circle"></i> Pedido cancelado</p>
    } @else {
      <ol [class.compact]="compact()">
        @for (s of steps(); track s.label; let i = $index) {
          <li [class.done]="i < current()" [class.now]="i === current()" [class.bad]="i === current() && order().status === 'rechazado'">
            <span class="b"><i class="ph" [class]="'ph ' + (i < current() ? 'ph-check' : s.icon)"></i></span>
            <span class="t">{{ i === current() && order().status === 'rechazado' ? 'Comprobante rechazado' : s.label }}</span>
          </li>
        }
      </ol>
    }
  `,
  styles: `
    ol {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      position: relative;
    }
    li {
      display: grid;
      justify-items: center;
      gap: 8px;
      text-align: center;
      position: relative;
    }
    li:not(:first-child)::before {
      content: '';
      position: absolute;
      top: 17px;
      right: 50%;
      width: 100%;
      height: 3px;
      background: var(--line);
      z-index: 0;
    }
    li.done::before,
    li.now::before {
      background: var(--ink);
    }
    .b {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--surface-2);
      color: var(--ink-3);
      position: relative;
      z-index: 1;
      font-size: 1.05rem;
      border: 3px solid var(--surface);
    }
    li.done .b {
      background: var(--ink);
      color: var(--bg);
    }
    li.now .b {
      background: var(--accent);
      color: #fff;
    }
    li.bad .b {
      background: var(--danger);
    }
    .t {
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--ink-3);
      line-height: 1.25;
      max-width: 11ch;
    }
    li.done .t,
    li.now .t {
      color: var(--ink);
    }
    li.bad .t {
      color: var(--danger);
    }
    .compact .t {
      display: none;
    }
    .compact .b {
      width: 28px;
      height: 28px;
      font-size: 0.85rem;
    }
    .compact li:not(:first-child)::before {
      top: 13px;
    }
    .cancel {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--ink-3);
      font-weight: 600;
    }
  `,
})
export class OrderProgress {
  readonly order = input.required<Order>();
  readonly compact = input(false);

  readonly steps = computed(() => {
    const ship = this.order().delivery === 'envio';
    return [
      { label: 'Comprobante en revisión', icon: 'ph-receipt' },
      { label: 'Pago confirmado', icon: 'ph-check-circle' },
      ship ? { label: 'En camino', icon: 'ph-truck' } : { label: 'Listo para retirar', icon: 'ph-storefront' },
      { label: 'Entregado', icon: 'ph-package' },
    ];
  });

  readonly current = computed(() => {
    switch (this.order().status) {
      case 'revision':
      case 'rechazado':
        return 0;
      case 'confirmado':
        return 1;
      case 'enviado':
      case 'listo':
        return 2;
      case 'entregado':
        return 4;
      default:
        return 0;
    }
  });
}
