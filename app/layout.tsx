import type { Metadata } from "next";
import Link from "next/link";
import { cookies } from "next/headers";
import { Cormorant, Oswald } from "next/font/google";
import "./globals.css";
import "./hero-video.css";
import "./discovery.css";
import "./home-atmosphere.css";
import "./design-system.css";
import { Header } from "@/components/header";
import { getLocale, getMessages } from "@/lib/i18n-server";
import { YandexMetrika } from "@/components/yandex-metrika";
import { ScrollTopButton } from "@/components/scroll-top";
import { TrafficTracker } from "@/components/traffic-tracker";
import { webSiteSchema } from "@/lib/seo";

const displayFont = Cormorant({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-display",
});

const displayCapsFont = Oswald({
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
  display: "swap",
  variable: "--font-display-caps",
});

export const metadata: Metadata = {
  metadataBase: new URL("https://neyroeros.com"),
  title: { default: "Neyroeros — AI-искусство 18+ для взрослых: галерея, видео, истории", template: "%s · Neyroeros" },
  description: "Кураторская галерея AI-искусства 18+: нейро-эротика, цифровые работы, AI-видео и рассказы. Ручная модерация, только взрослые.",
  keywords: ["AI art", "AI-искусство", "нейроэротика", "AI 18+", "AI видео", "цифровая эротика", "AI art gallery", "нейросеть искусство"],
  alternates: { canonical: "/", types: { "application/rss+xml": "https://neyroeros.com/feed.xml" } },
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
  const [locale, m] = await Promise.all([getLocale(), getMessages()]);
  return <html lang={locale === "zh" ? "zh-CN" : locale} className={`${displayFont.variable} ${displayCapsFont.variable}`}>
    <head><meta name="RATING" content="RTA-5042-1996-1400-1577-RTA"/></head>
    <body>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(webSiteSchema()) }}/>
    <YandexMetrika/>
        <TrafficTracker/>
        <Header/>
    <main>{children}</main>
    <ScrollTopButton/>
    <footer><b>NEYROEROS</b><p>{m.footer}</p><p className="footer-disclaimer">{m.footerDisclaimer}</p><small>© 2026 · <Link href="/rules" style={{ color: "inherit" }}>{m.footerRules}</Link> · <Link href="/takedown" style={{ color: "inherit" }}>{m.footerTakedown}</Link> · <Link href="/about" style={{ color: "inherit" }}>{m.footerAbout}</Link> · <Link href="/donate" style={{ color: "var(--accent)" }}>{m.donate}</Link></small></footer>
  </body></html>;
}
