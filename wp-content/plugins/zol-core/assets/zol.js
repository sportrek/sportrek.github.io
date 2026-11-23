(function () {
	'use strict';
	var d = document, html = d.documentElement;
	var $ = function (s, c) { return (c || d).querySelector(s); };
	var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };

	/* ---------- Accessibility ---------- */
	var KEY = 'zolA11y';
	var state = {};
	try { state = JSON.parse(localStorage.getItem(KEY) || '{}') || {}; } catch (e) { state = {}; }
	var toggles = ['grayscale', 'contrast', 'invert', 'light', 'links', 'readable', 'noanim'];
	function apply() {
		toggles.forEach(function (t) {
			html.classList.toggle('a11y-' + t, !!state[t]);
			var b = $('[data-a11y="' + t + '"]');
			if (b) b.setAttribute('aria-pressed', state[t] ? 'true' : 'false');
		});
		html.style.fontSize = state.font ? (100 + state.font * 10) + '%' : '';
	}
	function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }
	apply();
	var panel = $('#zol-a11y-panel'), tgl = $('.zol-a11y-toggle');
	function openPanel(o) {
		if (!panel) return;
		panel.hidden = !o; tgl.setAttribute('aria-expanded', o ? 'true' : 'false');
		if (o) { var f = $('button', panel); f && f.focus(); }
	}
	if (tgl) tgl.addEventListener('click', function () { openPanel(panel.hidden); });
	var cl = $('.zol-a11y-close'); if (cl) cl.addEventListener('click', function () { openPanel(false); tgl.focus(); });
	d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && panel && !panel.hidden) { openPanel(false); tgl.focus(); } });
	$$('[data-a11y]').forEach(function (b) {
		b.addEventListener('click', function () {
			var a = b.getAttribute('data-a11y');
			if (a === 'font-up') state.font = Math.min((state.font || 0) + 1, 5);
			else if (a === 'font-down') state.font = Math.max((state.font || 0) - 1, -2);
			else if (a === 'reset') state = {};
			else {
				if (a === 'contrast' || a === 'invert' || a === 'light') ['contrast', 'invert', 'light'].forEach(function (x) { if (x !== a) state[x] = false; });
				state[a] = !state[a];
			}
			save(); apply();
		});
	});

	/* ---------- Mobile menu ---------- */
	var mt = $('.zol-menu-toggle'), nav = $('.zol-nav');
	if (mt && nav) {
		mt.addEventListener('click', function () {
			var o = !html.classList.contains('zol-nav-open');
			html.classList.toggle('zol-nav-open', o);
			mt.setAttribute('aria-expanded', o ? 'true' : 'false');
		});
		d.addEventListener('click', function (e) {
			if (html.classList.contains('zol-nav-open') && !nav.contains(e.target) && !mt.contains(e.target)) {
				html.classList.remove('zol-nav-open'); mt.setAttribute('aria-expanded', 'false');
			}
		});
		d.addEventListener('keydown', function (e) { if (e.key === 'Escape' && html.classList.contains('zol-nav-open')) { html.classList.remove('zol-nav-open'); mt.setAttribute('aria-expanded', 'false'); mt.focus(); } });
		$$('.zol-nav .menu-item-has-children > a').forEach(function (a) {
			a.addEventListener('click', function (e) {
				if (window.innerWidth > 1180) return;
				var li = a.parentNode;
				if (!li.classList.contains('open')) { e.preventDefault(); li.classList.add('open'); }
			});
		});
	}
	/* Header search toggle */
	var st = $('.zol-search-toggle'), sb = $('.zol-header-search');
	if (st && sb) st.addEventListener('click', function () {
		var o = sb.classList.toggle('open');
		st.setAttribute('aria-expanded', o ? 'true' : 'false');
		if (o) { var i = $('input', sb); i && i.focus(); }
	});

	/* Sticky header shadow */
	var hdr = $('.zol-header');
	if (hdr) {
		var onS = function () { hdr.classList.toggle('scrolled', window.scrollY > 10); };
		window.addEventListener('scroll', onS, { passive: true }); onS();
	}

	/* ---------- Product page: size chips + WhatsApp message ---------- */
	var wa = $('.zol-wa-btn');
	function buildWa() {
		if (!wa) return;
		var base = wa.getAttribute('data-wa-base') || '';
		var extra = '';
		$$('.zol-options').forEach(function (g) {
			var sel = $('.zol-chip[aria-pressed="true"]', g);
			if (sel) extra += '\n' + g.getAttribute('data-name') + ': ' + sel.getAttribute('data-value');
		});
		var msg = base + extra + '\n' + location.href.split('#')[0].split('?')[0];
		wa.href = 'https://wa.me/' + wa.getAttribute('data-wa-number') + '?text=' + encodeURIComponent(msg);
	}
	$$('.zol-options').forEach(function (g) {
		$$('.zol-chip', g).forEach(function (c) {
			c.addEventListener('click', function () {
				var on = c.getAttribute('aria-pressed') !== 'true';
				$$('.zol-chip', g).forEach(function (x) { x.setAttribute('aria-pressed', 'false'); });
				c.setAttribute('aria-pressed', on ? 'true' : 'false');
				buildWa();
			});
		});
	});
	buildWa();

	/* Copy SKU */
	$$('.zol-sku-copy').forEach(function (b) {
		b.addEventListener('click', function () {
			var s = b.getAttribute('data-sku');
			var done = function () { b.textContent = 'הועתק ✓'; setTimeout(function () { b.textContent = 'העתקה'; }, 1600); };
			if (navigator.clipboard) navigator.clipboard.writeText(s).then(done, done);
			else { var t = d.createElement('textarea'); t.value = s; d.body.appendChild(t); t.select(); try { d.execCommand('copy'); } catch (e) {} d.body.removeChild(t); done(); }
		});
	});

	/* ---------- Search (client-side, static friendly) ---------- */
	var results = $('.zol-search-results');
	if (results && window.ZOL) {
		var input = $('#zol-q'), status = $('.zol-search-status');
		var params = new URLSearchParams(location.search);
		var q0 = params.get('q') || '';
		input.value = q0;
		var data = null;
		var norm = function (s) { return (s || '').toString().toLowerCase().replace(/[\s\-_.\/|]+/g, ''); };
		var esc = function (s) { return (s || '').replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
		function render(q) {
			if (!data) return;
			var terms = q.trim().toLowerCase().split(/\s+/).filter(Boolean);
			if (!terms.length) { results.innerHTML = ''; status.textContent = 'הקלידו שם דגם, מותג או מק"ט'; return; }
			var hits = data.filter(function (p) {
				var hay = (p.n + ' ' + p.b + ' ' + p.s).toLowerCase(), hn = norm(hay);
				return terms.every(function (t) { return hay.indexOf(t) > -1 || hn.indexOf(norm(t)) > -1; });
			});
			status.textContent = hits.length ? 'נמצאו ' + hits.length + ' מוצרים עבור "' + q + '"' : 'לא נמצאו מוצרים עבור "' + q + '". נסו מילה אחרת או שלחו לנו הודעה בוואטסאפ.';
			results.innerHTML = hits.slice(0, 120).map(function (p) {
				return '<li class="product type-product"><a class="woocommerce-LoopProduct-link woocommerce-loop-product__link" href="' + esc(p.u) + '">' +
					(p.i ? '<img loading="lazy" src="' + esc(p.i) + '" alt="' + esc(p.n) + '">' : '') +
					(p.b ? '<span class="zol-card-brand">' + esc(p.b) + '</span>' : '') +
					'<h2 class="woocommerce-loop-product__title">' + esc(p.n) + '</h2>' +
					(p.s ? '<span class="zol-card-sku">מק"ט ' + esc(p.s) + '</span>' : '') +
					'</a><a class="button zol-card-btn" href="' + esc(p.u) + '">לפרטים ויצירת קשר</a></li>';
			}).join('');
		}
		status.textContent = 'טוען מוצרים...';
		fetch(ZOL.index).then(function (r) { return r.json(); }).then(function (j) { data = j; render(input.value); });
		var tmr;
		input.addEventListener('input', function () {
			clearTimeout(tmr);
			tmr = setTimeout(function () {
				render(input.value);
				history.replaceState(null, '', location.pathname + (input.value ? '?q=' + encodeURIComponent(input.value) : ''));
			}, 150);
		});
		input.closest('form').addEventListener('submit', function (e) { e.preventDefault(); render(input.value); });
	}

	/* Year */
	$$('.zol-year').forEach(function (e) { e.textContent = new Date().getFullYear(); });
})();
