// Catálogo y portada de la tienda con precios de venta. Las parejas 2x300 son de ejemplo.
import { readFileSync } from 'node:fs';

const leer = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
export const productos = JSON.parse(leer('demo/catalogo.json')).map((p) => ({ ...p, img: p.url || 'img/' + p.foto }));

const porHandle = new Map(productos.map((p) => [p.handle, p]));
export const producto = (h) => {
  if (!porHandle.has(h)) throw new Error('No está en el catálogo: ' + h);
  return porHandle.get(h);
};

export const portada = JSON.parse(leer('shopify/templates/index.json').replace(/^\s*\/\*[\s\S]*?\*\//, ''));
export const reglasMotor = JSON.parse(leer('shopify/snippets/mc-2x300-auto.liquid').match(/id="mc-2x300-reglas">([\s\S]*?)<\/script>/)[1]);
export const paresTema = JSON.parse(leer('shopify/snippets/mc-2x300-pares.liquid').split(/endcomment\s*-?%\}/)[1]);

// Mismo criterio que snippets/mc-modo-venta.liquid.
export const modo = (p) => {
  const t = p.modo || [];
  if (!p.precio || t.includes('consultar-precio')) return 'consultar';
  if (t.includes('pedido-whatsapp') || t.includes('confirmar-variante')) return 'pedido';
  return !p.agotado && (t.includes('venta-directa') || p.coleccion === 'arabes') ? 'directa' : 'pedido';
};
