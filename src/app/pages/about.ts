import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IMAGES } from '../core/seed';
import { SettingsService } from '../core/settings.service';
import { MoneyPipe } from '../core/ui';
import { InstagramFeed } from '../shared/instagram-feed';
import { Reveal } from '../shared/reveal';

@Component({
  selector: 'app-about',
  imports: [RouterLink, MoneyPipe, InstagramFeed, Reveal],
  template: `
    <section class="wrap intro">
      <div class="txt">
        <nav class="crumbs"><a routerLink="/">Inicio</a><span>/</span><span>Nosotros</span></nav>
        <h1 class="display lines">
          <span><span style="--l: 0">La boutique</span></span>
          <span><span style="--l: 1" class="gold-text">de los famosos</span></span>
        </h1>
        <p class="lead">
          D’Patron Boutique es la tienda dominicana donde compran los que saben: tenis Jordan y Nike, Cole Haan,
          ropa de marca, gorras New Era, perfumes, relojes Invicta, correas y chancletas. Todo 100% original,
          traído de Estados Unidos y con envío a todo el país.
        </p>
        <p class="lead">
          Con esta página puedes ver lo que hay en tienda, elegir tu talla y hacer tu pedido sin esperar respuesta por
          mensaje. Tú transfieres, subes el comprobante y nosotros nos encargamos del resto.
        </p>
      </div>
      <div class="pics" appReveal="1">
        <img class="a" [src]="img.storeWall" alt="Interior de tienda de ropa con percheros" loading="lazy" />
        <img class="b" [src]="img.lookbook3" alt="Hombre con t-shirt blanca y pantalón negro" loading="lazy" />
      </div>
    </section>

    <section class="wrap facts" appReveal>
      <div><strong class="display gold-text">46.9K</strong><span>seguidores en Instagram</span></div>
      <div><strong class="display gold-text">100%</strong><span>original, con caja</span></div>
      <div><strong class="display gold-text">L–S</strong><span>boutique abierta</span></div>
      <div><strong class="display gold-text">32</strong><span>provincias a las que enviamos</span></div>
    </section>

    <section class="wrap how" id="como-comprar">
      <h2 class="display h-section">Cómo comprar</h2>
      <div class="how-grid" appReveal>
        <ol>
          <li><strong>Elige tus productos.</strong> Entra a la tienda, escoge la talla y agrégalos al carrito.</li>
          <li><strong>Inicia sesión o crea tu cuenta.</strong> Así puedes ver el estado de tu pedido en todo momento.</li>
          <li><strong>Elige cómo recibirlo.</strong> Envío a tu dirección o retiro gratis en la tienda.</li>
          <li><strong>Transfiere.</strong> Escoge uno de nuestros bancos y transfiere el total que te mostramos.</li>
          <li><strong>Sube el comprobante.</strong> Adjunta la captura de la transferencia y envía el pedido.</li>
          <li><strong>Listo.</strong> Validamos el pago, preparamos tu pedido y te avisamos cuando salga.</li>
        </ol>
        <div class="faq">
          <details>
            <summary>¿Puedo pagar con tarjeta?</summary>
            <p>Por ahora solo recibimos transferencias bancarias. Puedes transferir desde la app de tu banco, aunque sea otro banco distinto al nuestro.</p>
          </details>
          <details>
            <summary>¿Qué pasa si suben mal el comprobante?</summary>
            <p>Si no podemos validarlo te decimos el motivo en tu pedido y puedes subir uno nuevo desde Mis pedidos, sin volver a comprar.</p>
          </details>
          <details>
            <summary>¿Me separan la talla mientras revisan el pago?</summary>
            <p>Sí. Desde que envías el pedido la talla queda apartada para ti mientras validamos la transferencia.</p>
          </details>
          <details>
            <summary>¿Puedo cancelar?</summary>
            <p>Mientras el comprobante esté en revisión puedes cancelar desde Mis pedidos. Si ya transferiste, escríbenos por WhatsApp para el reembolso.</p>
          </details>
        </div>
      </div>
    </section>

    <section class="wrap ship" id="envios">
      <div class="ship-card" appReveal>
        <h2 class="display h-section">Envíos</h2>
        <ul>
          @for (z of settings.settings().zones; track z.id) {
            <li><span>{{ z.name }}</span><span class="muted">{{ z.eta }}</span><strong class="price">{{ z.fee | rd }}</strong></li>
          }
          <li><span>Retiro en tienda</span><span class="muted">Cuando esté listo</span><strong>Gratis</strong></li>
        </ul>
      </div>
      <div class="contact" appReveal="1">
        <h3>¿Tienes una pregunta?</h3>
        <p class="muted">{{ settings.settings().hours }}</p>
        <a class="btn btn--sweep" [href]="settings.whatsappLink()" target="_blank" rel="noopener"><i class="ph ph-whatsapp-logo"></i> Escríbenos por WhatsApp</a>
        <a class="btn btn--sweep btn--outline" [href]="'tel:' + settings.settings().phone"><i class="ph ph-phone"></i> Llamar a la tienda</a>
      </div>
    </section>

    <app-instagram-feed />
  `,
  styles: `
    .intro {
      display: grid;
      gap: 40px;
      padding-top: 40px;
      align-items: center;
    }
    @media (min-width: 960px) {
      .intro {
        grid-template-columns: 1.1fr 1fr;
        gap: 64px;
        padding-top: 64px;
      }
    }
    .txt {
      display: grid;
      gap: 20px;
    }
    h1 {
      font-size: clamp(2.2rem, 5vw, 3.8rem);
    }
    .pics {
      position: relative;
      padding-bottom: 48px;
    }
    .pics .a {
      width: 82%;
      aspect-ratio: 4 / 5;
      object-fit: cover;
      border-radius: 22px;
      background: var(--surface-2);
    }
    .pics .b {
      position: absolute;
      right: 0;
      bottom: 0;
      width: 46%;
      aspect-ratio: 1;
      object-fit: cover;
      border-radius: 18px;
      border: 6px solid var(--bg);
      background: var(--surface-2);
    }
    .facts {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 28px 16px;
      margin-top: 72px;
      padding-block: 36px;
      border-block: 1px solid var(--line);
    }
    @media (min-width: 900px) {
      .facts {
        grid-template-columns: repeat(4, 1fr);
      }
    }
    .facts div {
      display: grid;
      gap: 6px;
    }
    .facts strong {
      font-size: clamp(1.8rem, 4vw, 2.8rem);
      color: var(--accent);
    }
    .facts span {
      color: var(--ink-2);
      font-size: 0.9375rem;
    }
    .how {
      padding-top: 88px;
      scroll-margin-top: var(--header-h);
    }
    .how-grid {
      display: grid;
      gap: 40px;
      margin-top: 28px;
    }
    @media (min-width: 960px) {
      .how-grid {
        grid-template-columns: 1fr 1fr;
        gap: 64px;
      }
    }
    ol {
      margin: 0;
      padding-left: 1.4em;
      display: grid;
      gap: 16px;
      color: var(--ink-2);
    }
    ol li::marker {
      font-weight: 800;
      color: var(--accent);
    }
    ol strong {
      color: var(--ink);
    }
    .faq details {
      border-bottom: 1px solid var(--line);
      padding: 18px 0;
    }
    .faq details:first-child {
      border-top: 1px solid var(--line);
    }
    .faq summary {
      font-weight: 650;
      cursor: pointer;
      list-style: none;
      display: flex;
      justify-content: space-between;
      gap: 12px;
    }
    .faq summary::after {
      content: '+';
      font-size: 1.3rem;
      line-height: 1;
      color: var(--ink-3);
    }
    .faq details[open] summary::after {
      content: '−';
    }
    .faq summary::-webkit-details-marker {
      display: none;
    }
    .faq p {
      color: var(--ink-2);
      margin-top: 10px;
    }
    .ship {
      padding-top: 88px;
      display: grid;
      gap: 20px;
      scroll-margin-top: var(--header-h);
    }
    @media (min-width: 960px) {
      .ship {
        grid-template-columns: 1.5fr 1fr;
      }
    }
    .ship-card {
      padding: 28px;
      border-radius: 20px;
      background: var(--ink);
      color: var(--bg);
    }
    .ship-card ul {
      list-style: none;
      margin: 24px 0 0;
      padding: 0;
    }
    .ship-card li {
      display: grid;
      grid-template-columns: 1fr auto;
      gap: 2px 16px;
      padding: 14px 0;
      border-top: 1px solid color-mix(in srgb, var(--bg) 18%, transparent);
    }
    .ship-card li .muted {
      grid-row: 2;
      color: color-mix(in srgb, var(--bg) 60%, transparent);
      font-size: 0.875rem;
    }
    .ship-card li strong {
      grid-row: 1 / 3;
      grid-column: 2;
      align-self: center;
    }
    .contact {
      display: grid;
      gap: 12px;
      align-content: start;
      padding: 28px;
      border-radius: 20px;
      border: 1px solid var(--line);
      background: var(--surface);
    }
    .contact h3 {
      font-size: 1.3rem;
    }
  `,
})
export class About {
  protected readonly settings = inject(SettingsService);
  protected readonly img = IMAGES;
}
