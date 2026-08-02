# AI Art 18+ Platform Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement this plan task-by-task after user confirmation.

**Goal:** Создать полноценную адаптивную 18+ платформу для загрузки, AI-обогащения, модерации и отложенной публикации пользовательских AI-изображений.

**Architecture:** Монолитный Next.js App Router с серверными компонентами для публичных страниц и Route Handlers/Server Actions для мутаций. Prisma работает с SQLite в MVP и допускает переход на PostgreSQL; изображения сохраняются через абстракцию StorageProvider локально, с последующей заменой на S3. Одобренные работы получают запись очереди публикации, а защищённый cron endpoint публикует наступившие элементы.

**Tech Stack:** Next.js, TypeScript, App Router, Tailwind CSS, shadcn/ui primitives, Prisma, SQLite, Auth.js Credentials, Zod, bcryptjs/argon2, Sharp, Vitest, Playwright.

---

## 1. Архитектурные решения

### Приложение
- Один Next.js-проект: UI, серверные действия, API, auth и cron endpoint.
- Server Components по умолчанию; Client Components только для интерактивных форм, фильтров, upload preview и 18+ gate.
- DAL/service-слой отделяет бизнес-логику от React и Route Handlers.
- Все входные данные валидируются Zod-схемами.
- Авторизация проверяется на сервере; роли `USER`, `MODERATOR`, `ADMIN`.

### Изображения
- Локальное хранилище: `storage/uploads/<yyyy>/<mm>/<uuid>.<ext>` вне `public`.
- Выдача через контролируемый image route, чтобы скрытые/удалённые работы нельзя было получить прямой ссылкой.
- После загрузки: проверка MIME по сигнатуре, лимит 15 МБ, декодирование Sharp, удаление EXIF, нормализация и создание thumbnail/preview.
- Интерфейс `StorageProvider` позволит заменить `LocalStorageProvider` на `S3StorageProvider` без изменения доменной логики.

### Модерация и публикация
- Статусы работы: `DRAFT`, `PENDING`, `APPROVED`, `REJECTED`, `SCHEDULED`, `PUBLISHED`, `HIDDEN`, `DELETED`.
- Каждое решение фиксируется в неизменяемом журнале `ModerationAction`.
- Одобрение создаёт `PublicationQueueItem` с рассчитанным `scheduledFor`.
- Cron вызывает защищённый endpoint, который атомарно публикует просроченные записи и не допускает двойную публикацию.
- Настройка MVP: 6 публикаций/сутки, равномерные слоты; значение хранится в `SiteSetting`.

### AI-функции
- Общий интерфейс `AiMetadataProvider`:
  - `analyzeImage()` → предлагаемые теги, категория, краткое описание, confidence;
  - `improveDescription()` → улучшенный текст.
- Реализации: `MockAiMetadataProvider` для разработки и адаптеры Gemini/Claude/OpenAI-compatible позже.
- AI никогда не публикует и не модерирует автоматически: предложения требуют подтверждения пользователя/модератора.
- AI-запросы и результаты фиксируются в `AiSuggestion` без хранения секретов.

### Безопасность и abuse prevention
- 18+ gate с cookie; без подтверждения контент не показывается.
- Явный запрет несовершеннолетних/неопределённого возраста, сексуального насилия и несанкционированных сексуализированных дипфейков; обязательное ручное решение модератора.
- Rate limiting регистрации, входа и загрузки; honeypot + минимальное время заполнения формы.
- CSRF-защита Auth.js, secure/httpOnly cookies, password hashing, generic auth errors.
- Имя файла пользователя никогда не используется как путь хранения.
- Soft delete для работ; физическая очистка файлов отдельной обслуживающей задачей.

---

## 2. Предлагаемая структура папок

