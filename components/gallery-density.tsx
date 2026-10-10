"use client";

import { useSyncExternalStore, type ReactNode } from "react";
import type { Locale } from "@/lib/i18n";
const key = "neyroeros.gallery-density";
const event = "neyroeros:density";
function readDensity() {
  try { return localStorage.getItem(key) === "compact" ? "compact" : "comfortable"; } catch { return "comfortable"; }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(event, callback);
  return () => { window.removeEventListener("storage", callback); window.removeEventListener(event, callback); };
}
const labels = {
  ru: { title: "Плотность галереи", comfortable: "Крупнее", compact: "Компактнее" },
  en: { title: "Gallery density", comfortable: "Comfortable", compact: "Compact" },
  zh: { title: "画廊密度", comfortable: "舒适", compact: "紧凑" },
};
export function GalleryDensity({ children, locale }: { children: ReactNode; locale: Locale }) {
  const density = useSyncExternalStore(subscribe, readDensity, () => "comfortable");
  const text = labels[locale];
  function setDensity(value: string) {
    try { localStorage.setItem(key, value); } catch { /* Storage may be disabled. */ }
    window.dispatchEvent(new Event(event));
  }
  return <div className="gallery-density" data-density={density}>
    <div className="density-controls" role="group" aria-label={text.title}><span>{text.title}</span>{(["comfortable", "compact"] as const).map(value => <button type="button" className="ghost" key={value} data-testid={`density-${value}`} aria-pressed={density === value} onClick={() => setDensity(value)}>{text[value]}</button>)}</div>
    {children}
  </div>;
}
