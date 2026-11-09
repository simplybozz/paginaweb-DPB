import { computed, Injectable, signal } from '@angular/core';
import { DbService, hashPassword } from './db.service';
import { Role, User } from './models';

export type PublicUser = Omit<User, 'passwordHash'>;

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly current = signal<PublicUser | null>(null);

  readonly user = this.current.asReadonly();
  readonly isLoggedIn = computed(() => !!this.current());
  readonly isStaff = computed(() => {
    const r = this.current()?.role;
    return r === 'vendedor' || r === 'admin';
  });
  readonly isAdmin = computed(() => this.current()?.role === 'admin');

  constructor(private db: DbService) {
    this.restore();
    db.onExternalChange(() => this.restore());
  }

  /** Vuelve a leer la sesión (por si el admin cambió el rol en otra pestaña). */
  restore() {
    const id = this.db.read<string | null>('session', null);
    const u = id ? this.db.read<User[]>('users', []).find((x) => x.id === id) : undefined;
    this.current.set(u && u.active ? strip(u) : null);
  }

  hasRole(...roles: Role[]) {
    const r = this.current()?.role;
    return !!r && roles.includes(r);
  }

  async login(email: string, password: string): Promise<string | null> {
    const users = this.db.read<User[]>('users', []);
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    if (!u || u.passwordHash !== (await hashPassword(password))) {
      return 'Correo o contraseña incorrectos.';
    }
    if (!u.active) return 'Esta cuenta está desactivada. Escríbenos por WhatsApp.';
    this.db.write('session', u.id);
    this.current.set(strip(u));
    return null;
  }

  async register(data: { name: string; email: string; phone: string; password: string }): Promise<string | null> {
    const users = this.db.read<User[]>('users', []);
    const email = data.email.trim().toLowerCase();
    if (users.some((x) => x.email.toLowerCase() === email)) {
      return 'Ya existe una cuenta con ese correo. Inicia sesión.';
    }
    const u: User = {
      id: this.db.uid('u'),
      name: data.name.trim(),
      email,
      phone: data.phone.trim(),
      role: 'cliente', // todo registro nuevo entra como cliente; el admin asigna otros roles
      active: true,
      passwordHash: await hashPassword(data.password),
      createdAt: new Date().toISOString(),
    };
    this.db.write('users', [...users, u]);
    this.db.write('session', u.id);
    this.current.set(strip(u));
    return null;
  }

  updateProfile(data: { name: string; phone: string }) {
    const me = this.current();
    if (!me) return;
    const users = this.db.read<User[]>('users', []).map((u) =>
      u.id === me.id ? { ...u, name: data.name.trim(), phone: data.phone.trim() } : u,
    );
    this.db.write('users', users);
    this.restore();
  }

  logout() {
    this.db.remove('session');
    this.current.set(null);
  }
}

function strip(u: User): PublicUser {
  const { passwordHash: _, ...rest } = u;
  return rest;
}
