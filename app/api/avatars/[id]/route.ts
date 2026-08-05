import { db } from "@/lib/db";
import { readStored } from "@/lib/storage/local-storage";

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const avatar = await db.userAvatar.findUnique({ where: { userId: id } });
  if (!avatar) return new Response("Не найдено", { status: 404 });
  return new Response(await readStored(avatar.storageKey), {
    headers: {
      "content-type": avatar.mimeType,
      "cache-control": "public, max-age=3600, stale-while-revalidate=86400",
      "x-content-type-options": "nosniff",
    },
  });
}
