# Фронтенд: подсистема файлов

Загрузка, выбор и хранение файлов (обложки, аудио, текст) в админке. Единственный «не-SDK» путь в приложении: загрузка идёт по XHR ради прогресса и abort. Сами файлы хранит backend (объектное хранилище).

**Слой:** frontend (feature: files)
**Файлы:** `src/lib/api/upload.ts`, `src/lib/components/{FileUpload,CoverPicker,ImageLibraryModal}.svelte`, `src/lib/api/invalidate.ts`
**Статус:** актуально

## Общая схема

```
SermonForm / PlaylistForm
  └─ CoverPicker (image)  ──►  FileUpload kind="image"
  └─ FileUpload (audio / text)
        └─ upload.ts: uploadFileWithProgress(file, onProgress, signal)   [XHR]
             └─ POST ${API_BASE_URL}/files  (Bearer, FormData 'file')
                → { fileName, fileUrl }
CoverPicker ── "Выбрать из библиотеки" ──► ImageLibraryModal (getFilesOptions)
```

> ✅ **Почему XHR, а не fetch:** сгенерированный SDK работает через `@hey-api/client-fetch`, чей fetch-транспорт не даёт прогресса загрузки. `upload.ts` — единственное место в приложении, где используется не SDK. Всё остальное — только сгенерированные хуки.

## `upload.ts` — XHR-загрузка

`uploadFileWithProgress(file, onProgress, signal): Promise<UploadResult>` (`UploadResult = { fileName, fileUrl }`).

- `POST ${API_BASE_URL}/files`, заголовок `Authorization: Bearer <token>` (тот же источник токена, что и интерцептор `client.ts`).
- **Прогресс:** `xhr.upload.onprogress` → `onProgress(loaded, total)` (только при `lengthComputable`).
- **Abort:** по внешнему `signal` (`AbortController` из `FileUpload`) → «Загрузка отменена».
- **Stall-timeout:** запрос прерывается, если **нет прогресса** в течение `UPLOAD_STALL_TIMEOUT_MS = 120_000` (120 с), а не по фиксированному общему таймауту. Сообщение «Загрузка зависла: нет прогресса в течение 2 мин…».
- Разбор ответа на границе: валидный `UploadResult` доверяется; иначе — fail-fast с описательной ошибкой.
- Без токена — сразу reject «Вы не авторизованы…».

> ✅ Это единственный endpoint (`/files`), который не использует fetch-SDK — см. карту эндпоинтов в [`../contracts/rest-api.md`](../contracts/rest-api.md).

## `FileUpload.svelte`

Props: `value` ($bindable), `label`, `hint`, `accept`, `kind: 'image'|'audio'|'any'`, `isUploading` ($bindable), `onChange`.

- Зона загрузки (клик/Enter) → скрытый `<input type="file">`.
- **MP3-guard** для `kind='audio'`: файл без `.mp3` отклоняется до запроса («Допускается только формат MP3.»).
- Показывает прогресс-бар в %; после успеха — превью (image → `<img>`, audio → `<audio controls>`, any → метаданные) с кнопкой «Удалить».
- Не запускает новый upload, пока идёт текущий (`isUploading` guard).

## `CoverPicker.svelte`

Props: `value`, `label`, `hint`, `isUploading`, `onChange`. = `FileUpload kind="image" accept="image/*"` + кнопка «Выбрать из библиотеки» → `ImageLibraryModal`.

- При успешной загрузке обложки вызывает `invalidateFiles(queryClient)`, чтобы свежезагруженная обложка сразу была доступна в библиотеке.
- Выбор из библиотеки → `value = fileUrl`.

## `ImageLibraryModal.svelte`

Props: `open` ($bindable), `onSelect(fileUrl)`.

- Сетка ранее загруженных изображений через `createQuery(() => ({ ...getFilesOptions(), enabled: open }))` — грузится только когда модалка открыта (свежие данные при каждом открытии).
- Состояния: skeleton (8 плейсхолдеров), ошибка (`Icon alert` + «Повторить»), пусто (`EmptyState` «Изображений пока нет»), сетка с `lazy`-загрузкой и галочкой выбора.

## `invalidateFiles` и allow-list

- `invalidateFiles(queryClient)` (`invalidate.ts`) — `invalidateQueries({ queryKey: getFilesQueryKey() })`, зовётся после загрузки обложки в `CoverPicker`.
- **Allow-list типов файлов** задаётся на уровне UI: `accept="image/*"` (обложка), `.mp3,audio/mpeg` (аудио), PDF/текст (текст). Расширение не является полноценной валидацией — границу строго контролирует backend (MinIO + zod).

## Связанные документы

- [sermons.md](./sermons.md) — аудио/текст/обложка проповеди
- [playlists.md](./playlists.md) — обложка плейлиста
- [state.md](./state.md) — `invalidateFiles`, cross-entity инвалидация
- [ui-components.md](./ui-components.md) — FileUpload/CoverPicker/ImageLibraryModal
- REST-контракт и эндпоинт загрузки файлов — [`../contracts/rest-api.md`](../contracts/rest-api.md)
- [../conventions.md](../conventions.md) — правило «SDK — контракт», единственное XHR-исключение
- [../README.md](../README.md) — индекс раздела фронтенда
