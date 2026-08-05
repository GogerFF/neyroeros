import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function slugify(value: string) { return value.toLowerCase().trim().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, ""); }
export function formatDate(date: Date | string) { return new Intl.DateTimeFormat("ru-RU", { day:"numeric", month:"long", year:"numeric" }).format(new Date(date)); }
