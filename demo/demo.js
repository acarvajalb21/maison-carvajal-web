// Piezas que en la tienda aporta Shopify: carrito (aquí simulado), ficha de producto y filtro por marca.
// "Theme" se declara igual que en Horizon: los componentes de la tienda lo leen sin cambios.
const Theme = { routes: { cart_add_url: '/cart/add.js', cart_url: '/cart' } };

(() => {
  const datos = JSON.parse(document.getElementById('demo-datos').textContent);
  const CLAVE = 'mc-demo-carrito';
  let guardado = null;
  try { guardado = JSON.parse(sessionStorage.getItem(CLAVE)); } catch (e) { guardado = null; }
  const carrito = crearCarritoSimulado(datos.productos, datos.reglas, guardado);
  window.mcDemo = { carrito };

  const guardar = () => {
    try { sessionStorage.setItem(CLAVE, JSON.stringify(carrito.estado)); } catch (e) { /* sin almacenamiento: dura lo que dure la página */ }
  };
  const original = window.fetch.bind(window);
  window.fetch = async (url, opt) => {
    const r = carrito.atender(url, opt);
    if (!r) return original(url, opt);
    guardar();
    return r;
  };

  const cop = (n) => '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.');
  const $ = (s, r = document) => r.querySelector(s);
  const crearEl = (tag, clase, texto) => {
    const el = document.createElement(tag);
    if (clase) el.className = clase;
    if (texto !== undefined) el.textContent = texto;
    return el;
  };

  const pintar = () => {
    const c = carrito.leer();
    guardar();
    document.querySelectorAll('[data-demo-cuenta]').forEach((el) => { el.textContent = c.item_count; });
    const lista = $('[data-demo-lineas]');
    const foco = document.activeElement && document.activeElement.dataset.foco;
    lista.replaceChildren(...c.items.map((it) => {
      const li = crearEl('li', 'demo-linea');
      const img = crearEl('img');
      img.src = datos.productos.find((p) => p.variante === it.variant_id).img;
      img.alt = '';
      const texto = crearEl('div');
      texto.append(crearEl('strong', '', it.title), crearEl('span', '', it.vendor), crearEl('span', '', cop(it.original_price / 100)));
      const cant = crearEl('div', 'demo-cant');
      const boton = (signo, nombre, cantidad) => {
        const b = crearEl('button', '', signo);
        b.type = 'button';
        b.dataset.foco = it.variant_id + signo;
        b.setAttribute('aria-label', `${nombre} ${it.title}`);
        b.addEventListener('click', () => { carrito.cambiar(it.variant_id, cantidad); pintar(); notificar(); });
        return b;
      };
      cant.append(boton('−', 'Quitar una unidad de', it.quantity - 1), crearEl('b', '', it.quantity), boton('+', 'Agregar una unidad de', it.quantity + 1));
      li.append(img, texto, cant);
      return li;
    }));
    if (foco) {
      const b = [...lista.querySelectorAll('button')].find((x) => x.dataset.foco === foco);
      (b || $('[data-demo-cerrar]')).focus();
    }
    $('[data-demo-promos]').replaceChildren(...c.aplicadas.map((x) => {
      const li = crearEl('li');
      li.append(crearEl('span', '', `${x.a.nombre} + ${x.b.nombre}`), crearEl('b', '', '−' + cop(x.monto)));
      return li;
    }));
    $('[data-demo-vacio]').hidden = c.item_count > 0;
    $('[data-demo-resumen]').hidden = c.item_count === 0;
    $('[data-demo-bruto]').textContent = cop(c.original_total_price / 100);
    $('[data-demo-ahorro]').textContent = '−' + cop((c.original_total_price - c.total_price) / 100);
    $('[data-demo-total]').textContent = cop(c.total_price / 100);
  };

  // Avisa al motor 2x300 con el mismo evento que emite el tema al cambiar el carrito.
  const notificar = async () => {
    const { CartLinesUpdateEvent: E } = await import('@shopify/events');
    document.dispatchEvent(new E({ promise: Promise.resolve({ cart: {} }) }));
  };
  const alCambiar = (ev) => { Promise.resolve(ev.promise).then(pintar, () => {}); };
  document.addEventListener('shopify:cart:lines-update', alCambiar);
  document.addEventListener('shopify:cart:discount-update', alCambiar);

  const aviso = (titulo, texto) => {
    $('[data-demo-aviso-titulo]').textContent = titulo;
    $('[data-demo-aviso-texto]').textContent = texto;
    const d = $('#demo-aviso');
    if (!d.open) d.showModal();
  };

  document.addEventListener('click', (e) => {
    const cerrar = e.target.closest('[data-demo-cerrar]');
    if (cerrar) return cerrar.closest('dialog').close();
    if (e.target.closest('[data-demo-pagar]')) return aviso('Aquí termina la muestra', 'En la tienda, este botón lleva al pago de Shopify. Aquí no se cobra ni se envía nada.');
    if (e.target.closest('[data-demo-carrito], a[href="/cart"]')) {
      e.preventDefault();
      pintar();
      const d = $('#demo-carrito');
      if (!d.open) d.showModal();
      return;
    }
    const a = e.target.closest('a[href]');
    if (!a) return;
    if (a.hostname === 'wa.me') {
      e.preventDefault();
      const mensaje = new URL(a.href).searchParams.get('text') || '';
      return aviso('WhatsApp de la tienda', 'En la tienda, este botón abre WhatsApp con el mensaje listo. Aquí no se envía nada.' + (mensaje ? '\n\n' + mensaje : ''));
    }
    const ficha = a.getAttribute('href').match(/^#ficha-(\d+)$/);
    if (!ficha) return;
    e.preventDefault();
    const p = datos.productos.find((x) => x.variante === Number(ficha[1]));
    const d = $('#demo-ficha');
    $('img', d).src = p.img;
    $('[data-f-casa]', d).textContent = p.casa;
    $('[data-f-nombre]', d).textContent = p.nombre;
    $('[data-f-precio]', d).textContent = cop(p.precio);
    $('[data-f-accion]', d).replaceChildren(document.getElementById('accion-' + p.variante).content.cloneNode(true));
    if (!d.open) d.showModal();
  });

  // Catálogo: ?casa=Nombre muestra solo esa marca.
  const casa = new URLSearchParams(location.search).get('casa');
  const catalogo = $('[data-catalogo]');
  if (catalogo && casa) {
    catalogo.querySelectorAll('[data-casa]').forEach((el) => { el.hidden = el.dataset.casa !== casa; });
    catalogo.querySelectorAll('section').forEach((s) => { s.hidden = !s.querySelector('[data-casa]:not([hidden])'); });
    const f = $('[data-filtro]');
    f.hidden = false;
    $('b', f).textContent = casa;
  }

  document.querySelectorAll('dialog').forEach((d) => d.addEventListener('click', (e) => { if (e.target === d) d.close(); }));
  pintar();
})();
