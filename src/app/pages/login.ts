import { Component, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../core/auth.service';
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../core/db.service';
import { ToastService } from '../core/ui';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink],
  template: `
    <div class="wrap auth">
      <form class="card card-pad box" (ngSubmit)="submit()" novalidate>
        <h1 class="display">Iniciar sesión</h1>
        <p class="muted">Entra para pagar y ver el estado de tus pedidos.</p>

        @if (error()) {
          <div class="notice notice--danger" role="alert"><i class="ph ph-warning-circle"></i>{{ error() }}</div>
        }

        <div class="field">
          <label for="email">Correo electrónico</label>
          <input id="email" class="input" type="email" autocomplete="email" [(ngModel)]="email" name="email" required />
        </div>
        <div class="field">
          <label for="pass">Contraseña</label>
          <div class="pw">
            <input id="pass" class="input" [type]="show() ? 'text' : 'password'" autocomplete="current-password" [(ngModel)]="password" name="password" required />
            <button type="button" class="icon-btn icon-btn--sm" (click)="show.set(!show())" [attr.aria-label]="show() ? 'Ocultar contraseña' : 'Mostrar contraseña'">
              <i class="ph" [class.ph-eye]="!show()" [class.ph-eye-slash]="show()"></i>
            </button>
          </div>
        </div>
        <button class="btn btn--accent btn--block" type="submit" [disabled]="busy()">Entrar</button>
        <p class="alt">¿No tienes cuenta? <a class="link" routerLink="/registro" [queryParams]="{ volver: volver() }">Crea una aquí</a></p>
      </form>

      <aside class="demo card card-pad">
        <h2>Probar la demo</h2>
        <p class="muted">Entra con un clic como cada tipo de usuario para ver sus pantallas. Contraseña de todas: <code>{{ demoPassword }}</code></p>
        @for (a of demo; track a.email) {
          <button class="choice" type="button" (click)="quick(a.email)">
            <i class="ph" [class]="'ph ' + icon(a.role)"></i>
            <span><strong>{{ a.label }}</strong><br /><span class="muted">{{ a.email }}</span></span>
            <i class="ph ph-arrow-right go"></i>
          </button>
        }
      </aside>
    </div>
  `,
  styles: `
    .auth {
      display: grid;
      gap: 20px;
      padding-top: 40px;
      max-width: 980px;
    }
    @media (min-width: 860px) {
      .auth {
        grid-template-columns: 1.1fr 1fr;
        align-items: start;
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
    .pw {
      position: relative;
    }
    .pw .input {
      padding-right: 48px;
    }
    .pw button {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
    }
    .alt {
      text-align: center;
      font-size: 0.9375rem;
      color: var(--ink-2);
    }
    .demo {
      display: grid;
      gap: 12px;
      background: var(--surface-2);
      border-style: dashed;
    }
    .demo h2 {
      font-size: 1.1rem;
    }
    .demo .choice {
      align-items: center;
    }
    .demo .choice > i {
      font-size: 1.5rem;
      color: var(--accent);
    }
    .go {
      margin-left: auto;
      color: var(--ink-3) !important;
      font-size: 1.1rem !important;
    }
    code {
      font-weight: 700;
      color: var(--ink);
    }
  `,
})
export class Login {
  readonly volver = input<string>();
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  protected readonly demo = DEMO_ACCOUNTS;
  protected readonly demoPassword = DEMO_PASSWORD;
  email = '';
  password = '';
  readonly show = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');

  icon(role: string) {
    return role === 'admin' ? 'ph-crown-simple' : role === 'vendedor' ? 'ph-storefront' : 'ph-user';
  }

  quick(email: string) {
    this.email = email;
    this.password = DEMO_PASSWORD;
    this.submit();
  }

  async submit() {
    this.error.set('');
    if (!this.email.trim() || !this.password) {
      this.error.set('Escribe tu correo y tu contraseña.');
      return;
    }
    this.busy.set(true);
    const err = await this.auth.login(this.email, this.password);
    this.busy.set(false);
    if (err) {
      this.error.set(err);
      return;
    }
    const u = this.auth.user()!;
    this.toast.show(`Hola, ${u.name.split(' ')[0]}`);
    const back = this.volver();
    this.router.navigateByUrl(back && back.startsWith('/') ? back : this.auth.isStaff() ? '/panel' : '/');
  }
}
