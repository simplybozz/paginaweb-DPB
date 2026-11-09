# D'Patron Boutique · Tienda en línea + almacén (propuesta)

Propuesta de página web para **D'Patron Boutique**, "la boutique de los famosos": tenis, ropa, gorras, perfumes, relojes, correas y chancletas 100% originales, con envíos a todo el país.
Hecha con **Angular 21** (componentes standalone y signals). Funciona en celular, tablet y computadora.



## Qué incluye

**Para los clientes**
- **Inicio:** hero "La boutique de los famosos", categorías estilo historias de Instagram, **"El tapón de oferta"** con cuenta regresiva semanal, lo recién llegado, banner de Jordan, lo más vendido, cómo comprar, la boutique y las últimas 6 publicaciones de Instagram.
- **Tienda:** filtros por categoría, marca, talla y ofertas, además de búsqueda.
- **Producto:** fotos, tallas con existencia en vivo, cantidad y botón de WhatsApp.
- **Carrito y pago solo por transferencia:**
  1. Envío a domicilio (por zona) o retiro en la boutique.
  2. Elige el banco y copia los datos de la cuenta con un toque.
  3. Sube la captura del comprobante y envía el pedido.
- **Mis pedidos:** estado paso a paso. Si rechazan el comprobante, el cliente ve el motivo y sube otro sin volver a comprar.

**Almacén**
- Existencias de cada producto **por talla**, con alertas de tallas por agotarse y agotadas.
- Unidades en almacén y valor del inventario.
- Se suben o bajan existencias con **+ / −**, se elige el motivo (*Llegó mercancía* o *Ajuste / conteo*), se añade una nota y se guarda.
- Se pueden agregar tallas nuevas a un producto desde ahí mismo.
- **Historial**: cada movimiento (entrada, venta, cancelación, ajuste) queda anotado con quién, cuándo, cuánto y por qué.
  Las ventas y cancelaciones se registran solas.

**Roles** (todo el que se registra entra como *Cliente*)

| Rol | Qué puede hacer |
| --- | --- |
| Cliente | Comprar y ver sus pedidos |
| Vendedor | Revisar comprobantes, despachar pedidos, publicar productos y manejar el almacén |
| Administrador | Todo lo del vendedor, más roles y usuarios, cuentas bancarias, zonas de envío, Instagram, marcas y datos de la tienda |

**Flujo de un pedido**

```
Comprobante en revisión ──► Pago confirmado ──► En camino ──────────► Entregado
        │                                   └─► Listo para retirar ─┘
        └─► Rechazado ──(el cliente sube otro)──► En revisión
Cualquier pedido no entregado se puede cancelar; la talla vuelve al inventario.
```



## Estructura

```
src/app/
  core/      modelos, servicios de datos (productos, pedidos, almacén), guards, utilidades
  layout/    estructura pública (header, footer, carrito, intro) y del panel
  pages/     tienda pública y "Mi cuenta"
  panel/     panel de vendedor y administrador (pedidos, productos, almacén, usuarios, ajustes)
  shared/    logo, tarjeta de producto, estado de pedido, Instagram, subir imagen
```
