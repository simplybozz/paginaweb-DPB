import { Component, computed, effect, inject, input, signal } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { CATEGORIES } from '../core/models';
import { ProductsService } from '../core/products.service';
import { SettingsService } from '../core/settings.service';
import { MoneyPipe, ToastService } from '../core/ui';
import { ProductCard } from '../shared/product-card';
import { Reveal } from '../shared/reveal';

@Component({
  selector: 'app-product',
  imports: [RouterLink, MoneyPipe, ProductCard, Reveal],
  template: `
    @if (product(); as p) {
      <div class="wrap">
        <nav class="crumbs top" aria-label="Ruta">
          <a routerLink="/">Inicio</a><span>/</span>
          <a [routerLink]="['/tienda', p.category]">{{ catLabel() }}</a><span>/</span>
          <span>{{ p.name }}</span>
        </nav>

        <div class="pd">
          <div class="gallery">
            <div class="main">
              @for (src of p.images; track src; let i = $index) {
                <img [src]="src" [alt]="i === 0 ? p.name : ''" [class.is-on]="i === imgIdx()" [attr.aria-hidden]="i !== imgIdx()" />
              }
            </div>
            @if (p.images.length > 1) {
              <div class="thumbs">
                @for (src of p.images; track src; let i = $index) {
                  <button [class.is-on]="i === imgIdx()" (click)="imgIdx.set(i)" [attr.aria-label]="'Ver foto ' + (i + 1)">
                    <img [src]="src" alt="" />
                  </button>
                }
              </div>
            }
          </div>

          <div class="info">
            <a class="brand" routerLink="/tienda" [queryParams]="{ marca: p.brand }">{{ p.brand }}</a>
            <h1>{{ p.name }}</h1>
            <p class="price big">
              {{ p.price | rd }}
              @if (p.comparePrice) {
                <span class="price-old">{{ p.comparePrice | rd }}</span>
                <span class="badge badge--accent">Ahorra {{ p.comparePrice - p.price | rd }}</span>
              }
            </p>

            <div class="sizes-head">
              <span class="label">Elige tu talla</span>
              @if (p.category === 'tenis' || p.category === 'chancletas') {
                <span class="muted small">Tallas US de hombre</span>
              }
            </div>
            <div class="sizes" role="radiogroup" aria-label="Talla">
              @for (s of p.sizes; track s.size) {
                <button
                  type="button"
                  role="radio"
                  class="size"
                  [class.is-on]="size() === s.size"
                  [class.out]="s.stock === 0"
                  [disabled]="s.stock === 0"
                  [attr.aria-checked]="size() === s.size"
                  (click)="size.set(s.size); qty.set(1)"
                >
                  {{ s.size }}
                </button>
              }
            </div>
            @if (selectedStock() > 0 && selectedStock() <= 2) {
              <p class="low"><i class="ph ph-fire"></i> Quedan {{ selectedStock() }} en esta talla</p>
            }
            @if (soldOut()) {
              <div class="notice notice--warn"><i class="ph ph-info"></i>Este producto está agotado por ahora. Escríbenos para saber cuándo vuelve.</div>
            }

            <div class="buy">
              <div class="qty" aria-label="Cantidad">
                <button class="icon-btn icon-btn--sm" (click)="qty.set(qty() - 1)" [disabled]="qty() <= 1" aria-label="Menos"><i class="ph ph-minus"></i></button>
                <span>{{ qty() }}</span>
                <button class="icon-btn icon-btn--sm" (click)="qty.set(qty() + 1)" [disabled]="!size() || qty() >= selectedStock()" aria-label="Más"><i class="ph ph-plus"></i></button>
              </div>
              <button class="btn btn--accent add" [disabled]="soldOut()" (click)="add()">
                <i class="ph ph-shopping-bag"></i> {{ size() ? 'Agregar al carrito' : 'Elige una talla' }}
              </button>
            </div>
            <a class="btn btn--ghost btn--block" [href]="waLink()" target="_blank" rel="noopener">
              <i class="ph ph-whatsapp-logo"></i> Preguntar por WhatsApp
            </a>

            @if (p.description) {
              <p class="desc">{{ p.description }}</p>
            }

            <div class="perks">
              <details open>
                <summary><i class="ph ph-bank"></i> Pago por transferencia</summary>
                <p>Al pagar eliges el banco, transfieres el total y subes la captura del comprobante. Validamos el pago y te avisamos.</p>
              </details>
              <details>
                <summary><i class="ph ph-truck"></i> Envíos y retiro</summary>
                <p>
                  @for (z of settings.settings().zones; track z.id) {
                    {{ z.name }}: {{ z.fee | rd }} ({{ z.eta }}).<br />
                  }
                  También puedes retirar gratis en la tienda.
                </p>
              </details>
            </div>
          </div>
        </div>

        @if (related().length) {
          <section class="related">
            <h2 class="display h-section">También te puede gustar</h2>
            <div class="p-grid p-grid--4">
              @for (r of related(); track r.id; let i = $index) {
                <app-product-card [product]="r" [appReveal]="i" />
              }
            </div>
          </section>
        }
      </div>
    } @else {
      <div class="wrap empty">
        <i class="ph ph-sneaker"></i>
        <h3>No encontramos este producto</h3>
        <p>Puede que ya no esté disponible.</p>
        <a routerLink="/tienda" class="btn btn--dark">Ir a la tienda</a>
      </div>
    }
  `,
  styles: `
    .top {
      padding-top: 24px;
    }
    .pd {
      display: grid;
      gap: 28px;
    }
    @media (min-width: 900px) {
      .pd {
        grid-template-columns: 1.15fr 1fr;
        gap: 56px;
        align-items: start;
      }
      .info {
        position: sticky;
        top: calc(var(--header-h) + 24px);
      }
    }
    .gallery {
      display: grid;
      gap: 10px;
    }
    .main {
      aspect-ratio: 1;
      border-radius: 20px;
      overflow: hidden;
      background: var(--surface-2);
    }
    .main {
      position: relative;
    }
    .main img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      opacity: 0;
      transform: scale(1.04);
      transition:
        opacity 0.6s var(--ease),
        transform var(--t-zoom) var(--ease);
    }
    .main img.is-on {
      opacity: 1;
      transform: none;
    }
    .main:hover img.is-on {
      transform: scale(1.04);
    }
    .thumbs {
      display: flex;
      gap: 8px;
    }
    .thumbs button {
      width: 76px;
      height: 76px;
      padding: 0;
      border-radius: 12px;
      overflow: hidden;
      border: 2px solid transparent;
      background: var(--surface-2);
    }
    .thumbs button {
      opacity: 0.6;
    }
    .thumbs button:hover,
    .thumbs button.is-on {
      opacity: 1;
    }
    .thumbs button.is-on {
      border-color: var(--ink);
    }
    .thumbs img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .info {
      display: grid;
      gap: 16px;
    }
    .brand {
      font-weight: 650;
      color: var(--ink-3);
    }
    .brand:hover {
      color: var(--accent);
    }
    h1 {
      font-size: clamp(1.6rem, 3vw, 2.2rem);
      font-weight: 750;
      letter-spacing: -0.01em;
      margin-top: -8px;
    }
    .big {
      font-size: 1.5rem;
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 6px;
    }
    .big .badge {
      margin-left: 6px;
    }
    .sizes-head {
      display: flex;
      justify-content: space-between;
      margin-top: 8px;
    }
    .small {
      font-size: 0.8125rem;
    }
    .sizes {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(64px, 1fr));
      gap: 8px;
      margin-top: -6px;
    }
    .size {
      height: 48px;
      border-radius: var(--r-input);
      border: 1px solid var(--line);
      background: var(--surface);
      font-weight: 600;
      transition:
        border-color var(--t) var(--ease),
        background var(--t) var(--ease);
    }
    .size:hover:not(:disabled) {
      border-color: var(--ink);
    }
    .size.is-on {
      background: var(--ink);
      color: var(--bg);
      border-color: var(--ink);
    }
    .size.out {
      color: var(--ink-3);
      text-decoration: line-through;
      background: var(--surface-2);
      cursor: not-allowed;
    }
    .low {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--accent);
      font-weight: 600;
      font-size: 0.9rem;
      margin-top: -6px;
    }
    .buy {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 10px;
      margin-top: 4px;
    }
    .qty {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 0 8px;
      border: 1px solid var(--line);
      border-radius: var(--r-pill);
      background: var(--surface);
    }
    .qty span {
      min-width: 22px;
      text-align: center;
      font-weight: 650;
    }
    .add {
      height: 52px;
    }
    .desc {
      color: var(--ink-2);
      padding-top: 8px;
    }
    .perks {
      border-top: 1px solid var(--line);
    }
    details {
      border-bottom: 1px solid var(--line);
      padding: 14px 0;
    }
    summary {
      display: flex;
      align-items: center;
      gap: 10px;
      font-weight: 650;
      cursor: pointer;
      list-style: none;
    }
    summary::-webkit-details-marker {
      display: none;
    }
    summary i {
      font-size: 1.3rem;
      color: var(--accent);
    }
    details p {
      color: var(--ink-2);
      font-size: 0.9375rem;
      margin-top: 10px;
      padding-left: 32px;
    }
    .related {
      padding-top: 88px;
    }
    .related h2 {
      margin-bottom: 28px;
    }
  `,
})
export class ProductPage {
  readonly slug = input.required<string>();

