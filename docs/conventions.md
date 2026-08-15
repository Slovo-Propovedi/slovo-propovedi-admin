# Договорённости (conventions)

Договорённости для кода admin SPA и для работы в этом репозитории. Здесь — правила, которые обязан соблюдать любой агент/разработчик. Машино-проверяемое (eslint, prettier, `svelte-check`, типы) не дублируется; фиксируются неочевидные и осознанные решения. Процессные договорённости backend — в репозитории `slovo-propovedi-backend`, здесь не дублируются.

**Слой:** frontend (admin SPA)
**Статус:** актуально

## Svelte 5 runes

Весь реактивный код — на runes. `svelte/store` (writable/readable) **не используется**.

| Rune | Назначение | Примеры |
|------|-----------|---------|
| `$state` | локальное реактивное состояние | поля форм, `localSections` в reorder-страницах, флаги загрузки |
| `$derived` / `$derived.by` | вычисляемые значения | `playlists`, `sermonOptions`, `match` в роутере, `activeItem` в Sidebar |
| `$effect` | сайд-эффекты по зависимостям | синхронизация локального списка с query-данными, guard-редирект |
| `$props()` | декларация props (в т.ч. `$bindable`) | все компоненты |
| `{@render children()}` | слоты/сниппеты | `Layout`, `DndList`, `Modal`, `EmptyState` |

Ключевые паттерны:

- **Снапшоты форм через замыкания.** Формы (`SermonForm`, `SectionForm`, `PlaylistForm`) читают `initial` в функции `createFormSnapshot()` **при монтировании**, потому что edit-страницы монтируют форму только после загрузки записи — props стабильны. Поля — отдельные `$state`, инициализированные из снапшота.
- **`$derived` не должен мутировать состояние.** Для вывода — `$derived`; для мутаций — `$effect` или обработчики событий.

## null vs undefined в теле запроса

Единая семантика для всех форм (комментарии прямо в коде форм):

| Значение | Смысл |
|----------|-------|
| `null` | **очистить** колонку/поле на backend (пример: `description: trimmed(...) || null`) |
| `undefined` (ключ опущен) | **не менять** значение (backend читает как «no change») |
| массив отношений (всегда шлётся) | пустой массив **очищает** связи; `undefined` значил бы «не трогать» |

Примеры:

- `SermonForm`: `chapter`/`verse`/`audioUrl`/`youtubeUrl`/`textFileUrl`/`book`/`description` — nullable, при очистке шлют `null`; `playlistsIds` — всегда массив.
- `SectionForm`: `description`/`itemsRows` — `null` при очистке; `playlistsIds` — массив.
- `PlaylistForm`: `description` — `null`; `sermonsIds` и `sectionsIds` — всегда массивы (оба режима, пустой массив очищает связи).

> ✅ Это соответствует backend-валидации: zod-схемы на границе (`strictObject`) различают `null` и отсутствие ключа.

## Optimistic reorder

Переупорядочивание списков — оптимистичное, с локальной «теневой» копией и откатом. Реализовано **трижды** (Sections, SectionDetail, PlaylistDetail) по единому паттерну:

1. Локальные `$state`: `local<Items>`, `<items>Snapshot`, `isDragging`, `synced<Items>`.
2. `$effect` синхронизирует `local<Items>` из query-данных **только когда не идёт перетаскивание** и `fresh !== synced<Items>` (защита от «мигания» старым порядком после успешного reorder).
3. `handleReorder(newOrder, isFinalize)` (`DndList`): на первом `consider` фиксирует `Snapshot`; на `finalize` — если `hasOrderChanged(snapshot, newOrder)` (из `utils/arrayOrder.ts`), шлёт мутацию с полным in-scope набором `ids`, иначе просто снимает `isDragging`.
4. Защита: если на `finalize` длина массива не совпадает со снапшотом (drag не подтвердил позицию) — восстанавливается снапшот, запрос не шлётся.
5. `onSuccess` → `invalidateSection/Playlist(queryClient)`; `onError` → откат `local<Items> = <items>Snapshot` + `Toast` с ошибкой.

`DndList.svelte` (обёртка `svelte-dnd-action`) вырезает shadow-плейсхолдер (`SHADOW_PLACEHOLDER_ITEM_ID`) во всех событиях, чтобы он не попадал в родительское состояние.

## API-клиент: сгенерированный SDK — контракт

- Страницы и формы **никогда не вызывают `fetch`/`axios` напрямую** — только через сгенерированные хуки `@tanstack/svelte-query.gen` (`*Options`/`*Mutation`) поверх единого `client` из `generated/client.gen.ts`.
- **Единственное исключение** — `src/lib/api/upload.ts`: загрузка файлов идёт по XHR (`POST ${API_BASE_URL}/files`) ради прогресса и abort (fetch-транспорт прогресса не даёт). Auth согласована через `getAccessToken()` из `client.ts`.
- **Инвалидация cross-entity** — всегда через `invalidate.ts`, а не руками: сущности вложены друг в друга, поэтому `invalidateSermon`/`invalidatePlaylist`/`invalidateSection` сбрасывают списки И детали связанных сущностей (см. [`features/state.md`](./features/state.md)).
- Сгенерированный код (`generated/`) не редактируется вручную; только `npm run gen:api` (openapi-ts + патчи zod, см. [`contracts/rest-api.md`](./contracts/rest-api.md)).

## Никакого клиентского zod для форм

- Валидацию полей выполняет **backend** (zod `strictObject` на границе).
- Фронт полагается на HTML `required`/`min` у инпутов; ошибки из `getErrorMessage(error)` (`utils/errors.ts`) показываются в `.form-error-banner`.
- zod на клиенте есть только в сгенерированных request/response-валидаторах SDK (`zod.gen.ts`) — это не ручная валидация форм.

