import { computed, Injectable, signal } from '@angular/core';
import { DbService } from './db.service';
import { CartItem, Product } from './models';
import { ProductsService } from './products.service';

export interface CartLine extends CartItem {
  product: Product;
  available: number;
  lineTotal: number;
}

@Injectable({ providedIn: 'root' })
export class CartService {
  private readonly items = signal<CartItem[]>([]);
  readonly drawerOpen = signal(false);

  readonly lines = computed<CartLine[]>(() =>
    this.items()
      .map((i) => {
        const product = this.products.byId(i.productId);
        if (!product || !product.active) return null;
        const available = product.sizes.find((s) => s.size === i.size)?.stock ?? 0;
        return { ...i, product, available, lineTotal: product.price * i.qty };
      })
      .filter((x): x is CartLine => !!x),
  );
  readonly count = computed(() => this.lines().reduce((s, l) => s + l.qty, 0));
  readonly subtotal = computed(() => this.lines().reduce((s, l) => s + l.lineTotal, 0));
  /** Líneas que piden más de lo que hay en existencia. */
  readonly problems = computed(() => this.lines().filter((l) => l.qty > l.available));

  constructor(
    private db: DbService,
    private products: ProductsService,
  ) {
    this.items.set(db.read<CartItem[]>('cart', []));
    db.onExternalChange(() => this.items.set(db.read<CartItem[]>('cart', [])));
  }

  add(productId: string, size: string, qty = 1) {
    const list = [...this.items()];
    const found = list.find((i) => i.productId === productId && i.size === size);
    if (found) found.qty += qty;
    else list.push({ productId, size, qty });
    this.persist(list);
  }

  setQty(productId: string, size: string, qty: number) {
    if (qty < 1) return this.remove(productId, size);
    this.persist(this.items().map((i) => (i.productId === productId && i.size === size ? { ...i, qty } : i)));
  }

  remove(productId: string, size: string) {
    this.persist(this.items().filter((i) => !(i.productId === productId && i.size === size)));
  }

  clear() {
    this.persist([]);
  }

  private persist(list: CartItem[]) {
    this.items.set(list);
    this.db.write('cart', list);
  }
}
