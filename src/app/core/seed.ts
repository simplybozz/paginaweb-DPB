import { Category, Product, SizeStock, StoreSettings } from './models';

/** Fotos libres de Unsplash para la demo. El equipo las reemplaza desde el panel. */
export const unsplash = (id: string, w = 900) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=75`;

export const IMAGES = {
  hero: unsplash('photo-1600269452121-4f2416e55c28', 1400),
  heroAlt: unsplash('photo-1597045566677-8cf032ed6634', 900),
  heroFeet: unsplash('photo-1556906781-9a412961c28c', 900),
  store: unsplash('photo-1760302318631-a8d342cd4951', 1400),
  storeWall: unsplash('photo-1633464129147-777bdcc97c1d', 1200),
  storeDisplay: unsplash('photo-1628413993904-94ecb60f1239', 1000),
  lookbook3: unsplash('photo-1541099649105-f69ad21f3246', 900),
  catTenis: unsplash('photo-1556906781-9a412961c28c', 1000),
  catRopa: unsplash('photo-1620799140188-3b2a02fd9a77', 900),
  catGorras: unsplash('photo-1777455163879-92852416eb36', 900),
  catPerfumes: unsplash('photo-1594035910387-fea47794261f', 900),
  catRelojes: unsplash('photo-1539874754764-5a96559165b0', 900),
  catCorreas: unsplash('photo-1624222247344-550fb60583dc', 900),
  catChancletas: unsplash('photo-1603487742131-4160ec999306', 900),
};

const sizes = (list: [string, number][]): SizeStock[] =>
  list.map(([size, stock]) => ({ size, stock }));

const tops = (base = 4) =>
  sizes([
    ['S', base - 1],
    ['M', base + 2],
    ['L', base + 1],
    ['XL', base],
    ['XXL', 1],
  ]);

const waist = () =>
  sizes([
    ['30', 2],
    ['32', 4],
    ['34', 3],
    ['36', 2],
  ]);

const one = (n: number) => sizes([['Única', n]]);

const shoes = (base = 2) =>
  sizes([
    ['7.5', base - 1],
    ['8', base],
    ['8.5', base + 1],
    ['9', base + 2],
    ['9.5', base],
    ['10', base + 1],
    ['10.5', 0],
    ['11', base],
    ['12', 1],
  ]);

let n = 0;
function p(
  name: string,
  brand: string,
  category: Category,
  price: number,
  images: string[],
  sizeList: SizeStock[],
  extra: Partial<Product> = {},
): Product {
  n++;
  const slug = name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  const created = new Date(Date.now() - n * 86400000 * 1.4).toISOString();
  return {
    id: 'p' + n,
    slug,
    name,
    brand,
    category,
    price,
    description: '',
    images,
    sizes: sizeList,
    isNew: n <= 7,
    featured: false,
    active: true,
    createdAt: created,
    ...extra,
  };
}

/** Productos de ejemplo, tomados de lo que publican en Instagram (precios de referencia). */
export const SEED_PRODUCTS: Product[] = [
  p("Air Force 1 '07 Triple White", 'Nike', 'tenis', 6499,
    [unsplash('photo-1600269452121-4f2416e55c28'), unsplash('photo-1608231387042-66d1773070a5')], shoes(4), {
      featured: true,
      comparePrice: 7499,
      description: 'El AF1 blanco de siempre, original. Piel lisa, suela Air y caja original. El tapón de oferta de la semana.',
    }),
  p('Air Jordan 1 Low "Bred Toe"', 'Jordan', 'tenis', 8999,
    [unsplash('photo-1597045566677-8cf032ed6634')], shoes(2), {
      featured: true,
      description: 'Rojo, negro y blanco. Piel con perforaciones en la puntera y Air en el talón.',
    }),
  p('Air Jordan 1 Mid "Chicago Black Toe"', 'Jordan', 'tenis', 9499,
    [unsplash('photo-1556906781-9a412961c28c')], shoes(2), {
      featured: true,
      description: 'Colores clásicos de la cancha. Caña media, piel y suela de goma.',
    }),
  p('Air Jordan 1 Low "Gym Red"', 'Jordan', 'tenis', 8499,
    [unsplash('photo-1600181516264-3ea807ff44b9')], shoes(3), {
      comparePrice: 9499,
      description: 'Blanco con rojo gimnasio. Ligero, cómodo y fácil de combinar.',
    }),
  p('Air Jordan 1 High "Satin Shadow"', 'Jordan', 'tenis', 10999,
    [unsplash('photo-1552346154-21d32810aba3')], shoes(1), {
      description: 'Caña alta en negro, rojo y blanco. Pocas tallas: pregunta por la tuya.',
    }),
  p('Air Max 90 "Kumquat"', 'Nike', 'tenis', 7299,
    [unsplash('photo-1514989940723-e8e51635b782')], shoes(2), {
      description: 'Silueta de los 90 con Air visible y tonos naranja.',
    }),
  p('Air Force 1 Low Pastel', 'Nike', 'tenis', 6799,
    [unsplash('photo-1595950653106-6c9ebd614d3a')], shoes(2), {
      description: 'Tonos pastel para dama. Suave, ligero y llamativo.',
    }),
  p('Grand Pro Rally Court Tan', 'Cole Haan', 'tenis', 7999,
    [unsplash('photo-1549298916-b41d501d3772')], shoes(2), {
      featured: true,
      description: 'Piel color tan con suela Grand.OS. Elegante para la oficina y cómodo para el fin de semana.',
    }),
  p('Chuck 70 High Rojo', 'Converse', 'tenis', 4999,
    [unsplash('photo-1607522370275-f14206abe5d3')], shoes(3), {
      description: 'Lona gruesa, suela vintage y caña alta.',
    }),
  p('Pegasus Blanco', 'Nike', 'tenis', 6299,
    [unsplash('photo-1460353581641-37baddab0fa2')], shoes(2), {
      description: 'Para correr o para el día a día. Ligero, cómodo y blanco total.',
    }),
  p('Chuck 70 Low Beige', 'Converse', 'tenis', 4599,
    [unsplash('photo-1556048219-bb6978360b84')], shoes(2), {
      comparePrice: 5299,
      description: 'Lona color arena, suela vintage y perfil bajo.',
    }),
  p('Jean Desgastado Slim', 'Amiri', 'ropa', 5999,
    [unsplash('photo-1541099649105-f69ad21f3246')], waist(), {
      description: 'Lavado claro con rotos en rodilla. Corte slim que no aprieta.',
    }),
  p('Jean Negro Stacked', 'Purple Brand', 'ropa', 6499,
    [unsplash('photo-1542272604-787c3835535d')], waist(), {
      featured: true,
      description: 'Negro lavado con caída amontonada en el tobillo.',
    }),
  p('Hoodie Blanco Essentials', 'Essentials', 'ropa', 3999,
    [unsplash('photo-1620799140188-3b2a02fd9a77')], tops(3), {
      description: 'Felpa gruesa y logo en relieve. Va con todo.',
    }),
  p('T-shirt Oversize Blanca', 'Essentials', 'ropa', 1499,
    [unsplash('photo-1521572163474-6864f9cf17ab')], tops(5), {
      description: 'Algodón pesado, cuello reforzado y corte amplio.',
    }),
  p('Fitted Negra NY', 'New Era', 'gorras', 2299,
    [unsplash('photo-1523380744952-b7e00e6e2ffa')],
    sizes([['7', 1], ['7 1/8', 2], ['7 1/4', 3], ['7 3/8', 2], ['7 1/2', 1]]), {
      featured: true,
      description: 'Fitted 59FIFTY de visera plana, original con sticker.',
    }),
  p('Gorra Dad Hat Rosa', 'Polo Ralph Lauren', 'gorras', 2499,
    [unsplash('photo-1777455163879-92852416eb36')], one(6), {
      description: 'Visera curva, cierre ajustable y caballito bordado.',
    }),
  p('Bleu Eau de Parfum', 'Chanel', 'perfumes', 9999,
    [unsplash('photo-1523293182086-7651a899d37f')], sizes([['100 ml', 4]]), {
      featured: true,
      description: 'Amaderado y fresco. Original, sellado en su caja.',
    }),
  p('Nº5 Eau de Parfum', 'Chanel', 'perfumes', 10999,
    [unsplash('photo-1541643600914-78b084683601')], sizes([['50 ml', 2], ['100 ml', 3]]), {
      description: 'El clásico floral para dama. Original, sellado.',
    }),
  p('Coco Mademoiselle', 'Chanel', 'perfumes', 9499,
    [unsplash('photo-1592945403244-b3fbafd7f539')], sizes([['100 ml', 3]]), {
      comparePrice: 10499,
      description: 'Oriental fresco para dama. Para regalar o regalarte.',
    }),
  p('Pro Diver Acero', 'Invicta', 'relojes', 5999,
    [unsplash('photo-1547996160-81dfa63595aa')], one(5), {
      featured: true,
      description: 'Acero inoxidable, bisel giratorio y resistencia al agua de 200 m.',
    }),
  p('Speedway Cronógrafo', 'Invicta', 'relojes', 7499,
    [unsplash('photo-1539874754764-5a96559165b0')], one(3), {
      description: 'Cronógrafo de cuarzo con esfera blanca y correa de acero.',
    }),
  p('Correa de Piel Marrón', 'Cole Haan', 'correas', 2999,
    [unsplash('photo-1624222247344-550fb60583dc')],
    sizes([['32', 2], ['34', 3], ['36', 3], ['38', 1]]), {
      description: 'Piel genuina con hebilla de metal. Pega con jean o pantalón de vestir.',
    }),
  p('Chancleta de Hebilla Arena', 'Birkenstock', 'chancletas', 4499,
    [unsplash('photo-1603487742131-4160ec999306')],
    sizes([['8', 2], ['9', 3], ['10', 3], ['11', 2], ['12', 1]]), {
      featured: true,
      description: 'Plantilla de corcho que toma la forma del pie. Dos hebillas ajustables.',
    }),
  p('Sandalia Cruzada Vino', 'Steve Madden', 'chancletas', 2999,
    [unsplash('photo-1562273138-f46be4ebdf33')],
    sizes([['6', 1], ['7', 2], ['8', 2], ['9', 1]]), {
      description: 'Para dama: tiras cruzadas y plataforma cómoda.',
    }),
];

export const SEED_SETTINGS: StoreSettings = {
  storeName: "D'Patron Boutique",
  instagram: 'patronboutiqueofficial',
  whatsapp: '8093883806',
  phone: '809-388-3806',
  address: 'Santo Domingo, República Dominicana (dirección editable desde Ajustes)',
  hours: 'Lunes a sábado, 9:00 a. m. a 7:00 p. m.',
  pickupNote: 'Retira gratis en la boutique cuando tu pedido esté listo.',
  banks: [
    {
      id: 'b1', bank: 'Banco Popular', type: 'Corriente', number: '000000000',
      holder: 'Nombre del titular', holderId: '000-0000000-0', color: '#1d3f8f', active: true,
    },
    {
      id: 'b2', bank: 'Banreservas', type: 'Ahorros', number: '000-000000-0',
      holder: 'Nombre del titular', holderId: '000-0000000-0', color: '#0b5aa6', active: true,
    },
    {
      id: 'b3', bank: 'BHD', type: 'Ahorros', number: '00000000000',
      holder: 'Nombre del titular', holderId: '000-0000000-0', color: '#0a8f4a', active: true,
    },
  ],
  zones: [
    { id: 'z1', name: 'Santo Domingo y Distrito Nacional', fee: 250, eta: '24 a 48 horas' },
    { id: 'z2', name: 'Santiago y zona norte', fee: 350, eta: '1 a 3 días laborables' },
    { id: 'z3', name: 'Resto del país', fee: 450, eta: '2 a 4 días laborables' },
  ],
  instagramPosts: [
    { url: 'https://www.instagram.com/dpatronboutiqueoficial/reel/DfS6i4wOecu/', image: unsplash('photo-1597045566677-8cf032ed6634', 600), caption: 'El tapón de oferta' },
    { url: 'https://www.instagram.com/dpatronboutiqueoficial/reel/DfSzehBOmfs/', image: unsplash('photo-1600269452121-4f2416e55c28', 600), caption: 'AF1 a $6,499' },
    { url: 'https://www.instagram.com/dpatronboutiqueoficial/reel/Dfh7qRuuxpi/', image: unsplash('photo-1760302318631-a8d342cd4951', 600), caption: 'La boutique de los famosos' },
    { url: 'https://www.instagram.com/dpatronboutiqueoficial/reel/Dfh4fqLufXN/', image: unsplash('photo-1556906781-9a412961c28c', 600), caption: 'Lo nuevo de Jordan' },
    { url: 'https://www.instagram.com/dpatronboutiqueoficial/reel/Dfhoi51OFJr/', image: unsplash('photo-1603487742131-4160ec999306', 600), caption: 'Chancletas' },
    { url: 'https://www.instagram.com/dpatronboutiqueoficial/p/DfhnlRmOnY5/', image: unsplash('photo-1633464129147-777bdcc97c1d', 600), caption: 'Visítanos' },
  ],
  brands: [
    { id: 'jordan', name: 'Jordan' },
    { id: 'nike', name: 'Nike' },
    { id: 'colehaan', name: 'Cole Haan' },
    { id: 'invicta', name: 'Invicta' },
    { id: 'newera', name: 'New Era' },
    { id: 'chanel', name: 'Chanel' },
    { id: 'converse', name: 'Converse' },
    { id: 'essentials', name: 'Essentials' },
    { id: 'amiri', name: 'Amiri' },
    { id: 'purple', name: 'Purple Brand' },
  ],
};

/** Imagen de ejemplo para los pedidos de muestra (no es un comprobante real). */
export const SAMPLE_PROOF =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="600" height="900" viewBox="0 0 600 900">
<rect width="600" height="900" fill="#f6f7f9"/><rect width="600" height="150" fill="#5b1fd1"/>
<text x="40" y="92" font-family="Arial" font-size="38" font-weight="700" fill="#fff">Transferencia exitosa</text>
<text x="40" y="230" font-family="Arial" font-size="22" fill="#666">Monto</text>
<text x="40" y="280" font-family="Arial" font-size="46" font-weight="700" fill="#111">RD$ 6,440.00</text>
<text x="40" y="370" font-family="Arial" font-size="22" fill="#666">Cuenta destino</text>
<text x="40" y="408" font-family="Arial" font-size="28" fill="#111">Banco Popular ****0000</text>
<text x="40" y="490" font-family="Arial" font-size="22" fill="#666">Referencia</text>
<text x="40" y="528" font-family="Arial" font-size="28" fill="#111">84720193</text>
<text x="40" y="610" font-family="Arial" font-size="22" fill="#666">Fecha</text>
<text x="40" y="648" font-family="Arial" font-size="28" fill="#111">Comprobante de ejemplo</text>
<rect x="40" y="740" width="520" height="2" fill="#ddd"/>
<text x="40" y="800" font-family="Arial" font-size="20" fill="#999">Imagen de muestra para la demo</text></svg>`);
