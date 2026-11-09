export type Role = 'cliente' | 'vendedor' | 'admin';

export const ROLE_LABELS: Record<Role, string> = {
  cliente: 'Cliente',
  vendedor: 'Vendedor',
  admin: 'Administrador',
};

export const ROLE_DESCRIPTIONS: Record<Role, string> = {
  cliente: 'Compra en la tienda y ve sus pedidos.',
  vendedor: 'Revisa comprobantes, despacha pedidos y publica productos.',
  admin: 'Todo lo del vendedor, más usuarios, cuentas bancarias y ajustes.',
};

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: Role;
  active: boolean;
  passwordHash: string;
  createdAt: string;
}

export type Category = 'tenis' | 'ropa' | 'gorras' | 'perfumes' | 'relojes' | 'correas' | 'chancletas';

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'tenis', label: 'Tenis', icon: 'ph-sneaker' },
  { id: 'ropa', label: 'Ropa', icon: 'ph-t-shirt' },
  { id: 'gorras', label: 'Gorras', icon: 'ph-baseball-cap' },
  { id: 'perfumes', label: 'Perfumes', icon: 'ph-drop' },
  { id: 'relojes', label: 'Relojes', icon: 'ph-watch' },
  { id: 'correas', label: 'Correas', icon: 'ph-belt' },
  { id: 'chancletas', label: 'Chancletas', icon: 'ph-sneaker-move' },
];

export const SIZE_PRESETS: Record<Category, string[]> = {
  tenis: ['7', '7.5', '8', '8.5', '9', '9.5', '10', '10.5', '11', '12', '13'],
  ropa: ['S', 'M', 'L', 'XL', 'XXL', '30', '32', '34', '36'],
  gorras: ['Única', '7', '7 1/8', '7 1/4', '7 3/8', '7 1/2'],
  perfumes: ['50 ml', '100 ml', '200 ml'],
  relojes: ['Única'],
  correas: ['32', '34', '36', '38', '40', 'Única'],
  chancletas: ['7', '8', '9', '10', '11', '12', '13'],
};

export interface SizeStock {
  size: string;
  stock: number;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: Category;
  price: number;
  comparePrice?: number;
  description: string;
  images: string[];
  sizes: SizeStock[];
  isNew: boolean;
  featured: boolean;
  active: boolean;
  createdAt: string;
}

export interface Brand {
  id: string;
  name: string;
  /** Archivo en /marcas/*.svg. Si no hay, se muestra el nombre. */
  logo?: string;
}

export type MovementReason = 'entrada' | 'venta' | 'cancelacion' | 'ajuste';

export const MOVEMENT_LABELS: Record<MovementReason, string> = {
  entrada: 'Entrada de mercancía',
  venta: 'Venta',
  cancelacion: 'Pedido cancelado',
  ajuste: 'Ajuste de inventario',
};

/** Cada cambio de existencias queda anotado: quién, cuándo, cuánto y por qué. */
export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  brand: string;
  image: string;
  size: string;
  delta: number;
  reason: MovementReason;
  note: string;
  by: string;
  at: string;
}

export interface CartItem {
  productId: string;
  size: string;
  qty: number;
}

export type OrderStatus =
  | 'revision'
  | 'rechazado'
  | 'confirmado'
  | 'enviado'
  | 'listo'
  | 'entregado'
  | 'cancelado';

export const STATUS_LABELS: Record<OrderStatus, string> = {
  revision: 'Comprobante en revisión',
  rechazado: 'Comprobante rechazado',
  confirmado: 'Pago confirmado',
  enviado: 'En camino',
  listo: 'Listo para retirar',
  entregado: 'Entregado',
  cancelado: 'Cancelado',
};

export const STATUS_HELP: Record<OrderStatus, string> = {
  revision: 'Estamos verificando tu transferencia. Te avisamos en cuanto se confirme.',
  rechazado: 'No pudimos validar el comprobante. Revisa el motivo y sube uno nuevo.',
  confirmado: 'Recibimos tu pago. Estamos preparando tu pedido.',
  enviado: 'Tu pedido salió de la tienda y va de camino a tu dirección.',
  listo: 'Tu pedido está listo. Pasa por la tienda a retirarlo.',
  entregado: 'Pedido entregado. ¡Gracias por tu compra!',
  cancelado: 'Este pedido fue cancelado.',
};

export interface OrderItem {
  productId: string;
  name: string;
  brand: string;
  image: string;
  size: string;
  qty: number;
  price: number;
}

export interface Address {
  province: string;
  city: string;
  street: string;
  reference: string;
}

export interface StatusEvent {
  status: OrderStatus;
  at: string;
  by: string;
  note?: string;
}

export interface Order {
  id: string;
  number: number;
  userId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  total: number;
  delivery: 'envio' | 'retiro';
  shippingZone?: string;
  address?: Address;
  bankAccountId: string;
  bankSnapshot: string;
  proofImage: string;
  proofReference: string;
  status: OrderStatus;
  history: StatusEvent[];
  carrier?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BankAccount {
  id: string;
  bank: string;
  type: 'Ahorros' | 'Corriente';
  number: string;
  holder: string;
  holderId: string;
  color: string;
  active: boolean;
}

export interface ShippingZone {
  id: string;
  name: string;
  fee: number;
  eta: string;
}

export interface InstagramPost {
  url: string;
  image?: string;
  caption: string;
}

export interface StoreSettings {
  storeName: string;
  instagram: string;
  whatsapp: string;
  phone: string;
  address: string;
  hours: string;
  pickupNote: string;
  banks: BankAccount[];
  zones: ShippingZone[];
  instagramPosts: InstagramPost[];
  brands: Brand[];
}
