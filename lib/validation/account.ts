import { z } from "zod";

export const strongPasswordSchema = z.string()
  .min(10, "Минимум 10 символов")
  .regex(/[A-ZА-Я]/, "Нужна заглавная буква")
  .regex(/[a-zа-я]/, "Нужна строчная буква")
  .regex(/\d/, "Нужна цифра")
  .regex(/[^\p{L}\p{N}]/u, "Нужен специальный символ");

export const changeEmailSchema = z.object({
  email: z.string().trim().toLowerCase().email("Некорректный email"),
  currentPassword: z.string().min(1, "Введите текущий пароль"),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Введите текущий пароль"),
  newPassword: strongPasswordSchema,
  confirmPassword: z.string(),
}).refine((value) => value.newPassword === value.confirmPassword, {
  message: "Пароли не совпадают",
  path: ["confirmPassword"],
});
