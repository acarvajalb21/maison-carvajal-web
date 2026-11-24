// Arma las parejas y los códigos de ejemplo del 2x300 usando solo los precios de venta del catálogo.
// No son las parejas de la promoción de la tienda. Uso: node herramientas/generar-2x300.mjs
import { readFileSync, writeFileSync } from 'node:fs';

const url = (p) => new URL('../' + p, import.meta.url);
const leer = (p) => readFileSync(url(p), 'utf8');
const catalogo = JSON.parse(leer('demo/catalogo.json'));

const PRECIOS = [400000, 350000, 300000];
const SUMA_MAXIMA = 450000;
// Categorías de la página 2x300, también por precio de venta.
const categoria = (precio) => (precio <= 169900 ? 'esencial' : precio <= 229900 ? 'plus' : 'premium');

const lista = catalogo.filter((p) => p.duo).sort((a, b) => a.precio - b.precio || a.handle.localeCompare(b.handle));
for (const p of lista) p.duo = categoria(p.precio);

// Cada pareja baja al precio de la promoción inmediatamente inferior a la suma.
const reglas = { v: lista.map((p) => p.variante), p: [], g: [] };
const pares = {};
const porPrecios = new Map();
lista.forEach((a, i) => lista.forEach((b, j) => {
  if (j <= i) return;
  const suma = a.precio + b.precio;
  const promo = suma <= SUMA_MAXIMA && PRECIOS.find((x) => x < suma);
  if (!promo) return;
  reglas.p.push([i, j, suma - promo]);
  pares[[a.variante, b.variante].sort((x, y) => x - y).join('-')] = [promo / 1000, suma];
  const k = a.precio + '-' + b.precio;
  if (!porPrecios.has(k)) porPrecios.set(k, [new Set(), new Set()]);
  porPrecios.get(k)[0].add(i);
  porPrecios.get(k)[1].add(j);
}));

// Código de grupo: perfumes de un precio con perfumes de otro; todas sus parejas tienen la misma rebaja.
for (const [xs, ys] of porPrecios.values()) {
  const [x, y] = [[...xs], [...ys]];
  if (x.length * y.length > 2 && reglas.g.length < 99) reglas.g.push([reglas.g.length + 1, x, y]);
}

const auto = leer('shopify/snippets/mc-2x300-auto.liquid')
  .replace(/(id="mc-2x300-reglas">)[\s\S]*?(<\/script>)/, (_, a, b) => a + JSON.stringify(reglas) + b)
  .replace(/DEMO-001 … DEMO-\d+/, 'DEMO-001 … DEMO-' + String(reglas.p.length).padStart(3, '0'));
writeFileSync(url('shopify/snippets/mc-2x300-auto.liquid'), auto);

const snippet = leer('shopify/snippets/mc-2x300-pares.liquid');
const cabecera = snippet.match(/^[\s\S]*?endcomment\s*-?%\}/)[0];
writeFileSync(url('shopify/snippets/mc-2x300-pares.liquid'), cabecera + '\n' + JSON.stringify({ v: 'ejemplo', cat: Object.fromEntries(lista.map((p) => [p.id, p.duo])), pares }) + '\n');
console.log(`${lista.length} perfumes, ${reglas.p.length} parejas de ejemplo, ${reglas.g.length} códigos de grupo.`);
const texto = leer('demo/catalogo.json');
writeFileSync(url('demo/catalogo.json'), texto.includes('\n ') ? JSON.stringify(catalogo, null, 1) + '\n' : '[\n' + catalogo.map((p) => JSON.stringify(p)).join(',\n') + '\n]\n');
