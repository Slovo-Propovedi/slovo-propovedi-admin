# Документация «Слово.Проповеди» — Admin

Папка `docs/` — **первоисточник знаний о проекте** для разработчиков и AI-агентов (opencode, Claude Code, Cursor). Цель — чтобы агент читал `docs/` перед реализацией и не исследовал кодовую базу повторно, экономя токены, и обновлял `docs/` при каждом изменении кода.

Проект: admin-панель платформы «Слово.Проповеди» — **standalone frontend-репозиторий** `slovo-propovedi-admin`: Svelte 5 + Vite SPA. Панель управляет проповедями, плейлистами, разделами, файлами и админ-аккаунтами и потребляет **общий** REST API по OpenAPI-спецификации (версия — в `info.version` внешнего `openAPI.yaml`). Данные приходят с backend API; backend и его документация живут в отдельном репозитории `slovo-propovedi-backend`. Общий контракт REST API — внешний репозиторий `slovo-propovedi-docs`.

> ✅ **Разделение репозиториев выполнено:** этот репозиторий — standalone-фронтенд; backend и его документация — в отдельном репозитории. Подробности — в [`decisions.md`](./decisions.md) и [`architecture.md`](./architecture.md).

## Работа с документацией для агентов (ЖЁСТКИЕ правила)

Эти правила обязательны для любого агента, работающего над проектом.

1. **Перед реализацией фичи/фикса** агент ОБЯЗАН прочитать соответствующие документы:
   - UI / страница → `screens/<экран>.md`;
   - функциональный модуль фронтенда → `features/<модуль>.md`;
   - архитектурное решение → `architecture.md`;
   - процессные договорённости → `conventions.md`.
   Если нужен контракт REST API — см. [`docs/contracts/rest-api.md`](./contracts/rest-api.md); поведение backend — в репозитории `slovo-propovedi-backend`, здесь не документируется.
   Если документ ещё не создан — прочитать код, затем создать/дополнить документ (см. правило 4).

2. **При изменении кода** агент ОБЯЗАН обновить затронутые документы `docs/` **в том же PR/коммите**. Изменение кода без обновления `docs/` считается неполным.

3. **Каждый срезанный угол** (TODO, hack, отложенное решение) → запись в `docs/debt.md` **в том же PR**. Формат записи:
   `- [ ] <что> — <где (пути файлов)> — <когда вернуться>`. Закрытая запись: `- [x] ...`.

4. **Новые зависимости** — только через запись в `docs/decisions.md` (секция Approved stack) с объяснением «почему». Агент НЕ добавляет зависимости вне этого списка без обсуждения.

5. **Если в `docs/` нет нужной информации** — добавить её, исследовав код, чтобы следующий агент не делал это повторно. Неполная документация — тоже долг: добавь запись в `debt.md`.

## Структура docs/

| Файл | Назначение |
|------|------------|
| [`README.md`](./README.md) | Карта документации и правила для агентов (этот файл) |
| [`architecture.md`](./architecture.md) | Архитектура фронтенда: стек, app shell, тема, раскладка `src/` |
| [`conventions.md`](./conventions.md) | Договорённости фронтенда: runes, null-vs-undefined, optimistic reorder, API-клиент, OpenAPI-first workflow, DoD |
| [`decisions.md`](./decisions.md) | Стек и принятые решения (ADRs): repo split, OpenAPI-first, svelte-query, formatReference |
| [`debt.md`](./debt.md) | Технический долг, срезанные углы |
| [`contracts/README.md`](./contracts/README.md) | Индекс контрактов: внешний REST API |
| [`contracts/rest-api.md`](./contracts/rest-api.md) | Общая OpenAPI-спецификация и конвейер кодогенерации (@hey-api) |
| [`features/README.md`](./features/README.md) | Индекс функциональных модулей фронтенда |
| [`features/auth.md`](./features/auth.md) | Авторизация: JWT, refresh-петля, токены, route-guard |
| [`features/routing.md`](./features/routing.md) | Кастомный history-роутер: router.svelte.ts + Router.svelte |
| [`features/state.md`](./features/state.md) | Состояние: @tanstack/svelte-query + runes |
| [`features/sermons.md`](./features/sermons.md) | Модуль «Проповеди»: страницы, форма, поиск |
| [`features/playlists.md`](./features/playlists.md) | Модуль «Плейлисты»: страницы, форма, bulk-replace, reorder |
| [`features/sections.md`](./features/sections.md) | Модуль «Разделы»: страницы, форма, drag-reorder |
| [`features/users.md`](./features/users.md) | Модуль «Пользователи»: CRUD + смена пароля |
| [`features/files.md`](./features/files.md) | Загрузка файлов: upload, CoverPicker, ImageLibraryModal |
| [`features/ui-components.md`](./features/ui-components.md) | Инвентарь UI-примитивов и тема |
| [`screens/README.md`](./screens/README.md) | Индекс экранов фронтенда |
| [`screens/login.md`](./screens/login.md) | Экран входа |
| [`screens/home.md`](./screens/home.md) | Дашборд (главная) |
| [`screens/sections.md`](./screens/sections.md) | Экраны разделов |
| [`screens/playlists.md`](./screens/playlists.md) | Экраны плейлистов |
| [`screens/sermons.md`](./screens/sermons.md) | Экраны проповедей |
| [`screens/users.md`](./screens/users.md) | Экраны пользователей |

> Файлы, помеченные «в разработке» или ещё не созданные, добавляются по мере работы. Таблица служит картой, а не обязательным списком существующих файлов.

