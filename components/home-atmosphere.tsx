"use client";

import Link from "next/link";
import { useState } from "react";
import type { Locale } from "@/lib/i18n";

type Mood = "velvet" | "electric" | "silver";
const copy = {
  ru: {
    kicker: "Выберите способ смотреть",
    title: "У искусства нет одной температуры.",
    body: "Настройте вход в галерею — это редакторский маршрут, а не анализ изображений.",
    labels: { velvet: "Бархатная ночь", electric: "Электрический сад", silver: "Хромированный свет" },
    notes: { velvet: "Медленный взгляд · новый маршрут Flow", electric: "Искать импульс · другой маршрут Flow", silver: "Чистая форма · свой маршрут Flow" },
    universe: "Открыть Universe", flow: "Запустить Flow", trending: "Смотреть горячее", guide: "Как это работает", guideText: "Universe — карта категорий. Flow — по одной работе. Горячее — популярные работы."
  },
  en: {
    kicker: "Choose how to look",
    title: "Art has more than one temperature.",
    body: "Set your entrance to the gallery — an editorial route, not image mood analysis.",
    labels: { velvet: "Velvet night", electric: "Electric garden", silver: "Chrome light" },
    notes: { velvet: "Slow looking · a new Flow route", electric: "Find the pulse · a different Flow route", silver: "Pure form · your own Flow route" },
    universe: "Open Universe", flow: "Start Flow", trending: "View trending", guide: "How it works", guideText: "Universe maps categories. Flow shows one work at a time. Trending highlights popular works."
  },
  zh: {
    kicker: "选择观看方式",
    title: "艺术不止一种温度。",
    body: "选择进入画廊的路线——这是编辑策展，不是图像情绪分析。",
    labels: { velvet: "天鹅绒之夜", electric: "电光花园", silver: "铬色之光" },
    notes: { velvet: "慢慢观看 · 新的 Flow 路线", electric: "寻找脉冲 · 不同的 Flow 路线", silver: "纯粹形式 · 专属 Flow 路线" },
    universe: "打开 Universe", flow: "启动 Flow", trending: "查看热门", guide: "使用指南", guideText: "Universe 探索分类。Flow 每次展示一件作品。热门页展示受欢迎的作品。"
  }
} as const;

export function HomeAtmosphere({ locale }: { locale: Locale }) {
  const [mood, setMood] = useState<Mood>("velvet");
  const t = copy[locale];
  return <section className={`atmosphere atmosphere-${mood}`} aria-labelledby="atmosphere-title">
    <div className="atmosphere-index" aria-hidden="true"><span>01</span><i /></div>
    <div className="atmosphere-copy">
      <span className="atmosphere-kicker">{t.kicker}</span>
      <h2 id="atmosphere-title">{t.title}</h2>
      <p>{t.body}</p>
      <div className="atmosphere-modes" role="group" aria-label={t.kicker}>
        {(Object.keys(t.labels) as Mood[]).map(key => <button key={key} type="button" className={mood === key ? "is-active" : ""} aria-pressed={mood === key} onClick={() => setMood(key)}>{t.labels[key]}</button>)}
      </div>
      <p className="atmosphere-note" aria-live="polite"><span>↳</span> {t.notes[mood]}</p>
    </div>
    <div className="atmosphere-portals">
      <Link className="atmosphere-portal atmosphere-portal-main" href="/universe"><span>01 / MAP</span><strong>{t.universe}</strong><em>↗</em></Link>
      <Link className="atmosphere-portal" href={`/flow?seed=atmosphere-${mood}&step=0`}><span>02 / SEQUENCE</span><strong>{t.flow}</strong><em>↗</em></Link>
      <Link className="atmosphere-portal" href="/trending"><span>03 / SIGNAL</span><strong>{t.trending}</strong><em>↗</em></Link>
      <p className="atmosphere-guide-text">{t.guideText}</p>
      <Link className="atmosphere-guide" href="/about">{t.guide} <span>→</span></Link>
    </div>
  </section>;
}
