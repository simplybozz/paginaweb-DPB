import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { StorageFullError } from '../core/db.service';
import { BankAccount, StoreSettings } from '../core/models';
import { SettingsService } from '../core/settings.service';
import { compressImage, ToastService } from '../core/ui';

type Tab = 'tienda' | 'bancos' | 'envios' | 'instagram' | 'marcas';

@Component({
  selector: 'app-panel-settings',
  imports: [FormsModule],
  template: `
    <header class="head">
      <h1>Ajustes de la tienda</h1>
      <p class="muted">Lo que cambies aquí se ve en la página y en el pago.</p>
    </header>

    <div class="tabs">
      <button class="tab" [class.is-on]="tab() === 'tienda'" (click)="tab.set('tienda')"><i class="ph ph-storefront"></i>Tienda</button>
      <button class="tab" [class.is-on]="tab() === 'bancos'" (click)="tab.set('bancos')"><i class="ph ph-bank"></i>Cuentas bancarias</button>
      <button class="tab" [class.is-on]="tab() === 'envios'" (click)="tab.set('envios')"><i class="ph ph-truck"></i>Envíos</button>
      <button class="tab" [class.is-on]="tab() === 'instagram'" (click)="tab.set('instagram')"><i class="ph ph-instagram-logo"></i>Instagram</button>
      <button class="tab" [class.is-on]="tab() === 'marcas'" (click)="tab.set('marcas')"><i class="ph ph-tag"></i>Marcas</button>
    </div>

    <form (ngSubmit)="save()" class="body">
      @switch (tab()) {
        @case ('tienda') {
          <section class="card card-pad form-grid form-grid--2">
            <div class="field">
              <label for="ig">Usuario de Instagram</label>
              <input id="ig" class="input" [(ngModel)]="d.instagram" name="ig" />
            </div>
            <div class="field">
              <label for="wa">WhatsApp</label>
              <input id="wa" class="input" type="tel" [(ngModel)]="d.whatsapp" name="wa" />
              <span class="hint">Solo números, sin el 1. Ej. 8296804362</span>
            </div>
            <div class="field">
              <label for="tel">Teléfono de la tienda</label>
              <input id="tel" class="input" type="tel" [(ngModel)]="d.phone" name="tel" />
            </div>
            <div class="field">
              <label for="addr">Dirección</label>
              <input id="addr" class="input" [(ngModel)]="d.address" name="addr" />
            </div>
            <div class="field span-2">
              <label for="hours">Horario</label>
              <input id="hours" class="input" [(ngModel)]="d.hours" name="hours" />
            </div>
            <div class="field span-2">
              <label for="pick">Indicaciones para retirar en tienda</label>
              <textarea id="pick" class="textarea" [(ngModel)]="d.pickupNote" name="pick"></textarea>
            </div>
          </section>
        }

        @case ('bancos') {
          <div class="notice notice--info"><i class="ph ph-info"></i><span>Estas son las únicas cuentas que el cliente puede elegir al pagar. Revisa bien cada número antes de guardar.</span></div>
          @for (b of d.banks; track b.id; let i = $index) {
            <section class="card card-pad bank">
              <div class="bank-head">
                <span class="chip" [style.background]="b.color">{{ (b.bank.replace('Banco ', '') || '?').slice(0, 3).toUpperCase() }}</span>
                <strong>{{ b.bank || 'Nueva cuenta' }}</strong>
                <label class="check on"><input type="checkbox" [(ngModel)]="b.active" [name]="'act' + i" /> Mostrar al pagar</label>
              </div>
              <div class="form-grid form-grid--2">
                <div class="field">
                  <label [for]="'bk' + i">Banco</label>
                  <input class="input" [id]="'bk' + i" [(ngModel)]="b.bank" [name]="'bk' + i" placeholder="Ej. Banreservas" />
                </div>
                <div class="field">
                  <label [for]="'tp' + i">Tipo de cuenta</label>
                  <select class="select" [id]="'tp' + i" [(ngModel)]="b.type" [name]="'tp' + i">
                    <option value="Ahorros">Ahorros</option>
                    <option value="Corriente">Corriente</option>
                  </select>
                </div>
                <div class="field">
                  <label [for]="'nm' + i">Número de cuenta</label>
                  <input class="input" [id]="'nm' + i" [(ngModel)]="b.number" [name]="'nm' + i" inputmode="numeric" />
                </div>
                <div class="field">
                  <label [for]="'co' + i">Color del banco</label>
                  <input class="input color" type="color" [id]="'co' + i" [(ngModel)]="b.color" [name]="'co' + i" />
                </div>
                <div class="field">
                  <label [for]="'ho' + i">A nombre de</label>
                  <input class="input" [id]="'ho' + i" [(ngModel)]="b.holder" [name]="'ho' + i" />
                </div>
                <div class="field">
                  <label [for]="'id' + i">Cédula o RNC del titular</label>
                  <input class="input" [id]="'id' + i" [(ngModel)]="b.holderId" [name]="'id' + i" />
                </div>
              </div>
              <button type="button" class="link del" (click)="removeBank(i)">Quitar esta cuenta</button>
            </section>
          }
          <button type="button" class="btn btn--ghost" (click)="addBank()"><i class="ph ph-plus"></i>Agregar cuenta</button>
        }

        @case ('envios') {
          <section class="card card-pad">
            <p class="muted sm">Zonas que el cliente elige al pagar. El retiro en tienda siempre es gratis.</p>
            <div class="zones">
              @for (z of d.zones; track z.id; let i = $index) {
                <div class="zone">
                  <div class="field">
                    <label [for]="'zn' + i">Zona</label>
                    <input class="input" [id]="'zn' + i" [(ngModel)]="z.name" [name]="'zn' + i" />
                  </div>
                  <div class="field">
                    <label [for]="'zf' + i">Costo (RD$)</label>
                    <input class="input" type="number" min="0" [id]="'zf' + i" [(ngModel)]="z.fee" [name]="'zf' + i" />
                  </div>
                  <div class="field">
                    <label [for]="'ze' + i">Tiempo de entrega</label>
                    <input class="input" [id]="'ze' + i" [(ngModel)]="z.eta" [name]="'ze' + i" />
                  </div>
                  <button type="button" class="icon-btn" (click)="d.zones.splice(i, 1)" aria-label="Quitar zona"><i class="ph ph-trash"></i></button>
                </div>
              }
            </div>
            <button type="button" class="btn btn--ghost btn--sm" (click)="addZone()"><i class="ph ph-plus"></i>Agregar zona</button>
          </section>
        }

        @case ('instagram') {
          <p class="muted sm">Pega el enlace de las 6 publicaciones que quieres mostrar abajo en la página. Si subes una portada se usa esa foto; si no, se muestra la publicación de Instagram.</p>
          <div class="ig">
            @for (p of d.instagramPosts; track $index; let i = $index) {
              <section class="card card-pad ig-item">
                <label class="cover">
                  @if (p.image) {
                    <img [src]="p.image" alt="" />
                  } @else {
                    <i class="ph ph-image"></i><span>Portada</span>
                  }
                  <input type="file" accept="image/*" class="sr-only" (change)="cover($event, i)" />
                </label>
                <div class="ig-fields">
                  <div class="field">
                    <label [for]="'iu' + i">Enlace de la publicación {{ i + 1 }}</label>
                    <input class="input" [id]="'iu' + i" [(ngModel)]="p.url" [name]="'iu' + i" placeholder="https://www.instagram.com/p/…" />
                  </div>
                  <div class="field">
                    <label [for]="'ic' + i">Texto corto</label>
                    <input class="input" [id]="'ic' + i" [(ngModel)]="p.caption" [name]="'ic' + i" />
                  </div>
                  @if (p.image) {
                    <button type="button" class="link sm" (click)="p.image = undefined">Quitar portada</button>
                  }
                </div>
              </section>
            }
          </div>
        }

        @case ('marcas') {
          <section class="card card-pad">
            <p class="muted sm">Aparecen en la franja de marcas y en los filtros de la tienda.</p>
            <ul class="brands">
              @for (b of d.brands; track b.id; let i = $index) {
                <li>
                  <input class="input" [(ngModel)]="b.name" [name]="'br' + i" aria-label="Nombre de la marca" />
                  <span class="muted sm">{{ b.logo ? 'Con logo' : 'Solo texto' }}</span>
                  <button type="button" class="icon-btn" (click)="d.brands.splice(i, 1)" aria-label="Quitar marca"><i class="ph ph-trash"></i></button>
                </li>
              }
            </ul>
            <div class="add-brand">
              <input class="input" [(ngModel)]="newBrand" name="newBrand" placeholder="Nueva marca" />
              <button type="button" class="btn btn--ghost btn--sm" (click)="addBrand()"><i class="ph ph-plus"></i>Agregar</button>
            </div>
          </section>
        }
      }

      <div class="bar">
        <span class="muted sm">{{ dirty() ? 'Tienes cambios sin guardar' : 'Todo guardado' }}</span>
        <button type="button" class="btn btn--ghost" (click)="discard()" [disabled]="!dirty()">Descartar</button>
        <button type="submit" class="btn btn--accent" [disabled]="!dirty()"><i class="ph ph-check"></i>Guardar cambios</button>
      </div>
    </form>
  `,
  styles: `
    .head {
      margin-bottom: 18px;
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 750;
    }
    .tabs {
      margin-bottom: 18px;
    }
    .body {
      display: grid;
      gap: 14px;
      padding-bottom: 80px;
    }
    .sm {
      font-size: 0.875rem;
    }
    .bank {
      display: grid;
      gap: 16px;
    }
    .bank-head {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .bank-head .on {
      margin-left: auto;
      font-size: 0.875rem;
    }
    .chip {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: grid;
      place-items: center;
      color: #fff;
      font-weight: 800;
      font-size: 0.7rem;
    }
    .color {
      padding: 6px;
      height: 48px;
    }
    .del {
      justify-self: start;
      color: var(--danger);
      font-size: 0.875rem;
    }
    .zones {
      display: grid;
      gap: 14px;
      margin: 16px 0;
    }
    .zone {
      display: grid;
      gap: 10px;
      grid-template-columns: 1fr auto;
      padding-bottom: 14px;
      border-bottom: 1px solid var(--line);
    }
    .zone .field:first-child {
      grid-column: 1 / -1;
    }
    .zone .icon-btn {
      align-self: end;
    }
    @media (min-width: 800px) {
      .zone {
        grid-template-columns: 2fr 1fr 1.4fr auto;
      }
      .zone .field:first-child {
        grid-column: auto;
      }
    }
    .ig {
      display: grid;
      gap: 12px;
    }
    @media (min-width: 900px) {
      .ig {
        grid-template-columns: 1fr 1fr;
      }
    }
    .ig-item {
      display: grid;
      grid-template-columns: 96px 1fr;
      gap: 14px;
    }
    .cover {
      width: 96px;
      aspect-ratio: 4 / 5;
      border-radius: 10px;
      overflow: hidden;
      border: 2px dashed var(--line);
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 4px;
      cursor: pointer;
      color: var(--ink-3);
      font-size: 0.8rem;
    }
    .cover img {
      width: 96px;
      height: 100%;
      object-fit: cover;
    }
    .cover i {
      font-size: 1.5rem;
    }
    .ig-fields {
      display: grid;
      gap: 10px;
      min-width: 0;
    }
    .ig-fields .link {
      justify-self: start;
    }
    .brands {
      list-style: none;
      margin: 16px 0;
      padding: 0;
      display: grid;
      gap: 8px;
    }
    .brands li {
      display: grid;
      grid-template-columns: 1fr auto auto;
      gap: 10px;
      align-items: center;
    }
    .brands .input {
      min-height: 42px;
      padding-block: 8px;
    }
    .add-brand {
      display: flex;
      gap: 8px;
      max-width: 420px;
    }
    .bar {
      position: fixed;
      z-index: 40;
      left: 0;
      right: 0;
      bottom: 0;
      display: flex;
      justify-content: flex-end;
      align-items: center;
      gap: 10px;
      padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
      background: color-mix(in srgb, var(--surface) 94%, transparent);
      backdrop-filter: blur(10px);
      border-top: 1px solid var(--line);
    }
    .bar .muted {
      margin-right: auto;
    }
    @media (min-width: 1024px) {
      .bar {
        left: 260px;
        padding-inline: 36px;
      }
    }
    @media (max-width: 520px) {
      .bar .muted {
        display: none;
      }
      .bar .btn {
        flex: 1;
        padding: 0 12px;
      }
    }
  `,
})
export class PanelSettings {
  private readonly settings = inject(SettingsService);
  private readonly toast = inject(ToastService);

