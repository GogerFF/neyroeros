import type { Metadata } from "next";
import { cookies } from "next/headers";
import "./globals.css";
import { Header } from "@/components/header";
import { AgeGate } from "@/components/age-gate";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { YandexMetrika } from "@/components/yandex-metrika";
import { webSiteSchema } from "@/lib/seo";

export const metadata: Metadata = {
  metadataBase: new URL("https://neyroeros.com"),
  title: { default: "Neyroeros", template: "%s · Neyroeros" },
  description: "Кураторская галерея AI-искусства для взрослых: работы, категории и рассказы. Только 18+.",
  alternates: { canonical: "/" },
  openGraph: { siteName: "Neyroeros", type: "website", url: "https://neyroeros.com", locale: "ru_RU" },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [accepted, locale, m] = await Promise.all([
    (await cookies()).get("age_confirmed")?.value === "1",
    getLocale(),
    getMessages(),
  ]);
  return <html lang={locale === "zh" ? "zh-CN" : locale}><body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema()) }}/>
    <YandexMetrika/>
    <Header/>
    <main>{children}</main>
    <footer><b>NEYROEROS</b><p>{m.footer}</p><small>© 2026 · {m.rules}</small></footer>
    {!accepted && <AgeGate m={m}/>}
  </body></html>;
}
