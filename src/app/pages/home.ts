import { Component, computed, DestroyRef, ElementRef, inject, signal, viewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CATEGORIES } from '../core/models';
import { ProductsService } from '../core/products.service';
import { IMAGES } from '../core/seed';
import { SettingsService } from '../core/settings.service';
import { InstagramFeed } from '../shared/instagram-feed';
import { ProductCard } from '../shared/product-card';
import { Reveal } from '../shared/reveal';

const CAT_IMAGES: Record<string, string> = {
  tenis: IMAGES.catTenis,
  ropa: IMAGES.catRopa,
  gorras: IMAGES.catGorras,
  perfumes: IMAGES.catPerfumes,
  relojes: IMAGES.catRelojes,
  correas: IMAGES.catCorreas,
  chancletas: IMAGES.catChancletas,
};

@Component({
  selector: 'app-home',
  imports: [RouterLink, ProductCard, InstagramFeed, Reveal],
  template: `
    <!-- Hero -->
    <section class="hero">
      <div class="glow g1" aria-hidden="true"></div>
      <div class="glow g2" aria-hidden="true"></div>
      <div class="wrap hero-in">
        <div class="copy">
          <span class="chip-hot enter" style="--d: 0"><i class="ph-fill ph-seal-check"></i> Solo original · 100%</span>
          <h1 class="display lines">
            <span><span style="--l: 0">La boutique</span></span>
            <span><span style="--l: 1">de los <em class="gold-text">famosos</em></span></span>
          </h1>
          <p class="lead enter" style="--d: 4">
            Jordan, Nike, Cole Haan, perfumes y relojes 100% originales. Escoge tu talla, paga por transferencia
            y te lo llevamos a cualquier rincón del país.
          </p>
          <div class="ctas enter" style="--d: 5">
            <a routerLink="/tienda" class="btn btn--gold">Comprar ahora <i class="ph ph-arrow-right"></i></a>
            <a routerLink="/tienda" [queryParams]="{ orden: 'ofertas' }" class="btn btn--ghost"><i class="ph-fill ph-fire"></i> Ver ofertas</a>
          </div>
          <dl class="stats enter" style="--d: 6">
            <div><dt class="display gold-text">46.9K</dt><dd>seguidores en Instagram</dd></div>
            <div><dt class="display gold-text">100%</dt><dd>original, con caja</dd></div>
            <div><dt class="display gold-text">32</dt><dd>provincias con envío</dd></div>
          </dl>
        </div>

        <div class="art">
          <div class="card-shoe enter" style="--d: 2">
            <img [src]="img.hero" alt="Tenis Nike Air Force 1 blancos" fetchpriority="high" />
            <div class="shoe-meta">
              <span class="muted">Nike</span>
              <strong>Air Force 1 '07</strong>
            </div>
          </div>
          <div class="price-sticker enter" style="--d: 4" aria-label="Precio de oferta">
            <small>A solo</small>
            <span class="display gold-text">RD$6,499</span>
          </div>
          <div class="mini enter" style="--d: 5">
            <img [src]="img.heroAlt" alt="Jordan 1 Low rojo y negro" />
          </div>
          <span class="seal" aria-hidden="true">
            <svg viewBox="0 0 100 100">
              <defs><path id="circ" d="M50,50 m-38,0 a38,38 0 1,1 76,0 a38,38 0 1,1 -76,0" /></defs>
              <text><textPath href="#circ" textLength="232" lengthAdjust="spacing">SOLO ORIGINAL · D’PATRON BOUTIQUE ·</textPath></text>
            </svg>
            <i class="ph-fill ph-crown-simple"></i>
          </span>
        </div>
      </div>
    </section>

    <!-- Cintas cruzadas -->
    <div class="tapes" aria-hidden="true">
      <div class="tape tape--gold">
        <div class="tape-track">
          @for (round of [0, 1]; track round) {
            <div class="tape-set">
              <span>Solo original</span><b>★</b><span>Envíos a todo el país</span><b>★</b>
              <span>Paga por transferencia</span><b>★</b><span>La boutique de los famosos</span><b>★</b>
            </div>
          }
        </div>
      </div>
      <div class="tape tape--purple">
        <div class="tape-track rev">
          @for (round of [0, 1]; track round) {
            <div class="tape-set">
              <span>Jordan</span><b>✦</b><span>Nike</span><b>✦</b><span>Cole Haan</span><b>✦</b>
              <span>Invicta</span><b>✦</b><span>New Era</span><b>✦</b><span>Chanel</span><b>✦</b>
            </div>
          }
        </div>
      </div>
    </div>

    <!-- Categorías como historias destacadas de Instagram -->
    <section class="wrap stories-sec" aria-labelledby="cats-title">
      <div class="sec-head" appReveal>
        <h2 id="cats-title" class="display h-section">¿Qué andas <span class="gold-text">buscando?</span></h2>
        <a routerLink="/tienda" class="link-arrow u-line">Ver todo <i class="ph ph-arrow-right"></i></a>
      </div>
      <div class="stories">
        @for (c of categories; track c.id; let i = $index) {
          <a [routerLink]="['/tienda', c.id]" class="story" [appReveal]="i">
            <span class="ring"><img [src]="catImg(c.id)" alt="" loading="lazy" /></span>
            <span class="lbl">{{ c.label }}</span>
          </a>
        }
      </div>
    </section>

    <!-- El tapón de oferta -->
    <section class="deals">
      <div class="wrap">
        <div class="deals-head" appReveal>
          <div>
            <span class="chip-hot"><i class="ph-fill ph-fire"></i> Esta semana</span>
            <h2 class="display deals-title">El tapón <span class="gold-text">de oferta</span></h2>
          </div>
          <div class="countdown" aria-label="Tiempo restante de la oferta">
            <span class="muted cd-lbl">Se acaba en</span>
            <div class="cd">
              <div><strong>{{ left().d }}</strong><small>días</small></div>
              <div><strong>{{ left().h }}</strong><small>horas</small></div>
              <div><strong>{{ left().m }}</strong><small>min</small></div>
              <div><strong>{{ left().s }}</strong><small>seg</small></div>
            </div>
          </div>
        </div>
        <div class="p-grid p-grid--4">
          @for (p of deals(); track p.id; let i = $index) {
            <app-product-card [product]="p" [appReveal]="i" />
          }
        </div>
      </div>
    </section>

    <!-- Lo nuevo -->
    <section class="new">
      <div class="wrap sec-head" appReveal>
        <h2 class="display h-section">Acabado de <span class="gold-text">llegar</span></h2>
        <div class="arrows">
          <button class="icon-btn" (click)="scroll(-1)" aria-label="Anterior"><i class="ph ph-arrow-left"></i></button>
          <button class="icon-btn" (click)="scroll(1)" aria-label="Siguiente"><i class="ph ph-arrow-right"></i></button>
        </div>
      </div>
      <div class="rail" #rail>
        @for (p of newest(); track p.id; let i = $index) {
          <app-product-card [product]="p" [appReveal]="i" />
        }
      </div>
    </section>

    <!-- Banner Jordan -->
    <section class="wrap promo">
      <div class="promo-card wipe" appReveal>
        <img [src]="img.storeWall" alt="Pared de tenis en la tienda" loading="lazy" />
        <div class="promo-copy">
          <span class="tagline">Ofertas Jordan</span>
          <h2 class="display">Tu par de Jordan<br /><span class="gold-text">te está esperando</span></h2>
          <a routerLink="/tienda" [queryParams]="{ marca: 'Jordan' }" class="btn btn--gold">Ver Jordan <i class="ph ph-arrow-right"></i></a>
        </div>
      </div>
    </section>

    <!-- Más pedidos -->
    <section class="wrap featured">
      <div class="sec-head" appReveal>
        <h2 class="display h-section">Lo que <span class="gold-text">más se vende</span></h2>
        <a routerLink="/tienda" class="link-arrow u-line">Ver la tienda <i class="ph ph-arrow-right"></i></a>
      </div>
      <div class="p-grid p-grid--4">
        @for (p of featured(); track p.id; let i = $index) {
          <app-product-card [product]="p" [appReveal]="i" />
        }
      </div>
    </section>

    <!-- Cómo comprar -->
    <section class="how" id="como-comprar">
      <div class="wrap how-in">
        <div class="how-copy" appReveal>
          <span class="tagline">Pago por transferencia</span>
          <h2 class="display h-section">Comprar es <span class="gold-text">facilito</span></h2>
          <p class="lead">Sin tarjeta y sin complicaciones. Transfiere desde la app de tu banco, sube la captura y nosotros hacemos el resto.</p>
          <a routerLink="/tienda" class="btn btn--brand">Empezar a comprar <i class="ph ph-arrow-right"></i></a>
        </div>
        <ol class="steps">
          <li [appReveal]="0"><span class="n">1</span><div><h3>Elige tu par</h3><p>Agrega al carrito con tu talla.</p></div><i class="ph ph-sneaker"></i></li>
          <li [appReveal]="1"><span class="n">2</span><div><h3>Transfiere</h3><p>Popular, Banreservas o BHD. Copias la cuenta con un toque.</p></div><i class="ph ph-bank"></i></li>
          <li [appReveal]="2"><span class="n">3</span><div><h3>Sube el comprobante</h3><p>La captura de la transferencia, y listo.</p></div><i class="ph ph-receipt"></i></li>
          <li [appReveal]="3"><span class="n">4</span><div><h3>Te llega</h3><p>Confirmamos el pago y sale tu pedido. Lo sigues paso a paso.</p></div><i class="ph ph-truck"></i></li>
        </ol>
      </div>
    </section>

    <!-- Visítanos -->
    <section class="wrap visit">
      <div class="visit-media wipe" appReveal>
        <img [src]="img.store" alt="Tienda de tenis con pared de exhibición" loading="lazy" />
        <span class="live"><i></i> Abierto hoy</span>
      </div>
      <div class="visit-copy from-right" appReveal="1">
        <span class="tagline">La boutique</span>
        <h2 class="display h-section">Ven a <span class="gold-text">medírtelos</span></h2>
        <ul>
          <li><i class="ph ph-map-pin"></i><span>{{ settings.settings().address }}</span></li>
          <li><i class="ph ph-clock"></i><span>{{ settings.settings().hours }}</span></li>
          <li><i class="ph ph-phone"></i><a class="u-line" [href]="'tel:' + settings.settings().phone">{{ settings.settings().phone }}</a></li>
          <li><i class="ph ph-truck"></i><span>Envíos a todo el país.</span></li>
        </ul>
        <div class="ctas">
          <a class="btn btn--wa" [href]="settings.whatsappLink()" target="_blank" rel="noopener"><i class="ph-fill ph-whatsapp-logo"></i> Escríbenos</a>
          <a class="btn btn--ghost" [href]="settings.instagramLink()" target="_blank" rel="noopener"><i class="ph ph-instagram-logo"></i> {{ '@' + settings.settings().instagram }}</a>
        </div>
      </div>
    </section>

    <app-instagram-feed />
  `,
  styles: `
    /* ---------- Hero ---------- */
    .hero {
      position: relative;
      overflow: hidden;
      isolation: isolate;
    }
    .glow {
      position: absolute;
      z-index: -1;
      border-radius: 50%;
      filter: blur(90px);
      opacity: 0.55;
      animation: drift 12s ease-in-out infinite alternate;
    }
    .g1 {
      width: 520px;
      height: 520px;
      background: #8b3dff;
      right: -120px;
      top: -140px;
    }
    .g2 {
      width: 360px;
      height: 360px;
      background: #ff3d55;
      left: -160px;
      bottom: -160px;
      opacity: 0.25;
      animation-delay: -6s;
    }
    @keyframes drift {
      to {
        transform: translate(-40px, 30px) scale(1.1);
      }
    }
    .hero-in {
      display: grid;
      gap: 48px;
      padding-top: 40px;
      padding-bottom: 64px;
      align-items: center;
    }
    @media (min-width: 960px) {
      .hero-in {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
        min-height: calc(100dvh - var(--header-h) - 36px);
        max-height: 880px;
      }
    }
    .enter {
      animation: rise-big 1s var(--ease) both;
      animation-delay: calc(var(--d) * 110ms + 150ms);
    }
    @keyframes rise-big {
      from {
        opacity: 0;
        transform: translateY(40px);
      }
    }
    .copy {
      display: grid;
      gap: 22px;
      justify-items: start;
    }
    h1 {
      font-size: clamp(3.2rem, 9vw, 7.4rem);
      line-height: 0.92;
    }
    h1 em {
      font-style: normal;
    }
    .ctas {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }
    .stats {
      display: flex;
      flex-wrap: wrap;
      gap: 28px;
      margin: 8px 0 0;
    }
    .stats div {
      display: grid;
    }
    .stats dt {
      font-size: 2rem;
    }
    .stats dd {
      margin: 0;
      font-size: 0.8rem;
      color: var(--ink-3);
    }
    .art {
      position: relative;
      min-height: 420px;
      display: grid;
      place-items: center;
    }
    .card-shoe {
      position: relative;
      width: min(100%, 440px);
      border-radius: 28px;
      overflow: hidden;
      background: linear-gradient(160deg, #241840, #120c1e);
      border: 1px solid var(--line);
      box-shadow: var(--glow);
      transform: rotate(-3deg);
    }
    .card-shoe img {
      width: 100%;
      aspect-ratio: 4 / 4.3;
      object-fit: cover;
      animation: float 6s ease-in-out infinite;
    }
    @keyframes float {
      50% {
        transform: translateY(-10px) scale(1.02);
      }
    }
    .shoe-meta {
      position: absolute;
      left: 16px;
      bottom: 16px;
      display: grid;
      padding: 10px 16px;
      border-radius: 14px;
      background: rgb(12 9 18 / 0.75);
      backdrop-filter: blur(8px);
      font-size: 0.85rem;
    }
    .price-sticker {
      position: absolute;
      right: 0;
      bottom: 34px;
      display: grid;
      justify-items: end;
      padding: 12px 18px;
      border-radius: 18px;
      background: #0c0912;
      border: 2px solid var(--gold);
      transform: rotate(4deg);
      box-shadow: 0 18px 40px -10px rgb(247 197 72 / 0.45);
    }
    .price-sticker small {
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.14em;
      font-size: 0.68rem;
      color: var(--hot);
    }
    .price-sticker span {
      font-size: clamp(2rem, 5vw, 2.8rem);
      line-height: 1;
    }
    .mini {
      position: absolute;
      left: 0;
      top: 6%;
      width: 34%;
      max-width: 170px;
      aspect-ratio: 1;
      border-radius: 50%;
      overflow: hidden;
      padding: 4px;
      background: conic-gradient(#8b3dff, #f7c548, #ff3d55, #8b3dff);
    }
    .mini img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      border: 3px solid var(--bg);
    }
    .seal {
      position: absolute;
      right: 4%;
      top: 0;
      width: 112px;
      height: 112px;
      display: grid;
      place-items: center;
      border-radius: 50%;
      background: var(--brand-grad);
      color: #fff;
    }
    .seal svg {
      position: absolute;
      inset: 0;
      animation: spin 16s linear infinite;
      font-family: var(--font);
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.08em;
      fill: #fff;
    }
    .seal i {
      font-size: 2rem;
      color: var(--gold);
    }
    @keyframes spin {
      to {
        transform: rotate(360deg);
      }
    }

    /* ---------- Cintas ---------- */
    .tapes {
      position: relative;
      height: 130px;
      overflow: hidden;
      margin-block: 8px 24px;
    }
    .tape {
      position: absolute;
      left: -5%;
      width: 110%;
      top: 38px;
      padding-block: 12px;
      overflow: hidden;
    }
    .tape--gold {
      background: var(--gold-grad);
      color: #1a1203;
      transform: rotate(-2.5deg);
      z-index: 2;
      box-shadow: 0 10px 30px rgb(0 0 0 / 0.4);
    }
    .tape--purple {
      background: var(--brand);
      color: #fff;
      transform: rotate(2.5deg);
    }
    .tape-track {
      display: flex;
      width: max-content;
      animation: marquee 26s linear infinite;
    }
    .tape-track.rev {
      animation-direction: reverse;
    }
    .tape-set {
      display: flex;
      align-items: center;
      gap: 26px;
      padding-right: 26px;
      font-family: var(--font-display);
      font-size: 1.35rem;
      text-transform: uppercase;
      white-space: nowrap;
    }
    @keyframes marquee {
      to {
        transform: translateX(-50%);
      }
    }

    /* ---------- Encabezados ---------- */
    .sec-head {
      display: flex;
      justify-content: space-between;
      align-items: end;
      gap: 16px;
      margin-bottom: 26px;
    }
    .link-arrow {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      font-weight: 700;
      font-size: 0.9rem;
      white-space: nowrap;
    }

    /* ---------- Historias ---------- */
    .stories-sec {
      padding-block: 24px 64px;
    }
    .stories {
      display: flex;
      gap: 22px;
      overflow-x: auto;
      padding: 6px 2px 10px;
      scrollbar-width: none;
    }
    .stories::-webkit-scrollbar {
      display: none;
    }
    @media (min-width: 1100px) {
      .stories {
        justify-content: space-between;
      }
    }
    .story {
      flex: none;
      display: grid;
      justify-items: center;
      gap: 10px;
    }
    .ring {
      width: clamp(92px, 12vw, 138px);
      aspect-ratio: 1;
      border-radius: 50%;
      padding: 4px;
      background: conic-gradient(from 210deg, #f7c548, #ff3d55, #8b3dff, #f7c548);
      transition: transform var(--t) var(--ease);
    }
    .ring img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      border-radius: 50%;
      border: 4px solid var(--bg);
      transition: transform var(--t-zoom) var(--ease);
    }
    .story:hover .ring {
      transform: translateY(-4px) rotate(-4deg);
    }
    .story:hover .ring img {
      transform: scale(1.08);
    }
    .lbl {
      font-weight: 800;
      font-size: 0.82rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* ---------- Ofertas ---------- */
    .deals {
      padding-block: 64px;
      background:
        radial-gradient(700px 300px at 10% 0%, rgb(255 61 85 / 0.18), transparent 70%),
        linear-gradient(180deg, #160d29, #0c0912);
      border-block: 1px solid var(--line);
    }
    .deals-head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: end;
      gap: 24px;
      margin-bottom: 30px;
    }
    .deals-title {
      font-size: clamp(2.6rem, 7vw, 5.2rem);
      margin-top: 12px;
    }
    .countdown {
      display: grid;
      gap: 8px;
    }
    .cd-lbl {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.14em;
    }
    .cd {
      display: flex;
      gap: 8px;
    }
    .cd div {
      display: grid;
      justify-items: center;
      min-width: 64px;
      padding: 10px 8px;
      border-radius: 14px;
      background: var(--surface);
      border: 1px solid var(--line);
    }
    .cd strong {
      font-family: var(--font-display);
      font-weight: 400;
      font-size: 1.9rem;
      line-height: 1;
      color: var(--gold);
      font-variant-numeric: tabular-nums;
    }
    .cd small {
      font-size: 0.68rem;
      color: var(--ink-3);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* ---------- Carrusel ---------- */
    .new {
      padding-block: 72px 40px;
    }
    .arrows {
      display: flex;
      gap: 8px;
    }
    .arrows .icon-btn {
      border: 1px solid var(--line);
    }
    .rail {
      display: grid;
      grid-auto-flow: column;
      grid-auto-columns: minmax(220px, 72%);
      gap: 16px;
      overflow-x: auto;
      scroll-snap-type: x mandatory;
      padding-inline: max(16px, calc((100vw - var(--wrap)) / 2 + 32px));
      scroll-padding-inline: max(16px, calc((100vw - var(--wrap)) / 2 + 32px));
      scrollbar-width: none;
    }
    .rail::-webkit-scrollbar {
      display: none;
    }
    .rail > * {
      scroll-snap-align: start;
    }
    @media (min-width: 640px) {
      .rail {
        grid-auto-columns: minmax(240px, 38%);
      }
    }
    @media (min-width: 1024px) {
      .rail {
        grid-auto-columns: calc((min(100vw, var(--wrap)) - 64px - 48px) / 4);
      }
    }

    /* ---------- Banner ---------- */
    .promo {
      padding-block: 40px;
    }
    .promo-card {
      position: relative;
      border-radius: 28px;
      overflow: hidden;
      min-height: 380px;
      display: grid;
      align-items: end;
    }
    .promo-card img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .promo-card::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: 1;
      background: linear-gradient(90deg, rgb(12 9 18 / 0.95) 0%, rgb(42 15 92 / 0.7) 50%, transparent 100%);
    }
    .promo-copy {
      position: relative;
      z-index: 3;
      display: grid;
      gap: 16px;
      justify-items: start;
      padding: clamp(24px, 5vw, 56px);
    }
    .promo-copy h2 {
      font-size: clamp(2.2rem, 5.5vw, 4.4rem);
    }

    /* ---------- Destacados ---------- */
    .featured {
      padding-block: 56px 72px;
    }

    /* ---------- Cómo comprar ---------- */
    .how {
      padding-block: 72px;
      background: var(--surface);
      border-block: 1px solid var(--line);
    }
    .how-in {
      display: grid;
      gap: 36px;
    }
    @media (min-width: 960px) {
      .how-in {
        grid-template-columns: minmax(0, 0.9fr) minmax(0, 1.1fr);
        align-items: center;
      }
    }
    .how-copy {
      display: grid;
      gap: 18px;
      justify-items: start;
    }
    .steps {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 12px;
    }
    .steps li {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 18px 20px;
      border-radius: 18px;
      background: var(--bg);
      border: 1px solid var(--line);
      transition:
        border-color var(--t) var(--ease),
        transform var(--t) var(--ease);
    }
    .steps li:hover {
      border-color: var(--brand);
      transform: translateX(6px);
    }
    .steps .n {
      flex: none;
      width: 46px;
      height: 46px;
      border-radius: 50%;
      display: grid;
      place-items: center;
      background: var(--gold-grad);
      color: #1a1203;
      font-family: var(--font-display);
      font-size: 1.4rem;
    }
    .steps div {
      flex: 1;
    }
    .steps h3 {
      font-size: 1.05rem;
      margin-bottom: 2px;
    }
    .steps p {
      color: var(--ink-3);
      font-size: 0.9rem;
    }
    .steps > li > i {
      font-size: 1.8rem;
      color: var(--brand-2);
    }

    /* ---------- Visítanos ---------- */
    .visit {
      display: grid;
      gap: 36px;
      padding-block: 80px;
      align-items: center;
    }
    @media (min-width: 960px) {
      .visit {
        grid-template-columns: 1.1fr 1fr;
      }
    }
    .visit-media {
      position: relative;
      border-radius: 28px;
      overflow: hidden;
      aspect-ratio: 4 / 3;
    }
    .visit-media img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .live {
      position: absolute;
      z-index: 3;
      top: 16px;
      left: 16px;
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: var(--r-pill);
      background: rgb(12 9 18 / 0.8);
      font-weight: 700;
      font-size: 0.82rem;
    }
    .live i {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: var(--ok);
      box-shadow: 0 0 0 0 var(--ok);
      animation: pulse 1.8s infinite;
    }
    @keyframes pulse {
      70% {
        box-shadow: 0 0 0 10px transparent;
      }
    }
    .visit-copy {
      display: grid;
      gap: 18px;
      justify-items: start;
    }
    .visit-copy ul {
      list-style: none;
      margin: 0;
      padding: 0;
      display: grid;
      gap: 12px;
      color: var(--ink-2);
    }
    .visit-copy li {
      display: flex;
      gap: 12px;
      align-items: start;
    }
    .visit-copy li i {
      font-size: 1.3rem;
      color: var(--gold);
    }
    .btn--wa {
      background: #1faa53;
      color: #fff;
    }

    @media (prefers-reduced-motion: reduce) {
      .glow,
      .card-shoe img,
      .tape-track,
      .seal svg {
        animation: none;
      }
    }
  `,
})
export class Home {
  protected readonly settings = inject(SettingsService);
  private readonly products = inject(ProductsService);
  protected readonly img = IMAGES;
  protected readonly categories = CATEGORIES;
  private readonly rail = viewChild<ElementRef<HTMLElement>>('rail');
  private sliding = false;

