# docs/backend — Документация бэкенда (NestJS API)

Раздел описывает backend-приложение «Слово.Проповеди» — **NestJS 10 + TypeORM + PostgreSQL + MinIO** в `backend/`. Здесь фиксируется «почему» и «где что живёт»: bootstrap, валидация, схемы БД, соглашения и каждый модуль. Машино-проверяемые правила (eslint, prettier, Jest, строгий TypeScript) не дублируются — они настроены и обоснованы в корневом [`architecture.md`](../architecture.md).

**Слой:** backend (NestJS API)
**Статус:** актуально

## Как устроен раздел

| Файл | Назначение |
|------|------------|
| [`architecture.md`](./architecture.md) | Bootstrap (`main.ts`), CORS-allow-list, глобальный Zod-пайп, Swagger UI на рантайме, env, как запускать/тестировать |
| [`conventions.md`](./conventions.md) | Соглашения: nestjs-zod, extend/override DTO, сущности, SERIALIZABLE, OpenAPI-first codegen, ручные SQL-миграции |
| [`db.md`](./db.md) | TypeORM-конфиг, карта сущностей и связей, ASCII ER-диаграмма, ручные SQL-миграции |
| [`modules/README.md`](./modules/README.md) | Индекс модулей: module → endpoints → entity → doc |
| [`modules/app.md`](./modules/app.md) | Файловое хранилище: `POST/GET /files`, stream-url |
| [`modules/health.md`](./modules/health.md) | `GET /health` → `{ status: 'ok' }` |
| [`modules/auth.md`](./modules/auth.md) | login/refresh/profile, JWT-токены, bcrypt, `AuthGuard` |
| [`modules/users.md`](./modules/users.md) | Сущность `user`, `UsersService` (без контроллера) |
| [`modules/sermon.md`](./modules/sermon.md) | CRUD проповедей, поиск, keyset-пагинация |
| [`modules/playlist.md`](./modules/playlist.md) | CRUD плейлистов, bulk-replace, reorder |
| [`modules/section.md`](./modules/section.md) | CRUD разделов, enums, reorder |
| [`modules/minio.md`](./modules/minio.md) | MinIO-клиенты, bucket `files`, presign, public-read |
| [`modules/shared.md`](./modules/shared.md) | Общие DTO и сгенерированный `generated/index.ts` |

> ✅ Внешний контракт REST API и конвейер кодогенерации описаны в [`../contracts/rest-api.md`](../contracts/rest-api.md). Здесь (в `docs/backend/`) — реализация backend; спецификация и сгенерированные схемы — там.

## ЖЁСТКИЕ правила для агентов (адаптация из корневого `docs/README.md`)

1. **Перед реализацией** фичи/фикса в backend прочитай соответствующий документ `docs/backend/`:
   - модуль (auth/sermon/playlist/section/...) → `modules/<модуль>.md`;
   - схема БД/сущности → `db.md`;
   - общие принципы → `architecture.md` и `conventions.md`.
   Отсутствует документ? Прочитай код и создай/дополни документ (правило 4).
2. **При изменении кода** обнови затронутые `docs/backend/**` **в том же PR/коммите**. Изменение кода без обновления документации — неполное.
3. **Срезанный угол** (TODO, hack) → запись в корневой `../debt.md` в том же PR.
4. **Сгенерированный код** (`backend/src/generated/index.ts`) — **не редактировать руками**; правится только через регенерацию (`npm run gen:schemas`). Ручная правка — нарушение конвенции (см. [`conventions.md`](./conventions.md)).
5. **DDL — только через SQL-файлы** (`backend/sql/bootstrap.sql` + ручные миграции). `synchronize: false` в TypeORM; схему через ORM-миграции не менять (см. [`db.md`](./db.md)).

## Backend — файлы и папки

Раскладка `backend/src/` (подробно — [`architecture.md`](./architecture.md) и [`db.md`](./db.md)):

| Путь (от `backend/`) | Назначение |
|----------------------|------------|
| `src/main.ts` | Bootstrap: CORS, `createZodValidationPipe(strict)`, MinIO bucket, Swagger UI, порт 3000 |
| `src/app.module.ts` | Корневой модуль: регистрирует все модули + глобальный `ZodSerializerInterceptor` |
| `src/app.controller.ts` | `POST/GET /files`, `GET /files/:fileName`, `GET /files/:fileName/stream-url` |
| `src/db/typeorm.module.ts` | Подключение к PostgreSQL (конфиг, `synchronize: false`, PgBouncer) |
| `src/auth/` | `AuthGuard`, auth-контроллер, DTO |
| `src/users/` | Сущность `user`, `UsersService` (без контроллера) |
| `src/sermon/` | Проповеди: сущность, контроллер, сервис, DTO |
| `src/playlist/` | Плейлисты: сущности, контроллер, сервис, DTO |
| `src/section/` | Разделы: сущности, контроллер, сервис, DTO |
| `src/minio/` | Обёртка над объектным хранилищем (два клиента) |
| `src/health/` | `GET /health` |
| `src/shared/dto/` | Общие DTO (`IdParamDto`, `FileNameParamDto`) |
| `src/generated/index.ts` | Сгенерированные Orval zod-схемы (не редактировать) |
| `sql/bootstrap.sql` | DDL свежей БД (замена `synchronize`) |
| `sql/migrate-add-username.sql` | Ручная миграция: колонка `username` |
| `sql/migrations/001_add_positions.sql` | Ручная миграция: `position` + суррогатный PK join-таблиц |
| `orval.config.mjs` | Конфиг кодогенерации (вход — внешняя OpenAPI-спецификация) |
| `scripts/gen-schemas.mjs` | Программный запуск Orval + prettier |

## Связанные документы

- [../README.md](../README.md) — корневая карта документации и правила для агентов
- [../architecture.md](../architecture.md) — слои монорепозитория, стек, runtime-топология
- [../conventions.md](../conventions.md) — OpenAPI-first workflow, git, DoD
- [../contracts/rest-api.md](../contracts/rest-api.md) — общая спецификация и конвейер кодогенерации
- [./modules/sermon.md](./modules/sermon.md) — домен sermons (backend)
- [./modules/playlist.md](./modules/playlist.md) — домен playlists (backend)
- [../frontend/features/sermons.md](../frontend/features/sermons.md) — фронтенд-аналог модуля sermons
- [../debt.md](../debt.md) — технический долг
