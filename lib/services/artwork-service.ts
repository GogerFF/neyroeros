import { db } from "@/lib/db";
import { slugifyLatin } from "@/lib/utils";
import { normalizeArtworkTags } from "@/lib/artwork-input";
import { storeImage } from "@/lib/storage/local-storage";
import { validatePolicyAcknowledgement } from "@/lib/policy";
import { canEditArtwork, transitionArtwork } from "@/lib/artwork-state";

export async function createArtwork(userId: string, input: {
  title: string; description?: string; sourceLocale?: string; categoryId?: string;
  tags?: string; file: File; adults: boolean; consensual: boolean; noDeepfake: boolean;
}) {
  validatePolicyAcknowledgement(input);
  const title = input.title.trim();
  if (title.length < 2 || title.length > 100) throw new Error("Название должно содержать от 2 до 100 символов");
  const buffer = Buffer.from(await input.file.arrayBuffer());
  const asset = await storeImage(buffer);
  const tags = normalizeArtworkTags(input.tags || "");
  const slug = `${slugifyLatin(title)}-${crypto.randomUUID().slice(0, 8)}`;

  return db.$transaction(async (tx) => {
    const artwork = await tx.artwork.create({
      data: {
        authorId: userId, title, description: input.description?.trim() || null,
        sourceLocale: input.sourceLocale || "ru", categoryId: input.categoryId || null,
        slug, asset: { create: asset },
      },
      include: { asset: true },
    });

    for (const name of tags) {
      const tag = await tx.tag.upsert({
        where: { name },
        create: { name, slug: `${slugifyLatin(name)}-${crypto.randomUUID().slice(0, 6)}` },
        update: {},
      });
      await tx.artworkTag.create({ data: { artworkId: artwork.id, tagId: tag.id, source: "USER" } });
    }
    return artwork;
  });
}

export async function updateArtwork(userId: string, id: string, data: { title?: string; description?: string; sourceLocale?: string; categoryId?: string | null }) {
  const a = await db.artwork.findUniqueOrThrow({ where: { id } });
  if (!canEditArtwork(a, userId)) throw new Error("Редактирование запрещено");
  return db.$transaction(async tx => {
    await tx.artworkTranslation.deleteMany({ where: { artworkId: id } });
    return tx.artwork.update({ where: { id }, data });
  });
}

export async function submitArtwork(userId: string, id: string) {
  const a = await db.artwork.findUniqueOrThrow({ where: { id } });
  if (!canEditArtwork(a, userId)) throw new Error("Отправка запрещена");
  transitionArtwork(a.status, "PENDING");
  return db.$transaction([
    db.artwork.update({ where: { id }, data: { status: "PENDING", submittedAt: new Date() } }),
    db.moderationAction.create({ data: { artworkId: id, moderatorId: userId, action: "SUBMIT", fromStatus: a.status, toStatus: "PENDING" } }),
  ]);
}

export async function deleteArtwork(userId: string, id: string) {
  const a = await db.artwork.findUniqueOrThrow({ where: { id } });
  if (a.authorId !== userId || !["DRAFT", "REJECTED"].includes(a.status)) throw new Error("Удаление запрещено");
  return db.artwork.update({ where: { id }, data: { status: "DELETED", deletedAt: new Date() } });
}
