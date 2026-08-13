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

Плейлист — упорядоченная подборка проповедей для разделов сайта (см. [`../features/playlists.md`](../features/playlists.md) и [`../../backend/modules/playlist.md`](../../backend/modules/playlist.md)).

## Список

- **Маршрут:** `/playlists`, без параметров.
- **Что показывается:** заголовок «Плейлисты», подзаголовок «Подборки проповедей для разделов сайта», кнопка «Создать плейлист». Плоский список `.list-grid` карточек `.list-item`: обложка (`playlist.artwork`, иначе плейсхолдер с первой буквой), название, подзаголовок «N проповедей» (+ «· M разделов», если есть), бейдж с количеством проповедей.
- **Откуда данные:** `playlistControllerFindAllOptions()` (`createQuery`). Мутаций на странице нет.
- **Компоненты:** `Button`, `EmptyState`, `Icon`, `LoadingSpinner`.
- **Навигация:** клик/Enter по карточке → `/playlists/:id`; «Создать плейлист» → `/playlists/create`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - пусто: `EmptyState` «Плейлистов пока нет».

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
- **Поля:** название, описание, обложка (`CoverPicker`, `bind:isUploading`). Блок «Проповеди плейлиста» — **поисковый** `CheckboxList`: `<Input>` «Поиск» + `debounce(300)` шлёт `search` через `sermonControllerFindAllOptions({ query: { search } })` (фильтрация на сервере); `selectedSermonIds` — источник истины и **переживает поиск** (выбранные остаются отмеченными даже когда текущий поиск скрывает их). Пустой термин не шлёт `search` — первичная загрузка показывает полный каталог. Строки пикера показывают **полную информацию о проповеди** (как на странице списка проповедей): обложка или плейсхолдер с первой буквой, название, «Проповедник · Книга глава:стихи», бейджи медиа (аудио/youtube/текст).
- **Мутации:** `playlistControllerCreateMutation` / `playlistControllerUpdateMutation`. В edit `sectionsIds` намеренно не шлётся (формой не управляется); `sermonsIds` всегда шлётся (bulk replace, пустой массив очищает).
- **Валидация:** без клиентского zod — HTML `required` + backend `strictObject`. Nullable-поля шлют `null` при очистке против `undefined` («не трогать»).
- **Submit** заблокирован, пока идёт загрузка обложки (`someUploadInProgress`).
- **После успеха:** `invalidatePlaylist(queryClient, id)` + `navigate('/playlists')` (create) или `navigate('/playlists/:id')` (edit).

## Связанные документы

- [README.md](./README.md) — индекс screens
- [../features/playlists.md](../features/playlists.md) — домен плейлистов, bulk-replace, reorder
- [../features/routing.md](../features/routing.md) — порядок маршрутов (static до dynamic)
- [../features/state.md](../features/state.md) — optimistic reorder, инвалидация
- [../../backend/modules/playlist.md](../../backend/modules/playlist.md) — API плейлистов
