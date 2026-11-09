import { computed, Injectable, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { CartLine } from './cart.service';
import { DbService } from './db.service';
import { Address, Order, OrderStatus } from './models';
import { ProductsService } from './products.service';
import { SettingsService } from './settings.service';

/** Qué estados puede tomar un pedido desde cada estado. */
const TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  revision: ['confirmado', 'rechazado', 'cancelado'],
  rechazado: ['revision', 'cancelado'],
  confirmado: ['enviado', 'listo', 'cancelado'],
  enviado: ['entregado'],
  listo: ['entregado'],
  entregado: [],
  cancelado: [],
};

/** Estados en los que el pedido aún tiene las existencias apartadas. */
const HOLDS_STOCK: OrderStatus[] = ['revision', 'rechazado', 'confirmado', 'enviado', 'listo', 'entregado'];

export interface CheckoutInput {
  lines: CartLine[];
  delivery: 'envio' | 'retiro';
  zoneId?: string;
  address?: Address;
  phone: string;
  bankAccountId: string;
  proofImage: string;
  proofReference: string;
}

@Injectable({ providedIn: 'root' })
export class OrdersService {
  private readonly all = signal<Order[]>([]);

  readonly orders = computed(() => [...this.all()].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  readonly mine = computed(() => {
    const id = this.auth.user()?.id;
    return this.orders().filter((o) => o.userId === id);
  });
  readonly pendingReview = computed(() => this.all().filter((o) => o.status === 'revision').length);
  readonly toDispatch = computed(() => this.all().filter((o) => o.status === 'confirmado').length);

  constructor(
    private db: DbService,
    private auth: AuthService,
    private products: ProductsService,
    private settings: SettingsService,
  ) {
    this.load();
    db.onExternalChange(() => this.load());
  }

  load() {
    this.all.set(this.db.read<Order[]>('orders', []));
  }

  byId(id: string) {
    return this.all().find((o) => o.id === id);
  }

  canMove(o: Order, to: OrderStatus) {
    if (!TRANSITIONS[o.status].includes(to)) return false;
    if (to === 'enviado') return o.delivery === 'envio';
    if (to === 'listo') return o.delivery === 'retiro';
    return true;
  }

  /** Crea el pedido, aparta las existencias y deja el comprobante en revisión. */
  create(input: CheckoutInput): { order?: Order; error?: string } {
    const user = this.auth.user();
    if (!user) return { error: 'Inicia sesión para completar tu compra.' };
    if (!input.lines.length) return { error: 'Tu carrito está vacío.' };

    this.products.load();
    for (const l of input.lines) {
      const fresh = this.products.byId(l.productId);
      const stock = fresh?.sizes.find((s) => s.size === l.size)?.stock ?? 0;
      if (!fresh?.active || stock < l.qty) {
        return { error: `Ya no hay suficiente "${l.product.name}" talla ${l.size}. Ajusta tu carrito.` };
      }
    }

    const s = this.settings.settings();
    const bank = s.banks.find((b) => b.id === input.bankAccountId);
    if (!bank) return { error: 'Elige la cuenta a la que transferiste.' };
    const zone = input.delivery === 'envio' ? s.zones.find((z) => z.id === input.zoneId) : undefined;
    if (input.delivery === 'envio' && !zone) return { error: 'Elige la zona de envío.' };

    const subtotal = input.lines.reduce((sum, l) => sum + l.product.price * l.qty, 0);
    const shippingFee = zone?.fee ?? 0;
    const now = new Date().toISOString();
    const number = this.db.read<number>('orderSeq', 1000) + 1;

    const order: Order = {
      id: this.db.uid('o'),
      number,
      userId: user.id,
      customerName: user.name,
      customerEmail: user.email,
      customerPhone: input.phone || user.phone,
      items: input.lines.map((l) => ({
        productId: l.productId,
        name: l.product.name,
        brand: l.product.brand,
        image: l.product.images[0] ?? '',
        size: l.size,
        qty: l.qty,
        price: l.product.price,
      })),
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      delivery: input.delivery,
      shippingZone: zone?.name,
      address: input.delivery === 'envio' ? input.address : undefined,
      bankAccountId: bank.id,
      bankSnapshot: `${bank.bank} · ${bank.type} ${bank.number}`,
      proofImage: input.proofImage,
      proofReference: input.proofReference.trim(),
      status: 'revision',
      history: [{ status: 'revision', at: now, by: user.name }],
      createdAt: now,
      updatedAt: now,
    };

    this.persist([order, ...this.db.read<Order[]>('orders', [])]);
    this.db.write('orderSeq', number);
    this.products.adjustStock(order.items.map((i) => ({ productId: i.productId, size: i.size, delta: -i.qty })), 'venta', order.customerName, `Pedido #${order.number}`);
    return { order };
  }

  /** Cambio de estado hecho por el personal (o por el cliente al cancelar). */
  move(id: string, to: OrderStatus, note?: string, carrier?: string): string | null {
    const o = this.byId(id);
    const me = this.auth.user();
    if (!o || !me) return 'Pedido no encontrado.';

    const isOwner = o.userId === me.id;
    const staff = this.auth.isStaff();
    const customerCancel = to === 'cancelado' && isOwner && (o.status === 'revision' || o.status === 'rechazado');
    if (!staff && !customerCancel) return 'No tienes permiso para hacer esto.';
    if (!this.canMove(o, to)) return 'Este cambio no es válido para el estado actual del pedido.';
    if (to === 'rechazado' && !note?.trim()) return 'Escribe el motivo del rechazo para que el cliente sepa qué corregir.';

    if (to === 'cancelado' && HOLDS_STOCK.includes(o.status)) {
      this.products.adjustStock(o.items.map((i) => ({ productId: i.productId, size: i.size, delta: i.qty })), 'cancelacion', this.auth.user()?.name ?? 'Sistema', `Pedido #${o.number}`);
    }
    this.update(o, to, me.name, note?.trim(), carrier?.trim());
    return null;
  }

  /** El cliente sube un comprobante nuevo después de un rechazo. */
  resubmitProof(id: string, image: string, reference: string): string | null {
    const o = this.byId(id);
    const me = this.auth.user();
    if (!o || !me || o.userId !== me.id) return 'Pedido no encontrado.';
    if (o.status !== 'rechazado') return 'Este pedido no necesita un comprobante nuevo.';
    this.update({ ...o, proofImage: image, proofReference: reference.trim() }, 'revision', me.name, 'Subió un comprobante nuevo');
    return null;
  }

  private update(o: Order, to: OrderStatus, by: string, note?: string, carrier?: string) {
    const now = new Date().toISOString();
    const next: Order = {
      ...o,
      status: to,
      carrier: carrier || o.carrier,
      updatedAt: now,
      history: [...o.history, { status: to, at: now, by, note: note || undefined }],
    };
    this.persist(this.db.read<Order[]>('orders', []).map((x) => (x.id === o.id ? next : x)));
  }

  private persist(list: Order[]) {
    this.db.write('orders', list);
    this.all.set(list);
  }
}
