import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { ToastService } from '../core/ui';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="wrap auth">
      <form class="card card-pad box" (ngSubmit)="submit()" novalidate>
        <h1 class="display">Crear cuenta</h1>
        <p class="muted">Con tu cuenta compras más rápido y ves el estado de cada pedido.</p>

        @if (error()) {
          <div class="notice notice--danger" role="alert"><i class="ph ph-warning-circle"></i>{{ error() }}</div>
        }

        <div class="field">
          <label for="name">Nombre y apellido</label>
          <input id="name" class="input" autocomplete="name" [(ngModel)]="name" name="name" [class.invalid]="tried() && name.trim().length < 3" />
          @if (tried() && name.trim().length < 3) {
            <span class="err">Escribe tu nombre completo.</span>
          }
        </div>
        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" class="input" type="email" autocomplete="email" [(ngModel)]="email" name="email" [class.invalid]="tried() && !emailOk()" />
          @if (tried() && !emailOk()) {
            <span class="err">Escribe un correo válido.</span>
          }
        </div>
        <div class="field">
          <label for="phone">Teléfono / WhatsApp</label>
          <input id="phone" class="input" type="tel" inputmode="tel" autocomplete="tel" [(ngModel)]="phone" name="phone" placeholder="809-000-0000" [class.invalid]="tried() && !phoneOk()" />
          @if (tried() && !phoneOk()) {
            <span class="err">Escribe un teléfono de 10 dígitos.</span>
          }
        </div>
        <div class="field">
          <label for="pass">Contraseña</label>
          <input id="pass" class="input" type="password" autocomplete="new-password" [(ngModel)]="password" name="password" [class.invalid]="tried() && password.length < 6" />
          <span class="hint">Mínimo 6 caracteres.</span>
          @if (tried() && password.length < 6) {
            <span class="err">La contraseña es muy corta.</span>
          }
        </div>
        <button class="btn btn--accent btn--block" type="submit" [disabled]="busy()">Crear mi cuenta</button>
        <p class="alt">¿Ya tienes cuenta? <a class="link" routerLink="/entrar" [queryParams]="{ volver: volver() }">Inicia sesión</a></p>
      </form>
    </div>
  `,
  styles: `
    .auth {
      padding-top: 40px;
      max-width: 520px;
    }
    @media (min-width: 768px) {
      .auth {
        padding-top: 64px;
      }
    }
    .box {
      display: grid;
      gap: 18px;
    }
    h1 {
      font-size: clamp(1.8rem, 4vw, 2.4rem);
    }
    .err {
      color: var(--danger);
      font-size: 0.8125rem;
    }
    .alt {
      text-align: center;
      font-size: 0.9375rem;
      color: var(--ink-2);
    }
  `,
})
export class Register {
  readonly volver = input<string>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  name = '';
  email = '';
  phone = '';
  password = '';
  readonly tried = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');

  emailOk() {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(this.email.trim());
  }

  phoneOk() {
    return this.phone.replace(/\D/g, '').length >= 10;
  }

  async submit() {
    this.tried.set(true);
    this.error.set('');
    if (this.name.trim().length < 3 || !this.emailOk() || !this.phoneOk() || this.password.length < 6) return;
    this.busy.set(true);
    const err = await this.auth.register({ name: this.name, email: this.email, phone: this.phone, password: this.password });
    this.busy.set(false);
    if (err) {
      this.error.set(err);
      return;
    }
    this.toast.show('Cuenta creada. ¡Bienvenido!');
    const back = this.volver();
    this.router.navigateByUrl(back && back.startsWith('/') ? back : '/');
  }
}
