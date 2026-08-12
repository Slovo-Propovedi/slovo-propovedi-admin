# Архитектура: почему так (монорепозиторий)

Этот документ объясняет **мотивацию и устройство монорепозитория** admin-панели «Слово.Проповеди» на верхнем уровне: как связаны два приложения, из чего состоит runtime и куда движется проект. Детальная архитектура каждого приложения — в [`frontend/architecture.md`](./frontend/architecture.md) и [`backend/architecture.md`](./backend/architecture.md); здесь она не дублируется. За командами обращайся к [`conventions.md`](./conventions.md).

**Статус:** актуально

## Два приложения в одном репозитории

Проект — один git-репозиторий, собранный из двух независимых приложений плюс инфраструктура:

```
slovo-propovedi-admin/
├── backend/          # NestJS API (TypeORM, zod, nestjs-zod, MinIO)
├── frontend/
│   └── web-app/      # Svelte 5 + Vite SPA (admin)
├── postgres/         # данные БД + dump (initdb)
├── volumes/minio/    # данные MinIO (объектное хранилище)
├── Makefile          # корневые команды (docker, vault, codegen)
├── docker-compose.yml
├── .env              # секреты (зашифровываются в .vault)
└── .vault            # зашифрованный ansible-vault снэпшот .env
```

Корневой `package.json` — тонкий (только `husky`); реальные скрипты живут в `backend/package.json` и `frontend/web-app/package.json`. Оркестрация — через `Makefile` и `docker-compose.yml`.

| Приложение | Стек | Где | Документация |
|------------|------|-----|--------------|
| Backend | NestJS 10, TypeORM 0.3 (`synchronize: false`), `nestjs-zod`, MinIO, PostgreSQL | `backend/` | [`backend/README.md`](./backend/README.md), [`backend/architecture.md`](./backend/architecture.md) |
| Frontend | Svelte 5 (runes), Vite, `@tanstack/svelte-query`, `@hey-api/openapi-ts`, кастомный history-роутер | `frontend/web-app/` | [`frontend/README.md`](./frontend/README.md), [`frontend/architecture.md`](./frontend/architecture.md) |

Связывает приложения **общий контракт REST API** — единственная точка пересечения. Backend реализует спецификацию, frontend потребляет её через сгенерированный SDK.

## Общий OpenAPI-контракт

Обе стороны генерируются из **одной** OpenAPI-спецификации v0.4.0 «Admin API — Слово.Проповеди» (источник истины — во внешнем swagger-репозитории, URL `https://docs.slovo-propovedi.ru/openAPI.yaml`):

```
                    OpenAPI v0.4.0 (общий, внешний репозиторий)
                       https://docs.slovo-propovedi.ru/openAPI.yaml
                              │              │
              Orval (backend)  │              │  @hey-api (frontend)
                              ▼              ▼
              backend/src/generated/   frontend/web-app/src/lib/api/generated/
              (zod-схемы, strict)      (SDK + svelte-query + zod)
```

- **Backend** генерирует zod-схемы (`backend/src/generated/index.ts`) для валидации DTO и ответов через `nestjs-zod`.
- **Frontend** генерирует SDK, типы и query/mutation-hooks (`frontend/web-app/src/lib/api/generated/`).
- Frontend-страницы никогда не вызывают `fetch` напрямую (кроме XHR-загрузки файлов) — только сгенерированный SDK.

Детали спецификации и конвейера кодогенерации — в [`contracts/rest-api.md`](./contracts/rest-api.md).

## Runtime-топология (docker-compose)

Сервисы поднимаются из `docker-compose.yml`:

| Сервис | Образ | Порт наружу | Назначение |
|--------|-------|-------------|------------|
| `postgres` | `postgres:15` | `${POSTGRES_PORT}` → 5432 | БД; данные в `./postgres/data/`, dump в `./postgres/dump/` (initdb) |
| `adminer` | `adminer` | `${ADMINER_PORT}` → 8080 | Web-клиент к БД |
| `backend` | `./backend` (Dockerfile) | `3000:3000` | NestJS API |
| `minio-server` | `minio/minio` | `${MINIO_MAIN_PORT_OUT}` : `${MINIO_CONSOLE_PORT_OUT}` | объектное хранилище (обложки, файлы) |

Команды: `make up` / `make down` / `make restart` (см. [`conventions.md`](./conventions.md)).

Поток данных на высоком уровне:

```
  Svelte page ──createQuery/mutation──▶ @tanstack/svelte-query
        │                                    │  SDK (generated)
        ▼                                    ▼
  client.ts (baseUrl, token, 401-refresh)  ◀── fetch ──▶ backend (NestJS)
                                                              │ TypeORM
                                                              ▼
                                                        PostgreSQL
```

Детальный поток данных внутри приложений — в [`frontend/architecture.md`](./frontend/architecture.md) и [`backend/architecture.md`](./backend/architecture.md).

## План разделения репозиториев

**Решение (ADR-001):** админ-фронтенд планируется вынести в **отдельный git-репозиторий**, а этот репозиторий станет чисто API-репозиторием (backend + инфраструктура). Обоснование — в [`decisions.md`](./decisions.md).

Как это отражается уже сейчас:

- документация разложена по репозиториям-целям: `docs/frontend/` переедет с фронтендом, `docs/backend/` останется с API (см. [`README.md`](./README.md) → «Разделение репозиториев»);
- `docs/contracts/` — общий контракт, актуален для обоих репозиториев;
- OpenAPI-контракт и так живёт во внешнем swagger-репозитории (`slovo-propovedi-docs`), поэтому API и клиент не зависят от расположения друг друга в git.

> ⚠️ До фактического разделения репозиторий остаётся монорепозиторием: оба приложения коммитятся и версионируются вместе, а `Makefile` оркеструет их сборку и запуск.

## Секреты и окружение

- Все секреты — в `.env`, монтируется в контейнеры (`env_file: - .env`).
- `.env` шифруется в `.vault` через `ansible-vault` (`make encrypt` / `make decrypt`). `.vault` закоммичен, `.env` — в `.gitignore`.
- Backend читает конфиг через `@nestjs/config` (`POSTGRES_*`, `MINIO_*`, `DOCS_ENABLED`, `OPENAPI_SPEC_URL`).
- Frontend: `VITE_API_BASE` (по умолчанию `https://api.slovo-propovedi.ru`, см. `src/lib/api/client.ts`); в локальной разработке — Vite-прокси `/api` → `http://localhost:3000` (`vite.config.ts`).

## Связанные документы

- [`README.md`](./README.md) — карта документации и правила для агентов
- [`decisions.md`](./decisions.md) — ADR-001 «Разделение админки и API»
- [`conventions.md`](./conventions.md) — команды, OpenAPI-first workflow, DoD
- [`contracts/rest-api.md`](./contracts/rest-api.md) — общая спецификация и конвейер кодогенерации
- [`frontend/architecture.md`](./frontend/architecture.md) — архитектура фронтенда
- [`backend/architecture.md`](./backend/architecture.md) — архитектура бэкенда
- [`debt.md`](./debt.md) — технический долг
