import { describe, expect, it } from "vitest";
import {
  classifyBrowser,
  classifyDevice,
  classifyOs,
  classifyPath,
  classifyReferrer,
  countryFromHeaders,
  isBotUserAgent,
} from "@/lib/analytics";

const CHROME_WIN =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";
const SAFARI_IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const YANDEX_BOT =
  "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36";

describe("classifyDevice", () => {
  it("различает десктоп, мобайл, планшет и ботов", () => {
    expect(classifyDevice(CHROME_WIN)).toBe("desktop");
    expect(classifyDevice(SAFARI_IPHONE)).toBe("mobile");
    expect(classifyDevice(IPAD)).toBe("tablet");
    expect(classifyDevice(YANDEX_BOT)).toBe("bot");
  });

  it("не падает на пустом UA", () => {
    expect(classifyDevice("")).toBe("other");
  });
});

describe("isBotUserAgent", () => {
  it("ловит краулеров и инструменты", () => {
    for (const ua of [YANDEX_BOT, "Googlebot/2.1", "curl/8.0", "python-requests/2.31", "AhrefsBot/7.0"]) {
      expect(isBotUserAgent(ua)).toBe(true);
    }
    expect(isBotUserAgent(CHROME_WIN)).toBe(false);
  });
});

describe("classifyReferrer", () => {
  it("пустой реферер — прямой заход", () => {
    expect(classifyReferrer(null)).toEqual({ channel: "direct", source: "Прямой заход" });
    expect(classifyReferrer("")).toEqual({ channel: "direct", source: "Прямой заход" });
  });

  it("поисковики отделяет от прочих каналов", () => {
    expect(classifyReferrer("https://www.google.com/search?q=x")).toMatchObject({ channel: "search", source: "Google" });
    expect(classifyReferrer("https://yandex.ru/search/?text=x")).toMatchObject({ channel: "search", source: "Яндекс" });
    expect(classifyReferrer("https://t.me/channel/123")).toMatchObject({ channel: "social", source: "Telegram" });
  });

  it("сайт навигации внутри себя не считает внешним источником", () => {
    expect(classifyReferrer("https://neyroeros.com/tags/ork")).toMatchObject({ channel: "internal" });
  });

  it("неизвестный хост оставляет внешним рефералом с его именем", () => {
    expect(classifyReferrer("https://some-odd-blog.example/post")).toMatchObject({
      channel: "referral",
      source: "some-odd-blog.example",
    });
  });

  it("мусор вместо URL не роняет разбор", () => {
    expect(classifyReferrer("не-ссылка").channel).toBe("unknown");
  });
});

describe("browser и OS", () => {
  it("определяет семейство браузера и ОС", () => {
    expect(classifyBrowser(CHROME_WIN)).toBe("Chrome");
    expect(classifyBrowser(SAFARI_IPHONE)).toBe("Safari");
    expect(classifyOs(CHROME_WIN)).toBe("Windows");
    expect(classifyOs(SAFARI_IPHONE)).toBe("iOS");
    expect(classifyOs(IPAD)).toBe("iOS");
  });

  it("неизвестное окружение не выдаёт пустую строку", () => {
    expect(classifyBrowser("")).toBe("Другой");
    expect(classifyOs("")).toBe("Другая");
  });
});

describe("classifyPath", () => {
  it("сводит пути к разделам сайта", () => {
    expect(classifyPath("/")).toBe("Главная");
    expect(classifyPath("/artwork/some-slug")).toBe("Работа");
    expect(classifyPath("/tags/ork")).toBe("Теги");
    expect(classifyPath("/categories/portraits")).toBe("Категории");
    expect(classifyPath("/admin")).toBe("Админка");
  });

  it("игнорирует query-строку", () => {
    expect(classifyPath("/search?q=fox&utm=1")).toBe("Прочее");
  });
});

describe("countryFromHeaders", () => {
  it("берёт страну из заголовка CDN", () => {
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "de" }))).toBe("DE");
    expect(countryFromHeaders(new Headers({ "x-vercel-ip-country": "FR" }))).toBe("FR");
  });

  it("не выдумывает страну, когда заголовка нет", () => {
    expect(countryFromHeaders(new Headers())).toBe("");
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "XX1" }))).toBe("");
    expect(countryFromHeaders(new Headers({ "cf-ipcountry": "unknown" }))).toBe("");
  });
});