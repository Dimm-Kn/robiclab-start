// Живой мир сцены: актёры с физикой, частицы, параллакс, «говорящие» герои.
// Без библиотек: свой простой интегратор (пружины, гравитация, сопротивление, отскок).
// Координаты актёров и частиц — проценты сцены (x — от левого края, y — от верха).
window.RL = window.RL || {};

RL.World = (function () {
  let stage = null, cv = null, ctx = null, W = 1, H = 1, dpr = 1;
  const actors = new Map();     // имя → актёр
  let parts = [];               // частицы
  let emitters = [];            // постоянные источники частиц
  let t = 0, last = performance.now();
  let wind = 0, windT = 0;
  const ptr = { x: 0, y: 0, sx: 0, sy: 0 };
  let speaker = null;           // кто сейчас говорит
  let floorY = 92;              // пол для конфетти и осколков, % высоты

  // ---------- актёр ----------
  function makeActor(el, prevState) {
    const d = el.dataset;
    const a = {
      el, name: d.actor,
      mode: d.mode || 'stand',            // stand — стоит на полу; hover — парит на пружине; walk — идёт по пути
      x: +d.x, y: +d.y, vx: 0, vy: 0,     // текущее положение (низ-центр)
      tx: +d.x, ty: +d.y,                 // цель для пружины
      home: { x: +d.x, y: +d.y },
      k: +(d.k || 26), c: +(d.c || 7),
      jump: 0, jv: 0,                     // прыжок по вертикали (px-независимо, в %)
      sq: 0, sv: 0,                       // сжатие-растяжение (желе)
      rot: 0, flip: d.flip === '1' ? -1 : 1,
      phase: Math.random() * 6, breathe: +(d.breathe || 1),
      shiver: 0, talk: 0, lean: 0, depth: +(d.depth || 0.5)
    };
    // скелетный герой (canvas с data-rig): суставы, моргание, речь, жесты — js/rig.js
    if (d.rig && RL.Rig && RL.Rig.has(d.rig)) { a.rig = RL.Rig.create(d.rig, el); a.rig.mood = d.mood || 'neutral'; }
    a.gesture = (g, dur, opt) => { if (a.rig) a.rig.gesture(g, dur, opt); };
    // смена «костюма» (совёнок спит → приоткрыл глаз → проснулся): другой скелет на том же холсте
    a.setRig = (n) => { if (RL.Rig.has(n)) { a.rig = RL.Rig.create(n, el); a.rigName = n; } };
    if (prevState) Object.assign(a, { x: prevState.x, y: prevState.y, vx: prevState.vx, vy: prevState.vy, jump: prevState.jump, jv: prevState.jv, sq: prevState.sq, sv: prevState.sv,
                                      wx: prevState.wx, wspeed: prevState.wspeed, walkAmt: prevState.walkAmt, walkPh: prevState.walkPh });   // перерисовка сцены не сбивает шаг
    a.hop = (power = 1) => { if (a.jump > -0.01) { a.jv = -1.6 * power; a.sq = -0.18 * power; a.sv = 0; } };
    a.poke = (dx = 0, dy = -1) => { a.vx += dx; a.vy += dy; a.sq = 0.12; };
    a.goto = (x, y) => { a.tx = x; a.ty = y; };
    a.goHome = () => { a.tx = a.home.x; a.ty = a.home.y; };
    // пешком: ровным шагом к точке x (для стоящих героев), ноги шагают сами
    a.walkTo = (x, speed = 16) => { a.wx = x; a.wspeed = speed; };
    a.walkAmt = 0; a.walkPh = 0;
    return a;
  }

  function stepActor(a, dt) {
    if (a.wx !== undefined) {
      const d = a.wx - a.x, st = a.wspeed * dt;
      if (Math.abs(d) <= st) { a.x = a.wx; a.wx = undefined; } else { a.x += Math.sign(d) * st; a.vx = Math.sign(d) * a.wspeed * 0.25; }
    } else if (a.mode === 'stand') a.vx *= 0.8;
    const moving = a.wx !== undefined || Math.abs(a.vx) > 3;
    a.walkAmt += ((moving ? 1 : 0) - a.walkAmt) * Math.min(1, dt * 6);
    a.walkPh += dt * 7.5 * a.walkAmt;   // ~2,4 шага в секунду — темп ребёнка
    // пружина к цели (для hover и walk), у stand — только «ноги на месте»
    if (a.mode === 'hover' || a.mode === 'walk') {
      const ax = a.k * (a.tx - a.x) - a.c * a.vx;
      const ay = a.k * (a.ty - a.y) - a.c * a.vy;
      a.vx += ax * dt; a.vy += ay * dt;
      a.x += a.vx * dt; a.y += a.vy * dt;
    }
    // прыжок: гравитация в «процентах высоты»
    if (a.jump < 0 || a.jv !== 0) {
      a.jv += 9.5 * dt; a.jump += a.jv * dt * 10;
      if (a.jump >= 0) {                           // приземление: сжать, если сильно ударился
        if (a.jv > 0.6) { a.sq = Math.min(0.22, a.jv * 0.09); a.sv = 0; }
        a.jump = 0; a.jv = a.jv > 1.2 ? -a.jv * 0.28 : 0;   // небольшой отскок
      }
    }
    // желе: затухающая пружина сжатия
    a.sv += (-120 * a.sq - 9 * a.sv) * dt; a.sq += a.sv * dt;
    // наклон по скорости (вес): в сторону движения
    const targetLean = Math.max(-14, Math.min(14, a.vx * 0.9));
    a.lean += (targetLean - a.lean) * Math.min(1, dt * 8);
    a.talk += ((speaker === a.name ? 1 : 0) - a.talk) * Math.min(1, dt * 10);
  }

  function drawActor(a, dt) {
    if (a.rig) a.rig.draw(t, dt, a);
    const br = Math.sin(t * 2.1 + a.phase) * 0.012 * a.breathe;                // дыхание
    const talkBob = a.rig ? 0 : a.talk * Math.abs(Math.sin(t * 11 + a.phase)) * 0.035;   // у скелетных героев речь — в суставах     // покачивание в такт речи
    const hoverBob = a.mode === 'hover' ? Math.sin(t * 1.7 + a.phase) * 1.1 : 0;
    const shake = a.shiver ? (Math.random() - 0.5) * a.shiver : 0;
    const sy = 1 + br + a.sq * -1 + talkBob, sx = 1 - br * 0.5 + a.sq * 0.7;
    const rot = a.lean + (a.rig ? 0 : a.talk * Math.sin(t * 7 + a.phase) * 3 + Math.sin(t * 0.9 + a.phase) * 0.8);
    const px = -ptr.sx * a.depth * 1.4, py = -ptr.sy * a.depth * 0.8;           // параллакс
    a.el.style.left = (a.x + shake) + '%';
    a.el.style.top = (a.y + a.jump + hoverBob) + '%';
    a.el.style.transform = `translate(-50%,-100%) translate(${px}cqw,${py}cqw) rotate(${rot}deg) scale(${sx * a.flip},${sy})`;
  }

  // ---------- частицы ----------
  function P(o) { parts.push(Object.assign({ x: 50, y: 50, vx: 0, vy: 0, g: 0, drag: 0, life: 2, age: 0, size: 1, rot: 0, vr: 0, kind: 'dot', color: '#fff', alpha: 1, bounce: 0, floor: false, sway: 0 }, o)); }
  const rnd = (a, b) => a + Math.random() * (b - a);

  const EMIT = {
    // пылинки в солнечном луче
    dust: (e, dt) => { e.acc += dt * (e.rate || 6); while (e.acc > 1) { e.acc--; P({ kind: 'glow', x: rnd(e.x0, e.x1), y: rnd(e.y0, e.y1), vx: rnd(-0.4, 0.4), vy: rnd(-0.6, 0.2), life: rnd(4, 7), size: rnd(0.15, 0.35), color: e.color || '255,240,200', sway: 0.6 }); } },
    // искры над огнём
    embers: (e, dt) => { e.acc += dt * (e.rate || 10); while (e.acc > 1) { e.acc--; P({ kind: 'glow', x: e.x + rnd(-e.w, e.w), y: e.y, vx: rnd(-1, 1), vy: rnd(-7, -3), g: 1.2, drag: 0.6, life: rnd(1, 2.2), size: rnd(0.15, 0.32), color: '255,170,60', sway: 1.5 }); } },
    // снег с порывами ветра
    snow: (e, dt) => { e.acc += dt * (e.rate || 16); while (e.acc > 1) { e.acc--; P({ kind: 'flake', x: rnd(-10, 110), y: -3, vx: 0, vy: rnd(3, 7), life: 20, size: rnd(0.25, 0.7), color: '255,255,255', sway: 2.5, windy: 1, floor: true, melt: true }); } },
    // светлячки ночью
    fireflies: (e, dt) => { e.acc += dt * (e.rate || 1.2); while (e.acc > 1) { e.acc--; P({ kind: 'glow', x: rnd(e.x0, e.x1), y: rnd(e.y0, e.y1), vx: rnd(-2, 2), vy: rnd(-2, 2), life: rnd(5, 9), size: rnd(0.25, 0.45), color: '200,255,140', wander: 1, blink: 1 }); } },
    // «Zzz» над спящими
    zzz: (e, dt) => { e.acc += dt * (e.rate || 0.7); while (e.acc > 1) { e.acc--; P({ kind: 'text', text: 'z', x: e.x, y: e.y, vx: rnd(0.5, 1.5), vy: -2.2, life: 3.2, size: rnd(1.6, 2.4), color: '230,235,255', sway: 1.2, grow: 0.5 }); } },
    // звуковые волны: сила зависит от громкости
    rings: (e, dt) => { const lv = e.level ? e.level() : 0.5; e.acc += dt * (0.6 + lv * 4); while (e.acc > 1) { e.acc--; P({ kind: 'ring', x: e.x, y: e.y, life: 1.4, size: 1.5, grow: 6 + lv * 16, color: e.color || '255,210,90', alpha: 0.35 + lv * 0.6, width: 0.2 + lv * 0.5 }); } }
  };

  function stepParts(dt) {
    windT += dt; wind = Math.sin(windT * 0.35) * 2 + Math.sin(windT * 1.3) * 0.8;
    for (const p of parts) {
      p.age += dt;
      if (p.wander) { p.vx += rnd(-6, 6) * dt; p.vy += rnd(-6, 6) * dt; p.vx *= 0.98; p.vy *= 0.98; }
      p.vy += p.g * dt;
      p.vx *= 1 - p.drag * dt; p.vy *= 1 - p.drag * dt;
      p.x += (p.vx + (p.windy ? wind : 0) + (p.sway ? Math.sin(p.age * 2 + p.size * 9) * p.sway : 0)) * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      if (p.floor && p.y > floorY) {
        if (p.bounce && Math.abs(p.vy) > 4) { p.y = floorY; p.vy = -p.vy * p.bounce; p.vx *= 0.7; p.vr *= 0.6; }
        else { p.y = floorY; p.vy = 0; p.vx *= 0.9; p.vr *= 0.9; if (p.melt) p.life = Math.min(p.life, p.age + 0.6); }
      }
    }
    parts = parts.filter(p => p.age < p.life && p.y < 130 && p.x > -20 && p.x < 120);
    if (parts.length > 900) parts.splice(0, parts.length - 900);
  }

  function drawParts() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    const u = W / 100 * dpr;                     // 1% ширины в пикселях холста
    for (const p of parts) {
      const fade = Math.min(1, (p.life - p.age) / 0.6, p.age / 0.25 + 0.2) * p.alpha * (p.blink ? 0.5 + 0.5 * Math.sin(p.age * 5 + p.size * 20) : 1);
      const X = p.x / 100 * W * dpr - ptr.sx * 0.3 * u, Y = p.y / 100 * H * dpr - ptr.sy * 0.2 * u;
      ctx.globalAlpha = Math.max(0, fade);
      if (p.kind === 'glow') {
        const r = p.size * u * 2.2; const g = ctx.createRadialGradient(X, Y, 0, X, Y, r);
        g.addColorStop(0, `rgba(${p.color},1)`); g.addColorStop(1, `rgba(${p.color},0)`); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.fill();
      } else if (p.kind === 'flake') {
        ctx.fillStyle = `rgba(${p.color},.95)`; ctx.beginPath(); ctx.arc(X, Y, p.size * u * 0.6, 0, 7); ctx.fill();
      } else if (p.kind === 'ring') {
        const r = (p.size + p.grow * (p.age / p.life)) * u; ctx.strokeStyle = `rgba(${p.color},1)`; ctx.lineWidth = p.width * u; ctx.beginPath(); ctx.arc(X, Y, r, 0, 7); ctx.stroke();
      } else if (p.kind === 'rect') {
        ctx.save(); ctx.translate(X, Y); ctx.rotate(p.rot); ctx.scale(1, Math.cos(p.age * 9 + p.size * 7)); ctx.fillStyle = p.color; ctx.fillRect(-p.size * u * 0.5, -p.size * u * 0.8, p.size * u, p.size * u * 1.6); ctx.restore();
      } else if (p.kind === 'text') {
        ctx.save(); ctx.translate(X, Y); ctx.rotate(p.rot); const s = p.size * (1 + (p.grow || 0) * p.age / p.life);
        ctx.font = `${s * u}px "Segoe UI Emoji","Segoe UI Black",sans-serif`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        if (p.color.length < 16 && p.color.indexOf(',') > 0) ctx.fillStyle = `rgba(${p.color},1)`; else ctx.fillStyle = '#fff';
        ctx.fillText(p.text, 0, 0); ctx.restore();
      } else if (p.kind === 'shard') {
        ctx.save(); ctx.translate(X, Y); ctx.rotate(p.rot); ctx.fillStyle = 'rgba(220,245,255,.9)'; ctx.strokeStyle = 'rgba(255,255,255,1)'; ctx.lineWidth = dpr;
        const s = p.size * u; ctx.beginPath(); ctx.moveTo(0, -s); ctx.lineTo(s * 0.7, s * 0.3); ctx.lineTo(-s * 0.5, s * 0.8); ctx.closePath(); ctx.fill(); ctx.stroke(); ctx.restore();
      }
    }
    ctx.globalAlpha = 1;
  }

  // ---------- цикл ----------
  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000); last = now; t += dt;
    if (stage && cv) {
      const r = stage.getBoundingClientRect();
      if (r.width && (Math.round(r.width) !== W || Math.round(r.height) !== H)) { W = Math.round(r.width); H = Math.round(r.height); dpr = Math.min(2, devicePixelRatio || 1); cv.width = W * dpr; cv.height = H * dpr; }
      ptr.sx += (ptr.x - ptr.sx) * Math.min(1, dt * 3); ptr.sy += (ptr.y - ptr.sy) * Math.min(1, dt * 3);
      const bg = stage.querySelector('.bg'); if (bg) bg.style.translate = `${-ptr.sx * 0.6}cqw ${-ptr.sy * 0.4}cqw`;
      emitters.forEach(e => EMIT[e.type] && EMIT[e.type](e, dt));
      actors.forEach(a => { if (a.el.isConnected) { stepActor(a, dt); drawActor(a, dt); } });
      stepParts(dt); drawParts();
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // наклон планшета или курсор → параллакс
  window.addEventListener('pointermove', e => { if (!stage) return; const r = stage.getBoundingClientRect(); ptr.x = ((e.clientX - r.left) / r.width - 0.5) * 2; ptr.y = ((e.clientY - r.top) / r.height - 0.5) * 2; });
  window.addEventListener('deviceorientation', e => { if (e.gamma == null) return; ptr.x = Math.max(-1, Math.min(1, e.gamma / 25)); ptr.y = Math.max(-1, Math.min(1, (e.beta - 40) / 25)); });

  // кто говорит — тот и двигается
  document.addEventListener('rl:speaker', e => { speaker = e.detail; });

  return {
    // подключить новый экран: найти актёров, создать холст, задать окружение
    attach(stageEl, scene = {}) {
      stage = stageEl;
      const prev = new Map(actors); actors.clear();
      stage.querySelectorAll('[data-actor]').forEach(el => { const keep = scene.keep && prev.get(el.dataset.actor); actors.set(el.dataset.actor, makeActor(el, keep)); });
      cv = stage.querySelector('canvas.world'); ctx = cv ? cv.getContext('2d') : null; W = H = 1;
      emitters = (scene.emitters || []).map(e => Object.assign({ acc: 0 }, e));
      floorY = scene.floor || 92;
      if (!scene.keep) parts = [];
    },
    actor: name => actors.get(name),
    actors: () => actors,
    emitter: type => emitters.find(e => e.type === type),
    // готовые эффекты с физикой
    confetti(n = 90) {
      const cols = ['#f2b632', '#1a8f8a', '#f26b1d', '#5fd0ff', '#ff7aa8', '#8fd45a'];
      for (let i = 0; i < n; i++) P({ kind: 'rect', x: rnd(30, 70), y: rnd(-6, 4), vx: rnd(-35, 35), vy: rnd(-40, -10), g: 60, drag: 1.6, life: rnd(3.5, 5), size: rnd(0.7, 1.2), rot: rnd(0, 6), vr: rnd(-8, 8), color: cols[i % cols.length], floor: true, bounce: 0.3, sway: 3 });
    },
    burst(x, y, chars = ['⭐', '✨'], n = 14, power = 30) {
      for (let i = 0; i < n; i++) { const a = rnd(0, Math.PI * 2), v = rnd(0.4, 1) * power; P({ kind: 'text', text: chars[i % chars.length], x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - power * 0.6, g: 70, drag: 1.2, life: rnd(1, 1.6), size: rnd(2, 3.2), rot: rnd(-1, 1), vr: rnd(-6, 6), floor: true, bounce: 0.4, color: 'emoji' }); }
    },
    shards(x, y, n = 10) {
      for (let i = 0; i < n; i++) P({ kind: 'shard', x: x + rnd(-6, 6), y: y + rnd(-10, 0), vx: rnd(-25, 25), vy: rnd(-35, -10), g: 90, drag: 0.5, life: rnd(1.6, 2.6), size: rnd(0.8, 1.8), rot: rnd(0, 6), vr: rnd(-10, 10), floor: true, bounce: 0.35 });
    },
    drops(x, y, n = 12) {
      for (let i = 0; i < n; i++) P({ kind: 'glow', x: x + rnd(-5, 5), y, vx: rnd(-18, 18), vy: rnd(-30, -10), g: 90, life: rnd(1, 1.6), size: rnd(0.2, 0.4), color: '140,210,255', floor: true, bounce: 0.2 });
    },
    get time() { return t; }
  };
})();
