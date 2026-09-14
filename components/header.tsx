import Link from "next/link";
import { auth } from "@/auth";
import { logoutAction } from "@/app/actions";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { LanguageSwitcher } from "./language-switcher";
import { MobileMenu } from "./mobile-menu";

export async function Header(){
  const[s,l,m]=await Promise.all([auth(),getLocale(),getMessages()]);
  const isAdmin=["ADMIN","MODERATOR"].includes(s?.user.role||"");
  const drawerLinks=[
    { href: "/categories", name: m.categories },
    { href: "/top", name: m.top },
    { href: "/trending", name: m.trending },
    { href: "/newcomers", name: m.newcomers },
    { href: "/discover", name: m.discover },
    { href: "/collections", name: m.collections },
    { href: "/videos", name: m.videos },
    { href: "/stories", name: m.stories },
    ...(isAdmin ? [{ href: "/admin", name: m.moderation }] : []),
  ];
  const drawerAuth = s
    ? [{ href: "/dashboard", name: m.studio }]
    : [{ href: "/login", name: m.login }];
  return <header><Link className="brand" href="/"><b>NEYROEROS</b></Link>
  <nav>
    <Link href="/categories">{m.categories}</Link>
    <Link href="/top">{m.top}</Link>
    <Link href="/trending">{m.trending}</Link>
    <Link href="/newcomers">{m.newcomers}</Link>
    <Link href="/discover">{m.discover}</Link>
    <Link href="/collections">{m.collections}</Link>
    <Link href="/videos">{m.videos}</Link>
    <Link href="/stories">{m.stories}</Link>
    {isAdmin&&<details className="admin-menu"><summary>{m.admin}</summary><div className="admin-drop"><Link href="/admin">{m.moderation}</Link><Link href="/admin/videos">{m.videoModeration}</Link><Link href="/admin/hero">{m.heroVideo}</Link></div></details>}
  </nav>
  <div className="header-actions">
    <Link href="/search" className="ghost search-link" aria-label={m.search}>
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>
    </Link>
    <LanguageSwitcher locale={l} label={m.language}/>
    {s?<><Link className="ghost header-studio" href="/dashboard">{m.studio}</Link><form action={logoutAction}><button className="ghost header-logout">{m.logout}</button></form></>
      :<Link className="button header-login" href="/login">{m.login}</Link>}
    <MobileMenu label={m.menu} links={drawerLinks} auth={drawerAuth}/>
  </div></header>;
}
