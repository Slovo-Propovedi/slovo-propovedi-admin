# REST API — общая спецификация и кодогенерация

> **Источник истины контракта — сгенерированный SDK и его zod-валидаторы** (`src/lib/api/generated/`, `zod.gen.ts`). Эта страница описывает контракт и конвейер @hey-api-кодогенерации; при расхождении между текстом и схемой решает **сгенерированная схема**. Версия спецификации в документации не фиксируется — см. `info.version` внешнего `openAPI.yaml` (репозиторий `slovo-propovedi-docs`).

Внешний контракт REST API платформы «Слово.Проповеди». **Подробный список эндпоинтов и типов — в сгенерированных файлах** (`backend/src/generated/index.ts` и `frontend/web-app/src/lib/api/generated/`); этот документ не дублирует их, а фиксирует **общую спецификацию**, **конвейер кодогенерации** с обеих сторон и **карту реального использования** эндпоинтов sermons/playlists/users.

**Статус:** актуально
**Слой:** contracts (внешний протокол)

## Общая спецификация (источник истины)

- **URL:** `https://docs.slovo-propovedi.ru/openAPI.yaml`
- **Версия:** «Admin API — Слово.Проповеди»; в документации не фиксируется — см. `info.version` внешнего `openAPI.yaml`
- **Где живёт:** во **внешнем swagger-репозитории** `/home/egoreast/Programming/slovo-propovedi-docs`, НЕ в этом репозитории. `/openAPI.yaml` здесь gitignored и локально отсутствует.
- **Публикация:** спецификация деплоится из `slovo-propovedi-docs` через Forgejo на тегах `v*` (`https://docs.slovo-propovedi.ru/openAPI.yaml`).
- **Потребляется:** обеими кодогенерациями (Orval backend, @hey-api frontend), конфиги которых хардкодят этот URL как `input`.

> ⚠️ Этот же контракт документирован в братском проекте `slovo-propovedi-mobile/docs/contracts/rest-api.md`. Разница: mobile-клиент помечает большинство CRUD-эндпоинтов как **мёртвые** (нет admin-UI), тогда как здесь (admin) они **живые** и реально вызываются. Одна спецификация — разные карты использования.

## Конвейер кодогенерации

### Backend — Orval (zod-схемы)

| Параметр | Значение |
|----------|----------|
| Конфиг | `backend/orval.config.mjs` |
| Ключ проекта | `backend-schemas` |
| `input` | `https://docs.slovo-propovedi.ru/openAPI.yaml` |
| `output` | `src/generated/index.ts` |
| `client` | `zod` (`variant: 'full'`, `version: 4`) |
| `strict` | все контексты `true` (param/query/header/body/response) |
| Команда | `cd backend && npm run gen:schemas` |
| Реализация | `backend/scripts/gen-schemas.mjs` — вызывает orval программно, затем prettier по выходному файлу |
| Root-шорткат | `make gen-backend` |

> ✅ `strict: true` для zod требует **per-context** ключей (Orval 8.23.0 молча нормализует простой `strict: true` в all-false) — см. комментарий в `orval.config.mjs`. Результат: каждая zod-схема на границе отбраковывает лишние ключи.

`gen:schemas` = `node scripts/gen-schemas.mjs`. Выходные схемы используются в `@ZodResponse()` и DTO контроллеров (`backend/src/sermon/`, `backend/src/playlist/`).

### Frontend — @hey-api/openapi-ts (SDK)

| Параметр | Значение |
|----------|----------|
| Конфиг | `frontend/web-app/openapi-ts.config.ts` |
| `input` | `https://docs.slovo-propovedi.ru/openAPI.yaml` |
| `output` | `src/lib/api/generated` |
| Плагины | `@hey-api/sdk` (validator: true), `@hey-api/typescript`, `@tanstack/svelte-query`, `@hey-api/client-fetch`, `zod` (`compatibilityVersion: 4`) |
| Команда | `cd frontend/web-app && npm run gen:api` |
| Root-шорткат | `make gen-frontend` |

