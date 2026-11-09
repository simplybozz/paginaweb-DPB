import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES, Product } from '../core/models';
import { ProductsService } from '../core/products.service';
import { MoneyPipe, ToastService } from '../core/ui';

@Component({
  selector: 'app-panel-products',
  imports: [RouterLink, FormsModule, MoneyPipe],
  template: `
    <header class="head">
      <div>
        <h1>Productos</h1>
        <p class="muted">{{ products.products().length }} productos · {{ hiddenCount() }} ocultos</p>
      </div>
      <a routerLink="/panel/productos/nuevo" class="btn btn--accent"><i class="ph ph-plus"></i>Nuevo producto</a>
    </header>

    <div class="filters">
      <label class="search">
        <i class="ph ph-magnifying-glass"></i>
        <span class="sr-only">Buscar producto</span>
        <input class="input" type="search" placeholder="Buscar producto o marca" [ngModel]="q()" (ngModelChange)="q.set($event)" name="q" />
      </label>
      <div class="tabs">
        <button class="tab" [class.is-on]="!cat()" (click)="cat.set('')">Todos</button>
        @for (c of categories; track c.id) {
          <button class="tab" [class.is-on]="cat() === c.id" (click)="cat.set(c.id)">{{ c.label }}</button>
        }
        <button class="tab" [class.is-on]="filtro() === 'poco'" (click)="toggleLow()"><i class="ph ph-warning"></i>Poca existencia</button>
      </div>
    </div>

    @if (list().length) {
      <ul class="grid">
        @for (p of list(); track p.id) {
          <li class="card item" [class.off]="!p.active">
            <a [routerLink]="['/panel/productos', p.id]" class="img">
              <img [src]="p.images[0]" [alt]="p.name" loading="lazy" />
              @if (!p.active) {
                <span class="hidden-tag"><i class="ph ph-eye-slash"></i> Oculto</span>
              }
            </a>
            <div class="body">
              <span class="muted sm">{{ p.brand }} · {{ catLabel(p) }}</span>
              <a [routerLink]="['/panel/productos', p.id]" class="name">{{ p.name }}</a>
              <span class="price">{{ p.price | rd }}</span>
              <span class="stock" [class.zero]="stock(p) === 0" [class.low]="stock(p) > 0 && stock(p) <= 5">
                {{ stock(p) === 0 ? 'Agotado' : stock(p) + ' en existencia' }}
              </span>
            </div>
            <div class="foot">
              <label class="switch" [title]="p.active ? 'Visible en la tienda' : 'Oculto en la tienda'">
                <input type="checkbox" [checked]="p.active" (change)="toggle(p)" />
                <span class="track"></span>
                <span class="sm">{{ p.active ? 'Visible' : 'Oculto' }}</span>
              </label>
              <a [routerLink]="['/panel/productos', p.id]" class="btn btn--ghost btn--sm"><i class="ph ph-pencil-simple"></i>Editar</a>
            </div>
          </li>
        }
      </ul>
    } @else {
      <div class="empty card">
        <i class="ph ph-sneaker"></i>
        <h3>No hay productos aquí</h3>
        <p>Publica tu primer producto con fotos, tallas y precio.</p>
        <a routerLink="/panel/productos/nuevo" class="btn btn--dark">Nuevo producto</a>
      </div>
    }
  `,
  styles: `
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
    .filters {
      display: grid;
      gap: 12px;
      margin-bottom: 20px;
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
    .grid {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 14px;
    }
    @media (max-width: 520px) {
      .grid {
        grid-template-columns: 1fr 1fr;
        gap: 10px;
      }
    }
    .item {
      display: grid;
      overflow: hidden;
    }
    .item.off .img img {
      opacity: 0.45;
    }
    .img {
      position: relative;
      aspect-ratio: 1;
      background: var(--surface-2);
    }
    .img img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .hidden-tag {
      position: absolute;
      top: 8px;
      left: 8px;
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 3px 10px;
      border-radius: var(--r-pill);
      background: var(--ink);
      color: var(--bg);
      font-size: 0.75rem;
      font-weight: 650;
    }
    .body {
      display: grid;
      gap: 3px;
      padding: 12px 14px 4px;
    }
    .sm {
      font-size: 0.8rem;
    }
    .name {
      font-weight: 650;
      line-height: 1.3;
      font-size: 0.9375rem;
    }
    .stock {
      font-size: 0.8125rem;
      color: var(--ok);
      font-weight: 600;
    }
    .stock.low {
      color: var(--warn);
    }
    .stock.zero {
      color: var(--danger);
    }
    .foot {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 8px;
      padding: 10px 14px 14px;
      flex-wrap: wrap;
    }
    .switch {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
      position: relative;
    }
    .switch input {
      position: absolute;
      opacity: 0;
    }
    .track {
      width: 38px;
      height: 22px;
      border-radius: var(--r-pill);
      background: var(--line);
      position: relative;
      transition: background var(--t) var(--ease);
    }
    .track::after {
      content: '';
      position: absolute;
      top: 3px;
      left: 3px;
      width: 16px;
      height: 16px;
      border-radius: 50%;
      background: #fff;
      transition: transform var(--t) var(--ease);
    }
    .switch input:checked + .track {
      background: var(--ok);
    }
    .switch input:checked + .track::after {
      transform: translateX(16px);
    }
    .switch input:focus-visible + .track {
      outline: 2px solid var(--accent);
      outline-offset: 2px;
    }
  `,
})
export class PanelProducts {
  readonly filtro = input<string>();
  protected readonly products = inject(ProductsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly categories = CATEGORIES;

  readonly q = signal('');
  readonly cat = signal('');

  readonly hiddenCount = computed(() => this.products.products().filter((p) => !p.active).length);

  readonly list = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.products
      .products()
      .filter((p) => !this.cat() || p.category === this.cat())
      .filter((p) => this.filtro() !== 'poco' || this.stock(p) <= 5)
      .filter((p) => !q || `${p.name} ${p.brand}`.toLowerCase().includes(q))
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  });

  stock(p: Product) {
    return this.products.totalStock(p);
  }

  catLabel(p: Product) {
    return CATEGORIES.find((c) => c.id === p.category)?.label ?? '';
  }

  toggleLow() {
    this.router.navigate([], { queryParams: { filtro: this.filtro() === 'poco' ? null : 'poco' }, replaceUrl: true });
  }

  toggle(p: Product) {
    this.products.setActive(p.id, !p.active);
    this.toast.show(p.active ? `"${p.name}" ya no se ve en la tienda` : `"${p.name}" está visible en la tienda`);
  }
}
