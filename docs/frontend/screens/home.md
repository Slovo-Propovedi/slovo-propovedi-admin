# Экран «Главная» (home)

**Маршруты:**
- `/` — дашборд с количеством сущностей и быстрыми действиями

**Файлы:**
- `src/lib/pages/Home.svelte` — страница

## Дашборд

- **Маршрут:** `/`, без параметров.
- **Что показывается:**
  - заголовок «Добро пожаловать{, <имя>}» (из `auth.user?.name`) и подзаголовок «Управляйте разделами, плейлистами и проповедями…»;
  - сетка `.stats-grid` из трёх статистических карточек `.stat-card` — «Разделы», «Плейлисты», «Проповеди» с количеством (или «…» пока не загружено);
  - карточка «Быстрые действия» с тремя кнопками: «Создать раздел», «Создать плейлист», «Загрузить проповедь».
- **Откуда данные:** три независимых `createQuery` — `sectionControllerFindAllOptions()`, `playlistControllerFindAllOptions()`, `sermonControllerFindAllOptions()` (без `search`). Счётчики — `$derived(...?.sections?.length ?? null)`.
- **Компоненты:** `Icon` (`plus`, `upload`); стили `.card`, `.card-hover`, `.stat-card`, `.btn`.
- **Навигация:**
  - статистическая карточка → `/sections`, `/playlists`, `/sermons` (соответственно);
  - «Создать раздел» → `/sections/create`;
  - «Создать плейлист» → `/playlists/create`;
  - «Загрузить проповедь» → `/sermons/upload`.
  Все переходы — через `navigate(path)` (на `onclick` с `preventDefault`), либо нативным `href` + перехват клика.
- **Состояния:**
  - загрузка: счётчик показывает «…» (placeholder), сам дашборд рендерится сразу;
  - ошибка: обработка стандартная `@tanstack/svelte-query` (ретраи/кэш), карточки остаются с «…».

> ✅ Страница — лёгкая «витрина» данных: отдельного эндпоинта статистики нет, количество считается как длина списка из `findAll`. Все списки кэшируются `@tanstack/svelte-query` (см. [`../features/state.md`](../features/state.md)).

## Связанные документы

- [README.md](./README.md) — индекс screens
- [sections.md](./sections.md) — экраны разделов
- [playlists.md](./playlists.md) — экраны плейлистов
- [sermons.md](./sermons.md) — экраны проповедей
- [../features/state.md](../features/state.md) — серверное состояние
- [../features/routing.md](../features/routing.md) — роутер и `navigate`
