import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { STATUS_HELP, STATUS_LABELS } from '../core/models';
import { OrdersService } from '../core/orders.service';
import { SettingsService } from '../core/settings.service';
import { DatePipeEs, MoneyPipe, ToastService } from '../core/ui';
import { ImageDrop } from '../shared/image-drop';
import { OrderProgress } from '../shared/order-progress';
import { StatusBadge } from '../shared/status-badge';

@Component({
  selector: 'app-account-order',
  imports: [RouterLink, FormsModule, MoneyPipe, DatePipeEs, StatusBadge, OrderProgress, ImageDrop],
  template: `
    <div class="wrap">
      @if (order(); as o) {
        <header class="page-head">
          <nav class="crumbs"><a routerLink="/mi-cuenta">Mis pedidos</a><span>/</span><span>#{{ o.number }}</span></nav>
          <div class="title">
            <h1 class="display">Pedido #{{ o.number }}</h1>
            <app-status [status]="o.status" />
          </div>
          <p class="muted">Hecho el {{ o.createdAt | fecha }}</p>
        </header>

        <div class="grid">
          <div class="main">
            <section class="card card-pad state">
              <app-order-progress [order]="o" />
              <p class="help">{{ help() }}</p>
              @if (o.status === 'rechazado') {
                <div class="notice notice--danger">
                  <i class="ph ph-warning-circle"></i>
                  <span><strong>Motivo:</strong> {{ rejectReason() }}</span>
                </div>
                <div class="reup">
                  <h3>Sube un comprobante nuevo</h3>
                  <app-image-drop [value]="newProof()" (changed)="newProof.set($event)" label="Sube la nueva captura" />
                  <div class="field">
                    <label for="r">Número de referencia <span class="muted">(opcional)</span></label>
                    <input id="r" class="input" [(ngModel)]="newRef" name="r" />
                  </div>
                  <button class="btn btn--accent" [disabled]="!newProof()" (click)="resubmit()">Enviar comprobante nuevo</button>
                </div>
              }
              @if (o.status === 'enviado' && o.carrier) {
                <div class="notice notice--info"><i class="ph ph-truck"></i><span>Lo lleva: <strong>{{ o.carrier }}</strong>{{ lastNote() ? '. ' + lastNote() : '' }}</span></div>
              }
            </section>

            <section class="card card-pad">
              <h2>Artículos</h2>
              <ul class="items">
                @for (i of o.items; track i.productId + i.size) {
                  <li>
                    <img [src]="i.image" [alt]="i.name" />
                    <span><strong>{{ i.name }}</strong><br /><span class="muted">Talla {{ i.size }} · Cant. {{ i.qty }}</span></span>
                    <span class="price">{{ i.price * i.qty | rd }}</span>
                  </li>
                }
              </ul>
              <div class="sum">
                <div><span>Subtotal</span><span class="price">{{ o.subtotal | rd }}</span></div>
                <div><span>Envío</span><span class="price">{{ o.shippingFee ? (o.shippingFee | rd) : 'Gratis' }}</span></div>
                <div class="tot"><span>Total</span><span class="price">{{ o.total | rd }}</span></div>
              </div>
            </section>

            <section class="card card-pad">
              <h2>Historial</h2>
              <ol class="hist">
                @for (h of history(); track h.at) {
                  <li>
                    <strong>{{ labels[h.status] }}</strong>
                    <span class="muted">{{ h.at | fecha }}</span>
                    @if (h.note) {
                      <span class="note">{{ h.note }}</span>
                    }
                  </li>
                }
              </ol>
            </section>
          </div>

          <aside class="side">
            <section class="card card-pad">
              <h2>Entrega</h2>
              @if (o.delivery === 'envio' && o.address) {
                <p>{{ o.address.street }}<br />{{ o.address.city }}, {{ o.address.province }}</p>
                @if (o.address.reference) {
                  <p class="muted">Ref.: {{ o.address.reference }}</p>
                }
                <p class="muted">{{ o.shippingZone }}</p>
              } @else {
                <p>Retiro en tienda</p>
                <p class="muted">{{ settings.settings().address }}<br />{{ settings.settings().hours }}</p>
              }
              <p class="muted">Tel.: {{ o.customerPhone }}</p>
            </section>
            <section class="card card-pad">
              <h2>Pago</h2>
              <p>Transferencia a {{ o.bankSnapshot }}</p>
              @if (o.proofReference) {
                <p class="muted">Referencia: {{ o.proofReference }}</p>
              }
              <button type="button" class="proof" (click)="zoom.set(true)">
                <img [src]="o.proofImage" alt="Comprobante enviado" />
                <span>Ver comprobante</span>
              </button>
            </section>
            <div class="actions">
              <a class="btn btn--ghost btn--block" [href]="waLink()" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i> Preguntar por este pedido</a>
              @if (o.status === 'revision' || o.status === 'rechazado') {
                <button class="btn btn--danger btn--block" (click)="confirmCancel.set(true)">Cancelar pedido</button>
              }
            </div>
          </aside>
        </div>

        @if (zoom()) {
          <div class="overlay lightbox" (click)="zoom.set(false)" role="dialog" aria-label="Comprobante">
            <img [src]="o.proofImage" alt="Comprobante enviado" />
            <button class="icon-btn close" aria-label="Cerrar"><i class="ph ph-x"></i></button>
          </div>
        }

        @if (confirmCancel()) {
          <div class="overlay" (click)="confirmCancel.set(false)">
            <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
              <h2>¿Cancelar el pedido #{{ o.number }}?</h2>
              <p class="muted">Se liberan las tallas apartadas. Si ya transferiste, escríbenos por WhatsApp para coordinar el reembolso.</p>
              <div class="modal-actions">
                <button class="btn btn--ghost" (click)="confirmCancel.set(false)">No, volver</button>
                <button class="btn btn--dark" (click)="cancel()">Sí, cancelar</button>
              </div>
            </div>
          </div>
        }
      } @else {
        <div class="empty">
          <i class="ph ph-package"></i>
          <h3>No encontramos este pedido</h3>
          <a routerLink="/mi-cuenta" class="btn btn--dark">Ver mis pedidos</a>
        </div>
      }
    </div>
  `,
  styles: `
    .title {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 14px;
      margin-bottom: 6px;
    }
    .title h1 {
      font-size: clamp(1.8rem, 4vw, 2.6rem);
    }
    .grid {
      display: grid;
      gap: 16px;
      align-items: start;
    }
    @media (min-width: 960px) {
      .grid {
        grid-template-columns: 1fr 340px;
        gap: 24px;
      }
    }
    .main,
    .side {
      display: grid;
      gap: 16px;
    }
    h2 {
      font-size: 1.05rem;
      margin-bottom: 12px;
    }
    .state {
      display: grid;
      gap: 20px;
    }
    .help {
      color: var(--ink-2);
    }
    .reup {
      display: grid;
      gap: 14px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
      justify-items: start;
    }
    .reup > * {
      width: 100%;
    }
    .reup .btn {
      width: auto;
    }
    .reup h3 {
      font-size: 1rem;
    }
    .items {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 14px;
    }
    .items li {
      display: grid;
      grid-template-columns: 60px 1fr auto;
      gap: 14px;
      align-items: center;
      font-size: 0.9375rem;
    }
    .items img {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 10px;
      background: var(--surface-2);
    }
    .sum {
      display: grid;
      gap: 8px;
      margin-top: 18px;
      padding-top: 16px;
      border-top: 1px solid var(--line);
    }
    .sum div {
      display: flex;
      justify-content: space-between;
    }
    .tot {
      font-weight: 700;
      font-size: 1.1rem;
    }
    .hist {
      list-style: none;
      margin: 0;
      padding: 0 0 0 18px;
      border-left: 2px solid var(--line);
      display: grid;
      gap: 16px;
    }
    .hist li {
      display: grid;
      gap: 2px;
      position: relative;
      font-size: 0.9375rem;
    }
    .hist li::before {
      content: '';
      position: absolute;
      left: -25px;
      top: 6px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--ink);
      border: 2px solid var(--surface);
    }
    .hist .muted {
      font-size: 0.85rem;
    }
    .note {
      color: var(--ink-2);
      font-size: 0.875rem;
    }
    .side p {
      font-size: 0.9375rem;
      margin-bottom: 6px;
    }
    .proof {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-top: 10px;
      font-weight: 600;
      font-size: 0.9rem;
      border: 0;
      background: none;
      padding: 0;
      text-decoration: underline;
      text-underline-offset: 3px;
    }
    .proof img {
      width: 56px;
      height: 72px;
      object-fit: cover;
      border-radius: 8px;
      border: 1px solid var(--line);
    }
    .actions {
      display: grid;
      gap: 10px;
    }
  `,
})
export class AccountOrder {
  readonly id = input.required<string>();
  private readonly orders = inject(OrdersService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  protected readonly settings = inject(SettingsService);
  protected readonly labels = STATUS_LABELS;

  readonly confirmCancel = signal(false);
  readonly zoom = signal(false);
  readonly newProof = signal('');
  newRef = '';

  readonly order = computed(() => {
    const o = this.orders.byId(this.id());
    return o && o.userId === this.auth.user()?.id ? o : undefined;
  });
  readonly help = computed(() => (this.order() ? STATUS_HELP[this.order()!.status] : ''));
  readonly history = computed(() => [...(this.order()?.history ?? [])].reverse());
  readonly rejectReason = computed(
    () => [...(this.order()?.history ?? [])].reverse().find((h) => h.status === 'rechazado')?.note ?? '',
  );
  readonly lastNote = computed(() => [...(this.order()?.history ?? [])].reverse().find((h) => h.status === 'enviado')?.note ?? '');
  readonly waLink = computed(
    () => `${this.settings.whatsappLink()}?text=${encodeURIComponent(`Hola, tengo una pregunta sobre mi pedido #${this.order()?.number}.`)}`,
  );

  resubmit() {
    const err = this.orders.resubmitProof(this.id(), this.newProof(), this.newRef);
    if (err) return this.toast.error(err);
    this.newProof.set('');
    this.newRef = '';
    this.toast.show('Comprobante enviado. Lo revisaremos pronto.');
  }

  cancel() {
    const err = this.orders.move(this.id(), 'cancelado', 'Cancelado por el cliente');
    this.confirmCancel.set(false);
    if (err) return this.toast.error(err);
    this.toast.show('Pedido cancelado');
  }
}