  readonly tab = signal<Tab>('tienda');
  d: StoreSettings = structuredClone(this.settings.settings());
  newBrand = '';

  private readonly saved = computed(() => JSON.stringify(this.settings.settings()));
  dirty() {
    return JSON.stringify(this.d) !== this.saved();
  }

  addBank() {
    const b: BankAccount = {
      id: 'b' + Date.now().toString(36),
      bank: '',
      type: 'Ahorros',
      number: '',
      holder: '',
      holderId: '',
      color: '#333333',
      active: true,
    };
    this.d.banks.push(b);
  }

  removeBank(i: number) {
    if (confirm(`¿Quitar la cuenta de ${this.d.banks[i].bank || 'este banco'}?`)) this.d.banks.splice(i, 1);
  }

  addZone() {
    this.d.zones.push({ id: 'z' + Date.now().toString(36), name: '', fee: 0, eta: '' });
  }

  addBrand() {
    const name = this.newBrand.trim();
    if (!name) return;
    if (this.d.brands.some((b) => b.name.toLowerCase() === name.toLowerCase())) {
      this.toast.error('Esa marca ya está en la lista.');
      return;
    }
    this.d.brands.push({ id: 'm' + Date.now().toString(36), name });
    this.newBrand = '';
  }

  async cover(e: Event, i: number) {
    const el = e.target as HTMLInputElement;
    const f = el.files?.[0];
    el.value = '';
    if (!f) return;
    try {
      this.d.instagramPosts[i].image = await compressImage(f, 700, 0.75);
    } catch (err) {
      this.toast.error((err as Error).message);
    }
  }

  discard() {
    this.d = structuredClone(this.settings.settings());
  }

  save() {
    const active = this.d.banks.filter((b) => b.active);
    if (!active.length) {
      this.toast.error('Deja al menos una cuenta bancaria visible para que los clientes puedan pagar.');
      this.tab.set('bancos');
      return;
    }
    if (active.some((b) => !b.bank.trim() || !b.number.trim() || !b.holder.trim())) {
      this.toast.error('Cada cuenta visible necesita banco, número y titular.');
      this.tab.set('bancos');
      return;
    }
    if (this.d.zones.some((z) => !z.name.trim())) {
      this.toast.error('Ponle nombre a todas las zonas de envío.');
      this.tab.set('envios');
      return;
    }
    try {
      this.d.zones = this.d.zones.map((z) => ({ ...z, fee: Math.max(0, Number(z.fee) || 0) }));
      this.settings.save(structuredClone(this.d));
      this.toast.show('Ajustes guardados');
    } catch (e) {
      this.toast.error(e instanceof StorageFullError ? e.message : 'No se pudo guardar.');
    }
  }
}
