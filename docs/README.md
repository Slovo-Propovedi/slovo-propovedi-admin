# Документация «Слово.Проповеди» — Admin

Папка `docs/` — **первоисточник знаний о проекте** для разработчиков и AI-агентов (opencode, Claude Code, Cursor). Цель — чтобы агент читал `docs/` перед реализацией и не исследовал кодовую базу повторно, экономя токены, и обновлял `docs/` при каждом изменении кода.

Проект: admin-панель платформы «Слово.Проповеди» — **монорепозиторий** из двух приложений: `backend/` (NestJS + TypeORM + PostgreSQL + MinIO) и `frontend/web-app/` (Svelte 5 + Vite SPA), плюс Docker-инфраструктура (postgres, adminer, backend, minio). Панель управляет проповедями, плейлистами, разделами и файлами и потребляет **общий** REST API (OpenAPI v0.4.0), документированный в [`contracts/rest-api.md`](./contracts/rest-api.md).

> ⚠️ **Планируется разделение репозиториев:** админ-фронтенд будет вынесен в отдельный git-репозиторий, а этот репозиторий останется за API. Подробности — в [`decisions.md`](./decisions.md) и [`architecture.md`](./architecture.md).

## Работа с документацией для агентов (ЖЁСТКИЕ правила)

Эти правила обязательны для любого агента, работающего над проектом.

1. **Перед реализацией фичи/фикса** агент ОБЯЗАН прочитать соответствующие документы:
   - UI / страница → `frontend/screens/<экран>.md`;
   - функциональный модуль фронтенда → `frontend/features/<модуль>.md`;
   - модуль бэкенда → `backend/modules/<модуль>.md`;
   - внешний протокол/контракт → `contracts/<протокол>.md`;
   - архитектурное решение → `architecture.md` (монорепозиторий), `frontend/architecture.md` или `backend/architecture.md`;
   - процессные договорённости → `conventions.md`.
   Если документ ещё не создан — прочитать код, затем создать/дополнить документ (см. правило 4).

2. **При изменении кода** агент ОБЯЗАН обновить затронутые документы `docs/` **в том же PR/коммите**. Изменение кода без обновления `docs/` считается неполным.

3. **Каждый срезанный угол** (TODO, hack, отложенное решение) → запись в `docs/debt.md` **в том же PR**. Формат записи:
   `- [ ] <что> — <где (пути файлов)> — <когда вернуться>`. Закрытая запись: `- [x] ...`.

4. **Новые зависимости** — только через запись в `docs/decisions.md` (секция Approved stack) с объяснением «почему». Агент НЕ добавляет зависимости вне этого списка без обсуждения.

5. **Если в `docs/` нет нужной информации** — добавить её, исследовав код, чтобы следующий агент не делал это повторно. Неполная документация — тоже долг: добавь запись в `debt.md`.

## Структура docs/

| Файл | Назначение |
|------|------------|
| [`README.md`](./README.md) | Карта документации и правила для агентов (этот файл) |
| [`architecture.md`](./architecture.md) | Архитектура «почему» на уровне монорепозитория: два приложения, runtime-топология, план разделения |
| [`decisions.md`](./decisions.md) | Стек и принятые решения (ADRs): repo split, OpenAPI-first, nestjs-zod, svelte-query, миграции, formatReference |
| [`conventions.md`](./conventions.md) | Процессные договорённости: OpenAPI-first workflow, git, commit style, DoD, ведение документации |
| [`debt.md`](./debt.md) | Технический долг, срезанные углы |
| [`contracts/README.md`](./contracts/README.md) | Индекс внешних контрактов данных |
| [`contracts/rest-api.md`](./contracts/rest-api.md) | Общая OpenAPI-спецификация и конвейер кодогенерации (Orval → backend, @hey-api → frontend), карта эндпоинтов |
| [`frontend/README.md`](./frontend/README.md) | Индекс документации фронтенда (Svelte 5 SPA) |
| [`frontend/architecture.md`](./frontend/architecture.md) | Архитектура фронтенда: слой api, router, layout, pages, components, utils |
| [`frontend/conventions.md`](./frontend/conventions.md) | Договорённости фронтенда: runes, стиль, форма, сборка |
| [`frontend/features/README.md`](./frontend/features/README.md) | Индекс функциональных модулей фронтенда |
| [`frontend/features/auth.md`](./frontend/features/auth.md) | Авторизация: JWT, refresh-петля, токены, route-guard |
| [`frontend/features/sermons.md`](./frontend/features/sermons.md) | Модуль «Проповеди»: страницы, форма, поиск |
| [`frontend/features/playlists.md`](./frontend/features/playlists.md) | Модуль «Плейлисты»: страницы, форма, bulk-replace, reorder |
| [`frontend/features/sections.md`](./frontend/features/sections.md) | Модуль «Разделы»: страницы, форма, drag-reorder |
| [`frontend/features/files.md`](./frontend/features/files.md) | Загрузка файлов: upload, CoverPicker, ImageLibraryModal |
| [`frontend/features/routing.md`](./frontend/features/routing.md) | Кастомный history-роутер: router.svelte.ts + Router.svelte |
| [`frontend/features/state.md`](./frontend/features/state.md) | Состояние: @tanstack/svelte-query + runes |
| [`frontend/features/ui-components.md`](./frontend/features/ui-components.md) | Инвентарь UI-примитивов и тема |
| [`frontend/screens/README.md`](./frontend/screens/README.md) | Индекс экранов фронтенда |
| [`frontend/screens/login.md`](./frontend/screens/login.md) | Экран входа |
| [`frontend/screens/home.md`](./frontend/screens/home.md) | Дашборд (главная) |
| [`frontend/screens/sections.md`](./frontend/screens/sections.md) | Экраны разделов |
| [`frontend/screens/playlists.md`](./frontend/screens/playlists.md) | Экраны плейлистов |
| [`frontend/screens/sermons.md`](./frontend/screens/sermons.md) | Экраны проповедей |
| [`backend/README.md`](./backend/README.md) | Индекс документации бэкенда (NestJS API) |
| [`backend/architecture.md`](./backend/architecture.md) | Архитектура бэкенда: модули, bootstrap, поток данных |
| [`backend/conventions.md`](./backend/conventions.md) | Договорённости бэкенда: nestjs-zod, DTO, тесты, кодогенерация |
| [`backend/db.md`](./backend/db.md) | База данных: сущности, схема, ручные SQL-миграции |
| [`backend/modules/README.md`](./backend/modules/README.md) | Индекс модулей бэкенда |
| [`backend/modules/app.md`](./backend/modules/app.md) | Модуль `app`: файлы/хранилище |
| [`backend/modules/health.md`](./backend/modules/health.md) | Модуль `health`: `GET /health` |
| [`backend/modules/auth.md`](./backend/modules/auth.md) | Модуль `auth`: AuthGuard, JWT, логин/refresh |
| [`backend/modules/users.md`](./backend/modules/users.md) | Модуль `users`: админ-аккаунты |
| [`backend/modules/sermon.md`](./backend/modules/sermon.md) | Модуль `sermon`: сущность, контроллер, сервис, DTO |
| [`backend/modules/playlist.md`](./backend/modules/playlist.md) | Модуль `playlist`: сущности, bulk-replace, reorder |
| [`backend/modules/section.md`](./backend/modules/section.md) | Модуль `section`: сущность, reorder, слайдер |
| [`backend/modules/minio.md`](./backend/modules/minio.md) | Модуль `minio`: объектное хранилище |
| [`backend/modules/shared.md`](./backend/modules/shared.md) | Модуль `shared`: общие DTO |

