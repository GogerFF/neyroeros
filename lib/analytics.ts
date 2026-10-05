/**
 * Classification of a pageview for the admin analytics panel.
 *
 * Everything here is derived from request headers only - no IP is ever stored,
 * and country comes from the CDN/proxy header rather than a GeoIP lookup, so
 * this stays cheap on shared hosting.
 */

export type DeviceKind = "desktop" | "mobile" | "tablet" | "bot" | "other";

const BOT = /bot|crawl|spider|slurp|yandex|google|bing|ahrefs|semrush|curl|wget|python|scrapy|headless|pingdom|uptimerobot/i;

export function isBotUserAgent(ua: string): boolean {
  return BOT.test(ua || "");
}

export function classifyDevice(ua: string): DeviceKind {
  const s = ua || "";
  if (isBotUserAgent(s)) return "bot";
  // Tablet is checked before mobile: iPads advertise as mobile Safari too.
  if (/ipad|tablet|playbook|silk|kindle/i.test(s)) return "tablet";
  if (/mobi|android|iphone|ipod|windows phone|blackberry|opera mini/i.test(s)) return "mobile";
  if (/windows|macintosh|x11|linux|cros/i.test(s)) return "desktop";
  return "other";
}

/**
 * Referrer -> a coarse channel plus a concrete source label. Direct traffic and
 * unverifiable hosts collapse into "direct"/"unknown" so the panel shows honest
 * numbers instead of a long tail of junk referrers.
 */
export function classifyReferrer(referrer: string | null | undefined): {
  channel: string;
  source: string;
} {
  const raw = (referrer || "").trim();
  if (!raw) return { channel: "direct", source: "Прямой заход" };

  let host = raw;
  try {
    host = new URL(raw).hostname.replace(/^www\./i, "");
  } catch {
    return { channel: "unknown", source: "Нераспознанный источник" };
  }

  const H: Array<[RegExp, string, string]> = [
    [/(^|\.)google\./, "search", "Google"],
    [/(^|\.)yandex\./, "search", "Яндекс"],
    [/(^|\.)bing\./, "search", "Bing"],
    [/(^|\.)duckduckgo\./, "search", "DuckDuckGo"],
    [/(^|\.)mail\.|mail\.ru/, "email", "Почта"],
    [/(^|\.)t\.me$|telegram/, "social", "Telegram"],
    [/(^|\.)vk\.com/, "social", "ВКонтакте"],
    [/(^|\.)pinterest\./, "social", "Pinterest"],
    [/(^|\.)reddit\./, "social", "Reddit"],
    [/(^|\.)twitter\.|\.x\.com/, "social", "X (Twitter)"],
    [/(^|\.)instagram\.|\.threads\./, "social", "Instagram"],
    [/(^|\.)youtube\.|\.youtu\.be/, "video", "YouTube"],
    [/(^|\.)pixabay\./, "stock", "Pixabay"],
    [/(^|\.)freepik\./, "stock", "Freepik"],
    [/(^|\.)pornhub\.|xvideos|xhamster/, "adult", "Adult-сайт"],
    [/(^|\.)neyroeros\./, "internal", "Свой сайт"],
  ];

  for (const [re, channel, source] of H) {
    if (re.test(host)) return { channel, source };
  }
  return { channel: "referral", source: host };
}

// Order matters: an iPad UA also contains "Mac OS X" and a desktop Chrome UA
// contains "Windows", so the mobile checks have to run first.
const OS: Array<[RegExp, string]> = [
  [/iphone|ipad|ipod/i, "iOS"],
  [/android/i, "Android"],
  [/windows nt/i, "Windows"],
  [/mac os x|macintosh/i, "macOS"],
  [/linux/i, "Linux"],
];

/** Coarse browser family - enough for "what do my visitors read me on". */
export function classifyBrowser(ua: string): string {
  const s = ua || "";
  if (/edg\//i.test(s)) return "Edge";
  if (/opr\/|opera/i.test(s)) return "Opera";
  if (/chrome\//i.test(s)) return "Chrome";
  if (/firefox\//i.test(s)) return "Firefox";
  if (/safari\//i.test(s)) return "Safari";
  return "Другой";
}

export function classifyOs(ua: string): string {
  const s = ua || "";
  for (const [re, name] of OS) if (re.test(s)) return name;
  return "Другая";
}

/** Which family of site sections a path belongs to, for a readable breakdown. */
export function classifyPath(pathname: string): string {
  const p = (pathname || "/").split("?")[0];
  if (p === "/") return "Главная";
  if (p.startsWith("/artwork/")) return "Работа";
  if (p.startsWith("/categories/")) return "Категории";
  if (p.startsWith("/tags/")) return "Теги";
  if (p.startsWith("/collections")) return "Коллекции";
  if (p.startsWith("/stories")) return "Истории";
  if (p.startsWith("/videos")) return "Видео";
  if (p.startsWith("/authors/")) return "Авторы";
  if (p.startsWith("/dashboard")) return "Кабинет";
  if (p.startsWith("/admin")) return "Админка";
  if (p.startsWith("/login") || p.startsWith("/register")) return "Вход";
  return "Прочее";
}

/**
 * Two-letter country from a CDN geo header. Trusted only as a hint: we fall back
 * to "—" whenever the header is absent, and never infer a country from the IP.
 */
export function countryFromHeaders(headers: Headers): string {
  const raw =
    headers.get("x-vercel-ip-country") ||
    headers.get("cf-ipcountry") ||
    headers.get("x-country-code") ||
    headers.get("x-geo-country") ||
    "";
  const code = raw.trim().toUpperCase();
  return /^[A-Z]{2}$/.test(code) ? code : "";
}