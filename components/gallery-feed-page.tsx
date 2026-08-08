import { notFound } from "next/navigation";
import { ArtworkGrid } from "@/components/artwork-grid";
import { getGalleryFeed, type GalleryFeedKind } from "@/lib/gallery-feed";
import { getLocale, getMessages, localizeArtworks } from "@/lib/i18n-server";

const copy: Record<GalleryFeedKind, { eyebrow: string; title: string; description: string }> = {
  top: { eyebrow: "Рейтинг", title: "Топ работ", description: "Рейтинг по общему числу лайков. При равенстве выше работа с большим числом уникальных просмотров." },
  trending: { eyebrow: "Горячее", title: "Trending", description: "Свежая активность за 72 часа: лайки важнее просмотров, а старые работы постепенно теряют вес." },
  newcomers: { eyebrow: "Новые авторы", title: "Новички", description: "Работы авторов с максимум тремя публикациями и аккаунтом младше 30 дней." },
  discover: { eyebrow: "Исследуйте", title: "Discover", description: "Свежий порядок открытий на сегодня. Завтра подборка изменится — не из-за случайной кнопки, а по ежедневному устойчивому порядку." },
};

export async function GalleryFeedPage({ kind }: { kind: GalleryFeedKind }) {
  const [raw, locale, m] = await Promise.all([getGalleryFeed(kind), getLocale(), getMessages()]);
  const works = await localizeArtworks(raw, locale);
  const page = copy[kind];
  return <section className="section"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p className="lead">{page.description}</p><ArtworkGrid items={works} locale={locale} m={m}/></section>;
}

export function ensureFeed(value: string): GalleryFeedKind {
  if (["top", "trending", "newcomers", "discover"].includes(value)) return value as GalleryFeedKind;
  notFound();
}
