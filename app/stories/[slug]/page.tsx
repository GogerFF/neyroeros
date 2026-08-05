import { notFound } from "next/navigation";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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

  return <article className="story-page">
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
