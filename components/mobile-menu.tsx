"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

export function MobileMenu({ label, links, auth }: { label: string; links: { href: string; name: string }[]; auth: { href: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const firstLinkRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    if (open) firstLinkRef.current?.focus();
    else buttonRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      buttonRef.current?.focus();
    };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);
  return <div className="mobile-menu">
    <button ref={buttonRef} className="mobile-menu-button" aria-expanded={open} aria-controls="mobile-drawer" aria-label={label} onClick={() => setOpen(v => !v)}>
      <span/><span/><span/>
    </button>
    {open && <div id="mobile-drawer" className="mobile-drawer" role="dialog" aria-modal="true" aria-label={label}>
      <nav>{links.map((l, i) => <Link key={l.href} href={l.href} ref={i === 0 ? firstLinkRef : undefined} onClick={() => setOpen(false)}>{l.name}</Link>)}</nav>
      <div className="mobile-drawer-auth">{auth.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.name}</Link>)}</div>
    </div>}
  </div>;
}
