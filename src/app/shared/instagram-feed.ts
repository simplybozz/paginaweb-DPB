import { Component, computed, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { SettingsService } from '../core/settings.service';
import { Reveal } from './reveal';

interface Tile {
  url: string;
  caption: string;
  image?: string;
  embed?: SafeResourceUrl;
}

/**
 * Últimas 6 publicaciones. El admin pega los enlaces en Ajustes.
 * Si la publicación tiene portada subida se muestra esa imagen; si no,
 * se usa la vista incrustada oficial de Instagram recortada al cuadro.
 */
@Component({
  selector: 'app-instagram-feed',
  imports: [Reveal],
  template: `
    <section class="ig wrap" aria-labelledby="ig-title">
      <div class="head" appReveal>
        <h2 id="ig-title" class="display h-section">En Instagram</h2>
        <a class="handle" [href]="settings.instagramLink()" target="_blank" rel="noopener">
          <i class="ph ph-instagram-logo"></i>&#64;{{ settings.settings().instagram }}
        </a>
      </div>
      <div class="grid">
        @for (t of tiles(); track t.url; let i = $index) {
          <a class="tile" [appReveal]="i" [href]="t.url" target="_blank" rel="noopener" [attr.aria-label]="'Ver en Instagram: ' + t.caption">
            @if (t.image) {
              <img [src]="t.image" [alt]="t.caption" loading="lazy" />
            } @else {
              <iframe [src]="t.embed" loading="lazy" tabindex="-1" title="Publicación de Instagram" scrolling="no"></iframe>
            }
            <span class="hover"><i class="ph ph-arrow-up-right"></i>{{ t.caption }}</span>
          </a>
        }
      </div>
      <a class="btn btn--ghost follow" [href]="settings.instagramLink()" target="_blank" rel="noopener">
        <i class="ph ph-instagram-logo"></i> Seguir en Instagram
      </a>
    </section>
  `,
  styles: `
    .ig {
      padding-block: 72px;
    }
    .head {
      display: flex;
      flex-wrap: wrap;
      align-items: end;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 28px;
    }
    .handle {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      font-weight: 650;
      color: var(--ink-2);
    }
    .handle:hover {
      color: var(--accent);
    }
    .handle i {
      font-size: 1.3rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
    }
    @media (min-width: 768px) {
      .grid {
        grid-template-columns: repeat(3, 1fr);
        gap: 12px;
      }
    }
    @media (min-width: 1100px) {
      .grid {
        grid-template-columns: repeat(6, 1fr);
      }
    }
    .tile {
      position: relative;
      aspect-ratio: 1;
      overflow: hidden;
      border-radius: var(--r-card);
      background: var(--surface-2);
      isolation: isolate;
    }
    .tile img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform var(--t-zoom) var(--ease);
    }
    .tile:hover img {
      transform: scale(1.06);
    }
    /* Recorta el encabezado del embed para que solo se vea la foto. */
    .tile iframe {
      position: absolute;
      top: -56px;
      left: 0;
      width: 100%;
      height: calc(100% + 400px);
      border: 0;
      pointer-events: none;
      background: var(--surface-2);
    }
    .hover {
      position: absolute;
      inset: 0;
      z-index: 1;
      display: flex;
      align-items: end;
      gap: 6px;
      padding: 14px;
      color: #fff;
      font-weight: 650;
      font-size: 0.875rem;
      background: linear-gradient(to top, rgb(0 0 0 / 0.65), transparent 55%);
      opacity: 0;
      transition: opacity var(--t) var(--ease);
    }
    .tile:hover .hover,
    .tile:focus-visible .hover {
      opacity: 1;
    }
    @media (hover: none) {
      .hover {
        opacity: 1;
        font-size: 0.8rem;
      }
    }
    .follow {
      margin-top: 28px;
    }
  `,
})
export class InstagramFeed {
  protected readonly settings = inject(SettingsService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly tiles = computed<Tile[]>(() =>
    this.settings
      .settings()
      .instagramPosts.filter((p) => p.url)
      .slice(0, 6)
      .map((p) => ({
        ...p,
        embed: p.image ? undefined : this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl(p.url)),
      })),
  );
}

function embedUrl(url: string) {
  const m = url.match(/instagram\.com\/(?:[^/]+\/)?(p|reel|tv)\/([^/?#]+)/);
  return m ? `https://www.instagram.com/p/${m[2]}/embed/` : 'about:blank';
}
