import { Component, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { OrdersService } from '../core/orders.service';
import { ProductsService } from '../core/products.service';
import { AgoPipe, MoneyPipe } from '../core/ui';
import { StatusBadge } from '../shared/status-badge';

const PAID = ['confirmado', 'enviado', 'listo', 'entregado'];

@Component({
  selector: 'app-dashboard',
  imports: [RouterLink, MoneyPipe, AgoPipe, StatusBadge],
  template: `
    <header class="head">
      <h1>{{ greeting() }}, {{ firstName() }}</h1>
      <p class="muted">Esto es lo que necesita tu atención hoy.</p>
    </header>

    <section class="kpis">
      <a routerLink="/panel/pedidos" [queryParams]="{ tab: 'revision' }" class="kpi card" [class.hot]="orders.pendingReview() > 0">
        <i class="ph ph-receipt"></i>
        <strong>{{ orders.pendingReview() }}</strong>
        <span>Comprobantes por revisar</span>
        <em>Revisar <i class="ph ph-arrow-right"></i></em>
      </a>
      <a routerLink="/panel/pedidos" [queryParams]="{ tab: 'despachar' }" class="kpi card">
        <i class="ph ph-package"></i>
        <strong>{{ orders.toDispatch() }}</strong>
        <span>Pagados por despachar</span>
        <em>Despachar <i class="ph ph-arrow-right"></i></em>
      </a>
      <div class="kpi card">
        <i class="ph ph-currency-circle-dollar"></i>
        <strong class="price">{{ monthSales() | rd }}</strong>
        <span>Ventas confirmadas este mes</span>
        <em class="muted">{{ monthCount() }} pedidos</em>
      </div>
      <a routerLink="/panel/productos" [queryParams]="{ filtro: 'poco' }" class="kpi card">
        <i class="ph ph-warning"></i>
        <strong>{{ lowStock().length }}</strong>
        <span>Productos con poca existencia</span>
        <em>Ver productos <i class="ph ph-arrow-right"></i></em>
      </a>
    </section>

    <div class="cols">
      <section class="card">
        <div class="sec-head">
          <h2>Pedidos que esperan por ti</h2>
          <a routerLink="/panel/pedidos" class="link">Ver todos</a>
        </div>
        @if (todo().length) {
          <ul class="todo">
            @for (o of todo(); track o.id) {
              <li>
                <a [routerLink]="['/panel/pedidos', o.id]">
                  <span class="num">#{{ o.number }}</span>
                  <span class="who"><strong>{{ o.customerName }}</strong><span class="muted">{{ o.createdAt | hace }} · {{ o.delivery === 'envio' ? 'Envío' : 'Retiro' }}</span></span>
                  <app-status [status]="o.status" [short]="true" />
                  <span class="price">{{ o.total | rd }}</span>
                </a>
              </li>
            }
          </ul>
        } @else {
          <div class="empty">
            <i class="ph ph-check-circle"></i>
            <h3>Todo al día</h3>
            <p>No hay comprobantes por revisar ni pedidos por despachar.</p>
          </div>
        }
      </section>

      <section class="card">
        <div class="sec-head">
          <h2>Poca existencia</h2>
          <a routerLink="/panel/productos" class="link">Productos</a>
        </div>
        @if (lowStock().length) {
          <ul class="low">
            @for (p of lowStock().slice(0, 6); track p.id) {
              <li>
                <a [routerLink]="['/panel/productos', p.id]">
                  <img [src]="p.images[0]" alt="" />
                  <span>{{ p.name }}</span>
                  <span class="badge" [class.badge--danger]="p.stock === 0" [class.badge--warn]="p.stock > 0">{{ p.stock === 0 ? 'Agotado' : p.stock + ' disp.' }}</span>
                </a>
              </li>
            }
          </ul>
        } @else {
          <div class="empty"><i class="ph ph-check-circle"></i><p>Todo tiene buena existencia.</p></div>
        }
      </section>
    </div>
  `,
  styles: `
    .head {
      margin-bottom: 24px;
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 750;
      letter-spacing: -0.01em;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (min-width: 1100px) {
      .kpis {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .kpi {
      display: grid;
      gap: 4px;
      padding: 18px;
      align-content: start;
      transition: border-color var(--t) var(--ease);
    }
    a.kpi:hover {
      border-color: var(--ink-3);
    }
    .kpi > i {
      font-size: 1.5rem;
      color: var(--ink-3);
      margin-bottom: 8px;
    }
    .kpi strong {
      font-size: clamp(1.4rem, 3vw, 2rem);
      font-weight: 800;
      line-height: 1.1;
    }
    .kpi span {
      font-size: 0.875rem;
      color: var(--ink-2);
    }
    .kpi em {
      font-style: normal;
      font-size: 0.8125rem;
      font-weight: 650;
      margin-top: 8px;
      display: flex;
      align-items: center;
      gap: 4px;
    }
    .kpi.hot {
      background: var(--accent);
      border-color: var(--accent);
      color: #fff;
    }
    .kpi.hot > i,
    .kpi.hot span {
      color: #fff;
    }
    .cols {
      display: grid;
      gap: 16px;
      align-items: start;
    }
    @media (min-width: 1100px) {
      .cols {
        grid-template-columns: 1.6fr 1fr;
      }
    }
    .sec-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 18px 20px;
      border-bottom: 1px solid var(--line);
    }
    h2 {
      font-size: 1.05rem;
    }
    ul {
      list-style: none;
      margin: 0;
      padding: 6px;
    }
    .todo a {
      display: grid;
      grid-template-columns: auto 1fr auto auto;
      gap: 6px 14px;
      align-items: center;
      padding: 12px 14px;
      border-radius: 10px;
    }
    .todo a:hover,
    .low a:hover {
      background: var(--surface-2);
    }
    .todo .num {
      font-weight: 700;
      color: var(--ink-3);
    }
    .todo .who {
      display: grid;
      min-width: 0;
      font-size: 0.9375rem;
    }
    .todo .who .muted {
      font-size: 0.8125rem;
    }
    .todo .price {
      text-align: right;
      min-width: 90px;
    }
    @media (max-width: 599px) {
      .todo a {
        grid-template-columns: auto 1fr auto;
      }
      .todo app-status {
        grid-column: 2 / 4;
        grid-row: 2;
      }
      .todo .price {
        grid-column: 3;
        grid-row: 1;
      }
    }
    .low a {
      display: grid;
      grid-template-columns: 44px 1fr auto;
      gap: 12px;
      align-items: center;
      padding: 10px;
      border-radius: 10px;
      font-size: 0.9rem;
    }
    .low img {
      width: 44px;
      height: 44px;
      object-fit: cover;
      border-radius: 8px;
    }
    .empty {
      padding: 36px 20px;
    }
  `,
})
export class Dashboard {
  protected readonly orders = inject(OrdersService);
  private readonly products = inject(ProductsService);
  private readonly auth = inject(AuthService);

  readonly firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  readonly greeting = computed(() => {
    const h = new Date().getHours();
    return h < 12 ? 'Buenos días' : h < 19 ? 'Buenas tardes' : 'Buenas noches';
  });

  private readonly monthPaid = computed(() => {
    const now = new Date();
    return this.orders.orders().filter((o) => {
      const d = new Date(o.createdAt);
      return PAID.includes(o.status) && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
  });
  readonly monthSales = computed(() => this.monthPaid().reduce((s, o) => s + o.total, 0));
  readonly monthCount = computed(() => this.monthPaid().length);

  readonly todo = computed(() =>
    this.orders
      .orders()
      .filter((o) => o.status === 'revision' || o.status === 'confirmado')
      .sort((a, b) => (a.status === b.status ? a.createdAt.localeCompare(b.createdAt) : a.status === 'revision' ? -1 : 1))
      .slice(0, 8),
  );

  readonly lowStock = computed(() =>
    this.products
      .products()
      .filter((p) => p.active)
      .map((p) => ({ ...p, stock: this.products.totalStock(p) }))
      .filter((p) => p.stock <= 5)
      .sort((a, b) => a.stock - b.stock),
  );
}
