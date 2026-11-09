import { Component, input } from '@angular/core';

/** Marca D'Patron: "D'PATRON" en dorado condensado y "Boutique" en cursiva encima, como su logo. */
@Component({
  selector: 'app-logo',
  template: `
    <span class="mark" aria-hidden="true">
      <span class="d">D’</span><span class="patron">PATRON</span>
    </span>
    @if (!compact()) {
      <span class="script" aria-hidden="true">Boutique</span>
    }
    <span class="sr-only">D'Patron Boutique</span>
  `,
  styles: `
    :host {
      --s: 1;
      position: relative;
      display: inline-grid;
      justify-items: center;
      line-height: 0.9;
      padding-bottom: calc(10px * var(--s));
    }
    .mark {
      font-family: var(--font-display);
      font-size: calc(26px * var(--s));
      letter-spacing: 0.01em;
      background: var(--gold-grad);
      -webkit-background-clip: text;
      background-clip: text;
      color: transparent;
      filter: drop-shadow(0 calc(1.5px * var(--s)) 0 #4a1a9e);
    }
    .d {
      margin-right: 0.02em;
    }
    .script {
      position: absolute;
      bottom: calc(-4px * var(--s));
      right: calc(-6px * var(--s));
      font-family: var(--font-script);
      font-size: calc(17px * var(--s));
      color: #fff;
      transform: rotate(-6deg);
      text-shadow:
        0 0 calc(10px * var(--s)) rgb(139 61 255 / 0.9),
        0 1px 0 #5b1fd1;
      white-space: nowrap;
    }
    :host(.lg) {
      --s: 1.5;
    }
    :host(.xl) {
      --s: 3.2;
    }
  `,
})
export class Logo {
  readonly compact = input(false);
}
