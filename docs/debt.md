# Технический долг (debt)

Принцип: **каждый срезанный угол записывается в тот же PR**, жёстким форматом. Не «потом вспомним», а «записали сейчас». Перед завершением PR открой этот файл и добавь всё, что не доделал.

Формат записи: `- [ ] <что не доделано> — <где (пути файлов)> — <когда вернуться/контекст>`.
Закрытая запись: `- [x] ...`.

## Репозитории / структура

- [x] **Разделение репозиториев выполнено** (2026-08-13): админ-фронтенд вынесен в отдельный git-репозиторий `slovo-propovedi-admin`; backend и его документация — в `slovo-propovedi-backend`; общие инфраструктурные артефакты (`docker-compose.yml`) перенесены туда. — ADR-001.

## Playlists

- [ ] **Состав плейлиста меняется только bulk-replace.** Нет инкрементального эндпоинта add/remove проповеди; `PATCH /playlists/:id` с `sermonsIds` перезаписывает состав целиком (это серверное поведение). — `src/lib/components/forms/PlaylistForm.svelte`, [`features/playlists.md`](./features/playlists.md) — вернуться, если понадобится точечное редактирование (например, из детали плейлиста).

## Пагинация

- [ ] **Пикеры и Home грузят полные списки без пагинации.** `PlaylistForm` (все проповеди), `SermonForm`/`SectionForm` (все плейлисты) и статистика Home вызывают `findAll` без `page`/`limit` — при росте каталога это станет дорого. Сознательное решение (ADR-005): пикеры должны показывать весь каталог, чтобы выбор был корректным. — `src/lib/components/forms/{PlaylistForm,SermonForm,SectionForm}.svelte`, `src/lib/pages/Home.svelte` — вернуться при росте каталога (серверный поиск в пикерах уже есть; можно добавить лимит с поиском или виртуализацию).

## Codegen / Spec

- [ ] **SDK сгенерирован из локальной копии спецификации (v0.15.0), а не из опубликованного URL.** `page`/`limit` и `AllUsersResponse` уже есть в локальном `slovo-propovedi-docs/openAPI.yaml`, но ещё не задеплоены на `https://docs.slovo-propovedi.ru/openAPI.yaml`; кодогенерация временно указывала на `../slovo-propovedi-docs/openAPI.yaml` и была откачена. После деплоя v0.15.0 на docs.slovo-propovedi.ru — перегенерировать SDK штатно (`npm run gen:api`) и убедиться, что diff пустой. — `src/lib/api/generated/`, [`contracts/rest-api.md`](./contracts/rest-api.md) — вернуться после публикации v0.15.0 (ADR-002).
- [ ] **Источник истины спецификации — внешний репозиторий, локальной копии нет.** `/openAPI.yaml` gitignored и отсутствует; кодогенерация хардкодит удалённый URL `https://docs.slovo-propovedi.ru/openAPI.yaml`. Если URL недоступен — регенерация падает. — `openapi-ts.config.ts` (этот репозиторий) — рассмотреть локальный fallback-копию спецификации или зафиксировать версию.
- [ ] **Пост-генерационные патчи фронта хрупкие.** `scripts/patch-zod-binary.mjs` и `scripts/patch-zod-strict.mjs` матчатся на конкретную форму вывода `@hey-api/openapi-ts`; при изменении генератора они дают `WARNING` о дрейфе и требуют ручной правки. — `scripts/patch-zod-binary.mjs`, `scripts/patch-zod-strict.mjs` — проверять вывод после каждого `npm run gen:api`; по возможности вынести в конфиг генератора. Детали — [`contracts/rest-api.md`](./contracts/rest-api.md).

## Тесты

- [ ] **У фронтенда нет тестового покрытия.** `npm run check`/`npm run build` + ручная проверка; автотестов (unit/e2e) нет. Добавлять записи о непокрытых модулях по мере проверок. — вернуться при введении тестового раннера.

## Прочее (найдено через grep TODO/FIXME/HACK в src/)

- [ ] **CI-проверка свежести сгенерированных схем не подключена** к реальному пайплайну. Команда `gen:api && git diff --exit-code -- src/lib/api/generated/` описана в `conventions.md`, но в CI не заведена. — вернуться при настройке пайплайна.

## Решено

- [x] **`nullable: true` + OpenAPI 3.2 ломает openapi-ts** — спецификация переведена на null-union типы (`5bc9b4d`, тег `v0.8.1` в `slovo-propovedi-docs`); `https://docs.slovo-propovedi.ru/openAPI.yaml` отдаёт исправленную версию (0 `nullable`), SDK перегенерирован штатно, nullability и `sectionsIds` сохранены. — 2026-08-15.
- [x] **Поиск проповедей по `GET /sermons`** (query `search`) — реализован на бэкенде и в UI (`Sermons.svelte`, debounce-инпут), добавлен поисковый пикер в `PlaylistForm.svelte`. — 2026-08-12.
- [x] **`PlaylistForm` грузил весь каталог проповедей** ради выбора — теперь пикер поисковый с серверной фильтрацией (`sermonControllerFindAllOptions({ query: { search } })`). — 2026-08-12.

## Связанные документы

- [README.md](./README.md) — карта документации и правила для агентов
- [architecture.md](./architecture.md) — архитектура фронтенда, разделение репозиториев
- [decisions.md](./decisions.md) — стек и принятые решения (ADR-001..005)
- [conventions.md](./conventions.md) — OpenAPI-first workflow, DoD
- [features/playlists.md](./features/playlists.md) — домен плейлистов
- REST-контракт — [`contracts/rest-api.md`](./contracts/rest-api.md)
