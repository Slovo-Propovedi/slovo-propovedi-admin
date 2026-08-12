# Фронтенд: соглашения

Договорённости для кода admin SPA (`frontend/web-app/`). Здесь — правила, которые обязан соблюдать любой агент/разработчик при работе с фронтендом. Машино-проверяемое (eslint, prettier, `svelte-check`, типы) не дублируется; фиксируются неочевидные и осознанные решения.

**Слой:** frontend (admin SPA)
**Статус:** актуально

## Svelte 5 runes

Весь реактивный код — на runes. `svelte/store` (writable/readable) **не используется**.

| Rune | Назначение | Примеры |
|------|-----------|---------|
| `$state` | локальное реактивное состояние | поля форм, `localSections` в reorder-страницах, флаги загрузки |
| `$derived` / `$derived.by` | вычисляемые значения | `playlists`, `sermonOptions`, `match` в роутере, `activeItem` в Sidebar |
| `$effect` | сайд-эффекты по зависимостям | синхронизация локального списка с query-данными, guard-редирект |
| `$props()` | декларация props (в т.ч. `$bindable`) | все компоненты |
| `{@render children()}` | слоты/сниппеты | `Layout`, `DndList`, `Modal`, `EmptyState` |

Ключевые паттерны:

- **Снапшоты форм через замыкания.** Формы (`SermonForm`, `SectionForm`, `PlaylistForm`) читают `initial` в функции `createFormSnapshot()` **при монтировании**, потому что edit-страницы монтируют форму только после загрузки записи — props стабильны. Поля — отдельные `$state`, инициализированные из снапшота.
- **`$derived` не должен мутировать состояние.** Для вывода — `$derived`; для мутаций — `$effect` или обработчики событий.

## null vs undefined в теле запроса

Единая семантика для всех форм (комментарии прямо в коде форм):

| Значение | Смысл |
|----------|-------|
| `null` | **очистить** колонку/поле на backend (пример: `description: trimmed(...) || null`) |
| `undefined` (ключ опущен) | **не менять** значение (backend читает как «no change») |
| массив отношений (всегда шлётся) | пустой массив **очищает** связи; `undefined` значил бы «не трогать» |

Примеры:

- `SermonForm`: `chapter`/`verse`/`audioUrl`/`youtubeUrl`/`textFileUrl`/`book`/`description` — nullable, при очистке шлют `null`; `playlistsIds` — всегда массив.
- `SectionForm`: `description`/`itemsRows` — `null` при очистке; `playlistsIds` — массив.
- `PlaylistForm`: `description` — `null`; `sermonsIds` — массив. В edit-режиме `sectionsIds` **намеренно опущен** (форма им не управляет).

> ✅ Это соответствует backend-валидации: zod-схемы на границе (`strictObject`) различают `null` и отсутствие ключа.

## Optimistic reorder

Переупорядочивание списков — оптимистичное, с локальной «теневой» копией и откатом. Реализовано **трижды** (Sections, SectionDetail, PlaylistDetail) по единому паттерну:

1. Локальные `$state`: `local<Items>`, `<items>Snapshot`, `isDragging`, `synced<Items>`.
2. `$effect` синхронизирует `local<Items>` из query-данных **только когда не идёт перетаскивание** и `fresh !== synced<Items>` (защита от «мигания» старым порядком после успешного reorder).
3. `handleReorder(newOrder, isFinalize)` (`DndList`): на первом `consider` фиксирует `Snapshot`; на `finalize` — если `hasOrderChanged(snapshot, newOrder)` (из `utils/arrayOrder.ts`), шлёт мутацию с полным in-scope набором `ids`, иначе просто снимает `isDragging`.
4. Защита: если на `finalize` длина массива не совпадает со снапшотом (drag не подтвердил позицию) — восстанавливается снапшот, запрос не шлётся.
5. `onSuccess` → `invalidateSection/Playlist(queryClient)`; `onError` → откат `local<Items> = <items>Snapshot` + `Toast` с ошибкой.

`DndList.svelte` (обёртка `svelte-dnd-action`) вырезает shadow-плейсхолдер (`SHADOW_PLACEHOLDER_ITEM_ID`) во всех событиях, чтобы он не попадал в родительское состояние.

## API-клиент: сгенерированный SDK — контракт

- Страницы и формы **никогда не вызывают `fetch`/`axios` напрямую** — только через сгенерированные хуки `@tanstack/svelte-query.gen` (`*Options`/`*Mutation`) поверх единого `client` из `generated/client.gen.ts`.
- **Единственное исключение** — `src/lib/api/upload.ts`: загрузка файлов идёт по XHR (`POST ${API_BASE_URL}/files`) ради прогресса и abort (fetch-транспорт прогресса не даёт). Auth согласована через `getAccessToken()` из `client.ts`.
- **Инвалидация cross-entity** — всегда через `invalidate.ts`, а не руками: сущности вложены друг в друга, поэтому `invalidateSermon`/`invalidatePlaylist`/`invalidateSection` сбрасывают списки И детали связанных сущностей (см. [`features/state.md`](./features/state.md)).
- Сгенерированный код (`generated/`) не редактируется вручную; только `npm run gen:api` (openapi-ts + патчи zod, см. [`../contracts/rest-api.md`](../contracts/rest-api.md)).

## Никакого клиентского zod для форм

- Валидацию полей выполняет **backend** (zod `strictObject` на границе).
- Фронт полагается на HTML `required`/`min` у инпутов; ошибки из `getErrorMessage(error)` (`utils/errors.ts`) показываются в `.form-error-banner`.
- zod на клиенте есть только в сгенерированных request/response-валидаторах SDK (`zod.gen.ts`) — это не ручная валидация форм.

## Прочее

- **UI-тексты** — на русском. Код и технические термины — английские.
- **Стили** — только глобальный `app.css`; в компонентах нет `<style>`-блоков.
- **Переиспользование** — сначала смотри `components/` и `utils/`; не дублируй форматтеры/лейблы.
- **Токены** — цвета/шрифты/тени только через `--`-переменные из `:root` (`app.css`).

## Связанные документы

- [README.md](./README.md) — индекс раздела и правила для агентов
- [architecture.md](./architecture.md) — стек, app shell, тема
- [features/state.md](./features/state.md) — серверное состояние и cross-entity инвалидация
- [features/sections.md](./features/sections.md) — пример optimistic reorder (Sections/SectionDetail)
- [features/playlists.md](./features/playlists.md) — reorder плейлиста и пикер проповедей
- [features/files.md](./features/files.md) — XHR-загрузка и семантика upload
- [../contracts/rest-api.md](../contracts/rest-api.md) — конвейер кодогенерации, base URL
- [../conventions.md](../conventions.md) — процессные договорённости репозитория
