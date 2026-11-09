import { Injectable, signal } from '@angular/core';
import { AuthService, PublicUser } from './auth.service';
import { DbService } from './db.service';
import { Role, User } from './models';

@Injectable({ providedIn: 'root' })
export class UsersService {
  private readonly all = signal<PublicUser[]>([]);
  readonly users = this.all.asReadonly();

  constructor(
    private db: DbService,
    private auth: AuthService,
  ) {
    this.load();
    db.onExternalChange(() => this.load());
  }

  load() {
    this.all.set(
      this.db
        .read<User[]>('users', [])
        .map(({ passwordHash: _, ...u }) => u)
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    );
  }

  setRole(id: string, role: Role): string | null {
    if (!this.auth.isAdmin()) return 'Solo un administrador puede cambiar roles.';
    const list = this.db.read<User[]>('users', []);
    const target = list.find((u) => u.id === id);
    if (!target) return 'Usuario no encontrado.';
    const admins = list.filter((u) => u.role === 'admin' && u.active).length;
    if (target.role === 'admin' && role !== 'admin' && admins <= 1) {
      return 'Debe quedar al menos un administrador.';
    }
    this.write(list.map((u) => (u.id === id ? { ...u, role } : u)));
    return null;
  }

  setActive(id: string, active: boolean): string | null {
    if (!this.auth.isAdmin()) return 'Solo un administrador puede hacer esto.';
    if (id === this.auth.user()?.id) return 'No puedes desactivar tu propia cuenta.';
    this.write(this.db.read<User[]>('users', []).map((u) => (u.id === id ? { ...u, active } : u)));
    return null;
  }

  private write(list: User[]) {
    this.db.write('users', list);
    this.load();
    this.auth.restore();
  }
}
