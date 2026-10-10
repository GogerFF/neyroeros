import Link from "next/link";
import { db } from "@/lib/db";
import { categoryLabel } from "@/lib/i18n";
import { getLocale, getMessages } from "@/lib/i18n-server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Категории AI-искусства",
  description: "Все категории Neyroeros: портреты, фэнтези, киберпанк и другие направления нейросетевого искусства 18+.",
  alternates: { canonical: "/categories" },
};
export const dynamic = "force-dynamic";

export default async function Categories() {
  const [groups, locale, m] = await Promise.all([
    db.artwork.groupBy({
      by: ["categoryId"],
      where: { status: "PUBLISHED", deletedAt: null, categoryId: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { categoryId: "desc" } },
    }),
    getLocale(),
    getMessages(),
  ]);
  const counts = new Map(groups.map((group) => [group.categoryId!, group._count._all]));
  const cats = await db.category.findMany({
    where: { id: { in: [...counts.keys()] }, isActive: true },
    select: { id: true, name: true, slug: true, description: true },
  });
  const ordered = cats.sort((a, b) => (counts.get(b.id) ?? 0) - (counts.get(a.id) ?? 0) || a.slug.localeCompare(b.slug));
  return <section className="section"><span className="eyebrow">{m.collections}</span><h1>{m.categories}</h1><div className="category-grid">{ordered.map((c) => { const x = categoryLabel(c.slug, locale, c); return <Link href={`/categories/${c.slug}`} key={c.id}><span>{counts.get(c.id) ?? 0} {m.works}</span><h2>{x.name}</h2><p>{x.description}</p></Link>; })}</div></section>;
}
