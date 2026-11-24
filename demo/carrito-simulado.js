// Imita la parte de la API de carrito de Shopify que usa el tema: agregar, leer, cambiar y poner códigos.
// No cobra ni envía nada a ningún servidor.
(() => {
  globalThis.crearCarritoSimulado = (productos, reglas, inicial) => {
    const porVariante = new Map(productos.map((p) => [p.variante, p]));
    const codigos = new Map();
    const montos = new Map();
    reglas.p.forEach(([i, j, monto], n) => {
      montos.set(Math.min(i, j) + '-' + Math.max(i, j), monto * 100);
      codigos.set('DEMO-' + String(n + 1).padStart(3, '0'), [{ a: reglas.v[i], b: reglas.v[j], monto: monto * 100 }]);
    });
    // Códigos de grupo: cubren varias parejas con la misma rebaja.
    for (const [n, xs, ys] of reglas.g) {
      codigos.set('DEMO-' + String(n).padStart(2, '0'), xs.flatMap((x) => ys.map((y) => ({
        a: reglas.v[x], b: reglas.v[y], monto: montos.get(Math.min(x, y) + '-' + Math.max(x, y))
      }))).filter((r) => r.monto));
    }
    const estado = inicial || { lineas: [], codigos: [] };

    // Como un descuento "compra X y llévate Y": cada unidad se usa una vez y, si quedan unidades, el código se repite.
    const leer = () => {
      const libres = new Map(estado.lineas.map((l) => [l.id, l.cantidad]));
      const rebajas = new Map();
      const aplicadas = [];
      const discount_codes = estado.codigos.map((code) => {
        let veces = 0;
        for (const r of codigos.get(code.toUpperCase()) || []) {
          while ((libres.get(r.a) || 0) > 0 && (libres.get(r.b) || 0) > 0) {
            libres.set(r.a, libres.get(r.a) - 1);
            libres.set(r.b, libres.get(r.b) - 1);
            veces++;
            aplicadas.push({ code, a: porVariante.get(r.a), b: porVariante.get(r.b), monto: r.monto / 100 });
            rebajas.set(r.b, [...(rebajas.get(r.b) || []), { amount: r.monto, discount_application: { title: code } }]);
          }
        }
        return { code, applicable: veces > 0 };
      });
      const items = estado.lineas.map((l) => {
        const p = porVariante.get(l.id);
        return { variant_id: l.id, quantity: l.cantidad, title: p.nombre, vendor: p.casa, original_price: p.precio * 100, line_level_discount_allocations: rebajas.get(l.id) || [] };
      });
      const bruto = items.reduce((s, i) => s + i.original_price * i.quantity, 0);
      const rebaja = aplicadas.reduce((s, x) => s + x.monto * 100, 0);
      return { items, item_count: items.reduce((s, i) => s + i.quantity, 0), original_total_price: bruto, total_price: bruto - rebaja, discount_codes, aplicadas };
    };

    const agregar = (items) => {
      if (!items.every((i) => porVariante.has(Number(i.id)))) return null;
      for (const { id, quantity } of items) {
        const l = estado.lineas.find((x) => x.id === Number(id));
        if (l) l.cantidad += quantity; else estado.lineas.push({ id: Number(id), cantidad: quantity });
      }
      return leer();
    };
    const cambiar = (id, cantidad) => {
      const l = estado.lineas.find((x) => x.id === id);
      if (l) l.cantidad = cantidad;
      estado.lineas = estado.lineas.filter((x) => x.cantidad > 0);
      return leer();
    };
    const ponerCodigos = (texto) => {
      estado.codigos = texto ? texto.split(',') : [];
      return leer();
    };

    const respuesta = (datos, status = 200) => new Response(JSON.stringify(datos), { status, headers: { 'Content-Type': 'application/json' } });
    const atender = (url, opt = {}) => {
      const ruta = String(url);
      if (/\/cart\/add(\.js)?$/.test(ruta)) {
        const { items } = JSON.parse(opt.body);
        return agregar(items) ? respuesta({ items, sections: {} }) : respuesta({ status: 422, description: 'Ese perfume no está disponible' }, 422);
      }
      if (/\/cart\/update\.js$/.test(ruta)) return respuesta(ponerCodigos(JSON.parse(opt.body).discount));
      if (/\/cart\.(js|json)$/.test(ruta)) return respuesta(leer());
      return null;
    };
    return { estado, leer, agregar, cambiar, ponerCodigos, atender };
  };
})();
