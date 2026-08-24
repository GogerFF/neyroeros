export const ADMIN_VIDEO_MAX_BYTES = 50 * 1024 * 1024;

export function adminVideoSizeIsAllowed(size: number) {
  return Number.isInteger(size) && size > 0 && size <= ADMIN_VIDEO_MAX_BYTES;
}

export function adminVideoMimeFromHeader(data: Buffer): "video/mp4" | "video/webm" {
  if (data.length >= 8 && data.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  if (data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  throw new Error("Поддерживаются только MP4 и WebM");
}
