import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { StorageFullError } from '../core/db.service';
import { Order } from '../core/models';
import { OrdersService } from '../core/orders.service';
import { SettingsService } from '../core/settings.service';
import { DR_PROVINCES, MoneyPipe, ToastService, formatMoney } from '../core/ui';
import { ImageDrop } from '../shared/image-drop';

@Component({
  selector: 'app-checkout',
  imports: [FormsModule, RouterLink, MoneyPipe, ImageDrop],
  template: `
    <div class="wrap">
      @if (done(); as o) {
        <section class="success card card-pad">
          <span class="ok-icon"><i class="ph-fill ph-check-circle"></i></span>
          <h1 class="display">Pedido recibido</h1>
          <p class="lead">Tu pedido <strong>#{{ o.number }}</strong> está en revisión. Cuando validemos la transferencia te avisamos y lo preparamos.</p>
          <div class="next">
            <div><i class="ph ph-hourglass-medium"></i><span>Revisamos tu comprobante lo antes posible dentro del horario de la tienda.</span></div>
            <div><i class="ph ph-bell"></i><span>Puedes ver el estado en cualquier momento en Mis pedidos.</span></div>
          </div>
          <div class="ctas">
            <a class="btn btn--accent" [routerLink]="['/mi-cuenta/pedido', o.id]">Ver mi pedido</a>
            <a class="btn btn--ghost" routerLink="/tienda">Seguir comprando</a>
          </div>
        </section>
      } @else if (!cart.lines().length) {
        <div class="empty card" style="margin-top: 40px">
          <i class="ph ph-shopping-bag"></i>
          <h3>No hay nada que pagar</h3>
          <p>Agrega productos al carrito para continuar.</p>
          <a routerLink="/tienda" class="btn btn--dark">Ir a la tienda</a>
        </div>
      } @else {
        <header class="page-head">
          <nav class="crumbs"><a routerLink="/carrito">Carrito</a><span>/</span><span>Pagar</span></nav>
          <h1 class="display">Finalizar compra</h1>
        </header>

        <div class="grid">
          <form class="steps" (ngSubmit)="submit()" novalidate>
            <!-- Entrega -->
            <section class="step card card-pad" id="paso-entrega">
              <h2><span class="n">1</span>¿Cómo lo quieres recibir?</h2>
              <div class="two">
                <button type="button" class="choice" [class.is-on]="delivery() === 'envio'" (click)="delivery.set('envio')">
                  <span class="dot"></span>
                  <span><strong>Envío a domicilio</strong><br /><span class="muted">Te lo llevamos a tu dirección</span></span>
                </button>
                <button type="button" class="choice" [class.is-on]="delivery() === 'retiro'" (click)="delivery.set('retiro')">
                  <span class="dot"></span>
                  <span><strong>Retiro en tienda</strong><br /><span class="muted">Gratis, en Santo Domingo</span></span>
                </button>
              </div>

              @if (delivery() === 'envio') {
                <p class="label sub">Zona de envío</p>
                <div class="two">
                  @for (z of settings.settings().zones; track z.id) {
                    <button type="button" class="choice" [class.is-on]="zoneId() === z.id" (click)="zoneId.set(z.id)">
                      <span class="dot"></span>
                      <span><strong>{{ z.name }}</strong><br /><span class="muted">{{ z.fee | rd }} · {{ z.eta }}</span></span>
                    </button>
                  }
                </div>
                @if (tried() && !zoneId()) {
                  <p class="err">Elige la zona de envío.</p>
                }

                <div class="form-grid form-grid--2 addr">
                  <div class="field">
                    <label for="prov">Provincia</label>
                    <select id="prov" class="select" [(ngModel)]="province" name="province">
                      <option value="" disabled>Elige tu provincia</option>
                      @for (p of provinces; track p) {
                        <option [value]="p">{{ p }}</option>
                      }
                    </select>
                    @if (tried() && !province) {
                      <span class="err">Elige la provincia.</span>
                    }
                  </div>
                  <div class="field">
                    <label for="city">Ciudad y sector</label>
                    <input id="city" class="input" [(ngModel)]="city" name="city" placeholder="Ej. Santo Domingo Este, Los Mina" [class.invalid]="tried() && !city.trim()" />
                    @if (tried() && !city.trim()) {
                      <span class="err">Escribe tu ciudad y sector.</span>
                    }
                  </div>
                  <div class="field span-2">
                    <label for="street">Calle, número y edificio</label>
                    <input id="street" class="input" [(ngModel)]="street" name="street" placeholder="Ej. C/ Duarte #45, apto 2B" [class.invalid]="tried() && !street.trim()" />
                    @if (tried() && !street.trim()) {
                      <span class="err">Escribe la dirección de entrega.</span>
                    }
                  </div>
                  <div class="field span-2">
                    <label for="ref">Referencia <span class="muted">(opcional)</span></label>
                    <input id="ref" class="input" [(ngModel)]="reference" name="reference" placeholder="Ej. Frente al parque, casa blanca de dos niveles" />
                  </div>
                </div>
              } @else {
                <div class="notice">
                  <i class="ph ph-storefront"></i>
                  <span>{{ settings.settings().address }}. {{ settings.settings().hours }} {{ settings.settings().pickupNote }}</span>
                </div>
              }

              <div class="field phone">
                <label for="phone">Teléfono de contacto</label>
                <input id="phone" class="input" type="tel" inputmode="tel" [(ngModel)]="phone" name="phone" placeholder="809-000-0000" [class.invalid]="tried() && !phoneOk()" />
                <span class="hint">Te llamamos o escribimos a este número si hay algún detalle.</span>
                @if (tried() && !phoneOk()) {
                  <span class="err">Escribe un teléfono de 10 dígitos.</span>
                }
              </div>
            </section>

            <!-- Pago -->
            <section class="step card card-pad" id="paso-pago">
              <h2><span class="n">2</span>Transfiere a una de nuestras cuentas</h2>
              <p class="muted">Elige el banco al que vas a transferir. Desde tu banco también puedes enviar a otro banco.</p>
              <div class="banks">
                @for (b of settings.activeBanks(); track b.id) {
                  <button type="button" class="choice bank" [class.is-on]="bankId() === b.id" (click)="bankId.set(b.id)">
                    <span class="chip" [style.background]="b.color">{{ short(b.bank) }}</span>
                    <span><strong>{{ b.bank }}</strong><br /><span class="muted">Cuenta de {{ b.type.toLowerCase() }}</span></span>
                    <span class="dot"></span>
                  </button>
                }
              </div>
              @if (tried() && !bankId()) {
                <p class="err">Elige el banco al que transferiste.</p>
              }

              @if (bank(); as b) {
                <dl class="acct">
                  <div><dt>Banco</dt><dd>{{ b.bank }}</dd></div>
                  <div><dt>Tipo de cuenta</dt><dd>{{ b.type }}</dd></div>
                  <div>
                    <dt>Número de cuenta</dt>
                    <dd>{{ b.number }} <button type="button" class="copy" (click)="copy(b.number, 'Número de cuenta copiado')"><i class="ph ph-copy"></i>Copiar</button></dd>
                  </div>
                  <div><dt>A nombre de</dt><dd>{{ b.holder }}</dd></div>
                  <div><dt>Cédula / RNC</dt><dd>{{ b.holderId }}</dd></div>
                  <div class="amount">
                    <dt>Monto a transferir</dt>
                    <dd>{{ total() | rd }} <button type="button" class="copy" (click)="copy(total().toString(), 'Monto copiado')"><i class="ph ph-copy"></i>Copiar</button></dd>
                  </div>
                </dl>
              }
            </section>

            <!-- Comprobante -->
            <section class="step card card-pad" id="paso-comprobante">
              <h2><span class="n">3</span>Sube el comprobante</h2>
              <p class="muted">Haz una captura de pantalla de la transferencia exitosa y súbela aquí.</p>
              <app-image-drop [value]="proof()" (changed)="proof.set($event)" />
              @if (tried() && !proof()) {
                <p class="err">Falta la imagen del comprobante.</p>
              }
              <div class="field">
                <label for="refnum">Número de referencia <span class="muted">(opcional)</span></label>
                <input id="refnum" class="input" [(ngModel)]="proofRef" name="proofRef" inputmode="numeric" placeholder="Aparece en tu comprobante" />
              </div>
              <label class="check confirm">
                <input type="checkbox" [(ngModel)]="confirmed" name="confirmed" />
                <span>Confirmo que transferí {{ total() | rd }}{{ bank() ? ' a ' + bank()!.bank : '' }}.</span>
              </label>
              @if (tried() && !confirmed) {
                <p class="err">Marca la casilla para confirmar la transferencia.</p>
              }
            </section>

            <button class="btn btn--accent btn--block send" type="submit" [disabled]="sending()">
              @if (sending()) {
                Enviando…
              } @else {
                Enviar pedido · {{ total() | rd }}
              }
            </button>
          </form>

          <aside class="summary card card-pad">
            <h2>Tu pedido</h2>
            <ul>
              @for (l of cart.lines(); track l.productId + l.size) {
                <li>
                  <span class="thumb"><img [src]="l.product.images[0]" alt="" /><span class="q">{{ l.qty }}</span></span>
                  <span class="nm">{{ l.product.name }}<br /><span class="muted">Talla {{ l.size }}</span></span>
                  <span class="price">{{ l.lineTotal | rd }}</span>
                </li>
              }
            </ul>
            <div class="row"><span>Subtotal</span><span class="price">{{ cart.subtotal() | rd }}</span></div>
            <div class="row">
              <span>Envío</span>
              <span class="price">{{ delivery() === 'retiro' ? 'Gratis' : zone() ? (zone()!.fee | rd) : 'Elige zona' }}</span>
            </div>
            <div class="row total"><span>Total a transferir</span><span class="price">{{ total() | rd }}</span></div>
          </aside>
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
    @media (min-width: 1000px) {
      .grid {
        grid-template-columns: 1fr 380px;
        gap: 32px;
      }
      .summary {
        position: sticky;
        top: calc(var(--header-h) + 24px);
      }
    }
    .steps {
      display: grid;
      gap: 16px;
    }
    .step {
      display: grid;
      gap: 16px;
      scroll-margin-top: calc(var(--header-h) + 16px);
    }
    .step h2 {
      display: flex;
      align-items: center;
      gap: 12px;
      font-size: 1.2rem;
    }
    .n {
      width: 30px;
      height: 30px;
      flex: none;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--ink);
      color: var(--bg);
      font-size: 0.9rem;
    }
    .two {
      display: grid;
      gap: 10px;
    }
    @media (min-width: 640px) {
      .two {
        grid-template-columns: 1fr 1fr;
      }
    }
    .sub {
      margin-top: 4px;
      margin-bottom: -6px;
    }
    .small {
      font-size: 0.85rem;
    }
    .err {
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .addr {
      margin-top: 4px;
    }
    .phone {
      max-width: 360px;
    }
    .banks {
      display: grid;
      gap: 10px;
    }
    @media (min-width: 640px) {
      .banks {
        grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      }
    }
    .bank {
      align-items: center;
    }
    .bank .dot {
      margin-left: auto;
    }
    .chip {
      width: 40px;
      height: 40px;
      flex: none;
      border-radius: 10px;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
      font-size: 0.72rem;
      letter-spacing: 0.02em;
    }
    .acct {
      margin: 0;
      display: grid;
      border: 1px solid var(--line);
      border-radius: var(--r-card);
      overflow: hidden;
      animation: rise var(--t-enter) var(--ease);
    }
    .acct > div {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 4px 16px;
      padding: 12px 16px;
      border-bottom: 1px solid var(--line);
    }
    .acct > div:last-child {
      border-bottom: 0;
    }
    .acct dt {
      color: var(--ink-3);
      font-size: 0.9rem;
    }
    .acct dd {
      margin: 0;
      font-weight: 650;
      display: flex;
      align-items: center;
      gap: 10px;
      font-variant-numeric: tabular-nums;
    }
    .acct .amount {
      background: var(--accent-soft);
    }
    .acct .amount dd {
      font-size: 1.15rem;
    }
    .copy {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      height: 30px;
      padding: 0 10px;
      border-radius: var(--r-pill);
      border: 1px solid var(--line);
      background: var(--surface);
      font-size: 0.8rem;
      font-weight: 600;
    }
    .confirm {
      align-items: flex-start;
    }
    .confirm input {
      margin-top: 2px;
      flex: none;
    }
    .send {
      height: 56px;
      font-size: 1rem;
    }
    .summary {
      display: grid;
      gap: 14px;
    }
    .summary h2 {
      font-size: 1.2rem;
    }
    .summary ul {
      list-style: none;
      margin: 0;
      padding: 0 0 14px;
      display: grid;
      gap: 14px;
      border-bottom: 1px solid var(--line);
    }
    .summary li {
      display: grid;
      grid-template-columns: 56px 1fr auto;
      gap: 12px;
      align-items: center;
      font-size: 0.9rem;
    }
    .thumb {
      position: relative;
    }
    .thumb img {
      width: 56px;
      height: 56px;
      object-fit: cover;
      border-radius: 10px;
      background: var(--surface-2);
    }
    .q {
      position: absolute;
      top: -6px;
      right: -6px;
      min-width: 20px;
      height: 20px;
      border-radius: var(--r-pill);
      background: var(--ink);
      color: var(--bg);
      font-size: 0.72rem;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .nm {
      line-height: 1.3;
    }
    .row {
      display: flex;
      justify-content: space-between;
    }
    .total {
      font-size: 1.15rem;
      font-weight: 700;
      padding-top: 14px;
      border-top: 1px solid var(--line);
    }
    .success {
      max-width: 640px;
      margin: 56px auto 0;
      display: grid;
      gap: 18px;
      justify-items: start;
    }
    .ok-icon {
      font-size: 3.4rem;
      color: var(--ok);
      line-height: 1;
    }
    .success h1 {
      font-size: clamp(2rem, 5vw, 3rem);
    }
    .next {
      display: grid;
      gap: 12px;
      width: 100%;
      padding: 16px;
      border-radius: var(--r-card);
      background: var(--surface-2);
    }
    .next div {
      display: flex;
      gap: 10px;
      color: var(--ink-2);
      font-size: 0.9375rem;
    }
    .next i {
      font-size: 1.3rem;
      color: var(--accent);
      flex: none;
    }
    .ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
  `,
})
export class Checkout {
  protected readonly cart = inject(CartService);
  protected readonly settings = inject(SettingsService);
  private readonly orders = inject(OrdersService);
  private readonly auth = inject(AuthService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);

