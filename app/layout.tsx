import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import "./globals.css";
import "./hero-video.css";
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
  openGraph: {
    siteName: "Neyroeros",
    type: "website",
    url: "https://neyroeros.com",
    locale: "ru_RU",
    images: [{ url: "/og-default.webp", width: 1200, height: 630, alt: "Neyroeros — AI art gallery" }],
  },
  twitter: { card: "summary_large_image", site: "@neyroeros", images: [{ url: "/og-default.webp", width: 1200, height: 630, alt: "Neyroeros — AI art gallery" }] },
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large" } },
  other: { rating: "adult", "pinterest-rich-pin": "true", "p:domain_verify": "0e96b8840d1ab015adb1df1e4dd8f66b" },
};

export default async function Layout({ children }: { children: React.ReactNode }) {
  const [accepted, locale, m] = await Promise.all([
    (await cookies()).get("age_confirmed")?.value === "1",
    getLocale(),
    getMessages(),
  ]);
  return <html lang={locale === "zh" ? "zh-CN" : locale}>
    <head><meta name="rating" content="adult"/></head>
    <body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema()) }}/>
    <YandexMetrika/>
    <Header/>
    <main>{children}</main>
    <footer><b>NEYROEROS</b><p>{m.footer}</p><small>© 2026 · <Link href="/rules" style={{ color: "inherit" }}>Правила</Link> · <Link href="/about" style={{ color: "inherit" }}>О проекте</Link></small></footer>
    {!accepted && <AgeGate m={m}/>}
  </body></html>;
}
