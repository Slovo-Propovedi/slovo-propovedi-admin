# Технический долг (debt)

Принцип: **каждый срезанный угол записывается в тот же PR**, жёстким форматом. Не «потом вспомним», а «записали сейчас». Перед завершением PR открой этот файл и добавь всё, что не доделал.

Формат записи: `- [ ] <что не доделано> — <где (пути файлов)> — <когда вернуться/контекст>`.
Закрытая запись: `- [x] ...`.

## Репозитории / структура

- [ ] **Планируется разделение репозиториев:** админ-фронтенд будет вынесен в отдельный git-репозиторий, этот станет чисто API. До разделения оба приложения коммитятся вместе. — `docs/frontend/`, `docs/backend/`, `docs/architecture.md`, `docs/decisions.md` — ADR-001 — выполнить разделение и перенести общие инфраструктурные артефакты (`docker-compose.yml`) в подходящий репозиторий.

## Playlists

- [ ] **Состав плейлиста меняется только bulk-replace.** Нет инкрементального эндпоинта add/remove проповеди; `PATCH /playlists/:id` с `sermonsIds` перезаписывает состав целиком (`replacePlaylistSermons`: delete-all + re-insert). — `backend/src/playlist/playlist.service.ts`, `frontend/web-app/src/lib/components/forms/PlaylistForm.svelte` — вернуться, если понадобится точечное редактирование (например, из детали плейлиста). Детали — [`backend/modules/playlist.md`](./backend/modules/playlist.md), [`frontend/features/playlists.md`](./frontend/features/playlists.md).

## Codegen / Spec

- [ ] **Источник истины спецификации — внешний репозиторий, локальной копии нет.** `/openAPI.yaml` gitignored и отсутствует; обе кодогенерации хардкодят удалённый URL `https://docs.slovo-propovedi.ru/openAPI.yaml`. Если URL недоступен — регенерация падает. — `backend/orval.config.mjs`, `frontend/web-app/openapi-ts.config.ts`, `backend/scripts/gen-schemas.mjs` — рассмотреть локальный fallback-копию спецификации или зафиксировать версию.
- [ ] **Пост-генерационные патчи фронта хрупкие.** `scripts/patch-zod-binary.mjs` и `scripts/patch-zod-strict.mjs` матчатся на конкретную форму вывода `@hey-api/openapi-ts`; при изменении генератора они дают `WARNING` о дрейфе и требуют ручной правки. — `frontend/web-app/scripts/patch-zod-binary.mjs`, `frontend/web-app/scripts/patch-zod-strict.mjs` — проверять вывод после каждого `make gen-frontend`; по возможности вынести в конфиг генератора. Детали — [`contracts/rest-api.md`](./contracts/rest-api.md).

## DB / Migrations

- [ ] **Нет системы TypeORM-миграций.** `synchronize: false` (`backend/src/db/typeorm.module.ts`), схема — из `backend/sql/bootstrap.sql` (на свежей БД) + ручные идемпотентные SQL в `backend/sql/migrations/`. Схема и миграции приходится поддерживать руками (см. ADR-005). — `backend/src/db/typeorm.module.ts`, `backend/sql/` — рассмотреть полноценный миграционный инструмент при усложнении схемы. Детали — [`backend/db.md`](./backend/db.md).
- [ ] **Неконсистентное имя каталога интерфейсов.** В `src/section` каталог называется `interfacies/`, тогда как в `sermon`/`playlist` — `interfaces/`. — `backend/src/section/interfacies/interface.ts` — переименовать в `interfaces/` при ближайшем рефакторинге.

## Тесты

- [ ] **Покрытие тестами не документировано** в этом трекере; backend запускается через Jest (`npm test`), e2e — `npm run test:e2e`. Добавлять записи о непокрытых модулях по мере проверок. — `backend/`.

## Прочее (найдено через grep TODO/FIXME/HACK в src/)

- [ ] **CI-проверка свежести сгенерированных схем не подключена** к реальному пайплайну. Команда `gen:schemas && git diff --exit-code -- src/generated/` описана в `conventions.md`, но в CI не заведена. — вернуться при настройке пайплайна.

## Решено

- [x] **Поиск проповедей по `GET /sermons`** (query `search`, `ILIKE` по `title`/`artist`/`book`/`description`) — реализован на бэкенде (`sermon.service.ts`) и в UI (`Sermons.svelte`, debounce-инпут), добавлен поисковый пикер в `PlaylistForm.svelte`. — 2026-08-12.
- [x] **`PlaylistForm` грузил весь каталог проповедей** ради выбора — теперь пикер поисковый с серверной фильтрацией (`sermonControllerFindAllOptions({ query: { search } })`). — 2026-08-12.
- [x] **Английский `backend/docs/validation-pipeline.md` свёрнут в новую документацию.** Знания OpenAPI-first workflow полностью перенесены в `docs/` (корневые `conventions.md`/`contracts/rest-api.md`, а при реорганизации — в `docs/backend/conventions.md`); английский файл больше не актуален и может быть удалён. — 2026-08-13.

## Связанные документы

- [README.md](./README.md) — карта документации и правила для агентов
- [architecture.md](./architecture.md) — монорепозиторий, план разделения
- [decisions.md](./decisions.md) — стек и принятые решения (ADR-001..006)
- [conventions.md](./conventions.md) — OpenAPI-first workflow, DoD
- [contracts/rest-api.md](./contracts/rest-api.md) — спецификация и конвейер кодогенерации
- [backend/db.md](./backend/db.md) — схема и ручные миграции
- [frontend/features/playlists.md](./frontend/features/playlists.md) — домен плейлистов
- [backend/modules/playlist.md](./backend/modules/playlist.md) — модуль playlist
