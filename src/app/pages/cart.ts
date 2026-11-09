import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { MoneyPipe } from '../core/ui';

@Component({
  selector: 'app-cart',
  imports: [RouterLink, MoneyPipe],
  template: `
    <div class="wrap">
      <header class="page-head">
        <h1 class="display">Tu carrito</h1>
      </header>

      @if (cart.lines().length) {
        <div class="grid">
          <ul class="lines card">
            @for (l of cart.lines(); track l.productId + l.size) {
              <li>
                <a [routerLink]="['/producto', l.product.slug]"><img [src]="l.product.images[0]" [alt]="l.product.name" /></a>
                <div class="info">
                  <span class="muted brand">{{ l.product.brand }}</span>
                  <a [routerLink]="['/producto', l.product.slug]" class="name">{{ l.product.name }}</a>
                  <span class="muted">Talla {{ l.size }} · {{ l.product.price | rd }} c/u</span>
                  @if (l.qty > l.available) {
                    <span class="warn"><i class="ph ph-warning"></i>
                      {{ l.available ? 'Solo quedan ' + l.available + '. Baja la cantidad.' : 'Se agotó esta talla. Quítalo para continuar.' }}
                    </span>
                  }
                  <div class="controls">
                    <div class="qty">
                      <button class="icon-btn icon-btn--sm" (click)="cart.setQty(l.productId, l.size, l.qty - 1)" aria-label="Quitar uno"><i class="ph ph-minus"></i></button>
                      <span>{{ l.qty }}</span>
                      <button class="icon-btn icon-btn--sm" [disabled]="l.qty >= l.available" (click)="cart.setQty(l.productId, l.size, l.qty + 1)" aria-label="Agregar uno"><i class="ph ph-plus"></i></button>
                    </div>
                    <button class="link remove" (click)="cart.remove(l.productId, l.size)">Quitar</button>
                  </div>
                </div>
                <strong class="price">{{ l.lineTotal | rd }}</strong>
              </li>
            }
          </ul>

          <aside class="summary card card-pad">
            <h2>Resumen</h2>
            <div class="row"><span>Subtotal</span><span class="price">{{ cart.subtotal() | rd }}</span></div>
            <div class="row muted"><span>Envío</span><span>Se calcula al pagar</span></div>
            <div class="row total"><span>Total</span><span class="price">{{ cart.subtotal() | rd }}</span></div>
            <button class="btn btn--accent btn--block" routerLink="/pagar" [disabled]="cart.problems().length > 0">
              Proceder al pago <i class="ph ph-arrow-right"></i>
            </button>
            @if (!auth.isLoggedIn()) {
              <p class="muted small">Te pediremos iniciar sesión o crear tu cuenta para dar seguimiento a tu pedido.</p>
            }
            <div class="pay">
              <i class="ph ph-bank"></i>
              <span>Pagas por transferencia bancaria y subes el comprobante. No necesitas tarjeta.</span>
            </div>
          </aside>
        </div>
      } @else {
        <div class="empty card">
          <i class="ph ph-shopping-bag"></i>
          <h3>Tu carrito está vacío</h3>
          <p>Cuando agregues productos los verás aquí.</p>
          <a routerLink="/tienda" class="btn btn--dark">Ir a la tienda</a>
        </div>
      }
    </div>
  `,
  styles: `
    .grid {
      display: grid;
      gap: 24px;
      align-items: start;
    }
    @media (min-width: 960px) {
      .grid {
        grid-template-columns: 1fr 380px;
      }
      .summary {
        position: sticky;
        top: calc(var(--header-h) + 24px);
      }
    }
    .lines {
      list-style: none;
      margin: 0;
      padding: 0 20px;
    }
    li {
      display: grid;
      grid-template-columns: 96px 1fr auto;
      gap: 16px;
      padding: 20px 0;
      border-bottom: 1px solid var(--line);
    }
    li:last-child {
      border-bottom: 0;
    }
    li img {
      width: 96px;
      height: 116px;
      object-fit: cover;
      border-radius: 12px;
      background: var(--surface-2);
    }
    .info {
      display: grid;
      gap: 3px;
      align-content: start;
      font-size: 0.9375rem;
    }
    .brand {
      font-size: 0.8125rem;
    }
    .name {
      font-weight: 650;
    }
    .warn {
      display: flex;
      gap: 6px;
      align-items: center;
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .controls {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-top: 8px;
    }
    .qty {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 1px solid var(--line);
      border-radius: var(--r-pill);
      padding: 2px;
    }
    .qty span {
      min-width: 22px;
      text-align: center;
      font-weight: 650;
    }
    .remove {
      font-size: 0.875rem;
      color: var(--ink-3);
    }
    .summary {
      display: grid;
      gap: 14px;
    }
    .summary h2 {
      font-size: 1.2rem;
    }
    .row {
      display: flex;
      justify-content: space-between;
    }
    .total {
      font-size: 1.2rem;
      font-weight: 700;
      padding-top: 14px;
      border-top: 1px solid var(--line);
    }
    .small {
      font-size: 0.85rem;
    }
    .pay {
      display: flex;
      gap: 10px;
      font-size: 0.875rem;
      color: var(--ink-2);
      padding: 12px;
      border-radius: var(--r-input);
      background: var(--surface-2);
    }
    .pay i {
      font-size: 1.3rem;
      color: var(--accent);
    }
  `,
})
export class CartPage {
  protected readonly cart = inject(CartService);
  protected readonly auth = inject(AuthService);
}
