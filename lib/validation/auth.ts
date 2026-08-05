import { z } from "zod";

const password = z.string().min(10, "Минимум 10 символов").regex(/[A-ZА-Я]/, "Нужна заглавная буква").regex(/[a-zа-я]/, "Нужна строчная буква").regex(/\d/, "Нужна цифра").regex(/[^\p{L}\p{N}]/u, "Нужен специальный символ");
export const registerSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  password,
  displayName: z.string().trim().min(2).max(40),
  website: z.string().max(0).optional().default(""),
});
export const loginSchema = z.object({ email: z.string().trim().toLowerCase().email(), password: z.string().min(1) });
