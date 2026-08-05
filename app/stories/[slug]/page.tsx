import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { absoluteUrl, storySchema } from "@/lib/seo";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const story = await db.story.findFirst({ where: { slug, status: "PUBLISHED", deletedAt: null } });
  if (!story) return { title: "Neyroeros" };
  return {
    title: story.title,
    description: story.description?.slice(0, 155) ?? story.body.slice(0, 155),
    alternates: { canonical: `/stories/${story.slug}` },
  };
}

export default async function StoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const story = await db.story.findFirst({
    where: { slug, status: "PUBLISHED", deletedAt: null },
    include: { author: true, illustrations: { orderBy: { sortOrder: "asc" } } },
  });
  if (!story) notFound();

  const paragraphs = story.body.split(/\n\s*\n/).map((paragraph) => paragraph.trim()).filter(Boolean);
  const illustrationIndex = (paragraphIndex: number) => {
    if (!story.illustrations.length || !paragraphs.length) return -1;
    const index = Math.floor(((paragraphIndex + 1) * story.illustrations.length) / (paragraphs.length + 1));
    return Math.min(index, story.illustrations.length - 1);
  };
  const usedIllustrations = new Set<number>();

  const schema = storySchema({
    title: story.title,
    slug: story.slug,
    description: story.description,
    authorName: story.author.displayName,
    datePublished: story.publishedAt,
    imageUrl: story.illustrations[0] ? absoluteUrl(`/api/stories/images/${story.illustrations[0].id}`) : undefined,
  });

  return <article className="story-page">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}/>
    <header className="story-header">
      <span className="eyebrow">История · {story.author.displayName || "Автор"}</span>
      <h1>{story.title}</h1>
      {story.description && <p className="story-dek">{story.description}</p>}
      <div className="story-rule"/>
    </header>
    <div className="story-content">
      {paragraphs.map((paragraph, index) => {
        const imageIndex = illustrationIndex(index);
        const illustration = imageIndex >= 0 && !usedIllustrations.has(imageIndex) ? story.illustrations[imageIndex] : null;
        if (illustration) usedIllustrations.add(imageIndex);
        return <section className="story-section" key={index}>
          <p>{paragraph}</p>
          {illustration && <figure className="story-illustration">
            <img src={`/api/stories/images/${illustration.id}`} alt={`${story.title} — иллюстрация ${imageIndex + 1}`}/>
            <figcaption>Иллюстрация {imageIndex + 1}</figcaption>
          </figure>}
        </section>;
      })}
      {story.illustrations.map((illustration, index) => !usedIllustrations.has(index) && <figure className="story-illustration" key={illustration.id}>
        <img src={`/api/stories/images/${illustration.id}`} alt={`${story.title} — иллюстрация ${index + 1}`}/>
        <figcaption>Иллюстрация {index + 1}</figcaption>
      </figure>)}
    </div>
  </article>;
}
