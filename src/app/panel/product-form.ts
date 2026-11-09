import { Component, computed, effect, inject, input, signal, untracked } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { StorageFullError } from '../core/db.service';
import { CATEGORIES, Category, SIZE_PRESETS, SizeStock } from '../core/models';
import { ProductsService } from '../core/products.service';
import { SettingsService } from '../core/settings.service';
import { compressImage, MoneyPipe, ToastService } from '../core/ui';

@Component({
  selector: 'app-product-form',
  imports: [FormsModule, RouterLink, MoneyPipe],
  template: `
    <nav class="crumbs"><a routerLink="/panel/productos">Productos</a><span>/</span><span>{{ isNew() ? 'Nuevo' : 'Editar' }}</span></nav>
    <header class="head">
      <h1>{{ isNew() ? 'Nuevo producto' : 'Editar producto' }}</h1>
      @if (!isNew() && slug()) {
        <a class="btn btn--ghost btn--sm" [routerLink]="['/producto', slug()]" target="_blank"><i class="ph ph-arrow-square-out"></i>Ver en la tienda</a>
      }
    </header>

    @if (notFound()) {
      <div class="empty card">
        <i class="ph ph-sneaker"></i>
        <h3>Producto no encontrado</h3>
        <a routerLink="/panel/productos" class="btn btn--dark">Volver</a>
      </div>
    } @else {
      <form class="layout" (ngSubmit)="save()" novalidate>
        <div class="col">
          <section class="card card-pad sec">
            <h2>Fotos</h2>
            <p class="muted sm">La primera foto es la principal. Usa fotos cuadradas y con buena luz.</p>
            <div class="photos">
              @for (src of images(); track src; let i = $index) {
                <div class="ph-item" [class.main]="i === 0">
                  <img [src]="src" alt="" />
                  @if (i === 0) {
                    <span class="tag">Principal</span>
                  }
                  <div class="ph-actions">
                    @if (i > 0) {
                      <button type="button" class="icon-btn icon-btn--sm" (click)="makeMain(i)" title="Usar como principal" aria-label="Usar como principal"><i class="ph ph-star"></i></button>
                    }
                    <button type="button" class="icon-btn icon-btn--sm" (click)="removeImg(i)" title="Quitar foto" aria-label="Quitar foto"><i class="ph ph-trash"></i></button>
                  </div>
                </div>
              }
              <label class="add-photo">
                @if (uploading()) {
                  <i class="ph ph-spinner-gap"></i><span>Subiendo…</span>
                } @else {
                  <i class="ph ph-camera-plus"></i><span>Agregar fotos</span>
                }
                <input type="file" accept="image/*" multiple class="sr-only" (change)="addFiles($event)" />
              </label>
            </div>
            <details class="url">
              <summary>O pegar el enlace de una imagen</summary>
              <div class="url-row">
                <input class="input" [(ngModel)]="imgUrl" name="imgUrl" placeholder="https://…" />
                <button type="button" class="btn btn--ghost btn--sm" (click)="addUrl()">Agregar</button>
              </div>
            </details>
            @if (tried() && !images().length) {
              <p class="err">Agrega al menos una foto.</p>
            }
          </section>

          <section class="card card-pad sec">
            <h2>Información</h2>
            <div class="form-grid form-grid--2">
              <div class="field span-2">
                <label for="name">Nombre del producto</label>
                <input id="name" class="input" [(ngModel)]="name" name="name" placeholder='Ej. Air Jordan 1 High "Chicago"' [class.invalid]="tried() && !name.trim()" />
                @if (tried() && !name.trim()) {
                  <span class="err">Escribe el nombre.</span>
                }
              </div>
              <div class="field">
                <label for="cat">Categoría</label>
                <select id="cat" class="select" [ngModel]="category()" (ngModelChange)="category.set($event)" name="cat">
                  @for (c of categories; track c.id) {
                    <option [value]="c.id">{{ c.label }}</option>
                  }
                </select>
              </div>
              <div class="field">
                <label for="brand">Marca</label>
                <input id="brand" class="input" [(ngModel)]="brand" name="brand" list="brands" placeholder="Elige o escribe una marca" [class.invalid]="tried() && !brand.trim()" />
                <datalist id="brands">
                  @for (b of settings.settings().brands; track b.id) {
                    <option [value]="b.name"></option>
                  }
                </datalist>
                @if (tried() && !brand.trim()) {
                  <span class="err">Escribe la marca.</span>
                }
              </div>
              <div class="field">
                <label for="price">Precio (RD$)</label>
                <input id="price" class="input" type="number" min="0" inputmode="numeric" [(ngModel)]="price" name="price" [class.invalid]="tried() && !(price > 0)" />
                @if (tried() && !(price > 0)) {
                  <span class="err">Escribe el precio.</span>
                }
              </div>
              <div class="field">
                <label for="cprice">Precio anterior <span class="muted">(opcional)</span></label>
                <input id="cprice" class="input" type="number" min="0" inputmode="numeric" [(ngModel)]="comparePrice" name="cprice" />
                <span class="hint">Si lo llenas, el producto sale como oferta tachando este precio.</span>
              </div>
              <div class="field span-2">
                <label for="desc">Descripción <span class="muted">(opcional)</span></label>
                <textarea id="desc" class="textarea" [(ngModel)]="description" name="desc" placeholder="Material, colores, cómo talla…"></textarea>
              </div>
            </div>
          </section>

          <section class="card card-pad sec">
            <div class="sec-head">
              <h2>Tallas y existencia</h2>
              <button type="button" class="btn btn--ghost btn--sm" (click)="usePreset()"><i class="ph ph-magic-wand"></i>Usar tallas de {{ catName() }}</button>
            </div>
            <p class="muted sm">Pon cuántos pares o piezas tienes de cada talla. Con 0 la talla aparece agotada.</p>
            @if (sizes().length) {
              <div class="sizes">
                @for (s of sizes(); track $index; let i = $index) {
                  <div class="size-row">
                    <input class="input" [ngModel]="s.size" (ngModelChange)="setSize(i, 'size', $event)" [name]="'s' + i" aria-label="Talla" />
                    <div class="stepper">
                      <button type="button" class="icon-btn icon-btn--sm" (click)="setSize(i, 'stock', s.stock - 1)" aria-label="Menos"><i class="ph ph-minus"></i></button>
                      <input class="input" type="number" min="0" [ngModel]="s.stock" (ngModelChange)="setSize(i, 'stock', $event)" [name]="'q' + i" aria-label="Cantidad" />
                      <button type="button" class="icon-btn icon-btn--sm" (click)="setSize(i, 'stock', s.stock + 1)" aria-label="Más"><i class="ph ph-plus"></i></button>
                    </div>
                    <button type="button" class="icon-btn icon-btn--sm" (click)="removeSize(i)" aria-label="Quitar talla"><i class="ph ph-x"></i></button>
                  </div>
                }
              </div>
            }
            <button type="button" class="link add-size" (click)="addSize()"><i class="ph ph-plus"></i> Agregar talla</button>
            @if (tried() && !sizes().length) {
              <p class="err">Agrega al menos una talla (para accesorios usa “Única”).</p>
            }
            <p class="total">Total en existencia: <strong>{{ totalStock() }}</strong></p>
          </section>
        </div>

        <aside class="col side">
          <section class="card card-pad sec">
            <h2>Publicación</h2>
            <label class="check"><input type="checkbox" [(ngModel)]="active" name="active" /> Visible en la tienda</label>
            <label class="check"><input type="checkbox" [(ngModel)]="isNewTag" name="isNew" /> Marcar como “Nuevo”</label>
            <label class="check"><input type="checkbox" [(ngModel)]="featured" name="featured" /> Mostrar en “Los más pedidos”</label>
          </section>

          @if (images().length && name) {
            <section class="card card-pad preview">
              <h2>Así se verá</h2>
              <img [src]="images()[0]" alt="" />
              <span class="muted sm">{{ brand }}</span>
              <strong>{{ name }}</strong>
              <span class="price">{{ price || 0 | rd }}</span>
            </section>
          }

          <div class="save">
            <button type="submit" class="btn btn--accent btn--block"><i class="ph ph-check"></i>{{ isNew() ? 'Publicar producto' : 'Guardar cambios' }}</button>
            <a routerLink="/panel/productos" class="btn btn--ghost btn--block">Cancelar</a>
            @if (!isNew()) {
              <button type="button" class="link del" (click)="confirmDelete.set(true)">Eliminar producto</button>
            }
          </div>
        </aside>
      </form>
    }

    @if (confirmDelete()) {
      <div class="overlay" (click)="confirmDelete.set(false)">
        <div class="modal" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h2>¿Eliminar “{{ name }}”?</h2>
          <p class="muted">No se puede deshacer. Si solo quieres que no se vea por un tiempo, desmarca “Visible en la tienda”.</p>
          <div class="modal-actions">
            <button class="btn btn--ghost" (click)="confirmDelete.set(false)">Volver</button>
            <button class="btn btn--dark" (click)="remove()">Sí, eliminar</button>
          </div>
        </div>
      </div>
    }
  `,
  styles: `
    .head {
      display: flex;
      flex-wrap: wrap;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 18px;
    }
    h1 {
      font-size: clamp(1.5rem, 3vw, 2rem);
      font-weight: 750;
    }
    h2 {
      font-size: 1.05rem;
    }
    .layout {
      display: grid;
      gap: 16px;
      align-items: start;
    }
    @media (min-width: 1100px) {
      .layout {
        grid-template-columns: 1fr 320px;
      }
      .side {
        position: sticky;
        top: 24px;
      }
    }
    .col {
      display: grid;
      gap: 16px;
    }
    .sec {
      display: grid;
      gap: 14px;
    }
    .sec-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .sm {
      font-size: 0.85rem;
    }
    .err {
      color: var(--danger);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .photos {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
      gap: 10px;
    }
    .ph-item,
    .add-photo {
      aspect-ratio: 1;
      border-radius: 12px;
      overflow: hidden;
      position: relative;
    }
    .ph-item {
      background: var(--surface-2);
      border: 2px solid transparent;
    }
    .ph-item.main {
      border-color: var(--accent);
    }
    .ph-item img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .tag {
      position: absolute;
      left: 6px;
      top: 6px;
      padding: 2px 8px;
      border-radius: var(--r-pill);
      background: var(--accent);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
    }
    .ph-actions {
      position: absolute;
      right: 4px;
      bottom: 4px;
      display: flex;
      gap: 4px;
    }
    .ph-actions .icon-btn {
      background: rgb(255 255 255 / 0.92);
      color: #111;
    }
    .add-photo {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: 6px;
      border: 2px dashed var(--line);
      cursor: pointer;
      color: var(--ink-2);
      font-size: 0.85rem;
      font-weight: 600;
    }
    .add-photo:hover {
      border-color: var(--accent);
      color: var(--accent);
    }
    .add-photo i {
      font-size: 1.8rem;
    }
    .url summary {
      cursor: pointer;
      font-size: 0.875rem;
      color: var(--ink-2);
    }
    .url-row {
      display: flex;
      gap: 8px;
      margin-top: 10px;
    }
    .sizes {
      display: grid;
      gap: 8px;
    }
    @media (min-width: 700px) {
      .sizes {
        grid-template-columns: 1fr 1fr;
        gap: 8px 16px;
      }
    }
    .size-row {
      display: grid;
      grid-template-columns: 90px 1fr auto;
      gap: 8px;
      align-items: center;
    }
    .size-row > .input {
      min-height: 42px;
      padding: 8px 10px;
      text-align: center;
      font-weight: 650;
    }
    .stepper {
      display: grid;
      grid-template-columns: auto 1fr auto;
      align-items: center;
      gap: 4px;
      border: 1px solid var(--line);
      border-radius: var(--r-input);
      padding: 2px;
    }
    .stepper .input {
      min-height: 36px;
      border: 0;
      padding: 4px;
      text-align: center;
      box-shadow: none;
    }
    .add-size {
      justify-self: start;
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .total {
      font-size: 0.9375rem;
      color: var(--ink-2);
    }
    .preview {
      display: grid;
      gap: 4px;
    }
    .preview h2 {
      margin-bottom: 8px;
    }
    .preview img {
      width: 100%;
      aspect-ratio: 4 / 5;
      object-fit: cover;
      border-radius: 12px;
      margin-bottom: 8px;
    }
    .save {
      display: grid;
      gap: 10px;
    }
    .del {
      justify-self: center;
      color: var(--danger);
      font-size: 0.9rem;
      margin-top: 6px;
    }
  `,
})
export class ProductForm {
  readonly id = input.required<string>();
  private readonly products = inject(ProductsService);
  protected readonly settings = inject(SettingsService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  protected readonly categories = CATEGORIES;

  readonly isNew = computed(() => this.id() === 'nuevo');
  readonly notFound = signal(false);
  readonly slug = signal('');
  readonly tried = signal(false);
  readonly uploading = signal(false);
  readonly confirmDelete = signal(false);

  readonly images = signal<string[]>([]);
  readonly sizes = signal<SizeStock[]>([]);
  readonly category = signal<Category>('tenis');
  readonly catName = computed(() => CATEGORIES.find((c) => c.id === this.category())?.label.toLowerCase() ?? '');
  readonly totalStock = computed(() => this.sizes().reduce((s, x) => s + (Number(x.stock) || 0), 0));

  name = '';
  brand = '';
  price = 0;
  comparePrice: number | null = null;
  description = '';
  active = true;
  isNewTag = true;
  featured = false;
  imgUrl = '';

  constructor() {
    effect(() => {
      if (this.isNew()) {
        this.sizes.set(SIZE_PRESETS.tenis.map((size) => ({ size, stock: 0 })));
        return;
      }
      const id = this.id();
      const p = untracked(() => this.products.byId(id));
      if (!p) {
        this.notFound.set(true);
        return;
      }
      this.slug.set(p.slug);
      this.images.set([...p.images]);
      this.sizes.set(p.sizes.map((s) => ({ ...s })));
      this.category.set(p.category);
      this.name = p.name;
      this.brand = p.brand;
      this.price = p.price;
      this.comparePrice = p.comparePrice ?? null;
      this.description = p.description;
      this.active = p.active;
      this.isNewTag = p.isNew;
      this.featured = p.featured;
    });
  }

  async addFiles(e: Event) {
    const el = e.target as HTMLInputElement;
    const files = [...(el.files ?? [])];
    el.value = '';
    if (!files.length) return;
    this.uploading.set(true);
    try {
      for (const f of files) {
        const data = await compressImage(f, 1000, 0.75);
        this.images.update((l) => [...l, data]);
      }
    } catch (err) {
      this.toast.error((err as Error).message);
    } finally {
      this.uploading.set(false);
    }
  }

  addUrl() {
    const u = this.imgUrl.trim();
    if (!/^https?:\/\//.test(u)) {
      this.toast.error('Pega un enlace que empiece con https://');
      return;
    }
    this.images.update((l) => [...l, u]);
    this.imgUrl = '';
  }

  makeMain(i: number) {
    this.images.update((l) => [l[i], ...l.filter((_, j) => j !== i)]);
  }

  removeImg(i: number) {
    this.images.update((l) => l.filter((_, j) => j !== i));
  }

  usePreset() {
    const existing = new Map(this.sizes().map((s) => [s.size, s.stock]));
    this.sizes.set(SIZE_PRESETS[this.category()].map((size) => ({ size, stock: existing.get(size) ?? 0 })));
  }

  setSize(i: number, key: 'size' | 'stock', value: string | number) {
    this.sizes.update((l) =>
      l.map((s, j) => (j !== i ? s : key === 'stock' ? { ...s, stock: Math.max(0, Math.floor(Number(value) || 0)) } : { ...s, size: String(value) })),
    );
  }

  addSize() {
    this.sizes.update((l) => [...l, { size: '', stock: 0 }]);
  }

  removeSize(i: number) {
    this.sizes.update((l) => l.filter((_, j) => j !== i));
  }

  save() {
    this.tried.set(true);
    const sizes = this.sizes()
      .map((s) => ({ size: s.size.trim(), stock: Number(s.stock) || 0 }))
      .filter((s) => s.size);
    if (!this.name.trim() || !this.brand.trim() || !(this.price > 0) || !this.images().length || !sizes.length) {
      this.toast.error('Completa los campos marcados en rojo.');
      return;
    }
    const cp = Number(this.comparePrice) || 0;
    try {
      const saved = this.products.save({
        id: this.isNew() ? undefined : this.id(),
        name: this.name.trim(),
        brand: this.brand.trim(),
        category: this.category(),
        price: Math.round(this.price),
        comparePrice: cp > this.price ? Math.round(cp) : undefined,
        description: this.description.trim(),
        images: this.images(),
        sizes,
        isNew: this.isNewTag,
        featured: this.featured,
        active: this.active,
      });
      this.toast.show(this.isNew() ? `“${saved.name}” publicado` : 'Cambios guardados');
      this.router.navigateByUrl('/panel/productos');
    } catch (e) {
      this.toast.error(e instanceof StorageFullError ? e.message : 'No se pudo guardar.');
    }
  }

  remove() {
    this.products.remove(this.id());
    this.toast.show('Producto eliminado');
    this.router.navigateByUrl('/panel/productos');
  }
}
