# Пользователи (users)

Домен users: список с клиентским поиском, деталь (смена пароля и удаление), создание/редактирование, форма. Данные пользователей приходят с backend API.

**Слой:** frontend (feature: users)
**Файлы:** `src/lib/pages/{Users,UserCreate,UserEdit,UserDetail}.svelte`, `src/lib/components/forms/UserForm.svelte`
**Статус:** актуально

> ⚠️ Users — единственный домен, где **все** запросы (включая чтения `usersControllerFindAll`/`FindOne`) идут под `AuthGuard`: на бэкенде у users нет публичных GET (в отличие от section/sermon/playlist).

## Маршруты

| Паттерн | Страница | Данные |
|---------|----------|--------|
| `/users` | `Users.svelte` | `usersControllerFindAllOptions()` + клиентский поиск |
| `/users/create` | `UserCreate.svelte` | — (`UserForm`, mode create) |
| `/users/:id` | `UserDetail.svelte` | `usersControllerFindOneOptions` + `usersControllerRemoveMutation` + `usersControllerChangePasswordMutation` |
| `/users/:id/edit` | `UserEdit.svelte` | `usersControllerFindOneOptions` → `UserForm`, mode edit |

> ✅ Порядок маршрутов в `Router.svelte` — статические сегменты до динамических: `/users/create` → `/users/:id/edit` → `/users/:id` → `/users` (см. [`routing.md`](./routing.md)).

## Список (`Users.svelte`)

- **Клиентский поиск + debounce:** `searchInput` → `debounce(300)` → `debouncedTerm`. Фильтрация идёт **на клиенте** по `name`/`email`/`username` (список маленький), а не на сервере — в отличие от sermons (там поиск серверный). Пустой термин показывает полный список.
- Данные: `createQuery(() => usersControllerFindAllOptions())` → `usersQuery.data` (плоский массив `UserResponse[]`).
- Карточки `.list-item` в `list-grid`: обложка-плейсхолдер (первая буква имени), имя, email; бейдж `username` (`badge-neutral`). Клик/Enter → `/users/:id`.
- Кнопка «Создать» (в шапке и в `EmptyState`-snippet) → `/users/create`.
- Состояния: загрузка — `LoadingSpinner large`; пусто — `EmptyState` «Пользователей пока нет» (с hint «Создайте первого администратора…»); ошибка — `.form-error-banner` с `getErrorMessage`.

## Деталь (`UserDetail.svelte`)

- **Маршрут:** `/users/:id`, параметр `:id` (uuid, из `matchRoute` → `params.id`).
- Данные: `usersControllerFindOneOptions({ path: { id } })`; мутации `usersControllerRemoveMutation` и `usersControllerChangePasswordMutation`.
- **Что показывается:** `Breadcrumbs` («Пользователи / <имя>»), заголовок `user.name` + подзаголовок `user.email`, `.detail-grid` со статистикой: Имя, Username, Email, ID. Кнопки: «Редактировать» (→ `/users/:id/edit`), «Сменить пароль» (открывает password-`Modal`), «Удалить» (открывает delete-`Modal`).
- **Кнопка «Удалить» скрыта для собственного аккаунта:** рендерится только при `id !== currentUserId`, где `currentUserId = auth.user?.id` через `getAuthState()` из `$lib/auth/auth.svelte.ts`. Это дублирует защиту self-delete на бэкенде (403).
- **Delete-`Modal`:** confirm → `deleteMutation.mutate({ path: { id } })` → `invalidateUsers(queryClient)` + `navigate('/users')`. Ошибка — `.field-error` в модалке; транзитное состояние сбрасывается при закрытии.
- **Password-`Modal`:** поле `Input type="password"` «Новый пароль» → `passwordMutation.mutate({ body: { password }, path: { id } })` (`usersControllerChangePasswordMutation`). Пустой пароль блокируется клиентом («Введите новый пароль.»). `onSuccess` → `invalidateUsers(queryClient, id)` + закрытие модалки.
- Состояния: загрузка — `LoadingSpinner large`; не найдено — `EmptyState` «Пользователь не найден».

## Создание (`UserCreate.svelte`)

- **Маршрут:** `/users/create`.
- Тонкая обёртка над `<UserForm mode="create" />`: `Breadcrumbs` («Пользователи / Создать»), заголовок «Новый пользователь», подзаголовок «Все пользователи получают доступ к админ-панели».
- Данных страница не грузит — вся логика в `UserForm`.

## Редактирование (`UserEdit.svelte`)

- **Маршрут:** `/users/:id/edit`.
- Тонкая обёртка: `Breadcrumbs` («Пользователи / Редактирование»), заголовок «Редактирование пользователя», подзаголовок «Пароль меняется отдельно на странице пользователя». Перед рендером формы грузит `usersControllerFindOneOptions({ path: { id } })`; `UserForm mode="edit"` монтируется **только после** успешной загрузки (`initial={userQuery.data}`). Пока идёт загрузка — `LoadingSpinner large`.

## UserForm (общая форма)

- **Пропсы:** `{ mode: 'create'|'edit'; id?; initial?: UserResponse }`. Снапшот `initial` через замыкание на монтировании; каждое поле — `$state`.
- **Поля:**

| Поле | Контрол | Заметки |
|------|---------|---------|
| `name` | `Input` required | «Имя» |
| `email` | `Input` type=email required | «Email» |
| `username` | `Input` required | «Логин», hint «Необязательно совпадает с именем» |
| `password` | `Input` type=password required | **только в mode create** (скрыт в edit; смена пароля — отдельный эндпоинт на детали) |

- **Мутации:** `usersControllerCreateMutation` / `usersControllerUpdateMutation`.
- **Edit отправляет только changed-поля:** payload собирается из полей, которые отличаются от `initial` (`name !== trimmed(initial.name)` и т.д.); пропущенные ключи на `PATCH` означают «не менять». Если изменений нет — просто `navigate` назад без запроса.
- **Валидация:** без клиентского zod — HTML `required` + проверка на заполненность в `handleSubmit` («Заполните все поля.», только для create, т.к. там обязателен пароль). Ошибки — `getErrorMessage` → `.form-error-banner`.
- **После успеха:** create → `invalidateUsers(queryClient)` + `navigate('/users')`; edit → `invalidateUsers(queryClient, id)` + `navigate('/users/:id')`.

## Связанные документы

- [state.md](./state.md) — `invalidateUsers`, cross-entity инвалидация
- [ui-components.md](./ui-components.md) — Input/Button/Modal/Breadcrumbs/EmptyState/LoadingSpinner/Icon
- [routing.md](./routing.md) — порядок маршрутов (static до dynamic)
- REST-контракт и карта эндпоинтов users — [`../contracts/rest-api.md`](../contracts/rest-api.md)
- [../conventions.md](../conventions.md) — null-vs-undefined, API-клиент
- [../README.md](../README.md) — индекс раздела фронтенда
