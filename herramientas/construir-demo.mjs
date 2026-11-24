// Arma docs/ (la demo estática) con el CSS y el JavaScript reales de shopify/. Sin dependencias.
// Uso: node herramientas/construir-demo.mjs
import { readFileSync, writeFileSync, copyFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { productos, producto, portada, reglasMotor, paresTema, modo } from '../demo/datos.mjs';

const ruta = (p) => fileURLToPath(new URL('../' + p, import.meta.url));
const leer = (p) => readFileSync(ruta(p), 'utf8').replace(/\r\n/g, '\n');
const escribir = (p, t) => writeFileSync(ruta(p), t);
const seccion = (n) => leer(`shopify/sections/mc-${n}.liquid`);
const snippet = (n) => leer(`shopify/snippets/mc-${n}.liquid`);

const tomar = (texto, re, que) => {
  const m = texto.match(re);
  if (!m) throw new Error('No se encontró: ' + que);
  return m[1];
};
const css = (t, que) => tomar(t, /\{% stylesheet %\}([\s\S]*?)\{% endstylesheet %\}/, 'CSS de ' + que);
const js = (t, que) => tomar(t, /\{% javascript %\}([\s\S]*?)\{% endjavascript %\}/, 'JS de ' + que);
const estilo = (t, que) => tomar(t, /<style>([\s\S]*?)<\/style>/, 'style de ' + que);
const sinLiquid = (t, que) => {
  if (/\{[{%]/.test(t)) throw new Error('Quedó Liquid sin resolver en ' + que);
  return t;
};
const esc = (t) => t.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
const cop = (n) => '$' + String(n).replace(/\B(?=(\d{3})+$)/g, '.');
const json = (o) => JSON.stringify(o).replace(/</g, '\\u003c');

// --- Estilos y scripts ---
const S = Object.fromEntries(['hero', 'tendencias', 'quiz', '2x300-portada', '2x300', 'instagram'].map((n) => [n, seccion(n)]));
const auto = snippet('2x300-auto');
const CON_BLOQUES = ['hero', 'tendencias', 'quiz', '2x300-portada', '2x300', 'instagram'];

const heroEstilo = estilo(S.hero, 'hero')
  .replaceAll('{{ mc_display }}', "'Cormorant Garamond', Georgia, serif")
  .replaceAll('{{ mc_text }}', "'Jost', Arial, sans-serif")
  .replace(/\{%-? (if|endif)[^%]*%\}/g, '');
escribir('docs/estilos.css', sinLiquid([
  leer('demo/demo.css'),
  estilo(snippet('styles'), 'styles'),
  ...CON_BLOQUES.map((n) => css(S[n], n)),
  heroEstilo,
  estilo(snippet('whatsapp-flotante'), 'whatsapp-flotante')
].join('\n'), 'estilos.css'));

escribir('docs/componentes.js', sinLiquid([
  '// Generado desde shopify/sections por herramientas/construir-demo.mjs. No editar a mano.',
  ...CON_BLOQUES.map((n) => js(S[n], n))
].join('\n'), 'componentes.js'));

const motor = sinLiquid(tomar(auto, /<script type="module">([\s\S]*?)<\/script>/, 'motor')
  .replace(/\{% if cart\.item_count > 1 %\}pedir\(\);\{% endif %\}/, 'if (mcDemo.carrito.leer().item_count > 1) pedir();'), 'motor');

copyFileSync(ruta('demo/demo.js'), ruta('docs/demo.js'));
copyFileSync(ruta('demo/carrito-simulado.js'), ruta('docs/carrito-simulado.js'));

// --- Marcado equivalente al que produce Liquid en la tienda ---
const WA = 'https://wa.me/';
const COLECCIONES = { nicho: 'Nicho', disenador: 'Diseñador', arabes: 'Árabes' };
const wa = (texto) => `${WA}?text=${encodeURIComponent(texto)}`;
const asesoria = wa('Hola, quiero asesoría para elegir un perfume.');
const completo = (p) => esc(`${p.casa} ${p.nombre}`);
const pedido = (p) => wa(`Hola, Maison Carvajal. Quiero pedir este perfume:\n\n*Referencia:* ${p.casa} ${p.nombre}\n*Colección:* ${COLECCIONES[p.coleccion]}\n*Precio en la web:* ${cop(p.precio)}\n\n¿Me confirmas disponibilidad, precio final y tiempo de entrega? Mi ciudad de entrega es:`);

const accion = (p) => modo(p) === 'directa'
  ? `<form class="mc-tcard__form" method="post" action="/cart/add" data-mc-add><input type="hidden" name="id" value="${p.variante}"><input type="hidden" name="quantity" value="1"><button type="submit" class="mc-tcard__add" aria-label="Agregar ${completo(p)} al carrito"><span data-label>Agregar al carrito</span></button><span class="visually-hidden" role="status" data-status></span></form>`
  : `<a class="mc-tcard__add mc-tcard__add--ask" href="${esc(pedido(p))}" target="_blank" rel="noopener" aria-label="Pedir ${completo(p)} por WhatsApp (se abre en una pestaña nueva)">Pedir por WhatsApp</a>`;
const tarjeta = (p) => `<div class="mc-tcard" data-casa="${esc(p.casa)}"><a class="mc-tcard__link" href="#ficha-${p.variante}"><span class="mc-tcard__media"><img loading="lazy" src="${p.img}" alt="${completo(p)}"></span><span class="mc-tcard__body"><span class="mc-card-vendor">${esc(p.casa)}</span><span class="mc-card-name">${esc(p.nombre)}</span><span class="mc-tcard__price">${cop(p.precio)}</span></span></a>${accion(p)}</div>`;

const C = portada.sections;
const bloques = (n) => C[n].block_order ? C[n].block_order.map((k) => ({ id: k, ...C[n].blocks[k].settings })) : Object.entries(C[n].blocks).map(([id, b]) => ({ id, ...b.settings }));
const h = C.mc_hero.settings;
const hero = `<div class="section section--full-width mc-hero2"><mc-hero class="mc-hero2__inner"><canvas class="mc-hero2__aroma" aria-hidden="true"></canvas>
<div class="mc-hero2__copy"><p class="mc-eyebrow">${h.eyebrow}</p><h1 class="mc-hero__title" data-letters>${h.heading}</h1><span class="mc-rule" aria-hidden="true"></span>
<p class="mc-hero__tagline">${h.tagline}</p><p class="mc-hero__sub">${h.subheading}</p>
<div class="mc-hero__ctas"><a class="mc-btn mc-btn--light" href="catalogo.html">${h.cta_label}</a><a class="mc-btn mc-btn--ghost" href="${asesoria}" target="_blank" rel="noopener">${h.cta2_label}</a></div>
<p class="mc-hero__collections">Nicho &middot; Diseñador &middot; Árabes</p></div>
<mc-spotlight class="mc-spot" role="region" aria-roledescription="carrusel" aria-label="${h.spot_label}"><p class="mc-spot__label"><span class="mc-spot__pulse" aria-hidden="true"></span>${h.spot_label}</p>
<div class="mc-spot__stage">${h.products.map(producto).map((p) => `<a class="mc-spot__card" href="#ficha-${p.variante}" data-vendor="${esc(p.casa)}" data-name="${esc(p.nombre)}" data-price="${cop(p.precio)}" aria-label="${completo(p)}"><img src="${p.img}" alt=""></a>`).join('')}</div>
<div class="mc-spot__meta" aria-live="polite"><span class="mc-card-vendor" data-meta="vendor"></span><span class="mc-spot__name" data-meta="name"></span><span class="mc-spot__price" data-meta="price"></span></div>
<div class="mc-spot__controls"><button type="button" class="mc-spot__btn" data-action="prev" aria-label="Perfume anterior"><span aria-hidden="true">&larr;</span></button><div class="mc-spot__dots" role="group" aria-label="Elegir perfume"></div><button type="button" class="mc-spot__btn" data-action="next" aria-label="Perfume siguiente"><span aria-hidden="true">&rarr;</span></button><button type="button" class="mc-spot__btn mc-spot__btn--toggle" data-action="toggle" aria-label="Pausar rotación"><span aria-hidden="true" data-icon></span></button></div>
</mc-spotlight></mc-hero></div>`;

const s3 = C.mc_2x300_portada.settings;
const botella = (p) => `<a class="mc-p300__bottle" href="#ficha-${p.variante}"><span class="mc-p300__photo"><img loading="lazy" src="${p.img}" alt=""></span><span class="mc-p300__name">${esc(p.nombre)}</span><span class="mc-p300__vendor">${esc(p.casa)}</span></a>`;
const sugeridas = bloques('mc_2x300_portada').map((b) => [producto(b.product_1), producto(b.product_2)]);
const promo = `<div class="mc-p300-section" id="promo"><div class="section section--page-width mc-p300-wrap" style="padding-top:64px;padding-bottom:64px"><mc-p300 class="mc-p300" data-start="${s3.start}" data-cart-add-url="/cart/add.js" data-cart-url="/cart">
<div class="mc-p300__copy"><h2 class="mc-p300__title">${s3.heading}</h2><p class="mc-p300__lead">${s3.lead}</p>
<fieldset class="mc-p300__qty" data-qty hidden><legend>${s3.question}</legend><div class="mc-p300__options">${[2, 4, 6].map((n) => `<label><input type="radio" name="mc-p300-demo" value="${n}"${String(n) === s3.start ? ' checked' : ''}><span><b>${n}</b> perfumes</span></label>`).join('')}</div></fieldset>
<p class="mc-p300__note"><span data-note></span> ${s3.note}</p>
<div class="mc-p300__actions"><button type="button" class="mc-btn mc-btn--dark" data-add hidden><span data-add-label>Añadir al carrito</span></button><a class="mc-p300__link" href="2x300.html">${s3.link_label}</a></div><p class="mc-p300__status" data-status role="status"></p></div>
<div class="mc-p300__stage"><ul class="mc-p300__shelf" data-shelf data-n="2">${sugeridas.map(([a, b], i) => `<li class="mc-p300__pair" data-pair data-va="${a.variante}" data-vb="${b.variante}"${i > 1 ? ' hidden' : ''}>${botella(a)}${botella(b)}</li>`).join('')}</ul><button type="button" class="mc-p300__swap" data-swap hidden>Ver otros perfumes</button></div>
</mc-p300></div></div>`;

const cabezal = (antetitulo, titulo, intro = '', id = '') => `<div class="mc-section-head"><p class="mc-eyebrow">${antetitulo}</p><h2${id ? ` id="${id}"` : ''}>${titulo}</h2><span class="mc-rule" aria-hidden="true"></span>${intro ? `<p>${intro}</p>` : ''}</div>`;

const st = C.mc_tendencias.settings;
const tends = bloques('mc_tendencias');
const tabs = `<div class="section section--page-width spacing-style mc-trends" id="tendencias" style="padding-top:64px;padding-bottom:56px">
${cabezal(st.eyebrow, st.heading, st.intro, 'mc-trends-title')}
<mc-tabs class="mc-trends__tabs"><div class="mc-tablist" role="tablist" aria-labelledby="mc-trends-title">${tends.map((x, i) => `<button type="button" role="tab" class="mc-tab" id="mc-tab-${x.id}" aria-controls="mc-panel-${x.id}" aria-selected="${i === 0}"${i ? ' tabindex="-1"' : ''} data-block-id="${x.id}"><span class="mc-tab__num" aria-hidden="true">0${i + 1}</span><span class="mc-tab__title">${x.title}</span></button>`).join('')}</div>
${tends.map((x, i) => `<div class="mc-panel" role="tabpanel" id="mc-panel-${x.id}" aria-labelledby="mc-tab-${x.id}" tabindex="0"${i ? ' hidden' : ''}><p class="mc-panel__text">${x.text}</p><div class="mc-rail">${x.products.map(producto).map(tarjeta).join('')}${x.collection ? `<a class="mc-tcard mc-tcard--more" href="catalogo.html#${x.collection}"><span class="mc-tcard__more-label">Ver toda la colección</span><span class="mc-card-name">${COLECCIONES[x.collection]}</span><span class="mc-tcard__arrow" aria-hidden="true">&rarr;</span></a>` : ''}</div></div>`).join('')}
</mc-tabs></div>`;

const pool = `<template data-pool>${bloques('mc_quiz').map((b) => ({ p: producto(b.product), perfil: b.profile })).map(({ p, perfil }) => `<div class="mc-pool-item" data-profile="${perfil}" data-price="${p.precio}" data-title="${completo(p)}">${tarjeta(p)}</div>`).join('')}</template>`;
const quiz = `<div class="section section--page-width spacing-style mc-quiz" id="test" style="padding-top:56px;padding-bottom:56px">${leer('demo/fragmentos/quiz.html').replace('</mc-quiz>', pool + '</mc-quiz>')}<p class="mc-source">${C.mc_quiz.settings.footnote}</p></div>`;

const colecciones = `<div class="section section--page-width demo-seccion">${cabezal('Colecciones', 'Explora el catálogo')}<div class="mc-collections">${[['nicho', 'creed-aventus'], ['disenador', 'dior-sauvage-elixir'], ['arabes', 'lattafa-khamrah']].map(([c, p]) => `<a class="mc-collection-tile mc-collection-tile--photo" href="catalogo.html#${c}"><img loading="lazy" src="${producto(p).img}" alt=""><span class="mc-collection-tile__label"><span class="mc-collection-tile__name">${COLECCIONES[c]}</span><span class="mc-collection-tile__cta" aria-hidden="true">Ver</span></span></a>`).join('')}</div></div>`;

const si = C.mc_instagram.settings;
const instagram = `<div class="section section--page-width spacing-style mc-ig" style="padding-top:56px;padding-bottom:56px">${cabezal(si.eyebrow, si.heading, si.intro)}
<mc-instagram class="mc-ig__rail">${bloques('mc_instagram').map((b) => `<article class="mc-ig__item"><div class="mc-ig__frame"><iframe data-src="${b.url}embed/" title="Publicación de Maison Carvajal (Instagram)" loading="lazy" allowfullscreen scrolling="no"></iframe><a class="mc-ig__fallback" href="${b.url}" target="_blank" rel="noopener"><span class="mc-ig__fallback-label">Instagram</span><span class="mc-card-name">Publicación de Maison Carvajal</span><span class="mc-ig__fallback-cta">Ver publicación <span aria-hidden="true">&rarr;</span></span><span class="visually-hidden"> (se abre en una pestaña nueva)</span></a></div></article>`).join('')}</mc-instagram>
<div class="mc-ig__actions"><a class="mc-btn mc-btn--dark" href="${si.profile_url}" target="_blank" rel="noopener">${si.profile_label}<span class="visually-hidden"> (Instagram, se abre en una pestaña nueva)</span></a></div></div>`;

const casasDe = (c) => [...new Set(productos.filter((p) => p.coleccion === c && p.precio && !p.agotado).map((p) => p.casa))].sort((a, b) => a.localeCompare(b, 'es', { sensitivity: 'base' }));
const casas = `<div class="section section--page-width demo-seccion" id="marcas">${cabezal('Casas', 'Busca por marca')}<div class="mc-houses">${Object.entries(COLECCIONES).map(([c, n]) => `<div><h3>${n}</h3><ul>${casasDe(c).map((v) => `<li><a href="catalogo.html?casa=${encodeURIComponent(v)}">${esc(v)}</a></li>`).join('')}</ul></div>`).join('')}</div></div>`;

const ayuda = `<div class="section section--page-width demo-seccion">${C.mc_asesoria.settings.custom_liquid.replace(/\{% render 'mc-whatsapp'[^%]*label: '([^']*)' %\}/, (_, l) => `<a class="mc-btn mc-btn--dark" href="${asesoria}" target="_blank" rel="noopener">${l}</a>`)}</div>`;

const flotante = snippet('whatsapp-flotante').match(/<svg[\s\S]*?<\/svg>/)[0];

const catalogo = `<div class="demo-catalogo" data-catalogo><div class="section--page-width"><h1>Catálogo</h1><p class="demo-filtro" data-filtro hidden>Mostrando <b></b>. <a href="catalogo.html">Ver todas las marcas</a></p>
${Object.entries(COLECCIONES).map(([c, n]) => `<section id="${c}" aria-labelledby="t-${c}"><h2 id="t-${c}">${n}</h2><div class="demo-rejilla">${productos.filter((p) => p.coleccion === c).sort((a, b) => (a.casa + a.nombre).localeCompare(b.casa + b.nombre, 'es')).map(tarjeta).join('')}</div></section>`).join('\n')}</div></div>`;

// --- Página 2x300 ---
const etiquetas = { esencial: 'Esencial', plus: 'Plus', premium: 'Premium' };
const duoCard = (p) => `<li class="mc-duo-card" data-duo-card data-id="${p.id}" data-cat="${p.duo}" data-name="${esc(p.casa)} ${esc(p.nombre)}" data-role="idle"><a class="mc-duo-card__media" href="#ficha-${p.variante}" tabindex="-1" aria-hidden="true"><img loading="lazy" src="${p.img}" alt=""><span class="mc-duo-card__flag" data-duo-flag></span></a><div class="mc-duo-card__body"><p class="mc-card-vendor">${esc(p.casa)}</p><h3 class="mc-card-name mc-duo-card__name"><a href="#ficha-${p.variante}">${esc(p.nombre)}</a></h3><span class="mc-duo-tag">${etiquetas[p.duo]}</span><input type="hidden" data-variant value="${p.variante}" data-title="" data-price="${p.precio * 100}" data-available="true"><p class="mc-duo-card__state" data-duo-state></p><button type="button" class="mc-duo-card__pick" data-duo-pick aria-pressed="false" aria-label="Elegir ${esc(p.casa)} ${esc(p.nombre)}">Elegir</button></div></li>`;
const D = S['2x300'];
const trozo = (desde, hasta) => {
  const i = D.indexOf(desde);
  const j = D.indexOf(hasta, i);
  if (i < 0 || j < 0) throw new Error('No se encontró el fragmento de la página 2x300: ' + desde);
  return D.slice(i, j).replaceAll('{{ section.id }}', 'demo').replaceAll('{{ routes.cart_url }}', '/cart').replaceAll('{{ titulo }}', '2x300').replace(/\{%- if section\.settings\.show_invitation[\s\S]*?\{%- endif -%\}/, '<p class="mc-duo-invite">' + JSON.parse(leer('shopify/templates/page.2x300.json')).sections.mc_2x300.settings.invitation + '</p>');
};
const duo = `<div class="section section--page-width spacing-style mc-duo-section" style="padding-top:48px;padding-bottom:64px"><mc-duo class="mc-duo" data-step="0" data-cart-url="/cart" data-cart-add-url="/cart/add.js">
${trozo('<header class="mc-duo-head">', '<ul class="mc-duo-grid"')}
<ul class="mc-duo-grid" role="list">${['esencial', 'plus', 'premium'].flatMap((c) => productos.filter((p) => p.duo === c)).map(duoCard).join('')}</ul>
${trozo('<p class="mc-duo-empty" data-duo-empty', '<script type="application/json" data-duo-pairs>')}
<script type="application/json" data-duo-pairs>${json(paresTema)}</script></mc-duo></div>`;

// --- Páginas ---
const EVENTOS = `class Base extends Event{constructor(t,d){super(t,{bubbles:true});Object.assign(this,d)}static createPromise(){let resolve,reject;const promise=new Promise((a,b)=>{resolve=a;reject=b});return{promise,resolve,reject}}static createCartFromAjaxResponse(c){return{totalQuantity:c.item_count}}}export class CartLinesUpdateEvent extends Base{constructor(d){super('shopify:cart:lines-update',d)}}export class CartDiscountUpdateEvent extends Base{constructor(d){super('shopify:cart:discount-update',d)}}`;
const datos = { productos: productos.map(({ variante, casa, nombre, precio, img }) => ({ variante, casa, nombre, precio, img })), reglas: reglasMotor };

const pagina = (titulo, cuerpo, inicio) => sinLiquid(`<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex">
<title>${titulo}</title>
<meta name="description" content="Muestra de la tienda Maison Carvajal, perfumería en Barranquilla.">
<link rel="icon" href="mc-monograma-negro.png">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600&family=Jost:wght@400;500;600&family=Libre+Baskerville&family=Montserrat:wght@400;500;600&display=swap">
<link rel="stylesheet" href="estilos.css">
<script type="importmap">${json({ imports: { '@shopify/events': 'data:text/javascript,' + encodeURIComponent(EVENTOS) } })}</script>
</head>
<body>
<p class="demo-barra">Muestra de portafolio: el carrito y WhatsApp son simulados, y las parejas 2x300 son de ejemplo.</p>
<header class="demo-cabecera"><a href="index.html" aria-label="Maison Carvajal, inicio"><img src="mc-monograma-negro.png" width="46" height="44" alt=""></a>
<nav aria-label="Principal"><a class="demo-pildora" href="2x300.html">2x300</a><a href="catalogo.html#nicho">Nicho</a><a href="catalogo.html#disenador">Diseñador</a><a href="catalogo.html#arabes">Árabes</a><a href="${inicio}#marcas">Marcas</a></nav>
<button type="button" class="demo-abrir" data-demo-carrito>Carrito (<b data-demo-cuenta>0</b>)</button></header>
<main>
${cuerpo}
</main>
<footer class="demo-pie"><p>Proyecto de Alejandro Carvajal. En la tienda, estas secciones funcionan sobre el tema Horizon de Shopify.</p></footer>
<a class="mc-wa-float" href="${asesoria}" target="_blank" rel="noopener" aria-label="Escribir por WhatsApp (se abre en una pestaña nueva)">${flotante}</a>
<dialog class="demo-dialogo demo-lateral" id="demo-carrito" aria-labelledby="demo-carrito-t"><h2 id="demo-carrito-t">Tu carrito</h2>
<p data-demo-vacio>Todavía no hay perfumes. Agrega dos del 2x300 para ver el descuento.</p>
<ul data-demo-lineas></ul>
<div class="demo-resumen" data-demo-resumen hidden><h3>Parejas 2x300 aplicadas</h3><ul data-demo-promos></ul>
<dl class="demo-totales"><div><dt>Por separado</dt><dd data-demo-bruto></dd></div><div><dt>Descuento</dt><dd data-demo-ahorro></dd></div><div><dt>Total</dt><dd data-demo-total></dd></div></dl></div>
<div class="demo-acciones"><button type="button" class="demo-principal" data-demo-pagar>Finalizar</button><button type="button" data-demo-cerrar>Seguir viendo</button></div></dialog>
<dialog class="demo-dialogo" id="demo-aviso" aria-labelledby="demo-aviso-t"><h2 id="demo-aviso-t" data-demo-aviso-titulo></h2><p data-demo-aviso-texto></p><div class="demo-acciones"><button type="button" class="demo-principal" data-demo-cerrar>Entendido</button></div></dialog>
<dialog class="demo-dialogo demo-ficha" id="demo-ficha" aria-labelledby="demo-ficha-t"><img alt=""><p class="mc-card-vendor" data-f-casa></p><h2 id="demo-ficha-t" data-f-nombre></h2><p data-f-precio></p><div data-f-accion></div><div class="demo-acciones"><button type="button" data-demo-cerrar>Cerrar</button></div></dialog>
${productos.map((p) => `<template id="accion-${p.variante}">${accion(p)}</template>`).join('')}
<script type="application/json" id="demo-datos">${json(datos)}</script>
<script type="application/json" id="mc-2x300-reglas">${json(reglasMotor)}</script>
<script src="carrito-simulado.js"></script>
<script src="demo.js"></script>
<script src="componentes.js"></script>
<script type="module">${motor}</script>
</body>
</html>
`.replace(/<a [^>]*https:\/\/wa\.me[^>]*>/g, (a) => a.replace(' target="_blank" rel="noopener"', '').replace(' (se abre en una pestaña nueva)', '')), titulo);

escribir('docs/index.html', pagina('Maison Carvajal', [hero, promo, tabs, colecciones, quiz, instagram, casas, ayuda].join('\n'), ''));
escribir('docs/2x300.html', pagina('2x300 · Maison Carvajal', duo, 'index.html'));
escribir('docs/catalogo.html', pagina('Catálogo · Maison Carvajal', catalogo, 'index.html'));
escribir('docs/.nojekyll', '');
console.log(`Muestra lista: ${productos.length} perfumes, ${reglasMotor.p.length} parejas 2x300.`);
