import { Component, effect, inject, signal } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { CartService } from '../core/cart.service';
import { CATEGORIES } from '../core/models';
import { SettingsService } from '../core/settings.service';
import { Logo } from '../shared/logo';
import { CartDrawer } from './cart-drawer';

@Component({
  selector: 'app-public-layout',
  imports: [RouterOutlet, RouterLink, RouterLinkActive, Logo, CartDrawer],
  template: `
    @if (intro()) {
      <div class="intro" aria-hidden="true" (animationend)="introDone($event)">
        <div class="intro-ring"></div>
        <div class="intro-logo">
          <span class="ib">D’PATRON</span>
          <span class="ic">Boutique</span>
        </div>
        <span class="intro-sub">Solo original</span>
      </div>
    }

    <div class="announce">
      <div class="wrap">
        <span><i class="ph-fill ph-seal-check"></i> Solo original · 100%</span>
        <span class="hide-sm"><i class="ph ph-truck"></i> Envíos a todo el país</span>
        <span class="hide-md"><i class="ph ph-bank"></i> Paga por transferencia</span>
        <span class="hide-md"><i class="ph ph-crown-simple"></i> La boutique de los famosos</span>
      </div>
    </div>

    <header class="hdr">
      <div class="wrap bar">
        <button class="icon-btn menu-btn" (click)="menu.set(true)" aria-label="Abrir menú"><i class="ph ph-list"></i></button>
        <a routerLink="/" class="brand" aria-label="Inicio"><app-logo /></a>

        <nav class="nav" aria-label="Principal">
          @for (c of categories; track c.id) {
            <a [routerLink]="['/tienda', c.id]" routerLinkActive="on" class="u-line">{{ c.label }}</a>
          }
          <a routerLink="/tienda" [queryParams]="{ orden: 'ofertas' }" class="u-line hot"><i class="ph-fill ph-fire"></i>Ofertas</a>
          <a routerLink="/nosotros" routerLinkActive="on" class="u-line">Nosotros</a>
        </nav>

        <div class="tools">
          <a class="icon-btn hide-sm" routerLink="/tienda" [queryParams]="{ buscar: '' }" aria-label="Buscar"><i class="ph ph-magnifying-glass"></i></a>
          @if (auth.isStaff()) {
            <a class="btn btn--sm btn--dark panel-btn" routerLink="/panel"><i class="ph ph-squares-four"></i><span>Panel</span></a>
          }
          @if (auth.user(); as u) {
            <div class="acct">
              <button class="icon-btn" (click)="acct.set(!acct())" [attr.aria-expanded]="acct()" aria-label="Mi cuenta">
                <span class="avatar">{{ initials(u.name) }}</span>
              </button>
              @if (acct()) {
                <div class="menu" (click)="acct.set(false)">
                  <div class="who">
                    <strong>{{ u.name }}</strong>
                    <span class="muted">{{ u.email }}</span>
                  </div>
                  <a routerLink="/mi-cuenta"><i class="ph ph-package"></i> Mis pedidos</a>
                  @if (auth.isStaff()) {
                    <a routerLink="/panel"><i class="ph ph-squares-four"></i> Panel de la tienda</a>
                  }
                  <button (click)="logout()"><i class="ph ph-sign-out"></i> Cerrar sesión</button>
                </div>
              }
            </div>
          } @else {
            <a class="icon-btn" routerLink="/entrar" aria-label="Iniciar sesión"><i class="ph ph-user"></i></a>
          }
          <button class="icon-btn" (click)="cart.drawerOpen.set(true)" aria-label="Abrir carrito">
            <i class="ph ph-shopping-bag"></i>
            @if (cart.count()) {
              <span class="count">{{ cart.count() }}</span>
            }
          </button>
        </div>
      </div>
    </header>

    @if (menu()) {
      <div class="m-scrim" (click)="menu.set(false)"></div>
      <nav class="m-menu" aria-label="Menú">
        <div class="m-top">
          <app-logo />
          <button class="icon-btn" (click)="menu.set(false)" aria-label="Cerrar menú"><i class="ph ph-x"></i></button>
        </div>
        <a routerLink="/tienda" class="m-big">Ver toda la tienda</a>
        @for (c of categories; track c.id) {
          <a [routerLink]="['/tienda', c.id]"><i class="ph" [class]="'ph ' + c.icon"></i>{{ c.label }}</a>
        }
        <a routerLink="/tienda" [queryParams]="{ orden: 'ofertas' }"><i class="ph ph-tag"></i>Ofertas</a>
        <a routerLink="/nosotros"><i class="ph ph-storefront"></i>Nosotros</a>
        <hr />
        @if (auth.user()) {
          <a routerLink="/mi-cuenta"><i class="ph ph-package"></i>Mis pedidos</a>
          @if (auth.isStaff()) {
            <a routerLink="/panel"><i class="ph ph-squares-four"></i>Panel de la tienda</a>
          }
          <button (click)="logout()"><i class="ph ph-sign-out"></i>Cerrar sesión</button>
        } @else {
          <a routerLink="/entrar"><i class="ph ph-user"></i>Iniciar sesión</a>
          <a routerLink="/registro"><i class="ph ph-user-plus"></i>Crear cuenta</a>
        }
        <a class="btn m-wa" [href]="settings.whatsappLink()" target="_blank" rel="noopener">
          <i class="ph ph-whatsapp-logo"></i> Escríbenos por WhatsApp
        </a>
      </nav>
    }

    <main>
      <router-outlet />
    </main>

    <footer class="ftr">
      <div class="wrap cols">
        <div class="about">
          <app-logo class="lg" />
          <p>La boutique de los famosos. Tenis, ropa, perfumes y relojes 100% originales. Pide en línea, paga por transferencia y te lo enviamos a todo el país.</p>
          <div class="social">
            <a class="icon-btn" [href]="settings.instagramLink()" target="_blank" rel="noopener" aria-label="Instagram"><i class="ph ph-instagram-logo"></i></a>
            <a class="icon-btn" [href]="settings.whatsappLink()" target="_blank" rel="noopener" aria-label="WhatsApp"><i class="ph ph-whatsapp-logo"></i></a>
          </div>
        </div>
        <div>
          <h4>Tienda</h4>
          @for (c of categories; track c.id) {
            <a [routerLink]="['/tienda', c.id]">{{ c.label }}</a>
          }
          <a routerLink="/tienda">Todo</a>
        </div>
        <div>
          <h4>Ayuda</h4>
          <a routerLink="/nosotros" fragment="como-comprar">Cómo comprar</a>
          <a routerLink="/nosotros" fragment="envios">Envíos</a>
          <a routerLink="/mi-cuenta">Mis pedidos</a>
          <a routerLink="/nosotros">Sobre nosotros</a>
        </div>
        <div>
          <h4>Contacto</h4>
          <a [href]="settings.whatsappLink()" target="_blank" rel="noopener">WhatsApp {{ fmtPhone(settings.settings().whatsapp) }}</a>
          <a [href]="'tel:' + settings.settings().phone">Tienda {{ settings.settings().phone }}</a>
          <span>{{ settings.settings().address }}</span>
          <span>{{ settings.settings().hours }}</span>
        </div>
      </div>
      <div class="giant" aria-hidden="true">D’PATRON</div>
      <div class="wrap legal">
        <span>© {{ year }} D’Patron Boutique. República Dominicana.</span>
        <a routerLink="/entrar">Acceso del equipo</a>
      </div>
    </footer>

    <a class="wa-fab" [href]="settings.whatsappLink()" target="_blank" rel="noopener" aria-label="Escríbenos por WhatsApp">
      <i class="ph-fill ph-whatsapp-logo"></i>
    </a>

    <app-cart-drawer />
  `,
  styles: `
    .announce {
      background: var(--brand-grad);
      color: #fff;
      font-size: 0.8125rem;
      font-weight: 500;
    }
    .announce .wrap {
      display: flex;
      justify-content: center;
      gap: 32px;
      padding-block: 8px;
    }
    .announce span {
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .announce i {
      font-size: 1rem;
    }
    .announce {
      font-size: 0.72rem;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      font-weight: 600;
    }
    @media (max-width: 899px) {
      .hide-md {
        display: none !important;
      }
    }

    /* Intro: anillo morado que gira, el logo dorado entra y la cortina sube. */
    .intro {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: radial-gradient(circle at 50% 45%, #2a0f5c 0%, #0c0912 65%);
      color: #fff;
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 22px;
      animation: intro-out 0.9s var(--ease-in-out) 1.9s both;
    }
    .intro-ring {
      position: absolute;
      left: 50%;
      top: 50%;
      width: min(70vw, 420px);
      aspect-ratio: 1;
      border-radius: 50%;
      translate: -50% -55%;
      background: conic-gradient(from 0deg, #8b3dff, #f7c548, #ff3d55, #8b3dff);
      -webkit-mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
      mask: radial-gradient(farthest-side, transparent calc(100% - 6px), #000 calc(100% - 5px));
      animation:
        spin 2.4s linear infinite,
        fade 0.6s var(--ease) both;
    }
    @keyframes spin {
      to {
        rotate: 360deg;
      }
    }
    .intro-logo {
      position: relative;
      display: grid;
      justify-items: center;
      line-height: 0.9;
    }
    .ib {
      font-family: var(--font-display);
      font-size: clamp(3.4rem, 13vw, 7rem);
      background: var(--gold-grad);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      filter: drop-shadow(0 4px 0 #4a1a9e);
      animation: intro-pop 0.9s var(--ease) 0.15s both;
    }
    .ic {
      font-family: var(--font-script);
      font-size: clamp(2.2rem, 8vw, 4.4rem);
      margin-top: -0.35em;
      margin-left: 1.4em;
      transform: rotate(-6deg);
      text-shadow: 0 0 24px rgb(139 61 255 / 0.95);
      clip-path: inset(0 100% 0 0);
      animation: intro-wipe 0.8s var(--ease-in-out) 0.75s both;
    }
    .intro-sub {
      position: relative;
      font-size: 0.8rem;
      font-weight: 800;
      letter-spacing: 0.32em;
      text-transform: uppercase;
      animation: rise 0.7s var(--ease) 1.15s both;
    }
    @keyframes intro-pop {
      from {
        opacity: 0;
        transform: scale(1.6);
        filter: blur(12px);
      }
    }
    @keyframes intro-wipe {
      to {
        clip-path: inset(0 -10% 0 0);
      }
    }
    @keyframes intro-out {
      to {
        transform: translateY(-100%);
      }
    }
    .hdr {
      position: sticky;
      top: 0;
      z-index: 50;
      background: color-mix(in srgb, var(--bg) 88%, transparent);
      backdrop-filter: blur(14px) saturate(160%);
      -webkit-backdrop-filter: blur(14px) saturate(160%);
      border-bottom: 1px solid var(--line);
    }
    .bar {
      height: var(--header-h);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .brand {
      flex: none;
    }
    .nav {
      display: none;
      gap: 22px;
      margin-left: 36px;
    }
    .nav a {
      padding: 6px 0 4px;
      font-weight: 700;
      font-size: 0.78rem;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      color: var(--ink-2);
      transition:
        color var(--t) var(--ease),
        background var(--t) var(--ease);
    }
    .nav a.hot {
      color: var(--hot);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .nav a:hover,
    .nav a.on {
      color: var(--ink);
      background-size: 100% 2px;
    }
    .tools {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 2px;
    }
    .panel-btn {
      margin-right: 6px;
    }
    .count {
      position: absolute;
      top: 4px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      padding: 0 5px;
      border-radius: var(--r-pill);
      background: var(--gold);
      color: var(--accent-ink);
      font-size: 0.7rem;
      font-weight: 700;
      display: grid;
      place-items: center;
    }
    .avatar {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--ink);
      color: var(--bg);
      font-size: 0.78rem;
      font-weight: 700;
    }
    .acct {
      position: relative;
    }
    .menu {
      position: absolute;
      right: 0;
      top: calc(100% + 8px);
      width: 250px;
      padding: 8px;
      background: var(--surface);
      border: 1px solid var(--line);
      border-radius: var(--r-card);
      box-shadow: var(--shadow);
      display: grid;
      animation: rise var(--t-enter) var(--ease);
    }
    .menu .who {
      display: grid;
      padding: 8px 10px 12px;
      border-bottom: 1px solid var(--line);
      margin-bottom: 6px;
      font-size: 0.875rem;
      overflow: hidden;
    }
    .menu a,
    .menu button {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px;
      border-radius: 8px;
      border: 0;
      background: none;
      text-align: left;
      font-size: 0.9375rem;
    }
    .menu a:hover,
    .menu button:hover {
      background: var(--surface-2);
    }
    @media (max-width: 639px) {
      .hide-sm {
        display: none !important;
      }
      .panel-btn span {
        display: none;
      }
      .panel-btn {
        width: 38px;
        padding: 0;
      }
    }
    @media (min-width: 1180px) {
      .nav {
        display: flex;
      }
      .menu-btn {
        display: none;
      }
    }

    .m-scrim {
      position: fixed;
      inset: 0;
      z-index: 60;
      background: rgb(10 10 10 / 0.5);
      animation: fade var(--t-enter) var(--ease);
    }
    .m-menu {
      position: fixed;
      z-index: 61;
      inset: 0 auto 0 0;
      width: min(340px, 88vw);
      background: var(--surface);
      padding: 12px 16px 24px;
      display: flex;
      flex-direction: column;
      gap: 2px;
      overflow: auto;
      animation: slideL var(--t-enter) var(--ease);
    }
    @keyframes slideL {
      from {
        transform: translateX(-100%);
      }
    }
    .m-top {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .m-menu a,
    .m-menu button:not(.icon-btn) {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 12px 8px;
      font-weight: 600;
      font-size: 1.05rem;
      border: 0;
      background: none;
      border-radius: 10px;
      text-align: left;
    }
    .m-menu a i,
    .m-menu button i {
      font-size: 1.3rem;
      color: var(--ink-3);
    }
    .m-menu .m-big {
      font-family: var(--font-display);
      font-weight: 400;
      color: var(--gold);
      text-transform: uppercase;
      font-size: 1.15rem;
    }
    .m-menu hr {
      border: 0;
      border-top: 1px solid var(--line);
      width: 100%;
      margin: 10px 0;
    }
    .m-menu .m-wa {
      margin-top: auto;
      justify-content: center;
      background: #1faa53;
      color: #fff;
    }
    .m-menu .m-wa i {
      color: #fff;
    }

    .ftr {
      margin-top: 40px;
      padding-top: 64px;
      background: linear-gradient(180deg, #0c0912 0%, #1a0b3a 100%);
      border-top: 1px solid var(--line);
      color: #fff;
      overflow: hidden;
      --ink: #fff;
      --bg: #0a0a0a;
      --ink-2: #bdbdbd;
      --ink-3: #8a8a8a;
      --line: #2a2a2a;
      --surface-2: #1c1c1c;
    }
    .giant {
      margin-top: 56px;
      padding-inline: 12px;
      font-family: var(--font-display);
      letter-spacing: 0.01em;
      line-height: 0.85;
      font-size: 22vw;
      white-space: nowrap;
      text-align: center;
      color: transparent;
      -webkit-text-stroke: 1px #4a3577;
      transition:
        color 0.8s var(--ease),
        -webkit-text-stroke-color 0.8s var(--ease);
    }
    .giant:hover {
      color: var(--gold);
      -webkit-text-stroke-color: var(--gold);
    }
    .giant sup {
      font-size: 0.25em;
      vertical-align: top;
    }
    .cols {
      display: grid;
      gap: 36px;
      grid-template-columns: 1fr 1fr;
    }
    .about {
      grid-column: 1 / -1;
      display: grid;
      gap: 16px;
      align-content: start;
    }
    .about p {
      color: var(--ink-2);
      max-width: 38ch;
    }
    .social {
      display: flex;
      gap: 4px;
      margin-left: -10px;
    }
    @media (min-width: 900px) {
      .cols {
        grid-template-columns: 1.6fr 1fr 1fr 1.3fr;
      }
      .about {
        grid-column: auto;
      }
    }
    .cols > div:not(.about) {
      display: grid;
      gap: 10px;
      align-content: start;
      font-size: 0.9375rem;
      color: var(--ink-2);
    }
    .cols h4 {
      font-size: 0.875rem;
      color: var(--ink);
      margin-bottom: 4px;
    }
    .cols a:hover {
      color: #fff;
    }
    .legal {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      gap: 10px;
      padding-block: 24px 32px;
      padding-right: 80px;
      margin-top: 8px;
      border-top: 1px solid var(--line);
      font-size: 0.8125rem;
      color: var(--ink-3);
    }
    .legal a:hover {
      color: var(--ink);
    }
    .wa-fab {
      position: fixed;
      z-index: 40;
      right: 16px;
      bottom: calc(16px + env(safe-area-inset-bottom));
      width: 56px;
      height: 56px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: #1faa53;
      color: #fff;
      font-size: 1.9rem;
      box-shadow: 0 8px 24px rgb(31 170 83 / 0.35);
      transition: transform var(--t) var(--ease);
    }
    .wa-fab:hover {
      transform: translateY(-2px);
    }
  `,
})
export class PublicLayout {
  protected readonly auth = inject(AuthService);
  protected readonly cart = inject(CartService);
  protected readonly settings = inject(SettingsService);
  private readonly router = inject(Router);

