import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Подтверждение возраста",
  description: "Neyroeros — платформа 18+. Подтвердите совершеннолетие для входа.",
  robots: { index: false, follow: false },
};

export default async function AgeGatePage({ searchParams }: { searchParams: Promise<{ returnTo?: string }> }) {
  const { returnTo } = await searchParams;
  const safeReturn = returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") ? returnTo : "/";
  return (
    <div className="gate gate-standalone" lang="ru">
      <div className="modal">
        <span className="eyebrow">NEYROEROS · 18+</span>
        <h2>Вам уже исполнилось 18 лет?</h2>
        <p>Платформа содержит художественные изображения 18+. Подтверждая возраст, вы соглашаетесь с правилами сообщества.</p>
        <form action="/api/age-confirm" method="post" className="gate-actions">
          <input type="hidden" name="returnTo" value={safeReturn}/>
          <button type="submit" name="confirm" value="1">Да, мне есть 18</button>
          <a className="ghost" href="https://www.google.com">Нет, покинуть сайт</a>
        </form>
        <p className="gate-links"><a href="/rules">Правила сообщества</a></p>
      </div>
    </div>
  );
}
