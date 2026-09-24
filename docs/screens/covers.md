# Экран «Обложки» (covers)

**Маршруты:**
- `/covers` — каталог обложек, загрузка и управление осиротевшими файлами

**Файлы:**
- `src/lib/pages/Covers.svelte` — единственный экран (каталог + очистка)

Обложки — общая библиотека изображений: сюда попадает каждый загруженный файл-картинка (через этот экран или через `CoverPicker`/`ImageLibraryModal` в формах проповеди и плейлиста). Экран виден ролям **admin** и **moderator** (пункт сайдбара «Обложки», иконка `images`); все `/files`-эндпоинты защищены `AuthGuard` + `RolesGuard` на те же роли.

## Каталог

- **Маршрут:** `/covers`, без параметров.
- **Что показывается:** заголовок «Обложки», подзаголовок и кнопка «Загрузить обложку». Сетка `.library-grid` из карточек `.cover-card`: ленивая (`loading="lazy"`) `<img>` с `fileUrl`, имя файла (`fileName`), размер (`formatSize`) и бейдж «используется» (`badge-gold`), когда `used = true`. На каждой карточке — оверлейная кнопка удаления (иконка `trash`).
- **Откуда данные:** `getFilesOptions()` (`getFiles` → `GET /files`) — обёртка `AllFilesResponse { files, count }`, элемент — `FileMetadataDto { fileName, fileUrl, size, lastModified, used }`, где `used` = изображение уже является `artwork` какой-либо проповеди или плейлиста.
- **Компоненты:** `Button`, `EmptyState`, `Icon`, `LoadingSpinner`, `Modal`, `Toast`.
- **Навигация:** отдельного экрана-детали у обложки нет — карточка не кликабельна.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - ошибка первичной загрузки: `.form-error-banner`;
  - пусто: `EmptyState` «Обложек пока нет» с кнопкой «Загрузить обложку».

## Загрузка

- Кнопка «Загрузить обложку» в шапке (и в пустом состоянии) открывает скрытый `<input type="file" accept="image/*">`.
- Загрузка идёт через `uploadFileWithProgress` (`src/lib/api/upload.ts`, XHR) — единственное место вне SDK, ради прогресса. Пока идёт загрузка, кнопка показывает `Загрузка N%` и заблокирована.
- **После успеха:** `invalidateFiles(queryClient)` + `Toast` «Обложка загружена». Новая обложка сразу доступна и в каталоге, и в `ImageLibraryModal` форм.
- **Ошибка:** `getErrorMessage(error)` → `Toast`.

## Удаление обложки

- Оверлейная кнопка `trash` на карточке → `Modal` подтверждения («Удалить обложку?», имя файла).
- **Мутация:** `appControllerRemoveFileMutation` (`DELETE /files/{fileName}`) — удаляет **только изображения**; для не-изображений backend отвечает `400`.
- **onSuccess:** `invalidateFiles(queryClient)` + `Toast` «Обложка удалена», модалка закрывается.
- **onError:** если `getErrorStatus(error) === 409` (изображение используется как `artwork`) — `Toast` «Обложка используется в проповедях/плейлистах»; иначе `getErrorMessage(error)`. В обоих случаях модалка закрывается: `409` неисправим из модалки — сначала нужно отвязать обложку в форме проповеди/плейлиста.

## Осиротевшие файлы

- Блок ниже каталога. Кнопка «Найти осиротевшие файлы» запускает скан; повторный клик пересканирует, не сбрасывая прошлый список.
- **Откуда данные:** `appControllerGetOrphanedFilesOptions()` (`GET /files/orphans`), запрос **опциональный** (`enabled: showOrphans`) — скан обходит весь bucket, поэтому не выполняется до запроса пользователя. Ответ — `OrphanedFilesResponse { orphaned, count }`, элементы — `FileMetadataDto` (`used` всегда `false`).
- **Что показывается:** список `.orphan-list` из строк `.orphan-row`: бейдж типа (`audio` — `badge-gold`, `text`/`image` — `badge-neutral`, определяется по расширению через `fileKind`), имя файла, размер. У изображений — пометка «удаляется вручную из каталога».
- **Кнопка «Удалить (N)»:** `N` — число **удаляемых** осиротевших файлов (только аудио/текст; изображения не считаются). Появляется, когда `N > 0`.
- **Подтверждение:** `Modal` «Удалить осиротевшие файлы?» с пояснением, что удаляются только аудио/тексты, а изображения убираются вручную из каталога.
- **Мутация:** `appControllerCleanupOrphanedFilesMutation` (`POST /files/orphans/cleanup`) — идемпотентная best-effort очистка `.mp3/.pdf/.fb2`; ошибка отдельного объекта не роняет запрос.
- **onSuccess:** `invalidateFiles` + инвалидация `appControllerGetOrphanedFilesQueryKey`; результат `CleanupOrphansResponse { deleted, failed }` выводится баннером `.form-success-banner` («Удалено файлов: N») со списком `.orphan-failed` для неудачных (`fileName — reason`); `Toast` «Удалено файлов: N».
- **onError:** `getErrorMessage(error)` → `Toast`.
- **Состояния:** загрузка скана — `LoadingSpinner`; пусто — `EmptyState` «Осиротевших файлов нет»; ошибка — `.form-error-banner`.

## Связанные документы

- [README.md](./README.md) — индекс screens
- [../features/files.md](../features/files.md) — подсистема файлов, `upload.ts`, `invalidateFiles`
- [../features/state.md](../features/state.md) — серверное состояние, инвалидация
- [../features/routing.md](../features/routing.md) — порядок маршрутов (static до dynamic)
- [../contracts/rest-api.md](../contracts/rest-api.md) — карта `/files`-эндпоинтов
