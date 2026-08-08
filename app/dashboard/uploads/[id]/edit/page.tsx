import { notFound } from "next/navigation";
import { requireUser } from "@/lib/auth/guards";
import { db } from "@/lib/db";
import { categoryLabel } from "@/lib/i18n";
import { getLocale, getMessages } from "@/lib/i18n-server";

export default async function Edit({ params }: PageProps<"/dashboard/uploads/[id]/edit">) {
  const user = await requireUser();
  const { id } = await params;
  const [artwork, categories, locale, m] = await Promise.all([
    db.artwork.findFirst({ where: { id, authorId: user.id, status: { in: ["DRAFT", "REJECTED"] } } }),
    db.category.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getLocale(), getMessages(),
  ]);
  if (!artwork) notFound();

  return <section className="auth wide"><form action="/api/artworks/manage" method="post" className="panel">
    <h1>{m.editArtwork}</h1>
    <input type="hidden" name="id" value={id}/><input type="hidden" name="op" value="update"/><input type="hidden" name="sourceLocale" value={locale}/>
    <label>{m.title}<input name="title" minLength={2} maxLength={100} defaultValue={artwork.title} required/></label>
    <label>{m.description}<textarea name="description" minLength={20} maxLength={2000} defaultValue={artwork.description || ""} required/></label>
    <label>{m.category}<select name="categoryId" defaultValue={artwork.categoryId || ""} required><option value="" disabled>{m.noCategory}</option>{categories.map(c=><option key={c.id} value={c.id}>{categoryLabel(c.slug,locale,c).name}</option>)}</select></label>
    <button>{m.save}</button>
  </form></section>;
}
