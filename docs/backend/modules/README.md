# Индекс модулей backend

Карта модулей NestJS-приложения `backend/src/`. По одному документу на модуль (плюс `shared` и `generated`). Каждый документ фиксирует «почему» и «где что живёт»; полный контракт эндпоинтов и типов — в сгенерированных файлах и [`../../contracts/rest-api.md`](../../contracts/rest-api.md).

**Слой:** backend (modules)
**Статус:** актуально

## Модули

| Модуль | Эндпоинты | Сущность | Документ |
|--------|-----------|----------|----------|
| `app` (файлы) | `POST /files`, `GET /files`, `GET /files/:fileName`, `GET /files/:fileName/stream-url` | — (MinIO) | [`app.md`](./app.md) |
| `health` | `GET /health` | — | [`health.md`](./health.md) |
| `auth` | `POST /auth/login`, `POST /auth/refresh`, `GET /auth/profile` | — (JWT) | [`auth.md`](./auth.md) |
| `users` | нет (нет контроллера) | `User` (`user`) | [`users.md`](./users.md) |
| `sermon` | `POST /sermons`, `GET /sermons`, `GET /sermons/:id`, `GET /sermons/:id/stream-url`, `PATCH /sermons/:id`, `DELETE /sermons/:id` | `SermonEntity` (`sermon`) | [`sermon.md`](./sermon.md) |
| `playlist` | `POST /playlists`, `GET /playlists`, `GET /playlists/:id`, `PATCH /playlists/:id`, `PATCH /playlists/:id/sermons/reorder`, `DELETE /playlists/:id` | `PlaylistEntity` (`playlist`) + `PlaylistSermonJoinEntity` | [`playlist.md`](./playlist.md) |
| `section` | `POST /section`, `GET /section`, `GET /section/:id`, `PATCH /section/reorder`, `PATCH /section/:id/playlists/reorder`, `PATCH /section/:id`, `DELETE /section/:id` | `SectionEntity` (`section`) + `SectionPlaylistJoinEntity` | [`section.md`](./section.md) |
| `minio` | (не HTTP) | — | [`minio.md`](./minio.md) |
| `shared` | (не HTTP) | — | [`shared.md`](./shared.md) |

> ✅ Модуль `app` (корневой контроллер) — файловое хранилище; `minio` — обёртка над MinIO, которую используют `app`, `sermon` и bootstrap. Модуль `users` не имеет HTTP-контроллера — только сервис для `auth`.

## Авторизация (кратко)

- **Публичные чтения:** `GET /sermons`, `/sermons/:id`, `/sermons/:id/stream-url`, `/playlists*`, `/section*`, `/files/:fileName*`, `/health`, `/auth/login`, `/auth/refresh`.
- **Guarded (`AuthGuard`):** все write-эндпоинты (`POST/PATCH/DELETE`), `GET /files` (защищено — инвентарь хранилища), `GET /auth/profile`.

Полная карта — в [`auth.md`](./auth.md) и [`../../contracts/rest-api.md`](../../contracts/rest-api.md).

## Структура типичного модуля

```
src/<module>/
├── <module>.module.ts      # декларация модуля (imports/controllers/providers/exports)
├── <module>.controller.ts  # роуты + @ZodResponse + @UseGuards
├── <module>.service.ts     # бизнес-логика + транзакции + normalize
├── entities/               # TypeORM-сущности
├── dto/                    # createZodDto(DTO) — тело/query/ответы
└── interfaces/ или interfacies/  # TS-интерфейсы/типы ответов (см. section.md про опечатку)
```

## Связанные документы

- [../README.md](../README.md) — индекс backend-документации
- [../architecture.md](../architecture.md) — bootstrap, глобальные механизмы
- [../conventions.md](../conventions.md) — DTO, сущности, транзакции
- [../db.md](../db.md) — TypeORM-конфиг и карта сущностей
- [../../contracts/rest-api.md](../../contracts/rest-api.md) — полный контракт эндпоинтов