## Прочее

- **UI-тексты** — на русском. Код и технические термины — английские.
- **Стили** — только глобальный `app.css`; в компонентах нет `<style>`-блоков.
- **Переиспользование** — сначала смотри `components/` и `utils/`; не дублируй форматтеры/лейблы.
- **Токены** — цвета/шрифты/тени только через `--`-переменные из `:root` (`app.css`).

## OpenAPI-first workflow (главное)

Проект работает по **OpenAPI-first**: единая спецификация — **источник истины** для всех API-контрактов, а клиент генерируется из неё. Спецификация **живёт в отдельном внешнем swagger-репозитории** и доступна по URL `https://docs.slovo-propovedi.ru/openAPI.yaml` (версия — в `info.version` этого файла, в доках не фиксируется). Этот же URL захардкожен в конфиге кодогенерации фронтенда.

> ⚠️ Полное описание конвейера (конфиги, выходные каталоги, команды, патчи) — в [`docs/contracts/rest-api.md`](./contracts/rest-api.md). Ниже — только правила процесса.

### Процесс изменения API

1. **Отредактировать спецификацию** в swagger-репозитории (вне этого репозитория) и задеплоить её на `docs.slovo-propovedi.ru`.
2. **Регенерировать фронтенд** (см. ниже), чтобы клиент взял новые контракты.
3. **Закоммитить** все сгенерированные файлы вместе с изменениями кода.

### Команды регенерации

| Действие | Команда |
|----------|---------|
| Frontend (SDK @hey-api) | `npm run gen:api` (из корня репозитория) |

### Свежесть сгенерированных схем

Если сгенерированный код «устарел» относительно спецификации — регенерируй. Типичный признак: `git diff` по `src/lib/api/generated/` пустой, но спецификация изменилась. Для CI можно проверять свежесть:

```bash
npm run gen:api && git diff --exit-code -- src/lib/api/generated/ \
  || (echo "Generated SDK is stale. Run: npm run gen:api" && exit 1)
```

## Git

- **Ветки:** feature-ветки от `main`. MR должен быть маленьким и самодостаточным.
- **Формат коммита:** conventional commits (`feat`, `fix`, `refactor`, `test`, `docs`, `style`, `chore`). Заголовок — до 100 символов.
- **Pre-commit:** Husky (`package.json` → `prepare: husky`).
- **MR-процесс:** каждый MR сопровождается описанием «что и зачем», ссылками на изменённые модули и на обновлённые документы `docs/`.

## Работа с AI-агентами

- Задача даётся через ссылки на `docs/` — а не через ссылки на код. Агент читает нужный документ из `docs/` ПЕРЕД стартом.
- Перед реализацией агент ОБЯЗАН прочитать: `architecture.md` (для архитектурных изменений), документы затронутых модулей/контрактов.
- После изменения кода агент ОБЯЗАН обновить затронутые документы `docs/` **в том же PR/коммите**. Изменение кода без обновления `docs/` — неполное изменение.
- Каждое срезанное решение фиксируется в `docs/debt.md` в том же PR (см. ниже).
- Машино-проверяемые команды агент запускает из DoD-чеклиста (ниже).

## Ведение документации docs/

- **Язык:** русский. Технические термины и кодовые идентификаторы — английским как есть.
- **Структура каждого типа документа** предсказуема и задана в [`README.md`](./README.md) (карта) — новый документ создаётся по тому же шаблону, что и соседние. Каждый документ заканчивается секцией `## Связанные документы`.
- **Перекрёстные ссылки** между документами и на конкретные пути в коде (`src/lib/`) — обязательны и относительные (`[architecture.md](./architecture.md)`).
- **Не выдумывать факты.** Если факт неизвестен — посмотреть в коде или оставить пометку `<!-- TODO: уточнить -->` и записать в `debt.md`.
- **Решения не стираются:** отменённое решение помечается зачёркиванием с объяснением в `decisions.md` (секция Superseded), а не удаляется.
- **Формат долга** (в `debt.md`): `- [ ] <что> — <где (пути файлов)> — <когда вернуться>`. Закрытое: `- [x] ...`.
- **Разделение по репозиториям:** этот репозиторий документирует только фронтенд; backend-документация — в `slovo-propovedi-backend`. Не дублируй backend-внутренности здесь.

## Definition of Done (DoD)

Чеклист перед завершением PR:

- [ ] frontend: `svelte-check`, сборка — без ошибок;
- [ ] `docs/` обновлены в том же PR (затронутые `features/`, `screens/`, корневые `architecture.md`/`conventions.md`/`decisions.md`/`debt.md` при необходимости);
- [ ] срезанные углы записаны в `docs/debt.md`;
- [ ] новые зависимости — только через `docs/decisions.md` (Approved stack);
- [ ] коммиты — conventional commits, заголовок ≤ 100 символов;
- [ ] при изменении API — спецификация обновлена во внешнем репозитории, фронтенд регенерирован (`npm run gen:api`), сгенерированные файлы закоммичены.

## Связанные документы

- [README.md](./README.md) — карта документации и правила для агентов
- [architecture.md](./architecture.md) — стек, app shell, тема, раскладка `src/`
- [features/state.md](./features/state.md) — серверное состояние и cross-entity инвалидация
- [features/sections.md](./features/sections.md) — пример optimistic reorder (Sections/SectionDetail)
- [features/playlists.md](./features/playlists.md) — reorder плейлиста и пикер проповедей
- [features/files.md](./features/files.md) — XHR-загрузка и семантика upload
- OpenAPI-конвейер — [`contracts/rest-api.md`](./contracts/rest-api.md)
- [decisions.md](./decisions.md) — стек и принятые решения
- [debt.md](./debt.md) — формат и учёт долга
