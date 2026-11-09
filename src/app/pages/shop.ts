import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CATEGORIES, Category } from '../core/models';
import { ProductsService } from '../core/products.service';
import { SettingsService } from '../core/settings.service';
import { ProductCard } from '../shared/product-card';
import { Reveal } from '../shared/reveal';

type Sort = 'nuevos' | 'menor' | 'mayor' | 'ofertas';

@Component({
  selector: 'app-shop',
  imports: [RouterLink, FormsModule, ProductCard, Reveal],
  template: `
    <div class="wrap">
      <header class="page-head">
        <nav class="crumbs" aria-label="Ruta">
          <a routerLink="/">Inicio</a><span>/</span>
          @if (cat()) {
            <a routerLink="/tienda">Tienda</a><span>/</span><span>{{ catLabel() }}</span>
          } @else {
            <span>Tienda</span>
          }
        </nav>
        <h1 class="display">{{ catLabel() || 'Toda la tienda' }}</h1>
      </header>

      <div class="cat-pills tabs" role="tablist" aria-label="Categorías">
        <a class="tab" routerLink="/tienda" [queryParamsHandling]="'preserve'" [class.is-on]="!cat()">Todo</a>
        @for (c of categories; track c.id) {
          <a class="tab" [routerLink]="['/tienda', c.id]" [queryParamsHandling]="'preserve'" [class.is-on]="cat() === c.id">
            <i class="ph" [class]="'ph ' + c.icon"></i>{{ c.label }}
          </a>
        }
      </div>

      <div class="toolbar">
        <label class="search">
          <i class="ph ph-magnifying-glass"></i>
          <span class="sr-only">Buscar</span>
          <input class="input" type="search" placeholder="Buscar por nombre o marca" [ngModel]="buscar() ?? ''" (ngModelChange)="setQuery({ buscar: $event || null })" />
        </label>
        <button class="btn btn--ghost btn--sm filters-btn" (click)="sheet.set(true)">
          <i class="ph ph-sliders-horizontal"></i> Filtrar
          @if (activeFilters()) {
            <span class="badge badge--accent">{{ activeFilters() }}</span>
          }
        </button>
        <label class="sort">
          <span class="sr-only">Ordenar</span>
          <select class="select" [ngModel]="sort()" (ngModelChange)="setQuery({ orden: $event === 'nuevos' ? null : $event })">
            <option value="nuevos">Lo más nuevo</option>
            <option value="menor">Precio: menor a mayor</option>
            <option value="mayor">Precio: mayor a menor</option>
            <option value="ofertas">Solo ofertas</option>
          </select>
        </label>
      </div>

      <div class="layout">
        <aside class="side" [class.open]="sheet()" aria-label="Filtros">
          <div class="side-head">
            <h2>Filtrar</h2>
            <button class="icon-btn" (click)="sheet.set(false)" aria-label="Cerrar filtros"><i class="ph ph-x"></i></button>
          </div>

          <fieldset>
            <legend>Marca</legend>
            @for (b of brandsInView(); track b) {
              <label class="check">
                <input type="checkbox" [checked]="marca() === b" (change)="setQuery({ marca: marca() === b ? null : b })" />
                {{ b }}
              </label>
            }
          </fieldset>

          @if (sizesInView().length) {
            <fieldset>
              <legend>Talla disponible</legend>
              <div class="sizes">
                @for (s of sizesInView(); track s) {
                  <button type="button" class="size" [class.is-on]="size() === s" (click)="size.set(size() === s ? '' : s)">{{ s }}</button>
                }
              </div>
            </fieldset>
          }

          <fieldset>
            <legend>Disponibilidad</legend>
            <label class="check">
              <input type="checkbox" [checked]="inStock()" (change)="inStock.set(!inStock())" /> Ocultar agotados
            </label>
          </fieldset>

          <div class="side-foot">
            <button class="btn btn--ghost btn--sm" (click)="clear()">Limpiar</button>
            <button class="btn btn--dark btn--sm" (click)="sheet.set(false)">Ver {{ results().length }} productos</button>
          </div>
        </aside>
        @if (sheet()) {
          <div class="side-scrim" (click)="sheet.set(false)"></div>
        }

        <section>
          <p class="muted count">{{ results().length }} {{ results().length === 1 ? 'producto' : 'productos' }}
            @if (marca()) {
              <button class="chip" (click)="setQuery({ marca: null })">{{ marca() }} <i class="ph ph-x"></i></button>
            }
            @if (size()) {
              <button class="chip" (click)="size.set('')">Talla {{ size() }} <i class="ph ph-x"></i></button>
            }
          </p>
          @if (results().length) {
            @for (k of [gridKey()]; track k) {
              <div class="p-grid">
                @for (p of results(); track p.id; let i = $index) {
                  <app-product-card [product]="p" [appReveal]="i < 6 ? i : i % 3" />
                }
              </div>
            }
          } @else {
            <div class="empty card">
              <i class="ph ph-sneaker"></i>
              <h3>No encontramos productos con esos filtros</h3>
              <p>Prueba con otra marca o talla. Si buscas algo específico, escríbenos y te decimos si lo tenemos.</p>
              <button class="btn btn--dark" (click)="clear()">Quitar filtros</button>
            </div>
          }
        </section>
      </div>
    </div>
  `,
  styles: `
    .cat-pills {
      margin-bottom: 16px;
    }
    .tab i {
      font-size: 1.1rem;
    }
    .toolbar {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 10px;
      margin-bottom: 24px;
    }
    .search {
      grid-column: 1 / -1;
      position: relative;
    }
    .search i {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ink-3);
      font-size: 1.15rem;
    }
    .search .input {
      padding-left: 42px;
    }
    .filters-btn {
      height: 48px;
    }
    .sort .select {
      height: 48px;
    }
    @media (min-width: 768px) {
      .toolbar {
        grid-template-columns: 1fr auto auto;
      }
      .search {
        grid-column: auto;
        max-width: 420px;
      }
    }
    @media (min-width: 1024px) {
      .filters-btn {
        display: none;
      }
      .toolbar {
        grid-template-columns: 1fr auto;
      }
    }
    .layout {
      display: grid;
      gap: 32px;
    }
    @media (min-width: 1024px) {
      .layout {
        grid-template-columns: 220px 1fr;
      }
    }
    .side {
      display: none;
    }
    @media (min-width: 1024px) {
      .side {
        display: grid;
        gap: 28px;
        align-content: start;
        position: sticky;
        top: calc(var(--header-h) + 20px);
      }
      .side-head,
      .side-foot {
        display: none !important;
      }
    }
    @media (max-width: 1023px) {
      .side.open {
        display: grid;
        gap: 24px;
        align-content: start;
        position: fixed;
        z-index: 81;
        left: 0;
        right: 0;
        bottom: 0;
        max-height: 85dvh;
        overflow: auto;
        background: var(--surface);
        border-radius: 20px 20px 0 0;
        padding: 16px 20px 0;
        animation: rise var(--t-enter) var(--ease);
      }
      .side-scrim {
        position: fixed;
        inset: 0;
        z-index: 80;
        background: rgb(10 10 10 / 0.5);
      }
    }
    .side-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .side-head h2 {
      font-size: 1.2rem;
    }
    .side-foot {
      position: sticky;
      bottom: 0;
      display: flex;
      gap: 10px;
      justify-content: space-between;
      padding: 14px 0 calc(14px + env(safe-area-inset-bottom));
      background: var(--surface);
      border-top: 1px solid var(--line);
    }
    fieldset {
      border: 0;
      padding: 0;
      margin: 0;
      display: grid;
      gap: 10px;
    }
    legend {
      font-weight: 700;
      font-size: 0.9375rem;
      margin-bottom: 10px;
    }
    .sizes {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .size {
      min-width: 48px;
      height: 40px;
      padding: 0 10px;
      border-radius: var(--r-input);
      border: 1px solid var(--line);
      background: var(--surface);
      font-weight: 600;
      font-size: 0.875rem;
    }
    .size.is-on {
      background: var(--ink);
      color: var(--bg);
      border-color: var(--ink);
    }
    .count {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      margin-bottom: 20px;
      font-size: 0.9375rem;
    }
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 30px;
      padding: 0 12px;
      border-radius: var(--r-pill);
      border: 1px solid var(--line);
      background: var(--surface);
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--ink);
    }
  `,
})
export class Shop {
  // Llegan de la URL (withComponentInputBinding)
  readonly categoria = input<string>();
  readonly marca = input<string>();
  readonly buscar = input<string>();
  readonly orden = input<string>();

