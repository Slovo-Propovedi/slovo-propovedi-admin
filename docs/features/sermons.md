# Проповеди (sermons)

Домен sermons: список с поиском, загрузка, деталь, редактирование, форма. Данные проповедей приходят с backend API.

**Слой:** frontend (feature: sermons)
**Файлы:** `src/lib/pages/{Sermons,UploadSermon,SermonDetail,SermonEdit}.svelte`, `src/lib/components/forms/SermonForm.svelte`
**Статус:** актуально

## Маршруты

| Паттерн | Страница | Данные |
|---------|----------|--------|
| `/sermons` | `Sermons.svelte` | `sermonControllerFindAllOptions({ query: { search } })` |
| `/sermons/upload` | `UploadSermon.svelte` | — (делегирует `SermonForm`, mode create) |
| `/sermons/:id` | `SermonDetail.svelte` | `sermonControllerFindOneOptions({ path: { id } })` + `sermonControllerRemoveMutation` |
| `/sermons/:id/edit` | `SermonEdit.svelte` | `sermonControllerFindOneOptions` → `SermonForm`, mode edit |

## Список (`Sermons.svelte`)

- Debounce-поиск: `searchInput` → `debounce(300)` → `debouncedTerm` → `createQuery(() => sermonControllerFindAllOptions({ query: { search: debouncedTerm || undefined } }))`. Пустой термин не шлёт `search` → полная выборка.
- Плоский список карточек (`list-grid`); клик → `/sermons/:id`.
- Подзаголовок карточки — **«Проповедник · Книга глава:стихи»** через `formatReference(book, chapter, verse)` (`utils/labels.ts`); нотация поддерживает диапазоны глав и стихов (`3:16–18`, `3:16–4:2`, `3–4`) и разрозненные отрезки стихов (`1:9–18, 20`); бейджи `аудио`/`youtube`/`текст` по наличию `audioUrl`/`youtubeUrl`/`textFileUrl`.
- Состояния: загрузка — `LoadingSpinner large`; пусто — `EmptyState` «Проповедей пока нет»; ошибки — штатно через `@tanstack/svelte-query`.

## Форма (`SermonForm.svelte`)

Props: `{ mode: 'create'|'edit', id?, initial?: SermonEntity }`. Снапшот на монтировании; каждое поле — `$state`.

| Поле | Контрол | Заметки |
|------|---------|---------|
| `title` | `Input` required | |
| `artist` | `Combobox` required | проповедник; подсказки из `sermonControllerGetDistinctValuesOptions` |
| `book` | `Combobox` | nullable → `null` при очистке; подсказки из `sermonControllerGetDistinctValuesOptions` |
| `chapterStart` / `chapterEnd` | два `Input` number | `parseChapter` → `number \| [n,n] \| null`; nullable → `null` |
| `verseText` | `Input` text | `parseVerseInput` → `number \| [n,n] \| VerseSegment[] \| null`; nullable → `null` |
| `description` | `Textarea` required | nullable |
| `youtubeUrl` | `Input` | nullable |
| `audioUrl` | `FileUpload kind="audio"` (MP3-guard) | nullable |
| `textFileUrl` | `FileUpload kind="any"` | nullable |
| `artwork` | `CoverPicker` | обязательная (string) |
| `selectedPlaylistIds` | `CheckboxList` (create и edit) | **поисковый** пикер через `playlistControllerFindAllOptions({ query: { search } })` |

Блок «Плейлисты»: поисковый `CheckboxList` — `<Input>` «Поиск» + `debounce(300)` шлёт `search` через `playlistControllerFindAllOptions({ query: { search: debouncedTerm || undefined } })` (фильтрация на сервере); `selectedPlaylistIds` — источник истины и **переживает поиск** (выбранные плейлисты остаются отмеченными, даже когда текущий поиск скрывает их); рядом с поиском — счётчик «Выбрано: N» (только когда выборка непуста). Пустой термин не шлёт `search` — первичная загрузка показывает полный каталог. Пока идёт загрузка — `LoadingSpinner` (`.loading-inline`); при ошибке — сообщение «Не удалось загрузить плейлисты» (`.form-error-banner`); при активном поиске без совпадений — строка «Ничего не найдено» вместо пустого списка.

Поля «Исполнитель» и «Книга» — `Combobox` (см. [ui-components.md](./ui-components.md)): обычный `input` с фильтруемым списком ранее использованных значений из `sermonControllerGetDistinctValuesOptions` (`staleTime: 5 мин`). Подсказки — best-effort: при ошибке или пустом списке комбобокс ведёт себя как обычный инпут, сабмит не блокируется и ошибка не показывается.

Мутации: `sermonControllerCreateMutation` / `sermonControllerUpdateMutation`. Тело — по семантике null/undefined (см. [`../conventions.md`](../conventions.md)): nullable → `null` при очистке, `playlistsIds` — всегда массив. Submit блокируется, пока идёт любая загрузка (`someUploadInProgress`). Ошибки — `getErrorMessage` → `.form-error-banner`.

`onSuccess` → `invalidateSermon(queryClient[, id])` → `navigate('/sermons' | /sermons/:id)`. `invalidateSermon` дополнительно сбрасывает кэш `sermonControllerGetDistinctValues`, чтобы новые проповедник/книга сразу появились в подсказках.

> ⚠️ Поле в API называется `playlistsIds` (обрати внимание на порядок: `playlists`, а не `playlistIds`).

## Загрузка (`UploadSermon.svelte`)

Делегирует `SermonForm` в mode `create`; маршрут доступен из Sidebar («Загрузить проповедь») и быстрых действий Home.

## Деталь (`SermonDetail.svelte`)

Медиа-проигрыватель (`audioUrl` из сущности), список плейлистов, кнопки редактирования и удаления (удаление — через `Modal` confirm + `sermonControllerRemoveMutation` → `invalidateSermon` → `navigate('/sermons')`).

## Связанные документы

- [playlists.md](./playlists.md) — плейлисты, в которых состоит проповедь
- [files.md](./files.md) — загрузка аудио/обложки/текста
- [state.md](./state.md) — `invalidateSermon`, cross-entity инвалидация
- [ui-components.md](./ui-components.md) — Input/Textarea/FileUpload/CoverPicker/CheckboxList
- REST-контракт и карта эндпоинтов sermons — [`../contracts/rest-api.md`](../contracts/rest-api.md)
- [../conventions.md](../conventions.md) — null-vs-undefined, API-клиент
- [../README.md](../README.md) — индекс раздела фронтенда