> Файлы, помеченные «в разработке» или ещё не созданные, добавляются по мере работы. Таблица служит картой, а не обязательным списком существующих файлов.

## Разделение репозиториев

В `docs/` документация уже разложена по репозиториям-целям будущего разделения:

- **`frontend/`** — вся документация админ-SPA. При выносе фронтенда в отдельный репозиторий этот каталог переезжает вместе с ним.
- **`backend/`** — вся документация API (NestJS). Остаётся в этом репозитории, когда он станет чисто API-репозиторием.
- **`contracts/`** — общий контракт REST API (общая спецификация платформы). Актуален для обоих репозиториев и остаётся общим.

Причина разделения: админ-фронтенд планируется отделить от API, чтобы они развивались и версионировались независимо. Подробности и обоснование — в [`decisions.md`](./decisions.md) и [`architecture.md`](./architecture.md).

## Соглашения по ведению

- Язык — **русский**; технические термины (NestJS, TypeORM, Svelte, zod, Orval, `@hey-api`, runes) — английским как есть.
- Машино-проверяемые правила (eslint, prettier, svelte-check) уже настроены — docs объясняют «почему», а не дублируют правила.
- Ссылки на код — конкретные пути (`backend/src/sermon/sermon.service.ts`, `frontend/web-app/src/lib/`), ссылки между документами — относительные.
- Подробнее о процессе ведения: [`conventions.md`](./conventions.md).

## Краткий контекст продукта

Admin-панель платформы «Слово.Проповеди» управляет контентом, который виден на сайте и в мобильном приложении. Панель администрирует **проповеди** (аудио/текст/YouTube, ссылка на библейскую книгу), **плейлисты** (упорядоченные подборки проповедей) и **разделы** (слайдеры плейлистов на главном экране сайта). Бэкенд (NestJS) отдаёт данные через **общий** REST API (OpenAPI v0.4.0 «Admin API — Слово.Проповеди»), кодогенерируемый в оба клиента (backend → zod-схемы Orval, frontend → SDK @hey-api). Фронтенд (Svelte 5, @tanstack/svelte-query) — SPA с кастомным history-роутером; авторизация — JWT через экран логина. Поиск/фильтрация проповедей реализованы (`GET /sermons?search=`, debounce-инпут в `Sermons.svelte`). Подробности и долги — в [`debt.md`](./debt.md).

## Связанные документы

- [architecture.md](./architecture.md) — монорепозиторий, runtime-топология, план разделения
- [decisions.md](./decisions.md) — стек и принятые решения
- [conventions.md](./conventions.md) — OpenAPI-first workflow, git, DoD
- [debt.md](./debt.md) — технический долг
- [contracts/rest-api.md](./contracts/rest-api.md) — общая спецификация и конвейер кодогенерации
- [frontend/README.md](./frontend/README.md) — документация фронтенда
- [backend/README.md](./backend/README.md) — документация бэкенда