  private readonly products = inject(ProductsService);
  private readonly settings = inject(SettingsService);
  private readonly router = inject(Router);

  protected readonly categories = CATEGORIES;
  readonly sheet = signal(false);
  readonly size = signal('');
  readonly inStock = signal(false);

  readonly cat = computed(() => {
    const c = this.categoria();
    return CATEGORIES.some((x) => x.id === c) ? (c as Category) : null;
  });
  readonly catLabel = computed(() => CATEGORIES.find((c) => c.id === this.cat())?.label ?? '');
  readonly sort = computed<Sort>(() => {
    const o = this.orden();
    return o === 'menor' || o === 'mayor' || o === 'ofertas' ? o : 'nuevos';
  });

  private readonly inCategory = computed(() => {
    const c = this.cat();
    return this.products.visible().filter((p) => !c || p.category === c);
  });

  readonly brandsInView = computed(() => {
    const present = new Set(this.inCategory().map((p) => p.brand));
    const ordered = this.settings.settings().brands.map((b) => b.name).filter((b) => present.has(b));
    return [...ordered, ...[...present].filter((b) => !ordered.includes(b))];
  });

  readonly sizesInView = computed(() => {
    const set = new Set<string>();
    this.inCategory().forEach((p) => p.sizes.filter((s) => s.stock > 0).forEach((s) => set.add(s.size)));
    return [...set].sort((a, b) => (parseFloat(a) || 99) - (parseFloat(b) || 99) || a.localeCompare(b));
  });

