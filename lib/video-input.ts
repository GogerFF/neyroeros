export function videoMimeFromHeader(data: Buffer): "video/mp4" | "video/webm" {
  if (data.length >= 8 && data.toString("ascii", 4, 8) === "ftyp") return "video/mp4";
  if (data.length >= 4 && data.subarray(0, 4).equals(Buffer.from([0x1a, 0x45, 0xdf, 0xa3]))) return "video/webm";
  throw new Error("Поддерживаются только MP4 и WebM");
}

export function videoDurationIsAllowed(seconds: number) {
  return Number.isFinite(seconds) && seconds >= 5 && seconds <= 180;
}
