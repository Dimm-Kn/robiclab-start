// Игровые эффекты: синтезированные звуки (без файлов) и частицы.
window.RL = window.RL || {};

RL.Sfx = (function () {
  let ctx = null, on = true;
  function ac() { if (!ctx) { try { ctx = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return null; } } if (ctx.state === 'suspended') ctx.resume(); return ctx; }
  function tone(freq, t0, dur, type = 'sine', vol = 0.18, slide = 0) {
    const c = ac(); if (!c || !on) return;
    const o = c.createOscillator(), g = c.createGain(), t = c.currentTime + t0;
    o.type = type; o.frequency.setValueAtTime(freq, t); if (slide) o.frequency.exponentialRampToValueAtTime(freq * slide, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol, t + 0.015); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(c.destination); o.start(t); o.stop(t + dur + 0.05);
  }
  const notes = { C5: 523, E5: 659, G5: 784, C6: 1047, A4: 440, D5: 587 };
  return {
    pop() { tone(420, 0, 0.12, 'triangle', 0.22, 2.2); },
    tap() { tone(700, 0, 0.06, 'square', 0.06); },
    success() { [notes.C5, notes.E5, notes.G5].forEach((f, i) => tone(f, i * 0.09, 0.25, 'triangle', 0.16)); },
    fanfare() { [notes.C5, notes.E5, notes.G5, notes.C6].forEach((f, i) => tone(f, i * 0.12, i === 3 ? 0.6 : 0.22, 'triangle', 0.18)); tone(notes.C6 * 1.5, 0.48, 0.5, 'sine', 0.06); },
    melt() { tone(900, 0, 0.35, 'sine', 0.14, 0.4); tone(1400, 0.08, 0.25, 'sine', 0.07, 0.5); },
    chime() { [notes.G5, notes.C6, notes.E5 * 2].forEach((f, i) => tone(f, i * 0.14, 0.5, 'sine', 0.13)); },
    whoosh() { tone(200, 0, 0.35, 'sawtooth', 0.04, 4); },
    star() { tone(1320, 0, 0.12, 'triangle', 0.12); tone(1760, 0.08, 0.22, 'sine', 0.1); },
    set enabled(v) { on = v; }, get enabled() { return on; }
  };
})();

RL.Fx = {
  // частицы-эмодзи из точки (в % от сцены)
  burst(stage, xPct, yPct, chars = ['⭐', '✨'], n = 14, spread = 22) {
    for (let i = 0; i < n; i++) {
      const s = document.createElement('span');
      s.className = 'pt';
      s.textContent = chars[i % chars.length];
      const a = Math.random() * Math.PI * 2, d = spread * (0.5 + Math.random() * 0.7);
      s.style.left = xPct + '%'; s.style.top = yPct + '%';
      s.style.setProperty('--dx', Math.cos(a) * d + 'cqw');
      s.style.setProperty('--dy', Math.sin(a) * d * 0.8 - 6 + 'cqw');
      s.style.setProperty('--r', (Math.random() * 720 - 360) + 'deg');
      s.style.animationDelay = Math.random() * 0.1 + 's';
      stage.appendChild(s);
      setTimeout(() => s.remove(), 1500);
    }
  },
  // конфетти сверху
  confetti(stage, n = 70) {
    const cols = ['#f2b632', '#1a8f8a', '#f26b1d', '#5fd0ff', '#ff7aa8', '#8fd45a'];
    for (let i = 0; i < n; i++) {
      const s = document.createElement('i');
      s.className = 'cf';
      s.style.left = Math.random() * 100 + '%';
      s.style.background = cols[i % cols.length];
      s.style.animationDuration = 1.8 + Math.random() * 1.6 + 's';
      s.style.animationDelay = Math.random() * 0.6 + 's';
      s.style.setProperty('--sx', (Math.random() * 20 - 10) + 'cqw');
      stage.appendChild(s);
      setTimeout(() => s.remove(), 4200);
    }
  },
  // падающий снег — слой внутри экрана
  snow(n = 26) {
    let h = '<div class="snow">';
    for (let i = 0; i < n; i++) h += `<i style="left:${Math.random() * 100}%;animation-duration:${5 + Math.random() * 6}s;animation-delay:-${Math.random() * 8}s;font-size:${0.9 + Math.random() * 1.6}cqw">❄</i>`;
    return h + '</div>';
  }
};

