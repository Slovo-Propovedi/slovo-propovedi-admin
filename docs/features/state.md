# Состояние

Как админка управляет серверным (данные с API) и локальным состоянием. Серверное — `@tanstack/svelte-query`, локальное — Svelte runes.

**Слой:** frontend (feature: state)
**Файлы:** `src/App.svelte`, `src/lib/api/invalidate.ts`, `src/lib/api/generated/@tanstack/svelte-query.gen.ts`
**Статус:** актуально

## Серверное состояние — `@tanstack/svelte-query`

**`QueryClient`** настраивается один раз в `src/App.svelte` и оборачивает `<Router/>` через `<QueryClientProvider>`:

```ts
new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,        // данные «свежие» 30 с
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});
```

> ⚠️ В коде `App.svelte` используется `QueryClientProvider` (корневой) — единый клиент для всего приложения. Один экземпляр, никаких локальных клиентов на страницах.

## Паттерн `createQuery` / `createMutation`

Сгенерированные хуки из `@tanstack/svelte-query.gen.ts` дают для каждой операции:

- `...Options` — конфиг для `createQuery`;
- `...Mutation` — конфиг для `createMutation`;
- `...QueryKey` — ключ кэша (нужен для точечной инвалидации).

```ts
// query
const query = createQuery(() => sermonControllerFindAllOptions({ query: { search } }));
let data = $derived(query.data?.sermons ?? []);

// mutation
const mutation = createMutation(() => ({
  ...sermonControllerUpdateMutation(),
  onSuccess: () => { invalidateSermon(queryClient, id); navigate(`/sermons/${id}`); },
  onError: (error) => { submitError = getErrorMessage(error); },
}));
mutation.mutate({ body, path: { id } });
```

Правило: страницы/формы **не вызывают `fetch`/SDK напрямую** для данных — только `createQuery`/`createMutation`; `useQueryClient()` для инвалидации.

## `invalidate.ts` — cross-entity инвалидация

Сущности **вложены друг в друга** (плейлисты и разделы несут свои проповеди/плейлисты). Поэтому трогая одну сущность, сбрасывают связанные списки **и** детали. Хелперы:

| Функция | Сбрасывает |
|---------|-----------|
| `invalidateOperation(qc, op)` | по имени операции (`{ _id }`) |
| `invalidateFiles(qc)` | `getFilesQueryKey()` (после загрузки обложки) |
| `invalidateSermon(qc, id?)` | `sermonControllerFindAll` + `playlistControllerFindAll` + `sectionControllerFindAll` + `playlistControllerFindOne` + `sectionControllerFindOne` + `sermonControllerGetDistinctValues` (+ `sermonControllerFindOne` по `id`) |
| `invalidatePlaylist(qc, id?)` | симметрично: playlists/sermons/sections (списки + детали) |
| `invalidateSection(qc, id?)` | симметрично: sections/playlists/sermons (списки + детали) |
| `invalidateUsers(qc, id?)` | `usersControllerFindAll` (+ `usersControllerFindOne` по `id`) |

> ✅ `invalidateSermon` сбрасывает не только список проповедей, но и плейлисты/разделы, которые могут эту проповедь встраивать. Это и есть правило «инвалидация cross-entity» — всегда через `invalidate.ts`, а не руками.

> ✅ `invalidateUsers` — автономный: пользователи **ничего не встраивают** (и не встраиваются в контент), поэтому сбрасывается только список (+ деталь по `id`). Cross-entity инвалидация ему не нужна.

Точечная инвалидация детали — `invalidateQueries({ queryKey: [{ _id: op, path: { id } }] })` (внутри хелперов с `id`).

## Локальное состояние — runes

- Всё локальное состояние — Svelte runes (`$state`, `$derived`, `$effect`); `svelte/store` (writable/readable) **не используется**.
- Формы: поля — `$state`, снапшот `initial` через замыкание на монтировании (см. [`../conventions.md`](../conventions.md)).
- Optimistic reorder: `local<Items>`/`<items>Snapshot`/`isDragging`/`synced<Items>` в `Sections`/`SectionDetail`/`PlaylistDetail` (см. [`../conventions.md`](../conventions.md)).
- Контекст/провайдеры: только `QueryClientProvider` (App). Авторизация — модульный rune-store (`auth.svelte.ts`), без Svelte context; тема — статический CSS (без context).

## Связанные документы

- [auth.md](./auth.md) — restoreSession до mount, refresh-retry
- [sermons.md](./sermons.md) — `invalidateSermon`
- [playlists.md](./playlists.md) — `invalidatePlaylist`
- [sections.md](./sections.md) — `invalidateSection`
- [users.md](./users.md) — `invalidateUsers`
- [files.md](./files.md) — `invalidateFiles`
- [../architecture.md](../architecture.md) — App.svelte, QueryClientProvider
- [../conventions.md](../conventions.md) — runes, API-клиент
- REST-контракт и кодогенерация хуков — [`../contracts/rest-api.md`](../contracts/rest-api.md)
- [../README.md](../README.md) — индекс раздела фронтенда
