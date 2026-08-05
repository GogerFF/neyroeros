# Nocturna AI

Русскоязычная адаптивная 18+ галерея пользовательского AI-искусства: ручная модерация, отложенная публикация, безопасное локальное хранение и AI-подсказки метаданных.

## Запуск

```bash
cp .env.example .env
npm install
npx prisma migrate dev --name init
npm run db:seed
npm run dev
```

Откройте `http://localhost:3000`. Seed по умолчанию создаёт `admin@nocturna.local` / `Admin!12345`; **обязательно замените пароль в production** через env или `npx tsx scripts/create-admin.ts email пароль`.

## Переменные окружения

- `DATABASE_URL=file:./dev.db` — SQLite MVP.
- `AUTH_SECRET` — случайная строка не короче 32 символов.
- `CRON_SECRET` — bearer secret публикационного worker.
- `STORAGE_ROOT` — каталог вне `public`.
- `ADMIN_EMAIL`, `ADMIN_PASSWORD` — seed администратора.

## Поток публикации

1. Автор регистрируется и загружает JPG/PNG/WebP до 15 МБ.
2. Сервер проверяет сигнатуру, декодирует Sharp, удаляет EXIF и создаёт WebP original/preview/thumbnail под случайным UUID.
3. Автор подтверждает политику и отправляет черновик на ручную модерацию.
4. Модератор одобряет или отклоняет с причиной. Одобрение резервирует один из шести равномерных UTC-слотов в сутки.
5. Cron публикует наступившие записи идемпотентно:

```bash
curl -X POST http://localhost:3000/api/cron/publish -H "Authorization: Bearer $CRON_SECRET"
```

Пример cron: `*/10 * * * * curl -fsS -X POST https://example.com/api/cron/publish -H "Authorization: Bearer $CRON_SECRET"`.

AI mock доступен через `POST /api/ai/suggest` с JSON `{ "id": "artwork-id" }`; он **только предлагает** описание, категорию и теги и никогда не модерирует или публикует.

## Политика

Запрещены: несовершеннолетние и персонажи неопределённого возраста; сексуальное насилие и сексуальный контент без согласия; несанкционированные сексуализированные дипфейки. Все решения принимает человек, аудит хранится в `ModerationAction`.

## Проверка

```bash
npm run test
npm run lint
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e
```

## Production

SQLite и локальное хранилище рассчитаны на один сервер. Для горизонтального масштабирования перенесите Prisma datasource на PostgreSQL и реализуйте S3-compatible provider, сохранив контролируемый image route. Используйте TLS, надёжные secrets, резервное копирование БД/storage и внешний distributed rate limiter. Email verification и password reset намеренно не входят в MVP.