```text
C:\Users\sklya\Desktop\html\
├─ app/
│  ├─ (public)/
│  │  ├─ page.tsx
│  │  ├─ artwork/[slug]/page.tsx
│  │  ├─ categories/page.tsx
│  │  ├─ categories/[slug]/page.tsx
│  │  └─ search/page.tsx
│  ├─ (auth)/
│  │  ├─ login/page.tsx
│  │  └─ register/page.tsx
│  ├─ dashboard/
│  │  ├─ page.tsx
│  │  ├─ uploads/page.tsx
│  │  ├─ uploads/new/page.tsx
│  │  └─ uploads/[id]/edit/page.tsx
│  ├─ admin/
│  │  ├─ page.tsx
│  │  ├─ moderation/page.tsx
│  │  ├─ moderation/[id]/page.tsx
│  │  └─ queue/page.tsx
│  ├─ api/
│  │  ├─ auth/[...nextauth]/route.ts
│  │  ├─ images/[variant]/[id]/route.ts
│  │  ├─ uploads/route.ts
│  │  ├─ ai/suggest/route.ts
│  │  └─ cron/publish/route.ts
│  ├─ layout.tsx
│  ├─ globals.css
│  ├─ error.tsx
│  └─ not-found.tsx
├─ components/
│  ├─ age-gate.tsx
│  ├─ artwork-card.tsx
│  ├─ artwork-grid.tsx
│  ├─ filters.tsx
│  ├─ upload-form.tsx
│  ├─ moderation-form.tsx
│  └─ ui/
├─ lib/
│  ├─ auth/
│  │  ├─ config.ts
│  │  ├─ guards.ts
│  │  └─ password.ts
│  ├─ ai/
│  │  ├─ types.ts
│  │  ├─ provider.ts
│  │  ├─ mock-provider.ts
│  │  └─ provider-factory.ts
│  ├─ storage/
│  │  ├─ types.ts
│  │  ├─ local-storage.ts
│  │  └─ storage-factory.ts
│  ├─ services/
│  │  ├─ artwork-service.ts
│  │  ├─ moderation-service.ts
│  │  ├─ publication-service.ts
│  │  └─ stats-service.ts
│  ├─ validation/
│  │  ├─ auth.ts
│  │  ├─ artwork.ts
│  │  └─ upload.ts
│  ├─ rate-limit.ts
│  ├─ db.ts
│  └─ utils.ts
├─ prisma/
│  ├─ schema.prisma
│  ├─ seed.ts
│  └─ migrations/
├─ storage/
│  └─ uploads/.gitkeep
├─ scripts/
│  ├─ create-admin.ts
│  └─ cleanup-deleted-files.ts
├─ tests/
│  ├─ unit/
│  ├─ integration/
│  └─ e2e/
├─ middleware.ts
├─ auth.ts
├─ next.config.ts
├─ package.json
├─ .env.example
├─ .gitignore
└─ README.md
```

---

## 3. Схема базы данных

