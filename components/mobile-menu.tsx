"use client";
import Link from "next/link";
import { useEffect, useState } from "react";

export function MobileMenu({ label, links, auth }: { label: string; links: { href: string; name: string }[]; auth: { href: string; name: string }[] }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; window.removeEventListener("keydown", onKey); };
  }, [open]);
  return <div className="mobile-menu">
    <button className="mobile-menu-button" aria-expanded={open} aria-label={label} onClick={() => setOpen(v => !v)}>
      <span/><span/><span/>
    </button>
    {open && <div className="mobile-drawer" role="dialog" aria-label={label}>
      <nav>{links.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.name}</Link>)}</nav>
      <div className="mobile-drawer-auth">{auth.map(l => <Link key={l.href} href={l.href} onClick={() => setOpen(false)}>{l.name}</Link>)}</div>
    </div>}
  </div>;
}
