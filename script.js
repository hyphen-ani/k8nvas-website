/* =========================================================
   k8nvas — coming soon · interactions
   GSAP 3 + ScrollTrigger (+ optional Lenis smooth scroll)
   ========================================================= */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- always-on bits (no GSAP needed) ---------- */
  const nav = $('#nav');
  const onScroll = () => nav.classList.toggle('scrolled', window.scrollY > 10);
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // spotlight hover on cards
  $$('.spot').forEach(el => {
    el.addEventListener('pointermove', e => {
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${e.clientX - r.left}px`);
      el.style.setProperty('--my', `${e.clientY - r.top}px`);
    });
  });

  // waitlist forms (front-end only — set data-endpoint on the form to POST to your API)
  $$('[data-waitlist]').forEach(form => {
    const input = $('input', form), msg = $('.form-msg', form), label = $('.btn-label', form);
    form.addEventListener('submit', async e => {
      e.preventDefault();
      const email = input.value.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
        msg.className = 'form-msg err'; msg.textContent = 'Please enter a valid work email.';
        input.focus(); return;
      }
      const endpoint = form.dataset.endpoint;
      try {
        if (endpoint) {
          await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }) });
        }
        form.classList.add('done');
        label.textContent = "You're on the list";
        input.value = ''; input.disabled = true;
        msg.className = 'form-msg ok'; msg.textContent = "Thanks — we'll reach out when your wave opens.";
      } catch {
        msg.className = 'form-msg err'; msg.textContent = 'Something went wrong. Please try again.';
      }
    });
  });

  /* ---------- edges on the canvas board ---------- */
  const board = $('#board');
  const svg = $('#edges');
  const EDGES = [['ing', 'svc'], ['svc', 'dep'], ['hpa', 'dep'], ['dep', 'redis'], ['dep', 'pg']];
  const NS = 'http://www.w3.org/2000/svg';
  const nodeEl = id => $(`[data-node="${id}"]`, board);

  EDGES.forEach(() => {
    const d = document.createElementNS(NS, 'path');
    d.setAttribute('class', 'draw'); d.setAttribute('pathLength', '1');
    const f = document.createElementNS(NS, 'path');
    f.setAttribute('class', 'flow');
    svg.append(d, f);
  });

  const box = el => {
    const w = el.offsetWidth, h = el.offsetHeight;
    const x = el.offsetLeft, y = el.offsetTop - h / 2; // node is translated -50% on Y
    return { x, y, w, h, cx: x + w / 2, cy: y + h / 2 };
  };
  const pathFor = (a, b) => {
    const A = box(a), B = box(b), dx = B.cx - A.cx, dy = B.cy - A.cy;
    if (Math.abs(dx) >= Math.abs(dy)) {
      const sx = dx > 0 ? A.x + A.w : A.x, ex = dx > 0 ? B.x : B.x + B.w;
      const m = (ex - sx) / 2;
      return `M${sx} ${A.cy} C${sx + m} ${A.cy}, ${ex - m} ${B.cy}, ${ex} ${B.cy}`;
    }
    const sy = dy > 0 ? A.y + A.h : A.y, ey = dy > 0 ? B.y : B.y + B.h;
    const m = (ey - sy) / 2;
    return `M${A.cx} ${sy} C${A.cx} ${sy + m}, ${B.cx} ${ey - m}, ${B.cx} ${ey}`;
  };
  const layoutEdges = () => {
    const paths = $$('path', svg);
    EDGES.forEach(([a, b], i) => {
      const d = pathFor(nodeEl(a), nodeEl(b));
      paths[i * 2].setAttribute('d', d);
      paths[i * 2 + 1].setAttribute('d', d);
    });
  };
  layoutEdges();
  window.addEventListener('resize', layoutEdges);

  /* ---------- graceful fallback: no GSAP or reduced motion ---------- */
  const PROMPT = 'Checkout API with Postgres + Redis, autoscale 3 → 20 pods';
  const showFinalStates = () => {
    root.classList.remove('js');
    $('#promptText').textContent = PROMPT;
    $('#footText').textContent = '✓ Deployed to GKE · 6 resources healthy';
    $('.app-foot').classList.add('ready');
    $$('#edges path.flow').forEach(p => (p.style.opacity = 1));
    $$('[data-count]').forEach(el => (el.textContent = el.dataset.count + (el.dataset.suffix || '')));
    $$('#migSteps li').forEach(li => li.classList.add('on'));
    $('#migBar').style.transform = 'scaleX(1)';
    $$('.shift-row s').forEach(s => s.style.setProperty('--strike', '100%'));
    $$('.manifesto-text').forEach(el => (el.style.opacity = 1));
    fillConsole();
  };

  /* ---------- agent console feed ---------- */
  const FEED = [
    ['architect', '◇', 'plan ready · 6 resources', 'hi'],
    ['guardian', '✓', 'no-root policy · 42 pods ok', 'ok'],
    ['healer', '!', 'payments-api CrashLoop', 'warn'],
    ['healer', '↺', 'rollback → v2.4.1 · 38s', 'ok'],
    ['optimizer', '$', 'right-sized 12 deploys', 'hi'],
    ['guardian', '✕', 'blocked :latest in prod', 'bad'],
    ['migrator', '→', 'gke replication 64%', 'hi'],
    ['healer', '✓', 'node drained & replaced', 'ok'],
    ['optimizer', '✓', 'batch jobs → spot pool', 'ok'],
    ['architect', '◇', 'hpa: checkout 3 → 20', 'hi'],
  ];
  const consoleBody = $('#consoleBody');
  let feedIdx = 0;
  const lineEl = ([who, sym, msg, cls]) => {
    const d = document.createElement('div');
    d.className = 'cl';
    d.innerHTML = `<span class="who">${who}</span><span class="${cls}">${sym}</span><span class="msg">${msg}</span>`;
    return d;
  };
  function fillConsole() {
    consoleBody.innerHTML = '';
    FEED.slice(0, 7).forEach(f => consoleBody.appendChild(lineEl(f)));
  }

  if (!window.gsap || !window.ScrollTrigger || reduced) {
    showFinalStates();
    return;
  }

  /* =========================================================
     GSAP
     ========================================================= */
  gsap.registerPlugin(ScrollTrigger);
  gsap.defaults({ ease: 'power3.out' });

  // smooth scroll
  let lenis = null;
  if (window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  $$('a[href^="#"]').forEach(a => {
    a.addEventListener('click', e => {
      const id = a.getAttribute('href');
      const target = id.length > 1 ? $(id) : null;
      if (!target && id !== '#top') return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target || 0, { offset: 0, duration: 1.4 });
      else (target || document.body).scrollIntoView({ behavior: 'smooth' });
    });
  });

  /* ---------- text scramble ---------- */
  const GLYPHS = '!<>-_\\/[]{}—=+*^?#01ABCDEFKNVS8';
  function scramble(el, finalText, dur = 1.2) {
    const len = finalText.length;
    const o = { p: 0 };
    return gsap.to(o, {
      p: 1, duration: dur, ease: 'none',
      onUpdate() {
        const done = Math.floor(o.p * len);
        let out = finalText.slice(0, done);
        for (let i = done; i < len; i++) out += finalText[i] === ' ' ? ' ' : GLYPHS[(Math.random() * GLYPHS.length) | 0];
        el.textContent = out;
      },
      onComplete() { el.textContent = finalText; },
    });
  }

  /* ---------- hero dot field ---------- */
  (function field() {
    const c = $('#field'), ctx = c.getContext('2d'), hero = $('.hero');
    let w, h, dpr, dots = [], running = true;
    const gap = 26, mouse = { x: -9999, y: -9999 };
    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = c.clientWidth; h = c.clientHeight;
      c.width = w * dpr; c.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      dots = [];
      for (let y = gap / 2; y < h; y += gap) for (let x = gap / 2; x < w; x += gap) dots.push(x, y);
    };
    resize();
    window.addEventListener('resize', resize);
    hero.addEventListener('pointermove', e => {
      const r = c.getBoundingClientRect();
      mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
    });
    hero.addEventListener('pointerleave', () => { mouse.x = mouse.y = -9999; });
    new IntersectionObserver(([e]) => { running = e.isIntersecting; }).observe(hero);

    const draw = t => {
      if (!running) return;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2, cy = h * 0.42, maxR = Math.hypot(w, h) * 0.6, time = t * 0.0016;
      ctx.fillStyle = '#1446f5';
      for (let i = 0; i < dots.length; i += 2) {
        const x = dots[i], y = dots[i + 1];
        const dx = x - cx, dy = (y - cy) * 1.25, d = Math.sqrt(dx * dx + dy * dy);
        const wave = Math.pow(Math.max(0, Math.sin(d * 0.018 - time)), 10);
        const mdx = x - mouse.x, mdy = y - mouse.y, md = Math.sqrt(mdx * mdx + mdy * mdy);
        const m = Math.max(0, 1 - md / 170);
        const fade = Math.max(0, 1 - d / maxR);
        const a = (0.07 + wave * 0.22) * fade + m * 0.55;
        if (a < 0.02) continue;
        const s = 1.2 + wave * 0.8 * fade + m * 1.6;
        ctx.globalAlpha = Math.min(a, 1);
        ctx.fillRect(x - s / 2, y - s / 2, s, s);
      }
      ctx.globalAlpha = 1;
    };
    gsap.ticker.add(() => draw(performance.now()));
  })();

  /* ---------- hero intro ---------- */
  gsap.set(['.hero-inner', '.console', '.hero-word', '.poster', '.nav'], { opacity: 1 });
  root.classList.remove('js');

  const intro = gsap.timeline({ delay: 0.15 });
  intro
    .from('.hero-glow', { opacity: 0, scale: 0.6, duration: 2.2, ease: 'expo.out' }, 0)
    .from('.hero-field', { opacity: 0, duration: 1.6 }, 0)
    .from('.nav', { y: -24, opacity: 0, duration: 0.9 }, 0.2)
    .from('.crop', { scale: 0, opacity: 0, duration: 0.7, stagger: 0.08, ease: 'expo.out' }, 0.1)
    .from('.pf, .pf-side', { opacity: 0, duration: 1, stagger: 0.06 }, 0.4)
    .from('.hero-eyebrow', { y: 16, opacity: 0, duration: 0.8 }, 0.25)
    .add(() => scramble($('[data-scramble]'), 'Coming soon', 1.1), 0.35)
    .from('.hero-title .line-inner', { yPercent: 115, rotate: 3, duration: 1.3, ease: 'expo.out', stagger: 0.12 }, 0.35)
    .from('.hero-sub', { y: 24, opacity: 0, duration: 1 }, 0.85)
    .from('.hero-form', { y: 24, opacity: 0, duration: 1 }, 0.95)
    .from('.hero-pills li', { y: 14, opacity: 0, stagger: 0.08, duration: 0.7 }, 1.1)
    .from('.hero-word span', { yPercent: 100, opacity: 0, stagger: 0.06, duration: 1.6, ease: 'expo.out' }, 0.5)
    .from('.console', { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out' }, 1.2)
    .from('.scroll-cue', { opacity: 0, duration: 1 }, 1.6);

  // feed loop
  const pushLine = () => {
    const el = lineEl(FEED[feedIdx++ % FEED.length]);
    consoleBody.appendChild(el);
    gsap.from(el, { opacity: 0, x: -8, duration: 0.5 });
    const lines = consoleBody.children;
    if (lines.length > 7) {
      const first = lines[0];
      gsap.to(first, { height: 0, opacity: 0, duration: 0.35, onComplete: () => first.remove() });
    }
  };
  for (let i = 0; i < 3; i++) pushLine();
  gsap.delayedCall(1.8, function loop() {
    if (!document.hidden) pushLine();
    gsap.delayedCall(1.6, loop);
  });

  // hero parallax out
  const heroOut = { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true };
  gsap.to('.hero-inner', { yPercent: -18, opacity: 0, ease: 'none', scrollTrigger: heroOut });
  gsap.to('.hero-word', { y: 120, ease: 'none', scrollTrigger: heroOut });
  gsap.to('.console', { y: -120, ease: 'none', scrollTrigger: heroOut });
  gsap.to('.poster', { opacity: 0, ease: 'none', scrollTrigger: { ...heroOut, end: '60% top' } });

  // magnetic buttons
  $$('.magnetic').forEach(btn => {
    const xTo = gsap.quickTo(btn, 'x', { duration: 0.5, ease: 'power3' });
    const yTo = gsap.quickTo(btn, 'y', { duration: 0.5, ease: 'power3' });
    btn.addEventListener('pointermove', e => {
      const r = btn.getBoundingClientRect();
      xTo((e.clientX - r.left - r.width / 2) * 0.18);
      yTo((e.clientY - r.top - r.height / 2) * 0.3);
    });
    btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
  });

  /* ---------- marquees (velocity-reactive) ---------- */
  const marquee = (sel, dur) => {
    const track = $(sel);
    track.innerHTML += track.innerHTML;
    const tw = gsap.to(track, { xPercent: -50, duration: dur, ease: 'none', repeat: -1 });
    return tw;
  };
  const m1 = marquee('.stack-track', 40);
  const m2 = marquee('.fm-track', 60);
  ScrollTrigger.create({
    onUpdate(self) {
      const v = Math.min(Math.abs(self.getVelocity()) / 400, 4);
      gsap.to([m1, m2], { timeScale: 1 + v, duration: 0.2, overwrite: true });
      gsap.to([m1, m2], { timeScale: 1, duration: 1.2, delay: 0.2 });
    },
  });

  /* ---------- manifesto: word-by-word ---------- */
  $$('[data-words]').forEach(el => {
    const words = el.textContent.trim().split(/ +/);
    el.innerHTML = words.map(w => {
      const hl = /agents|shipping/i.test(w);
      return `<span class="w${hl ? ' grad' : ''}">${w}</span>`;
    }).join(' ');
    gsap.to($$('.w', el), {
      opacity: 1, stagger: 0.08, ease: 'none',
      scrollTrigger: { trigger: el, start: 'top 78%', end: 'bottom 45%', scrub: 0.6 },
    });
  });

  /* ---------- generic reveals ---------- */
  $$('.tag').forEach(el => gsap.from(el, { opacity: 0, x: -12, duration: 0.8, scrollTrigger: { trigger: el, start: 'top 88%' } }));
  $$('.reveal').forEach(el => gsap.from(el, { y: 50, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: el, start: 'top 86%' } }));
  gsap.from('.agent-card', { y: 60, opacity: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: '.agent-grid', start: 'top 80%' } });
  gsap.from('.ent', { y: 50, opacity: 0, duration: 1, stagger: 0.07, ease: 'expo.out', scrollTrigger: { trigger: '.ent-grid', start: 'top 82%' } });
  gsap.from('.stack-label', { opacity: 0, y: 10, duration: 0.8, scrollTrigger: { trigger: '.stack', start: 'top 92%' } });

  // the shift — strike the old way
  $$('.shift-row').forEach(row => {
    const tl = gsap.timeline({ scrollTrigger: { trigger: row, start: 'top 82%', end: 'top 52%', scrub: 0.5 } });
    tl.fromTo($('s', row), { '--strike': '0%' }, { '--strike': '100%', ease: 'none' })
      .from($('span', row), { opacity: 0.15, x: -10, ease: 'none' }, 0.3);
  });

  // final
  gsap.from('.final-title', { y: 70, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.final', start: 'top 70%' } });
  gsap.from(['.final-sub', '.final .waitlist'], { y: 30, opacity: 0, duration: 1, stagger: 0.1, scrollTrigger: { trigger: '.final', start: 'top 60%' } });

  /* =========================================================
     CANVAS BUILDER timeline
     ========================================================= */
  function buildCanvas(st) {
    const order = ['ing', 'svc', 'dep', 'hpa', 'redis', 'pg'].map(nodeEl);
    const draws = $$('#edges path.draw'), flows = $$('#edges path.flow');
    const lines = $$('#yaml .yl'), prompt = $('#promptText'), foot = $('#footText');
    const appFoot = $('.app-foot'), ghost = $('#dragGhost'), ind = $('.target-ind'), opts = $$('.t-opt');
    const dep = nodeEl('dep');

    gsap.set(order, { autoAlpha: 0, scale: 0.8, y: 0, yPercent: -50 });
    gsap.set(draws, { strokeDasharray: 1, strokeDashoffset: 1 });
    gsap.set(flows, { opacity: 0 });
    gsap.set(lines, { opacity: 0 });
    gsap.set(ghost, { autoAlpha: 0 });
    prompt.textContent = '';

    let stage = -1;
    const STAGES = [
      [0.04, 'Waiting for intent…'],
      [0.32, 'Architect is planning the topology…'],
      [0.66, 'Generating manifests · validating policies…'],
      [0.84, 'Attaching secret to checkout…'],
      [1.01, '✓ Deployed to GKE · 6 resources healthy'],
    ];
    const typer = { n: 0 };

    const tl = gsap.timeline({
      scrollTrigger: st,
      defaults: { ease: 'power3.out' },
      onUpdate() {
        const p = tl.progress();
        const s = STAGES.findIndex(([t]) => p < t);
        if (s !== stage) {
          stage = s;
          foot.textContent = STAGES[s][1];
          appFoot.classList.toggle('ready', s === 4);
        }
        dep.classList.toggle('sel', p > 0.68 && p < 0.86);
        opts.forEach((o, i) => o.classList.toggle('on', i === (p > 0.78 ? 1 : 0)));
      },
    });

    tl.to(typer, {
      n: PROMPT.length, duration: 2, ease: 'none',
      onUpdate: () => (prompt.textContent = PROMPT.slice(0, Math.round(typer.n))),
    })
      .to(order, { autoAlpha: 1, scale: 1, duration: 0.6, stagger: 0.32, ease: 'back.out(1.7)' }, '+=0.2')
      .to(draws, { strokeDashoffset: 0, duration: 0.6, stagger: 0.32, ease: 'none' }, '<0.4')
      .to(lines, { opacity: 1, duration: 0.15, stagger: 0.07, ease: 'none' }, '<0.2')
      .fromTo(ghost,
        { autoAlpha: 0, x: 16, y: () => board.offsetHeight - 54, scale: 1 },
        { autoAlpha: 1, duration: 0.3 })
      .to(ghost, {
        x: () => dep.offsetLeft + 30, y: () => dep.offsetTop + dep.offsetHeight / 2 + 8,
        duration: 1.1, ease: 'power2.inOut',
      })
      .to(ghost, { autoAlpha: 0, scale: 0.6, duration: 0.3 })
      .to(ind, { x: () => opts[1].offsetLeft - opts[0].offsetLeft, duration: 0.6, ease: 'power2.inOut' })
      .to(flows, { opacity: 1, duration: 0.4 })
      .to({}, { duration: 0.8 });
    return tl;
  }

  /* =========================================================
     MIGRATION timeline
     ========================================================= */
  function buildMigrate(st) {
    const src = $$('.c-src .chip'), dst = $$('.c-dst .chip'), rows = $$('.map-row');
    const steps = $$('#migSteps li'), pkts = $$('.pkt'), dstCloud = $('.c-dst');
    const [cRes, cData] = $$('[data-count]');
    gsap.set(dst, { autoAlpha: 0, y: 8 });
    gsap.set(rows, { autoAlpha: 0, x: -10 });
    gsap.set('#migBar', { scaleX: 0 });

    const res = { v: 0 }, data = { v: 0 };
    const setRes = () => (cRes.textContent = Math.round(res.v));
    const setData = () => (cData.textContent = Math.round(data.v) + '%');
    setRes(); setData();

    const tl = gsap.timeline({
      scrollTrigger: st,
      onUpdate() {
        const p = tl.progress();
        const idx = p < 0.2 ? 0 : p < 0.45 ? 1 : p < 0.8 ? 2 : 3;
        steps.forEach((li, i) => { li.classList.toggle('on', i <= idx); li.classList.toggle('cur', i === idx); });
      },
    });

    tl.addLabel('discover')
      .to(src, { keyframes: [{ borderColor: '#1446f5', duration: 0.25 }, { borderColor: '#d9d9d9', duration: 0.35 }], stagger: 0.14 })
      .addLabel('translate')
      .to(rows, { autoAlpha: 1, x: 0, stagger: 0.25, duration: 0.45 })
      .addLabel('rep')
      .set(pkts, { opacity: 1 }, 'rep')
      .fromTo(pkts, { left: '0%' }, { left: '100%', duration: 0.9, ease: 'none', stagger: 0.3, repeat: 2 }, 'rep')
      .to(dst, { autoAlpha: 1, y: 0, stagger: 0.32, duration: 0.45 }, 'rep+=0.3')
      .to(data, { v: 100, duration: 2.6, ease: 'none', onUpdate: setData }, 'rep')
      .set(pkts, { opacity: 0 })
      .addLabel('cut')
      .to(src, { opacity: 0.3, duration: 0.5, stagger: 0.05 }, 'cut')
      .to(dstCloud, { boxShadow: 'inset 0 0 0 1px #1446f5', duration: 0.6 }, 'cut')
      .to({}, { duration: 0.6 });

    tl.to(res, { v: 148, duration: tl.labels.rep, ease: 'none', onUpdate: setRes }, 0);
    tl.fromTo('#migBar', { scaleX: 0 }, { scaleX: 1, duration: tl.duration(), ease: 'none' }, 0);
    return tl;
  }

  /* ---------- responsive: pin + scrub on desktop, play-once on small screens ---------- */
  const mm = gsap.matchMedia();
  mm.add('(min-width: 900px) and (min-height: 640px)', () => {
    buildCanvas({ trigger: '#canvasPin', start: 'top top', end: '+=2200', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true });
    buildMigrate({ trigger: '#migratePin', start: 'top top', end: '+=2000', pin: true, scrub: 0.8, anticipatePin: 1, invalidateOnRefresh: true });
  });
  mm.add('(max-width: 899px), (max-height: 639px)', () => {
    buildCanvas({ trigger: '#app', start: 'top 70%', toggleActions: 'play none none none', invalidateOnRefresh: true });
    buildMigrate({ trigger: '.mig-vis', start: 'top 75%', toggleActions: 'play none none none' });
  });

  ScrollTrigger.addEventListener('refresh', layoutEdges);
  document.fonts && document.fonts.ready.then(() => { layoutEdges(); ScrollTrigger.refresh(); });
})();