// Фоновые звуки сцен (Epidemic Sound через Higgsfield): петли с плавной сменой,
// приглушаются, пока кто-то говорит. Будильник звучит громче или тише вслед за датчиком.
RL.Amb = (function () {
  const FILES = { meadow: 'audio/amb/meadow.mp3', winter: 'audio/amb/winter.mp3', fireplace: 'audio/amb/fireplace.mp3',
                  night: 'audio/amb/night.mp3', tower: 'audio/amb/tower.mp3', alarm: 'audio/amb/alarm.mp3', ice: 'audio/amb/ice.mp3' };
  const BASE = { meadow: 0.22, winter: 0.3, fireplace: 0.35, night: 0.3, tower: 0.25, alarm: 0 };
  const loops = {}; let want = {}, on = true, duck = false, unlocked = false;
  function el(name) {
    if (!loops[name]) { const a = new Audio(FILES[name]); a.loop = true; a.volume = 0; a.preload = 'auto'; loops[name] = a; }
    return loops[name];
  }
  // плавная подстройка громкости всех петель
  setInterval(() => {
    for (const name in loops) {
      const a = loops[name];
      const target = on && unlocked ? (want[name] || 0) * (duck && name !== 'alarm' ? 0.4 : 1) : 0;
      a.volume = Math.max(0, Math.min(1, a.volume + (target - a.volume) * 0.15));
      if (target > 0.001 && a.paused) a.play().catch(() => {});
      if (target <= 0.001 && a.volume < 0.01 && !a.paused) a.pause();
    }
  }, 60);
  document.addEventListener('rl:speaker', e => { duck = !!e.detail; });
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { unlocked = true; }, { once: false, passive: true }));
  return {
    // набор петель для сцены: { winter: 1 } или { tower: 1, alarm: 0.5 }
    scene(mix) { want = {}; for (const k in mix) { el(k); want[k] = (BASE[k] || 0.3) * mix[k]; } },
    level(name, v) { el(name); want[name] = v; },
    sfx(name, vol = 0.7) { if (!on || !unlocked) return; const a = new Audio(FILES[name]); a.volume = vol; a.play().catch(() => {}); },
    set enabled(v) { on = v; }, get enabled() { return on; }
  };
})();

// Музыка (Suno): одна тема на сцену, тихо под голосом и фоном. Файлы — audio/music/<имя>.mp3.
// Если файла нет, просто тишина — занятие от музыки не зависит.
RL.Music = (function () {
  const VOL = 0.16;
  let cur = null, curName = '', on = true, duck = false, unlocked = false;
  const tracks = {};
  function el(name) { if (!tracks[name]) { const a = new Audio('audio/music/' + name + '.mp3'); a.loop = true; a.volume = 0; a.preload = 'auto'; a.onerror = () => { a.dead = true; }; tracks[name] = a; } return tracks[name]; }
  setInterval(() => {
    for (const n in tracks) {
      const a = tracks[n]; if (a.dead) continue;
      const target = on && unlocked && n === curName ? VOL * (duck ? 0.45 : 1) : 0;
      a.volume = Math.max(0, Math.min(1, a.volume + (target - a.volume) * 0.08));
      if (target > 0.001 && a.paused) a.play().catch(() => {});
      if (target <= 0.001 && a.volume < 0.005 && !a.paused) a.pause();
    }
  }, 60);
  document.addEventListener('rl:speaker', e => { duck = !!e.detail; });
  ['pointerdown', 'keydown'].forEach(ev => window.addEventListener(ev, () => { unlocked = true; }, { passive: true }));
  return {
    play(name) { if (name === curName) return; curName = name || ''; if (name) el(name); },
    set enabled(v) { on = v; }, get enabled() { return on; }
  };
})();
