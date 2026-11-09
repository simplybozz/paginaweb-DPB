import { Component, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { OrderStatus, STATUS_LABELS } from '../core/models';
import { OrdersService } from '../core/orders.service';
import { SettingsService } from '../core/settings.service';
import { AgoPipe, DatePipeEs, MoneyPipe, ToastService } from '../core/ui';
import { OrderProgress } from '../shared/order-progress';
import { StatusBadge } from '../shared/status-badge';

type Dialog = null | 'confirmar' | 'rechazar' | 'enviar' | 'listo' | 'entregado' | 'cancelar';

const REJECT_REASONS = [
  'El monto transferido no coincide con el total.',
  'La imagen no se ve clara. Sube una captura completa.',
  'No vemos la transferencia en nuestra cuenta todavía.',
  'La transferencia fue a otra cuenta.',
];

const CARRIERS = ['Mensajero de la tienda', 'Vimenpaq', 'Caribe Pack', 'Metro Pac', 'Otro'];

@Component({
  selector: 'app-panel-order-detail',
  imports: [RouterLink, FormsModule, MoneyPipe, DatePipeEs, AgoPipe, StatusBadge, OrderProgress],
  template: `
    @if (order(); as o) {
      <nav class="crumbs"><a routerLink="/panel/pedidos">Pedidos</a><span>/</span><span>#{{ o.number }}</span></nav>
      <header class="head">
        <div>
          <h1>Pedido #{{ o.number }}</h1>
          <p class="muted">{{ o.createdAt | fecha }} ({{ o.createdAt | hace }})</p>
        </div>
        <app-status [status]="o.status" />
      </header>

      <!-- Acción principal según el estado -->
      <section class="action card" [class.urgent]="o.status === 'revision'">
        <div class="what">
          <strong>{{ nextTitle() }}</strong>
          <span>{{ nextHelp() }}</span>
        </div>
        <div class="btns">
          @switch (o.status) {
            @case ('revision') {
              <button class="btn btn--danger" (click)="openDialog('rechazar')"><i class="ph ph-x"></i>Rechazar</button>
              <button class="btn btn--ok" (click)="openDialog('confirmar')"><i class="ph ph-check"></i>Confirmar pago</button>
            }
            @case ('confirmado') {
              @if (o.delivery === 'envio') {
                <button class="btn btn--accent" (click)="openDialog('enviar')"><i class="ph ph-truck"></i>Marcar como enviado</button>
              } @else {
                <button class="btn btn--accent" (click)="openDialog('listo')"><i class="ph ph-storefront"></i>Listo para retirar</button>
              }
            }
            @case ('enviado') {
              <button class="btn btn--ok" (click)="openDialog('entregado')"><i class="ph ph-package"></i>Marcar como entregado</button>
            }
            @case ('listo') {
              <button class="btn btn--ok" (click)="openDialog('entregado')"><i class="ph ph-package"></i>Ya lo retiró</button>
            }
          }
        </div>
      </section>

      <div class="grid">
        <div class="col">
          <section class="card card-pad proof">
            <h2>Comprobante de pago</h2>
            <div class="proof-row">
              <button class="proof-img" (click)="zoom.set(true)" aria-label="Ampliar comprobante">
                <img [src]="o.proofImage" alt="Comprobante enviado por el cliente" />
                <span><i class="ph ph-magnifying-glass-plus"></i> Ampliar</span>
              </button>
              <dl class="check">
                <div class="hl"><dt>Debe decir</dt><dd class="price">{{ o.total | rd }}</dd></div>
                <div><dt>Cuenta elegida</dt><dd>{{ o.bankSnapshot }}</dd></div>
                <div><dt>Referencia</dt><dd>{{ o.proofReference || 'No indicó' }}</dd></div>
                <div><dt>Enviado</dt><dd>{{ proofDate() | fecha }}</dd></div>
              </dl>
            </div>
            @if (o.status === 'revision') {
              <ul class="steps">
                <li><i class="ph ph-check-square"></i>El monto coincide con {{ o.total | rd }}.</li>
                <li><i class="ph ph-check-square"></i>La transferencia llegó a la cuenta de {{ bankName() }}.</li>
                <li><i class="ph ph-check-square"></i>La fecha es reciente y no es un comprobante repetido.</li>
              </ul>
            }
          </section>

          <section class="card card-pad">
            <h2>Artículos ({{ itemCount() }})</h2>
            <ul class="items">
              @for (i of o.items; track i.productId + i.size) {
                <li>
                  <img [src]="i.image" [alt]="i.name" />
                  <span><strong>{{ i.name }}</strong><br /><span class="muted">{{ i.brand }} · Talla <b>{{ i.size }}</b> · Cant. <b>{{ i.qty }}</b></span></span>
                  <span class="price">{{ i.price * i.qty | rd }}</span>
                </li>
              }
            </ul>
            <div class="sum">
              <div><span>Subtotal</span><span class="price">{{ o.subtotal | rd }}</span></div>
              <div><span>Envío {{ o.shippingZone ? '(' + o.shippingZone + ')' : '' }}</span><span class="price">{{ o.shippingFee ? (o.shippingFee | rd) : 'Gratis' }}</span></div>
              <div class="tot"><span>Total</span><span class="price">{{ o.total | rd }}</span></div>
            </div>
          </section>
        </div>

        <div class="col">
          <section class="card card-pad">
            <h2>Cliente</h2>
            <p><strong>{{ o.customerName }}</strong></p>
            <p class="muted">{{ o.customerEmail }}</p>
            <div class="contact">
              <a class="btn btn--ghost btn--sm" [href]="waCustomer()" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i>WhatsApp</a>
              <a class="btn btn--ghost btn--sm" [href]="'tel:' + o.customerPhone"><i class="ph ph-phone"></i>{{ o.customerPhone }}</a>
            </div>
          </section>

          <section class="card card-pad">
            <h2>{{ o.delivery === 'envio' ? 'Enviar a' : 'Retiro en tienda' }}</h2>
            @if (o.delivery === 'envio' && o.address) {
              <p>{{ o.address.street }}</p>
              <p>{{ o.address.city }}, {{ o.address.province }}</p>
              @if (o.address.reference) {
                <p class="muted">Ref.: {{ o.address.reference }}</p>
              }
              <a class="btn btn--ghost btn--sm maps" [href]="mapsLink()" target="_blank" rel="noopener"><i class="ph ph-map-pin"></i>Abrir en Google Maps</a>
              @if (o.carrier) {
                <p class="muted carrier">Lo lleva: {{ o.carrier }}</p>
              }
            } @else {
              <p class="muted">El cliente pasará a buscarlo a la tienda.</p>
            }
          </section>

          <section class="card card-pad">
            <h2>Seguimiento</h2>
            <app-order-progress [order]="o" />
            <ol class="hist">
              @for (h of history(); track $index) {
                <li>
                  <strong>{{ labels[h.status] }}</strong>
                  <span class="muted">{{ h.at | fecha }} · {{ h.by }}</span>
                  @if (h.note) {
                    <span class="note">“{{ h.note }}”</span>
                  }
                </li>
              }
            </ol>
          </section>

          @if (canCancel()) {
            <button class="link cancel" (click)="openDialog('cancelar')">Cancelar este pedido</button>
          }
        </div>
      </div>

      @if (zoom()) {
        <div class="overlay lightbox" (click)="zoom.set(false)" role="dialog" aria-label="Comprobante">
          <img [src]="o.proofImage" alt="Comprobante" />
          <button class="icon-btn close" aria-label="Cerrar"><i class="ph ph-x"></i></button>
        </div>
      }

      @if (dialog()) {
        <div class="overlay" (click)="dialog.set(null)">
          <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
            @switch (dialog()) {
              @case ('confirmar') {
                <h2>¿Confirmar el pago de {{ o.total | rd }}?</h2>
                <p class="muted">El cliente verá que su pago fue confirmado y el pedido pasará a "Por despachar".</p>
              }
              @case ('rechazar') {
                <h2>Rechazar comprobante</h2>
                <p class="muted">Dile al cliente qué pasó. Podrá subir un comprobante nuevo sin hacer otro pedido.</p>
                <div class="reasons">
                  @for (r of reasons; track r) {
                    <button type="button" class="choice" [class.is-on]="note === r" (click)="note = r"><span class="dot"></span>{{ r }}</button>
                  }
                </div>
                <div class="field">
                  <label for="note">Mensaje para el cliente</label>
                  <textarea id="note" class="textarea" [(ngModel)]="note" name="note" placeholder="Escribe el motivo"></textarea>
                </div>
              }
              @case ('enviar') {
                <h2>Marcar como enviado</h2>
                <div class="field">
                  <label for="carrier">¿Quién lo lleva?</label>
                  <select id="carrier" class="select" [(ngModel)]="carrier" name="carrier">
                    @for (c of carriers; track c) {
                      <option [value]="c">{{ c }}</option>
                    }
                  </select>
                </div>
                <div class="field">
                  <label for="snote">Nota para el cliente <span class="muted">(opcional)</span></label>
                  <input id="snote" class="input" [(ngModel)]="note" name="snote" placeholder="Ej. Número de guía 48213, llega mañana en la tarde" />
                </div>
              }
              @case ('listo') {
                <h2>¿El pedido está listo para retirar?</h2>
                <p class="muted">El cliente verá que puede pasar a buscarlo a la tienda.</p>
              }
              @case ('entregado') {
                <h2>¿Confirmas que el cliente recibió el pedido?</h2>
                <p class="muted">El pedido pasará a "Entregados".</p>
              }
              @case ('cancelar') {
                <h2>¿Cancelar el pedido #{{ o.number }}?</h2>
                <p class="muted">Las tallas apartadas vuelven a estar disponibles. Si el cliente ya pagó, recuerda coordinar el reembolso.</p>
                <div class="field">
                  <label for="cnote">Motivo <span class="muted">(opcional)</span></label>
                  <input id="cnote" class="input" [(ngModel)]="note" name="cnote" />
                </div>
              }
            }
            <div class="modal-actions">
              <button class="btn btn--ghost" (click)="dialog.set(null)">Volver</button>
              <button class="btn" [class.btn--ok]="dialog() !== 'rechazar' && dialog() !== 'cancelar'" [class.btn--dark]="dialog() === 'rechazar' || dialog() === 'cancelar'" (click)="apply()">
                {{ confirmLabel() }}
              </button>
            </div>
          </div>
        </div>
      }
    } @else {
      <div class="empty">
        <i class="ph ph-receipt"></i>
        <h3>Pedido no encontrado</h3>
        <a routerLink="/panel/pedidos" class="btn btn--dark">Volver a pedidos</a>
      </div>
    }
  `,
  styles: `
    .head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 750;
    }
    h2 {
      font-size: 1.05rem;
      margin-bottom: 14px;
    }
    .action {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      padding: 16px 18px;
      margin-bottom: 16px;
    }
    .action.urgent {
      border-color: var(--accent);
      background: color-mix(in srgb, var(--accent) 7%, var(--surface));
    }
    .what {
      display: grid;
      gap: 2px;
    }
    .what span {
      color: var(--ink-2);
      font-size: 0.9rem;
    }
    .btns {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .btns:empty {
      display: none;
    }
    @media (max-width: 599px) {
      .btns {
        width: 100%;
      }
      .btns .btn {
        flex: 1;
      }
    }
    .grid {
      display: grid;
      gap: 16px;
      align-items: start;
    }
    @media (min-width: 1100px) {
      .grid {
        grid-template-columns: 1.5fr 1fr;
      }
    }
    .col {
      display: grid;
      gap: 16px;
    }
    .proof-row {
      display: grid;
      gap: 18px;
    }
    @media (min-width: 640px) {
      .proof-row {
        grid-template-columns: 220px 1fr;
      }
    }
    .proof-img {
      position: relative;
      padding: 0;
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
      background: var(--surface-2);
      cursor: zoom-in;
    }
    .proof-img img {
      width: 100%;
      max-height: 340px;
      object-fit: contain;
      background: #fff;
    }
    .proof-img span {
      position: absolute;
      left: 8px;
      bottom: 8px;
      display: inline-flex;
      gap: 4px;
      align-items: center;
      padding: 4px 10px;
      border-radius: var(--r-pill);
      background: rgb(0 0 0 / 0.7);
      color: #fff;
      font-size: 0.8rem;
      font-weight: 600;
    }
    .check {
      margin: 0;
      display: grid;
      align-content: start;
      border: 1px solid var(--line);
      border-radius: 12px;
      overflow: hidden;
    }
    .check div {
      display: grid;
      gap: 2px;
      padding: 12px 14px;
      border-bottom: 1px solid var(--line);
    }
    .check div:last-child {
      border-bottom: 0;
    }
    .check dt {
      font-size: 0.8rem;
      color: var(--ink-3);
    }
    .check dd {
      margin: 0;
      font-weight: 650;
    }
    .check .hl {
      background: var(--accent-soft);
    }
    .check .hl dd {
      font-size: 1.35rem;
    }
    .steps {
      list-style: none;
      margin: 18px 0 0;
      padding: 14px 16px;
      border-radius: 12px;
      background: var(--surface-2);
      display: grid;
      gap: 8px;
      font-size: 0.9rem;
      color: var(--ink-2);
    }
    .steps li {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .steps i {
      color: var(--ink-3);
      font-size: 1.15rem;
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
      grid-template-columns: 64px 1fr auto;
      gap: 14px;
      align-items: center;
      font-size: 0.9375rem;
    }
    .items img {
      width: 64px;
      height: 64px;
      object-fit: cover;
      border-radius: 10px;
    }
    .items b {
      color: var(--ink);
    }
    .sum {
      display: grid;
      gap: 8px;
      margin-top: 16px;
      padding-top: 14px;
      border-top: 1px solid var(--line);
    }
    .sum div {
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .tot {
      font-weight: 700;
      font-size: 1.1rem;
    }
    .contact {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-top: 14px;
    }
    .maps {
      margin-top: 12px;
    }
    .carrier {
      margin-top: 10px;
    }
    .hist {
      list-style: none;
      margin: 24px 0 0;
      padding: 0 0 0 18px;
      border-left: 2px solid var(--line);
      display: grid;
      gap: 14px;
    }
    .hist li {
      display: grid;
      gap: 2px;
      font-size: 0.9rem;
      position: relative;
    }
    .hist li::before {
      content: '';
      position: absolute;
      left: -25px;
      top: 5px;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--ink);
      border: 2px solid var(--surface);
    }
    .hist .muted {
      font-size: 0.8125rem;
    }
    .note {
      color: var(--ink-2);
      font-size: 0.875rem;
    }
    .cancel {
      justify-self: start;
      color: var(--danger);
      font-size: 0.9rem;
    }
    .reasons {
      display: grid;
      gap: 8px;
      margin: 16px 0;
    }
    .reasons .choice {
      padding: 12px 14px;
      font-size: 0.9rem;
      align-items: center;
    }
    .modal .field {
      margin-top: 14px;
    }
  `,
})
export class PanelOrderDetail {
  readonly id = input.required<string>();
  private readonly orders = inject(OrdersService);
  private readonly settings = inject(SettingsService);
  private readonly toast = inject(ToastService);

  protected readonly labels = STATUS_LABELS;
  protected readonly reasons = REJECT_REASONS;
  protected readonly carriers = CARRIERS;

  readonly dialog = signal<Dialog>(null);
  readonly zoom = signal(false);
  note = '';
  carrier = CARRIERS[0];

  readonly order = computed(() => this.orders.byId(this.id()));
  readonly history = computed(() => [...(this.order()?.history ?? [])].reverse());
  readonly itemCount = computed(() => this.order()?.items.reduce((s, i) => s + i.qty, 0) ?? 0);
  readonly proofDate = computed(() => {
    const h = [...(this.order()?.history ?? [])].reverse().find((x) => x.status === 'revision');
    return h?.at ?? this.order()?.createdAt ?? '';
  });
  readonly bankName = computed(() => this.order()?.bankSnapshot.split(' · ')[0] ?? '');
  readonly canCancel = computed(() => {
    const o = this.order();
    return !!o && this.orders.canMove(o, 'cancelado');
  });
  readonly mapsLink = computed(() => {
    const a = this.order()?.address;
    const q = a ? `${a.street}, ${a.city}, ${a.province}, República Dominicana` : '';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}`;
  });
  readonly waCustomer = computed(() => {
    const o = this.order();
    const digits = (o?.customerPhone ?? '').replace(/\D/g, '');
    const text = `Hola ${o?.customerName.split(' ')[0]}, te escribimos de D'Patron Boutique sobre tu pedido #${o?.number}.`;
    return `https://wa.me/${digits.length === 10 ? '1' + digits : digits}?text=${encodeURIComponent(text)}`;
  });

  readonly nextTitle = computed(() => {
    const o = this.order();
    switch (o?.status) {
      case 'revision':
        return 'Revisa el comprobante';
      case 'confirmado':
        return o.delivery === 'envio' ? 'Prepara y envía el pedido' : 'Prepara el pedido para retiro';
      case 'enviado':
        return 'Pedido en camino';
      case 'listo':
        return 'Esperando que el cliente lo retire';
      case 'rechazado':
        return 'Esperando comprobante nuevo';
      case 'entregado':
        return 'Pedido completado';
      default:
        return 'Pedido cancelado';
    }
  });
  readonly nextHelp = computed(() => {
    switch (this.order()?.status) {
      case 'revision':
        return 'Confirma si el dinero llegó a la cuenta o recházalo indicando el motivo.';
      case 'confirmado':
        return 'El pago ya está confirmado. Cuando salga de la tienda, márcalo aquí.';
      case 'enviado':
        return 'Márcalo como entregado cuando el cliente lo reciba.';
      case 'listo':
        return 'Cuando lo recoja, márcalo como entregado.';
      case 'rechazado':
        return 'El cliente ya sabe el motivo. Cuando suba otro comprobante volverá a "Por revisar".';
      case 'entregado':
        return 'No hay nada más que hacer con este pedido.';
      default:
        return 'Las tallas apartadas volvieron al inventario.';
    }
  });
  readonly confirmLabel = computed(() => {
    switch (this.dialog()) {
      case 'confirmar':
        return 'Sí, confirmar pago';
      case 'rechazar':
        return 'Rechazar comprobante';
      case 'enviar':
        return 'Marcar como enviado';
      case 'listo':
        return 'Sí, está listo';
      case 'entregado':
        return 'Sí, fue entregado';
      default:
        return 'Cancelar pedido';
    }
  });

  openDialog(d: Dialog) {
    this.note = '';
    this.carrier = CARRIERS[0];
    this.dialog.set(d);
  }

  apply() {
    const map: Record<Exclude<Dialog, null>, OrderStatus> = {
      confirmar: 'confirmado',
      rechazar: 'rechazado',
      enviar: 'enviado',
      listo: 'listo',
      entregado: 'entregado',
      cancelar: 'cancelado',
    };
    const d = this.dialog();
    if (!d) return;
    const to = map[d];
    const err = this.orders.move(this.id(), to, this.note, d === 'enviar' ? this.carrier : undefined);
    if (err) {
      this.toast.error(err);
      return;
    }
    this.dialog.set(null);
    this.toast.show(`Pedido #${this.order()?.number}: ${STATUS_LABELS[to].toLowerCase()}`);
  }
}
