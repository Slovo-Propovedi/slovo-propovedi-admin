# Экран «Пользователи» (users)

**Маршруты:**
- `/users` — список пользователей (с клиентским поиском)
- `/users/create` — создание пользователя
- `/users/:id` — деталь пользователя (смена пароля, удаление)
- `/users/:id/edit` — редактирование пользователя

**Файлы:**
- `src/lib/pages/Users.svelte` — список
- `src/lib/pages/UserDetail.svelte` — деталь
- `src/lib/pages/UserCreate.svelte` — создание (обёртка над формой)
- `src/lib/pages/UserEdit.svelte` — редактирование (обёртка над формой)
- `src/lib/components/forms/UserForm.svelte` — общая форма

Пользователь — админ-аккаунт системы. Роли (`UserRole` из SDK): `admin` — полный доступ (включая домен users), `moderator` — контент без users, `user` — в панель не входит (блокируется на входе, см. [`../features/auth.md`](../features/auth.md)). Домен `/users/*` доступен только `admin`: Sidebar скрывает ссылку, `Router.svelte` выбрасывает не-admin на `/`.

## Список

- **Маршрут:** `/users`, без параметров.
- **Что показывается:** заголовок «Пользователи», подзаголовок «Управление администраторами системы.», кнопка «Создать» (+ значок `plus`). Поле `<Input>` «Поиск» (placeholder «Имя, email или логин…»). Список `.list-grid` карточек `.list-item`: обложка-плейсхолдер (первая буква имени), имя, подзаголовок — email, бейдж `badge-gold` — роль (`ROLE_LABELS[user.role]`), бейдж `badge-neutral` — username.
- **Откуда данные:** `usersControllerFindAllOptions()` (`createQuery`) — плоский массив `UserResponse[]`.
- **Клиентский поиск + debounce:** `<Input>` «Поиск» + `debounce(300)` → реактивный `debouncedTerm`. Фильтрация — **на клиенте** по `name`/`email`/`username` (список маленький; в отличие от `/sermons`, где поиск серверный). Пустой термин показывает полный список.
- **Компоненты:** `Button`, `EmptyState`, `Icon`, `Input`, `LoadingSpinner`.
- **Навигация:** клик/Enter по карточке → `/users/:id`; «Создать» → `/users/create`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - пусто: `EmptyState` «Пользователей пока нет» (hint «Создайте первого администратора…», действие «Создать»);
  - ошибка: `.form-error-banner` с `getErrorMessage`.

## Деталь

- **Маршрут:** `/users/:id`, параметр `:id` (uuid, из `matchRoute` → `params.id`).
- **Что показывается:** `Breadcrumbs` («Пользователи / <имя>`), заголовок `user.name`, подзаголовок `user.email`, кнопки «Редактировать» (значок `edit`), «Сменить пароль», «Удалить» (значок `trash`). Блок `.detail-grid` со статистикой: Имя, Роль (`ROLE_LABELS[user.role]`), Username, Email, ID.
- **Откуда данные:** `usersControllerFindOneOptions({ path: { id } })` (`createQuery`); мутации `usersControllerRemoveMutation` и `usersControllerChangePasswordMutation`.
- **Компоненты:** `Breadcrumbs`, `Button`, `EmptyState`, `Icon`, `Input`, `LoadingSpinner`, `Modal`.
- **Кнопка «Удалить» скрыта для собственного аккаунта:** рендерится только при `id !== currentUserId` (`currentUserId = auth.user?.id` через `getAuthState()` из `$lib/auth/auth.svelte.ts`). Дублирует серверную защиту self-delete (403).
- **Delete-`Modal` («Удалить пользователя?»):** confirm → `deleteMutation` → `invalidateUsers(queryClient)` + `navigate('/users')`. Ошибка — `.field-error` в модалке.
- **Password-`Modal` («Смена пароля»):** `Input type="password"` «Новый пароль» → `passwordMutation` (`body: { password }, path: { id }`). Пустой пароль блокируется клиентом. `onSuccess` → `invalidateUsers(queryClient, id)` + закрытие модалки. Ошибка — `.field-error`.
- **Навигация:** «Редактировать» → `/users/:id/edit`; подтверждение удаления → `/users`.
- **Состояния:**
  - загрузка: `LoadingSpinner large`;
  - не найдено: `EmptyState` «Пользователь не найден»;
  - транзитное состояние модалок (пароль/ошибка) сбрасывается при закрытии через `$effect`.

## Создание

- **Маршрут:** `/users/create`.
- Тонкая обёртка над `<UserForm mode="create" />`: `Breadcrumbs` («Пользователи / Создать`), заголовок «Новый пользователь», подзаголовок «Роль определяет доступ: администратор и модератор входят в панель, обычный пользователь — нет».
- Данных страница не грузит — вся логика в `UserForm`.

## Редактирование

- **Маршрут:** `/users/:id/edit`.
- Тонкая обёртка: `Breadcrumbs` («Пользователи / Редактирование`), заголовок «Редактирование пользователя», подзаголовок «Пароль меняется отдельно на странице пользователя». Перед рендером формы грузит `usersControllerFindOneOptions({ path: { id } })`; `UserForm mode="edit"` монтируется **только после** успешной загрузки (`initial={userQuery.data}`), поэтому пропсы формы стабильны. Пока идёт загрузка — `LoadingSpinner large`.

## UserForm (общая форма)

- **Пропсы:** `{ mode: 'create'|'edit'; id?; initial?: UserResponse }`.
- **Поля:** имя (`Input` required), email (`Input` type=email required), логин (`Input` required, hint «Необязательно совпадает с именем»), роль (`Select` «Роль», опции `ROLE_LABELS`; по умолчанию `'user'`, показывается в обоих режимах). Пароль (`Input` type=password required) — **только в mode create** (в edit скрыт: смена пароля — отдельный эндпоинт на странице детали).
- **Мутации:** `usersControllerCreateMutation` / `usersControllerUpdateMutation`. **Create** шлёт `role` всегда; в **edit** отправляются **только changed-поля** (включая `role`, сравнение с `initial?.role ?? 'user'`); пустой payload → просто `navigate` без запроса.
- **Валидация:** без клиентского zod — HTML `required` + проверка заполненности в `handleSubmit` («Заполните все поля.», для create). Ошибки — `getErrorMessage` → `.form-error-banner`.
- **После успеха:** create → `invalidateUsers(queryClient)` + `navigate('/users')`; edit → `invalidateUsers(queryClient, id)` + `navigate('/users/:id')`.

## Связанные документы

- [README.md](./README.md) — индекс screens
- [../features/users.md](../features/users.md) — домен пользователей
- [../features/routing.md](../features/routing.md) — порядок маршрутов (static до dynamic)
- [../features/state.md](../features/state.md) — инвалидация