  protected readonly provinces = DR_PROVINCES;

  readonly delivery = signal<'envio' | 'retiro'>('envio');
  readonly zoneId = signal('');
  readonly bankId = signal('');
  readonly proof = signal('');
  readonly tried = signal(false);
  readonly sending = signal(false);
  readonly done = signal<Order | null>(null);

  province = '';
  city = '';
  street = '';
  reference = '';
  phone = this.auth.user()?.phone ?? '';
  proofRef = '';
  confirmed = false;

  readonly zone = computed(() => this.settings.settings().zones.find((z) => z.id === this.zoneId()));
  readonly bank = computed(() => this.settings.activeBanks().find((b) => b.id === this.bankId()));
  readonly total = computed(() => this.cart.subtotal() + (this.delivery() === 'envio' ? (this.zone()?.fee ?? 0) : 0));

  short(bank: string) {
    return bank.replace(/^banco\s+/i, '').slice(0, 3).toUpperCase();
  }

  phoneOk() {
    return this.phone.replace(/\D/g, '').length >= 10;
  }

  async copy(text: string, msg: string) {
    try {
      await navigator.clipboard.writeText(text);
      this.toast.show(msg);
    } catch {
      this.toast.show(text, 'info');
    }
  }

  submit() {
    this.tried.set(true);
    const envio = this.delivery() === 'envio';
    const deliveryOk = this.phoneOk() && (!envio || (this.zoneId() && this.province && this.city.trim() && this.street.trim()));
    const firstBad = !deliveryOk
      ? 'paso-entrega'
      : !this.bankId()
        ? 'paso-pago'
        : !this.proof() || !this.confirmed
          ? 'paso-comprobante'
          : null;
    if (firstBad) {
      document.getElementById(firstBad)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      this.toast.error('Revisa los campos marcados en rojo.');
      return;
    }
    if (this.cart.problems().length) {
      this.toast.error('Algunos productos ya no tienen suficiente existencia. Revisa tu carrito.');
      this.router.navigateByUrl('/carrito');
      return;
    }

    this.sending.set(true);
    try {
      const res = this.orders.create({
        lines: this.cart.lines(),
        delivery: this.delivery(),
        zoneId: this.zoneId(),
        address: envio
          ? { province: this.province, city: this.city.trim(), street: this.street.trim(), reference: this.reference.trim() }
          : undefined,
        phone: this.phone.trim(),
        bankAccountId: this.bankId(),
        proofImage: this.proof(),
        proofReference: this.proofRef,
      });
      if (res.error || !res.order) {
        this.toast.error(res.error ?? 'No pudimos crear el pedido.');
        return;
      }
      this.cart.clear();
      this.done.set(res.order);
      window.scrollTo({ top: 0 });
      this.toast.show(`Pedido #${res.order.number} enviado por ${formatMoney(res.order.total)}`);
    } catch (e) {
      this.toast.error(e instanceof StorageFullError ? e.message : 'Ocurrió un error. Intenta de nuevo.');
    } finally {
      this.sending.set(false);
    }
  }
}
