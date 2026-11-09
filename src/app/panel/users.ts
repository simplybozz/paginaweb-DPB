import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService, PublicUser } from '../core/auth.service';
import { OrdersService } from '../core/orders.service';
import { Role, ROLE_DESCRIPTIONS, ROLE_LABELS } from '../core/models';
import { UsersService } from '../core/users.service';
import { AgoPipe, ToastService } from '../core/ui';

const ROLES: Role[] = ['cliente', 'vendedor', 'admin'];
const ROLE_ICON: Record<Role, string> = { cliente: 'ph-user', vendedor: 'ph-storefront', admin: 'ph-crown-simple' };

@Component({
  selector: 'app-panel-users',
  imports: [FormsModule, AgoPipe],
  template: `
    <header class="head">
      <h1>Usuarios y roles</h1>
      <p class="muted">Todo el que se registra entra como cliente. Aquí le das acceso al equipo de la tienda.</p>
    </header>

    <section class="roles">
      @for (r of roles; track r) {
        <button class="role card" [class.is-on]="filter() === r" (click)="filter.set(filter() === r ? '' : r)">
          <i class="ph" [class]="'ph ' + icon[r]"></i>
          <span class="rt"><strong>{{ labels[r] }}</strong><span class="n">{{ countRole(r) }}</span></span>
          <span class="muted sm">{{ desc[r] }}</span>
        </button>
      }
    </section>

    <label class="search">
      <i class="ph ph-magnifying-glass"></i>
      <span class="sr-only">Buscar usuario</span>
      <input class="input" type="search" placeholder="Buscar por nombre, correo o teléfono" [ngModel]="q()" (ngModelChange)="q.set($event)" />
    </label>

    @if (list().length) {
      <ul class="list">
        @for (u of list(); track u.id + rev()) {
          <li class="card user" [class.off]="!u.active">
            <span class="avatar" [class]="'avatar r-' + u.role">{{ initials(u.name) }}</span>
            <div class="info">
              <strong>{{ u.name }} @if (u.id === me()?.id) {<span class="badge">Tú</span>}</strong>
              <span class="muted sm">{{ u.email }} · {{ u.phone }}</span>
              <span class="muted sm">Se registró {{ u.createdAt | hace }} · {{ orderCount(u.id) }} pedidos</span>
            </div>
            <div class="ctrl">
              <label class="sr-only" [for]="'role-' + u.id">Rol de {{ u.name }}</label>
              <select class="select" [id]="'role-' + u.id" [ngModel]="u.role" (ngModelChange)="ask(u, $event)" [disabled]="!u.active">
                @for (r of roles; track r) {
                  <option [value]="r">{{ labels[r] }}</option>
                }
              </select>
              @if (u.id !== me()?.id) {
                <button class="btn btn--sm" [class.btn--ghost]="u.active" [class.btn--dark]="!u.active" (click)="toggleActive(u)">
                  {{ u.active ? 'Desactivar' : 'Activar' }}
                </button>
              }
            </div>
          </li>
        }
      </ul>
    } @else {
      <div class="empty card"><i class="ph ph-users-three"></i><h3>Sin resultados</h3><p>No hay usuarios con ese filtro.</p></div>
    }

    @if (pending(); as p) {
      <div class="overlay" (click)="cancelChange()">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h2>¿Hacer a {{ p.user.name }} {{ labels[p.role].toLowerCase() }}?</h2>
          <div class="notice" [class.notice--warn]="p.role !== 'cliente'">
            <i class="ph" [class]="'ph ' + icon[p.role]"></i>
            <span>{{ desc[p.role] }}</span>
          </div>
          @if (p.role === 'admin') {
            <p class="muted warn-txt">Un administrador puede cambiar cuentas bancarias y dar acceso a otras personas. Dale este rol solo a personas de total confianza.</p>
          }
          <div class="modal-actions">
            <button class="btn btn--ghost" (click)="cancelChange()">Volver</button>
            <button class="btn btn--dark" (click)="applyRole()">Sí, cambiar rol</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .head {
      margin-bottom: 20px;
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 750;
    }
    .roles {
      display: grid;
      gap: 10px;
      margin-bottom: 20px;
    }
    .roles {
      grid-template-columns: repeat(3, 1fr);
    }
    @media (max-width: 699px) {
      .role {
        padding: 12px;
      }
      .role .muted {
        display: none;
      }
      .role strong {
        font-size: 0.85rem;
      }
    }
    .role {
      display: grid;
      gap: 6px;
      padding: 16px;
      text-align: left;
      transition: border-color var(--t) var(--ease);
    }
    .role.is-on {
      border-color: var(--ink);
      box-shadow: inset 0 0 0 1px var(--ink);
    }
    .role > i {
      font-size: 1.4rem;
      color: var(--accent);
    }
    .rt {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .n {
      font-weight: 800;
      font-size: 1.2rem;
    }
    .sm {
      font-size: 0.85rem;
    }
    .search {
      position: relative;
      display: block;
      max-width: 420px;
      margin-bottom: 16px;
    }
    .search i {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ink-3);
    }
    .search .input {
      padding-left: 40px;
    }
    .list {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 10px;
    }
    .user {
      display: grid;
      grid-template-columns: auto 1fr;
      gap: 12px 14px;
      align-items: center;
      padding: 14px 16px;
    }
    .user.off {
      opacity: 0.6;
    }
    @media (min-width: 800px) {
      .user {
        grid-template-columns: auto 1fr auto;
      }
    }
    .avatar {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      font-weight: 700;
      font-size: 0.85rem;
      background: var(--surface-2);
      color: var(--ink);
    }
    .avatar.r-vendedor {
      background: var(--info-soft);
      color: var(--info);
    }
    .avatar.r-admin {
      background: var(--accent);
      color: #fff;
    }
    .info {
      display: grid;
      gap: 2px;
      min-width: 0;
    }
    .info strong {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .info .muted {
      overflow-wrap: anywhere;
    }
    .ctrl {
      grid-column: 1 / -1;
      display: flex;
      gap: 8px;
    }
    .ctrl .select {
      min-height: 40px;
      padding-block: 6px;
      min-width: 170px;
    }
    @media (min-width: 800px) {
      .ctrl {
        grid-column: auto;
      }
    }
    .warn-txt {
      margin-top: 12px;
      font-size: 0.9rem;
    }
  `,
})
export class PanelUsers {
  private readonly users = inject(UsersService);
  private readonly auth = inject(AuthService);
  private readonly orders = inject(OrdersService);
  private readonly toast = inject(ToastService);

