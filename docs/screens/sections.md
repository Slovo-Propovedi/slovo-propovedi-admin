# Экран «Разделы» (sections)

**Маршруты:**
- `/sections` — список разделов (с drag-and-drop переупорядочиванием)
- `/sections/create` — создание раздела
- `/sections/:id` — деталь раздела (переупорядочивание плейлистов)
- `/sections/:id/edit` — редактирование раздела

**Файлы:**
- `src/lib/pages/Sections.svelte` — список
- `src/lib/pages/SectionDetail.svelte` — деталь
- `src/lib/pages/SectionCreate.svelte` — создание (обёртка над формой)
- `src/lib/pages/SectionEdit.svelte` — редактирование (обёртка над формой)
- `src/lib/components/forms/SectionForm.svelte` — общая форма

Раздел — это слайдер с плейлистами на главной странице сайта (см. [`../features/sections.md`](../features/sections.md)).

## Список

- **Маршрут:** `/sections`, без параметров.
- **Что показывается:** заголовок «Разделы», подзаголовок «Слайдеры главной страницы сайта», кнопка «Создать раздел». Список карточек `.list-item` в `DndList`: обложка-плейсхолдер (первая буква названия), название, подзаголовок (описание либо «N плейлистов»), бейджи `ITEMS_SIZE_LABELS[itemsSize]` (золотой) и `TRANSFORM_LABELS[transform]` (нейтральный).
- **Откуда данные:** `sectionControllerFindAllOptions()` (`createQuery`); мутация `reorderSectionsMutation` (`body: { ids }`).
- **Компоненты:** `Button`, `DndList`, `EmptyState`, `Icon`, `LoadingSpinner`, `Toast`.
- **Навигация:** клик/Enter по карточке → `/sections/:id`; «Создать раздел» → `/sections/create`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - пусто: `EmptyState` «Разделов пока нет»;
  - ошибка reorder: `Toast` с `getErrorMessage(error)`.
- **Optimistic reorder (drag-and-drop):**
  - локальное состояние `localSections` «затеняет» результат запроса; `sectionsSnapshot` — порядок до перетаскивания; `isDragging` не даёт свежему refetch перезаписать порядок во время драга;
  - `handleReorder(newOrder, isFinalize)` срабатывает на каждый `consider` (живая обратная связь) и один раз на `finalize` (персист);
  - на финале, если длина массива не совпадает со снапшотом (не подтверждена позиция сброса), восстанавливается снапшот — чтобы не уйти на сервер с обрезанным списком;
  - если `hasOrderChanged(snapshot, newOrder)` — `reorderSections.mutate({ body: { ids } })`, иначе просто `isDragging = false`;
  - `onSuccess` → `invalidateSection(queryClient)`; `onError` → откат к `sectionsSnapshot` + `Toast`.

## Деталь

- **Маршрут:** `/sections/:id`, параметр `:id` (uuid, из `matchRoute` → `params.id`).
- **Что показывается:** `Breadcrumbs` («Разделы / <название>»), заголовок и описание раздела, кнопки «Редактировать» и «Удалить`. Блок `.detail-grid` со статистикой: размер карточек, высота (`TRANSFORM_LABELS`), расположение заголовка (`SLIDE_TITLE_LOCATION_LABELS`), строк, крупный заголовок, скруглённые углы. Блок «Плейлисты раздела (N)» — `DndList` из `localPlaylists`.
- **Откуда данные:** `sectionControllerFindOneOptions({ path: { id } })` (`createQuery`); мутации `sectionControllerRemoveMutation` и `reorderPlaylistsInSectionMutation` (`body: { playlistIds }, path: { id }`).
- **Компоненты:** `Breadcrumbs`, `Button`, `DndList`, `EmptyState`, `Icon`, `LoadingSpinner`, `Modal`, `Toast`.
- **Навигация:** «Редактировать» → `/sections/:id/edit`; клик по плейлисту → `/playlists/:id`; подтверждение удаления в `Modal` → `/sections`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - не найдено: `EmptyState` «Раздел не найден»;
  - пусто (нет плейлистов): `EmptyState` «Плейлистов пока нет»;
  - ошибка удаления: `.field-error` в модалке;
  - ошибка reorder: `Toast`.
- **Optimistic reorder плейлистов:** та же схема, что в списке, но для `localPlaylists` и мутации `reorderPlaylistsInSectionMutation`; успех → `invalidateSection(queryClient, id)`, ошибка → откат к `playlistsSnapshot` + `Toast`.

## Создание

- **Маршрут:** `/sections/create`.
- Тонкая обёртка над `<SectionForm mode="create" />`: `Breadcrumbs` («Разделы / Создание раздела»), заголовок «Новый раздел», подзаголовок «Раздел — это слайдер с плейлистами на главной странице».
- Данных страница не грузит — вся логика в `SectionForm`.

## Редактирование

- **Маршрут:** `/sections/:id/edit`.
- Тонкая обёртка: `Breadcrumbs` («Разделы / Редактирование»), заголовок «Редактирование раздела». Перед рендером формы грузит `sectionControllerFindOneOptions({ path: { id } })`; `SectionForm mode="edit"` монтируется **только после** успешной загрузки (`initial={sectionQuery.data}`), поэтому пропсы формы стабильны. Пока идёт загрузка — `LoadingSpinner large`.

## SectionForm (общая форма)

- **Пропсы:** `{ mode: 'create'|'edit'; id?; initial?: SectionEntity }`.
- **Поля:** название, описание; оформление — `Select` размер карточек (`small/middle/large/xLarge`), `Select` высота (`high/middle/short`), `Select` расположение заголовка (`on/under/bothOnAndUnder`), «Строк» (`number`, опционально), чекбоксы «Крупный заголовок описания на слайде» и «Скруглённые углы карточек». В режиме **edit** дополнительно блок «Плейлисты раздела» — `CheckboxList` (`playlistControllerFindAllOptions()`).
- **Мутации:** `sectionControllerCreateMutation` / `sectionControllerUpdateMutation`. В edit тело включает `playlistsIds: selectedPlaylistIds` (пустой массив очищает состав раздела).
- **Валидация:** без клиентского zod — HTML `required`/`min` + backend `strictObject`. Nullable-поля шлют `null` при очистке (чтобы очистить колонку) против `undefined` («не трогать»).
- **После успеха:** `invalidateSection(queryClient, id)` + `navigate('/sections')` (create) или `navigate('/sections/:id')` (edit).

## Связанные документы

- [README.md](./README.md) — индекс screens
- [../features/sections.md](../features/sections.md) — домен разделов, enums, reorder
- [../features/routing.md](../features/routing.md) — порядок маршрутов (static до dynamic)
- [../features/state.md](../features/state.md) — optimistic reorder, инвалидация
