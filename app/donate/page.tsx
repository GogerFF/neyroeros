import type { Metadata } from "next";
import Link from "next/link";
import { getLocale } from "@/lib/i18n-server";
import { CopyWalletButton } from "@/components/copy-wallet-button";

export const dynamic = "force-dynamic";

const WALLET = "0x2E3ad5715c1c072C4c769a4bcbc6F806FaD0bb39";

export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "Поддержать проект",
    description: "Поддержите Neyroeros донатом USDT (TRC-сеть не используется — только сеть ERC-20/BEP-20 совместимые кошельки).",
    alternates: { canonical: "/donate" },
  };
}

const text = {
  ru: { eyebrow: "Поддержка", title: "Поддержать проект", lead: "Neyroeros живёт на энтузиазме и донатах. Если платформа вам нравится — любая сумма помогает платить за сервер и развитие.", network: "Сеть", networkValue: "ERC-20 (Ethereum) — совместимые кошельки", token: "Токен", tokenValue: "Tether USD (USDT)", warning: "Отправляйте только активы Tether USD (USDT) на этот адрес. Остальные активы будут безвозвратно утеряны.", thanks: "Спасибо, что помогаете проекту жить." },
  en: { eyebrow: "Support", title: "Support the project", lead: "Neyroeros runs on passion and donations. If you enjoy the platform, any amount helps cover servers and development.", network: "Network", networkValue: "ERC-20 (Ethereum) — compatible wallets", token: "Token", tokenValue: "Tether USD (USDT)", warning: "Send only Tether USD (USDT) assets to this address. Any other assets will be permanently lost.", thanks: "Thank you for keeping the project alive." },
  zh: { eyebrow: "支持", title: "支持项目", lead: "Neyroeros 靠热情和捐赠运行。如果您喜欢这个平台，任何金额都有助于支付服务器和开发费用。", network: "网络", networkValue: "ERC-20（以太坊）— 兼容钱包", token: "代币", tokenValue: "Tether USD (USDT)", warning: "请仅向此地址发送 Tether USD (USDT) 资产。其他资产将永久丢失。", thanks: "感谢您帮助项目继续发展。" },
};

export default async function DonatePage() {
  const locale = await getLocale();
  const m = text[locale as keyof typeof text] ?? text.ru;
  return <section className="section donate-page">
    <span className="eyebrow">{m.eyebrow}</span>
    <h1>{m.title}</h1>
    <p className="lead">{m.lead}</p>
    <div className="panel donate-card">
      <div className="donate-row"><span>{m.network}</span><b>{m.networkValue}</b></div>
      <div className="donate-row"><span>{m.token}</span><b>{m.tokenValue}</b></div>
      <div className="donate-wallet">
        <code>{WALLET}</code>
        <CopyWalletButton wallet={WALLET}/>
      </div>
      <p className="donate-warning">{m.warning}</p>
    </div>
    <p className="category-hint">{m.thanks}</p>
    <p className="category-hint"><Link href="/">← Neyroeros</Link></p>
  </section>;
}
