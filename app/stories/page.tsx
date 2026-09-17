import Link from "next/link";
import { db } from "@/lib/db";
import type { Metadata } from "next";
export const metadata: Metadata = { title: "Истории", description: "Рассказы с иллюстрациями: тексты, созданные воображением и образами. Только 18+.", alternates: { canonical: "/stories" } };
export const dynamic = "force-dynamic";
export default async function Stories() {
  const stories = await db.story.findMany({ where:{status:"PUBLISHED",deletedAt:null}, include:{author:true,illustrations:{orderBy:{sortOrder:"asc"},take:1}}, orderBy:{publishedAt:"desc"} });
  return <section className="section"><span className="eyebrow">Коллекция</span><h1>Истории</h1><p className="lead">Рассказы, созданные воображением, словами и образами.</p><div className="masonry">{stories.map(s=><article className="card" key={s.id}><Link href={`/stories/${s.slug}`}>{s.illustrations[0]&&<img src={`/api/stories/images/${s.illustrations[0].id}`} alt={`${s.title} — иллюстрированный рассказ`} loading="lazy" width={s.illustrations[0].width} height={s.illustrations[0].height}/>}<div className="card-body"><h2>{s.title}</h2><p>{s.description||s.body.slice(0,160)}</p><small>{s.author.displayName||"Автор"}</small></div></Link></article>)}</div>{!stories.length&&<div className="empty">Историй пока нет.</div>}</section>;
}