## Файлы и папки

Раскладка `src/` (подробно — [`architecture.md`](./architecture.md)):

| Путь (от `src/`) | Назначение |
|------------------|------------|
| `main.ts` | Точка входа: импорт `app.css`, `onAuthExpired`, `await restoreSession()`, `mount` |
| `App.svelte` | `QueryClient` (настройки) + `<QueryClientProvider>` → `<Router/>` |
| `app.css` | Единственный глобальный стиль, design tokens (`:root`), секции |
| `lib/api/` | `client.ts` (baseUrl, токены, 401-refresh), `upload.ts` (XHR), `invalidate.ts`, `generated/` (SDK @hey-api) |
| `lib/router/` | Кастомный history-роутер: `router.svelte.ts` + `Router.svelte` |
| `lib/auth/` | `auth.svelte.ts` — rune-store сессии |
| `lib/layout/` | `Layout.svelte`, `Sidebar.svelte`, `ProtectedRoute.svelte` |
| `lib/pages/` | Страницы (`Login`, `Home`, `Sermons*`, `Playlist*`, `Section*`, `User*`, `UploadSermon`) |
| `lib/components/` | UI-примитивы + переиспользуемые компоненты; `forms/` — формы |
| `lib/utils/` | `labels.ts`, `strings.ts`, `debounce.ts`, `arrayOrder.ts`, `errors.ts` |

> ✅ Все UI-тексты — на русском. Тема — dark-only (тёмный фон + золотой акцент), без переключателя светлой темы.

## ЖЁСТКИЕ правила для агентов

1. **Перед реализацией** фичи/фикса прочитай соответствующий документ `docs/`:
   - механизм (роутер, состояние, загрузка файлов) → `features/<механизм>.md`;
   - домен (sermons/playlists/sections) → `features/<домен>.md`;
   - общие принципы → `architecture.md` и `conventions.md`.
   Отсутствует документ? Прочитай код и создай/дополни документ (правило 4 выше).
2. **При изменении кода** обнови затронутые `docs/**` **в том же PR/коммите**. Изменение кода без обновления документации — неполное.
3. **Срезанный угол** (TODO, hack) → запись в `debt.md` в том же PR.
4. **Сгенерированный код** (`src/lib/api/generated/`) — не редактировать руками; правится только через регенерацию (`npm run gen:api`). Обошёл патч или сгенерировал вручную — это нарушение конвенции (см. [`conventions.md`](./conventions.md)).
5. **Никакого клиентского zod-валидирования форм** — валидацию выполняет backend (strictObject). Формы используют HTML `required`/`min` + семантику null/undefined (см. [`conventions.md`](./conventions.md)).

## Разделение репозиториев

Разделение **выполнено**: бывший монорепозиторий разбит на два независимых репозитория.

- **Этот репозиторий** — standalone-фронтенд `slovo-propovedi-admin` (Svelte 5 SPA); его бывший путь `frontend/web-app/` теперь корень репо. Вся его документация — здесь, в `docs/`.
- **Backend** — отдельный репозиторий `slovo-propovedi-backend`; его документация живёт рядом с кодом (co-location). В этом репозитории её нет.
- **REST-контракт и конвейер кодогенерации** — [`docs/contracts/rest-api.md`](./contracts/rest-api.md): контракт **общий** и живёт и здесь (фронтенд-кодогенерация @hey-api), и в backend-репозитории. Сама OpenAPI-спецификация — внешний репозиторий `slovo-propovedi-docs`, публикуется на `https://docs.slovo-propovedi.ru/openAPI.yaml`.

Причина разделения: админ-фронтенд отделён от API, чтобы они развивались и версионировались независимо. Подробности и обоснование — в [`decisions.md`](./decisions.md) и [`architecture.md`](./architecture.md).

## Соглашения по ведению

- Язык — **русский**; технические термины (Svelte, zod, `@hey-api`, runes, NestJS) — английским как есть.
- Машино-проверяемые правила (eslint, prettier, svelte-check) уже настроены — docs объясняют «почему», а не дублируют правила.
- Ссылки на код — конкретные пути (`src/lib/`), ссылки между документами — относительные.
- Подробнее о процессе ведения: [`conventions.md`](./conventions.md).

## Краткий контекст продукта

Admin-панель платформы «Слово.Проповеди» управляет контентом, который виден на сайте и в мобильном приложении. Панель администрирует **проповеди** (аудио/текст/YouTube, ссылка на библейскую книгу), **плейлисты** (упорядоченные подборки проповедей), **разделы** (слайдеры плейлистов на главном экране сайта) и **админ-аккаунты**. Данные приходят с backend API через **общий** REST API по OpenAPI-спецификации (версия — в `info.version` внешнего `openAPI.yaml`), с которой фронтенд генерирует SDK @hey-api. Фронтенд (Svelte 5, @tanstack/svelte-query) — SPA с кастомным history-роутером; авторизация — JWT через экран логина. Поиск/фильтрация проповедей реализованы (`GET /sermons?search=`, debounce-инпут в `Sermons.svelte`). Подробности и долги — в [`debt.md`](./debt.md).

## Связанные документы

- [architecture.md](./architecture.md) — архитектура фронтенда
- [conventions.md](./conventions.md) — договорённости, OpenAPI-first workflow, DoD
- [decisions.md](./decisions.md) — стек и принятые решения
- [debt.md](./debt.md) — технический долг
- [contracts/rest-api.md](./contracts/rest-api.md) — REST-контракт и конвейер кодогенерации