  readonly newest = computed(() => this.products.visible().slice(0, 10));
  readonly featured = computed(() => this.products.visible().filter((p) => p.featured).slice(0, 8));
  readonly deals = computed(() => {
    const all = this.products.visible();
    const off = all.filter((p) => p.comparePrice && p.comparePrice > p.price);
    return [...off, ...all.filter((p) => p.featured && !off.includes(p))].slice(0, 4);
  });

  /** Cuenta regresiva hasta el domingo a medianoche: la oferta es de la semana. */
  private readonly now = signal(Date.now());
  readonly left = computed(() => {
    const end = new Date(this.now());
    end.setDate(end.getDate() + ((7 - end.getDay()) % 7));
    end.setHours(23, 59, 59, 999);
    const t = Math.max(0, end.getTime() - this.now());
    const pad = (n: number) => String(n).padStart(2, '0');
    return {
      d: pad(Math.floor(t / 86400000)),
      h: pad(Math.floor(t / 3600000) % 24),
      m: pad(Math.floor(t / 60000) % 60),
      s: pad(Math.floor(t / 1000) % 60),
    };
  });

  constructor() {
    const id = setInterval(() => this.now.set(Date.now()), 1000);
    inject(DestroyRef).onDestroy(() => clearInterval(id));
  }

  catImg(id: string) {
    return CAT_IMAGES[id];
  }

  /** Desplaza el carrusel con una curva lenta y suave. */
  scroll(dir: number) {
    const el = this.rail()?.nativeElement;
    if (!el || this.sliding) return;
    const card = el.firstElementChild as HTMLElement | null;
    const step = card ? card.offsetWidth + parseFloat(getComputedStyle(el).columnGap || '0') : el.clientWidth * 0.8;
    const perView = Math.max(1, Math.floor(el.clientWidth / step));
    const from = el.scrollLeft;
    const to = Math.max(0, Math.min(el.scrollWidth - el.clientWidth, from + dir * step * perView));
    if (to === from) return;
    const duration = 950;
    const start = performance.now();
    const ease = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
    this.sliding = true;
    el.style.scrollSnapType = 'none';
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration);
      el.scrollLeft = from + (to - from) * ease(t);
      if (t < 1) requestAnimationFrame(tick);
      else {
        el.style.scrollSnapType = '';
        this.sliding = false;
      }
    };
    requestAnimationFrame(tick);
  }
}
