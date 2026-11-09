import { Component, computed, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DbService } from '../core/db.service';
import { ROLE_LABELS } from '../core/models';
import { OrdersService } from '../core/orders.service';
import { Logo } from '../shared/logo';

@Component({
  selector: 'app-panel-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo],
  template: `
    <div class="shell">
      <aside class="side" [class.open]="open()">
        <a routerLink="/panel" class="brand"><app-logo /></a>
        <p class="role"><i class="ph" [class]="'ph ' + (auth.isAdmin() ? 'ph-crown-simple' : 'ph-storefront')"></i>{{ roleLabel() }}</p>
        <nav aria-label="Panel">
          <a routerLink="/panel" routerLinkActive="on" [routerLinkActiveOptions]="{ exact: true }"><i class="ph ph-house"></i>Resumen</a>
          <a routerLink="/panel/pedidos" routerLinkActive="on">
            <i class="ph ph-receipt"></i>Pedidos
            @if (orders.pendingReview()) {
              <span class="pill">{{ orders.pendingReview() }}</span>
            }
          </a>
          <a routerLink="/panel/productos" routerLinkActive="on"><i class="ph ph-sneaker"></i>Productos</a>
          <a routerLink="/panel/almacen" routerLinkActive="on"><i class="ph ph-warehouse"></i>Almacén</a>
          @if (auth.isAdmin()) {
            <span class="group">Administración</span>
            <a routerLink="/panel/usuarios" routerLinkActive="on"><i class="ph ph-users-three"></i>Usuarios y roles</a>
            <a routerLink="/panel/ajustes" routerLinkActive="on"><i class="ph ph-gear-six"></i>Ajustes de la tienda</a>
          }
        </nav>
        <div class="bottom">
          <a routerLink="/" class="out"><i class="ph ph-storefront"></i>Ver la tienda</a>
          @if (auth.isAdmin()) {
            <button class="out" (click)="resetDemo()"><i class="ph ph-arrow-counter-clockwise"></i>Reiniciar datos de demo</button>
          }
          <div class="me">
            <span class="avatar">{{ initials() }}</span>
            <span class="who"><strong>{{ auth.user()?.name }}</strong><span>{{ auth.user()?.email }}</span></span>
            <button class="icon-btn icon-btn--sm" (click)="logout()" aria-label="Cerrar sesión" title="Cerrar sesión"><i class="ph ph-sign-out"></i></button>
          </div>
        </div>
      </aside>
      @if (open()) {
        <div class="scrim" (click)="open.set(false)"></div>
      }

      <div class="content">
        <header class="topbar">
          <button class="icon-btn" (click)="open.set(true)" aria-label="Abrir menú"><i class="ph ph-list"></i></button>
          <app-logo [compact]="true" />
          <span class="t">Panel</span>
          <a routerLink="/panel/pedidos" class="icon-btn bell" aria-label="Pedidos por revisar">
            <i class="ph ph-bell"></i>
            @if (orders.pendingReview()) {
              <span class="dotc">{{ orders.pendingReview() }}</span>
            }
          </a>
        </header>
        <main class="page">
          <router-outlet />
        </main>
      </div>
    </div>
  `,
  styles: `
    .shell {
      min-height: 100dvh;
    }
    @media (min-width: 1024px) {
      .shell {
        display: grid;
        grid-template-columns: 260px 1fr;
      }
    }
    .side {
      position: fixed;
      z-index: 61;
      inset: 0 auto 0 0;
      width: 272px;
      background: var(--surface);
      border-right: 1px solid var(--line);
      padding: 20px 14px;
      display: flex;
      flex-direction: column;
      gap: 6px;
      transform: translateX(-100%);
      transition: transform var(--t) var(--ease);
    }
    .side.open {
      transform: none;
    }
    @media (min-width: 1024px) {
      .side {
        position: sticky;
        top: 0;
        height: 100dvh;
        width: auto;
        transform: none;
      }
    }
    .scrim {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: rgb(10 10 10 / 0.5);
    }
    .brand {
      padding: 0 8px 4px;
    }
    .role {
      display: flex;
      align-items: center;
      gap: 6px;
      margin: 10px 8px 16px;
      font-size: 0.8125rem;
      font-weight: 650;
      color: var(--accent);
    }
    nav {
      display: grid;
      gap: 2px;
    }
    nav a {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 11px 12px;
      border-radius: 10px;
      font-weight: 600;
      color: var(--ink-2);
      transition: background var(--t) var(--ease);
    }
    nav a i {
      font-size: 1.3rem;
    }
    nav a:hover {
      background: var(--surface-2);
      color: var(--ink);
    }
    nav a.on {
      background: var(--ink);
      color: var(--bg);
    }
    .pill {
      margin-left: auto;
      min-width: 22px;
      height: 22px;
      padding: 0 7px;
      border-radius: var(--r-pill);
      background: var(--accent);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .group {
      font-size: 0.75rem;
      font-weight: 650;
      color: var(--ink-3);
      padding: 18px 12px 6px;
    }
    .bottom {
      margin-top: auto;
      display: grid;
      gap: 2px;
    }
    .out {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px 12px;
      border-radius: 10px;
      border: 0;
      background: none;
      text-align: left;
      font-size: 0.9rem;
      color: var(--ink-2);
    }
    .out:hover {
      background: var(--surface-2);
    }
    .out i {
      font-size: 1.2rem;
    }
    .me {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 12px 8px 0;
      margin-top: 8px;
      border-top: 1px solid var(--line);
    }
    .avatar {
      width: 36px;
      height: 36px;
      flex: none;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--accent);
      color: #fff;
      font-weight: 700;
      font-size: 0.8rem;
    }
    .who {
      display: grid;
      min-width: 0;
      font-size: 0.8125rem;
      line-height: 1.3;
    }
    .who span {
      color: var(--ink-3);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .topbar {
      position: sticky;
      top: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      gap: 10px;
      height: 60px;
      padding: 0 8px 0 4px;
      background: color-mix(in srgb, var(--bg) 90%, transparent);
      backdrop-filter: blur(12px);
      -webkit-backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--line);
    }
    .topbar .t {
      font-weight: 700;
    }
    .bell {
      margin-left: auto;
    }
    .dotc {
      position: absolute;
      top: 4px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      border-radius: var(--r-pill);
      background: var(--accent);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    @media (min-width: 1024px) {
      .topbar {
        display: none;
      }
    }
    .page {
      padding: 20px 16px 64px;
      max-width: 1200px;
    }
    @media (min-width: 768px) {
      .page {
        padding: 32px 36px 80px;
      }
    }
  `,
})
export class PanelLayout {
  protected readonly auth = inject(AuthService);
  protected readonly orders = inject(OrdersService);
  private readonly db = inject(DbService);
  private readonly router = inject(Router);

  readonly open = signal(false);
  readonly roleLabel = computed(() => {
    const r = this.auth.user()?.role;
    return r ? ROLE_LABELS[r] : '';
  });

  constructor() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) this.open.set(false);
    });
  }

  initials() {
    return (this.auth.user()?.name ?? '')
      .split(' ')
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  async resetDemo() {
    if (!confirm('Esto borra los cambios hechos en la demo y vuelve a los datos de ejemplo. ¿Continuar?')) return;
    await this.db.reset();
    location.reload();
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
