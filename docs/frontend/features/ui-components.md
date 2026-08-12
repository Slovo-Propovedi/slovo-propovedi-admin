# Фронтенд: UI-компоненты (инвентарь)

Карта переиспользуемых UI-компонентов admin SPA. Пути — от `frontend/web-app/src/lib/components/`. Здесь фиксируются props и «где используется»; подробности поведения доменных форм — в соответствующих `features/*.md`.

**Слой:** frontend (feature: ui-components)
**Статус:** актуально

## Примитивы (form controls)

| Компонент | Файл | Ключевые props | Назначение | Где используется |
|-----------|------|----------------|------------|------------------|
| `Input` | `Input.svelte` | `label`, `hint`, `error`, `value` ($bindable), `id`, + HTMLInput attrs | Текстовый/number-инпут с автогенерацией id | `Login`, `Sermons`, все формы |
| `Textarea` | `Textarea.svelte` | `label`, `hint`, `error`, `value`, `id` | Многострочный ввод | все формы |
| `Select` | `Select.svelte` | `label`, `hint`, `error`, `options[{value,label}]`, `value` | Выпадающий список | `SectionForm` |
| `Button` | `Button.svelte` | `variant` ('primary'/'ghost'/'danger'), `size` ('sm'/'md'/'lg'), `loading`, `block`, children | Кнопка со встроенным спиннером | почти все страницы |
| `CheckboxList` | `CheckboxList.svelte` | `options[{value,label,meta}]`, `selected[]`, `onToggle` | Группа чекбоксов | `SermonForm`, `SectionForm`, `PlaylistForm` |
| `Modal` | `Modal.svelte` | `title`, `open`, `onClose`, children, footer | Диалог: focus trap, Escape, клик по подложке | delete-confirm (3 детали), `ImageLibraryModal` |
| `Toast` | `Toast.svelte` | `message`, `onDismiss` | Всплывающая ошибка (снизу справа, авто-dismiss 3 с) | `Sections`, `SectionDetail`, `PlaylistDetail` |
| `LoadingSpinner` | `LoadingSpinner.svelte` | `large`, + attrs | Инлайн-спиннер | широко |
| `LoadingScreen` | `LoadingScreen.svelte` | — | Полноэкранный бренд-лоадер | `ProtectedRoute` |
| `EmptyState` | `EmptyState.svelte` | `icon`, `title`, `hint`, `action` | Плейсхолдер пустого списка | все list/detail-страницы, `ImageLibraryModal` |
| `Card` | `Card.svelte` | `title`, `hover`, `actions`, children | Карточка (header/body) | формы; статистика Home (через `.card` CSS) |

## Layout / navigation

| Компонент | Файл | Ключевые props | Назначение | Где используется |
|-----------|------|----------------|------------|------------------|
| `Icon` | `Icon.svelte` | `name`, `size`, `class` | Инлайновый SVG-набор lucide-style по имени (`home`, `sections`, `playlists`, `sermons`, `upload`, `edit`, `trash`, `plus`, `back`, `close`, `external`, `check`, `images`, `alert`, `info`) | широко |
| `Breadcrumbs` | `Breadcrumbs.svelte` | (ссылки зовут `navigate`) | Хлебные крошки | все create/edit/detail-страницы |
| `DndList` | `DndList.svelte` | `items`, `onReorder(newOrder, isFinalize)`, children | Drag-and-drop список через `svelte-dnd-action`; вырезает shadow-плейсхолдер | `Sections`, `SectionDetail`, `PlaylistDetail` |

## File / media

| Компонент | Файл | Ключевые props | Назначение | Где используется |
|-----------|------|----------------|------------|------------------|
| `FileUpload` | `FileUpload.svelte` | `value` ($bindable), `kind` ('image'/'audio'/'any'), `isUploading` ($bindable), `accept`, `hint`, `onChange` | Зона загрузки с XHR-прогрессом; MP3-guard для audio | `CoverPicker`, `SermonForm` (audio/text) |
| `CoverPicker` | `CoverPicker.svelte` | `value`, `isUploading`, `onChange` | Image-upload + «Выбрать из библиотеки» → `ImageLibraryModal` | `SermonForm`, `PlaylistForm` |
| `ImageLibraryModal` | `ImageLibraryModal.svelte` | `open` ($bindable), `onSelect(fileUrl)` | Модальная сетка ранее загруженных изображений (`getFilesOptions`); skeleton/error/empty | `CoverPicker` |

## Forms (`components/forms/`)

| Компонент | Файл | Ключевые props | Назначение |
|-----------|------|----------------|------------|
| `SermonForm` | `forms/SermonForm.svelte` | `mode` ('create'/'edit'), `id?`, `initial?: SermonEntity` | Create/edit проповеди (см. [sermons.md](./sermons.md)) |
| `SectionForm` | `forms/SectionForm.svelte` | `mode`, `id?`, `initial?: SectionEntity` | Create/edit раздела, enums (см. [sections.md](./sections.md)) |
| `PlaylistForm` | `forms/PlaylistForm.svelte` | `mode`, `id?`, `initial?: PlaylistEntity` | Create/edit плейлиста + пикер (см. [playlists.md](./playlists.md)) |

> ✅ Все три формы используют общий паттерн: снапшот `initial` через замыкание на монтировании, поля — `$state`, submit — `createMutation` + `invalidate*` + `navigate` (см. [`../conventions.md`](../conventions.md)).

## Связанные документы

- [sermons.md](./sermons.md) — SermonForm, Input/FileUpload/CoverPicker/CheckboxList
- [playlists.md](./playlists.md) — PlaylistForm, DndList, CheckboxList, CoverPicker
- [sections.md](./sections.md) — SectionForm, DndList, Select, CheckboxList
- [files.md](./files.md) — FileUpload/CoverPicker/ImageLibraryModal, upload.ts
- [../conventions.md](../conventions.md) — runes, null-vs-undefined, optimistic reorder
- [../architecture.md](../architecture.md) — раскладка `src/`, app shell
- [../README.md](../README.md) — индекс раздела фронтенда
