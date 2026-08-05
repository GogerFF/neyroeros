import { db } from "@/lib/db";
import { auth } from "@/auth";
import { readStoryImage } from "@/lib/storage/story-storage";
export async function GET(_:Request,{params}:{params:Promise<{id:string}>}){
  const {id}=await params;
  const image=await db.storyIllustration.findUnique({where:{id},include:{story:true}});
  if(!image) return new Response("Не найдено",{status:404});
  const session=await auth();
  const canSee=image.story.status==="PUBLISHED"&&!image.story.deletedAt || session?.user?.id===image.story.authorId || ["ADMIN","MODERATOR"].includes(session?.user?.role||"");
  if(!canSee)return new Response("Не найдено",{status:404});
  const cacheControl = image.story.status === "PUBLISHED" ? "public, max-age=86400" : "private, no-store";
  return new Response(await readStoryImage(image.previewKey), { headers: { "content-type": "image/webp", "cache-control": cacheControl, "x-content-type-options": "nosniff" } });
}
