// Prepara el build para GitHub Pages:
// - 404.html = index.html para que las rutas de Angular (/tienda, /panel...) funcionen al recargar.
// - .nojekyll para que GitHub no ignore archivos.
import { copyFileSync, existsSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const out = join('dist', 'paginaDPB', 'browser');
if (!existsSync(join(out, 'index.html'))) {
  console.error(`No existe ${out}/index.html. Corre primero "ng build".`);
  process.exit(1);
}
copyFileSync(join(out, 'index.html'), join(out, '404.html'));
writeFileSync(join(out, '.nojekyll'), '');
console.log(`Listo para GitHub Pages: ${out}`);
