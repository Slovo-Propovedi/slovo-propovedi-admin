# Фронтенд: разделы (sections)

Фронтовая часть домена sections: список с drag-to-reorder, деталь (reorder плейлистов), создание/редактирование, форма с enums оформления. Backend-поведение (сущность, эндпоинты, reorder) — в [`../../backend/modules/section.md`](../../backend/modules/section.md).

**Слой:** frontend (feature: sections)
**Файлы:** `src/lib/pages/{Sections,SectionDetail,SectionCreate,SectionEdit}.svelte`, `src/lib/components/forms/SectionForm.svelte`
**Статус:** актуально

## Маршруты

| Паттерн | Страница | Данные |
|---------|----------|--------|
| `/sections` | `Sections.svelte` | `sectionControllerFindAllOptions()` + `reorderSectionsMutation` |
| `/sections/create` | `SectionCreate.svelte` | — (`SectionForm`, mode create) |
| `/sections/:id` | `SectionDetail.svelte` | `sectionControllerFindOneOptions` + `sectionControllerRemoveMutation` + `reorderPlaylistsInSectionMutation` |
| `/sections/:id/edit` | `SectionEdit.svelte` | `sectionControllerFindOneOptions` → `SectionForm`, mode edit |

## Список и reorder (`Sections.svelte`)

- **Optimistic reorder** разделов через `DndList` + `reorderSectionsMutation({ body: { ids } })` (полный in-scope набор). Тот же паттерн «теневая» копия/снапшот/откат (см. [`../conventions.md`](../conventions.md)).
- Карточка: плейсхолдер-обложка с первой буквой названия, подзаголовок (`description` либо «N плейлистов»), бейджи `ITEMS_SIZE_LABELS[itemsSize]` и `TRANSFORM_LABELS[transform]`.
- Клик → `/sections/:id`; кнопка «Создать раздел» → `/sections/create`.
- Ошибка reorder → `Toast`.

## Деталь и reorder (`SectionDetail.svelte`)

- **Optimistic reorder плейлистов** внутри раздела через `DndList` + `reorderPlaylistsInSectionMutation` — паттерн идентичен (`localPlaylists`, `playlistsSnapshot`, `isDragging`).
- Удаление раздела: `Modal` confirm → `sectionControllerRemoveMutation` → `invalidateSection(queryClient, id)` → `navigate('/sections')`.

## Форма (`SectionForm.svelte`)

Props: `{ mode: 'create'|'edit', id?, initial?: SectionEntity }`.

| Поле | Контрол | Заметки |
|------|---------|---------|
| `title` | `Input` required | |
| `description` | `Textarea` | nullable → `null` при очистке |
| `itemsSize` | `Select` | enum `ItemsSize` через `ITEMS_SIZE_LABELS` |
| `transform` | `Select` | enum `Transform` через `TRANSFORM_LABELS` |
| `whereIsSlideTitleLocated` | `Select` | enum через `SLIDE_TITLE_LOCATION_LABELS` |
| `itemsRows` | `Input` number | nullable → `null` |
| `isDescriptionTitleOnSlideLarge` | checkbox | |
| `borderRadius` | checkbox | |
| `selectedPlaylistIds` | `CheckboxList` (только edit) | через `playlistControllerFindAllOptions` |

**Enums — через label-мапы** в `utils/labels.ts`:

| Enum | Значения (value → label) |
|------|---------------------------|
| `ItemsSize` | `small` → «Маленький», `middle` → «Средний», `large` → «Большой», `xLarge` → «Очень большой» |
| `Transform` | `high` → «Высокий», `middle` → «Средний», `short` → «Низкий» |
| `WhereIsSlideTitleLocated` | `on` → «На слайде», `under` → «Под слайдом», `bothOnAndUnder` → «И на, и под слайдом» |

Мутации: `sectionControllerCreateMutation` / `sectionControllerUpdateMutation`. Edit: `playlistsIds` — массив (пустой очищает связи); create — без него. `onSuccess` → `invalidateSection(queryClient[, id])` → `navigate('/sections' | /sections/:id)`.

## Связанные документы

- [playlists.md](./playlists.md) — плейлисты, входящие в раздел
- [state.md](./state.md) — `invalidateSection`, cross-entity инвалидация
- [ui-components.md](./ui-components.md) — DndList, Select, CheckboxList
- [../../backend/modules/section.md](../../backend/modules/section.md) — backend: сущность, эндпоинты, reorder
- [../../contracts/rest-api.md](../../contracts/rest-api.md) — карта эндпоинтов sections
- [../conventions.md](../conventions.md) — optimistic reorder, null-vs-undefined
- [../README.md](../README.md) — индекс раздела фронтенда
