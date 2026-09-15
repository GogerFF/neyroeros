import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { CopyWalletButton } from "@/components/copy-wallet-button";
import { DONATE_TEXT, DONATE_WALLET } from "@/lib/donate";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Поддержать проект",
    description: "Поддержите Neyroeros донатом USDT в сети ERC-20. Принимаются только активы Tether USD.",
    alternates: { canonical: "/donate" },
  };
}

export default async function DonatePage() {
  const locale = await getLocale();
  const m = DONATE_TEXT[locale as keyof typeof DONATE_TEXT] ?? DONATE_TEXT.ru;
  return <section className="section donate-page">
    <span className="eyebrow">{m.eyebrow}</span>
    <h1>{m.title}</h1>
    <p className="lead">{m.lead}</p>
    <div className="panel donate-card">
      <div className="donate-row"><span>{m.network}</span><b>{m.networkValue}</b></div>
      <div className="donate-row"><span>{m.token}</span><b>{m.tokenValue}</b></div>
      <div className="donate-wallet">
        <code>{DONATE_WALLET}</code>
        <CopyWalletButton wallet={DONATE_WALLET}/>
      </div>
      <p className="donate-warning">{m.warning}</p>
    </div>
    <p className="category-hint">{m.thanks}</p>
    <p className="category-hint"><Link href="/">← Neyroeros</Link></p>
  </section>;
}
