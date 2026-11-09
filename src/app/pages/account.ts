import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ROLE_LABELS } from '../core/models';
import { OrdersService } from '../core/orders.service';
import { DatePipeEs, MoneyPipe, ToastService } from '../core/ui';
import { OrderProgress } from '../shared/order-progress';
import { StatusBadge } from '../shared/status-badge';

@Component({
  selector: 'app-account',
  imports: [RouterLink, FormsModule, MoneyPipe, DatePipeEs, StatusBadge, OrderProgress],
  template: `
    <div class="wrap">
      <header class="page-head head">
        <div>
          <h1 class="display">Hola, {{ firstName() }}</h1>
          <p class="muted">{{ auth.user()?.email }} · {{ roleLabel() }}</p>
        </div>
        <div class="tabs">
          <button class="tab" [class.is-on]="tab() === 'pedidos'" (click)="tab.set('pedidos')"><i class="ph ph-package"></i>Mis pedidos</button>
          <button class="tab" [class.is-on]="tab() === 'datos'" (click)="tab.set('datos')"><i class="ph ph-user"></i>Mis datos</button>
        </div>
      </header>

      @if (tab() === 'pedidos') {
        @if (orders.mine().length) {
          <div class="list">
            @for (o of orders.mine(); track o.id) {
              <a class="order card" [routerLink]="['/mi-cuenta/pedido', o.id]">
                <div class="top">
                  <div>
                    <strong>Pedido #{{ o.number }}</strong>
                    <span class="muted">{{ o.createdAt | fecha }} · {{ o.items.length }} {{ o.items.length === 1 ? 'artículo' : 'artículos' }}</span>
                  </div>
                  <app-status [status]="o.status" />
                </div>
                @if (o.status === 'rechazado') {
                  <div class="notice notice--danger"><i class="ph ph-warning-circle"></i>Necesitamos un comprobante nuevo. Toca para ver el motivo.</div>
                }
                <div class="thumbs">
                  @for (i of o.items.slice(0, 4); track i.productId + i.size) {
                    <img [src]="i.image" [alt]="i.name" />
                  }
                  <span class="total price">{{ o.total | rd }}</span>
                </div>
                <app-order-progress [order]="o" [compact]="true" />
              </a>
            }
          </div>
        } @else {
          <div class="empty card">
            <i class="ph ph-package"></i>
            <h3>Todavía no tienes pedidos</h3>
            <p>Cuando compres, aquí verás el estado de cada pedido.</p>
            <a routerLink="/tienda" class="btn btn--dark">Ir a la tienda</a>
          </div>
        }
      } @else {
        <form class="card card-pad profile" (ngSubmit)="save()">
          <div class="field">
            <label for="n">Nombre</label>
            <input id="n" class="input" [(ngModel)]="name" name="name" />
          </div>
          <div class="field">
            <label for="p">Teléfono / WhatsApp</label>
            <input id="p" class="input" type="tel" [(ngModel)]="phone" name="phone" />
          </div>
          <div class="field">
            <label for="e">Correo</label>
            <input id="e" class="input" [value]="auth.user()?.email" disabled />
            <span class="hint">Para cambiar el correo escríbenos por WhatsApp.</span>
          </div>
          <button class="btn btn--dark" type="submit">Guardar cambios</button>
        </form>
      }
    </div>
  `,
  styles: `
    .head {
      display: grid;
      gap: 20px;
    }
    .head h1 {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
    }
    .list {
      display: grid;
      gap: 14px;
      max-width: 820px;
    }
    .order {
      display: grid;
      gap: 16px;
      padding: 20px;
      transition: border-color var(--t) var(--ease);
    }
    .order:hover {
      border-color: var(--ink-3);
    }
    .top {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 12px;
      flex-wrap: wrap;
    }
    .top > div {
      display: grid;
      gap: 2px;
    }
    .top .muted {
      font-size: 0.875rem;
    }
    .thumbs {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .thumbs img {
      width: 52px;
      height: 52px;
      object-fit: cover;
      border-radius: 10px;
      background: var(--surface-2);
    }
    .total {
      margin-left: auto;
      font-size: 1.1rem;
    }
    .profile {
      display: grid;
      gap: 18px;
      max-width: 520px;
      justify-items: start;
    }
    .profile .field {
      width: 100%;
    }
  `,
})
export class Account {
  protected readonly auth = inject(AuthService);
  protected readonly orders = inject(OrdersService);
  private readonly toast = inject(ToastService);

  readonly tab = signal<'pedidos' | 'datos'>('pedidos');
  name = this.auth.user()?.name ?? '';
  phone = this.auth.user()?.phone ?? '';

  firstName() {
    return this.auth.user()?.name.split(' ')[0] ?? '';
  }

  roleLabel() {
    const r = this.auth.user()?.role;
    return r ? ROLE_LABELS[r] : '';
  }

  save() {
    if (this.name.trim().length < 3) {
      this.toast.error('Escribe tu nombre completo.');
      return;
    }
    this.auth.updateProfile({ name: this.name, phone: this.phone });
    this.toast.show('Datos guardados');
  }
}
