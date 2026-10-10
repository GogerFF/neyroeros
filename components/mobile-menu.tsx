"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileMenu({ label, links, auth }: { label: string; links: { href: string; name: string }[]; auth: { href: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    firstLinkRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopImmediatePropagation();
        setOpen(false);
        buttonRef.current?.focus();
      }
      if (e.key === "Tab") {
        const controls = containerRef.current?.querySelectorAll<HTMLElement>('button, a[href]');
        if (!controls?.length) return;
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey, true);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey, true);
    };
  }, [open]);
  return <div ref={containerRef} className="mobile-menu">
    <button ref={buttonRef} type="button" className="mobile-menu-button" aria-expanded={open} aria-controls="mobile-drawer" aria-label={label} onClick={() => setOpen(v => !v)}>
      <span/><span/><span/>
    </button>
    {open && <div id="mobile-drawer" className="mobile-drawer">
      <nav aria-label={label}>{links.map((l, i) => <Link key={l.href} href={l.href} ref={i === 0 ? firstLinkRef : undefined} onClick={() => setOpen(false)}>{l.name}</Link>)}</nav>
      <div className="mobile-drawer-auth">{auth.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.name}</Link>)}</div>
    </div>}
  </div>;
}
