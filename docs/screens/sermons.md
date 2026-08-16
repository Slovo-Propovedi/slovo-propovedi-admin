# Экран «Проповеди» (sermons)

**Маршруты:**
- `/sermons` — список проповедей (с debounced поиском)
- `/sermons/upload` — загрузка новой проповеди
- `/sermons/:id` — деталь проповеди (медиа, плейлисты, удаление)
- `/sermons/:id/edit` — редактирование проповеди

**Файлы:**
- `src/lib/pages/Sermons.svelte` — список
- `src/lib/pages/SermonDetail.svelte` — деталь
- `src/lib/pages/UploadSermon.svelte` — загрузка (обёртка над формой)
- `src/lib/pages/SermonEdit.svelte` — редактирование (обёртка над формой)
- `src/lib/components/forms/SermonForm.svelte` — общая форма

Проповедь — основная единица контента: аудио и/или текст/YouTube с привязкой к библейскому месту (см. [`../features/sermons.md`](../features/sermons.md)).

## Список

- **Маршрут:** `/sermons`, без параметров.
- **Что показывается:** заголовок «Проповеди», подзаголовок «Все аудиозаписи и тексты, доступные на сайте», кнопка «Загрузить проповедь». Поле `<Input>` «Поиск» (placeholder «Название, проповедник, книга…»). Плоский список `.list-grid` карточек `.list-item`: обложка/плейсхолдер, название, подзаголовок «Проповедник · Книга глава:стихи» (`formatReference`), бейджи по наличию медиа: `аудио` (золотой), `youtube`, `текст` (нейтральные).
- **Откуда данные:** `sermonControllerFindAllOptions({ query: { search: debouncedTerm || undefined } })` (`createQuery`).
- **Debounced поиск:** `<Input>` «Поиск» + `debounce(300)` → реактивный `debouncedTerm`. Пустой термин **не шлёт `search`** (ключ `undefined`), поэтому первичная загрузка — полная выборка. Ввод с паузой 300 мс перезапрашивает список.
- **Компоненты:** `Button`, `EmptyState`, `Icon`, `Input`, `LoadingSpinner`.
- **Навигация:** клик/Enter по карточке → `/sermons/:id`; «Загрузить проповедь» → `/sermons/upload`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - пусто: `EmptyState` «Проповедей пока нет».

## Деталь

- **Маршрут:** `/sermons/:id`, параметр `:id` (uuid).
- **Что показывается:** `Breadcrumbs` («Проповеди / <название>»), hero-блок `.detail-hero` (обложка/плейсхолдер, название, «Проповедник · Книга глава:стихи»), кнопки «Редактировать» и «Удалить». Карточка «Описание». Блок «Медиа» — `<audio class="audio-player" controls>` (если `audioUrl`), ссылки «Смотреть на YouTube» и «Открыть текст проповеди» (если `youtubeUrl`/`textFileUrl`). Блок «Плейлисты (N)» — сетка карточек плейлистов (обложка + название).
- **Откуда данные:** `sermonControllerFindOneOptions({ path: { id } })` (`createQuery`); мутация `sermonControllerRemoveMutation`.
- **Компоненты:** `Breadcrumbs`, `Button`, `EmptyState`, `Icon`, `LoadingSpinner`, `Modal`.
- **Навигация:** «Редактировать» → `/sermons/:id/edit`; клик по плейлисту → `/playlists/:id`; подтверждение удаления в `Modal` → `/sermons`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - не найдено: `EmptyState` «Проповедь не найдена»;
  - пусто (нет плейлистов): `EmptyState` «Проповедь не в плейлистах»;
  - ошибка удаления: `.field-error` в модалке.
- **Мутации:** `deleteMutation` (`sermonControllerRemoveMutation`) → `invalidateSermon(queryClient, id)` + `navigate('/sermons')`.

> ✅ Админка играет `audioUrl` из `SermonEntity` напрямую; эндпоинт `GET /sermons/:id/stream-url` не используется (см. [`../contracts/rest-api.md`](../contracts/rest-api.md)).

## Загрузка

- **Маршрут:** `/sermons/upload`.
- Тонкая обёртка над `<SermonForm mode="create" />`: `Breadcrumbs` («Проповеди / Загрузка проповеди»), заголовок «Новая проповедь», подзаголовок «Загрузите аудио, текст и оформление проповеди».
- В форме доступен блок «Плейлисты»: можно сразу выбрать плейлисты (ноль, один или несколько), в которые попадёт новая проповедь при создании.
- Данных страница не грузит — вся логика в `SermonForm`.

## Редактирование

- **Маршрут:** `/sermons/:id/edit`.
- Тонкая обёртка: `Breadcrumbs` («Проповеди / Редактирование»), заголовок «Редактирование проповеди». Перед рендером формы грузит `sermonControllerFindOneOptions({ path: { id } })`; `SermonForm mode="edit"` монтируется **только после** успешной загрузки (`initial={sermonQuery.data}`). Пока идёт загрузка — `LoadingSpinner large`.

## SermonForm (общая форма)

- **Пропсы:** `{ mode: 'create'|'edit'; id?; initial?: SermonEntity }`.
- **Поля:**
  - «Основное»: название, исполнитель, книга, глава (`number`); «Стих (с)» / «Стих (по)» (`number`, для диапазона, парсятся через `parseVerse` → `number | [n, n] | null`); описание.
  - «Медиа»: обложка (`CoverPicker`), аудио (`FileUpload kind="audio"`, только MP3, `accept=".mp3,audio/mpeg"`), ссылка на YouTube (`Input`), текст (`FileUpload kind="any"`).
  - В режимах **create** и **edit** — блок «Плейлисты»: **поисковый** `CheckboxList` (`playlistControllerFindAllOptions({ query: { search: debouncedTerm || undefined } })` с `debounce(300)`; `selectedPlaylistIds` — источник истины и переживает поиск; рядом с поиском счётчик «Выбрано: N», когда выборка непуста). Состояния блока: загрузка — `LoadingSpinner`, ошибка — «Не удалось загрузить плейлисты», активный поиск без совпадений — «Ничего не найдено».
- **Мутации:** `sermonControllerCreateMutation` / `sermonControllerUpdateMutation`. Тело всегда включает `playlistsIds: selectedPlaylistIds` (пустой массив очищает связь).
- **Валидация:** без клиентского zod — HTML `required`/`min` + backend `strictObject`. Nullable-поля (`book`, `chapter`, `verse`, `youtubeUrl`, `audioUrl`, `textFileUrl`) шлют `null` при очистке против `undefined` («не трогать»).
- **Submit** заблокирован, пока идёт любая загрузка файла (`someUploadInProgress` = обложка ‖ аудио ‖ текст).
- **После успеха:** `invalidateSermon(queryClient, id)` + `navigate('/sermons')` (create) или `navigate('/sermons/:id')` (edit).

## Связанные документы

- [README.md](./README.md) — индекс screens
- [../features/sermons.md](../features/sermons.md) — домен проповедей, поиск, `formatReference`
- [../features/routing.md](../features/routing.md) — порядок маршрутов (static до dynamic)
- [../features/state.md](../features/state.md) — серверное состояние, инвалидация
- [../features/files.md](../features/files.md) — загрузка файлов (FileUpload, CoverPicker)