### `User`
- `id String @id @default(cuid())`
- `email String @unique`
- `passwordHash String`
- `displayName String?`
- `role UserRole @default(USER)`
- `emailVerified DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- `disabledAt DateTime?`

### `Artwork`
- `id String @id @default(cuid())`
- `slug String @unique`
- `authorId String`
- `title String`
- `description String?`
- `status ArtworkStatus @default(DRAFT)`
- `isNsfw Boolean @default(true)`
- `categoryId String?`
- `moderationNote String?` — причина отклонения, видимая автору
- `submittedAt DateTime?`
- `approvedAt DateTime?`
- `publishedAt DateTime?`
- `hiddenAt DateTime?`
- `deletedAt DateTime?`
- `createdAt DateTime @default(now())`
- `updatedAt DateTime @updatedAt`
- Индексы: `(status, publishedAt)`, `(authorId, createdAt)`, `categoryId`

### `ArtworkAsset`
- `id String @id @default(cuid())`
- `artworkId String @unique`
- `storageKey String @unique`
- `previewKey String @unique`
- `thumbnailKey String @unique`
- `mimeType String`
- `sizeBytes Int`
- `width Int`
- `height Int`
- `sha256 String @index`
- `createdAt DateTime @default(now())`

### `Tag`
- `id String @id @default(cuid())`
- `name String @unique`
- `slug String @unique`
- `createdAt DateTime @default(now())`

### `ArtworkTag`
- `artworkId String`
- `tagId String`
- `source TagSource @default(USER)` — `USER`, `AI`, `MODERATOR`
- Составной PK: `(artworkId, tagId)`

### `Category`
- `id String @id @default(cuid())`
- `name String @unique`
- `slug String @unique`
- `description String?`
- `isActive Boolean @default(true)`

### `ModerationAction`
- `id String @id @default(cuid())`
- `artworkId String`
- `moderatorId String`
- `action ModerationActionType` — `SUBMIT`, `APPROVE`, `REJECT`, `HIDE`, `RESTORE`, `EDIT_METADATA`
- `fromStatus ArtworkStatus?`
- `toStatus ArtworkStatus`
- `reason String?`
- `metadata Json?`
- `createdAt DateTime @default(now())`
- Индекс: `(artworkId, createdAt)`

### `PublicationQueueItem`
- `id String @id @default(cuid())`
- `artworkId String @unique`
- `scheduledFor DateTime`
- `status QueueStatus @default(PENDING)` — `PENDING`, `PROCESSING`, `PUBLISHED`, `CANCELLED`, `FAILED`
- `attempts Int @default(0)`
- `lockedAt DateTime?`
- `lastError String?`
- `publishedAt DateTime?`
- `createdAt DateTime @default(now())`
- Индекс: `(status, scheduledFor)`

### `AiSuggestion`
- `id String @id @default(cuid())`
- `artworkId String`
- `provider String`
- `model String`
- `kind AiSuggestionKind` — `FULL_ANALYSIS`, `DESCRIPTION`, `TAGS`, `CATEGORY`
- `inputHash String?`
- `suggestion Json`
- `status AiSuggestionStatus @default(PENDING)` — `PENDING`, `ACCEPTED`, `REJECTED`, `FAILED`
- `createdAt DateTime @default(now())`
- `reviewedAt DateTime?`

### `SiteSetting`
- `key String @id`
- `value Json`
- `updatedAt DateTime @updatedAt`
- Ключи MVP: `publishing.itemsPerDay`, `publishing.timezone`, `upload.maxBytes`, `ai.provider`

### `RateLimitEvent` (для SQLite MVP)
- `id String @id @default(cuid())`
- `scope String` — `REGISTER`, `LOGIN`, `UPLOAD`, `AI_SUGGEST`
- `subjectHash String` — hash user/IP
- `createdAt DateTime @default(now())`
- Индекс: `(scope, subjectHash, createdAt)`

Связи удаляются ограниченно: пользователь не может каскадно стереть опубликованную историю; soft delete применяется к `Artwork`. Для PostgreSQL позже `RateLimitEvent` лучше заменить Redis/Upstash.

---

## 4. Основные пользовательские потоки

1. Пользователь подтверждает 18+ gate, регистрируется и входит.
2. Загружает файл и метаданные; сервер валидирует, санитизирует и создаёт варианты изображения.
3. Пользователь запрашивает AI-предложения и принимает их целиком или частично.
4. Отправляет работу на модерацию (`PENDING`); редактирование блокируется до возврата/решения.
5. Модератор редактирует метаданные и одобряет/отклоняет работу.
6. При одобрении сервис выбирает ближайший свободный слот и создаёт очередь (`SCHEDULED`).
7. Cron атомарно переводит наступившие работы в `PUBLISHED`.
8. Публичная лента выбирает только `PUBLISHED`, `publishedAt <= now()`, `deletedAt IS NULL`.

---

## 5. Этапы реализации после подтверждения

### Этап 1 — Bootstrap и дизайн-система
- Инициализировать Next.js TypeScript/Tailwind.
- Настроить ESLint, Vitest, Playwright, env validation.
- Создать тёмный responsive shell, header/footer и 18+ gate.
- Проверить production build и базовый e2e smoke test.

### Этап 2 — Prisma и авторизация
- Добавить Prisma schema, миграцию и seed категорий/admin.
- Реализовать регистрацию, Auth.js Credentials, роли и server-side guards.
- Покрыть password/auth validation unit и integration тестами.

### Этап 3 — Upload и кабинет
- Реализовать storage abstraction и безопасную обработку Sharp.
- Добавить upload form, список своих работ, редактирование до модерации и soft delete.
- Проверить типы, MIME spoofing, oversized files, ownership и статусные ограничения.

### Этап 4 — Модерация
- Создать очередь модерации, detail view, metadata editor и действия approve/reject/hide.
- Добавить audit trail и административную статистику.
- Проверить role/ownership bypass и переходы конечного автомата статусов.

### Этап 5 — Очередь и cron
- Реализовать распределение временных слотов, cron endpoint с `CRON_SECRET` и идемпотентный worker.
- Добавить локальный script/README-инструкцию и пример cron для production.
- Покрыть повторный запуск, lock timeout и failed attempts тестами.

### Этап 6 — AI abstraction
- Реализовать provider interface, mock provider и provider factory.
- Добавить UI принятия предложений и журнал `AiSuggestion`.
- Подготовить env placeholders и документацию для реального vision provider без привязки core-кода.

### Этап 7 — Публичный каталог
- Лента, карточка работы, страница работы, поиск, теги, категории, pagination.
- Контролируемая выдача image variants и SEO metadata.
- Проверить, что непубличные и удалённые работы недоступны по URL.

### Этап 8 — Hardening и документация
- Rate limiting, honeypot, security headers, логирование ошибок.
- Полный test suite, lint, typecheck, production build, Playwright happy paths.
- README: установка, env, миграции, admin seed, запуск cron, storage/S3 migration path.

---

## 6. Проверка готовности

Команды, которые должны реально пройти перед сдачей:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:e2e
npm run build
```

Ручная проверка:
- регистрация/вход/выход;
- загрузка JPG, PNG, WebP и отклонение ложного MIME/файла >15 МБ;
- редактирование собственной draft-работы и запрет чужой;
- submit → approve/reject/hide;
- появление approved работы в очереди, но не в ленте;
- публикация cron и идемпотентность повторного вызова;
- поиск/фильтры/категории;
- 18+ gate и отсутствие прямого доступа к скрытым assets;
- адаптивность mobile/tablet/desktop.

---

## 7. Принятые допущения и trade-offs

- MVP использует SQLite, но модель и запросы проектируются без SQLite-специфичных трюков для облегчения миграции на PostgreSQL.
- Email verification и password reset не входят в первый проход; архитектура Auth.js позволит добавить их отдельно. В README это будет явно отмечено.
- Локальное файловое хранилище подходит одному серверу; для горизонтального масштабирования нужен S3-compatible backend.
- Автомодерация не делегируется vision-модели: AI только предлагает метаданные, финальное решение принимает человек.
- Все изображения считаются 18+; флаг сохраняется для будущего разделения контента, но в MVP публичный просмотр всегда за age gate.
