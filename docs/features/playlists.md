# Плейлисты (playlists)

Домен playlists: список, деталь с reorder проповедей, создание/редактирование, форма с поисковым пикером. Данные плейлистов приходят с backend API.

**Слой:** frontend (feature: playlists)
**Файлы:** `src/lib/pages/{Playlists,PlaylistDetail,PlaylistCreate,PlaylistEdit}.svelte`, `src/lib/components/forms/PlaylistForm.svelte`
**Статус:** актуально

## Маршруты

| Паттерн | Страница | Данные |
|---------|----------|--------|
| `/playlists` | `Playlists.svelte` | `playlistControllerFindAllOptions({ query: { search, page, limit } })` — оффсетная пагинация |
| `/playlists/create` | `PlaylistCreate.svelte` | — (`PlaylistForm`, mode create) |
| `/playlists/:id` | `PlaylistDetail.svelte` | `playlistControllerFindOneOptions` + `playlistControllerRemoveMutation` + `reorderSermonsInPlaylistMutation` |
| `/playlists/:id/edit` | `PlaylistEdit.svelte` | `playlistControllerFindOneOptions` → `PlaylistForm`, mode edit |

## Список (`Playlists.svelte`)

- Debounce-поиск как на странице проповедей: `searchInput` → `debounce(300)` → `debouncedTerm` → `createQuery(() => playlistControllerFindAllOptions({ query: { search: debouncedTerm || undefined, page, limit: 20 } }))`. Пустой термин не шлёт `search` → полная выборка; новый поиск **сбрасывает страницу на 1**.
- **Оффсетная пагинация:** `page` (1-based) + `limit` = 20; `placeholderData: keepPreviousData` — предыдущая страница видна, пока грузится следующая. `pageCount = ceil(count / 20)`; `Pagination` рендерится при `pageCount > 1`.
- `createQuery` → карточки; клик → `/playlists/:id`. Состояния: загрузка — `LoadingSpinner`, пусто — `EmptyState` (с CTA), поиск без совпадений — `EmptyState` «Ничего не найдено» без CTA, ошибки — штатно.

## Деталь и reorder (`PlaylistDetail.svelte`)

- **Optimistic reorder** проповедей внутри плейлиста через `DndList` + `reorderSermonsInPlaylistMutation` (требует полный in-scope набор `sermonIds`). Паттерн — «теневая» копия `localSermons`, `sermonsSnapshot`, `isDragging`, откат на `onError` (см. [`../conventions.md`](../conventions.md) → Optimistic reorder).
- Ячейка строки: **«Проповедник · Книга глава:стихи»** — `artist` + `formatReference(book, chapter, verse)`.
- Удаление плейлиста: `Modal` confirm → `playlistControllerRemoveMutation` → `invalidatePlaylist(queryClient, id)` → `navigate('/playlists')`.

## Форма (`PlaylistForm.svelte`)

Props: `{ mode: 'create'|'edit', id?, initial?: PlaylistEntity }`.

| Поле | Контрол | Заметки |
|------|---------|---------|
| `title` | `Input` required | |
| `description` | `Textarea` | nullable → `null` при очистке |
| `artwork` | `CoverPicker` | |
| `selectedSermonIds` | поисковый `CheckboxList` | см. ниже |
| `selectedSectionIds` | `CheckboxList` | через `sectionControllerFindAllOptions`, см. ниже |

**Поисковый пикер проповедей:** инпут «Поиск» → `debounce(300)` → `debouncedTerm` → `createQuery(() => sermonControllerFindAllOptions({ query: { search: debouncedTerm || undefined } }))`. **Выборка `selectedSermonIds` — единственный источник истины и персистит между поисками**: выбранная проповедь остаётся выбранной, даже если текущий поиск скрыл её из вида. Рядом с поиском показывается счётчик «Выбрано: N» (только когда выборка непуста), чтобы скрытые поиском выборы оставались заметными. Пустой термин → полная выборка без `search`.

Строки пикера рендерят **полную информацию о проповеди** через `item`-snippet `CheckboxList`: обложка (`sermon.artwork`, иначе плейсхолдер с первой буквой), название, подзаголовок «Проповедник · Книга глава:стихи» (`artist` + `formatReference(book, chapter, verse)`; без книги — только проповедник), бейджи медиа (аудио/youtube/текст по наличию URL). В `options` каждая строка несёт `{ value, label, data: sermon }` — `data` отдаёт сырую `SermonEntity` в snippet. `toggleSermon` — добавление/удаление id.

**Пикер разделов:** `createQuery(() => sectionControllerFindAllOptions())` → `CheckboxList` со строками `{ value: section.id, label: section.title }` (без поиска — разделов немного, а API поиска не даёт). Состояния блока: загрузка — `LoadingSpinner` (`.loading-inline`), ошибка — «Не удалось загрузить разделы» (`.form-error-banner`). `selectedSectionIds` инициализируется из `initial.sections` в edit-режиме.

Мутации: `playlistControllerCreateMutation` / `playlistControllerUpdateMutation`. Тело **всегда** включает `sermonsIds` и `sectionsIds` — массивы-отношения шлются в обоих режимах (пустой массив очищает связи на backend; `undefined` значил бы «не трогать»). `onSuccess` → `invalidatePlaylist(queryClient[, id])` → `navigate('/playlists' | /playlists/:id)`.

## Связанные документы

- [sermons.md](./sermons.md) — проповеди (в т.ч. тот же debounce-поиск)
- [sections.md](./sections.md) — разделы, ссылающиеся на плейлисты
- [files.md](./files.md) — обложка через `CoverPicker`
- [state.md](./state.md) — `invalidatePlaylist`, cross-entity инвалидация
- [ui-components.md](./ui-components.md) — DndList, CheckboxList, CoverPicker
- REST-контракт и карта эндпоинтов playlists — [`../contracts/rest-api.md`](../contracts/rest-api.md)
- [../conventions.md](../conventions.md) — optimistic reorder, null-vs-undefined
- [../README.md](../README.md) — индекс раздела фронтенда