`gen:api` = `openapi-ts && node scripts/patch-zod-binary.mjs && node scripts/patch-zod-strict.mjs`.

**Пост-генерационные патчи** (обязательны после каждого регенерирования):

| Патч | Файл | Что чинит |
|------|------|-----------|
| `patch-zod-binary.mjs` | `scripts/patch-zod-binary.mjs` | zod-плагин не имеет `binary`-кейса и эмитит `file: z.string()`; скрипт переписывает в `z.instanceof(File)` для multipart-поля `zAppControllerUploadFileBody` |
| `patch-zod-strict.mjs` | `scripts/patch-zod-strict.mjs` | спецификация декларирует `additionalProperties: false`, а zod-плагин эмитит `z.object({`; скрипт заменяет на `z.strictObject({` (идемпотентно) |

> ⚠️ Оба патча — **хрупкие**: при изменении выходной формы генератора (переименование схем, смена эмиссии) они предупреждают о дрейфе (`WARNING`) и требуют ручной правки. Проверяй вывод после регенерации.

**Структура `src/lib/api/generated/`:**

```
generated/
├── types.gen.ts                 # все TS-типы (SermonEntity, PlaylistEntity, PlaylistSermon, ...)
├── sdk.gen.ts                   # SDK-функции (sermonController*, playlistController*, ...)
├── zod.gen.ts                   # zod-схемы (после патчей)
├── client.gen.ts                # клиент (client-fetch singleton)
├── @tanstack/svelte-query.gen.ts# query options / mutations (@tanstack/svelte-query)
└── core/, client/, index.ts     # служебные модули @hey-api
```

Потребители импортируют из `@tanstack/svelte-query.gen` (`sermonControllerFindAllOptions`, `playlistControllerUpdateMutation`, ...) и `types.gen.ts`. Реэкспорт наружу — через `src/lib/api/index.ts`.

### Обе стороны сразу

```bash
make gen-api   # = gen-backend + gen-frontend
```

> ✅ Правило: при изменении спецификации регенерируются **обе** стороны в том же PR, и коммитятся все сгенерированные файлы вместе с кодом. См. [`conventions.md`](../conventions.md).

## Карта использования эндпоинтов (sermons + playlists + users)

Ниже — фактические эндпоинты, которые реально вызываются из админки. Guards: create/reorder/update/remove/delete используют `AuthGuard` (`backend/src/auth/guard/auth.guard.ts`); `findAll`/`findOne` у sermons/playlists публичны. **У users — все 6 эндпоинтов guarded (нет публичных чтений).**

### Sermons

| Эндпоинт | Guard | Статус | Где используется |
|----------|-------|--------|------------------|
| `GET /sermons` | публичный | ✅ живой | `Sermons.svelte` (`sermonControllerFindAllOptions()` с `search`), `PlaylistForm.svelte` (поисковый пикер) |
| `GET /sermons/:id` | публичный | ✅ живой | `SermonDetail.svelte`, `SermonEdit.svelte` |
| `POST /sermons` | AuthGuard | ✅ живой | `SermonForm.svelte` (`sermonControllerCreateMutation`) |
| `PATCH /sermons/:id` | AuthGuard | ✅ живой | `SermonForm.svelte` (`sermonControllerUpdateMutation`) |
| `DELETE /sermons/:id` | AuthGuard | ✅ живой | `SermonDetail.svelte` (`sermonControllerRemoveMutation`) |
| `GET /sermons/:id/stream-url` | публичный | ❌ не используется | пресigned-URL для аудио; админка играет `audioUrl` из `SermonEntity` напрямую |

> ✅ `GET /sermons` принимает query `take`, `cursor` (keyset-пагинация) и `search` (опциональный, min 1 символ, `ILIKE` по `title`/`artist`/`book`/`description`). UI вызывает его с `search` при вводе; без `take`/`search` бэкенд отвечает полной выборкой (`findAll` без `take` в `sermon.service.ts:105-185`). Подробности поиска — [`backend/modules/sermon.md`](../backend/modules/sermon.md).

### Playlists