  readonly activeFilters = computed(() => [this.marca(), this.size(), this.inStock() || ''].filter(Boolean).length);

  readonly results = computed(() => {
    const q = normalize(this.buscar() ?? '');
    const brand = this.marca();
    const size = this.size();
    let list = this.inCategory().filter((p) => {
      if (brand && p.brand !== brand) return false;
      if (q && !normalize(`${p.name} ${p.brand} ${p.category}`).includes(q)) return false;
      if (size && !p.sizes.some((s) => s.size === size && s.stock > 0)) return false;
      if (this.inStock() && !p.sizes.some((s) => s.stock > 0)) return false;
      return true;
    });
    const s = this.sort();
    if (s === 'menor') list = [...list].sort((a, b) => a.price - b.price);
    if (s === 'mayor') list = [...list].sort((a, b) => b.price - a.price);
    if (s === 'ofertas') list = list.filter((p) => !!p.comparePrice && p.comparePrice > p.price);
    return list;
  });

  /** Cambia con cada filtro para que la cuadrícula entre de nuevo con animación. */
  readonly gridKey = computed(() => this.results().map((p) => p.id).join(','));

  setQuery(params: Record<string, string | null>) {
    this.router.navigate([], { queryParams: params, queryParamsHandling: 'merge', replaceUrl: true });
  }

  clear() {
    this.size.set('');
    this.inStock.set(false);
    this.setQuery({ marca: null, buscar: null, orden: null });
  }
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .trim();
}