  private readonly products = inject(ProductsService);
  private readonly cart = inject(CartService);
  private readonly toast = inject(ToastService);
  protected readonly settings = inject(SettingsService);

  readonly size = signal('');
  readonly qty = signal(1);
  readonly imgIdx = signal(0);

  readonly product = computed(() => {
    const p = this.products.bySlug(this.slug());
    return p?.active ? p : undefined;
  });
  readonly catLabel = computed(() => CATEGORIES.find((c) => c.id === this.product()?.category)?.label ?? 'Tienda');
  readonly soldOut = computed(() => {
    const p = this.product();
    return !p || this.products.totalStock(p) === 0;
  });
  readonly selectedStock = computed(() => this.product()?.sizes.find((s) => s.size === this.size())?.stock ?? 0);
  readonly related = computed(() => {
    const p = this.product();
    if (!p) return [];
    return this.products
      .visible()
      .filter((x) => x.id !== p.id && (x.category === p.category || x.brand === p.brand))
      .slice(0, 4);
  });
  readonly waLink = computed(() => {
    const p = this.product();
    const text = `Hola, me interesa ${p?.name}${this.size() ? ' en talla ' + this.size() : ''}. ¿Está disponible?`;
    return `${this.settings.whatsappLink()}?text=${encodeURIComponent(text)}`;
  });

  constructor() {
    const title = inject(Title);
    effect(() => {
      const p = this.product();
      this.imgIdx.set(0);
      this.size.set(p?.sizes.length === 1 && p.sizes[0].stock > 0 ? p.sizes[0].size : '');
      this.qty.set(1);
      if (p) title.setTitle(`${p.name} | D'Patron Boutique`);
    });
  }

  add() {
    const p = this.product();
    if (!p) return;
    if (!this.size()) {
      this.toast.show('Elige una talla antes de agregar.', 'info');
      return;
    }
    const inCart = this.cart.lines().find((l) => l.productId === p.id && l.size === this.size())?.qty ?? 0;
    if (inCart + this.qty() > this.selectedStock()) {
      this.toast.error(`Solo quedan ${this.selectedStock()} en talla ${this.size()} y ya tienes ${inCart} en el carrito.`);
      return;
    }
    this.cart.add(p.id, this.size(), this.qty());
    this.cart.drawerOpen.set(true);
  }
}
