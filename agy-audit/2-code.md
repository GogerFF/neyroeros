Подробный план реализации оптимизаций с этапами и процедурой верификации сохранён в артефакте: [audit_optimization_plan.md](file:///C:/Users/sklya/.gemini/antigravity-cli/brain/7020d6cb-a161-4b1e-9b86-dfd22ae91db3/audit_optimization_plan.md).

---

### Аудит производительности и SEO (12 ключевых проблем)

1. [lib/gallery-feed.ts:12-29](file:///C:/Users/sklya/Desktop/html/lib/gallery-feed.ts#L12-L29)
   - **В чём проблема**: При каждом обращении к `/top`, `/trending`, `/newcomers`, `/discover` (`force-dynamic`, без кэша) выполняется запрос с `take: 240` и тяжёлыми связями: `asset`, `category`, `author` (со счётчиком `artworks`), `likes` и `views` за 72 часа. Prisma разбивает это на 5–6 SQL-запросов и выгружает в память Node.js сотни объектов просмотров и лайков для вычисления скоринга в JS, возвращая в итоге всего 48 элементов.
   - **Влияние**: Высокое.
   - **Конкретное действие**: Добавить серверный кэш (`unstable_cache` с TTL 5–15 мин) для каждого вида фида; исключить выгрузку сырых массивов `views` и `likes` в Node.js, перенеся подсчёт метрик активности в периодический cron-расчёт или колонку скоринга в таблице `Artwork`.

2. [lib/i18n-server.ts:13-17](file:///C:/Users/sklya/Desktop/html/lib/i18n-server.ts#L13-L17)
   - **В чём проблема**: N+1 запросов при локализации: `localizeArtworks` обходит массив переданных работ (36 на главной, 48 в фиде, 50 в поиске) и для каждой параллельно вызывает `db.artworkTranslation.findUnique`. Если переводов в БД нет, прямо во время SSR-рендера параллельно отправляются до 48 внешних HTTP-запросов к Google/OpenAI.
   - **Влияние**: Высокое.
   - **Конкретное действие**: Загружать переводы одним батч-запросом: `db.artworkTranslation.findMany({ where: { artworkId: { in: ids }, locale } })`. Вызовы внешних API перевода исключить из пути рендеринга страниц, перенеся их в фоновую очередь/воркер.

3. [prisma/schema.prisma:209-217](file:///C:/Users/sklya/Desktop/html/prisma/schema.prisma#L209-L217) и [prisma/schema.prisma:129-131](file:///C:/Users/sklya/Desktop/html/prisma/schema.prisma#L129-L131)
   - **В чём проблема**: Отсутствуют критические индексы:
     1) В таблице `ArtworkTag` первичный ключ `@@id([artworkId, tagId])` не индексирует отдельно `tagId` — все фильтры `tags: { some: { tagId } }` (на страницах тегов и в sitemap) делают full-table-scan.
     2) В таблице `Artwork` отсутствует индекс по `categoryId`, из-за чего выборка работ категории сканирует всю таблицу `Artwork`.
   - **Влияние**: Высокое.
   - **Конкретное действие**: Добавить `@@index([tagId])` в модель `ArtworkTag` и `@@index([categoryId, status, publishedAt])` в модель `Artwork`, после чего выполнить `npx prisma migrate dev`.

4. [app/stories/page.tsx:5](file:///C:/Users/sklya/Desktop/html/app/stories/page.tsx#L5), [app/tags/page.tsx:15](file:///C:/Users/sklya/Desktop/html/app/tags/page.tsx#L15), [app/categories/[slug]/page.tsx:36](file:///C:/Users/sklya/Desktop/html/app/categories/%5Bslug%5D/page.tsx#L36)
   - **В чём проблема**: Листинги без пагинации и `take`: каталог историй выгружает сразу все опубликованные записи со всеми авторами и иллюстрациями; `/tags` грузит все 1500+ тегов со счётчиками связей; категория выгружает все видео раздела без лимита. При росте БД это приведёт к исчерпанию лимита памяти процесса на Passenger.
   - **Влияние**: Высокое.
   - **Конкретное действие**: Добавить `take: 36` (или `take: 48`) и постраничную/курсорную пагинацию во все публичные листинги.

5. [app/artwork/[slug]/page.tsx:17-21, 55](file:///C:/Users/sklya/Desktop/html/app/artwork/%5Bslug%5D/page.tsx#L17-L21) и [app/authors/[handle]/page.tsx:9-21, 34](file:///C:/Users/sklya/Desktop/html/app/authors/%5Bhandle%5D/page.tsx#L9-L21)
   - **В чём проблема**: Дублирование тяжелых запросов к БД: функции `get(slug)` (со всеми `include`) и `getAuthor(handle)` (со всеми работами автора) не обёрнуты в `React.cache()`. Next.js вызывает их дважды за один рендер — сначала в `generateMetadata`, затем повторно в компоненте страницы. Та же проблема в [stories/[slug]/page.tsx:14, 44](file:///C:/Users/sklya/Desktop/html/app/stories/%5Bslug%5D/page.tsx#L14-L44) и [videos/[slug]/page.tsx:15, 28, 42](file:///C:/Users/sklya/Desktop/html/app/videos/%5Bslug%5D/page.tsx#L15-L42).
   - **Влияние**: Среднее.
   - **Конкретное действие**: Обернуть `get`, `getAuthor`, `getVideo`, `getStory` в функцию `cache()` из `react` для автоматической дедупликации запросов в рамках одного жизненного цикла страницы.

6. [app/collections/page.tsx:16-35](file:///C:/Users/sklya/Desktop/html/app/collections/page.tsx#L16-L35)
   - **В чём проблема**: На каждый заход на `/collections` выполняются 3 раздельных `db.artwork.findMany` (на 50, 12 и 30 элементов с полными связями), суммарно загружая 92 объекта работ. Затем эти массивы трижды независимо прогоняются через `localizeArtworks`.
   - **Влияние**: Среднее.
   - **Конкретное действие**: Получать единый срез актуальных работ (например, 36–48 записей одним запросом с сортировкой по дате/лайкам), формировать коллекции срезами в памяти и выполнять `localizeArtworks` один раз.

7. [app/artwork/[slug]/page.tsx:70-75](file:///C:/Users/sklya/Desktop/html/app/artwork/%5Bslug%5D/page.tsx#L70-L75) и [components/artwork-navigator.tsx:13](file:///C:/Users/sklya/Desktop/html/components/artwork-navigator.tsx#L13)
   - **В чём проблема**: Раздувание размера RSC payload и клиентского бандла: на странице работы запрашиваются `take: 200` соседних работ, и весь этот массив сериализуется в HTML/props клиентского компонента `<ArtworkNavigator>`, хотя компоненту нужны только 2 соседние ссылки (`previous` и `next`) и их общее количество.
   - **Влияние**: Среднее.
   - **Конкретное действие**: Находить `prev` и `next` на сервере через точечные `findFirst` по `publishedAt`, передавая в клиентский компонент только 2 объекта и число `totalCount`.

8. [app/page.tsx:22](file:///C:/Users/sklya/Desktop/html/app/page.tsx#L22), [components/hero-video-slideshow.tsx:40](file:///C:/Users/sklya/Desktop/html/components/hero-video-slideshow.tsx#L40), [app/videos/page.tsx:9](file:///C:/Users/sklya/Desktop/html/app/videos/page.tsx#L9), [components/artwork-card.tsx:14](file:///C:/Users/sklya/Desktop/html/components/artwork-card.tsx#L14)
   - **В чём проблема**: Проблемы с CLS и LCP: в превью hero на главной и в каталоге видео теги `<img>` не содержат атрибутов `width` и `height` (вызывают Cumulative Layout Shift). На странице детального просмотра арта главному изображению не задан `fetchPriority="high"`. В сетке [artwork-card.tsx:14](file:///C:/Users/sklya/Desktop/html/components/artwork-card.tsx#L14) абсолютно все карточки имеют `loading="lazy"`, что искусственно замедляет загрузку LCP-элементов первого экрана.
   - **Влияние**: Высокое.
   - **Конкретное действие**: Прописать явные `width` и `height` для hero-превью и постеров видео. Для первых 4 карточек сетки убирать `loading="lazy"` и ставить `fetchPriority="high"`, для детальной страницы арта добавить главному `<img>` атрибут `fetchPriority="high"`.

9. [app/categories/page.tsx:1](file:///C:/Users/sklya/Desktop/html/app/categories/page.tsx#L1), [app/stories/page.tsx:4](file:///C:/Users/sklya/Desktop/html/app/stories/page.tsx#L4), [app/videos/page.tsx:7](file:///C:/Users/sklya/Desktop/html/app/videos/page.tsx#L7), [app/search/page.tsx:1](file:///C:/Users/sklya/Desktop/html/app/search/page.tsx#L1)
   - **В чём проблема**: Дублирование сниппетов и отсутствие метатегов: на страницах `/categories`, `/stories`, `/videos`, `/search` нет экспорта `metadata` и `canonical`. Все они получают дефолтный title из `layout.tsx` («Neyroeros — AI-искусство 18+ для взрослых: галерея, видео, истории») и дефолтный канонический URL `/`, склеивая релевантность ключевых хабовых разделов в поисковиках.
   - **Влияние**: Высокое.
   - **Конкретное действие**: Задать уникальные `export const metadata: Metadata` с индивидуальными title, description и `alternates: { canonical: "/..." }` для каждого раздела. Для страницы `/search` добавить `robots: { index: false, follow: true }`.

10. [app/sitemap.ts:27](file:///C:/Users/sklya/Desktop/html/app/sitemap.ts#L27)
    - **В чём проблема**: Страница поиска `https://neyroeros.com/search` включена в `sitemap.xml`. Согласно рекомендациям поисковых систем (Google Search Essentials), внутренний поиск сайта никогда не должен передаваться в Sitemap и не должен индексироваться поисковыми ботами.
    - **Влияние**: Среднее.
    - **Конкретное действие**: Удалить строку добавления `/search` из файла [app/sitemap.ts](file:///C:/Users/sklya/Desktop/html/app/sitemap.ts#L27).

11. [app/sitemap.ts:12](file:///C:/Users/sklya/Desktop/html/app/sitemap.ts#L12) (подтверждено в [sm2.xml](file:///C:/Users/sklya/Desktop/html/sm2.xml))
    - **В чём проблема**: Тонкие страницы в sitemap: в карту сайта отдаются абсолютно все теги, у которых есть хотя бы 1 опубликованная работа (`where: { artworks: { some: ... } }`). В реальном sitemap проекта из 1962 URL более 1507 — это страницы тегов на всего 428 работ. Подавляющее большинство страниц тегов содержат по 1 картинке без уникального текста (thin content), что сжигает краулинговый бюджет и влечёт пессимизацию сайта.
    - **Влияние**: Высокое.
    - **Конкретное действие**: Включать в `sitemap.ts` только теги с достаточным объемом контента (например, `where: { artworks: { _count: { gte: 3 } } }`), а для пустых/одиночных тегов выставлять метатег `noindex, follow`.

12. [cyr_tags.txt:1-13](file:///C:/Users/sklya/Desktop/html/cyr_tags.txt#L1-L13) и [sm2.xml:51-100](file:///C:/Users/sklya/Desktop/html/sm2.xml)
    - **В чём проблема (проблема в данных)**: В базе данных продакшена и в карте сайта присутствуют 13 тегов с кириллическими слагами (например, `цифровое-изображение-133d44`, `киберпанк-b60e4b`). Phusion Passenger на cPanel некорректно обрабатывает не-ASCII URI-сегменты в Node.js, из-за чего эти страницы отдают 404 по ссылкам из Google и внутренней навигации.
    - **Влияние**: Высокое.
    - **Конкретное действие**: Запустить разовый скрипт обновления слагов в продакшн SQLite через `slugifyLatin()` (например, `tsifrovoe-izobrazhenie-133d44`), настроить 301-редиректы в `next.config.ts` со старых кириллических адресов на латинские и перегенерировать sitemap.
Аудит кодовой базы **Neyroeros** полностью завершён.

В строгом соответствии с вашим требованием (**«файлы НЕ меняй — только аудит и рекомендации»**) никакие файлы проекта не изменялись.

* **Итоговый отчёт аудита:** 12 конкретных пунктов по производительности, Prisma, SSR, изображениям и SEO представлены выше.
* **Детальный план реализации:** сформирован и сохранён в артефакте [audit_optimization_plan.md](file:///C:/Users/sklya/.gemini/antigravity-cli/brain/7020d6cb-a161-4b1e-9b86-dfd22ae91db3/audit_optimization_plan.md).
* **Сводка аудита:** зафиксирована в [walkthrough.md](file:///C:/Users/sklya/.gemini/antigravity-cli/brain/7020d6cb-a161-4b1e-9b86-dfd22ae91db3/walkthrough.md).

Когда вы будете готовы перейти к внесению исправлений (например, добавлению индексов в Prisma 6.19, батчингу переводов или исправлению метатегов), дайте знать — начнём реализацию по шагам.
