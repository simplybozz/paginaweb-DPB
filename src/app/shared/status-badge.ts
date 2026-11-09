import { Component, computed, input } from '@angular/core';
import { OrderStatus, STATUS_LABELS } from '../core/models';

const KIND: Record<OrderStatus, string> = {
  revision: 'badge--warn',
  rechazado: 'badge--danger',
  confirmado: 'badge--info',
  enviado: 'badge--info',
  listo: 'badge--info',
  entregado: 'badge--ok',
  cancelado: '',
};

const ICON: Record<OrderStatus, string> = {
  revision: 'ph-hourglass-medium',
  rechazado: 'ph-warning-circle',
  confirmado: 'ph-check-circle',
  enviado: 'ph-truck',
  listo: 'ph-storefront',
  entregado: 'ph-package',
  cancelado: 'ph-x-circle',
};

@Component({
  selector: 'app-status',
  template: `<span class="badge" [class]="'badge ' + kind()"><i class="ph" [class]="'ph ' + icon()"></i>{{ label() }}</span>`,
})
export class StatusBadge {
  readonly status = input.required<OrderStatus>();
  readonly short = input(false);
  readonly kind = computed(() => KIND[this.status()]);
  readonly icon = computed(() => ICON[this.status()]);
  readonly label = computed(() => {
    const s = this.status();
    if (this.short() && s === 'revision') return 'Por revisar';
    return STATUS_LABELS[s];
  });
}
