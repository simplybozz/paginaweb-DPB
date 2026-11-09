import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CATEGORIES, MOVEMENT_LABELS, MovementReason, Product, SIZE_PRESETS } from '../core/models';
import { ProductsService } from '../core/products.service';
import { AgoPipe, MoneyPipe, ToastService } from '../core/ui';

const LOW = 2;

/**
 * Almacén: el equipo ve las existencias por talla, las sube o baja con + y −,
 * y al guardar todo queda en el historial con el motivo y quién lo hizo.
 */
@Component({
  selector: 'app-panel-inventory',
  imports: [FormsModule, RouterLink, MoneyPipe, AgoPipe],
  template: `
    <header class="head">
      <div>
        <h1>Almacén</h1>
        <p class="muted">Sube o baja existencias por talla. Cada cambio queda anotado con quién lo hizo.</p>
      </div>
      <a routerLink="/panel/productos/nuevo" class="btn btn--ghost"><i class="ph ph-plus"></i>Producto nuevo</a>
    </header>

    <section class="kpis">
      <div class="kpi card">
        <i class="ph ph-stack"></i>
        <span class="muted">Unidades en almacén</span>
        <strong>{{ totals().units }}</strong>
      </div>
      <div class="kpi card">
        <i class="ph ph-coins"></i>
        <span class="muted">Valor del inventario</span>
        <strong>{{ totals().value | rd }}</strong>
      </div>
      <button class="kpi card warn" (click)="alerts.set(!alerts())" [class.is-on]="alerts()">
        <i class="ph ph-warning"></i>
        <span class="muted">Tallas por agotarse</span>
        <strong>{{ totals().low }}</strong>
      </button>
      <button class="kpi card danger" (click)="alerts.set(!alerts())" [class.is-on]="alerts()">
        <i class="ph ph-prohibit"></i>
        <span class="muted">Tallas agotadas</span>
        <strong>{{ totals().out }}</strong>
      </button>
    </section>

    <div class="tabs main-tabs">
      <button class="tab" [class.is-on]="view() === 'stock'" (click)="view.set('stock')"><i class="ph ph-package"></i>Existencias</button>
      <button class="tab" [class.is-on]="view() === 'log'" (click)="view.set('log')">
        <i class="ph ph-clock-counter-clockwise"></i>Historial
        <span class="count">{{ products.movements().length }}</span>
      </button>
    </div>

    @if (view() === 'stock') {
      <div class="filters">
        <label class="search">
          <i class="ph ph-magnifying-glass"></i>
          <span class="sr-only">Buscar</span>
          <input class="input" type="search" placeholder="Buscar producto o marca" [ngModel]="q()" (ngModelChange)="q.set($event)" name="q" />
        </label>
        <div class="tabs">
          <button class="tab" [class.is-on]="!cat()" (click)="cat.set('')">Todo</button>
          @for (c of categories; track c.id) {
            <button class="tab" [class.is-on]="cat() === c.id" (click)="cat.set(c.id)"><i class="ph" [class]="'ph ' + c.icon"></i>{{ c.label }}</button>
          }
          <button class="tab" [class.is-on]="alerts()" (click)="alerts.set(!alerts())"><i class="ph ph-warning"></i>Solo alertas</button>
        </div>
      </div>

      <ul class="rows">
        @for (p of list(); track p.id) {
          <li class="card row">
            <div class="pinfo">
              <img [src]="p.images[0]" [alt]="p.name" loading="lazy" />
              <div>
                <span class="muted sm">{{ p.brand }}</span>
                <a [routerLink]="['/panel/productos', p.id]" class="name">{{ p.name }}</a>
                <span class="sm total">{{ totalOf(p) }} unidades · {{ p.price | rd }}</span>
              </div>
            </div>
            <div class="sizes">
              @for (s of p.sizes; track s.size) {
                <div class="sz" [class.out]="after(p, s.size) === 0" [class.low]="after(p, s.size) > 0 && after(p, s.size) <= low" [class.changed]="delta(p.id, s.size) !== 0">
                  <span class="sz-name">{{ s.size }}</span>
                  <div class="step">
                    <button (click)="bump(p.id, s.size, -1, s.stock)" [disabled]="after(p, s.size) === 0" aria-label="Quitar uno">−</button>
                    <strong>{{ after(p, s.size) }}</strong>
                    <button (click)="bump(p.id, s.size, 1, s.stock)" aria-label="Agregar uno">+</button>
                  </div>
                  @if (delta(p.id, s.size); as d) {
                    <span class="dlt" [class.neg]="d < 0">{{ d > 0 ? '+' + d : d }}</span>
                  }
                </div>
              }
              @if (missing(p).length) {
                <select class="select add-size" (change)="addSize(p, $any($event.target).value); $any($event.target).value = ''" aria-label="Agregar talla">
                  <option value="">+ Talla</option>
                  @for (m of missing(p); track m) {
                    <option [value]="m">{{ m }}</option>
                  }
                </select>
              }
            </div>
          </li>
        } @empty {
          <li class="empty card">
            <i class="ph ph-check-circle"></i>
            <h3>Todo en orden</h3>
            <p>No hay productos que coincidan con el filtro.</p>
          </li>
        }
      </ul>

      @if (pendingCount()) {
        <div class="savebar">
          <div class="sb-info">
            <strong>{{ pendingCount() }} {{ pendingCount() === 1 ? 'cambio' : 'cambios' }} sin guardar</strong>
            <span class="muted sm">{{ pendingUnits() > 0 ? '+' : '' }}{{ pendingUnits() }} unidades en total</span>
          </div>
          <div class="sb-reason">
            <button class="chip" [class.is-on]="reason() === 'entrada'" (click)="reason.set('entrada')"><i class="ph ph-truck"></i>Llegó mercancía</button>
            <button class="chip" [class.is-on]="reason() === 'ajuste'" (click)="reason.set('ajuste')"><i class="ph ph-sliders-horizontal"></i>Ajuste / conteo</button>
          </div>
          <input class="input note" [(ngModel)]="note" name="note" placeholder="Nota (opcional): suplidor, factura, motivo…" />
          <div class="sb-actions">
            <button class="btn btn--ghost btn--sm" (click)="discard()">Descartar</button>
            <button class="btn btn--gold btn--sm" (click)="save()"><i class="ph ph-check"></i>Guardar</button>
          </div>
        </div>
      }
    } @else {
      <div class="tabs log-filter">
        <button class="tab" [class.is-on]="!logReason()" (click)="logReason.set('')">Todo</button>
        @for (r of reasons; track r) {
          <button class="tab" [class.is-on]="logReason() === r" (click)="logReason.set(r)">{{ labels[r] }}</button>
        }
      </div>
      <ul class="log card">
        @for (m of log(); track m.id) {
          <li>
            <img [src]="m.image" alt="" loading="lazy" />
            <div class="lg-main">
              <strong>{{ m.productName }} <span class="muted">· Talla {{ m.size }}</span></strong>
              <span class="muted sm">
                <span class="tag" [class]="'tag tag--' + m.reason">{{ labels[m.reason] }}</span>
                {{ m.by }} · {{ m.at | hace }}@if (m.note) { · {{ m.note }}}
              </span>
            </div>
            <span class="qty" [class.neg]="m.delta < 0">{{ m.delta > 0 ? '+' + m.delta : m.delta }}</span>
          </li>
        } @empty {
          <li class="none muted">Todavía no hay movimientos.</li>
        }
      </ul>
    }
  `,
  styles: `
    :host {
      display: block;
      padding-bottom: 120px;
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      margin-bottom: 18px;
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 750;
    }
    .kpis {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 20px;
    }
    @media (min-width: 900px) {
      .kpis {
        grid-template-columns: repeat(4, minmax(0, 1fr));
      }
    }
    .kpi {
      display: grid;
      gap: 2px;
      padding: 16px;
      text-align: left;
      border: 1px solid var(--line);
      background: var(--surface);
    }
    .kpi i {
      font-size: 1.4rem;
      color: var(--brand-2);
      margin-bottom: 6px;
    }
    .kpi strong {
      font-size: 1.5rem;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }
    .kpi.warn i {
      color: var(--warn);
    }
    .kpi.danger i {
      color: var(--danger);
    }
    .kpi.is-on {
      border-color: var(--gold);
    }
    .main-tabs {
      margin-bottom: 16px;
    }
    .filters {
      display: grid;
      gap: 12px;
      margin-bottom: 16px;
    }
    .search {
      position: relative;
      max-width: 420px;
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
    .rows,
    .log {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }
    .row {
      display: grid;
      gap: 14px;
      padding: 14px;
    }
    @media (min-width: 980px) {
      .row {
        grid-template-columns: 300px minmax(0, 1fr);
        align-items: center;
      }
    }
    .pinfo {
      display: flex;
      gap: 12px;
      align-items: center;
      min-width: 0;
    }
    .pinfo img {
      width: 60px;
      height: 60px;
      border-radius: 12px;
      object-fit: cover;
      flex: none;
      background: var(--surface-2);
    }
    .pinfo div {
      display: grid;
      min-width: 0;
    }
    .name {
      font-weight: 700;
      line-height: 1.25;
    }
    .sm {
      font-size: 0.8rem;
    }
    .total {
      color: var(--ink-2);
    }
    .sizes {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
    .sz {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 4px;
      padding: 6px 6px 8px;
      min-width: 82px;
      border: 1px solid var(--line);
      border-radius: 12px;
      background: var(--surface-2);
      transition:
        border-color var(--t) var(--ease),
        background var(--t) var(--ease);
    }
    .sz-name {
      font-size: 0.72rem;
      font-weight: 700;
      color: var(--ink-3);
      letter-spacing: 0.04em;
    }
    .sz.low {
      border-color: color-mix(in srgb, var(--warn) 55%, transparent);
    }
    .sz.out {
      border-color: color-mix(in srgb, var(--danger) 55%, transparent);
      background: var(--danger-soft);
    }
    .sz.changed {
      border-color: var(--gold);
      background: var(--accent-soft);
    }
    .step {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .step button {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 1px solid var(--line);
      background: var(--surface);
      font-weight: 800;
      line-height: 1;
      display: grid;
      place-items: center;
    }
    .step button:hover:not(:disabled) {
      border-color: var(--brand-2);
      color: var(--brand-2);
    }
    .step button:disabled {
      opacity: 0.35;
      cursor: not-allowed;
    }
    .step strong {
      min-width: 22px;
      text-align: center;
      font-variant-numeric: tabular-nums;
    }
    .dlt {
      position: absolute;
      top: -9px;
      right: -6px;
      padding: 1px 7px;
      border-radius: var(--r-pill);
      background: var(--ok);
      color: #062314;
      font-size: 0.7rem;
      font-weight: 800;
    }
    .dlt.neg {
      background: var(--danger);
      color: #2a0805;
    }
    .add-size {
      width: auto;
      min-width: 92px;
      height: auto;
      align-self: stretch;
      border-style: dashed;
      font-size: 0.82rem;
    }
    .savebar {
      position: fixed;
      z-index: 30;
      left: 50%;
      bottom: 16px;
      transform: translateX(-50%);
      width: min(980px, calc(100vw - 32px));
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 12px;
      padding: 12px 14px;
      border-radius: 18px;
      background: color-mix(in srgb, var(--surface) 92%, transparent);
      backdrop-filter: blur(12px);
      border: 1px solid var(--gold);
      box-shadow: var(--shadow);
      animation: rise var(--t-enter) var(--ease);
    }
    .sb-info {
      display: grid;
    }
    .sb-reason {
      display: flex;
      gap: 6px;
      flex-wrap: wrap;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 7px 12px;
      border-radius: var(--r-pill);
      border: 1px solid var(--line);
      background: var(--surface-2);
      font-size: 0.82rem;
      font-weight: 650;
    }
    .chip.is-on {
      border-color: var(--brand-2);
      background: color-mix(in srgb, var(--brand) 22%, transparent);
    }
    .note {
      flex: 1 1 200px;
      height: 40px;
    }
    .sb-actions {
      display: flex;
      gap: 8px;
      margin-left: auto;
    }
    .log-filter {
      margin-bottom: 12px;
    }
    .log {
      gap: 0;
      padding: 4px 0;
    }
    .log li {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--line);
    }
    .log li:last-child {
      border-bottom: 0;
    }
    .log img {
      width: 44px;
      height: 44px;
      border-radius: 10px;
      object-fit: cover;
      flex: none;
    }
    .lg-main {
      display: grid;
      gap: 3px;
      min-width: 0;
      flex: 1;
    }
    .tag {
      display: inline-block;
      padding: 1px 8px;
      border-radius: var(--r-pill);
      font-weight: 700;
      font-size: 0.72rem;
      margin-right: 4px;
      background: var(--surface-2);
      color: var(--ink-2);
    }
    .tag--entrada {
      background: var(--ok-soft);
      color: var(--ok);
    }
    .tag--venta {
      background: var(--info-soft);
      color: var(--info);
    }
    .tag--cancelacion {
      background: var(--warn-soft);
      color: var(--warn);
    }
    .qty {
      font-weight: 800;
      font-size: 1.1rem;
      color: var(--ok);
      font-variant-numeric: tabular-nums;
    }
    .qty.neg {
      color: var(--danger);
    }
    .none {
      justify-content: center;
    }
  `,
})
export class PanelInventory {
  protected readonly products = inject(ProductsService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly categories = CATEGORIES;
  protected readonly labels = MOVEMENT_LABELS;
  protected readonly reasons = Object.keys(MOVEMENT_LABELS) as MovementReason[];
  protected readonly low = LOW;

  readonly view = signal<'stock' | 'log'>('stock');
  readonly q = signal('');
  readonly cat = signal('');
  readonly alerts = signal(false);
  readonly logReason = signal<MovementReason | ''>('');
  readonly reason = signal<MovementReason>('entrada');
  note = '';

  /** Cambios sin guardar: "productId|talla" → cuánto se suma o resta. */
  private readonly pending = signal<Record<string, number>>({});

  readonly totals = computed(() => {
    let units = 0, value = 0, low = 0, out = 0;
    for (const p of this.products.products()) {
      for (const s of p.sizes) {
        units += s.stock;
        value += s.stock * p.price;
        if (s.stock === 0) out++;
        else if (s.stock <= LOW) low++;
      }
    }
    return { units, value, low, out };
  });

  readonly list = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.products
      .products()
      .filter((p) => !this.cat() || p.category === this.cat())
      .filter((p) => !this.alerts() || p.sizes.some((s) => s.stock <= LOW))
      .filter((p) => !q || `${p.name} ${p.brand}`.toLowerCase().includes(q))
      .sort((a, b) => this.minStock(a) - this.minStock(b) || a.name.localeCompare(b.name));
  });

  readonly log = computed(() => {
    const r = this.logReason();
    return this.products.movements().filter((m) => !r || m.reason === r).slice(0, 120);
  });

  readonly pendingCount = computed(() => Object.values(this.pending()).filter((d) => d !== 0).length);
  readonly pendingUnits = computed(() => Object.values(this.pending()).reduce((s, d) => s + d, 0));

  private minStock(p: Product) {
    return p.sizes.length ? Math.min(...p.sizes.map((s) => s.stock)) : 0;
  }

  totalOf(p: Product) {
    return p.sizes.reduce((s, x) => s + this.after(p, x.size), 0);
  }

  delta(id: string, size: string) {
    return this.pending()[id + '|' + size] ?? 0;
  }

  after(p: Product, size: string) {
    const base = p.sizes.find((s) => s.size === size)?.stock ?? 0;
    return base + this.delta(p.id, size);
  }

  bump(id: string, size: string, by: number, current: number) {
    this.pending.update((m) => {
      const key = id + '|' + size;
      const next = Math.max(-current, (m[key] ?? 0) + by);
      return { ...m, [key]: next };
    });
    // Si sube existencias, lo normal es que llegó mercancía; si baja, es un ajuste.
    if (by < 0 && this.pendingUnits() < 0) this.reason.set('ajuste');
  }

  missing(p: Product) {
    const have = new Set(p.sizes.map((s) => s.size));
    return SIZE_PRESETS[p.category].filter((s) => !have.has(s));
  }

  addSize(p: Product, size: string) {
    if (!size) return;
    this.products.save({ ...p, sizes: [...p.sizes, { size, stock: 0 }] });
    this.toast.show(`Talla ${size} agregada a "${p.name}". Usa + para subir existencias.`, 'info');
  }

  discard() {
    this.pending.set({});
    this.note = '';
  }

  save() {
    const changes = Object.entries(this.pending())
      .filter(([, d]) => d !== 0)
      .map(([k, delta]) => {
        const [productId, size] = k.split('|');
        return { productId, size, delta };
      });
    const n = this.products.adjustStock(changes, this.reason(), this.auth.user()?.name ?? 'Equipo', this.note.trim());
    this.discard();
    this.toast.show(n === 1 ? 'Existencia actualizada' : `${n} tallas actualizadas`);
  }
}
