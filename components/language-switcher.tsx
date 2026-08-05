"use client";
import { useRouter } from "next/navigation";
import type { Locale } from "@/lib/i18n";
export function LanguageSwitcher({locale,label}:{locale:Locale;label:string}){const router=useRouter();return <label className="language-switcher"><span className="sr-only">{label}</span><select aria-label={label} value={locale} onChange={e=>{document.cookie=`locale=${e.target.value}; Max-Age=31536000; Path=/; SameSite=Lax`;router.refresh()}}><option value="ru">RU</option><option value="en">EN</option><option value="zh">中文</option></select></label>}
