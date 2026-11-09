import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink],
  template: `
    <div class="wrap empty" style="padding-block: 96px">
      <i class="ph ph-sneaker-move"></i>
      <h3>Esta página no existe</h3>
      <p>Puede que el enlace esté mal escrito o que el producto ya no esté.</p>
      <a routerLink="/tienda" class="btn btn--dark">Ir a la tienda</a>
    </div>
  `,
})
export class NotFound {}
