// Синхронизация с сервером (заготовка под клиент-серверный режим).
//
// Принцип: программа всегда работает в браузере сама по себе. Занятия,
// датчик, журнал и альбом живут на устройстве. Сервер — необязательный слой:
//   • нет интернета или сервер не задан → режим «только браузер», всё копится локально;
//   • сервер доступен → журнал отправляется на сервер, оттуда приходят
//     новые контент-пакеты и (позже) команды пульта педагога для экранов группы.
//
// Адрес сервера задаётся параметром ?server=https://... или в localStorage 'rl.server'.
// API сервера пока не существует. Пути ниже — предложение, сверить с командой COR:
//   GET  /api/health                → {ok:true}
//   POST /api/journal   [записи]    → {accepted:n}
//   GET  /api/content?since=версия  → [контент-пакеты]
window.RL = window.RL || {};

RL.Sync = (function () {
  const subs = new Set();
  let server = new URLSearchParams(location.search).get('server');
  try { server = server || localStorage.getItem('rl.server'); } catch (e) {}
  let state = { mode: 'offline', server: server || null, pending: 0, lastSync: null, error: null };

  function emit() { subs.forEach(fn => fn({ ...state })); }
  function pendingEntries() { return RL.Journal.list().filter(e => !e.synced); }

  async function check() {
    state.pending = pendingEntries().length;
    if (!state.server || !navigator.onLine) { state.mode = 'offline'; emit(); return; }
    try {
      const r = await fetch(state.server.replace(/\/$/, '') + '/api/health', { cache: 'no-store' });
      state.mode = r.ok ? 'online' : 'offline'; state.error = r.ok ? null : 'сервер ответил ' + r.status;
    } catch (e) { state.mode = 'offline'; state.error = 'сервер недоступен'; }
    emit();
    if (state.mode === 'online' && state.pending) push();
  }

  async function push() {
    const items = pendingEntries(); if (!items.length) return;
    try {
      const r = await fetch(state.server.replace(/\/$/, '') + '/api/journal', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(items) });
      if (!r.ok) throw new Error('код ' + r.status);
      RL.Journal.markSynced(items.map(e => e.date));
      state.lastSync = new Date().toISOString(); state.pending = 0; state.error = null;
    } catch (e) { state.error = 'не удалось отправить: ' + e.message; }
    emit();
  }

  window.addEventListener('online', check);
  window.addEventListener('offline', check);
  setInterval(check, 60000);
  setTimeout(check, 500);

  return {
    subscribe(fn) { subs.add(fn); fn({ ...state }); },
    setServer(url) { state.server = url || null; try { url ? localStorage.setItem('rl.server', url) : localStorage.removeItem('rl.server'); } catch (e) {} check(); },
    check, get state() { return { ...state }; }
  };
})();
