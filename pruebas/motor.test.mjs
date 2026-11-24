// Prueba el motor 2x300 tal como está en el snippet del tema, contra el carrito simulado.
// Compara su resultado con el óptimo calculado por fuerza bruta. Uso: node --test pruebas/
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync } from 'node:fs';
import { productos, reglasMotor, paresTema } from '../demo/datos.mjs';

const leer = (p) => readFileSync(new URL('../' + p, import.meta.url), 'utf8');
const fuente = leer('shopify/snippets/mc-2x300-auto.liquid').match(/<script type="module">([\s\S]*?)<\/script>/)[1].replace(/\{%[\s\S]*?%\}/g, '');
vm.runInThisContext(leer('demo/carrito-simulado.js'));

const porVariante = new Map(productos.map((p) => [p.variante, p]));
const enPromo = reglasMotor.v.map((v) => porVariante.get(v));
const parejas = reglasMotor.p.map(([i, j, monto]) => ({ i, j, monto, precio: enPromo[i].precio + enPromo[j].precio - monto }));
const montos = new Map(parejas.map(({ i, j, monto }) => [`${Math.min(i, j)}-${Math.max(i, j)}`, monto]));

const correrMotor = async (carrito) => {
  const window = { addEventListener() {} };
  const document = {
    getElementById: () => ({ textContent: JSON.stringify(reglasMotor) }),
    querySelector: () => null,
    addEventListener() {},
    dispatchEvent() {}
  };
  const contexto = vm.createContext({ window, document, console, setTimeout, fetch: async (u, o) => carrito.atender(u, o) });
  vm.runInContext(fuente.replace("await import('@shopify/events')", '(() => { throw 0; })()'), contexto);
  await window.mc2x300.revisar();
  return carrito.leer();
};

const nuevo = (indices) => {
  const c = crearCarritoSimulado(productos, reglasMotor);
  for (const i of indices) c.agregar([{ id: enPromo[i].variante, quantity: 1 }]);
  return c;
};
const optimo = (u) => {
  if (u.length < 2) return 0;
  const [a, ...resto] = u;
  let mejor = optimo(resto);
  resto.forEach((b, n) => {
    const m = montos.get(`${Math.min(a, b)}-${Math.max(a, b)}`);
    if (m) mejor = Math.max(mejor, m + optimo(resto.filter((_, k) => k !== n)));
  });
  return mejor;
};
const ahorro = (c) => (c.original_total_price - c.total_price) / 100;

test('cada pareja válida queda en $300.000, $350.000 o $400.000', async () => {
  for (const { i, j, precio } of parejas) {
    const c = await correrMotor(nuevo([i, j]));
    assert.equal(c.total_price / 100, precio);
    assert.ok([300000, 350000, 400000].includes(precio));
  }
});

test('el motor y la página 2x300 ofrecen las mismas parejas al mismo precio', () => {
  const delTema = Object.entries(paresTema.pares).map(([k, [miles]]) => `${k}:${miles * 1000}`).sort();
  const delMotor = parejas.map(({ i, j, precio }) => [reglasMotor.v[i], reglasMotor.v[j]].sort((a, b) => a - b).join('-') + ':' + precio).sort();
  assert.deepEqual(delMotor, delTema);
});

test('las parejas fuera de la promoción no descuentan', async () => {
  let probadas = 0;
  for (let i = 0; i < enPromo.length; i++) {
    for (let j = i + 1; j < enPromo.length; j++) {
      if (montos.has(`${i}-${j}`)) continue;
      assert.equal(ahorro(await correrMotor(nuevo([i, j]))), 0);
      probadas++;
    }
  }
  assert.ok(probadas > 0);
});

test('carritos de 3 a 10 perfumes distintos: siempre el mayor ahorro posible', async () => {
  let semilla = 7;
  const azar = () => (semilla = (semilla * 16807) % 2147483647) / 2147483647;
  for (let n = 0; n < 300; n++) {
    const mezcla = enPromo.map((_, i) => [azar(), i]).sort((a, b) => a[0] - b[0]).map((x) => x[1]);
    const u = mezcla.slice(0, 3 + Math.floor(azar() * 8));
    assert.equal(ahorro(await correrMotor(nuevo(u))), optimo(u), 'carrito ' + u.join(','));
  }
});

test('no toca un código que escribió el cliente', async () => {
  const carrito = nuevo([parejas[0].i, parejas[0].j]);
  carrito.ponerCodigos('BIENVENIDA');
  const c = await correrMotor(carrito);
  assert.ok(c.discount_codes.some((d) => d.code === 'BIENVENIDA'));
  assert.equal(c.total_price / 100, parejas[0].precio);
});
