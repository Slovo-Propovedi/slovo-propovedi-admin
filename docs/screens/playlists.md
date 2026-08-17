# Экран «Плейлисты» (playlists)

**Маршруты:**
- `/playlists` — список плейлистов
- `/playlists/create` — создание плейлиста
- `/playlists/:id` — деталь плейлиста (переупорядочивание проповедей)
- `/playlists/:id/edit` — редактирование плейлиста

**Файлы:**
- `src/lib/pages/Playlists.svelte` — список
- `src/lib/pages/PlaylistDetail.svelte` — деталь
- `src/lib/pages/PlaylistCreate.svelte` — создание (обёртка над формой)
- `src/lib/pages/PlaylistEdit.svelte` — редактирование (обёртка над формой)
- `src/lib/components/forms/PlaylistForm.svelte` — общая форма

Плейлист — упорядоченная подборка проповедей для разделов сайта (см. [`../features/playlists.md`](../features/playlists.md)).

## Список

- **Маршрут:** `/playlists` (без параметров маршрута; поиск — локальное состояние страницы, а не query-параметр URL).
- **Что показывается:** заголовок «Плейлисты», подзаголовок «Подборки проповедей для разделов сайта», кнопка «Создать плейлист». Поле `<Input>` «Поиск» (placeholder «Название, описание…»). Плоский список `.list-grid` карточек `.list-item`: обложка (`playlist.artwork`, иначе плейсхолдер с первой буквой), название, подзаголовок «N проповедей» (+ «· M разделов», если есть), бейдж с количеством проповедей. Под списком — `Pagination`.
- **Откуда данные:** `playlistControllerFindAllOptions({ query: { search: debouncedTerm || undefined, page, limit: 20 } })` (`createQuery`) — **оффсетная пагинация**: страница `page` по `limit` = 20 записей. `placeholderData: keepPreviousData` — при перелистывании предыдущая страница остаётся видимой, пока грузится следующая (без мигания). Debounced поиск — тот же паттерн, что у проповедей: `<Input>` «Поиск» + `debounce(300)` → `debouncedTerm`; пустой термин не шлёт `search`, первичная загрузка — полная выборка; новый поиск **сбрасывает страницу на 1**. Мутаций на странице нет.
- **Пагинация:** `pageCount = ceil(count / 20)`; `Pagination` рендерится при `pageCount > 1`; переход по странице меняет `page` (query-key включает `page`/`limit`/`search`).
- **Компоненты:** `Button`, `EmptyState`, `Icon`, `Input`, `LoadingSpinner`, `Pagination`.
- **Навигация:** клик/Enter по карточке → `/playlists/:id`; «Создать плейлист» → `/playlists/create`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - пусто: `EmptyState` «Плейлистов пока нет» (с CTA «Создать плейлист»);
  - поиск без совпадений (`debouncedTerm !== ''` и список пуст): `EmptyState` «Ничего не найдено» с подсказкой «По запросу «{debouncedTerm}» ничего не найдено», без CTA.

## Деталь

- **Маршрут:** `/playlists/:id`, параметр `:id` (uuid).
- **Что показывается:** `Breadcrumbs` («Плейлисты / <название>»), hero-блок `.detail-hero` (обложка/плейсхолдер, название, описание, «N проповедей»), кнопки «Редактировать» и «Удалить». Блок «Проповеди плейлиста» — `DndList` из `localSermons` с подзаголовком «Проповедник · Книга глава:стихи» (`sermonSubtitle` через `formatReference`; без ссылки, когда нет `book`, — только проповедник).
- **Откуда данные:** `playlistControllerFindOneOptions({ path: { id } })` (`createQuery`); мутации `playlistControllerRemoveMutation` и `reorderSermonsInPlaylistMutation` (`body: { sermonIds }, path: { id }` — требует **полный** in-scope набор `sermonIds`).
- **Компоненты:** `Breadcrumbs`, `Button`, `DndList`, `EmptyState`, `Icon`, `LoadingSpinner`, `Modal`, `Toast`.
- **Навигация:** «Редактировать» → `/playlists/:id/edit`; клик по проповеди → `/sermons/:id`; подтверждение удаления в `Modal` → `/playlists`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - не найдено: `EmptyState` «Плейлист не найден»;
  - пусто (нет проповедей): `EmptyState` «Проповедей пока нет»;
  - ошибка удаления: `.field-error` в модалке;
  - ошибка reorder: `Toast`.
