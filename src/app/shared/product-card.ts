import { Component, computed, inject, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { Product } from '../core/models';
import { ProductsService } from '../core/products.service';
import { MoneyPipe } from '../core/ui';

@Component({
  selector: 'app-product-card',
  imports: [RouterLink, MoneyPipe],
  template: `
    <a [routerLink]="['/producto', product().slug]" class="pc">
      <div class="media">
        <img [src]="product().images[0]" [alt]="product().name" loading="lazy" />
        @if (product().images[1]) {
          <img class="alt" [src]="product().images[1]" alt="" loading="lazy" />
        }
        @if (soldOut()) {
          <span class="tag">Agotado</span>
        } @else if (product().comparePrice) {
          <span class="tag tag--inv">Oferta</span>
        } @else if (product().isNew) {
          <span class="tag">Nuevo</span>
        }
        <span class="quick">Ver producto <i class="ph ph-arrow-right"></i></span>
      </div>
      <div class="meta">
        <span class="brand">{{ product().brand }}</span>
        <h3>{{ product().name }}</h3>
        <p class="price">
          {{ product().price | rd }}
          @if (product().comparePrice) {
            <span class="price-old">{{ product().comparePrice | rd }}</span>
          }
        </p>
      </div>
    </a>
  `,
  styles: `
    :host {
      display: block;
    }
    .pc {
      display: grid;
      gap: 12px;
    }
    .media {
      position: relative;
      aspect-ratio: 4 / 5;
      border-radius: var(--r-card);
      overflow: hidden;
      background: var(--surface-2);
    }
    .media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition:
        transform var(--t-zoom) var(--ease),
        opacity 0.6s var(--ease);
    }
    .media .alt {
      position: absolute;
      inset: 0;
      opacity: 0;
    }
    .pc:hover .media img {
      transform: scale(1.08);
    }
    .tag {
      position: absolute;
      top: 10px;
      left: 10px;
      padding: 5px 8px;
      background: #fff;
      color: #0a0a0a;
      font-size: 0.68rem;
      font-weight: 800;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      line-height: 1;
    }
    .tag--inv {
      background: #0a0a0a;
      color: #fff;
    }
    .quick {
      position: absolute;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 14px;
      background: #0a0a0a;
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
      transform: translateY(101%);
      transition: transform 0.5s var(--ease-in-out);
    }
    .pc:hover .quick {
      transform: none;
    }
    @media (hover: none) {
      .quick {
        display: none;
      }
    }
    .pc:hover .media .alt {
      opacity: 1;
    }
    .brand {
      font-size: 0.72rem;
      color: var(--ink-3);
      font-weight: 700;
      letter-spacing: 0.1em;
      text-transform: uppercase;
    }
    h3 {
      font-size: 0.98rem;
      font-weight: 600;
      line-height: 1.3;
      margin: 2px 0 4px;
    }
    .meta {
      display: grid;
      gap: 2px;
    }
  `,
})
export class ProductCard {
  readonly product = input.required<Product>();
  private readonly products = inject(ProductsService);
  readonly soldOut = computed(() => this.products.totalStock(this.product()) === 0);
}
