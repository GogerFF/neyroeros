"use client";

import Link from "next/link";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

type Item = { id: string; slug: string; title: string };

function hrefFor(slug: string, categorySlug?: string) {
  return categorySlug ? `/artwork/${slug}?category=${categorySlug}` : `/artwork/${slug}`;
}

function isTypingTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || target.isContentEditable;
}

export function ArtworkNavigator({ current, items, categorySlug }: { current: string; items: Item[]; categorySlug?: string }) {
  const position = items.findIndex((item) => item.slug === current);
  const previous = position > 0 ? items[position - 1] : null;
  const next = position >= 0 && position < items.length - 1 ? items[position + 1] : null;
  const backHref = categorySlug ? `/categories/${categorySlug}` : "/";

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (isTypingTarget(event.target)) return;
      if (event.key === "ArrowLeft" && previous) location.assign(hrefFor(previous.slug, categorySlug));
      if (event.key === "ArrowRight" && next) location.assign(hrefFor(next.slug, categorySlug));
      if (event.key === "Escape") location.assign(backHref);
    };
    addEventListener("keydown", onKey);
    return () => removeEventListener("keydown", onKey);
  }, [previous, next, categorySlug, backHref]);

  if (position < 0 || items.length < 2) return null;
  return <nav className="art-navigator" aria-label="Навигация по работам">
    <Link className="art-nav-close" href={backHref} aria-label="Вернуться к галерее"><X size={20}/></Link>
    <span>{position + 1} / {items.length}</span>
    <div>
      {previous ? <Link href={hrefFor(previous.slug, categorySlug)} aria-label="Предыдущая работа"><ChevronLeft size={24}/></Link> : <span className="disabled"><ChevronLeft size={24}/></span>}
      {next ? <Link href={hrefFor(next.slug, categorySlug)} aria-label="Следующая работа"><ChevronRight size={24}/></Link> : <span className="disabled"><ChevronRight size={24}/></span>}
    </div>
  </nav>;
}
