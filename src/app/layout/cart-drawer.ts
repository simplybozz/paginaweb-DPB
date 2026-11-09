import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CartService } from '../core/cart.service';
import { MoneyPipe } from '../core/ui';

@Component({
  selector: 'app-cart-drawer',
  imports: [RouterLink, MoneyPipe],
  template: `
    @if (cart.drawerOpen()) {
      <div class="scrim" (click)="close()"></div>
      <aside class="drawer" role="dialog" aria-modal="true" aria-label="Carrito">
        <header>
          <h2>Tu carrito <span class="muted">({{ cart.count() }})</span></h2>
          <button class="icon-btn" (click)="close()" aria-label="Cerrar carrito"><i class="ph ph-x"></i></button>
        </header>

        @if (cart.lines().length) {
          <ul class="lines">
            @for (l of cart.lines(); track l.productId + l.size) {
              <li>
                <img [src]="l.product.images[0]" [alt]="l.product.name" />
                <div class="info">
                  <a [routerLink]="['/producto', l.product.slug]" (click)="close()" class="name">{{ l.product.name }}</a>
                  <span class="muted">Talla {{ l.size }}</span>
                  <div class="qty">
                    <button class="icon-btn icon-btn--sm" (click)="cart.setQty(l.productId, l.size, l.qty - 1)" aria-label="Quitar uno"><i class="ph ph-minus"></i></button>
                    <span>{{ l.qty }}</span>
                    <button class="icon-btn icon-btn--sm" [disabled]="l.qty >= l.available" (click)="cart.setQty(l.productId, l.size, l.qty + 1)" aria-label="Agregar uno"><i class="ph ph-plus"></i></button>
                  </div>
                  @if (l.qty > l.available) {
                    <span class="warn">Solo quedan {{ l.available }}</span>
                  }
                </div>
                <span class="price">{{ l.lineTotal | rd }}</span>
              </li>
            }
          </ul>
          <footer>
            <div class="sum">
              <span>Subtotal</span>
              <strong class="price">{{ cart.subtotal() | rd }}</strong>
            </div>
            <p class="muted small">El envío se calcula al pagar. Pagas por transferencia bancaria.</p>
            <button class="btn btn--accent btn--block" (click)="go('/pagar')" [disabled]="cart.problems().length > 0">
              Proceder al pago <i class="ph ph-arrow-right"></i>
            </button>
            <button class="btn btn--ghost btn--block" (click)="go('/carrito')">Ver carrito</button>
          </footer>
        } @else {
          <div class="empty">
            <i class="ph ph-shopping-bag"></i>
            <h3>Tu carrito está vacío</h3>
            <p>Mira lo nuevo en la tienda y agrega lo que te guste.</p>
            <button class="btn btn--dark" (click)="go('/tienda')">Ir a la tienda</button>
          </div>
        }
      </aside>
    }
  `,
  styles: `
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 70;
      background: rgb(10 10 10 / 0.5);
      animation: fade var(--t-enter) var(--ease);
    }
    .drawer {
      position: fixed;
      z-index: 71;
      top: 0;
      right: 0;
      bottom: 0;
      width: min(440px, 100vw);
      background: var(--surface);
      display: flex;
      flex-direction: column;
      animation: slide var(--t-enter) var(--ease);
    }
    @keyframes slide {
      from {
        transform: translateX(100%);
      }
    }
    header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px 12px 16px 20px;
      border-bottom: 1px solid var(--line);
    }
    h2 {
      font-size: 1.15rem;
    }
    .lines {
      list-style: none;
      margin: 0;
      padding: 8px 20px;
      overflow: auto;
      flex: 1;
    }
    li {
      display: grid;
      grid-template-columns: 76px 1fr auto;
      gap: 14px;
      padding: 14px 0;
      border-bottom: 1px solid var(--line);
    }
    li img {
      width: 76px;
      height: 92px;
      object-fit: cover;
      border-radius: 10px;
      background: var(--surface-2);
    }
    .info {
      display: grid;
      gap: 2px;
      align-content: start;
      font-size: 0.9rem;
    }
    .name {
      font-weight: 600;
      line-height: 1.3;
    }
    .qty {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-top: 6px;
      border: 1px solid var(--line);
      border-radius: var(--r-pill);
      width: max-content;
      padding: 2px;
    }
    .qty span {
      min-width: 20px;
      text-align: center;
      font-weight: 600;
    }
    .warn {
      color: var(--danger);
      font-size: 0.8rem;
    }
    footer {
      padding: 20px;
      border-top: 1px solid var(--line);
      display: grid;
      gap: 10px;
      padding-bottom: calc(20px + env(safe-area-inset-bottom));
    }
    .sum {
      display: flex;
      justify-content: space-between;
      font-size: 1.1rem;
    }
    .small {
      font-size: 0.85rem;
    }
  `,
})
export class CartDrawer {
  protected readonly cart = inject(CartService);
  private readonly router = inject(Router);

  close() {
    this.cart.drawerOpen.set(false);
  }

  go(url: string) {
    this.close();
    this.router.navigateByUrl(url);
  }
}
