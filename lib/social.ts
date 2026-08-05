import { z } from "zod";

export const commentSchema = z.object({
  content: z.string().trim().min(1, "Комментарий не может быть пустым").max(1000, "Комментарий слишком длинный"),
});

export function buildShareUrls(url: string, title: string, media: string) {
  const u = encodeURIComponent(url), t = encodeURIComponent(title), m = encodeURIComponent(media);
  return {
    telegram: `https://t.me/share/url?url=${u}&text=${t}`,
    x: `https://twitter.com/intent/tweet?url=${u}&text=${t}`,
    pinterest: `https://www.pinterest.com/pin/create/button/?url=${u}&media=${m}&description=${t}`,
    reddit: `https://www.reddit.com/submit?url=${u}&title=${t}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
  };
}