- **Optimistic reorder проповедей:** та же схема, что у разделов — `localSermons` + `sermonsSnapshot` + `isDragging`; на финале, если `hasOrderChanged` — `reorderSermonsInPlaylistMutation`; успех → `invalidatePlaylist(queryClient, id)`, ошибка → откат к снапшоту + `Toast`.

## Создание

- **Маршрут:** `/playlists/create`.
- Тонкая обёртка над `<PlaylistForm mode="create" />`: `Breadcrumbs` («Плейлисты / Создание плейлиста»), заголовок «Новый плейлист», подзаголовок «Соберите проповеди в тематическую подборку».
- Данных страница не грузит — вся логика в `PlaylistForm`.

## Редактирование

- **Маршрут:** `/playlists/:id/edit`.
- Тонкая обёртка: `Breadcrumbs` («Плейлисты / Редактирование»), заголовок «Редактирование плейлиста». Перед рендером формы грузит `playlistControllerFindOneOptions({ path: { id } })`; `PlaylistForm mode="edit"` монтируется **только после** успешной загрузки (`initial={playlistQuery.data}`). Пока идёт загрузка — `LoadingSpinner large`.

## PlaylistForm (общая форма)

- **Пропсы:** `{ mode: 'create'|'edit'; id?; initial?: PlaylistEntity }`.
- **Поля:** название, описание, обложка (`CoverPicker`, `bind:isUploading`). Блок «Проповеди плейлиста» — **поисковый** `CheckboxList`: `<Input>` «Поиск» + `debounce(300)` шлёт `search` через `sermonControllerFindAllOptions({ query: { search } })` (фильтрация на сервере); `selectedSermonIds` — источник истины и **переживает поиск** (выбранные остаются отмеченными даже когда текущий поиск скрывает их). Пустой термин не шлёт `search` — первичная загрузка показывает полный каталог. Строки пикера показывают **полную информацию о проповеди** (как на странице списка проповедей): обложка или плейсхолдер с первой буквой, название, «Проповедник · Книга глава:стихи», бейджи медиа (аудио/youtube/текст). Блок «Разделы» — `CheckboxList` через `sectionControllerFindAllOptions()` (строки: название раздела); `selectedSectionIds` инициализируется из `initial.sections` в edit-режиме. Состояния блока «Разделы»: загрузка — `LoadingSpinner` (`.loading-inline`), ошибка — «Не удалось загрузить разделы» (`.form-error-banner`).
- **Мутации:** `playlistControllerCreateMutation` / `playlistControllerUpdateMutation`. `sermonsIds` и `sectionsIds` всегда шлются (bulk replace; пустой массив очищает связи) — в create и edit одинаково.
- **Валидация:** без клиентского zod — HTML `required` + backend `strictObject`. Nullable-поля шлют `null` при очистке против `undefined` («не трогать»).
- **Submit** заблокирован, пока идёт загрузка обложки (`someUploadInProgress`).
- **После успеха:** `invalidatePlaylist(queryClient, id)` + `navigate('/playlists')` (create) или `navigate('/playlists/:id')` (edit).

## Связанные документы

- [README.md](./README.md) — индекс screens
- [../features/playlists.md](../features/playlists.md) — домен плейлистов, bulk-replace, reorder
- [../features/routing.md](../features/routing.md) — порядок маршрутов (static до dynamic)
- [../features/state.md](../features/state.md) — optimistic reorder, инвалидация