  protected readonly roles = ROLES;
  protected readonly labels = ROLE_LABELS;
  protected readonly desc = ROLE_DESCRIPTIONS;
  protected readonly icon = ROLE_ICON;
  protected readonly me = this.auth.user;

  readonly q = signal('');
  readonly filter = signal<Role | ''>('');
  /** Fuerza a redibujar los selects cuando se cancela un cambio de rol. */
  readonly rev = signal(0);
  readonly pending = signal<{ user: PublicUser; role: Role } | null>(null);

  readonly list = computed(() => {
    const q = this.q().toLowerCase().trim();
    return this.users
      .users()
      .filter((u) => !this.filter() || u.role === this.filter())
      .filter((u) => !q || `${u.name} ${u.email} ${u.phone}`.toLowerCase().includes(q))
      .sort((a, b) => ROLES.indexOf(b.role) - ROLES.indexOf(a.role) || b.createdAt.localeCompare(a.createdAt));
  });

  countRole(r: Role) {
    return this.users.users().filter((u) => u.role === r).length;
  }

  orderCount(id: string) {
    return this.orders.orders().filter((o) => o.userId === id).length;
  }

  initials(name: string) {
    return name
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  ask(user: PublicUser, role: Role) {
    if (role === user.role) return;
    this.pending.set({ user, role });
  }

  cancelChange() {
    this.pending.set(null);
    this.rev.update((v) => v + 1); // devuelve el select a su valor real
  }

  applyRole() {
    const p = this.pending();
    if (!p) return;
    const err = this.users.setRole(p.user.id, p.role);
    this.pending.set(null);
    if (err) {
      this.toast.error(err);
      this.rev.update((v) => v + 1);
      return;
    }
    this.toast.show(`${p.user.name} ahora es ${ROLE_LABELS[p.role].toLowerCase()}`);
  }

  toggleActive(u: PublicUser) {
    const err = this.users.setActive(u.id, !u.active);
    if (err) return this.toast.error(err);
    this.toast.show(u.active ? `${u.name} ya no puede entrar` : `${u.name} puede entrar de nuevo`);
  }
}
