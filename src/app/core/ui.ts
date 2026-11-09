import { Injectable, Pipe, PipeTransform, signal } from '@angular/core';

export interface Toast {
  id: number;
  text: string;
  kind: 'ok' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  readonly toasts = signal<Toast[]>([]);
  private seq = 0;

  show(text: string, kind: Toast['kind'] = 'ok') {
    const t = { id: ++this.seq, text, kind };
    this.toasts.update((l) => [...l, t]);
    setTimeout(() => this.dismiss(t.id), kind === 'error' ? 6000 : 3500);
  }

  error(text: string) {
    this.show(text, 'error');
  }

  dismiss(id: number) {
    this.toasts.update((l) => l.filter((t) => t.id !== id));
  }
}

const money = new Intl.NumberFormat('es-DO', { style: 'currency', currency: 'DOP', maximumFractionDigits: 0 });

export function formatMoney(v: number) {
  return money.format(v).replace('DOP', 'RD$').replace(/\s/g, '');
}

@Pipe({ name: 'rd' })
export class MoneyPipe implements PipeTransform {
  transform(v: number | null | undefined) {
    return formatMoney(v ?? 0);
  }
}

const dateFmt = new Intl.DateTimeFormat('es-DO', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

@Pipe({ name: 'fecha' })
export class DatePipeEs implements PipeTransform {
  transform(v: string | null | undefined) {
    return v ? dateFmt.format(new Date(v)) : '';
  }
}

@Pipe({ name: 'hace' })
export class AgoPipe implements PipeTransform {
  transform(v: string) {
    const min = Math.round((Date.now() - new Date(v).getTime()) / 60000);
    if (min < 1) return 'ahora';
    if (min < 60) return `hace ${min} min`;
    const h = Math.round(min / 60);
    if (h < 24) return `hace ${h} h`;
    const d = Math.round(h / 24);
    return d === 1 ? 'ayer' : `hace ${d} días`;
  }
}

/**
 * Reduce una foto antes de guardarla (comprobantes y productos) para que
 * pese poco. Devuelve un data URL JPEG.
 */
export function compressImage(file: File, maxSide = 1200, quality = 0.78): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) return reject(new Error('El archivo debe ser una imagen (JPG o PNG).'));
    if (file.size > 15 * 1024 * 1024) return reject(new Error('La imagen pesa más de 15 MB.'));
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext('2d')!;
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', quality));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('No pudimos leer esa imagen. Prueba con otra.'));
    };
    img.src = url;
  });
}

export const DR_PROVINCES = [
  'Distrito Nacional', 'Santo Domingo', 'Santiago', 'Azua', 'Bahoruco', 'Barahona', 'Dajabón', 'Duarte',
  'El Seibo', 'Elías Piña', 'Espaillat', 'Hato Mayor', 'Hermanas Mirabal', 'Independencia', 'La Altagracia',
  'La Romana', 'La Vega', 'María Trinidad Sánchez', 'Monseñor Nouel', 'Monte Cristi', 'Monte Plata',
  'Pedernales', 'Peravia', 'Puerto Plata', 'Samaná', 'San Cristóbal', 'San José de Ocoa', 'San Juan',
  'San Pedro de Macorís', 'Sánchez Ramírez', 'Santiago Rodríguez', 'Valverde',
];
