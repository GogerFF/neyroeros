import Link from"next/link";
import{auth}from"@/auth";
import{logoutAction}from"@/app/actions";
import{getLocale,getMessages}from"@/lib/i18n-server";
import{LanguageSwitcher}from"./language-switcher";

export async function Header(){
  const[s,l,m]=await Promise.all([auth(),getLocale(),getMessages()]);
  const isAdmin=["ADMIN","MODERATOR"].includes(s?.user.role||"");
  return <header><Link className="brand" href="/"><b>NEYROEROS</b></Link>
  <nav>
    <Link href="/categories">{m.categories}</Link>
    <Link href="/top">{m.top}</Link>
    <Link href="/trending">{m.trending}</Link>
    <Link href="/newcomers">{m.newcomers}</Link>
    <Link href="/discover">{m.discover}</Link>
    <Link href="/collections">{m.collections}</Link>
    <Link href="/stories">{m.stories}</Link>
    {isAdmin&&<details className="admin-menu"><summary>Админ</summary><div className="admin-drop"><Link href="/admin">Модерация</Link><Link href="/admin/hero">Видео hero</Link></div></details>}
  </nav>
  <div>
    <Link href="/search" className="ghost">{m.search}</Link>
    <LanguageSwitcher locale={l} label={m.language}/>
    {s?<><Link className="ghost" href="/dashboard">{m.studio}</Link><form action={logoutAction}><button className="ghost">{m.logout}</button></form></>
      :<Link className="button" href="/login">{m.login}</Link>}
  </div></header>;
}
