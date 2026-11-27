// Движок занятий, модуль проверки, журнал и озвучка.
window.RL = window.RL || {};

// ---------- озвучка ----------
RL.Voice = (function () {
  // Озвучка: готовые файлы из Higgsfield (audio/vo/*.mp3, список — js/content/voice-pack.js),
  // если файла нет — синтезатор речи браузера. Каждая реплика знает, кто говорит (для анимации).
  let muted = false, voice = null, queue = [], timer = null, cur = null, ctx = null;
  function pick() { const vs = speechSynthesis.getVoices(); voice = vs.find(v => /ru/i.test(v.lang) && /female|светлана|irina|ирина|svetlana|dariya/i.test(v.name)) || vs.find(v => /ru/i.test(v.lang)) || null; }
  if ('speechSynthesis' in window) { pick(); speechSynthesis.onvoiceschanged = pick; }
  const speaker = who => document.dispatchEvent(new CustomEvent('rl:speaker', { detail: who }));
  const PITCH = { robik: 1.25, asya: 1.45, tim: 1.05, narrator: 0.9 };
  const norm = t => (t || '').replace(/^(Ася|Тим):\s*/, '').toLowerCase().replace(/ё/g, 'е').replace(/[«»"“”.,!?…:;—–-]/g, ' ').replace(/\s+/g, ' ').trim();
  const pack = () => (RL.voicePack && RL.voicePack.lines) || {};
  // металлический отзвук для Робика: короткая гребёнчатая задержка (только при http/https)
  function robotize(audio) {
    if (!/^https?:/.test(location.protocol)) return;
    try {
      ctx = ctx || new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaElementSource(audio), dry = ctx.createGain(), wet = ctx.createGain(), d = ctx.createDelay(), fb = ctx.createGain();
      d.delayTime.value = 0.006; fb.gain.value = 0.45; dry.gain.value = 0.85; wet.gain.value = 0.4;
      src.connect(dry).connect(ctx.destination); src.connect(d); d.connect(fb).connect(d); d.connect(wet).connect(ctx.destination);
    } catch (e) {}
  }
  let held = false, heldTimer = false;   // пауза: текущая реплика стоит, очередь ждёт
  function stopCurrent() { if (cur) { cur.onended = cur.onerror = null; cur.pause(); cur = null; } clearTimeout(timer); heldTimer = false; if ('speechSynthesis' in window) speechSynthesis.cancel(); }
  function playNext() {
    clearTimeout(timer);
    if (held) { heldTimer = true; return; }
    const part = queue.shift();
    if (!part) { speaker(null); return; }
    const who = part.who || 'robik';
    speaker(who);
    const fallback = () => { timer = setTimeout(playNext, Math.max(900, part.text.length * 62)); };
    if (muted) { fallback(); return; }
    const hit = pack()[norm(part.text)];
    if (hit) {
      const a = new Audio(hit.file); cur = a; a.volume = Math.min(1, hit.gain || 1);
      if ((hit.who || who) === 'robik' && !hit.fx) robotize(a);   // у новых записей эффект робота уже внутри
      a.onended = playNext; a.onerror = () => tts(part, fallback);
      a.play().catch(e => {
        // браузер не даёт звучать до первого касания страницы: ждём касания и играем ту же запись,
        // а не переходим на системный голос (он звучит как чужой женский голос)
        if (e && e.name === 'NotAllowedError') {
          const go = () => { ['pointerdown', 'keydown', 'touchstart'].forEach(t => removeEventListener(t, go, true)); if (cur === a && !held) a.play().catch(() => {}); };
          ['pointerdown', 'keydown', 'touchstart'].forEach(t => addEventListener(t, go, true));
        } else if (cur === a) tts(part, fallback);
      });
      return;
    }
    tts(part, fallback);
  }
  function tts(part, fallback) {
    if (!('speechSynthesis' in window) || !voice) { fallback(); return; }
    const u = new SpeechSynthesisUtterance(part.text.replace(/[«»]/g, '').replace(/^(Ася|Тим):\s*/, ''));
    u.lang = 'ru-RU'; u.rate = 0.95; u.pitch = PITCH[part.who] || 1.15; u.voice = voice;
    u.onend = playNext; u.onerror = playNext;
    speechSynthesis.speak(u);
  }
  function show() { RL.Voice.last = RL.Voice.lastParts.map(p => p.text).join(' '); document.dispatchEvent(new CustomEvent('rl:say', { detail: RL.Voice.last })); }
  function run(parts) { stopCurrent(); held = false; queue = parts.filter(p => p.text); RL.Voice.lastParts = queue.slice(); show(); playNext(); }
  return {
    // пауза для всех: mp3 встаёт на месте, синтезатор замирает, следующая реплика ждёт
    hold() { if (held) return; held = true; if (cur) cur.pause(); if ('speechSynthesis' in window && speechSynthesis.speaking) speechSynthesis.pause(); if (timer) { clearTimeout(timer); timer = null; heldTimer = true; } },
    release() { if (!held) return; held = false; if (cur) cur.play().catch(() => {}); if ('speechSynthesis' in window) speechSynthesis.resume(); if (heldTimer) { heldTimer = false; playNext(); } },
    say(text, who = 'robik') { run([{ text, who }]); },
    sayParts(parts) { run(parts); },
    // добавить реплику в конец очереди, не перебивая говорящего
    append(text, who = 'robik') { const idle = !queue.length && !cur && !speechSynthesis.speaking; RL.Voice.lastParts.push({ text, who }); queue.push({ text, who }); show(); if (idle) playNext(); },
    repeat() { run(RL.Voice.lastParts || []); },
    get speaking() { return !!cur && !cur.paused || speechSynthesis.speaking; },
    set muted(m) { muted = m; if (m) stopCurrent(); },
    get muted() { return muted; },
    get hasVoice() { return !!voice || Object.keys(pack()).length > 0; },
    norm, last: '', lastParts: []
  };
})();

// ---------- модуль проверки ----------
RL.Check = {
  // готов ли замер: значение сдвинулось на minChange от старта и держится stableSec
  SAME_EXTRA: 5,   // сколько секунд дольше ждать, если показание почти не изменилось
  moved(start, wait) { return Math.abs(RL.Sensor.mean(1) - start) >= (wait.minChange || 0); },
  measureReady(start, wait) {
    // сдвиг считаем по среднему за окно, чтобы шум датчика не засчитывался как изменение
    const sec = wait.stableSec || 2;
    const moved = Math.abs(RL.Sensor.mean(sec) - start) >= (wait.minChange || 0);
    return moved && RL.Sensor.isStable(sec);
  },
  // сравнение условий: у кого больше (rule=max) или меньше (rule=min); почти равные лидеры — ничья
  compare(results, rule, tol) {
    const keys = Object.keys(results);
    if (!keys.length) return 'tie';
    const sorted = keys.slice().sort((a, b) => rule === 'min' ? results[a] - results[b] : results[b] - results[a]);
    if (sorted.length > 1 && Math.abs(results[sorted[0]] - results[sorted[1]]) <= tol) return 'tie';
    return sorted[0];
  }
};

// ---------- журнал и альбом ----------
RL.Journal = {
  list() { try { return JSON.parse(localStorage.getItem('rl.journal') || '[]'); } catch (e) { return []; } },
  add(entry) { const l = RL.Journal.list(); l.unshift(entry); try { localStorage.setItem('rl.journal', JSON.stringify(l.slice(0, 200))); } catch (e) {} },
  album() { try { return JSON.parse(localStorage.getItem('rl.album') || '{}'); } catch (e) { return {}; } },
  addSticker(house) { const a = RL.Journal.album(); a[house] = (a[house] || 0) + 1; try { localStorage.setItem('rl.album', JSON.stringify(a)); } catch (e) {} },
  exportJSON() {
    // Формат выгрузки в COR — предположение, сверить с командой COR.
    return JSON.stringify({ format: 'robiclab-start-journal/0.1', group: 'Солнышко', exported: new Date().toISOString(), entries: RL.Journal.list() }, null, 2);
  },
  // понятное описание записи: догадки, замеры, итог (для таблицы и CSV)
  describe(e) {
    const L = RL.content[e.base || e.lesson], unit = e.unit === '°' ? '°' : '';
    const num = v => v === null || v === undefined ? '' : (Math.round(v * 10) / 10 + unit);
    if (e.kind === 'lab') return { type: 'Лаборатория', votes: '', guessed: '',
      measures: (e.marks || []).map(m => m.label + ': ' + num(m.v)).join(', '),
      outcome: e.max !== null && e.max !== undefined ? 'от ' + num(e.min) + ' до ' + num(e.max) : '' };
    const m = L && L.steps.find(x => x.type === 'measure'), g = L && L.steps.find(x => x.type === 'guess');
    const lbl = k => { const c = m && m.conditions.find(x => x.key === k); return c ? c.label : k; };
    const opt = k => { const o = g && g.options.find(x => x.key === k); return o ? o.label : lbl(k); };
    return { type: 'Урок',
      votes: Object.entries(e.votes || {}).map(([k, n]) => opt(k) + ' — ' + n).join(', '),
      guessed: e.guessed === true ? 'да' : e.guessed === false ? 'нет' : '',
      measures: Object.entries(e.results || {}).map(([k, v]) => lbl(k) + ': ' + num(v)).join(', '),
      outcome: e.winner === 'tie' ? 'почти одинаково' : e.winner ? 'больше всего — ' + lbl(e.winner).toLowerCase() : '' };
  },
  // CSV для Excel: точка с запятой и BOM, чтобы русские буквы открылись правильно
  exportCSV() {
    const q = s => '"' + String(s === undefined || s === null ? '' : s).replace(/"/g, '""') + '"';
    const head = ['Дата', 'Время', 'Занятие', 'Тип', 'Минут', 'Звёзды', 'Догадки группы', 'Угадали', 'Замеры', 'Итог'];
    const rows = RL.Journal.list().map(e => { const d = new Date(e.date), x = RL.Journal.describe(e);
      return [d.toLocaleDateString('ru-RU'), d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' }), e.title, x.type, e.minutes, e.stars, x.votes, x.guessed, x.measures, x.outcome]; });
    return '﻿' + [head].concat(rows).map(r => r.map(q).join(';')).join('\r\n');
  },
  markSynced(dates) { const l = RL.Journal.list().map(e => dates.includes(e.date) ? { ...e, synced: true } : e); try { localStorage.setItem('rl.journal', JSON.stringify(l)); } catch (e) {} },
  clear() { try { localStorage.removeItem('rl.journal'); localStorage.removeItem('rl.album'); } catch (e) {} }
};

// ---------- движок занятий ----------
RL.Engine = (function () {
  const subs = new Set();
  let L = null;          // текущее занятие
  let S = null;          // состояние
  let timers = [];
  let roundsPref = 0;    // число туров «Согрей Робика» из пульта (0 — как в контент-пакете)

  function emit() { subs.forEach(fn => fn(S, L)); }
  // таймеры шагов умеют вставать на паузу и продолжать с того же места
  function arm(t, ms) { t.due = performance.now() + ms; t.id = setTimeout(() => { timers = timers.filter(x => x !== t); t.fn(); }, ms); }
  function later(ms, fn) { const t = { fn }; timers.push(t); if (S && S.paused) t.left = ms; else arm(t, ms); }
  function clearTimers() { timers.forEach(t => clearTimeout(t.id)); timers = []; }
  function freezeTimers() { const now = performance.now(); timers.forEach(t => { clearTimeout(t.id); t.left = Math.max(0, t.due - now); }); }
  function thawTimers() { timers.forEach(t => arm(t, t.left || 0)); }
  function step() { return L && L.steps[S.i]; }
  // звезда — за действие детей (догадка, замер, тур игры), один раз за каждое
  function award(key) { if (!S || S.awarded[key]) return; S.awarded[key] = true; S.stars++; }

  function fresh(lessonId) {
    return { lessonId, screen: 'map', i: -1, paused: false, votes: {}, results: {}, cond: 0, start: null,
             winner: null, game: null, reaction: null, startedAt: Date.now(), saved: false,
             stars: 0, awarded: {}, hold: 0, holdP: 0 };
  }

  function enterStep(i) {
    clearTimers();
    S.paused = false;   // переход по шагам снимает паузу
    S.i = Math.max(0, Math.min(i, L.steps.length - 1));
    const st = step();
    S.screen = st.type; S.reaction = null;
    if (st.type === 'lab') { S.condStartedAt = performance.now(); RL.Sensor.setDevice({ eyes: 'wait' }); }
    if (st.type === 'intro') { RL.Sensor.setDevice({ eyes: (st.device && st.device.eyes) || 'blue' }); RL.Voice.sayParts([{ text: st.narration, who: 'narrator' }, { text: st.say, who: 'robik' }]); }
    if (st.type === 'guess') { st.options.forEach(o => { if (!(o.key in S.votes)) S.votes[o.key] = 0; }); RL.Voice.sayParts([{ text: st.say, who: 'robik' }].concat(st.options.map(o => ({ text: o.say, who: o.who || 'robik' })))); }
    if (st.type === 'measure') { S.cond = 0; S.results = {}; startCondition(); }
    if (st.type === 'compare') {
      const m = L.steps.find(x => x.type === 'measure');
      const cand = {}; m.conditions.filter(c => !c.baseline).forEach(c => { if (S.results[c.key] !== undefined) cand[c.key] = S.results[c.key]; });
      S.winner = RL.Check.compare(cand, st.rule, st.tolerance);
      RL.Sensor.setDevice({ eyes: 'happy', vibrate: 1 });
      RL.Voice.say(S.winner === 'tie' ? st.tie : st.win[S.winner]);
    }
    if (st.type === 'game' && st.game === 'beam') { S.game = { kind: 'beam', flashes: 0, need: st.flashes || 8, lit: false, done: false, won: 0, pos: 0 }; RL.Sensor.setDevice({ eyes: 'wait' }); RL.Voice.say(st.say); }
    else if (st.type === 'game' && st.game === 'owl') { S.game = { kind: 'owl', pos: 0, wake: 0, wakes: 0, awake: false, done: false, zone: 'quiet', won: 0 }; RL.Sensor.setDevice({ eyes: 'wait' }); RL.Voice.say(st.say); }
    else if (st.type === 'game') { S.game = { kind: st.game === 'cloud' ? 'cloud' : 'ice', round: 1, rounds: roundsPref || st.rounds, base: RL.Sensor.value, progress: 0, between: false, won: 0 }; RL.Sensor.setDevice({ eyes: 'blue' }); RL.Voice.say(st.say); }
    if (st.type === 'sticker') { finish(); RL.Sensor.setDevice({ eyes: 'happy', vibrate: 1 }); RL.Voice.say(st.say); }
    emit();
  }

  function startCondition() {
    const c = step().conditions[S.cond];
    S.start = RL.Sensor.value; S.condStartedAt = performance.now();
    S.hold = 0; S.holdP = 0; S.disturbed = false; S.same = false; S.lastTick = 0;
    RL.Sensor.setDevice({ eyes: 'wait', vibrate: 1 });
    RL.Voice.say(c.say);
  }

  function recordCondition(v) {
    const st = step(); const c = st.conditions[S.cond];
    if (st.average) v = RL.Sensor.mean(c.wait.stableSec || 2);
    S.results[c.key] = Math.round(v * 10) / 10; S.holdP = 1; award('m:' + c.key);
    RL.Sensor.setDevice({ eyes: 'happy', vibrate: 1 });
    S.reaction = st.reactions.stable;
    RL.Voice.say(st.reactions.stable + ' ' + c.label + '.');
    emit();
    later(2200, () => {
      if (S.cond < st.conditions.length - 1) { S.cond++; S.reaction = null; startCondition(); emit(); }
      else enterStep(S.i + 1);
    });
  }

  function finish() {
    if (S.saved) return; S.saved = true;
    RL.Journal.addSticker(L.house);
    // угадала ли группа: за победителя проголосовало больше всего детей
    const top = Math.max(0, ...Object.values(S.votes));
    const guessed = S.winner && S.winner !== 'tie' && top > 0 ? S.votes[S.winner] === top : null;
    RL.Journal.add({ date: new Date().toISOString(), kind: 'lesson', lesson: L.id, title: L.title, votes: { ...S.votes },
      results: { ...S.results }, unit: L.unit, stars: S.stars, winner: S.winner, guessed, gameRounds: S.game ? S.game.won : 0, wakes: S.game && S.game.wakes,
      minutes: Math.max(1, Math.round((Date.now() - S.startedAt) / 60000)) });
  }
  // лаборатория пишется в журнал при выходе, если дети что-то нашли или были в ней дольше 30 с
  function saveLab() {
    if (!L || !L.lab || !S || S.saved) return; S.saved = true;
    const lab = S.lab; if (!lab.marks.length && Date.now() - S.startedAt < 30000) return;
    RL.Journal.add({ date: new Date().toISOString(), kind: 'lab', lesson: L.id, base: L.base, title: L.title, unit: L.unit, stars: S.stars,
      marks: lab.marks.map(m => ({ label: m.label, v: m.v })), min: lab.min, max: lab.max,
      minutes: Math.max(1, Math.round((Date.now() - S.startedAt) / 60000)) });
  }
  const LAB_IDLE = 'Мерьте что хотите — я покажу! 🔬';
  const r1 = v => v === null || v === undefined ? v : Math.round(v * 10) / 10;

  // реакция на каждое измерение
  RL.Sensor.on(s => {
    if (!S || S.paused || S.i < 0) return;
    const st = step();
    // свободная лаборатория: Робик комментирует, рекорды обновляются, находки отмечают дети
    if (st.type === 'lab') {
      const lab = S.lab, now = performance.now(), el = (now - S.condStartedAt) / 1000;
      if (el > 1.5) {   // дать датчику успокоиться после смены канала
        const v = s.v, eps = L.channel === 't' ? 0.4 : 3;
        if (lab.max === null) { lab.max = lab.min = r1(v); lab.recHi = lab.recLo = v; }
        lab.max = r1(Math.max(lab.max, v)); lab.min = r1(Math.min(lab.min, v));
        if (el > 4 && now - (lab.recAt || 0) > 3000) {
          if (v > lab.recHi + eps) { lab.recHi = v; lab.rec = { kind: 'max', at: now }; lab.recAt = now; }
          else if (v < lab.recLo - eps) { lab.recLo = v; lab.rec = { kind: 'min', at: now }; lab.recAt = now; }
        }
        lab.recHi = Math.max(lab.recHi, v); lab.recLo = Math.min(lab.recLo, v);
      }
      const prev = S.reaction;
      if (st.levels) {
        const lv = s.v >= st.levels.loud ? 'loud' : s.v <= st.levels.quiet ? 'quiet' : 'mid';
        S.reaction = st.reactions[lv];
        RL.Sensor.setDevice({ eyes: st.levelEyes ? st.levelEyes[lv] : lv === 'loud' ? (L.channel === 'light' ? 'bright' : 'loud') : lv === 'quiet' ? 'happy' : 'wait' });
      }
      else if (s.trend === 'rising') { S.reaction = st.reactions.rising; RL.Sensor.setDevice({ eyes: 'warm' }); }
      else if (s.trend === 'falling') { S.reaction = st.reactions.falling; RL.Sensor.setDevice({ eyes: 'blue' }); }
      else if (RL.Sensor.isStable(2)) { S.reaction = LAB_IDLE; RL.Sensor.setDevice({ eyes: 'wait' }); }
      if (el > 1.5 && prev !== S.reaction && S.reaction && S.reaction !== LAB_IDLE && !RL.Voice.speaking && now - (S.saidAt || 0) > 3500) { S.saidAt = now; RL.Voice.say(S.reaction); }
      emit(); return;
    }
    if (st.type === 'measure' && S.results[st.conditions[S.cond].key] === undefined) {
      const prev = S.reaction;
      if (st.levels) {                       // реакция по уровню (громкость)
        const lv = s.v >= st.levels.loud ? 'loud' : s.v <= st.levels.quiet ? 'quiet' : 'mid';
        S.reaction = st.reactions[lv];
        RL.Sensor.setDevice({ eyes: st.levelEyes ? st.levelEyes[lv] : lv === 'loud' ? 'loud' : lv === 'quiet' ? 'happy' : 'wait' });
      }
      else if (s.trend === 'rising') { S.reaction = st.reactions.rising; RL.Sensor.setDevice({ eyes: 'warm' }); }
      else if (s.trend === 'falling') { S.reaction = st.reactions.falling; RL.Sensor.setDevice({ eyes: 'blue' }); }
      if (prev !== S.reaction && S.reaction && S.reaction !== st.reactions.stable && !RL.Voice.speaking && performance.now() - (S.saidAt || 0) > 2500) { S.saidAt = performance.now(); RL.Voice.say(S.reaction); }
      // удержание: копим время, пока показание ровное; рывок — начинаем заново.
      // Сдвинулось на minChange — хватает stableSec. Не сдвинулось, но дети что-то делали
      // (было движение) — ждём дольше и записываем как есть: «одинаково» — тоже результат.
      const now = performance.now(), dt = S.lastTick ? Math.min(0.2, (now - S.lastTick) / 1000) : 0; S.lastTick = now;
      const waited = (now - S.condStartedAt) / 1000;
      const w = st.conditions[S.cond].wait, need = w.stableSec || 2;
      const steady = RL.Sensor.isStable(0.8);
      if (!steady) { S.hold = 0; S.disturbed = true; } else S.hold += dt;
      const moved = RL.Check.moved(S.start, w);
      const target = moved ? need : S.disturbed ? need + RL.Check.SAME_EXTRA : 0;
      S.same = !moved && S.disturbed && steady;
      S.holdP = target ? Math.min(1, S.hold / target) : 0;
      if (target && waited > Math.max(1.5, need + 0.3) && S.hold >= target && RL.Sensor.isStable(Math.min(need, target))) recordCondition(s.v);
    }
    // «Мигай, как маяк»: вспышка = свет поднялся выше high и снова упал ниже low; каждая вспышка — шаг кораблика
    if (st.type === 'game' && S.game && S.game.kind === 'beam' && !S.game.done) {
      const g = S.game;
      if (!g.lit && s.v >= st.high) { g.lit = true; RL.Sensor.setDevice({ eyes: 'bright' }); }
      else if (g.lit && s.v <= st.low) {
        g.lit = false; g.flashes++; g.pos = g.flashes / g.need; RL.Sensor.setDevice({ eyes: 'happy', vibrate: 1 });
        if (g.flashes >= g.need) {
          g.done = true; g.won = 1; award('beam'); RL.Voice.say('Ура, кораблик в гавани! Маяк снова светит!');
          later(4200, () => enterStep(S.i + 1));
        }
      }
    }
    if (st.type === 'game' && S.game && S.game.kind === 'owl' && !S.game.done && !S.game.awake) {
      const g = S.game;
      g.zone = s.v >= st.loud ? 'loud' : s.v <= st.quiet ? 'quiet' : 'mid';
      if (g.zone === 'quiet') { g.pos = Math.min(1, g.pos + 0.0032); g.wake = Math.max(0, g.wake - 0.01); }
      else if (g.zone === 'mid') g.wake = Math.min(1, g.wake + 0.006);
      else g.wake = Math.min(1, g.wake + 0.035);
      RL.Sensor.setDevice({ eyes: g.zone === 'loud' ? 'loud' : 'wait' });
      if (g.wake >= 1) {
        g.awake = true; g.wakes++; RL.Sensor.setDevice({ eyes: 'loud', vibrate: 1 });
        RL.Voice.say('Ой! Совёнок проснулся… Баю-бай, малыш. Давайте ещё тише!');
        later(3500, () => { g.awake = false; g.wake = 0; emit(); });
      }
      if (g.pos >= 1) {
        g.done = true; g.won = 1; award('owl'); RL.Sensor.setDevice({ eyes: 'happy', vibrate: 1 });
        RL.Voice.say(g.wakes ? 'Ура, печенье! Совёнок снова сладко спит.' : 'Ура, печенье! И никто не проснулся!');
        later(3800, () => enterStep(S.i + 1));
      }
    }
    // «Согрей Робика» и «Вырасти облако»: один механизм — показание выросло на rise от своего минимума
    if (st.type === 'game' && S.game && (S.game.kind === 'ice' || S.game.kind === 'cloud') && !S.game.between && S.game.round <= S.game.rounds) {
      const g = S.game;
      g.base = Math.min(g.base, s.v);                       // если остывает — порог сдвигается вниз
      g.progress = Math.max(0, Math.min(1, (s.v - g.base) / st.rise));
      if (g.progress >= 1) {
        g.won++; g.between = true; award('ice' + g.round);
        RL.Sensor.setDevice({ eyes: 'happy', vibrate: 1 });
        const last = g.round >= g.rounds;
        const ln = st.lines || { done: 'Ура! Весь лёд растаял! Спасибо, мне тепло!', next: 'Ура, льдинка растаяла! Передайте меня следующему.' };
        RL.Voice.say(last ? ln.done : ln.next);
        RL.Sensor.hold(null); if (RL.Sensor.rh) RL.Sensor.rh('room');
        later(last ? 3500 : 4500, () => {
          if (last) { enterStep(S.i + 1); return; }
          g.round++; g.between = false; g.base = RL.Sensor.value; g.progress = 0;
          RL.Sensor.setDevice({ eyes: g.kind === 'cloud' ? 'warm' : 'blue' }); const w = { 2: 'второй', 3: 'третий' }[g.round]; if (w) RL.Voice.say('Тур ' + w + (g.kind === 'cloud' ? '! Дышите на меня!' : '! Грейте меня!')); emit();
        });
      }
    }
    emit();
  });

  return {
    subscribe(fn) { subs.add(fn); if (S) fn(S, L); },
    get state() { return S; }, get lesson() { return L; },
    // свободная лаборатория домика: тот же датчик и реплики, что в уроке, но без сценария
    startLab(lessonId, name) {
      saveLab(); clearTimers();
      const base = RL.content[lessonId], m = base.steps.find(x => x.type === 'measure');
      L = { id: 'lab-' + base.house, lab: true, base: lessonId, house: base.house, channel: base.channel, unit: base.unit,
            title: 'Лаборатория · ' + (name || base.title), minutes: 10, age: base.age, conditions: m.conditions,
            steps: [{ type: 'lab', title: 'Свободные опыты', reactions: m.reactions, levels: m.levels, levelEyes: m.levelEyes,
              hint: 'Дети мерят что угодно: ладонь, окно, батарею, свои предметы. Нажмите «Запомнить», когда показание встало, — находка попадёт в ряд, и их можно сравнить. Неожиданное значение — тоже результат.' }] };
      RL.Sensor.setChannel(L.channel); S = fresh(L.id); S.lab = { min: null, max: null, marks: [], count: 0, rec: null };
      enterStep(0);
    },
    // запомнить текущее показание как находку (не больше 8 на экране)
    pin(label) {
      if (!S || !S.lab || S.paused) return;
      const lab = S.lab; lab.count++;
      lab.marks.push({ n: lab.count, label: (label || '').trim() || 'Находка ' + lab.count, v: r1(RL.Sensor.mean(1)) });
      if (lab.marks.length > 8) lab.marks.shift();
      if (lab.count <= 5) award('pin' + lab.count);
      RL.Sensor.setDevice({ eyes: 'happy', vibrate: 1 }); emit();
    },
    unpin(i) { if (S && S.lab) { S.lab.marks.splice(i, 1); emit(); } },
    resetRecords() { if (S && S.lab) { const v = RL.Sensor.value; Object.assign(S.lab, { min: r1(v), max: r1(v), recHi: v, recLo: v, rec: null }); emit(); } },
    showMap() { saveLab(); clearTimers(); S = S || fresh(null); S.screen = 'map'; S.i = -1; L = null; RL.Voice.say('Это Городок Почему. Здесь в каждом доме живёт своя загадка. Куда пойдём сегодня?', 'narrator'); emit(); },
    start(lessonId) { saveLab(); L = RL.content[lessonId]; RL.Sensor.setChannel(L.channel); S = fresh(lessonId); enterStep(0); },
    next() { if (!L) return; if (S.i < L.steps.length - 1) enterStep(S.i + 1); },
    back() { if (!L) return; enterStep(S.i - 1); },
    go(i) { if (!L) return; enterStep(i); },
    repeat() { if (!L) return; enterStep(S.i); },
    pause(p) {
      if (!S || !L) return; const want = p === undefined ? !S.paused : !!p; if (want === S.paused) return;
      S.paused = want;
      if (want) { freezeTimers(); RL.Voice.hold(); } else { thawTimers(); RL.Voice.release(); }
      emit();
    },
    vote(key, d) { if (!S || !(key in S.votes)) return; S.votes[key] = Math.max(0, S.votes[key] + d); if (d > 0) award('guess'); emit(); },
    fix() { const st = step(); if (st && st.type === 'measure' && S.results[st.conditions[S.cond].key] === undefined) recordCondition(RL.Sensor.value); },
    sayAgain() { RL.Voice.repeat(); },
    // число туров игры: педагог ставит по числу детей, которые будут греть Робика
    get rounds() { const st = L && L.steps.find(x => x.game === 'warm-robik' || x.game === 'cloud'); return roundsPref || (st ? st.rounds : 3); },
    setRounds(n) { roundsPref = Math.max(1, Math.min(12, n)); if (S && S.game && (S.game.kind === 'ice' || S.game.kind === 'cloud')) S.game.rounds = Math.max(roundsPref, S.game.won + (S.game.between ? 0 : 1)); emit(); },
    // пропустить рассказчика: сразу реплика Робика
    skipNarration() { const st = L && step(); if (st && st.type === 'intro') RL.Voice.say(st.say); },
    // демо-переход сразу к шагу (для показа и проверки вёрстки): ?demo=3
    demo(lessonId, i) {
      L = RL.content[lessonId]; RL.Sensor.setChannel(L.channel); S = fresh(lessonId);
      const g = L.steps.find(x => x.type === 'guess'); g.options.forEach((o, k) => S.votes[o.key] = [5, 3, 2][k] || 1);
      S.results = L.channel === 'sound' ? { open: 74, scarf: 52.4, bubble: 58.1, paper: 64.8 } : L.channel === 'light' ? { open: 92, glass: 67.6, paper: 41.2, card: 5.8 } : L.channel === 'rh' ? { air: 41, towel: 44.2, sponge: 71.5, breath: 86.3 } : { hand: 33.9, water: 22.1 };
      award('guess'); if (i > 2) Object.keys(S.results).forEach(k => award('m:' + k));
      enterStep(i); }
  };
})();
