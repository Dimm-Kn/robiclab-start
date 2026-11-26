// Скелетная 2D-анимация героев («куклы на шарнирах»), без библиотек.
// Герой собран из частей (туловище, голова, плечо, предплечье, антенна), каждая вращается вокруг своего сустава.
// Позу задают слои: дыхание и покачивание → настроение → речь → жест. Суставы догоняют позу пружиной,
// поэтому движения плавные и с инерцией. Ася и Тим моргают и открывают рот (накладки из картинок),
// у Робика лицо — экран: глаза и рот рисуются кодом и меняются по настроению.
// Описание частей и суставов — js/content/rigs.js (собирает img/rig_cut.py).
window.RL = window.RL || {};

RL.Rig = (function () {
  const specs = {}, cache = {};
  const img = src => { if (!cache[src]) { const i = new Image(); i.src = src; cache[src] = i; } return cache[src]; };
  const D = Math.PI / 180;
  const ease = (x) => x < 0 ? 0 : x > 1 ? 1 : x * x * (3 - 2 * x);

  function define(name, spec) {
    specs[name] = spec;
    spec.parts.forEach(p => img(p.src));
    Object.values(spec.overlays || {}).forEach(o => img(o.src));
  }
  const has = name => !!specs[name];
  // картинки частей героя — для экрана загрузки
  const srcs = name => specs[name] ? spec_srcs(specs[name]) : [];
  const spec_srcs = sp => sp.parts.map(p => p.src).concat(Object.values(sp.overlays || {}).map(o => o.src));

  // ---------- жесты: функция (время с начала, длительность) → целевые углы рук ----------
  // Углы АБСОЛЮТНЫЕ, в градусах от «рука висит вниз»: + наружу (90 — горизонтально в сторону, 180 — вверх),
  // − внутрь, к середине тела. U — плечо (направление плеча), F — предплечье. Так один и тот же жест
  // одинаково выглядит у всех героев, хотя руки в исходных картинках нарисованы под разным наклоном.
  const GESTURES = {
    wave:  (s) => ({ R: { U: 140 + 7 * Math.sin(s * 13), F: 150 + 16 * Math.sin(s * 13) }, head: 4 }),
    cheer: (s) => ({ L: { U: 155 + 8 * Math.sin(s * 11), F: 152 }, R: { U: 155 + 8 * Math.sin(s * 11 + 1), F: 152 }, head: -3 }),
    point: (s, d, o) => ({ [o.side || 'R']: { U: 95, F: 92 }, head: (o.side === 'L' ? -5 : 5) }),
    think: (s) => ({ R: { U: 55, F: -150 }, head: 6 + 2 * Math.sin(s * 2) }),
    shrug: (s) => ({ L: { U: 55, F: 120 }, R: { U: 55, F: 120 }, head: 7 * Math.sin(s * 3) }),
    clap:  (s) => ({ L: { U: 45, F: -45 + 12 * Math.sin(s * 14) }, R: { U: 45, F: -45 + 12 * Math.sin(s * 14) } }),
    nod:   (s) => ({ head: 7 * Math.sin(s * 9) })
  };
  // настроения Робика: поза рук и лицо на экране
  const MOODS = {
    neutral: { L: { up: 10 }, R: { up: 10 } },
    wait:    { L: { up: 8 }, R: { up: 40 }, face: 'think' },
    cold:    { L: { up: -15 }, R: { up: -15 }, shiver: 1, face: 'cold' },
    warm:    { L: { up: 120 }, R: { up: 120 }, face: 'warm' },
    happy:   { L: { up: 140 }, R: { up: 140 }, face: 'happy' },
    loud:    { L: { up: 160 }, R: { up: 160 }, shiver: 1, face: 'loud' },
    shh:     { L: { up: 5 }, R: { up: 150 }, face: 'shh' },
    bright:  { L: { up: 12 }, R: { up: 165 }, face: 'bright' }        // ярко: щурится и прикрывает экран рукой
  };

  function create(name, canvas) {
    const S = specs[name], ctx = canvas.getContext('2d');
    const k = S.scale || 1;
    canvas.width = Math.round(S.w * k); canvas.height = Math.round(S.h * k);
    const byId = {}; S.parts.forEach(p => { byId[p.id] = p; });
    let bob = 0; const lift = { legL: 0, legR: 0 };
    const cur = {}, vel = {};                 // текущие углы суставов и их скорости
    // исходный наклон рук (градусы от «вниз», + наружу): плечо и предплечье
    const deg = (p, q, side) => Math.atan2((q[0] - p[0]) * (side === 'L' ? -1 : 1), q[1] - p[1]) / D;
    const REST = {}; Object.entries(S.rest || {}).forEach(([sd, r0]) => { REST[sd] = r0.elbow
      ? { up: deg(r0.shoulder, r0.elbow, sd), lo: deg(r0.elbow, r0.hand, sd), elbow: true }
      : { up: deg(r0.shoulder, r0.hand, sd), lo: 0, elbow: false }; });
    // абсолютные углы жеста → повороты суставов относительно исходной позы
    function toJoint(sd, g) {
      const R0 = REST[sd] || { up: 40, lo: 25, elbow: true }, out = {};
      if (g.U !== undefined) out.up = g.U - R0.up;
      if (g.F !== undefined && R0.elbow) out.lo = R0.lo + (out.up !== undefined ? out.up : 0) - g.F;
      return out;
    }
    S.parts.forEach(p => { cur[p.id] = 0; vel[p.id] = 0; });
    const r = {
      mood: 'neutral', gest: null, gT: 0, gDur: 0, gOpt: {},
      blinkAt: 1 + Math.random() * 3, blink: 0, mouth: 0, look: 0, eyesT: 0,
      peek: 0, peekV: 0,          // совы: насколько приоткрыты глаза (0 — спят, 1 — смотрят)
      gesture(g, dur = 1.6, opt = {}) { if (GESTURES[g]) { r.gest = g; r.gT = 0; r.gDur = dur; r.gOpt = opt; } },
      draw
    };

    // целевая поза из слоёв
    function target(t, a) {
      const ph = a.phase;
      const p = { torso: 1.4 * Math.sin(t * 1.1 + ph), head: 2.2 * Math.sin(t * 0.8 + ph * 2), antenna: 0,
                  L: { up: 6 + 3 * Math.sin(t * 1.3 + ph), lo: 8 + 4 * Math.sin(t * 1.1 + ph) },
                  R: { up: 6 + 3 * Math.sin(t * 1.3 + ph + 1.7), lo: 8 + 4 * Math.sin(t * 1.1 + ph + 1) } };
      const m = MOODS[r.mood];
      if (m && S.robot) { if (m.L) Object.assign(p.L, m.L); if (m.R) Object.assign(p.R, m.R); }
      // речь: кивки и «жесты-ударения» одной рукой
      if (a.talk > 0.05) {
        p.head += a.talk * 4 * Math.sin(t * 6.3 + ph);
        const side = S.robot ? 'R' : (S.talkHand || 'R');
        p[side].up += a.talk * (22 + 10 * Math.sin(t * 2.7));
        p[side].lo += a.talk * (35 + 18 * Math.sin(t * 4.1));
      }
      // жест поверх всего: плавно входит и выходит
      if (r.gest) {
        const w = ease(r.gT / 0.3) * ease((r.gDur - r.gT) / 0.35);
        const g = GESTURES[r.gest](r.gT, r.gDur, r.gOpt);
        ['L', 'R'].forEach(sd => { if (g[sd]) { const j = toJoint(sd, g[sd]); if (j.up !== undefined) p[sd].up += (j.up - p[sd].up) * w; if (j.lo !== undefined) p[sd].lo += (j.lo - p[sd].lo) * w; } });
        if (g.head) p.head += g.head * w;
      }
      // шаг: ноги качаются в бедре, руки — навстречу ногам; в покое — лёгкий перенос веса
      const w = a.walkAmt || 0, wp = a.walkPh || 0;
      // герой смотрит на зрителя, поэтому шаг — это поочерёдный подъём ног, а не размах в стороны
      p.legL = 5 * w * Math.sin(wp) + 1.2 * Math.sin(t * 1.1 + ph); p.legR = 5 * w * Math.sin(wp) - 1.2 * Math.sin(t * 1.1 + ph);
      lift.legL = w * Math.max(0, Math.sin(wp)) * S.h * 0.05; lift.legR = w * Math.max(0, -Math.sin(wp)) * S.h * 0.05;
      p.L.up -= 14 * w * Math.sin(wp); p.R.up += 14 * w * Math.sin(wp); p.torso += 2 * w * Math.sin(wp);
      // совы: во сне головы медленно кивают с дыханием; на шум поворачиваются в сторону look
      if (S.owl) { p.head = 2.2 * Math.sin(t * 0.55 + ph) + r.look * 5 * r.peekV; p.head2 = 2.2 * Math.sin(t * 0.55 + ph + 1.4) + r.look * 4 * r.peekV; p.torso = 0.4 * Math.sin(t * 0.55 + ph); }
      // антенна: качается от рывков тела (инерция)
      p.antenna = -(a.vx || 0) * 1.5 + (a.jv || 0) * 6 + 3 * Math.sin(t * 2.3 + ph);
      if (a.shiver || (m && m.shiver)) { const sv = Math.max(a.shiver || 0, (m && m.shiver) || 0); p.L.up += sv * 4 * Math.sin(t * 47); p.R.up += sv * 4 * Math.sin(t * 53); p.head += sv * 2 * Math.sin(t * 41); }
      return p;
    }

    function angleOf(p, id) {
      const q = byId[id], j = q.joint;
      if (!j) return 0;
      if (j === 'torso' || j === 'head' || j === 'head2' || j === 'antenna' || j === 'legL' || j === 'legR') return p[j] || 0;
      const [side, seg] = j.split('.');                     // 'L.up', 'R.lo'
      const v = p[side][seg] || 0;
      // левая (на экране) рука наружу — по часовой, правая — против; локоть «к телу» — наоборот
      return v * (side === 'L' ? 1 : -1) * (seg === 'lo' ? -1 : 1);
    }

    function draw(t, dt, a) {
      if (!S.parts.every(p => img(p.src).complete)) return;
      // жест и моргание
      if (r.gest) { r.gT += dt; if (r.gT >= r.gDur) r.gest = null; }
      r.blinkAt -= dt; if (r.blinkAt <= 0) { r.blink = 0.14; r.blinkAt = 2 + Math.random() * 3.5; if (Math.random() < 0.2) r.blinkAt = 0.25; }
      r.blink = Math.max(0, r.blink - dt);
      r.peekV += (r.peek - r.peekV) * Math.min(1, dt * 5);
      // рот: открывается слогами, пока герой говорит (ритм ~5 слогов в секунду)
      r.mouth = a.talk > 0.3 ? (Math.sin(t * 31 + a.phase) + Math.sin(t * 17)) > 0.3 ? 1 : 0 : 0;
      // пружины суставов к целевой позе
      const p = target(t, a);
      bob = Math.abs(Math.cos(a.walkPh || 0)) * (a.walkAmt || 0) * S.h * 0.01;
      S.parts.forEach(q => {
        const want = angleOf(p, q.id) * D, kk = q.joint === 'antenna' ? 90 : 60, cc = q.joint === 'antenna' ? 5 : 12;
        vel[q.id] += (kk * (want - cur[q.id]) - cc * vel[q.id]) * dt; cur[q.id] += vel[q.id] * dt;
      });
      ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.clearRect(0, 0, canvas.width, canvas.height);
      const sorted = S.parts.slice().sort((x, y) => (x.z || 0) - (y.z || 0));
      sorted.forEach(q => {
        place(q);
        ctx.drawImage(img(q.src), q.x, q.y);
        if (q.id === 'head' || q.face) overlays(q, t);
        (S.eyes || []).forEach(e => { if (e.part === q.id) eye(e); });
      });
    }
    // перенос системы координат вдоль цепочки суставов: корень → часть
    function place(q) {
      const chain = []; for (let c = q; c; c = byId[c.parent]) chain.unshift(c);
      ctx.setTransform(k, 0, 0, k, 0, -bob * k);         // подскок на каждом шаге
      chain.forEach(c => { if (!c.pivot) return; if (lift[c.joint]) ctx.translate(0, -lift[c.joint]); ctx.translate(c.pivot[0], c.pivot[1]); ctx.rotate(cur[c.id]); ctx.translate(-c.pivot[0], -c.pivot[1]); });
    }
    // совиный глаз кодом: открыть спящий глаз (peek) или закрыть открытый на миг (моргание)
    function eye(e) {
      let open = e.base === 'closed' ? r.peekV * (r.blink > 0 ? 0.1 : 1) : (r.blink > 0 ? 0 : 1);
      if (e.base === 'closed' && open < 0.05) return;
      const R = e.r; ctx.save();
      if (e.base === 'open') {   // веко: цвет перьев лица и тёмная ресница
        if (open > 0.5) { ctx.restore(); return; }
        ctx.fillStyle = e.lid || '#e9cfa3'; ctx.beginPath(); ctx.ellipse(e.x, e.y, R * 1.12, R * 1.12, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#3b2413'; ctx.lineWidth = R * 0.14; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(e.x, e.y - R * 0.35, R * 0.8, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke();
        ctx.restore(); return;
      }
      ctx.beginPath(); ctx.ellipse(e.x, e.y, R * 1.15, R * 1.15 * open, 0, 0, Math.PI * 2); ctx.clip();
      ctx.fillStyle = '#fbf1da'; ctx.fillRect(e.x - R * 2, e.y - R * 2, R * 4, R * 4);
      const lx = r.look * R * 0.35;
      ctx.fillStyle = '#d0882a'; ctx.beginPath(); ctx.arc(e.x + lx, e.y, R * 0.72, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#1d140c'; ctx.beginPath(); ctx.arc(e.x + lx, e.y, R * 0.42, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.arc(e.x + lx - R * 0.2, e.y - R * 0.25, R * 0.17, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      ctx.save(); ctx.strokeStyle = '#3b2413'; ctx.lineWidth = R * 0.16; ctx.beginPath(); ctx.ellipse(e.x, e.y, R * 1.15, R * 1.15 * open, 0, Math.PI, Math.PI * 2); ctx.stroke(); ctx.restore();
    }
    function overlays(q, t) {
      const O = S.overlays || {};
      if (O.blink && r.blink > 0) ctx.drawImage(img(O.blink.src), O.blink.x, O.blink.y);
      if (O.talk && r.mouth) ctx.drawImage(img(O.talk.src), O.talk.x, O.talk.y);
      if (S.screen && q.face) screenFace(S.screen, t);
    }

    // лицо Робика на экране
    function screenFace(sc, t) {
      const [x, y, w, h] = sc, cx = x + w / 2, cy = y + h * 0.46;
      const mood = (MOODS[r.mood] && MOODS[r.mood].face) || 'neutral';
      const col = { cold: '#8fc8ff', warm: '#ffb054', loud: '#ff6b6b', bright: '#ffe066' }[mood] || '#5ff3ff';
      ctx.save();
      ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.shadowColor = col; ctx.shadowBlur = w * 0.08; ctx.lineWidth = w * 0.07;
      const ex = w * 0.2, ey = cy - h * 0.06, es = w * 0.11;
      const look = mood === 'think' ? [w * 0.05, -h * 0.08] : [Math.sin(t * 0.7) * w * 0.02, 0];
      const blink = r.blink > 0 ? 0.15 : 1;
      [-1, 1].forEach(sd => {
        const X = cx + sd * ex + look[0], Y = ey + look[1];
        ctx.beginPath();
        if (mood === 'happy' || mood === 'warm' || mood === 'bright') { ctx.arc(X, Y + es * 0.4, es * 0.75, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
        else if (mood === 'loud') { ctx.moveTo(X - sd * es * 0.7, Y - es * 0.6); ctx.lineTo(X + sd * es * 0.5, Y); ctx.lineTo(X - sd * es * 0.7, Y + es * 0.6); ctx.stroke(); }
        else if (mood === 'shh') { ctx.ellipse(X, Y + es * 0.2, es * 0.75, es * 0.38 * blink, 0, 0, Math.PI); ctx.fill(); }
        else { ctx.ellipse(X, Y, es * 0.55, es * 0.85 * blink * (mood === 'cold' ? 0.7 : 1), 0, 0, Math.PI * 2); ctx.fill(); }
      });
      // рот
      const my = cy + h * 0.22, mw = w * 0.16;
      ctx.beginPath(); ctx.lineWidth = w * 0.055;
      if (r.mouth) { ctx.ellipse(cx, my, mw * 0.55, mw * 0.45, 0, 0, Math.PI * 2); ctx.fill(); }
      else if (mood === 'happy' || mood === 'warm' || mood === 'bright') { ctx.moveTo(cx - mw, my - mw * 0.25); ctx.quadraticCurveTo(cx, my + mw * 1.1, cx + mw, my - mw * 0.25); ctx.closePath(); ctx.fill(); }
      else if (mood === 'cold' || mood === 'loud') { ctx.moveTo(cx - mw, my); for (let i = 1; i <= 4; i++) ctx.lineTo(cx - mw + i * mw / 2, my + (i % 2 ? -1 : 1) * mw * 0.22 + (mood === 'cold' ? Math.sin(t * 40) * 1.5 : 0)); ctx.stroke(); }
      else if (mood === 'shh') { ctx.arc(cx, my, mw * 0.28, 0, Math.PI * 2); ctx.stroke(); }
      else { ctx.arc(cx, my - mw * 0.5, mw * 0.8, Math.PI * 0.2, Math.PI * 0.8); ctx.stroke(); }
      if (mood === 'warm') { ctx.globalAlpha = 0.45; ctx.fillStyle = '#ff7a7a'; ctx.shadowBlur = 0; [-1, 1].forEach(sd => { ctx.beginPath(); ctx.ellipse(cx + sd * w * 0.3, ey + es * 1.1, es * 0.45, es * 0.25, 0, 0, Math.PI * 2); ctx.fill(); }); }
      ctx.restore();
    }
    return r;
  }

  return { define, has, srcs, create, GESTURES, MOODS };
})();
