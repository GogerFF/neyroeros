import { db } from "@/lib/db";
import { slugify } from "@/lib/utils";
import { storeStoryIllustration } from "@/lib/storage/story-storage";

export async function createStory(input: {
  authorId: string;
  title: string;
  body: string;
  description?: string;
  sourceLocale: string;
  illustrations: File[];
}) {
  if (input.title.trim().length < 2) throw new Error("Заголовок слишком короткий");
  if (input.body.trim().length < 20) throw new Error("Рассказ слишком короткий");
  if (input.illustrations.length > 30) throw new Error("Можно добавить не более 30 иллюстраций");
  const stored = await Promise.all(input.illustrations.map(async (file, index) => ({
    ...(await storeStoryIllustration(Buffer.from(await file.arrayBuffer()))),
    sortOrder: index,
  })));
  const category = await db.category.findUnique({ where: { slug: "stories" }, select: { id: true } });
  const slug = `${slugify(input.title) || "story"}-${crypto.randomUUID().slice(0, 8)}`;
  return db.story.create({
    data: {
      authorId: input.authorId,
      slug,
      title: input.title.trim(),
      body: input.body.trim(),
      description: input.description?.trim() || null,
      categoryId: category?.id || null,
      sourceLocale: input.sourceLocale,
      illustrations: { create: stored },
    },
    include: { illustrations: true },
  });
}
