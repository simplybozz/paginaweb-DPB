import { Component, computed, inject, input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Order, OrderStatus } from '../core/models';
import { OrdersService } from '../core/orders.service';
import { AgoPipe, MoneyPipe } from '../core/ui';
import { StatusBadge } from '../shared/status-badge';

type Tab = 'revision' | 'despachar' | 'camino' | 'completados' | 'cerrados' | 'todos';

const TABS: { id: Tab; label: string; statuses: OrderStatus[]; empty: string }[] = [
  { id: 'revision', label: 'Por revisar', statuses: ['revision'], empty: 'No hay comprobantes esperando revisión.' },
  { id: 'despachar', label: 'Por despachar', statuses: ['confirmado'], empty: 'No hay pedidos pagados pendientes de despacho.' },
  { id: 'camino', label: 'En camino / listos', statuses: ['enviado', 'listo'], empty: 'No hay pedidos en camino ni esperando retiro.' },
  { id: 'completados', label: 'Entregados', statuses: ['entregado'], empty: 'Aún no hay pedidos entregados.' },
  { id: 'cerrados', label: 'Rechazados y cancelados', statuses: ['rechazado', 'cancelado'], empty: 'No hay pedidos rechazados ni cancelados.' },
  { id: 'todos', label: 'Todos', statuses: [], empty: 'Todavía no hay pedidos.' },
];

@Component({
  selector: 'app-panel-orders',
  imports: [RouterLink, FormsModule, MoneyPipe, AgoPipe, StatusBadge],
  template: `
    <header class="head">
      <h1>Pedidos</h1>
      <label class="search">
        <i class="ph ph-magnifying-glass"></i>
        <span class="sr-only">Buscar pedido</span>
        <input class="input" type="search" placeholder="Buscar por número, cliente o teléfono" [ngModel]="q() ?? ''" (ngModelChange)="nav({ q: $event || null })" />
      </label>
    </header>

    <div class="tabs" role="tablist">
      @for (t of tabs; track t.id) {
        <button class="tab" role="tab" [class.is-on]="current().id === t.id" [attr.aria-selected]="current().id === t.id" (click)="nav({ tab: t.id })">
          {{ t.label }}
          @if (t.id !== 'todos') {
            <span class="count">{{ countFor(t.statuses) }}</span>
          }
        </button>
      }
    </div>

    @if (current().id === 'revision' && list().length) {
      <p class="tip"><i class="ph ph-lightbulb"></i>Abre cada pedido, compara el comprobante con tu cuenta bancaria y confírmalo o recházalo.</p>
    }

    @if (list().length) {
      <div class="card table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>Pedido</th>
              <th>Cliente</th>
              <th class="hide-md">Entrega</th>
              <th>Estado</th>
              <th class="r">Total</th>
            </tr>
          </thead>
          <tbody>
            @for (o of list(); track o.id) {
              <tr class="is-link" (click)="open(o)" (keydown.enter)="open(o)" tabindex="0">
                <td><strong>#{{ o.number }}</strong><br /><span class="muted sm">{{ o.createdAt | hace }}</span></td>
                <td>{{ o.customerName }}<br /><span class="muted sm">{{ o.customerPhone }}</span></td>
                <td class="hide-md">
                  <span class="deliv"><i class="ph" [class.ph-truck]="o.delivery === 'envio'" [class.ph-storefront]="o.delivery === 'retiro'"></i>
                    {{ o.delivery === 'envio' ? o.address?.province : 'Retiro en tienda' }}</span>
                </td>
                <td><app-status [status]="o.status" [short]="true" /></td>
                <td class="r price">{{ o.total | rd }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <ul class="mobile-list">
        @for (o of list(); track o.id) {
          <li>
            <a class="card" [routerLink]="['/panel/pedidos', o.id]">
              <div class="row">
                <strong>#{{ o.number }} · {{ o.customerName }}</strong>
                <span class="price">{{ o.total | rd }}</span>
              </div>
              <div class="row">
                <app-status [status]="o.status" [short]="true" />
                <span class="muted sm">{{ o.createdAt | hace }} · {{ o.delivery === 'envio' ? 'Envío' : 'Retiro' }}</span>
              </div>
            </a>
          </li>
        }
      </ul>
    } @else {
      <div class="empty card">
        <i class="ph ph-tray"></i>
        <h3>{{ q() ? 'Sin resultados' : 'Nada por aquí' }}</h3>
        <p>{{ q() ? 'No hay pedidos que coincidan con tu búsqueda.' : current().empty }}</p>
      </div>
    }
  `,
  styles: `
    .head {
      display: grid;
      gap: 14px;
      margin-bottom: 18px;
    }
    @media (min-width: 768px) {
      .head {
        grid-template-columns: 1fr minmax(260px, 380px);
        align-items: center;
      }
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 750;
    }
    .search {
      position: relative;
    }
    .search i {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ink-3);
    }
    .search .input {
      padding-left: 40px;
    }
    .tabs {
      margin-bottom: 18px;
    }
    .tip {
      display: flex;
      gap: 8px;
      align-items: center;
      color: var(--ink-2);
      font-size: 0.9rem;
      margin-bottom: 14px;
    }
    .tip i {
      color: var(--accent);
      font-size: 1.2rem;
    }
    .table-wrap {
      overflow: hidden;
    }
    .sm {
      font-size: 0.8125rem;
    }
    .r {
      text-align: right !important;
    }
    .deliv {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      color: var(--ink-2);
    }
    .mobile-list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: none;
      gap: 10px;
    }
    .mobile-list a {
      display: grid;
      gap: 10px;
      padding: 14px 16px;
    }
    .row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    @media (max-width: 719px) {
      .table-wrap {
        display: none;
      }
      .mobile-list {
        display: grid;
      }
    }
    @media (max-width: 1099px) {
      .hide-md {
        display: none;
      }
    }
  `,
})
export class PanelOrders {
  readonly tab = input<string>();
  readonly q = input<string>();
  private readonly orders = inject(OrdersService);
  private readonly router = inject(Router);
  protected readonly tabs = TABS;

  readonly current = computed(() => TABS.find((t) => t.id === this.tab()) ?? (this.orders.pendingReview() ? TABS[0] : TABS[5]));

  readonly list = computed(() => {
    const t = this.current();
    const q = (this.q() ?? '').toLowerCase().replace('#', '').trim();
    return this.orders
      .orders()
      .filter((o) => !t.statuses.length || t.statuses.includes(o.status))
      .filter(
        (o) =>
          !q ||
          String(o.number).includes(q) ||
          o.customerName.toLowerCase().includes(q) ||
          o.customerPhone.replace(/\D/g, '').includes(q.replace(/\D/g, '') || '~'),
      )
      .sort((a, b) =>
        t.id === 'revision' || t.id === 'despachar' ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt),
      );
  });

  countFor(statuses: OrderStatus[]) {
    return this.orders.orders().filter((o) => statuses.includes(o.status)).length;
  }

  nav(params: Record<string, string | null>) {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }

  open(o: Order) {
    this.router.navigate(['/panel/pedidos', o.id]);
  }
}