  protected readonly categories = CATEGORIES;
  protected readonly menu = signal(false);
  protected readonly acct = signal(false);
  protected readonly year = new Date().getFullYear();
  /** La intro con el logo sale una vez por visita. */
  protected readonly intro = signal(this.firstVisit());

  constructor() {
    this.router.events.subscribe((e) => {
      if (e instanceof NavigationEnd) {
        this.menu.set(false);
        this.acct.set(false);
      }
    });
    effect(() => {
      document.body.style.overflow = this.menu() || this.cart.drawerOpen() ? 'hidden' : '';
    });
  }

  private firstVisit() {
    try {
      if (sessionStorage.getItem('dpb:intro')) return false;
      sessionStorage.setItem('dpb:intro', '1');
    } catch {
      // Sin almacenamiento: se muestra igual.
    }
    return true;
  }

  introDone(e: AnimationEvent) {
    if (e.animationName.includes('intro-out')) this.intro.set(false);
  }

  initials(name: string) {
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase();
  }

  fmtPhone(n: string) {
    const d = n.replace(/\D/g, '');
    return d.length === 10 ? `${d.slice(0, 3)}-${d.slice(3, 6)}-${d.slice(6)}` : n;
  }

  logout() {
    this.auth.logout();
    this.router.navigateByUrl('/');
  }
}
