// Generado desde shopify/sections por herramientas/construir-demo.mjs. No editar a mano.

  if (!customElements.get('mc-hero')) {
    customElements.define(
      'mc-hero',
      class extends HTMLElement {
        connectedCallback() {
          // Letras del nombre que aparecen una a una (el texto completo queda para lectores de pantalla).
          const title = this.querySelector('[data-letters]');
          if (title && !title.dataset.split) {
            const text = title.textContent.trim();
            title.dataset.split = '1';
            title.setAttribute('aria-label', text);
            title.innerHTML = '';
            let i = 0;
            text.split(/\s+/).forEach((word, w) => {
              if (w > 0) title.appendChild(document.createTextNode(' '));
              // Cada palabra queda junta para que nunca se parta entre líneas.
              const wordEl = document.createElement('span');
              wordEl.className = 'mc-word';
              wordEl.setAttribute('aria-hidden', 'true');
              Array.from(word).forEach((ch) => {
                const span = document.createElement('span');
                span.className = 'mc-letter';
                span.style.setProperty('--i', i++);
                span.textContent = ch;
                wordEl.appendChild(span);
              });
              title.appendChild(wordEl);
              i++;
            });
          }
          this.initAroma();
        }
        // Estela de aroma: partículas doradas que suben como el perfume y se apartan del cursor o del dedo.
        initAroma() {
          const canvas = this.querySelector('.mc-hero2__aroma');
          if (!canvas || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
          const ctx = canvas.getContext('2d');
          if (!ctx) return;
          const mobile = window.matchMedia('(max-width: 749px)').matches;
          const dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.5 : 2);
          const count = mobile ? 50 : 115;
          const pointer = { x: -9999, y: -9999 };
          let w = 0, h = 0, raf = 0, visible = false;
          const gauss = () => (Math.random() + Math.random() + Math.random() - 1.5) / 1.5;
          const spawn = (p, anywhere) => {
            p.x = w / 2 + gauss() * w * 0.42;
            p.y = anywhere ? Math.random() * h : h + 10 + Math.random() * 40;
            p.r = 0.8 + Math.random() * 2.3;
            p.vy = 0.18 + Math.random() * 0.5;
            p.sway = 0.2 + Math.random() * 0.5;
            p.seed = Math.random() * 1000;
            p.a = 0.35 + Math.random() * 0.55;
            return p;
          };
          const resize = () => {
            const r = this.getBoundingClientRect();
            w = r.width; h = r.height;
            canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
            ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
          };
          resize();
          const parts = Array.from({ length: count }, () => spawn({}, true));
          const tick = (t) => {
            ctx.clearRect(0, 0, w, h);
            for (const p of parts) {
              p.y -= p.vy;
              p.x += Math.sin(t / 1400 + p.seed) * p.sway * 0.35;
              const dx = p.x - pointer.x, dy = p.y - pointer.y, d = Math.hypot(dx, dy);
              if (d < 130 && d > 0.1) { const f = (1 - d / 130) * 2.2; p.x += (dx / d) * f; p.y += (dy / d) * f; }
              if (p.y < -12 || p.x < -20 || p.x > w + 20) spawn(p, false);
              const fadeIn = Math.min(1, (h - p.y) / (h * 0.2));
              const fadeOut = Math.min(1, p.y / (h * 0.3));
              const alpha = Math.max(0, p.a * fadeIn * fadeOut);
              ctx.beginPath(); ctx.fillStyle = `rgba(198,166,107,${alpha * 0.2})`; ctx.arc(p.x, p.y, p.r * 5, 0, 6.283); ctx.fill();
              ctx.beginPath(); ctx.fillStyle = `rgba(232,212,170,${alpha})`; ctx.arc(p.x, p.y, p.r, 0, 6.283); ctx.fill();
            }
            raf = requestAnimationFrame(tick);
          };
          const start = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(tick); };
          const stop = () => { cancelAnimationFrame(raf); raf = 0; };
          this.onMove = (e) => { const r = this.getBoundingClientRect(); pointer.x = e.clientX - r.left; pointer.y = e.clientY - r.top; };
          this.onLeave = () => { pointer.x = pointer.y = -9999; };
          this.onVis = () => (document.hidden ? stop() : start());
          this.addEventListener('pointermove', this.onMove);
          this.addEventListener('pointerleave', this.onLeave);
          document.addEventListener('visibilitychange', this.onVis);
          this.ro = new ResizeObserver(resize);
          this.ro.observe(this);
          this.io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; visible ? start() : stop(); });
          this.io.observe(this);
          this.stopAroma = stop;
          canvas.classList.add('is-on');
        }
        disconnectedCallback() {
          if (this.stopAroma) this.stopAroma();
          if (this.ro) this.ro.disconnect();
          if (this.io) this.io.disconnect();
          this.removeEventListener('pointermove', this.onMove);
          this.removeEventListener('pointerleave', this.onLeave);
          document.removeEventListener('visibilitychange', this.onVis);
        }
      }
    );
  }
  if (!customElements.get('mc-spotlight')) {
    customElements.define(
      'mc-spotlight',
      class extends HTMLElement {
        connectedCallback() {
          this.cards = Array.from(this.querySelectorAll('.mc-spot__card'));
          if (!this.cards.length) return;
          this.index = 0;
          this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          this.paused = this.reduced || this.cards.length < 2;
          this.hovering = false;
          this.dotsWrap = this.querySelector('.mc-spot__dots');
          this.toggleBtn = this.querySelector('[data-action="toggle"]');
          this.dotsWrap.innerHTML = '';
          this.dots = this.cards.map((card, i) => {
            const dot = document.createElement('button');
            dot.type = 'button';
            dot.className = 'mc-spot__dot';
            dot.setAttribute('aria-label', `${card.dataset.vendor} ${card.dataset.name}`);
            dot.addEventListener('click', () => this.go(i, true));
            this.dotsWrap.appendChild(dot);
            return dot;
          });
          this.querySelector('[data-action="prev"]').addEventListener('click', () => this.go(this.index - 1, true));
          this.querySelector('[data-action="next"]').addEventListener('click', () => this.go(this.index + 1, true));
          this.toggleBtn.addEventListener('click', () => this.setPaused(!this.paused));
          this.cards.forEach((card, i) => {
            card.addEventListener('click', (e) => {
              if (i !== this.index) {
                e.preventDefault();
                this.go(i, true);
              }
            });
          });
          this.addEventListener('mouseenter', () => (this.hovering = true));
          this.addEventListener('mouseleave', () => (this.hovering = false));
          this.addEventListener('focusin', () => (this.hovering = true));
          this.addEventListener('focusout', () => (this.hovering = false));
          this.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowRight') { e.preventDefault(); this.go(this.index + 1, true); }
            if (e.key === 'ArrowLeft') { e.preventDefault(); this.go(this.index - 1, true); }
          });
          const stage = this.querySelector('.mc-spot__stage');
          let startX = null;
          stage.addEventListener('touchstart', (e) => (startX = e.touches[0].clientX), { passive: true });
          stage.addEventListener('touchend', (e) => {
            if (startX === null) return;
            const dx = e.changedTouches[0].clientX - startX;
            if (Math.abs(dx) > 40) this.go(this.index + (dx < 0 ? 1 : -1), true);
            startX = null;
          });
          this.setPaused(this.paused);
          this.render();
          this.timer = setInterval(() => {
            if (!this.paused && !this.hovering && !document.hidden) this.go(this.index + 1);
          }, 4500);
        }
        disconnectedCallback() {
          clearInterval(this.timer);
        }
        setPaused(value) {
          this.paused = value;
          if (!this.toggleBtn) return;
          this.toggleBtn.setAttribute('aria-label', value ? 'Reanudar rotación' : 'Pausar rotación');
          this.toggleBtn.querySelector('[data-icon]').innerHTML = value
            ? '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><path d="M2.5 1.2v9.6L10.5 6z"/></svg>'
            : '<svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor"><rect x="2" y="1.5" width="2.6" height="9" rx="0.5"/><rect x="7.4" y="1.5" width="2.6" height="9" rx="0.5"/></svg>';
          this.toggleBtn.hidden = this.cards.length < 2;
        }
        go(i) {
          const n = this.cards.length;
          this.index = ((i % n) + n) % n;
          this.render();
        }
        render() {
          const n = this.cards.length;
          this.cards.forEach((card, i) => {
            let pos = i - this.index;
            if (pos > n / 2) pos -= n;
            if (pos < -n / 2) pos += n;
            const visible = Math.abs(pos) <= 1 && n > 1 ? pos : pos === 0 ? 0 : 'off';
            card.dataset.pos = String(visible);
            const active = pos === 0;
            card.tabIndex = active ? 0 : -1;
            card.setAttribute('aria-hidden', active ? 'false' : 'true');
          });
          this.dots.forEach((d, i) => d.setAttribute('aria-current', i === this.index ? 'true' : 'false'));
          const c = this.cards[this.index];
          this.querySelector('[data-meta="vendor"]').textContent = c.dataset.vendor;
          this.querySelector('[data-meta="name"]').textContent = c.dataset.name;
          this.querySelector('[data-meta="price"]').textContent = c.dataset.price;
        }
      }
    );
  }

  // Aparición al hacer scroll de títulos y tarjetas de la home (en cascada dentro de cada grupo).
  if (!window.__mcReveal) {
    window.__mcReveal = true;
    const runReveal = () => {
      const root = document.documentElement;
      if (
        root.classList.contains('shopify-design-mode') ||
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !('IntersectionObserver' in window)
      ) return;
      const sel = '.mc-section-head, .mc-tablist, .mc-trends .mc-tcard, .mc-collection-tile, .mc-houses > div, .mc-steps li, .mc-advice > div:first-child, .mc-quiz__box, .mc-ig__item, .mc-ig__actions';
      const els = Array.from(document.querySelectorAll(sel));
      if (!els.length) return;
      els.forEach((el) => {
        const group = Array.from(el.parentElement.children).filter((c) => c.matches(sel));
        el.style.setProperty('--mc-d', `${Math.min(group.indexOf(el), 5) * 90}ms`);
        el.classList.add('mc-rv');
      });
      root.classList.add('mc-reveal-on');
      const io = new IntersectionObserver(
        (entries) => entries.forEach((en) => {
          if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
        }),
        { rootMargin: '0px 0px -8% 0px', threshold: 0.12 }
      );
      els.forEach((el) => io.observe(el));
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', runReveal);
    else runReveal();
  }


  if (!customElements.get('mc-tabs')) {
    customElements.define(
      'mc-tabs',
      class extends HTMLElement {
        connectedCallback() {
          this.tabs = Array.from(this.querySelectorAll('[role="tab"]'));
          this.tabs.forEach((tab, i) => {
            tab.addEventListener('click', () => this.select(i));
            tab.addEventListener('keydown', (e) => {
              const last = this.tabs.length - 1;
              let next = null;
              if (e.key === 'ArrowRight') next = i === last ? 0 : i + 1;
              if (e.key === 'ArrowLeft') next = i === 0 ? last : i - 1;
              if (e.key === 'Home') next = 0;
              if (e.key === 'End') next = last;
              if (next !== null) {
                e.preventDefault();
                this.select(next, true);
              }
            });
          });
          this.onBlockSelect = (e) => {
            const i = this.tabs.findIndex((t) => t.dataset.blockId === e.detail.blockId);
            if (i > -1) this.select(i);
          };
          document.addEventListener('shopify:block:select', this.onBlockSelect);
        }
        disconnectedCallback() {
          document.removeEventListener('shopify:block:select', this.onBlockSelect);
        }
        select(index, focus) {
          this.tabs.forEach((tab, i) => {
            const on = i === index;
            tab.setAttribute('aria-selected', on ? 'true' : 'false');
            tab.tabIndex = on ? 0 : -1;
            const panel = this.querySelector('#' + tab.getAttribute('aria-controls'));
            if (!panel) return;
            const wasHidden = panel.hidden;
            panel.hidden = !on;
            panel.classList.remove('is-entering');
            if (on && wasHidden) {
              void panel.offsetWidth;
              panel.classList.add('is-entering');
            }
          });
          const tab = this.tabs[index];
          if (focus) tab.focus();
          tab.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' });
        }
      }
    );
  }

  // "Agregar al carrito" de las tarjetas MC (tendencias y test), sin salir de la página.
  // Usa el mismo evento que la ficha de producto del tema, así el contador y el carrito lateral
  // se actualizan solos. Si algo falla, el formulario se envía normal y lleva al carrito.
  if (!window.__mcCartAdd) {
    window.__mcCartAdd = true;
    const setState = (form, state, label, status) => {
      const btn = form.querySelector('.mc-tcard__add');
      const text = form.querySelector('[data-label]');
      if (!form.dataset.label) form.dataset.label = text.textContent;
      if (state) btn.dataset.state = state; else btn.removeAttribute('data-state');
      btn.disabled = state === 'loading';
      text.textContent = label || form.dataset.label;
      form.querySelector('[data-status]').textContent = status || '';
    };
    document.addEventListener('submit', async (e) => {
      const form = e.target instanceof HTMLFormElement && e.target.matches('form[data-mc-add]') ? e.target : null;
      if (!form) return;
      // "Theme" lo declara el tema con const: existe como global, pero no como window.Theme.
      const routes = typeof Theme !== 'undefined' && Theme ? Theme.routes : null;
      if (!routes || !routes.cart_add_url || !window.fetch) return;
      e.preventDefault();
      if (form.dataset.busy) return;
      form.dataset.busy = '1';
      clearTimeout(form.mcTimer);
      setState(form, 'loading', 'Agregando…');

      const id = form.querySelector('[name="id"]').value;
      const sectionIds = Array.from(document.querySelectorAll('cart-items-component'))
        .map((el) => el.dataset.sectionId)
        .filter(Boolean);
      let Ev = null;
      let deferred = null;
      try {
        Ev = (await import('@shopify/events')).CartLinesUpdateEvent;
        deferred = Ev.createPromise();
        form.dispatchEvent(
          new Ev({
            action: 'add',
            context: 'product',
            lines: [{ merchandiseId: String(id), quantity: 1 }],
            promise: deferred.promise,
          })
        );
      } catch (err) {
        deferred = null;
      }

      try {
        const res = await fetch(routes.cart_add_url, {
          method: 'POST',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({ items: [{ id: Number(id), quantity: 1 }], sections: sectionIds.join(',') }),
        });
        const data = await res.json();
        if (!res.ok || data.status) throw new Error(data.description || data.message || 'No se pudo agregar');
        const cart = await fetch(`${routes.cart_url}.json`, {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
        }).then((r) => r.json());
        if (deferred) {
          deferred.resolve({
            cart: Ev.createCartFromAjaxResponse(cart),
            detail: { items: cart.items, source: 'mc-card', itemCount: 1, sections: data.sections, didError: false },
          });
          setState(form, 'added', 'Agregado ✓', 'Perfume agregado al carrito');
        } else {
          // Sin los eventos del tema no hay cómo refrescar el carrito lateral: se abre la página del carrito.
          window.location.href = routes.cart_url;
          return;
        }
      } catch (err) {
        if (deferred) deferred.reject(err);
        setState(form, 'error', 'No se pudo agregar', String((err && err.message) || 'No se pudo agregar al carrito'));
      }
      delete form.dataset.busy;
      form.mcTimer = setTimeout(() => setState(form, ''), 2600);
    });
  }


  if (!customElements.get('mc-quiz')) {
    customElements.define(
      'mc-quiz',
      class extends HTMLElement {
        connectedCallback() {
          this.steps = Array.from(this.querySelectorAll('.mc-q'));
          this.result = this.querySelector('[data-result]');
          this.back = this.querySelector('[data-back]');
          this.current = 0;
          this.next = this.querySelector('[data-next]');
          this.steps.forEach((step, i) => {
            step.addEventListener('change', () => this.updateNav());
            step.addEventListener('click', (e) => {
              const input = e.target.closest('input');
              if (!input) return;
              this.updateNav();
              // Con mouse o toque avanza solo; con teclado se usa el botón Continuar.
              if (e.detail > 0) setTimeout(() => this.show(i + 1), 220);
            });
          });
          this.back.addEventListener('click', () => this.show(Math.max(0, this.current - 1), true));
          this.next.addEventListener('click', () => this.show(this.current + 1, true));
          this.querySelector('[data-restart]').addEventListener('click', () => {
            this.querySelectorAll('input[type="radio"]').forEach((r) => (r.checked = false));
            this.show(0, true);
          });
          this.show(0);
        }
        updateNav() {
          const step = this.steps[this.current];
          this.next.hidden = !step || !step.querySelector('input:checked');
        }
        value(step) {
          const input = this.steps[step].querySelector('input:checked');
          return input ? { value: input.value, label: input.dataset.label || input.value } : null;
        }
        show(i, focus) {
          this.current = i;
          const done = i >= this.steps.length;
          this.steps.forEach((s, n) => (s.hidden = n !== i));
          this.result.hidden = !done;
          this.back.hidden = i === 0 || done;
          this.updateNav();
          const total = this.steps.length;
          this.querySelector('[data-progress]').style.width = `${(Math.min(i + 1, total) / total) * 100}%`;
          this.querySelector('[data-step-label]').textContent = done ? 'Listo' : `Paso ${i + 1} de ${total}`;
          if (done) {
            this.renderResult();
            this.result.focus({ preventScroll: true });
          } else if (focus) {
            const first = this.steps[i].querySelector('input');
            if (first) first.focus();
          }
        }
        renderResult() {
          const para = this.value(0);
          const perfil = this.value(1);
          const pres = this.value(2);
          if (!para || !perfil || !pres) return this.show(0);
          const [min, max] = pres.value.split('-').map(Number);
          const tpl = this.querySelector('template[data-pool]');
          const pool = Array.from(tpl.content.querySelectorAll('.mc-pool-item'));
          const sameProfile = pool.filter((el) => el.dataset.profile === perfil.value);
          let matches = sameProfile.filter((el) => {
            const p = Number(el.dataset.price);
            return p > 0 && p >= min && p <= max;
          });
          let exact = true;
          if (!matches.length) {
            exact = false;
            const target = max > 900000000 ? min : (min + max) / 2;
            matches = sameProfile
              .slice()
              .sort((a, b) => Math.abs(Number(a.dataset.price) - target) - Math.abs(Number(b.dataset.price) - target));
          }
          matches = matches.slice(0, 4);
          const wrap = this.querySelector('[data-results]');
          wrap.innerHTML = '';
          matches.forEach((el) => wrap.appendChild(el.firstElementChild.cloneNode(true)));
          this.querySelector('[data-result-title]').textContent = `Aromas ${perfil.label}, ${pres.label}`;
          this.querySelector('[data-result-note]').textContent = exact
            ? 'Estas referencias del catálogo encajan con lo que buscas. Escríbenos para confirmar precio, presentación y disponibilidad.'
            : 'No encontramos opciones de ese perfil en ese rango; estas son las más cercanas. Escríbenos y te ayudamos a encontrar una alternativa.';
          const names = matches.map((el) => el.dataset.title).join(', ');
          const msg =
            `Hola, hice el test de la web. Busco un perfume ${para.value}, me gustan los aromas ${perfil.label} ` +
            `y mi presupuesto es ${pres.label}.` +
            (names ? ` Me salieron: ${names}.` : '') +
            ' ¿Qué me recomiendas?';
          this.querySelector('[data-wa-link]').href = `https://wa.me/${this.dataset.wa}?text=${encodeURIComponent(msg)}`;
        }
      }
    );
  }


  if (!customElements.get('mc-p300')) {
    customElements.define(
      'mc-p300',
      class extends HTMLElement {
        connectedCallback() {
          this.pairs = Array.from(this.querySelectorAll('[data-pair]'));
          if (!this.pairs.length || this.ready) return;
          this.ready = true;
          this.$ = (s) => this.querySelector(s);
          this.offset = 0;
          this.n = Math.max(1, Math.min(this.pairs.length, Math.round(Number(this.dataset.start || 2) / 2)));
          const qty = this.$('[data-qty]');
          if (qty) {
            qty.hidden = false;
            const r = qty.querySelector('input[value="' + this.n * 2 + '"]');
            if (r) r.checked = true;
          }
          this.$('[data-add]').hidden = false;
          this.addEventListener('change', (e) => {
            if (!e.target.matches('[data-qty] input')) return;
            this.n = Number(e.target.value) / 2;
            this.offset = 0;
            this.say('');
            this.render();
          });
          this.addEventListener('click', (e) => {
            if (e.target.closest('[data-add]')) return this.add();
            if (e.target.closest('[data-swap]')) {
              this.offset = (this.offset + this.n) % this.pairs.length;
              this.say('');
              this.render();
            }
          });
          this.render();
        }

        current() {
          return Array.from({ length: this.n }, (_, i) => this.pairs[(this.offset + i) % this.pairs.length]);
        }

        render() {
          const on = this.current();
          const shelf = this.$('[data-shelf]');
          this.pairs.forEach((p) => { p.hidden = !on.includes(p); });
          on.forEach((p) => shelf.appendChild(p));
          shelf.dataset.n = this.n;
          this.$('[data-add-label]').textContent = 'Añadir estos ' + this.n * 2 + ' al carrito';
          this.$('[data-note]').textContent =
            this.n === 1 ? '2 perfumes son una promoción.' : this.n * 2 + ' perfumes son ' + this.n + ' promociones en el mismo pedido.';
          const swap = this.$('[data-swap]');
          if (swap) swap.hidden = this.pairs.length <= this.n;
        }

        say(text, link) {
          const s = this.$('[data-status]');
          s.textContent = text;
          if (!link) return;
          const a = document.createElement('a');
          a.href = link;
          a.textContent = 'Ver carrito';
          s.append(' ', a);
        }

        async add() {
          const btn = this.$('[data-add]');
          if (btn.getAttribute('aria-busy') === 'true') return;
          const label = this.$('[data-add-label]');
          const antes = label.textContent;
          const ids = this.current().flatMap((p) => [Number(p.dataset.va), Number(p.dataset.vb)]);
          const routes = typeof Theme !== 'undefined' && Theme && Theme.routes ? Theme.routes : null;
          const addUrl = (routes && routes.cart_add_url) || this.dataset.cartAddUrl || '/cart/add';
          const cartUrl = (routes && routes.cart_url) || this.dataset.cartUrl || '/cart';
          const sections = Array.from(document.querySelectorAll('cart-items-component')).map((el) => el.dataset.sectionId).filter(Boolean);
          btn.setAttribute('aria-busy', 'true');
          label.textContent = 'Agregando…';
          this.say('');
          let Ev = null;
          let deferred = null;
          try {
            Ev = (await import('@shopify/events')).CartLinesUpdateEvent;
            deferred = Ev.createPromise();
            this.dispatchEvent(new Ev({ action: 'add', context: 'product', lines: ids.map((id) => ({ merchandiseId: String(id), quantity: 1 })), promise: deferred.promise }));
          } catch (e) {
            deferred = null;
          }
          try {
            const res = await fetch(addUrl, {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ items: ids.map((id) => ({ id, quantity: 1 })), sections: sections.join(',') }),
            });
            const data = await res.json();
            if (!res.ok || data.status) throw new Error(data.description || data.message || 'No se pudo agregar');
            const cart = await fetch(cartUrl + '.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then((r) => r.json());
            if (deferred) deferred.resolve({ cart: Ev.createCartFromAjaxResponse(cart), detail: { items: cart.items, source: 'mc-p300', itemCount: ids.length, sections: data.sections, didError: false } });
            else if (window.mc2x300 && window.mc2x300.revisar) window.mc2x300.revisar();
            this.say('Listo, agregamos ' + ids.length + ' perfumes.', cartUrl);
          } catch (e) {
            if (deferred) deferred.reject(e);
            this.say('No pudimos agregarlos. Revisa tu conexión e intenta otra vez.');
          } finally {
            btn.removeAttribute('aria-busy');
            label.textContent = antes;
          }
        }
      }
    );
  }


  if (!customElements.get('mc-duo')) {
    const COP = (n) => '$' + Math.round(n).toLocaleString('es-CO').replace(/,/g, '.');
    const LABEL = { esencial: 'Esencial', plus: 'Plus', premium: 'Premium' };

    customElements.define(
      'mc-duo',
      class extends HTMLElement {
        connectedCallback() {
          if (this.ready) return;
          let data = {};
          try {
            data = JSON.parse(this.querySelector('[data-duo-pairs]').textContent);
          } catch (e) {
            data = {};
          }
          this.ready = true;
          this.pairs = data.pares || {};
          this.first = null;
          this.second = null;
          this.filter = 'todos';
          this.added = 0;
          this.cards = Array.from(this.querySelectorAll('[data-duo-card]')).map((el) => ({
            el,
            id: el.dataset.id,
            cat: el.dataset.cat,
            name: el.dataset.name,
            input: el.querySelector('[data-variant]'),
            pick: el.querySelector('[data-duo-pick]'),
            state: el.querySelector('[data-duo-state]'),
            flag: el.querySelector('[data-duo-flag]'),
          }));
          this.$ = (s) => this.querySelector(s);

          this.addEventListener('click', (e) => {
            const pick = e.target.closest('[data-duo-pick]');
            if (pick) return this.onPick(this.cards.find((c) => c.pick === pick));
            const f = e.target.closest('[data-duo-filter]');
            if (f) return this.setFilter(f.dataset.duoFilter);
            if (e.target.closest('[data-duo-cta]')) return this.addToCart();
            if (e.target.closest('[data-duo-again]')) {
              this.reset(true);
              const grid = this.$('.mc-duo-toolbar');
              if (grid) grid.scrollIntoView({ behavior: 'smooth', block: 'start' });
              return;
            }
            if (e.target.closest('[data-duo-reset]')) return this.reset(true);
          });
          this.addEventListener('change', (e) => {
            const card = this.cards.find((c) => c.input === e.target);
            if (card) this.onVariant(card);
          });
          this.updateTiers();
          this.render();
        }

        variant(card) {
          const i = card.input;
          if (!i) return null;
          const o = i.tagName === 'SELECT' ? i.selectedOptions[0] : i;
          return { id: Number(i.value), title: o.dataset.title || '', price: Number(o.dataset.price) / 100, available: o.dataset.available === 'true' };
        }

        // Pareja con promoción para las variantes elegidas; null si no se ofrece.
        pair(a, b, va, vb) {
          if (!a || !b || a === b) return null;
          va = va || this.variant(a);
          vb = vb || this.variant(b);
          if (!va || !vb || !va.available || !vb.available) return null;
          const key = [va.id, vb.id].sort((x, y) => x - y).join('-');
          const t = this.pairs[key];
          if (!t) return null;
          const subtotal = t[0] * 1000;
          // El descuento es un monto fijo: si cambió algún precio, la pareja deja de ofrecerse hasta recalcular.
          if (va.price + vb.price !== t[1]) return null;
          return { subtotal, va, vb };
        }

        partners(card) {
          return this.cards.filter((c) => this.pair(card, c));
        }

        presentation(v) {
          return v && v.title && v.title !== 'Default Title' ? 'Presentación: ' + v.title : 'Presentación única';
        }

        updateTiers() {
          let min = 0;
          for (let i = 0; i < this.cards.length; i++) {
            for (let j = i + 1; j < this.cards.length; j++) {
              const p = this.pair(this.cards[i], this.cards[j]);
              if (p && (!min || p.subtotal < min)) min = p.subtotal;
            }
          }
          this.$('[data-duo-sub]').textContent = min ? 'Elige 2 perfumes desde ' + COP(min) : 'Elige 2 perfumes';
        }

        onPick(card) {
          if (!card || card.pick.disabled) return;
          this.clearAdded();
          const role = card.el.dataset.role;
          if (role === 'idle') {
            this.first = card;
            this.second = null;
            const n = this.partners(card).length;
            this.say('Elegiste ' + card.name + '. Tiene ' + n + (n === 1 ? ' compañero disponible.' : ' compañeros disponibles.'));
          } else if (role === 'first') {
            this.reset(false);
            this.say('Quitaste ' + card.name + '. Elige tu primer perfume.');
          } else if (role === 'partner') {
            this.second = card;
            this.say('Elegiste ' + this.first.name + ' y ' + card.name + '.');
          } else if (role === 'second') {
            this.second = null;
            this.say('Quitaste ' + card.name + '. Elige otro compañero.');
          }
          this.render();
        }

        onVariant(card) {
          this.clearAdded();
          if (this.first && this.second && (card === this.first || card === this.second) && !this.pair(this.first, this.second)) {
            const msg = card === this.first
              ? 'Con esta presentación, ' + this.second.name + ' ya no combina con ' + card.name + '. Elige otro compañero.'
              : 'Esa presentación de ' + card.name + ' no combina con ' + this.first.name + '. Elige otro compañero.';
            this.second = null;
            this.say(msg);
          }
          this.updateTiers();
          this.render();
        }

        setFilter(f) {
          this.filter = f;
          this.querySelectorAll('[data-duo-filter]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.duoFilter === f ? 'true' : 'false'));
          this.render();
        }

        reset(announce) {
          this.first = null;
          this.second = null;
          this.clearAdded();
          if (announce) this.say('Elige tu primer perfume.');
          this.render();
        }

        clearAdded() {
          this.$('[data-duo-added]').hidden = true;
          this.$('[data-duo-error]').hidden = true;
        }

        say(t) {
          const live = this.$('[data-duo-live]');
          live.textContent = '';
          setTimeout(() => (live.textContent = t), 30);
        }

        // Agrega los dos perfumes al carrito con el mismo evento que usa la ficha del tema,
        // así el contador y el carrito lateral de Horizon se actualizan solos.
        async addToCart() {
          const p = this.first && this.second ? this.pair(this.first, this.second) : null;
          const cta = this.$('[data-duo-cta]');
          if (!p || cta.getAttribute('aria-busy') === 'true') return;
          const label = this.$('[data-duo-cta-label]');
          const err = this.$('[data-duo-error]');
          err.hidden = true;
          cta.setAttribute('aria-busy', 'true');
          label.textContent = 'Agregando…';
          const routes = typeof Theme !== 'undefined' && Theme && Theme.routes ? Theme.routes : null;
          const addUrl = (routes && routes.cart_add_url) || this.dataset.cartAddUrl || '/cart/add';
          const cartUrl = (routes && routes.cart_url) || this.dataset.cartUrl || '/cart';
          const sectionIds = Array.from(document.querySelectorAll('cart-items-component'))
            .map((el) => el.dataset.sectionId)
            .filter(Boolean);
          let Ev = null;
          let deferred = null;
          try {
            Ev = (await import('@shopify/events')).CartLinesUpdateEvent;
            deferred = Ev.createPromise();
            this.dispatchEvent(new Ev({ action: 'add', context: 'product', lines: [p.va, p.vb].map((v) => ({ merchandiseId: String(v.id), quantity: 1 })), promise: deferred.promise }));
          } catch (e) {
            deferred = null;
          }
          try {
            const res = await fetch(addUrl, {
              method: 'POST',
              credentials: 'same-origin',
              headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
              body: JSON.stringify({ items: [p.va, p.vb].map((v) => ({ id: v.id, quantity: 1 })), sections: sectionIds.join(',') }),
            });
            const data = await res.json();
            if (!res.ok || data.status) throw new Error(data.description || data.message || 'No se pudo agregar');
            const cart = await fetch(cartUrl + '.js', { credentials: 'same-origin', headers: { Accept: 'application/json' } }).then((r) => r.json());
            if (deferred) {
              deferred.resolve({ cart: Ev.createCartFromAjaxResponse(cart), detail: { items: cart.items, source: 'mc-duo', itemCount: 2, sections: data.sections, didError: false } });
            }
            this.added += 1;
            const names = this.first.name + ' + ' + this.second.name;
            this.first = null;
            this.second = null;
            // El aviso se muestra antes de redibujar: así el resumen sigue visible en celular.
            this.$('[data-duo-added-text]').textContent = names + '. Puedes elegir otros dos o seguir comprando.';
            this.$('[data-duo-added]').hidden = false;
            this.render();
            this.say('Agregados al carrito: ' + names + '.');
            const again = this.$('[data-duo-again]');
            if (again) again.focus({ preventScroll: true });
          } catch (e) {
            if (deferred) deferred.reject(e);
            err.textContent = 'No pudimos agregarlos: ' + ((e && e.message) || 'inténtalo de nuevo') + '.';
            err.hidden = false;
          }
          cta.removeAttribute('aria-busy');
          label.textContent = 'Añadir al carrito';
        }

        render() {
          const step = this.first ? (this.second ? 2 : 1) : 0;
          const added = !this.$('[data-duo-added]').hidden;
          this.dataset.step = String(added ? 2 : step);
          this.querySelectorAll('[data-duo-stepitem]').forEach((li) => li.classList.toggle('is-current', Number(li.dataset.duoStepitem) === step + 1));
          let visible = 0;

          for (const c of this.cards) {
            const v = this.variant(c);
            let role;
            let state = '';
            let label = 'Elegir';
            let aria = 'Elegir ' + c.name;
            let flag = '';
            let disabled = false;
            if (!this.first) {
              if (!v || !v.available) {
                role = 'disabled';
                state = 'Agotado por ahora';
                label = 'Agotado';
                disabled = true;
              } else if (!this.partners(c).length) {
                role = 'disabled';
                state = 'Sin pareja disponible por ahora';
                label = 'No disponible';
                disabled = true;
              } else {
                role = 'idle';
                aria = 'Elegir ' + c.name + ' como primer perfume';
              }
            } else if (c === this.first) {
              role = 'first';
              flag = 'Tu primer perfume';
              label = 'Quitar';
              aria = 'Quitar ' + c.name;
            } else {
              const p = this.pair(this.first, c);
              if (!p) {
                role = 'off';
              } else {
                role = c === this.second ? 'second' : 'partner';
                if (role === 'second') {
                  flag = 'Tu compañero';
                  label = 'Quitar';
                  aria = 'Quitar ' + c.name;
                } else {
                  label = this.second ? 'Cambiar por este' : 'Elegir como compañero';
                  aria = 'Elegir ' + c.name + ' como compañero de ' + this.first.name;
                }
              }
            }
            c.el.dataset.role = role;
            const pinned = role === 'first' || role === 'second';
            const hide = role === 'off' || (!pinned && this.filter !== 'todos' && c.cat !== this.filter);
            c.el.hidden = hide;
            if (!hide && !pinned) visible++;
            c.state.textContent = state;
            c.flag.textContent = flag;
            c.pick.textContent = label;
            c.pick.disabled = disabled;
            c.pick.setAttribute('aria-pressed', pinned ? 'true' : 'false');
            c.pick.setAttribute('aria-label', aria);
          }

          const ctx = this.$('[data-duo-context]');
          const empty = this.$('[data-duo-empty]');
          const filterName = this.filter === 'todos' ? '' : ' ' + LABEL[this.filter];
          if (!this.first) {
            ctx.textContent = 'Elige tu primer perfume.';
          } else {
            const n = this.partners(this.first).length;
            ctx.innerHTML = '';
            ctx.append(
              (this.second ? 'Puedes cambiar el compañero de ' : n + (n === 1 ? ' compañero para ' : ' compañeros para ')) + this.first.name + '. '
            );
            const b = document.createElement('button');
            b.type = 'button';
            b.setAttribute('data-duo-reset', '');
            b.textContent = 'Cambiar primer perfume';
            ctx.append(b);
          }
          if (!visible && (this.filter !== 'todos' || !this.first)) {
            empty.hidden = false;
            empty.textContent = this.first
              ? 'No hay compañeros' + filterName + ' para ' + this.first.name + '. Prueba con otra categoría.'
              : 'No hay perfumes' + filterName + ' disponibles en este momento.';
          } else {
            empty.hidden = true;
          }

          this.renderSummary();
        }

        renderSummary() {
          const slots = this.querySelectorAll('[data-duo-slot]');
          const picks = [this.first, this.second];
          const empty = ['Elige tu primer perfume', 'Elige su compañero'];
          slots.forEach((slot, i) => {
            const c = picks[i];
            slot.classList.toggle('is-filled', !!c);
            slot.querySelector('[data-duo-slot-name]').textContent = c ? c.name : empty[i];
            slot.querySelector('[data-duo-slot-meta]').textContent = c ? this.presentation(this.variant(c)) : '';
          });
          const cta = this.$('[data-duo-cta]');
          this.$('.mc-duo-reset').hidden = !this.first;
          const p = this.first && this.second ? this.pair(this.first, this.second) : null;
          if (!p) {
            cta.hidden = true;
            return;
          }
          cta.hidden = false;
        }
      }
    );
  }


  if (!customElements.get('mc-instagram')) {
    customElements.define(
      'mc-instagram',
      class extends HTMLElement {
        connectedCallback() {
          const frames = Array.from(this.querySelectorAll('iframe[data-src]'));
          if (!frames.length) return;
          const load = (frame) => {
            if (frame.src) return;
            frame.addEventListener('load', () => frame.classList.add('is-loaded'), { once: true });
            frame.src = frame.dataset.src;
          };
          if (!('IntersectionObserver' in window)) return frames.forEach(load);
          this.io = new IntersectionObserver(
            (entries) => entries.forEach((en) => {
              if (en.isIntersecting) { load(en.target); this.io.unobserve(en.target); }
            }),
            { rootMargin: '400px 200px' }
          );
          frames.forEach((f) => this.io.observe(f));
        }
        disconnectedCallback() {
          if (this.io) this.io.disconnect();
        }
      }
    );
  }
