export type AllowedImageMime = "image/jpeg"|"image/png"|"image/webp";
export function detectImageType(data: Buffer): AllowedImageMime {
  if (data.length >= 3 && data[0]===0xff && data[1]===0xd8 && data[2]===0xff) return "image/jpeg";
  if (data.length >= 8 && data.subarray(0,8).equals(Buffer.from([0x89,0x50,0x4e,0x47,0x0d,0x0a,0x1a,0x0a]))) return "image/png";
  if (data.length >= 12 && data.toString("ascii",0,4)==="RIFF" && data.toString("ascii",8,12)==="WEBP") return "image/webp";
  throw new Error("Неподдерживаемый формат изображения");
}