| Эндпоинт | Guard | Статус | Где используется |
|----------|-------|--------|------------------|
| `POST /playlists` | AuthGuard | ✅ живой | `PlaylistForm.svelte` (mode create) |
| `GET /playlists` | публичный | ✅ живой | `Playlists.svelte` |
| `GET /playlists/:id` | публичный | ✅ живой | `PlaylistDetail.svelte`, `PlaylistEdit.svelte` |
| `PATCH /playlists/:id` | AuthGuard | ✅ живой | `PlaylistForm.svelte` (mode edit, body `{ title, description, artwork, sermonsIds }` → bulk replace) |
| `PATCH /playlists/:id/sermons/reorder` | AuthGuard | ✅ живой | `PlaylistDetail.svelte` (`reorderSermonsInPlaylistMutation`, требует полный in-scope набор `sermonIds`) |
| `DELETE /playlists/:id` | AuthGuard | ✅ живой | `PlaylistDetail.svelte` (`playlistControllerRemoveMutation`) |

### Users

| Эндпоинт | Guard | Статус | Где используется |
|----------|-------|--------|------------------|
| `GET /users` | AuthGuard | ✅ живой | `Users.svelte` (`usersControllerFindAllOptions()`, клиентский поиск) |
| `POST /users` | AuthGuard | ✅ живой | `UserForm.svelte` (`usersControllerCreateMutation`, mode create) |
| `GET /users/:id` | AuthGuard | ✅ живой | `UserDetail.svelte`, `UserEdit.svelte` (`usersControllerFindOneOptions`) |
| `PATCH /users/:id` | AuthGuard | ✅ живой | `UserForm.svelte` (`usersControllerUpdateMutation`, только changed-поля) |
| `PATCH /users/:id/password` | AuthGuard | ✅ живой | `UserDetail.svelte` (`usersControllerChangePasswordMutation`, body `{ password }`) |
| `DELETE /users/:id` | AuthGuard | ✅ живой | `UserDetail.svelte` (`usersControllerRemoveMutation`, кнопка скрыта для своего аккаунта) |

> ✅ В отличие от sermons/playlists, **все** users-эндпоинты защищены `AuthGuard` — включая `GET /users` и `GET /users/:id` (нет публичных чтений). Схемы: `UserResponse` `{ id, name, username, email }` (**без `password`**), `CreateUserRequest` `{ name, email, username, password }`, `UpdateUserRequest` `{ name?, email?, username? }`, `ChangePasswordRequest` `{ password }`. `PATCH /users/:id/password` и `DELETE /users/:id` возвращают **`204 No Content`** (не `StatusResponseDto`). Защита self-delete/last-admin (403) — [`backend/modules/users.md`](../backend/modules/users.md).

## База URL и аутентификация

- **Base URL:** `https://api.slovo-propovedi.ru` — константа `API_BASE_URL` в `frontend/web-app/src/lib/api/client.ts` (`VITE_API_BASE` переопределяет; в локальной разработке `/api` → Vite-прокси на `localhost:3000`).
- **Аутентификация:** Bearer JWT. `client.ts` хранит пару токенов в `localStorage` (ключ `slovo_admin_tokens`), интерцептор добавляет `Authorization: Bearer <accessToken>` к каждому запросу, а на `401` (кроме `POST /auth/login` и `POST /auth/refresh`) выполняет `authControllerRefresh`, повторяет запрос один раз и только потом объявляет сессию истёкшей (`onAuthExpired`).
- **Защита на сервере:** `AuthGuard` на мутирующих эндпоинтах (см. таблицы выше) + `ZodValidationPipe` (strict) на всех границах.

## Связанные документы

- [README.md](./README.md) — индекс contracts
- [../architecture.md](../architecture.md) — поток данных, слои, runtime
- [../conventions.md](../conventions.md) — OpenAPI-first workflow, команды регенерации, DoD
- [../backend/modules/sermon.md](../backend/modules/sermon.md) — домен проповедей
- [../backend/modules/playlist.md](../backend/modules/playlist.md) — домен плейлистов
- [../debt.md](../debt.md) — долги по кодогенерации и внешней спецификации
