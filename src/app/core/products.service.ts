import { computed, Injectable, signal } from '@angular/core';
import { DbService } from './db.service';
import { MovementReason, Product, StockMovement } from './models';

@Injectable({ providedIn: 'root' })
export class ProductsService {
  private readonly all = signal<Product[]>([]);
  private readonly moves = signal<StockMovement[]>([]);

  /** Historial del almacén, lo más reciente primero. */
  readonly movements = this.moves.asReadonly();

  /** Todos, incluidos los ocultos (para el panel). */
  readonly products = this.all.asReadonly();
  /** Solo los visibles en la tienda. */
  readonly visible = computed(() =>
    this.all()
      .filter((p) => p.active)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );

  constructor(private db: DbService) {
    this.load();
    db.onExternalChange(() => this.load());
  }

  load() {
    this.all.set(this.db.read<Product[]>('products', []));
    this.moves.set(this.db.read<StockMovement[]>('movements', []));
  }

  bySlug(slug: string) {
    return this.all().find((p) => p.slug === slug);
  }

  byId(id: string) {
    return this.all().find((p) => p.id === id);
  }

  totalStock(p: Product) {
    return p.sizes.reduce((s, x) => s + x.stock, 0);
  }

  save(input: Omit<Product, 'id' | 'slug' | 'createdAt'> & { id?: string }): Product {
    const list = this.db.read<Product[]>('products', []);
    let slug = slugify(input.name);
    if (list.some((p) => p.slug === slug && p.id !== input.id)) slug += '-' + Date.now().toString(36).slice(-4);

    let saved: Product;
    if (input.id) {
      const prev = list.find((p) => p.id === input.id)!;
      saved = { ...prev, ...input, id: prev.id, slug, createdAt: prev.createdAt };
      this.persist(list.map((p) => (p.id === saved.id ? saved : p)));
    } else {
      saved = { ...input, id: this.db.uid('p'), slug, createdAt: new Date().toISOString() };
      this.persist([saved, ...list]);
    }
    return saved;
  }

  setActive(id: string, active: boolean) {
    this.persist(this.db.read<Product[]>('products', []).map((p) => (p.id === id ? { ...p, active } : p)));
  }

  remove(id: string) {
    this.persist(this.db.read<Product[]>('products', []).filter((p) => p.id !== id));
  }

  /**
   * Suma o resta existencias de una talla y lo anota en el historial del almacén.
   * Lo usan los pedidos (venta y cancelación) y la pantalla de Almacén (entradas y ajustes).
   */
  adjustStock(
    changes: { productId: string; size: string; delta: number }[],
    reason: MovementReason = 'ajuste',
    by = 'Sistema',
    note = '',
  ) {
    const list = this.db.read<Product[]>('products', []);
    const log: StockMovement[] = [];
    const at = new Date().toISOString();
    for (const c of changes) {
      if (!c.delta) continue;
      const p = list.find((x) => x.id === c.productId);
      if (!p) continue;
      let s = p.sizes.find((x) => x.size === c.size);
      if (!s && c.delta > 0) {
        s = { size: c.size, stock: 0 };
        p.sizes.push(s);
      }
      if (!s) continue;
      const before = s.stock;
      s.stock = Math.max(0, s.stock + c.delta);
      const real = s.stock - before;
      if (real) {
        log.push({
          id: this.db.uid('m'), productId: p.id, productName: p.name, brand: p.brand, image: p.images[0] ?? '',
          size: s.size, delta: real, reason, note, by, at,
        });
      }
    }
    this.persist(list);
    if (log.length) {
      const next = [...log, ...this.db.read<StockMovement[]>('movements', [])].slice(0, 400);
      this.db.write('movements', next);
      this.moves.set(next);
    }
    return log.length;
  }

  private persist(list: Product[]) {
    this.db.write('products', list);
    this.all.set(list);
  }
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
