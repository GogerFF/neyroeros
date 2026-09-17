Выполняю проверку статус-кодов для всех указанных URL на живом сайте...
Ожидаю завершения опроса URL.
### 1. Коды ответов основных маршрутов
ок

> Все 18 запрашиваемых URL отдают `200 OK` при наличии cookie `age_confirmed=1`:
> - `/`, `/categories`, `/categories/digital-art`, `/videos`, `/stories`, `/artwork/rainy-day-seduction-6555976d`, `/donate`, `/top`, `/trending`, `/discover`, `/collections`, `/search?q=art`, `/robots.txt`, `/sitemap.xml`, `/image-sitemap.xml`, `/feed.xml`, `/llms.txt`, `/tags/nauchno-fantastika-cde838`.
> - Служебные файлы (`/robots.txt`, `/sitemap.xml`, `/image-sitemap.xml`, `/feed.xml`, `/llms.txt`) отдают `200 OK` даже без cookie.
> - Краулеры (`Googlebot`, `YandexBot`, `TelegramBot`) обходят возрастной гейт и получают `200 OK` напрямую.

---

### 2. Заголовки и CDN-кэш

#### Находка 1: Отсутствие CDN-кэша для HTML-страниц и динамический SSR на каждый запрос
- **Что не так**: HTML главной страницы и страниц работ отдаёт `cache-control: private, no-cache, no-store, max-age=0, must-revalidate`. Запросы идут напрямую на сервер `LiteSpeed` (Spaceship cPanel), CDN-прокси отсутствует. Каждый переход пользователя заставляет Node.js/Passenger заново генерировать страницу.
- **Доказательство**:
  ```bash
  curl -sS -I -H 'Cookie: age_confirmed=1' https://neyroeros.com/
  ```
  ```http
  HTTP/1.1 200 OK
  x-frame-options: DENY
  x-content-type-options: nosniff
  referrer-policy: strict-origin-when-cross-origin
  permissions-policy: camera=(), microphone=(), geolocation=()
  strict-transport-security: max-age=31536000; includeSubDomains
  content-security-policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://mc.yandex.ru https://mc.yandex.watch; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' data: https://fonts.gstatic.com; img-src 'self' data: blob: https://mc.yandex.ru https://mc.yandex.watch; connect-src 'self' https://mc.yandex.ru https://mc.yandex.watch; media-src 'self' blob:; form-action 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'self'
  vary: rsc, next-router-state-tree, next-router-prefetch, next-router-segment-prefetch, Accept-Encoding
  x-powered-by: Next.js
  cache-control: private, no-cache, no-store, max-age=0, must-revalidate
  server: LiteSpeed
  x-turbo-charged-by: LiteSpeed
  ```
- **Конкретное действие**: Подключить Cloudflare перед хостингом (или настроить edge-кэш для поисковых ботов) и для статичных сущностей (страницы работ) разрешить браузерное/edge кэширование через `s-maxage`.

---

### 3. Метаданные страницы работы и страницы видео

`canonical`, `og:image` (1200×630, доступен без cookie для превью в мессенджерах), `og:title`, `JSON-LD` (`VisualArtwork` и `VideoObject` со всеми обязательными полями Google) — в порядке.

#### Находка 2: Дублирование метатега `<meta name="rating">`
- **Что не так**: В `<head>` на страницах работ и видео тег `<meta name="rating" content="adult"/>` дублируется дважды.
- **Доказательство**:
  ```bash
  curl -sS -H 'Cookie: age_confirmed=1' https://neyroeros.com/artwork/rainy-day-seduction-6555976d | grep -o '<meta name="[rR][a-zA-Z]*" content="[^"]*"/>'
  ```
  ```html
  <meta name="rating" content="adult"/>
  <meta name="RATING" content="RTA-5042-1996-1400-1577-RTA"/>
  <meta name="rating" content="adult"/>
  ```
- **Конкретное действие**: Удалить дублирующую декларацию `rating: 'adult'` из `app/artwork/[slug]/page.tsx` и `app/videos/[slug]/page.tsx`, оставив её только в глобальном `app/layout.tsx`.

---

### 4. Кириллические URL тегов

#### Находка 3: Все кириллические теги из sitemap отдают 404 (или 500)
- **Что не так**: В sitemap содержатся 13 тегов с кириллическими слагами. При реальном переходе из браузера (URL percent-encoded) сервер возвращает `404 Not Found`. При отправке сырого UTF-8 сервер падает с `500 Internal Server Error`.
- **Доказательство**:
  ```bash
  curl -sS -o /dev/null -w '%{http_code}\n' -H 'Cookie: age_confirmed=1' 'https://neyroeros.com/tags/%D1%86%D0%B8%D1%84%D1%80%D0%BE%D0%B2%D0%BE%D0%B5-%D0%B8%D0%B7%D0%BE%D0%B1%D1%80%D0%B0%D0%B6%D0%B5%D0%BD%D0%B8%D0%B5-133d44'
  curl -sS -o /dev/null -w '%{http_code}\n' -H 'Cookie: age_confirmed=1' 'https://neyroeros.com/tags/%D0%BA%D0%B8%D0%B1%D0%B5%D1%80%D0%BF%D0%B0%D0%BD%D0%BA-b60e4b'
  curl -sS -o /dev/null -w '%{http_code}\n' -H 'Cookie: age_confirmed=1' 'https://neyroeros.com/tags/%D0%B6%D0%B0%D0%BD%D1%80%D0%BE%D0%B2%D1%8B%D0%B9-%D0%BF%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82-33c4b9'
  curl -sS -o /dev/null -w '%{http_code}\n' -H 'Cookie: age_confirmed=1' 'https://neyroeros.com/tags/%D1%86%D0%B8%D1%84%D1%80%D0%BE%D0%B2%D0%BE%D0%B5-%D0%B8%D1%81%D0%BA%D1%83%D1%81%D1%81%D1%82%D0%B2%D0%BE-57d5d0'
  curl -sS -o /dev/null -w '%{http_code}\n' -H 'Cookie: age_confirmed=1' 'https://neyroeros.com/tags/%D0%BF%D0%BE%D1%80%D1%82%D1%80%D0%B5%D1%82%D1%8B-488d8a'
  curl -sS -o /dev/null -w '%{http_code}\n' -H 'Cookie: age_confirmed=1' 'https://neyroeros.com/tags/киберпанк-b60e4b'
  ```
  ```text
  404
  404
  404
  404
  404
  500
  ```
- **Конкретное действие**: 
  1. Выполнить `cd ~/neyroeros && git pull origin master && touch tmp/restart.txt` на Spaceship cPanel (в репозитории уже есть коммит `d10b776` с декодером `slugCandidates()`, но он ещё не выкачен на прод).
  2. Перев