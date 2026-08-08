import { z } from "zod";

const reserved = new Set(["admin", "api", "artwork", "authors", "categories", "collections", "dashboard", "login", "register", "search", "stories", "top", "trending"]);

export function normalizeHandle(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 32);
}

export const profileSchema = z.object({
  handle: z.string().transform(normalizeHandle).refine((x) => x.length >= 3 && !reserved.has(x), "Введите уникальный handle из 3–32 символов"),
  bio: z.string().trim().max(500, "Биография не может быть длиннее 500 символов"),
});
