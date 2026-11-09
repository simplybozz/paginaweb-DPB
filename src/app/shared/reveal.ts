import { Directive, ElementRef, OnDestroy, OnInit, inject, input } from '@angular/core';

let observer: IntersectionObserver | null = null;

function getObserver() {
  observer ??= new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.add('rv-in');
          observer!.unobserve(e.target);
        }
      }
    },
    { threshold: 0.12, rootMargin: '0px 0px -6% 0px' },
  );
  return observer;
}

/**
 * Hace que el elemento aparezca suave (sube y se desvanece) cuando entra en pantalla.
 * `appReveal="2"` retrasa la entrada para que varios elementos lleguen uno tras otro.
 */
@Directive({ selector: '[appReveal]' })
export class Reveal implements OnInit, OnDestroy {
  readonly appReveal = input<number | string>('');
  private readonly el = inject(ElementRef<HTMLElement>).nativeElement as HTMLElement;

  ngOnInit() {
    const i = Number(this.appReveal()) || 0;
    if (typeof IntersectionObserver === 'undefined') return; // sin soporte: se muestra normal
    this.el.classList.add('rv');
    this.el.style.setProperty('--rv-i', String(Math.min(i, 8)));
    getObserver().observe(this.el);
  }

  ngOnDestroy() {
    observer?.unobserve(this.el);
  }
}
