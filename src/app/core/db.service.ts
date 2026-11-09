import { Injectable } from '@angular/core';
import { Order, Product, StockMovement, StoreSettings, User } from './models';
import { SAMPLE_PROOF, SEED_PRODUCTS, SEED_SETTINGS } from './seed';

/**
 * Base de datos de la DEMO: guarda todo en localStorage de este navegador.
 * Para producción se reemplaza por Supabase (ver README). Los servicios son
 * la única puerta a los datos, así que el cambio queda contenido en ellos.
 */
const PREFIX = 'dpatron:';
const DB_VERSION = '4';

export const DEMO_PASSWORD = 'demo1234';
export const DEMO_ACCOUNTS = [
  { role: 'admin', label: 'Administrador', email: 'admin@dpatron.do', name: 'Administración D’Patron', phone: '809-388-3806' },
  { role: 'vendedor', label: 'Vendedor', email: 'ventas@dpatron.do', name: 'Yeuri Santana', phone: '829-555-0142' },
  { role: 'cliente', label: 'Cliente', email: 'cliente@correo.do', name: 'Carlos Tavárez', phone: '809-555-0187' },
] as const;

export class StorageFullError extends Error {
  constructor() {
    super('El almacenamiento de la demo está lleno. Usa imágenes más livianas o reinicia la demo.');
  }
}

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode('dpatron::' + password);
  const buf = await crypto.subtle.digest('SHA-256', data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

@Injectable({ providedIn: 'root' })
export class DbService {
  private listeners: (() => void)[] = [];

  constructor() {
    // Si el panel está abierto en otra pestaña, los cambios se reflejan aquí.
    window.addEventListener('storage', (e) => {
      if (e.key?.startsWith(PREFIX)) this.listeners.forEach((fn) => fn());
    });
  }

  onExternalChange(fn: () => void) {
    this.listeners.push(fn);
  }

  read<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? (JSON.parse(raw) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  write<T>(key: string, value: T) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      throw new StorageFullError();
    }
  }

  remove(key: string) {
    localStorage.removeItem(PREFIX + key);
  }

  uid(prefix = '') {
    return prefix + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
  }

  async init() {
    if (this.read<string>('version', '') === DB_VERSION) return;
    await this.seed();
  }

  async reset() {
    Object.keys(localStorage)
      .filter((k) => k.startsWith(PREFIX))
      .forEach((k) => localStorage.removeItem(k));
    await this.seed();
  }

  private async seed() {
    const hash = await hashPassword(DEMO_PASSWORD);
    const now = Date.now();
    const users: User[] = DEMO_ACCOUNTS.map((a, i) => ({
      id: 'u' + (i + 1),
      name: a.name,
      email: a.email,
      phone: a.phone,
      role: a.role,
      active: true,
      passwordHash: hash,
      createdAt: new Date(now - (90 - i * 20) * 86400000).toISOString(),
    }));
    users.push(
      {
        id: 'u4', name: 'Yokasta Ramírez', email: 'yokasta@correo.do', phone: '849-555-0113',
        role: 'cliente', active: true, passwordHash: hash,
        createdAt: new Date(now - 12 * 86400000).toISOString(),
      },
      {
        id: 'u5', name: 'Luis Ángel Feliz', email: 'luisangel@correo.do', phone: '809-555-0164',
        role: 'cliente', active: true, passwordHash: hash,
        createdAt: new Date(now - 5 * 86400000).toISOString(),
      },
    );

    const products: Product[] = structuredClone(SEED_PRODUCTS);
    const bank = SEED_SETTINGS.banks[0];
    const snap = `${bank.bank} · ${bank.type} ${bank.number}`;
    const ago = (h: number) => new Date(now - h * 3600000).toISOString();
    const item = (pid: string, size: string, qty = 1) => {
      const pr = products.find((x) => x.id === pid)!;
      return { productId: pid, name: pr.name, brand: pr.brand, image: pr.images[0], size, qty, price: pr.price };
    };
    const order = (o: Partial<Order> & Pick<Order, 'id' | 'number' | 'items' | 'status' | 'history'>, u: User): Order => {
      const subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0);
      const fee = o.delivery === 'retiro' ? 0 : (o.shippingFee ?? 250);
      return {
        userId: u.id, customerName: u.name, customerEmail: u.email, customerPhone: u.phone,
        subtotal, shippingFee: fee, total: subtotal + fee, delivery: 'envio',
        bankAccountId: bank.id, bankSnapshot: snap, proofImage: SAMPLE_PROOF, proofReference: '',
        createdAt: o.history[0].at, updatedAt: o.history[o.history.length - 1].at,
        ...o,
      } as Order;
    };
    const addr = (province: string, city: string, street: string, reference: string) => ({ province, city, street, reference });
    const [, seller, client, yokasta, luis] = users;

    const orders: Order[] = [
      order({
        id: 'o1', number: 1004, items: [item('p1', '9'), item('p16', '7 1/4')], status: 'revision',
        address: addr('Santo Domingo', 'Santo Domingo Este, Ensanche Ozama', 'C/ Respaldo Venezuela #12', 'Frente al colmado La Esquina'),
        shippingZone: 'Santo Domingo y Distrito Nacional', proofReference: '84720193',
        history: [{ status: 'revision', at: ago(1.2), by: luis.name }],
      }, luis),
      order({
        id: 'o2', number: 1003, items: [item('p18', '100 ml'), item('p21', 'Única')], status: 'revision',
        delivery: 'retiro', proofReference: '55102877',
        history: [{ status: 'revision', at: ago(3.5), by: yokasta.name }],
      }, yokasta),
      order({
        id: 'o3', number: 1002, items: [item('p13', '32')], status: 'confirmado',
        address: addr('Santiago', 'Santiago de los Caballeros, Los Jardines', 'Av. 27 de Febrero #88', 'Edificio azul, apto 3B'),
        shippingZone: 'Santiago y zona norte', shippingFee: 350,
        history: [
          { status: 'revision', at: ago(26), by: client.name },
          { status: 'confirmado', at: ago(24), by: seller.name },
        ],
      }, client),
      order({
        id: 'o4', number: 1001, items: [item('p2', '10')], status: 'entregado',
        address: addr('Distrito Nacional', 'Santo Domingo, Naco', 'C/ Fantino Falco #20', ''),
        shippingZone: 'Santo Domingo y Distrito Nacional', carrier: 'Mensajero de la tienda',
        history: [
          { status: 'revision', at: ago(120), by: client.name },
          { status: 'confirmado', at: ago(118), by: seller.name },
          { status: 'enviado', at: ago(100), by: seller.name, note: 'Sale con el mensajero de la tienda' },
          { status: 'entregado', at: ago(80), by: seller.name },
        ],
      }, client),
    ];

    this.write('users', users);
    this.write('products', products);
    this.write('settings', SEED_SETTINGS);
    this.write('orders', orders);
    this.write('orderSeq', 1004);
    // Historial de almacén de ejemplo: entradas de mercancía y ventas recientes.
    const mv = (pid: string, size: string, delta: number, reason: StockMovement['reason'], h: number, by: string, note = ''): StockMovement => {
      const pr = products.find((x) => x.id === pid)!;
      return { id: 'm' + pid + size + h, productId: pid, productName: pr.name, brand: pr.brand, image: pr.images[0], size, delta, reason, note, by, at: ago(h) };
    };
    const movements: StockMovement[] = [
      mv('p1', '9', -1, 'venta', 1.2, luis.name, 'Pedido #1004'),
      mv('p18', '100 ml', -1, 'venta', 3.5, yokasta.name, 'Pedido #1003'),
      mv('p1', '10', 6, 'entrada', 20, seller.name, 'Llegó contenedor de Miami'),
      mv('p1', '9', 6, 'entrada', 20, seller.name, 'Llegó contenedor de Miami'),
      mv('p3', '9', 4, 'entrada', 20, seller.name, 'Llegó contenedor de Miami'),
      mv('p13', '32', -1, 'venta', 26, client.name, 'Pedido #1002'),
      mv('p21', 'Única', 3, 'entrada', 48, users[0].name, 'Restock Invicta'),
      mv('p5', '10.5', -1, 'ajuste', 70, seller.name, 'Par con defecto, se devolvió al suplidor'),
    ];
    this.write('movements', movements);
    this.write('version', DB_VERSION);
  }
}
