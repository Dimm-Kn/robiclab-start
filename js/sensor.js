// Драйвер устройств + сервис датчиков.
// Каналы: t — температура (°C), sound — громкость (дБ, условные).
// Источники: симулятор (по умолчанию), USB через Web Serial, микрофон компьютера (только канал звука).
// Формат строки от прошивки (предположение, сверить с протоколом РобикЛаб):
//   t=23.4   s=61.0   l=55   h=48   или   {"ch":"t","v":23.4} / {"ch":"sound","v":61}
// Команды на датчик (глаза, вибрация) уходят строками: eyes=warm, vib=1
window.RL = window.RL || {};

RL.Sensor = (function () {
  const HZ = 20;
  const CH = {
    t:     { unit: '°C', stable: 0.3, trend: 0.15, smooth: 0.35, start: 23 },
    sound: { unit: 'дБ', stable: 6,   trend: 4,    smooth: 0.25, start: 36 },
    light: { unit: '%',  stable: 5,   trend: 4,    smooth: 0.3,  start: 22 },
    rh:    { unit: '%',  stable: 1.5, trend: 1.5,    smooth: 0.3,  start: 41 }
  };
  const listeners = new Set();
  const deviceListeners = new Set();
  let channel = 't';
  let hist = [];
  let value = CH.t.start, raw = CH.t.start;
  let source = 'sim';
  // потеря прибора: порт закрылся, данные перестали приходить или нет нужного канала.
  // Тогда показания замирают и симулятор САМ НЕ включается — его включает педагог (useSim).
  let lost = null;            // null или { reason: 'closed' | 'silent' | 'nochannel' | 'mic', kind: 'serial' | 'mic' }
  let lastSerialAt = 0, connectedAt = 0, closing = false;
  let device = { eyes: 'neutral', vibrate: 0, connected: true };

  // ---------- симулятор ----------
  const sim = {
    room: 23, hand: 34, water: 22, table: 23, window: 19, radiator: 30.5, floor: 21, tau: 1.6, holding: null,                   // температура
    sound: { quiet: 36, open: 74, scarf: 52, bubble: 58, paper: 65, noise: 80, whisper: 44, voice: 60, clap: 73, stomp: 67, state: 'quiet' },  // громкость
    light: { dark: 3, room: 22, open: 92, glass: 68, paper: 41, card: 6, window: 86, lamp: 66, corner: 17, under: 6, state: 'room' },         // яркость, %
    rh:    { room: 41, air: 41, towel: 44, sponge: 72, breath: 87, coldcup: 46, plant: 55, warmcup: 79, state: 'room' }                // влажность, %
  };
  function simTick(dt) {
    if (channel === 'rh') {                       // влажность: растёт быстро (дыхание), уходит медленно
      const target = sim.rh[sim.rh.state] ?? sim.rh.room, up = target > raw;
      raw += (target - raw) * (1 - Math.exp(-dt / (up ? 0.9 : 3)));
      return raw + (Math.random() - 0.5) * 0.5;
    }
    if (channel === 'light') {
      const target = sim.light[sim.light.state] ?? sim.light.room;
      raw += (target - raw) * (1 - Math.exp(-dt / 0.15));
      return Math.max(0, raw + (Math.random() - 0.5) * 1.6);
    }
    if (channel === 'sound') {
      const target = sim.sound[sim.sound.state] ?? sim.sound.quiet;
      raw += (target - raw) * (1 - Math.exp(-dt / 0.25));
      return raw + (Math.random() + Math.random() - 1) * 2.2;
    }
    const target = sim.holding && typeof sim[sim.holding] === 'number' ? sim[sim.holding] : sim.room;   // рука, вода, места в комнате
    const tau = sim.holding ? sim.tau : sim.tau * 2.5;   // остывает медленнее, чем греется
    raw += (target - raw) * (1 - Math.exp(-dt / tau));
    return raw + (Math.random() - 0.5) * 0.08;
  }

  // ---------- Web Serial ----------
  let port = null, writer = null; const serialValue = { t: null, sound: null, light: null, rh: null };
  async function connectSerial() {
    if (!('serial' in navigator)) throw new Error('Браузер не поддерживает Web Serial. Нужен Chrome или Edge.');
    port = await navigator.serial.requestPort();
    await port.open({ baudRate: 115200 });
    writer = port.writable.getWriter();
    source = 'serial'; lost = null; connectedAt = lastSerialAt = performance.now(); emitDevice();
    readLoop();
  }
  async function readLoop() {
    const dec = new TextDecoder(); let buf = '';
    const reader = port.readable.getReader();
    try {
      for (;;) {
        const { value: chunk, done } = await reader.read();
        if (done) break;
        buf += dec.decode(chunk, { stream: true });
        let i;
        while ((i = buf.indexOf('\n')) >= 0) { parseLine(buf.slice(0, i).trim()); buf = buf.slice(i + 1); }
      }
    } catch (e) { console.warn(e); }
    writer = null;
    if (closing) { closing = false; return; }
    lose('closed', 'serial');
  }
  function lose(reason, kind) { if (lost) return; lost = { reason, kind }; hist = []; emitDevice(); }
  // переключиться на имитацию — только по решению педагога
  async function useSim() {
    if (port) { closing = true; try { await port.close(); } catch (e) {} port = null; }
    if (micStream) { micStream.getTracks().forEach(t => { t.onended = null; t.stop(); }); micStream = null; analyser = null; }
    closing = false; lost = null; source = 'sim'; raw = value; emitDevice();
  }
  function parseLine(line) {
    if (!line) return;
    try { if (line[0] === '{') { const o = JSON.parse(line); if (o.ch in serialValue) serialValue[o.ch] = +o.v; return; } } catch (e) { return; }
    const m = line.match(/^(t|s|l|h)\s*[:=]\s*(-?\d+(\.\d+)?)/i);
    if (m) serialValue[{ t: 't', s: 'sound', l: 'light', h: 'rh' }[m[1].toLowerCase()]] = +m[2];
    if (m || line[0] === '{') { lastSerialAt = performance.now(); if (lost && lost.reason === 'silent') { lost = null; emitDevice(); } }
  }
  function send(cmd) {
    if (source === 'serial' && writer) writer.write(new TextEncoder().encode(cmd + '\n')).catch(() => {});
  }

  // ---------- микрофон (замена датчика звука в демо) ----------
  let analyser = null, micBuf = null, micStream = null;
  async function connectMic() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw new Error('Браузер не даёт доступ к микрофону на этой странице.');
    micStream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false } });
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    const src = ac.createMediaStreamSource(micStream);
    analyser = ac.createAnalyser(); analyser.fftSize = 1024; micBuf = new Float32Array(analyser.fftSize);
    src.connect(analyser);
    micStream.getTracks().forEach(t => t.onended = () => lose('mic', 'mic'));   // микрофон выдернули или запретили
    source = 'mic'; lost = null; emitDevice();
  }
  function micLevel() {
    // звук не записывается и никуда не отправляется: берётся только уровень
    analyser.getFloatTimeDomainData(micBuf);
    let s = 0; for (let i = 0; i < micBuf.length; i++) s += micBuf[i] * micBuf[i];
    const rms = Math.sqrt(s / micBuf.length) + 1e-7;
    return Math.max(30, Math.min(100, 20 * Math.log10(rms) + 96));   // условная калибровка
  }
  function disconnectMic() { if (micStream) micStream.getTracks().forEach(t => t.stop()); micStream = null; analyser = null; source = 'sim'; lost = null; emitDevice(); }

  // ---------- калибровка настоящего датчика (USB и микрофон) ----------
  // По одной-двум точкам «показал датчик → показал эталон» на канал: одна точка — сдвиг, две — сдвиг и масштаб.
  // Хранится в этом браузере; на симулятор не действует.
  let cal = {}; try { cal = JSON.parse(localStorage.getItem('rl.cal') || '{}') || {}; } catch (e) {}
  const saveCal = () => { try { localStorage.setItem('rl.cal', JSON.stringify(cal)); } catch (e) {} };
  function calibrate(ch, r) {
    const p = cal[ch]; if (!p || !p.length) return r;
    if (p.length === 1) return r + (p[0][1] - p[0][0]);
    const [[x1, y1], [x2, y2]] = p; if (Math.abs(x2 - x1) < 1e-6) return r + (y1 - x1);
    return y1 + (r - x1) * (y2 - y1) / (x2 - x1);
  }
  let rawDev = null;   // сглаженное показание прибора до калибровки

  // ---------- обработка ----------
  let last = performance.now();
  setInterval(() => {
    const now = performance.now(); const dt = (now - last) / 1000; last = now;
    let r;
    if (source === 'serial' && !lost) {   // сторож: прибор молчит или не шлёт этот канал
      if (now - lastSerialAt > 3000) lose('silent', 'serial');
      else if (serialValue[channel] === null && now - connectedAt > 3000) lose('nochannel', 'serial');
    }
    if (lost) return;                      // показания замерли, урок стоит на паузе
    if (source === 'serial' && serialValue[channel] !== null) r = serialValue[channel];
    else if (source === 'mic' && channel === 'sound' && analyser) r = micLevel();
    if (r !== undefined) { rawDev = rawDev === null ? r : rawDev + (r - rawDev) * CH[channel].smooth; r = calibrate(channel, r); }
    else { rawDev = null; r = simTick(dt); }
    value += (r - value) * CH[channel].smooth;
    hist.push({ t: now / 1000, v: value });
    while (hist.length && hist[0].t < now / 1000 - 15) hist.shift();
    const s = { ch: channel, v: value, r, trend: trend(), ts: now };   // r — без сглаживания (для коротких хлопков)
    listeners.forEach(fn => fn(s));
  }, 1000 / HZ);

  function windowOf(sec) { const t0 = performance.now() / 1000 - sec; return hist.filter(p => p.t >= t0); }
  function slope(sec = 1) { const w = windowOf(sec); if (w.length < 2) return 0; return (w[w.length - 1].v - w[0].v) / (w[w.length - 1].t - w[0].t); }
  function trend() { const k = slope(1), th = CH[channel].trend; return k > th ? 'rising' : k < -th ? 'falling' : 'stable'; }
  function isStable(sec) { const w = windowOf(sec); if (w.length < sec * HZ * 0.8) return false; let lo = Infinity, hi = -Infinity; w.forEach(p => { lo = Math.min(lo, p.v); hi = Math.max(hi, p.v); }); return hi - lo < CH[channel].stable; }
  function mean(sec) { const w = windowOf(sec); return w.length ? w.reduce((a, p) => a + p.v, 0) / w.length : value; }

  function setDevice(patch) {
    Object.assign(device, patch);
    if (patch.eyes) send('eyes=' + patch.eyes);
    if (patch.vibrate) { send('vib=1'); setTimeout(() => { device.vibrate = 0; emitDevice(); }, 350); }
    emitDevice();
  }
  function emitDevice() { deviceListeners.forEach(fn => fn({ ...device, source, lost })); }

  return {
    on: fn => listeners.add(fn),
    onDevice: fn => { deviceListeners.add(fn); fn({ ...device, source, lost }); },
    get lost() { return lost; }, useSim,
    get value() { return value; },
    get source() { return source; },
    get channel() { return channel; },
    unit: () => CH[channel].unit,
    setChannel(ch) {
      if (!CH[ch] || ch === channel) return;
      channel = ch; hist = []; value = raw = CH[ch].start; rawDev = null; if (source === 'serial') connectedAt = performance.now();
      if (source === 'mic' && ch !== 'sound') disconnectMic();
    },
    sim, isStable, slope, mean, history: () => hist,
    hold(what) { sim.holding = what; },
    sound(state) { sim.sound.state = state; },
    light(state) { sim.light.state = state; },
    rh(state) { sim.rh.state = state; },
    connectSerial, connectMic, disconnectMic, setDevice,
    // калибровка: точка = текущее показание прибора + значение эталона; третья точка заменяет ближайшую
    get raw() { return rawDev; },
    get calPoints() { return (cal[channel] || []).slice(); },
    calPoint(ref) {
      if (rawDev === null || !isFinite(ref)) return false;
      const p = cal[channel] = (cal[channel] || []).slice(), pt = [+rawDev.toFixed(2), +ref];
      if (p.length < 2) p.push(pt); else { const k = Math.abs(p[0][0] - pt[0]) < Math.abs(p[1][0] - pt[0]) ? 0 : 1; p[k] = pt; }
      p.sort((a, b) => a[0] - b[0]); saveCal(); return true;
    },
    calReset() { delete cal[channel]; saveCal(); },
    // для проверки без прибора: строка как будто пришла по USB
    debugSerial(line) { if (source !== 'serial') { source = 'serial'; connectedAt = performance.now(); } lost = null; parseLine(line); emitDevice(); },
    debugLose(reason = 'closed') { lose(reason, source === 'mic' ? 'mic' : 'serial'); }
  };
})();
