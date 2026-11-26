// Интерфейсы: детский экран (живой мир с актёрами) и пульт педагога.
window.RL = window.RL || {};

(function () {
  const $ = (s, r = document) => r.querySelector(s);
  const stage = $('#stage'), panel = $('#panel'), app = $('#app');
  const E = RL.Engine, Snr = RL.Sensor, Sfx = RL.Sfx, W = RL.World;
  let device = { eyes: 'neutral' };
  let subsOn = false;      // субтитры на экране детей выключены: фразу педагог видит в пульте
  let autopilot = true;    // симулятор сам повторяет действия детей
  // Режим экрана. «Экран группы» (ТВ): дети экран не трогают, шаги и голоса ведёт педагог из пульта.
  // «Доска» (интерактивная доска или планшет): карточки нажимаются, «Дальше» — долгим нажатием.
  const qs = new URLSearchParams(location.search);
  let board = qs.has('board') ? true : qs.has('group') ? false : (() => { try { return localStorage.getItem('rl.mode') === 'board'; } catch (e) { return false; } })();
  function setBoard(v) { board = v; try { localStorage.setItem('rl.mode', v ? 'board' : 'group'); } catch (e) {} stageKey = ''; renderStage(E.state || { screen: 'map' }, E.lesson); refreshPanel(); }
  let shownStars = 0;      // сколько звёзд уже показано на экране (новые прилетают с анимацией)

  // ---------- Городок Почему: дома-темы ----------
  const HOUSES = [
    { id: 'heat',   name: 'Дом тепла',      icon: '🔥', topic: 'Тепло и холод',      lesson: 'heat-1', box: [5.5, 48, 21, 28] },
    { id: 'light',  name: 'Маяк света',     icon: '💡', topic: 'Свет и тень',         lesson: 'light-1', box: [11.9, 5.3, 12, 30.6] },
    { id: 'sound',  name: 'Башня звуков',   icon: '🔔', topic: 'Тихо и громко',       lesson: 'sound-1', box: [55.8, 1.3, 15, 31] },
    { id: 'force',  name: 'Зал силы',       icon: '💪', topic: 'Сила',                box: [76.6, 5.3, 19.4, 23.3] },
    { id: 'move',   name: 'Площадка',       icon: '🛝', topic: 'Движение',            box: [71.4, 32, 26, 22.6] },
    { id: 'body',   name: 'Дом здоровья',   icon: '❤️', topic: 'Моё тело',            box: [31.6, 63.8, 21.2, 25.3] },
    { id: 'acid',   name: 'Теплица',        icon: '🍋', topic: 'Кислое и щелочное',   box: [69.2, 55.9, 23.4, 25.3] },
    { id: 'weather',name: 'Метеостанция',   icon: '⛅', topic: 'Погода',              lesson: 'weather-1', box: [29.8, 1.3, 15, 18.6] }
  ];
  const HERO = { asya: 'img/asya_full.png', tim: 'img/tim_full.png' };
  const ROBIK = { cold: 'img/robik_cold.png', wait: 'img/robik_think.png', neutral: 'img/robik_think.png', warm: 'img/robik_warm.png',
                  happy: 'img/robik_happy.png', loud: 'img/robik_ears.png', shh: 'img/robik_sneak.png', bright: 'img/robik_happy.png' };
  const STEP_ICON = { intro: '🎬', guess: '🤔', measure: '📏', compare: '🏆', game: '🎮', sticker: '📒', lab: '🔬' };
  const houseName = lessonId => { const x = HOUSES.find(h => h.lesson === lessonId); return x ? x.name : ''; };
  const fmtV = (v, L) => v === null || v === undefined ? '—' : Math.round(v) + (L && L.channel === 't' ? '°' : '');
  // прибор на экране детей: термометр для тепла, столбик-индикатор для звука, света и влажности
  function gauge(L, meter) {
    const lit = L.channel === 'light', wet = L.channel === 'rh';
    return meter
      ? `<div class="vu ${lit ? 'lux' : wet ? 'wet' : ''}"><div class="vu-bars" id="vubars">${Array.from({ length: 14 }, (_, k) => `<i style="--k:${k}"></i>`).join('')}</div><div class="vu-val"><b id="tval"></b><small>${lit ? '☀️' : wet ? '💧 %' : 'дБ'}</small></div></div>`
      : `<div class="thermo"><div class="tube"><div class="fill" id="tfill"></div><div class="shine"></div>
          ${[20, 25, 30, 35].map(t => `<i class="tick" style="bottom:${(t - 15) / 25 * 100}%"></i>`).join('')}</div>
          <div class="bulb" id="tbulb"></div><div class="tval" id="tval"></div></div>`;
  }
  // декорации каждого занятия: фоны, точки на фонах (в % сцены), окружение
  const SCENES = {
    'heat-1': {
      intro:   { bg: 'img/bg_snow.jpg', robik: [52, 79], mood: 'cold', emit: [{ type: 'snow', rate: 22 }] },
      guess:   { bg: 'img/bg_guess.jpg', heroes: { asya: [17, 75], tim: [83, 75] }, robik: [50, 86],
                 emit: [{ type: 'embers', x: 50, y: 63, w: 5, rate: 9 }, { type: 'dust', x0: 2, x1: 18, y0: 20, y1: 55, rate: 3 }] },
      measure: { bg: 'img/bg_measure.jpg', robik: [47, 72], target: [77, 70], targetSize: 13,
                 emit: [{ type: 'dust', x0: 70, x1: 98, y0: 5, y1: 60, rate: 5 }] },
      game:    { bg: 'img/bg_snow.jpg', robik: [52, 79], emit: [{ type: 'snow', rate: 18 }] }
    },
    'sound-1': {
      intro:   { bg: 'img/bg_owl_room.jpg', robik: [50, 88], mood: 'shh', owls: true, night: true,
                 emit: [{ type: 'zzz', x: 18, y: 30, rate: 0.6 }, { type: 'zzz', x: 86, y: 12, rate: 0.5 }, { type: 'fireflies', x0: 42, x1: 66, y0: 8, y1: 40, rate: 1 }] },
      guess:   { bg: 'img/bg_tower.jpg', heroes: { asya: [17.4, 80], tim: [82.6, 80] }, robik: [50, 88],
                 emit: [{ type: 'dust', x0: 14, x1: 26, y0: 30, y1: 60, rate: 2 }, { type: 'dust', x0: 74, x1: 86, y0: 30, y1: 60, rate: 2 }] },
      measure: { bg: 'img/bg_sound_lab.jpg', robik: [47, 63], source: [77.3, 47], meter: true,
                 emit: [{ type: 'rings', x: 77.3, y: 47, level: () => Math.max(0, Math.min(1, (Snr.value - 40) / 40)) }, { type: 'dust', x0: 60, x1: 75, y0: 8, y1: 40, rate: 3 }] },
      game:    { bg: 'img/bg_owl_room.jpg', owls: true, night: true,
                 emit: [{ type: 'zzz', x: 18, y: 30, rate: 0.6 }, { type: 'zzz', x: 86, y: 12, rate: 0.5 }, { type: 'fireflies', x0: 42, x1: 66, y0: 8, y1: 40, rate: 1 }] }
    }
  };
  SCENES['light-1'] = {
    intro:   { bg: 'img/bg_sea_night.jpg', robik: [52, 86], mood: 'wait', night: true, fog: true,
               emit: [{ type: 'dust', x0: 0, x1: 100, y0: 15, y1: 75, rate: 4, color: '210,225,255' }] },
    guess:   { bg: 'img/bg_lighthouse_room.jpg', heroes: { asya: [14, 70], tim: [81, 70] }, robik: [50, 90],
               emit: [{ type: 'dust', x0: 30, x1: 70, y0: 10, y1: 60, rate: 3, color: '255,240,200' }] },
    measure: { bg: 'img/bg_light_lab.jpg', robik: [36, 72], source: [58.5, 28], blocker: [49, 41], meter: true, beam: true, condsRight: true,
               emit: [{ type: 'dust', x0: 38, x1: 58, y0: 25, y1: 55, rate: 3, color: '255,245,200' }] },
    game:    { bg: 'img/bg_harbor.jpg', night: true, lamp: [6.4, 17], boatY: 64 }
  };
  SCENES['weather-1'] = {
    intro:   { bg: 'img/bg_meteo_hill.jpg', robik: [52, 86], mood: 'warm',
               emit: [{ type: 'dust', x0: 20, x1: 90, y0: 20, y1: 70, rate: 3, color: '255,250,210' }] },
    guess:   { bg: 'img/bg_meteo_room.jpg', heroes: { asya: [12.5, 72], tim: [87, 72] }, robik: [50, 90],
               emit: [{ type: 'dust', x0: 30, x1: 70, y0: 10, y1: 60, rate: 3, color: '255,250,220' }] },
    measure: { bg: 'img/bg_meteo_lab.jpg', robik: [30, 74], meter: true, condsRight: true,
               emit: [{ type: 'dust', x0: 30, x1: 70, y0: 20, y1: 60, rate: 2, color: '220,240,255' }] },
    game:    { bg: 'img/bg_garden.jpg', robik: [9, 95], cloud: [50, 36], bed: [21, 72], bedY: 79 }
  };
  // ячейки альбома на фоне bg_sticker (центр круга, % сцены)
  const SLOTS = [[19.9, 27.2], [30.5, 27.2], [41.1, 27.2], [19.9, 46.4], [30.5, 46.4], [41.1, 46.4], [19.9, 65.6], [30.5, 65.6], [41.1, 65.6]];
  const moodOf = eyes => ({ blue: 'cold', warm: 'warm', happy: 'happy', wait: 'wait', loud: 'loud', bright: 'bright' }[eyes] || 'neutral');
  // спрайты из Codex (img/codex): подставляются, только если файл есть
  const CODEX = {}; ['owlet_half', 'owlet_awake', 'howto_cup', 'howto_probe', 'howto_spot', 'howto_pass', 'why_hand', 'why_soft'].forEach(n => { const i = new Image(); i.onload = () => { CODEX['img/codex/' + n + '.png'] = true; stageKey = ''; /* перерисовать экран с новой картинкой */ }; i.src = 'img/codex/' + n + '.png'; });
  const has = src => !!(src && CODEX[src]);
  // карта без нарисованных героев (Codex): тогда по ней гуляют живые Ася, Тим и Робик
  let mapEmpty = false; { const i = new Image(); i.onload = () => { mapEmpty = true; if (E.state && E.state.screen === 'map') { stageKey = ''; renderStage(E.state, E.lesson); } }; i.src = 'img/map_empty.jpg'; }
  // точки прогулки, % сцены: площадь в центре и выходы на дорожки к домикам
  const PLAZA = [[40, 56], [44, 58.5], [49, 59], [54, 58], [58, 56], [47, 54], [52, 54.5]];
  const TRAILS = [[33, 61], [30, 47], [64, 52], [63, 41], [49, 40], [31, 68], [60, 66]];
  const mapPersp = y => Math.max(0.62, Math.min(1.08, 0.62 + (y - 38) / 22 * 0.4));
  let mapTimer = null;
  function mapLife() {
    clearInterval(mapTimer);
    const heroes = ['asya', 'tim'].map(n => W.actor(n)).filter(Boolean), rob = W.actor('robik');
    [...heroes, rob].forEach(a => { if (a) a.persp = mapPersp; });
    // точка подальше от другого героя (его цели или места), чтобы ребята не сливались в одного
    const other = a => heroes.find(h => h !== a);
    const spot = (a, list) => { const o = other(a), ox = o ? (o.wx !== undefined ? o.wx : o.x) : -99; let p;
      for (let k = 0; k < 8; k++) { p = list[Math.floor(Math.random() * list.length)]; if (Math.abs(p[0] - ox) > 8) break; } return p; };
    const pick = (a) => { const far = Math.random() < 0.3, p = spot(a, far ? TRAILS : PLAZA);
      a.walkTo(p[0] + (Math.random() - 0.5) * 2, 9 + Math.random() * 3, p[1]); a.away = far; };
    mapTimer = setInterval(() => {
      const S = E.state; if (!S || S.screen !== 'map') { clearInterval(mapTimer); return; }
      heroes.forEach(a => {
        if (a.wx !== undefined) return;                       // ещё идёт
        if (a.away) { const p = spot(a, PLAZA); a.walkTo(p[0], 10, p[1]); a.away = false; return; }
        const o = other(a); if (o && o.wx === undefined && Math.abs(o.x - a.x) < 6 && Math.abs(o.y - a.y) < 5) { pick(a); return; }   // стоят вплотную — разойтись   // сходил к домику — вернулся
        const r = Math.random();
        if (r < 0.22) pick(a); else if (r < 0.3) a.gesture('wave', 1.6); else if (r < 0.34) { a.hop(0.7); a.gesture('cheer', 1.2); }
        else if (r < 0.37) a.gesture('point', 2, { side: a.x < 50 ? 'R' : 'L' });
      });
      // Робик летает за тем, кто ушёл дальше всех от центра, иначе — между ребятами
      // Робик летает рядом с ребятами, но не за ними: сбоку от пары и чуть ближе к зрителю
      if (rob && heroes.length) { const lead = heroes.find(a => a.away);
        const xs = heroes.map(a => a.x), my = Math.max(...heroes.map(a => a.y));
        let tx, ty;
        if (lead) { tx = lead.x + (lead.x < 49 ? 6 : -6); ty = lead.y + 1.5; }
        else { const lo = Math.min(...xs), hi = Math.max(...xs); tx = hi - lo > 14 ? (lo + hi) / 2 : (Math.abs(lo - 6 - 49) < Math.abs(hi + 6 - 49) ? lo - 6 : hi + 6); ty = my + 1.5; }
        rob.goto(Math.max(30, Math.min(68, tx)), ty); }
    }, 700);
  }
  const howto = (src, cls = '') => has(src) ? `<div class="howto ${cls}"><img src="${src}" alt=""></div>` : '';
  Object.values(ROBIK).concat(Object.values(HERO), ['img/owlet.png', 'img/owl_parents.png', 'img/bg_snow.jpg']).forEach(src => { const i = new Image(); i.src = src; });

  // ---------- кусочки разметки ----------
  // настроение Робика по его прежней картинке (для скелетного Робика картинка не нужна)
  const MOOD_OF = { 'img/robik_cold.png': 'cold', 'img/robik_think.png': 'wait', 'img/robik_warm.png': 'warm', 'img/robik_happy.png': 'happy', 'img/robik_ears.png': 'loud', 'img/robik_sneak.png': 'shh' };
  const RIG_H = { robik: 1.04, asya: 1.02, tim: 1.02 };   // поправка высоты: у рига другие поля, чем у картинки
  function look(a, src, mood) { if (!a) return; if (a.rig) a.rig.mood = mood || MOOD_OF[src] || 'neutral'; else if (!a.el.src.endsWith(src.slice(3))) a.el.src = src; }
  const actor = (name, src, x, y, h, mode = 'stand', extra = '') => (RL.Rig && RL.Rig.has(name))
    ? `<canvas class="actor rig a-${name}" data-actor="${name}" data-rig="${name}" data-mood="${MOOD_OF[src] || 'neutral'}" data-mode="${mode}" data-x="${x}" data-y="${y}" style="height:${h * RIG_H[name]}cqw" ${extra}></canvas>`
    :
    `<img class="actor a-${name}" data-actor="${name}" data-mode="${mode}" data-x="${x}" data-y="${y}" src="${src}" style="height:${h}cqw" alt="" draggable="false" ${extra}>`;
  // совы: если есть скелеты — головы и глаза живые, а фон комнаты без нарисованных сов (иначе было бы двоение)
  const owlRig = () => RL.Rig && RL.Rig.has('owl_parents') && RL.Rig.has('owlet_sleep');
  const owls = () => owlRig()
    ? `<canvas class="actor rig a-parents" data-actor="parents" data-rig="owl_parents" data-mode="stand" data-x="16.19" data-y="44.55" data-breathe="0" data-depth="0" style="height:11.97cqw"></canvas>`
      + `<canvas class="actor rig a-owlet" data-actor="owlet" data-rig="owlet_sleep" data-mode="stand" data-x="85.6" data-y="27.8" data-breathe="2.6" data-depth="0" style="height:11.25cqw"></canvas>`
    : actor('parents', 'img/owl_parents.png', 15.94, 47.8, 14.4, 'stand', 'data-breathe="2.2" data-depth="0"') +
      actor('owlet', 'img/owlet.png', 85.6, 27.8, 11.25, 'stand', 'data-breathe="2.6" data-depth="0"');
  const owlBg = src => owlRig() && src === 'img/bg_owl_room.jpg' ? 'img/bg_owl_room_empty.jpg' : src;
  function hud(S, L) {
    const path = L ? `<div class="path">${L.steps.map((x, k) =>
      `<span class="node ${k < S.i ? 'done' : k === S.i ? 'cur' : ''}">${k < S.i ? '✔' : STEP_ICON[x.type] || '•'}</span>`).join('<b class="link"></b>')}</div>` : '';
    return `<div class="hud">
      <button class="gbtn home" id="home" title="Выход на карту — удерживайте 1,5 с">🏠<span class="ring-prog"></span></button>
      <button class="gbtn" id="repeat" title="Повтори">🔊</button>
      ${path}
      <div class="starbox" id="starbox"><span class="st">⭐</span><b id="starcount">${shownStars}</b></div>
    </div>`;
  }
  const say = (text, cls = '') => `<div class="say ${cls}"><img src="img/robik_think.png" alt=""><span id="saytext">${text}</span></div>`;
  // «Дальше» на экране детей — только в режиме доски и только долгим нажатием
  const holdBtn = (id, icon, cls = '') => board ? `<button class="gbtn big next ${cls}" id="${id}" title="Удерживайте 1 с">${icon}<span class="ring-prog"></span></button>` : '';
  const short = (st, k = 'say') => (st && (st.short || st[k])) || '';
  const world = '<canvas class="world"></canvas>';

  // ---------- детский экран ----------
  let stageKey = '', prev = {};
  function renderStage(S, L) {
    const st = L && S.i >= 0 ? L.steps[S.i] : null;
    const key = JSON.stringify([S && S.screen, L && L.id, S && S.i, S && S.cond, S && S.results, S && S.winner,
      S && S.game && [S.game.round, S.game.rounds, S.game.between, S.game.won, S.game.done], S && S.paused,
      S && S.lab && S.lab.marks.map(m => m.n)]);
    if (key === stageKey) return; stageKey = key;
    const scr = S ? S.screen : 'map';
    const sc = (L && SCENES[L.id] && SCENES[L.id][scr]) || {};
    const keep = prev.screen === scr && prev.lesson === (L && L.id);   // тот же экран — сохранить физику актёров
    let h = '', emit = sc.emit || [], floor = 92;

    if (scr === 'map') {
      const album = RL.Journal.album();
      const total = Object.values(album).reduce((a, b) => a + b, 0);
      const live = mapEmpty && RL.Rig && RL.Rig.has('asya');
      h = `<div class="scr"><div class="bg" style="background-image:url(${live ? 'img/map_empty.jpg' : 'img/map.jpg'})"></div>
        ${live ? actor('asya', HERO.asya, 43.5, 57, 15.5, 'stand') + actor('tim', HERO.tim, 55, 57.5, 15.5, 'stand') + actor('robik', ROBIK.happy, 49, 53, 7.5, 'hover') : ''}${world}
        ${HOUSES.map(x => { const [l, t, w, hh] = x.box; const locked = !x.lesson;
          return `<button class="house ${locked ? 'locked' : 'today'}" data-house="${x.id}" style="left:${l}%;top:${t}%;width:${w}%;height:${hh}%">
            ${locked ? '<span class="lock">🔒</span>' : `<span class="arrow">▼</span><span class="labchip" data-lab="${x.lesson}" title="Лаборатория: мерить что угодно">🔬</span>`}
            <span class="lbl">${x.icon} ${x.name}${album[x.id] ? ' · ' + album[x.id] + '⭐' : ''}</span></button>`; }).join('')}
        <div class="title-sign">Городок Почему</div>
        <div class="hud"><button class="gbtn" id="repeat">🔊</button><span class="spacer"></span>
          <div class="pillbox">👦👧 «Солнышко»</div><div class="starbox"><span class="st">📒</span><b>${total}</b></div></div>
        <div class="say map-say"><img src="img/robik_happy.png" alt=""><span>Куда пойдём сегодня?</span></div></div>`;
      emit = [{ type: 'dust', x0: 36, x1: 64, y0: 25, y1: 60, rate: 4, color: '255,250,210' }];
    }
    else if (scr === 'intro') {
      h = `<div class="scr ${sc.night ? 'night' : ''}"><div class="bg" style="background-image:url(${owlBg(sc.bg)})"></div>
        ${sc.owls ? owls() : ''}
        ${sc.mood === 'cold' ? '<div class="floe-ice"></div>' : ''}
        ${actor('robik', ROBIK[sc.mood], sc.robik[0], sc.robik[1], 22, 'hover')}
        ${world}${hud(S, L)}${say(short(st), sc.mood === 'cold' ? 'cold' : '')}${holdBtn('next', '▶')}</div>`;
    }
    else if (scr === 'guess') {
      const n = st.options.length;
      h = `<div class="scr"><div class="bg" style="background-image:url(${sc.bg})"></div>
        ${Object.entries(sc.heroes).map(([who, [x, y]]) => { const o = st.options.find(z => z.who === who);
          return actor(who, HERO[who], x, y, 31, 'stand', `data-vote="${o ? o.key : ''}" data-flip="${who === 'tim' ? 0 : 0}"`); }).join('')}
        ${actor('robik', ROBIK.wait, sc.robik[0], sc.robik[1], 11, 'hover')}
        ${world}${hud(S, L)}${say(short(st))}
        <div class="choices n${n} ${board ? '' : 'passive'}">${st.options.map(o => `<button class="choice" data-vote="${o.key}">
            ${o.who ? `<span class="who" style="background-image:url(${o.who === 'asya' ? 'img/asya.jpg' : 'img/tim.jpg'})"></span>` : ''}
            <span class="cico">${o.icon}</span><span class="clbl">${o.label}</span>
            <span class="votes" data-votes="${o.key}"></span>
            <span class="meter"><span data-meter="${o.key}"></span></span></button>`).join('')}</div>
        ${holdBtn('next', '▶')}</div>`;
      floor = 90;
    }
    else if (scr === 'measure') {
      const c = st.conditions[S.cond];
      const target = c.key === 'water' && sc.target ? `<div class="target-ring" style="left:${sc.target[0]}%;top:${sc.target[1]}%;width:${sc.targetSize}cqw;height:${sc.targetSize}cqw"></div>` : '';
      const hands = has(c.howto) ? howto(c.howto, sc.meter ? 'r' : '') : c.key === 'hand' ? '<div class="hands">🤲</div>' : '';
      // луч фонарика к Робику: яркость луча = показание датчика; посередине — преграда, которую сейчас ставят
      const beam = sc.beam ? `<svg class="lbeam" id="lbeam" viewBox="0 0 100 56.25" preserveAspectRatio="none"><defs><linearGradient id="lbg" x1="1" x2="0"><stop offset="0" stop-color="#fff6c8" stop-opacity=".95"/><stop offset="1" stop-color="#ffe680" stop-opacity=".15"/></linearGradient></defs>
          <polygon points="${sc.source[0]},${sc.source[1] * 0.5625 - 1.2} ${sc.robik[0] + 4},${sc.robik[1] * 0.5625 - 22} ${sc.robik[0] + 4},${sc.robik[1] * 0.5625 - 2} ${sc.source[0]},${sc.source[1] * 0.5625 + 1.2}" fill="url(#lbg)"/></svg>
          ${c.key !== 'open' ? `<div class="blocker" style="left:${sc.blocker[0]}%;top:${sc.blocker[1]}%">${c.icon}</div>` : ''}` : '';
      h = `<div class="scr"><div class="bg" style="background-image:url(${sc.bg})"></div>${beam}
        ${target}<div class="holdring" id="holdring"><svg viewBox="0 0 100 100"><circle class="trk" cx="50" cy="50" r="44"/><circle class="prog" id="holdprog" cx="50" cy="50" r="44" pathLength="100"/></svg></div>
        ${actor('robik', ROBIK[moodOf(device.eyes)], sc.robik[0], sc.robik[1], 22, 'hover')}${hands}
        ${world}${hud(S, L)}${say(S.reaction || c.short || c.say)}${gauge(L, sc.meter)}
        <div class="conds ${sc.meter && !sc.condsRight ? 'left' : ''}">${st.conditions.map((x, k) => { const r = S.results[x.key];
          return `<div class="cond ${k === S.cond && r === undefined ? 'now' : ''} ${r !== undefined ? 'done' : ''} ${x.baseline ? 'base' : ''}"><span class="ci">${x.icon}</span><span>${x.label}</span><b>${r !== undefined ? Math.round(r) + (L.channel === 't' ? '°' : '') : '?'}</b>${r !== undefined ? '<span class="check">✔</span>' : ''}</div>`; }).join('')}</div>
        <div class="chartbox ${sc.meter ? 'snd' : ''}"><canvas class="chart" id="chart"></canvas></div>${holdBtn('next', '▶')}</div>`;
    }
    else if (scr === 'lab') {
      // свободная лаборатория: прибор, график, рекорды и ряд находок
      const ms = SCENES[L.base].measure, lab = S.lab, show = lab.marks.slice(-5);
      h = `<div class="scr"><div class="bg" style="background-image:url(${ms.bg})"></div>
        ${actor('robik', ROBIK[moodOf(device.eyes)], ms.robik[0], ms.robik[1], 22, 'hover')}
        ${world}${hud(S, L)}${say(S.reaction || 'Мерьте что хотите — я покажу! 🔬')}${gauge(L, ms.meter)}
        <div class="conds lab">
          <div class="cond rec"><span class="ci">🏔️</span><span>Больше всего</span><b id="recmax">${fmtV(lab.max, L)}</b></div>
          <div class="cond rec lo"><span class="ci">🕳️</span><span>Меньше всего</span><b id="recmin">${fmtV(lab.min, L)}</b></div>
          ${show.map((m, k) => `<div class="cond done pin ${k === show.length - 1 && prev.marks !== lab.count ? 'fresh' : ''}"><span class="ci">📌</span><span class="pl">${m.label}</span><b>${fmtV(m.v, L)}</b></div>`).join('')}
          ${show.length ? '' : '<div class="cond hintc"><span class="ci">📌</span><span>Находки появятся здесь</span></div>'}
        </div>
        <div class="chartbox ${ms.meter ? 'snd' : ''}"><canvas class="chart" id="chart"></canvas></div>
        ${board ? '<button class="gbtn big next pinbtn" id="pin" title="Запомнить показание">📌</button>' : ''}</div>`;
    }
    else if (scr === 'compare') {
      const m = L.steps.find(x => x.type === 'measure'), g = L.steps.find(x => x.type === 'guess');
      const conds = m.conditions, n = conds.length;
      const vals = conds.map(c => S.results[c.key] ?? 0);
      const max = Math.max(L.channel === 'sound' ? 80 : L.channel === 'light' || L.channel === 'rh' ? 100 : 40, ...vals);
      const X = n === 2 ? [30, 70] : n === 3 ? [30, 50, 70] : [28, 42.7, 57.3, 72];
      const winOpt = g.options.find(o => o.key === S.winner);
      h = `<div class="scr"><div class="bg" style="background-image:url(img/bg_compare.jpg)"></div>
        ${actor('asya', HERO.asya, 11, 92, 27, 'stand')}${actor('tim', HERO.tim, 89, 92, 27, 'stand')}
        ${conds.map((c, k) => { const win = S.winner === c.key || (S.winner === 'tie' && !c.baseline);
          const snd = L.channel === 'sound';
          // для звука победитель — самый низкий столбик: над ним спит совёнок, а не корона
          const top = win ? (snd ? '<div class="crown owl"><img src="img/owlet.png" alt=""><span>z</span></div>' : '<div class="crown">👑</div>') : '';
          const lit = L.channel === 'light' || L.channel === 'rh', wet = L.channel === 'rh';
          const loud = wet ? `<span class="lvl">${vals[k] >= 70 ? '💧' : vals[k] >= 50 ? '🌥️' : '☀️'}</span>` : snd ? `<span class="lvl">${vals[k] >= 65 ? '🔊' : vals[k] >= 55 ? '🔉' : '🔈'}</span>` : lit ? `<span class="lvl">${vals[k] >= 70 ? '☀️' : vals[k] >= 30 ? '🌤️' : '🌑'}</span>` : '';
          return `<div class="podium n${n}" style="left:${X[k]}%">
            <div class="col ${snd ? 's' : wet ? 'r' : lit ? 'l' : k ? 'w' : 'h'} ${c.baseline ? 'base' : ''} ${win ? 'win' : ''}" data-h="${(vals[k] / max) * (n > 2 ? 19 : 17)}cqw">${top}${loud}<span class="num">${Math.round(vals[k])}${snd || lit ? '' : '°'}</span></div>
            <div class="pico">${c.icon}</div></div>`; }).join('')}
        ${actor('robik', ROBIK.happy, 50, 40, 12, 'hover')}
        ${world}${hud(S, L)}${say(S.winner === 'tie' ? (st.tieShort || st.tie) : ((st.winShort && st.winShort[S.winner]) || st.win[S.winner]))}
        ${L.channel === 'sound' ? '<div class="unitnote"><span>🔊 выше — громче</span><span>🤫 ниже — тише</span></div>' : L.channel === 'light' ? '<div class="unitnote"><span>☀️ выше — светлее</span><span>🌑 ниже — темнее</span></div>' : L.channel === 'rh' ? '<div class="unitnote"><span>💧 выше — влажнее</span><span>☀️ ниже — суше</span></div>' : ''}${holdBtn('next', '▶')}</div>`;
      floor = 88;
      prev.compareX = X; prev.compareWin = conds.findIndex(c => c.key === S.winner); prev.compareWho = winOpt && winOpt.who;
    }
    else if (scr === 'game' && S.game.kind === 'cloud') {
      const g = S.game, n = g.rounds;
      const xs = Array.from({ length: n }, (_, k) => n === 1 ? (sc.bed[0] + sc.bed[1]) / 2 : sc.bed[0] + (sc.bed[1] - sc.bed[0]) * k / (n - 1));
      h = `<div class="scr"><div class="bg" style="background-image:url(${sc.bg})"></div>
        <img class="cloud" id="cloud" src="img/cloud.png" style="left:${sc.cloud[0]}%;top:${sc.cloud[1]}%" alt="">
        ${xs.map((x, k) => k < g.won ? `<img class="flower ${k === g.won - 1 && g.between ? 'grow' : ''}" src="img/flower.png" style="left:${x}%;top:${sc.bedY}%" alt="">` : `<span class="sprout" style="left:${x}%;top:${sc.bedY}%">🥀</span>`).join('')}
        ${actor('robik', ROBIK.warm, sc.robik[0], sc.robik[1], 15, 'hover')}
        ${world}${hud(S, L)}
        ${say(g.between ? (g.won >= g.rounds ? 'Все цветы расцвели! 🌼' : '🌧️ Дождик! Передай Робика') : 'Тур ' + g.round + ' из ' + g.rounds + ' 🌬️ Дышите на меня!')}
        ${g.between && g.won < g.rounds ? howto('img/codex/howto_pass.png', 'g') : ''}
        <div class="power"><span>☁️</span><div class="pbar"><div id="pbar"></div></div></div>
        ${holdBtn('next', '▶')}</div>`;
      floor = 92; prev.bedXs = xs;
    }
    else if (scr === 'game' && S.game.kind === 'beam') {
      const g = S.game;
      h = `<div class="scr night"><div class="bg" style="background-image:url(${sc.bg})"></div>
        <div class="lamp" id="lamp" style="left:${sc.lamp[0]}%;top:${sc.lamp[1]}%"><div class="ray"></div><div class="glowc"></div></div>
        <img class="actor" data-actor="boat" data-mode="hover" data-x="24" data-y="${sc.boatY}" data-k="6" data-c="4" data-depth="0.2" src="img/boat.png" style="height:9cqw" alt="">
        ${actor('robik', ROBIK.happy, 22, 96, 13, 'hover')}
        ${world}${hud(S, L)}
        ${say(g.done ? 'Кораблик в гавани! 🎉' : 'Мигайте фонариком! 🔦')}
        <div class="flashes" id="flashes">${Array.from({ length: g.need }, (_, k) => `<i class="${k < g.flashes ? 'on' : ''}"></i>`).join('')}</div>
        <div class="trail"><div class="tr-fill" id="trail"></div><span class="tr-r">⛵</span><span class="tr-c">🏠</span></div>
        ${holdBtn('next', '▶')}</div>`;
      floor = 95;
    }
    else if (scr === 'game' && S.game.kind === 'owl') {
      const g = S.game;
      h = `<div class="scr night"><div class="bg" style="background-image:url(${owlBg(sc.bg)})"></div>${owls()}
        <div class="cookie-goal">🍪</div>
        ${actor('robik', ROBIK.shh, 20, 88, 17, 'walk')}
        ${world}${hud(S, L)}
        ${say(g.done ? 'Ура, печенье!' : g.awake ? 'Ой! Совёнок проснулся…' : 'Тихо — я иду. Шумно — стою.')}
        <div class="gauge"><div class="arc"></div><div class="needle" id="needle"></div><div class="glab">🤫</div><div class="grab">📣</div></div>
        <div class="trail"><div class="tr-fill" id="trail"></div><span class="tr-r">🤖</span><span class="tr-c">🍪</span></div>
        ${holdBtn('next', '▶')}</div>`;
      floor = 95;
    }
    else if (scr === 'game') {
      const g = S.game;
      h = `<div class="scr"><div class="bg" style="background-image:url(${sc.bg})"></div><div class="glow" id="glow"></div>
        ${actor('robik', ROBIK.cold, sc.robik[0], sc.robik[1], 22, 'hover')}
        <div class="ice" id="ice"><span class="crack"></span></div>
        <div class="thermo game"><div class="tube"><div class="fill" id="gfill"></div><div class="shine"></div></div><div class="bulb"></div></div>
        ${world}${hud(S, L)}
        <div class="rounds">${Array.from({ length: g.rounds }, (_, k) => `<span class="${k < g.won ? 'melt' : k === g.won ? 'cur' : ''}">${k < g.won ? '💧' : '🧊'}</span>`).join('')}</div>
        ${say(g.between ? (g.won >= g.rounds ? 'Весь лёд растаял! 🎉' : '💧 Растаяла! Передай Робика двумя руками') : 'Тур ' + g.round + ' из ' + g.rounds + ' 🔥 Грейте меня!')}
        ${g.between && g.won < g.rounds ? howto('img/codex/howto_pass.png') : ''}
        <div class="power"><span>🔥</span><div class="pbar"><div id="pbar"></div></div></div>
        ${holdBtn('next', '▶')}</div>`;
      floor = 86;
    }
    else if (scr === 'sticker') {
      const n = Math.min(RL.Journal.album()[L.house] || 1, SLOTS.length);
      const img = (L.sticker && L.sticker.img) || 'img/sticker_fire.png';
      h = `<div class="scr"><div class="bg" style="background-image:url(img/bg_sticker.jpg)"></div>
        ${SLOTS.slice(0, n - 1).map(([x, y]) => `<img class="stk placed" src="${img}" style="left:${x}%;top:${y}%" alt="">`).join('')}
        <img class="stk fly" src="${img}" style="--tx:${SLOTS[n - 1][0]}%;--ty:${SLOTS[n - 1][1]}%" alt="">
        <div class="note"><div class="nt">Мы узнали!</div><div class="nb">${st.say.split('!')[0]}!</div>
          <div class="nc">${HOUSES.find(x => x.id === L.house).name}: наклейка <b>${n}</b> из 4</div></div>
        ${actor('robik', ROBIK.happy, 80, 92, 16, 'hover')}
        ${world}${hud(S, L)}
        ${holdBtn('tomap', '🗺️', 'home2')}</div>`;
      emit = [{ type: 'dust', x0: 10, x1: 90, y0: 10, y1: 90, rate: 4, color: '255,230,150' }];
    }
    if (S && S.paused) h += `<div class="pause"><div class="pbox">⏸<span>Пауза</span></div></div>`;
    h += `<div class="subs" id="subs">${RL.Voice.last || ''}</div>`;
    stage.innerHTML = h;
    stage.classList.toggle('nosubs', !subsOn);
    if (keep) stage.querySelectorAll('.say').forEach(s => s.classList.add('still'));
    W.attach(stage, { emitters: emit, floor, keep });
    RL.Amb.scene(L && L.lab ? ambience(RL.content[L.base], 'measure') : ambience(L, scr));
    // музыка: тема карты, тема домика на занятии, своя — в лаборатории, весёлая — в игре, торжественная — на наклейке
    RL.Music.play(!L ? 'map' : L.lab ? 'lab' : scr === 'game' ? 'game_' + L.house : scr === 'sticker' ? 'sticker' : scr === 'compare' ? 'discovery' : 'house_' + L.house);
    lastMood = ''; updateLive(true);
    requestAnimationFrame(() => stage.querySelectorAll('.col').forEach(b => b.style.height = b.dataset.h));
    effects(S, L, scr);
    prev = Object.assign(prev, { screen: scr, lesson: L && L.id, i: S && S.i, results: S && Object.keys(S.results || {}).length, won: S && S.game ? S.game.won : 0, marks: S && S.lab ? S.lab.count : 0 });
  }

  // фон сцены: какие петли звучат на каком экране
  function ambience(L, scr) {
    if (!L || scr === 'map') return { meadow: 1 };
    if (scr === 'sticker') return { meadow: 0.7 };
    if (L.id === 'heat-1') return scr === 'intro' || scr === 'game' ? { winter: 1 } : { fireplace: 1 };
    if (L.id === 'weather-1') return scr === 'intro' || scr === 'game' ? { meadow: 1 } : { meadow: 0.5 };
    if (L.id === 'light-1') return scr === 'intro' ? { winter: 0.6, night: 0.5 } : scr === 'game' ? { night: 1 } : { fireplace: 0.8 };
    return scr === 'intro' || scr === 'game' ? { night: 1 } : { tower: 1 };
  }

  // события сцены: физика и звук
  function effects(S, L, scr) {
    if (!S) return;
    const enter = prev.screen !== scr || prev.i !== S.i;
    if (prev.screen !== scr) Sfx.whoosh();
    if (scr === 'map') mapLife();   /* новые актёры после перерисовки — снова в прогулку */
    const rob = W.actor('robik');
    if (enter && rob && scr === 'intro') { rob.x = -12; const k = rob.k, c = rob.c; rob.k = 4; rob.c = 4; rob.goto(rob.home.x, rob.home.y); setTimeout(() => { rob.k = k; rob.c = c; }, 4500); }   // Робик сам приходит в кадр под рассказ
    else if (enter && rob) { rob.y -= 18; rob.vy = 20; }                             // Робик «влетает» в кадр
    // Ася и Тим приходят на экран пешком: из-за края к своему месту, потом машут
    if ((scr === 'guess' || scr === 'compare') && enter) ['asya', 'tim'].forEach((w, k) => { const a = W.actor(w); if (!a || !a.rig) return;
      const home = a.x; a.x = home + (w === 'asya' ? -22 : 22); a.walkTo(home, 15);
      if (scr === 'guess') setTimeout(() => a.gesture('wave', 1.6), 1300 + k * 200); });
    const nres = Object.keys(S.results || {}).length;
    if (scr === 'measure' && nres > (prev.results || 0) && prev.screen === 'measure') { Sfx.success(); W.burst(16, 30, ['⭐', '✨', '🌟'], 14); rob && rob.hop(1); }
    if (scr === 'lab' && S.lab.count > (prev.marks || 0) && prev.screen === 'lab') { Sfx.success(); W.burst(86, 40, ['📌', '✨', '⭐'], 12); if (rob) { rob.hop(1); rob.gesture('nod', 1.2); } }
    if (scr === 'compare' && enter) {
      const cst = L.steps[S.i], why = cst.why && cst.why[S.winner];
      if (why) setTimeout(() => {
        const sy = stage.querySelector('.say'); if (!sy || E.state.screen !== 'compare') return;
        sy.classList.add('why'); sy.innerHTML = (has(why.img) ? `<img class="whyimg" src="${why.img}" alt="">` : '<img src="img/robik_think.png" alt="">') + `<span>${why.text}</span>`;
        Sfx.pop();
      }, 6500);
      setTimeout(() => {
        Sfx.fanfare(); W.confetti();
        const r = W.actor('robik'); const k = prev.compareWin;
        if (r && k >= 0) r.goto(prev.compareX[k] + 5.5, 99);
        const hero = prev.compareWho && W.actor(prev.compareWho);
        const other = prev.compareWho && W.actor(prev.compareWho === 'asya' ? 'tim' : 'asya'); if (other) other.gesture('clap', 3);
        if (!hero) ['asya', 'tim'].forEach(w => W.actor(w) && W.actor(w).gesture('cheer', 2.5));
        if (hero) { hero.gesture('cheer', 3.4); RL.Voice.append(prev.compareWho === 'asya' ? 'Ура! Я была права!' : 'Ура! Я угадал!', prev.compareWho); let n = 0; const id = setInterval(() => { hero.hop(1.2); if (++n > 4) clearInterval(id); }, 650); }
      }, 1200);
    }
    if (scr === 'game' && S.game && S.game.won > (prev.won || 0) && S.game.kind === 'cloud') {
      const sc = SCENES['weather-1'].game, x = prev.bedXs ? prev.bedXs[S.game.won - 1] : 50;
      Sfx.chime(); for (let k = 0; k < 6; k++) setTimeout(() => W.drops(x - 6 + Math.random() * 12, sc.cloud[1] + 8, 10), k * 180);
      setTimeout(() => W.burst(x, sc.bedY - 6, ['🌼', '✨', '⭐'], 10, 10), 900); rob && rob.hop(1.2); rob && rob.gesture('cheer', 1.6);
    }
    if (scr === 'game' && S.game && S.game.won > (prev.won || 0) && S.game.kind === 'ice') { Sfx.melt(); RL.Amb.sfx('ice', 0.8); W.shards(53, 62, 14); W.drops(53, 70, 14); rob && rob.hop(1.4); }
    if (scr === 'game' && S.game && S.game.kind === 'owl' && S.game.done && !prev.owlDone) { Sfx.fanfare(); W.burst(85, 70, ['🍪', '⭐', '✨'], 16); }
    prev.owlDone = scr === 'game' && S.game && S.game.done;
    if (scr === 'sticker' && enter) { setTimeout(() => { Sfx.chime(); W.confetti(70); const r = W.actor('robik'); if (r) { r.hop(1.3); r.gesture('cheer', 2.5); } }, 1300); }
  }

  // ---------- живые элементы ----------
  let lastMood = '', lastAwake = false, lastFlashes = 0, lastRec = 0;
  function updateLive(force) {
    const S = E.state, L = E.lesson, v = Snr.value;
    const tf = $('#tfill'); if (tf) { const p = Math.max(3, Math.min(100, (v - 15) / 25 * 100)); tf.style.height = p + '%'; const cold = v < 26; tf.classList.toggle('coldf', cold); const b = $('#tbulb'); if (b) b.classList.toggle('coldf', cold); }
    const tv = $('#tval'); if (tv) tv.textContent = Math.round(v) + (L && L.channel === 't' ? '°' : '');
    const vb = $('#vubars'); if (vb) { const on = Math.round(Math.max(0, Math.min(1, L && L.channel === 'rh' ? (v - 30) / 65 : L && L.channel === 'light' ? v / 100 : (v - 30) / 55)) * 14); vb.querySelectorAll('i').forEach((el, k) => el.classList.toggle('on', k < on)); }
    // Робик меняет спрайт по настроению; громко — подскакивает
    const rob = W.actor('robik');
    if (S && S.screen === 'lab' && S.lab) {
      const lab = S.lab, a = $('#recmax'), b = $('#recmin');
      if (a) a.textContent = fmtV(lab.max, L); if (b) b.textContent = fmtV(lab.min, L);
      if (lab.rec && lab.rec.at !== lastRec) {   // новый рекорд: вспышка у своей строки
        lastRec = lab.rec.at; const el = lab.rec.kind === 'max' ? a : b;
        if (el) { const row = el.parentElement; row.classList.remove('flash'); void row.offsetWidth; row.classList.add('flash'); }
        Sfx.chime(); W.burst(86, lab.rec.kind === 'max' ? 20 : 30, lab.rec.kind === 'max' ? ['⬆️', '✨'] : ['⬇️', '✨'], 6, 10);
      }
      const sy = $('#saytext'); if (sy && S.reaction && sy.textContent !== S.reaction) sy.textContent = S.reaction;
    }
    if (rob && S && (S.screen === 'measure' || S.screen === 'lab')) {
      const mood = moodOf(device.eyes);
      if (mood !== lastMood) { look(rob, ROBIK[mood], mood); if (lastMood) rob.poke(0, mood === 'loud' ? -40 : -15); lastMood = mood; }
      rob.shiver = mood === 'cold' ? 0.6 : mood === 'loud' ? 0.9 : 0;
    }
    if (rob && S && S.screen === 'intro') rob.shiver = moodOf(device.eyes) === 'cold' || (L && L.id === 'heat-1') ? 0.5 : 0;
    // голоса: звёзды над карточками
    if (S && S.screen === 'guess') {
      const total = Object.values(S.votes).reduce((a, b) => a + b, 0);
      document.querySelectorAll('[data-votes]').forEach(el => { const n = S.votes[el.dataset.votes] || 0; if (+el.dataset.n !== n) { el.dataset.n = n; el.innerHTML = n ? '<i>⭐</i>'.repeat(n) : '<em>нет голосов</em>'; } });
      document.querySelectorAll('[data-meter]').forEach(el => el.style.width = (total ? (S.votes[el.dataset.meter] || 0) / total * 100 : 0) + '%');
    }
    const re = $('#saytext'); if (re && S && S.screen === 'measure' && S.reaction && re.textContent !== S.reaction) re.textContent = S.reaction;
    // кольцо удержания вокруг Робика: заполняется, пока показание ровное
    const hr = $('#holdring');
    if (hr && rob && S) {
      const sr = stage.getBoundingClientRect(), ar = rob.el.getBoundingClientRect(), d = ar.height * 1.12;
      hr.style.width = hr.style.height = d + 'px';
      hr.style.left = (ar.left + ar.width / 2 - sr.left) + 'px'; hr.style.top = (ar.top + ar.height / 2 - sr.top) + 'px';
      const p = S.holdP || 0; $('#holdprog').style.strokeDashoffset = 100 - p * 100;
      hr.classList.toggle('on', p > 0.02); hr.classList.toggle('same', !!S.same && p < 1); hr.classList.toggle('full', p >= 1);
    }
    if (S && S.screen !== 'map') starsLive(S);
    if (S && S.screen === 'game' && S.game && S.game.kind === 'ice') {
      const p = S.game.between ? 1 : S.game.progress;
      const ice = $('#ice'); if (ice) { ice.style.opacity = (1 - p) * 0.95; ice.style.transform = `scale(${1 - p * 0.25})`; ice.classList.toggle('cracking', p > 0.4); }
      const gl = $('#glow'); if (gl) gl.style.opacity = p;
      const gf = $('#gfill'); if (gf) gf.style.height = (8 + p * 92) + '%';
      const pb = $('#pbar'); if (pb) pb.style.width = p * 100 + '%';
      if (rob) { rob.shiver = p < 1 ? 0.5 * (1 - p) : 0; const want = p >= 1 ? ROBIK.happy : p > 0.5 ? ROBIK.warm : ROBIK.cold; look(rob, want); }
    }
    if (S && S.screen === 'game' && S.game && S.game.kind === 'owl') {
      const g = S.game, st = L.steps[S.i];
      if (rob) { rob.goto(20 + g.pos * 62, 88 - g.pos * 6); rob.shiver = g.zone === 'loud' ? 0.8 : 0; const want = g.done ? ROBIK.happy : g.zone === 'loud' || g.awake ? ROBIK.loud : ROBIK.shh; look(rob, want); }
      const lv = Math.max(0, Math.min(1, (v - 35) / 50)); const nd = $('#needle'); if (nd) nd.style.transform = `rotate(${-80 + lv * 160}deg)`;
      const tr = $('#trail'); if (tr) tr.style.width = g.pos * 100 + '%';
      const owlet = W.actor('owlet');
      if (owlet) {
        owlet.shiver = g.wake * 1.2; owlet.breathe = 2.6 + g.wake * 6;
        const st = g.awake ? 'awake' : g.wake > 0.45 ? 'half' : 'sleep';
        if (owlet.rig) {   // скелетный совёнок: меняем «костюм», ширина корзинки остаётся прежней
          const want = 'owlet_' + st;
          if (owlet.rigName !== want && RL.Rig.has(want)) { owlet.setRig(want); const cv = owlet.el; owlet.el.style.height = (16.25 * cv.height / cv.width) + 'cqw'; owlet.hop(0.35); }
          owlet.rig.look = Math.max(-1, Math.min(1, ((rob ? rob.x : 50) - 85) / 40));
        }
        const par = W.actor('parents');
        if (par && par.rig) { par.rig.peek = g.awake || g.zone === 'loud' ? 0.65 : g.zone === 'mid' ? 0.25 : 0; /* сонно приоткрывают, не таращатся */ par.rig.look = Math.max(-1, Math.min(1, ((rob ? rob.x : 50) - 16) / 35)); }
        const want = g.awake ? 'img/codex/owlet_awake.png' : g.wake > 0.45 ? 'img/codex/owlet_half.png' : 'img/owlet.png';
        const src = has(want) ? want : 'img/owlet.png'; if (!owlet.rig && !owlet.el.src.endsWith(src)) {
          // ширина корзинки одна и та же, высота — по пропорциям картинки (у проснувшегося над головой искры)
          owlet.el.onload = () => { const e = owlet.el; e.style.height = (16.25 * e.naturalHeight / e.naturalWidth) + 'cqw'; };
          owlet.el.src = src; owlet.hop(0.35);
        }
        if (g.wake > 0.5 && !g.awake && Math.random() < 0.03) W.burst(86, 14, ['❔', '💭'], 1, 6);
      }
      const zz = W.emitter('zzz'); if (zz) zz.rate = g.awake ? 0 : 0.6 * (1 - g.wake);
      if (g.awake && !lastAwake) { owlet && owlet.hop(0.6); W.burst(86, 16, ['❗', '💢'], 4, 15); Sfx.pop(); }
      lastAwake = g.awake;
      const sy = $('#saytext'); if (sy && !g.done) { const t = g.awake ? 'Ой! Совёнок проснулся… Тсс!' : g.zone === 'loud' ? 'Слишком громко! Я стою…' : g.zone === 'mid' ? 'Потише… совёнок ворочается' : 'Тихо — я иду!'; if (sy.textContent !== t) sy.textContent = t; }
    }
    if (S && S.screen === 'game' && S.game && S.game.kind === 'cloud') {
      const p = S.game.between ? 1 : S.game.progress, cl = $('#cloud');
      if (cl) { cl.style.transform = `translate(-50%,-50%) scale(${0.35 + p * 0.75})`; cl.style.filter = `brightness(${1 - p * 0.35}) drop-shadow(0 1cqw 1.4cqw rgba(0,0,0,.25))`; }
      const pb = $('#pbar'); if (pb) pb.style.width = p * 100 + '%';
      if (rob) look(rob, '', S.game.between ? 'happy' : p > 0.5 ? 'happy' : 'warm');
    }
    const lb = $('#lbeam'); if (lb) lb.style.opacity = Math.max(0.05, Math.min(1, v / 95));
    if (S && S.screen === 'game' && S.game && S.game.kind === 'beam') {
      const g = S.game, lamp = $('#lamp');
      if (lamp) { lamp.style.setProperty('--b', Math.max(0, Math.min(1, (v - 15) / 70))); lamp.classList.toggle('on', v >= 45); }
      const boat = W.actor('boat'); if (boat) { boat.goto(24 + g.pos * 58, SCENES['light-1'].game.boatY + Math.sin(performance.now() / 600) * 0.6); }
      const fl = $('#flashes'); if (fl) fl.querySelectorAll('i').forEach((el, k) => el.classList.toggle('on', k < g.flashes));
      const tr = $('#trail'); if (tr) tr.style.width = g.pos * 100 + '%';
      if (g.flashes > (lastFlashes || 0)) { Sfx.chime(); W.burst(24 + g.pos * 58, 60, ['✨', '⭐'], 6, 10); rob && rob.gesture('cheer', 0.9); }
      lastFlashes = g.flashes;
      if (rob) look(rob, '', g.done ? 'happy' : g.lit ? 'bright' : 'wait');
      const sy = $('#saytext'); if (sy && !g.done) { const t = g.lit ? 'Светит! Выключите 🌑' : 'Включите 🔦'; if (sy.textContent !== t) sy.textContent = t; }
    }
    // будильник в симуляторе: громкость следует за показанием датчика звука
    const meas = S && (S.screen === 'measure' || S.screen === 'lab');
    if (S && L && L.channel === 'sound' && meas && Snr.source === 'sim') RL.Amb.level('alarm', Math.max(0, Math.min(1, (v - 45) / 32)) * 0.55);
    else if (S && !meas) RL.Amb.level('alarm', 0);
    drawChart();
    updatePanelLive();
  }

  // звёзды: новая прилетает к счётчику из центра сцены
  function starsLive(S) {
    const want = S.stars || 0, box = $('#starbox'), cnt = $('#starcount'); if (!box) return;
    if (want < shownStars) { shownStars = want; cnt.textContent = want; return; }
    if (want === shownStars || box.dataset.busy) return;
    box.dataset.busy = 1;
    const sr = stage.getBoundingClientRect(), br = box.getBoundingClientRect();
    const f = document.createElement('span'); f.className = 'flystar'; f.innerHTML = '<svg viewBox="0 0 24 24" width="1em" height="1em"><path d="M12 1.8l3.1 6.6 7.2.9-5.3 5 1.4 7.1L12 17.9l-6.4 3.5L7 14.3 1.7 9.3l7.2-.9z" fill="#ffcf3f" stroke="#e39b12" stroke-width="1.2" stroke-linejoin="round"/></svg>';
    f.style.left = '50%'; f.style.top = '45%'; stage.appendChild(f);
    requestAnimationFrame(() => requestAnimationFrame(() => { f.style.left = (br.left + br.height / 2 - sr.left) + 'px'; f.style.top = (br.top + br.height / 2 - sr.top) + 'px'; f.classList.add('go'); }));
    Sfx.star();
    setTimeout(() => { f.remove(); shownStars++; const c = $('#starcount'), b = $('#starbox'); if (c) c.textContent = shownStars; if (b) { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); delete b.dataset.busy; } }, 800);
  }

  function drawChart() {
    const cv = $('#chart'); if (!cv) return;
    const r = cv.getBoundingClientRect(); const dpr = devicePixelRatio || 1;
    if (!r.width) return;
    if (cv.width !== Math.round(r.width * dpr)) { cv.width = Math.round(r.width * dpr); cv.height = Math.round(r.height * dpr); }
    const g = cv.getContext('2d'), Wd = cv.width, H = cv.height, pad = 8 * dpr;
    g.clearRect(0, 0, Wd, H);
    const hs = Snr.history(); if (hs.length < 2) return;
    const snd = Snr.channel === 'sound';
    const lux = Snr.channel === 'light', wet = Snr.channel === 'rh';
    const t1 = hs[hs.length - 1].t, t0 = t1 - 15, lo = wet ? 30 : lux ? 0 : snd ? 30 : 15, hi = wet ? 100 : lux ? 100 : snd ? 90 : 40;
    const X = t => pad + (t - t0) / 15 * (Wd - 2 * pad), Y = v => H - pad - (Math.max(lo, Math.min(hi, v)) - lo) / (hi - lo) * (H - 2 * pad);
    g.strokeStyle = 'rgba(255,255,255,.18)'; g.lineWidth = 1 * dpr;
    (wet ? [40, 60, 80] : lux ? [25, 50, 75] : snd ? [40, 55, 70, 85] : [20, 25, 30, 35]).forEach(y => { g.beginPath(); g.moveTo(pad, Y(y)); g.lineTo(Wd - pad, Y(y)); g.stroke(); });
    const col = wet ? '110,190,255' : lux ? '255,220,80' : snd ? '150,200,255' : '255,140,40';
    const grad = g.createLinearGradient(0, 0, 0, H); grad.addColorStop(0, `rgba(${col},.55)`); grad.addColorStop(1, `rgba(${col},0)`);
    g.beginPath(); hs.forEach((p, k) => k ? g.lineTo(X(p.t), Y(p.v)) : g.moveTo(X(p.t), Y(p.v)));
    g.lineTo(X(t1), H); g.lineTo(X(hs[0].t), H); g.closePath(); g.fillStyle = grad; g.fill();
    g.strokeStyle = wet ? '#7cc4ff' : lux ? '#ffe066' : snd ? '#9fd0ff' : '#ffb347'; g.lineWidth = 4 * dpr; g.lineJoin = 'round'; g.lineCap = 'round'; g.beginPath();
    hs.forEach((p, k) => k ? g.lineTo(X(p.t), Y(p.v)) : g.moveTo(X(p.t), Y(p.v))); g.stroke();
    const last = hs[hs.length - 1]; g.fillStyle = '#fff'; g.beginPath(); g.arc(X(last.t), Y(last.v), 6 * dpr, 0, 7); g.fill();
  }

  // ---------- автопилот симулятора: повторяет действия детей ----------
  let apKey = '', apTimer = null;
  function autopilotTick(S, L) {
    if (!autopilot || Snr.source !== 'sim' || !S || !L) return;
    const st = S.i >= 0 ? L.steps[S.i] : null; if (!st) return;
    const g = S.game;
    const key = [L.id, S.i, S.cond, Object.keys(S.results).length, g && g.round, g && g.between, S.lab && S.lab.count].join('|');
    if (key === apKey) return; apKey = key; clearTimeout(apTimer);
    const sound = L.channel === 'sound', light = L.channel === 'light', wet = L.channel === 'rh';
    if (st.type === 'measure') {
      const c = st.conditions[S.cond]; if (S.results[c.key] !== undefined) return;
      apTimer = setTimeout(() => { wet ? Snr.rh(c.key) : light ? Snr.light(c.key) : sound ? Snr.sound(c.key) : Snr.hold(c.key); refreshPanel(); }, 1400);
    } else if (st.type === 'game' && g && g.kind === 'beam') {
      apTimer = setInterval(() => { const S2 = E.state; if (!S2 || !S2.game || S2.game.kind !== 'beam' || S2.game.done) { clearInterval(apTimer); return; } Snr.light(Snr.sim.light.state === 'open' ? 'dark' : 'open'); }, 900);
    } else if (st.type === 'game' && g && g.kind === 'cloud' && !g.between) {
      apTimer = setTimeout(() => { Snr.rh('breath'); refreshPanel(); }, 1800);
    } else if (st.type === 'game' && g && g.kind === 'ice' && !g.between) {
      apTimer = setTimeout(() => { Snr.hold('hand'); refreshPanel(); }, 1800);
    } else if (st.type === 'lab') {
      // показ лаборатории: по очереди предметы урока, каждый — в находки
      const k = S.lab.count, c = L.conditions[k];
      const set = key => { wet ? Snr.rh(key) : light ? Snr.light(key) : sound ? Snr.sound(key) : Snr.hold(key); refreshPanel(); };
      if (!c) { apTimer = setTimeout(() => set(wet || light ? 'room' : sound ? 'quiet' : null), 1500); return; }
      apTimer = setTimeout(() => { set(c.key); apTimer = setTimeout(() => { const S2 = E.state; if (S2 && S2.lab && S2.lab.count === k) E.pin(c.label); }, 4500); }, 1500);
    } else { wet ? Snr.rh('room') : light ? Snr.light('room') : sound ? Snr.sound('quiet') : Snr.hold(null); refreshPanel(); }
  }

  // ---------- пульт педагога ----------
  let panelKey = '', pinDraft = '';
  function refreshPanel() { panelKey = ''; renderPanel(E.state, E.lesson); }
  function renderPanel(S, L) {
    const j = RL.Journal.list();
    const key = JSON.stringify([S && S.screen, L && L.id, S && S.i, S && S.cond, S && S.results, S && S.votes, S && S.paused,
      j.length, S && S.lab && S.lab.marks.map(m => m.n), Snr.sim.light.state, Snr.sim.rh.state, Snr.sim.holding, Snr.sim.sound.state, Snr.source, Snr.channel, RL.Voice.muted, subsOn, autopilot, S && S.game && S.game.round]);
    if (key === panelKey) return; panelKey = key;
    const st = L && S.i >= 0 ? L.steps[S.i] : null;
    let h = `<div class="ph"><b>Пульт педагога</b><span class="grp">«Солнышко» · 18 детей</span><button id="present" title="Клавиша P">Скрыть</button></div>`;
    h += `<div class="sec"><h4>Экран детей</h4><div class="row">
      <button class="btn ${board ? '' : 'on'}" id="m-group" title="Телевизор или проектор: дети экран не трогают">📺 Экран группы</button>
      <button class="btn ${board ? 'on' : ''}" id="m-board" title="Интерактивная доска: карточки нажимаются, «Дальше» — долгим нажатием">👆 Доска</button></div>
      <p class="muted">${board ? 'Дети нажимают карточки на доске. Кнопка ▶ срабатывает, если удерживать её 1 секунду.' : 'Шаги и голоса ведёте вы: «Дальше» — здесь или клавишей →.'}</p></div>`;

    if (!L) {
      h += `<div class="sec"><h4>Темы</h4>${HOUSES.map(x => { const les = x.lesson && RL.content[x.lesson];
        return `<div class="topic ${les ? 'on' : ''}">${x.icon} ${x.topic}
        ${les ? `<span class="gos"><button class="go" data-start="${x.lesson}" title="${les.title} · ${les.age} · ${les.minutes} мин">▶ Урок</button><button class="go lab" data-lab="${x.lesson}" title="Свободные опыты: мерить что угодно">🔬</button></span>` : '<span class="soon">следующая версия</span>'}</div>`; }).join('')}
        <p class="muted">▶ Урок — занятие по сценарию. 🔬 Лаборатория — свободные опыты с тем же датчиком: дети мерят что хотят и сравнивают находки.</p></div>`;
    } else if (L.lab) {
      h += `<div class="sec"><h4>${L.title}</h4>
        <div class="ctrls"><button id="p-pause" class="primary">${S.paused ? '▶ Продолжить' : '⏸ Пауза для всех'}</button><button id="p-lesson">▶ Урок этого домика</button>
        <button id="p-map" style="grid-column:span 2">⌂ Завершить и на карту</button></div>
        <p class="keys">Esc — пауза · R — повтор фразы · Enter — запомнить</p></div>`;
      h += `<div class="sec"><h4>Подсказка педагогу</h4><div class="hint">${st.hint}</div></div>`;
      h += `<div class="sec"><h4>Находки · ${S.lab.marks.length}</h4>
        <div class="pinrow"><input id="pinlabel" type="text" maxlength="24" placeholder="Что мерили (можно пусто)" value="${pinDraft.replace(/"/g, '&quot;')}"><button class="btn primary" id="p-pin">📌 Запомнить</button></div>
        ${S.lab.marks.length ? `<table class="j">${S.lab.marks.map((m, k) => `<tr><td>${m.label}</td><td><b>${fmtV(m.v, L)}</b>${L.channel === 't' ? '' : ' ' + (L.channel === 'sound' ? 'дБ' : '%')}</td><td><button class="x" data-unpin="${k}" title="Убрать">✕</button></td></tr>`).join('')}</table>` : '<p class="muted">Пока пусто. Когда показание встало, нажмите «Запомнить».</p>'}
        <div class="row"><button class="btn" id="p-resetrec">↺ Сбросить рекорды</button></div></div>`;
    } else {
      h += `<div class="sec"><h4>Занятие · ${L.title} · ${L.minutes} мин</h4><ul class="steps">${L.steps.map((x, k) =>
        `<li data-go="${k}" class="${k === S.i ? 'cur' : k < S.i ? 'past' : ''}"><span class="n">${k + 1}</span>${x.title}</li>`).join('')}</ul>
        <div class="ctrls"><button id="p-back">⏮ Назад</button><button id="p-skip">Пропустить ⏭</button>
        <button id="p-pause" class="primary">${S.paused ? '▶ Продолжить' : '⏸ Пауза для всех'}</button><button id="p-repeat">🔁 Повторить шаг</button>
        <button id="p-map" style="grid-column:span 2">⌂ Завершить и на карту</button></div>
        <p class="keys">← → шаги · Esc — пауза · R — повтор фразы · P — скрыть пульт</p></div>`;
      h += `<div class="sec"><h4>Сейчас звучит</h4><div id="psay">${RL.Voice.last || ''}</div><div class="row"><button class="btn" id="p-sayagain">🔊 Повторить фразу</button></div></div>`;
      if (st && st.hint) h += `<div class="sec"><h4>Подсказка педагогу</h4><div class="hint">${st.hint}</div></div>`;
      if (st && st.type === 'intro') h += `<div class="sec"><div class="row"><button class="btn" id="p-skipnarr">⏭ Пропустить рассказ — сразу Робик</button></div></div>`;
      const rg = L.steps.find(x => x.game === 'warm-robik' || x.game === 'cloud');
      if (rg) h += `<div class="sec"><h4>${rg.title.split(' · ')[0]}</h4><div class="vrow"><span class="vl">Туров — по числу детей</span><button id="r-minus">−</button><b>${E.rounds}</b><button id="r-plus">+</button></div></div>`;
      if (st && st.type === 'guess') h += `<div class="sec"><h4>Голоса группы</h4>${st.options.map(o =>
        `<div class="vrow"><span class="vl">${o.icon} ${o.label}</span><button data-v="${o.key}" data-d="-1">−</button><b>${S.votes[o.key] || 0}</b><button data-v="${o.key}" data-d="1">+</button></div>`).join('')}
        ${board ? '' : `<p class="muted">Голосуем телом: каждый встаёт у той стороны, за чью догадку он (${st.options.map(o => o.icon + ' ' + o.label.toLowerCase()).join(', ')}). Посчитайте и отметьте числа.</p>`}</div>`;
      if (st && st.type === 'measure') { const c = st.conditions[S.cond];
        h += `<div class="sec"><h4>Замер: ${c.icon} ${c.label}</h4><p class="muted">Программа сама ловит момент, когда значение изменилось и успокоилось${st.average ? ', и записывает среднее' : ''}.</p>
        <div class="muted" id="phold"></div><button class="btn" id="p-fix">📌 Зафиксировать сейчас</button></div>`; }
    }

    const snd = Snr.channel === 'sound', lux = Snr.channel === 'light', wet = Snr.channel === 'rh';
    const hold = Snr.sim.holding, ss = Snr.sim.sound.state, ls = Snr.sim.light.state;
    h += `<div class="sec"><h4>Датчик «Робик» · ${snd ? 'звук' : lux ? 'свет' : wet ? 'влажность' : 'температура'}</h4>
      <div class="live"><span class="big" id="pv">—</span><span id="ptrend" class="muted"></span></div>
      <div class="dev">Глаза: <span class="eye" id="peye"></span><span id="peyet"></span> · <span id="pvib"></span></div>
      <div class="muted">Источник: ${{ serial: 'USB (Web Serial)', mic: 'микрофон компьютера', sim: 'симулятор' }[Snr.source]}</div>
      ${Snr.source === 'sim' && wet ? `<div class="simbtns four">${[['room', '🌤️ Воздух'], ['towel', '🧺 Полотенце'], ['sponge', '🧽 Губка'], ['breath', '🌬️ Дыхание']].map(([k, t]) =>
          `<button class="btn ${Snr.sim.rh.state === k ? 'on' : ''}" data-rh="${k}">${t}</button>`).join('')}</div>
        <div class="sliders">${[['towel', '🧺'], ['sponge', '🧽'], ['breath', '🌬️']].map(([k, i]) => `<label>${i} <input type="range" min="30" max="98" value="${Snr.sim.rh[k]}" data-rhl="${k}"><b>${Snr.sim.rh[k]}</b></label>`).join('')}</div>
        <p class="muted">Пробел — дышать на Робика, пока клавиша нажата. Влажность растёт быстро, а уходит медленно — как у настоящего датчика.</p>
        <label class="chk"><input type="checkbox" id="autopilot" ${autopilot ? 'checked' : ''}> Автопилот: симулятор сам делает то, что просит экран</label>` : ''}
      ${Snr.source === 'sim' && lux ? `<div class="simbtns four">${[['dark', '🌑 Темно'], ['room', '💡 Комната'], ['open', '🔦 Фонарик'], ['glass', '🟦 Стекло'], ['paper', '📄 Калька'], ['card', '📦 Картон']].map(([k, t]) =>
          `<button class="btn ${ls === k ? 'on' : ''}" data-lux="${k}">${t}</button>`).join('')}</div>
        <div class="sliders">${[['glass', '🟦'], ['paper', '📄'], ['card', '📦']].map(([k, i]) => `<label>${i} <input type="range" min="0" max="95" value="${Snr.sim.light[k]}" data-luxl="${k}"><b>${Snr.sim.light[k]}</b></label>`).join('')}</div>
        <p class="muted">Пробел — фонарик горит, пока клавиша нажата. Ползунками можно поменять, сколько света пропускает материал.</p>
        <label class="chk"><input type="checkbox" id="autopilot" ${autopilot ? 'checked' : ''}> Автопилот: симулятор сам делает то, что просит экран</label>` : ''}
      ${Snr.source === 'sim' && !lux && !wet ? (snd ? `<div class="simbtns four">
        ${[['quiet', '🤫 Тишина'], ['open', '⏰ Будильник'], ['scarf', '🧣 Шарф'], ['bubble', '🫧 Плёнка'], ['paper', '📰 Газета'], ['noise', '📣 Шум']].map(([k, t]) =>
          `<button class="btn ${ss === k ? 'on' : ''}" data-snd="${k}">${t}</button>`).join('')}</div>
        <div class="sliders">${[['scarf', '🧣'], ['bubble', '🫧'], ['paper', '📰']].map(([k, i]) => `<label>${i} <input type="range" min="40" max="72" value="${Snr.sim.sound[k]}" data-lvl="${k}"><b>${Snr.sim.sound[k]}</b></label>`).join('')}</div>
        <p class="muted">Пробел — шум, пока клавиша нажата. Ползунками можно сделать тише любой материал и проверить другие ветки.</p>`
        : `<div class="simbtns">
        <button class="btn ${hold === 'hand' ? 'on' : ''}" data-hold="hand">✋ В ладонях</button>
        <button class="btn ${hold === 'water' ? 'on' : ''}" data-hold="water">🥛 В воде</button>
        <button class="btn ${!hold ? 'on' : ''}" data-hold="">Отпустить</button></div>
        <label class="muted">Вода в стакане: <b id="wv">${Snr.sim.water}°</b></label>
        <input type="range" id="water" min="12" max="40" step="1" value="${Snr.sim.water}">
        <p class="muted">Пробел — держать Робика в ладонях. Вода теплее 34° — ветка «Прав Тим».</p>`) +
        `<label class="chk"><input type="checkbox" id="autopilot" ${autopilot ? 'checked' : ''}> Автопилот: симулятор сам делает то, что просит экран</label>` : ''}
      <div class="row"><button class="btn" id="serial">🔌 Датчик по USB</button>${snd ? `<button class="btn ${Snr.source === 'mic' ? 'on' : ''}" id="mic">🎤 Микрофон</button>` : ''}</div>
      ${snd ? '<p class="muted">Микрофон заменяет датчик звука для демонстрации. Звук не записывается, берётся только уровень громкости.</p>' : ''}</div>`;

    h += `<div class="sec"><h4>Звук и подписи</h4><div class="row">
      <button class="btn ${RL.Voice.muted ? '' : 'on'}" id="mute">🔊 Озвучка</button>
      <button class="btn ${Sfx.enabled ? 'on' : ''}" id="sfx">🎵 Эффекты</button>
      <button class="btn ${RL.Amb.enabled ? 'on' : ''}" id="amb">🌲 Фон сцены</button>
      <button class="btn ${RL.Music.enabled ? 'on' : ''}" id="music">🎶 Музыка</button>
      <button class="btn ${subsOn ? 'on' : ''}" id="subsbtn">💬 Субтитры</button></div>
      ${'speechSynthesis' in window && !RL.Voice.hasVoice ? '<p class="muted">Русский голос в системе не найден — фразы видны выше, в «Сейчас звучит».</p>' : ''}</div>`;

    h += `<div class="sec"><h4>Журнал группы</h4>${j.length ? `<table class="j"><tr><th>Дата</th><th>Занятие</th><th>Итог</th></tr>${j.slice(0, 6).map(e =>
      `<tr><td>${new Date(e.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })}</td><td>${e.kind === 'lab' ? '🔬 ' : ''}${e.title}</td><td>${resultText(e)}</td></tr>`).join('')}</table>` : '<p class="muted">Пока пусто. Запись появится после наклейки или выхода из лаборатории.</p>'}
      <div class="row"><button class="btn" id="jall" ${j.length ? '' : 'disabled'}>📋 Весь журнал</button><button class="btn" id="csv" ${j.length ? '' : 'disabled'}>⬇ Таблица (Excel)</button></div>
      <div class="row"><button class="btn" id="export">⬇ Выгрузка для COR</button><button class="btn" id="clear">Очистить</button></div>
      <p class="muted">Журнал хранится в этом браузере, без имён детей. Формат выгрузки в COR — предварительный.</p></div>`;
    const sy = RL.Sync.state;
    h += `<div class="sec"><h4>Сервер</h4>
      <div class="dev"><span class="eye" style="background:${sy.mode === 'online' ? '#1fc7b6' : '#9aa4b1'};color:${sy.mode === 'online' ? '#1fc7b6' : 'transparent'}"></span>
      ${sy.mode === 'online' ? 'Подключён: ' + sy.server : 'Только браузер' + (sy.server ? ' · ' + (sy.error || 'нет сети') : ' · сервер не задан')}</div>
      <div class="muted">Не отправлено записей: ${sy.pending}${sy.lastSync ? ' · последняя синхронизация ' + new Date(sy.lastSync).toLocaleTimeString('ru-RU') : ''}</div>
      <div class="row"><button class="btn" id="setserver">Адрес сервера…</button></div>
      <p class="muted">Без интернета всё работает в браузере. Когда сервер доступен, журнал уходит на него сам.</p></div>`;
    panel.innerHTML = h;
    updatePanelLive();
  }
  function resultText(e) {
    if (e.kind === 'lab') { const u = e.unit === '°' ? '°' : ''; return (e.marks || []).length ? '📌 ' + e.marks.map(m => Math.round(m.v) + u).join(' · ') : (e.max !== null && e.max !== undefined ? Math.round(e.min) + '…' + Math.round(e.max) + u : ''); }
    const L = RL.content[e.lesson]; if (!L) return '';
    const m = L.steps.find(x => x.type === 'measure'), g = L.steps.find(x => x.type === 'guess');
    const r = m.conditions.filter(c => e.results && e.results[c.key] !== undefined).map(c => c.icon + Math.round(e.results[c.key])).join(' ');
    const w = e.winner === 'tie' ? 'ничья' : (m.conditions.find(c => c.key === e.winner) || {}).label;
    return `${r}${w ? ' · ' + w : ''}${e.guessed === true ? ' · угадали' : ''}`;
  }
  // весь журнал — окно поверх приложения
  function journalModal() {
    const j = RL.Journal.list();
    const box = document.createElement('div'); box.className = 'jmodal'; box.id = 'jmodal';
    box.innerHTML = `<div class="jbox"><div class="jh"><b>Журнал группы «Солнышко» · ${j.length}</b><button class="btn" id="jcsv">⬇ Таблица (Excel)</button><button class="btn" id="jclose">✕ Закрыть</button></div>
      <div class="jscroll"><table class="j full"><tr><th>Дата</th><th>Занятие</th><th>Мин</th><th>⭐</th><th>Догадки группы</th><th>Угадали</th><th>Замеры</th><th>Итог</th></tr>
      ${j.map(e => { const d = new Date(e.date), x = RL.Journal.describe(e);
        return `<tr><td>${d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' })} ${d.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</td><td>${e.kind === 'lab' ? '🔬 ' : ''}${e.title}</td><td>${e.minutes || ''}</td><td>${e.stars || 0}</td><td>${x.votes}</td><td>${x.guessed}</td><td>${x.measures}</td><td>${x.outcome}</td></tr>`; }).join('')}
      </table></div></div>`;
    document.body.appendChild(box);
    box.addEventListener('click', e => { if (e.target === box || e.target.id === 'jclose') box.remove(); if (e.target.id === 'jcsv') downloadCSV(); });
  }
  function download(name, text, type) { const a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type })); a.download = name; document.body.appendChild(a); a.click(); a.remove(); }
  function downloadCSV() { download('robiclab-journal-' + new Date().toISOString().slice(0, 10) + '.csv', RL.Journal.exportCSV(), 'text/csv;charset=utf-8'); }

  function updatePanelLive() {
    const pv = $('#pv'); if (!pv) return;
    const snd = Snr.channel === 'sound';
    pv.textContent = Snr.value.toFixed(snd ? 0 : 1) + (snd ? ' дБ' : ' °C');
    const s = Snr.slope(1), th = Snr.channel === 't' ? 0.15 : 4; $('#ptrend').textContent = s > th ? '↑ растёт' : s < -th ? '↓ падает' : '— стабильно';
    if (Snr.channel === 'light') pv.textContent = Snr.value.toFixed(0) + ' % яркости';
    if (Snr.channel === 'rh') pv.textContent = Snr.value.toFixed(0) + ' % влажности';
    const col = { blue: '#4a90d9', warm: '#f28a1d', happy: '#1fc7b6', wait: '#f2b632', neutral: '#1fc7b6', loud: '#e5484d', bright: '#ffd23f' }[device.eyes] || '#1fc7b6';
    const pe = $('#peye'); pe.style.background = col; pe.style.color = col;
    $('#peyet').textContent = { blue: 'синие (холодно)', warm: 'тёплые', happy: 'радость', wait: 'ждёт', neutral: 'спокойные', loud: 'красные (громко)', bright: 'щурится (ярко)' }[device.eyes] || device.eyes;
    $('#pvib').textContent = device.vibrate ? '📳 вибрация' : 'без вибрации';
    const ph = $('#phold'), S = E.state;
    if (ph && S) ph.textContent = S.holdP >= 1 ? '✔ Записано' : S.same ? `Почти не изменилось — запишу как есть, если продержится ровно (${Math.round(S.holdP * 100)}%)` : S.holdP > 0.02 ? `Держим ровно… ${Math.round(S.holdP * 100)}%` : 'Ждём, когда дети сделают опыт';
  }

  // ---------- события ----------
  stage.addEventListener('click', e => {
    const lb = e.target.closest('[data-lab]'); if (lb) { Sfx.tap(); E.startLab(lb.dataset.lab, houseName(lb.dataset.lab)); return; }
    const t = e.target.closest('button, [data-vote]'); if (!t) return;
    if (t.id === 'pin') { Sfx.tap(); E.pin(''); return; }
    if (t.dataset.house) {
      const x = HOUSES.find(hh => hh.id === t.dataset.house);
      Sfx.tap();
      if (x.lesson) E.start(x.lesson); else { RL.Voice.say('Этот домик пока закрыт. Откроем его в следующий раз!', 'narrator'); W.burst((x.box[0] + x.box[2] / 2), x.box[1] + x.box[3] / 2, ['🔒', '✨'], 6, 12); }
    }
    if (t.dataset.vote && board) {
      const r = stage.getBoundingClientRect();
      E.vote(t.dataset.vote, 1); Sfx.pop();
      W.burst((e.clientX - r.left) / r.width * 100, (e.clientY - r.top) / r.height * 100, ['⭐', '✨', '💛'], 10, 26);
      const L = E.lesson, st = L && L.steps[E.state.i]; const o = st && st.options && st.options.find(z => z.key === t.dataset.vote);
      if (o && o.who && W.actor(o.who)) { W.actor(o.who).hop(1); W.actor(o.who).gesture('cheer', 1.2); }
      const rob = W.actor('robik'); if (rob) { const card = t.getBoundingClientRect(); rob.goto((card.left + card.width / 2 - r.left) / r.width * 100, rob.home.y); setTimeout(() => rob.goHome(), 700); }
    }
    if (t.id === 'repeat') { Sfx.tap(); E.sayAgain(); }
  });
  // тык по любому актёру — он подпрыгивает
  stage.addEventListener('pointerdown', e => { const a = e.target.closest('[data-actor]'); if (a && !a.dataset.vote) { const ac = W.actor(a.dataset.actor); if (ac) { ac.hop(0.9); ac.gesture('wave', 1.4); } Sfx.pop(); } });
  // кто говорит на экране догадок — показывает рукой на свою карточку
  document.addEventListener('rl:speaker', e => { const w = e.detail, S = E.state; if ((w === 'asya' || w === 'tim') && S && S.screen === 'guess') { const a = W.actor(w); a && a.gesture('point', 2.6, { side: w === 'asya' ? 'R' : 'L' }); } });
  // кнопки с удержанием: выход на карту — 1,5 с, «Дальше» и «На карту» в режиме доски — 1 с
  let holdTimer = null;
  const HOLD = { home: [1500, () => E.showMap()], next: [1000, () => { Sfx.tap(); E.next(); }], tomap: [1000, () => { Sfx.tap(); E.showMap(); }] };
  stage.addEventListener('pointerdown', e => { const hb = e.target.closest('#home, #next, #tomap'); if (!hb) return; const [ms, fn] = HOLD[hb.id]; hb.classList.add('holding'); clearTimeout(holdTimer); holdTimer = setTimeout(() => { hb.classList.remove('holding'); fn(); }, ms); });
  ['pointerup', 'pointerleave', 'pointercancel'].forEach(ev => stage.addEventListener(ev, () => { clearTimeout(holdTimer); stage.querySelectorAll('.holding').forEach(b => b.classList.remove('holding')); }));

  panel.addEventListener('click', async e => {
    const t = e.target.closest('button, li'); if (!t) return;
    if (t.dataset.start) E.start(t.dataset.start);
    if (t.dataset.lab) E.startLab(t.dataset.lab, houseName(t.dataset.lab));
    if (t.dataset.unpin !== undefined) E.unpin(+t.dataset.unpin);
    if (t.dataset.go !== undefined) E.go(+t.dataset.go);
    if (t.dataset.v) E.vote(t.dataset.v, +t.dataset.d);
    if (t.dataset.hold !== undefined) { Snr.hold(t.dataset.hold || null); refreshPanel(); }
    if (t.dataset.snd) { Snr.sound(t.dataset.snd); refreshPanel(); }
    if (t.dataset.lux) { Snr.light(t.dataset.lux); refreshPanel(); }
    if (t.dataset.rh) { Snr.rh(t.dataset.rh); refreshPanel(); }
    switch (t.id) {
      case 'p-back': E.back(); break;
      case 'p-skip': E.next(); break;
      case 'p-pause': E.pause(); break;
      case 'p-repeat': E.repeat(); break;
      case 'p-map': E.showMap(); break;
      case 'p-fix': E.fix(); break;
      case 'p-sayagain': E.sayAgain(); break;
      case 'p-pin': E.pin(pinDraft); pinDraft = ''; refreshPanel(); break;
      case 'p-resetrec': E.resetRecords(); break;
      case 'p-lesson': E.start(E.lesson.base); break;
      case 'jall': journalModal(); break;
      case 'csv': downloadCSV(); break;
      case 'p-skipnarr': E.skipNarration(); break;
      case 'r-minus': E.setRounds(E.rounds - 1); refreshPanel(); break;
      case 'r-plus': E.setRounds(E.rounds + 1); refreshPanel(); break;
      case 'present': togglePresent(); break;
      case 'm-group': setBoard(false); break;
      case 'm-board': setBoard(true); break;
      case 'setserver': { const u = prompt('Адрес сервера (пусто — только браузер):', RL.Sync.state.server || ''); if (u !== null) RL.Sync.setServer(u.trim()); break; }
      case 'mute': RL.Voice.muted = !RL.Voice.muted; refreshPanel(); break;
      case 'sfx': Sfx.enabled = !Sfx.enabled; refreshPanel(); break;
      case 'amb': RL.Amb.enabled = !RL.Amb.enabled; refreshPanel(); break;
      case 'music': RL.Music.enabled = !RL.Music.enabled; refreshPanel(); break;
      case 'subsbtn': subsOn = !subsOn; stage.classList.toggle('nosubs', !subsOn); refreshPanel(); break;
      case 'serial': try { await Snr.connectSerial(); refreshPanel(); } catch (err) { alert(err.message); } break;
      case 'mic': try { if (Snr.source === 'mic') Snr.disconnectMic(); else await Snr.connectMic(); refreshPanel(); } catch (err) { alert('Микрофон недоступен: ' + err.message); } break;
      case 'export': {
        download('robiclab-start-journal.json', RL.Journal.exportJSON(), 'application/json'); break;
      }
      case 'clear': if (confirm('Очистить журнал и альбом группы в этом браузере?')) { RL.Journal.clear(); stageKey = ''; refreshPanel(); renderStage(E.state || { screen: 'map' }, E.lesson); } break;
    }
  });
  panel.addEventListener('input', e => {
    if (e.target.id === 'water') { Snr.sim.water = +e.target.value; $('#wv').textContent = e.target.value + '°'; }
    if (e.target.dataset.rhl) { Snr.sim.rh[e.target.dataset.rhl] = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; }
    if (e.target.dataset.luxl) { Snr.sim.light[e.target.dataset.luxl] = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; }
    if (e.target.dataset.lvl) { Snr.sim.sound[e.target.dataset.lvl] = +e.target.value; e.target.nextElementSibling.textContent = e.target.value; }
    if (e.target.id === 'pinlabel') pinDraft = e.target.value;
    if (e.target.id === 'autopilot') { autopilot = e.target.checked; apKey = ''; }
  });

  function togglePresent() { app.classList.toggle('present'); setTimeout(drawChart, 50); }
  $('#showpanel').addEventListener('click', togglePresent);

  document.addEventListener('keydown', e => {
    if (e.target.id === 'pinlabel' && e.key === 'Enter') { E.pin(pinDraft); pinDraft = ''; refreshPanel(); return; }
    if (e.target.tagName === 'INPUT') return;
    if (e.code === 'Escape') { const m = $('#jmodal'); if (m) m.remove(); else E.pause(); }
    if (e.code === 'KeyR' && !e.ctrlKey && !e.metaKey) E.sayAgain();
    if (e.code === 'Enter' && e.target.tagName !== 'BUTTON' && E.state && E.state.lab) E.pin(pinDraft);
    if (e.code === 'Space') { e.preventDefault(); if (!e.repeat) { Snr.channel === 'rh' ? Snr.rh('breath') : Snr.channel === 'light' ? Snr.light('open') : Snr.channel === 'sound' ? Snr.sound('noise') : Snr.hold('hand'); refreshPanel(); } }
    if (e.code === 'KeyP' || e.key === 'з') togglePresent();
    if (e.code === 'ArrowRight') E.next();
    if (e.code === 'ArrowLeft') E.back();
  });
  document.addEventListener('keyup', e => { if (e.code === 'Space') { Snr.channel === 'rh' ? Snr.rh('room') : Snr.channel === 'light' ? Snr.light('room') : Snr.channel === 'sound' ? Snr.sound('quiet') : Snr.hold(null); refreshPanel(); } });

  document.addEventListener('rl:say', e => { const s = $('#subs'); if (s) s.textContent = e.detail; const p = $('#psay'); if (p) p.textContent = e.detail; });
  Snr.onDevice(d => { device = d; });

  RL.Sync.subscribe(() => { if (panel.innerHTML) refreshPanel(); });
  E.subscribe((S, L) => { renderStage(S, L); renderPanel(S, L); autopilotTick(S, L); });
  setInterval(updateLive, 50);
  const q = qs;
  if (q.has('present')) app.classList.add('present');
  if (q.get('demo') !== null) E.demo(q.get('lesson') || 'heat-1', +q.get('demo'));
  else if (q.get('lesson')) E.start(q.get('lesson'));
  else if (q.get('lab')) E.startLab(q.get('lab'), houseName(q.get('lab')));
  else E.showMap();
})();
