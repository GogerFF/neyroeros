import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().trim().min(2, "Название категории должно содержать минимум 2 символа").max(60),
  description: z.string().trim().max(240).optional().default(""),
});

export function slugifyCategory(value: string) {
  const translit: Record<string, string> = { а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ё:"e",ж:"zh",з:"z",и:"i",й:"y",к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",ф:"f",х:"h",ц:"ts",ч:"ch",ш:"sh",щ:"sch",ъ:"",ы:"y",ь:"",э:"e",ю:"yu",я:"ya" };
  return [...value.toLowerCase().trim()].map(char => translit[char] ?? char).join("")
    .normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}
