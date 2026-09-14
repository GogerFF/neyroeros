"use client";
import { useState } from "react";

export function CopyWalletButton({ wallet }: { wallet: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(wallet);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard unavailable */ }
  };
  return <button className="copy-wallet" onClick={copy} aria-label="Скопировать адрес">{copied ? "✓ Скопировано" : "Копировать"}</button>;
}
