# docs/frontend/screens — Описание экранов админ-панели

Папка `screens/` описывает **экраны** admin SPA «Слово.Проповеди» (Svelte 5 + Vite) — по одному документу на **сущность**. Каждый документ покрывает все страницы этой сущности: список, деталь, создание и редактирование.

В отличие от `../features/*`, где фиксируются **механизмы и домены** (как устроено), здесь описывается **«что видит и куда нажимает пользователь» на каждой странице** (как используется). Машино-проверяемые правила не дублируются.

Для каждого экрана фиксируется:

- **маршрут** (pattern из `Router.svelte`) и **URL-параметры**;
- **что показывается** (элементы UI);
- **откуда приходят данные** (query hook, мутации);
- **какие компоненты собираются**;
- **куда можно перейти** (навигация);
- **состояния и optimistic-паттерны** (загрузка/пусто/ошибка, drag-and-drop).

Тексты UI — на русском. Ссылки на код — конкретными путями (`src/lib/pages/...`, `src/lib/components/...`). Маршруты живут в `frontend/web-app/src/lib/router/Router.svelte`, логика роутера — в [`router.svelte.ts`](../../frontend/features/routing.md).

> **Правило:** при изменении страницы обновляй соответствующий файл в этой папке в том же PR.

## Список документов

| Сущность / экран | Файл | Статус |
|------------------|------|--------|
| Вход (login) | [login.md](./login.md) | готов |
| Главная (dashboard) | [home.md](./home.md) | готов |
| Разделы (sections) | [sections.md](./sections.md) | готов |
| Плейлисты (playlists) | [playlists.md](./playlists.md) | готов |
| Проповеди (sermons) | [sermons.md](./sermons.md) | готов |

## Структура файла экрана (шаблон)

Каждый документ начинается с `# H1` (название сущности), после которого идёт **блок жирных подписей** (`**Маршруты:**` и `**Файлы:**`), а затем — по подразделу `##` на каждый экран сущности. Заголовки — `##` и `###`, без фронт-материи.

```markdown
# Экран «<Название сущности>» (kebab-case)

**Маршруты:**
- `/entity` — список
- `/entity/create` — создание
- `/entity/:id` — деталь
- `/entity/:id/edit` — редактирование

**Файлы:**
- `src/lib/pages/<Entity>List.svelte` — список
- `src/lib/pages/<Entity>Detail.svelte` — деталь
- `src/lib/components/forms/<Entity>Form.svelte` — общая форма (создание/редактирование)

## Список

- **Маршрут:** `/entity`, без параметров.
- **Что показывается:** <список элементов UI>.
- **Откуда данные:** `<entity>ControllerFindAllOptions` (`createQuery`); мутации: `<...>Mutation`.
- **Компоненты:** `Button`, `EmptyState`, `LoadingSpinner`, ...
- **Навигация:** клик по элементу → `/entity/:id`; «Создать» → `/entity/create`.
- **Состояния:** загрузка — `LoadingSpinner large`; пусто — `EmptyState`; ошибка — обработка `@tanstack/svelte-query`.
- **Optimistic-паттерн:** <если есть, иначе опускается>.

## Деталь

- **Маршрут:** `/entity/:id`, параметр `:id` (uuid, из `matchRoute`).
- ... аналогично ...

## Создание

- **Маршрут:** `/entity/create`.
- Тонкая обёртка над `<EntityForm mode="create" />`.

## Редактирование

- **Маршрут:** `/entity/:id/edit`.
- Тонкая обёртка над `<EntityForm mode="edit" id initial>` (монтируется только после загрузки записи).

## Связанные документы

- [features/<entity>.md](../features/<entity>.md) — домен
- [features/routing.md](../features/routing.md) — кастомный роутер
- [features/state.md](../features/state.md) — состояние
- [backend/modules/<entity>.md](../../backend/modules/<entity>.md) — API
```

Простые экраны (login, home) можно описывать короче — шаблон не обязателен дословно. Для сущностей создание/редактирование — **тонкие обёртки над общей формой**, поэтому им отводится короткий подраздел без дублирования содержимого формы.

> ✅ Один документ на сущность: список, деталь, создание и редактирование объединены в один файл, т.к. create/edit — тонкие обёртки над одной и той же формой.

## Связанные документы

- [../README.md](../README.md) — индекс docs/frontend
- [../features/routing.md](../features/routing.md) — кастомный history-роутер (механика `matchRoute`, порядок маршрутов)
- [../features/state.md](../features/state.md) — серверное состояние и optimistic reorder
- [../features/sermons.md](../features/sermons.md) — домен проповедей
- [../features/playlists.md](../features/playlists.md) — домен плейлистов
- [../features/sections.md](../features/sections.md) — домен разделов
- [../contracts/rest-api.md](../../contracts/rest-api.md) — эндпоинты и конвейер кодогенерации
- [../../backend/modules/README.md](../../backend/modules/README.md) — модули backend (API)
