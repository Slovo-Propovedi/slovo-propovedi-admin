# AGENTS.md

Frontend-only guide for agents working in this repository: the **Слово.Проповеди admin SPA** — a
Svelte 5 + Vite single-page application. This repo is the standalone frontend, split from the former
`slovo-propovedi-admin` monorepo; its former path `frontend/web-app/` is now the repo root.

## Read the knowledge base first

- Start with `docs/frontend/README.md` and `docs/frontend/architecture.md` before touching UI code.
- Read the relevant `docs/frontend/features/*.md` or `docs/frontend/screens/*.md` document before
  implementing or changing a feature (state, routing, auth, files, sermons/playlists/sections).
- Update the affected `docs/frontend/**` docs in the same commit as the code change.
- Record any TODO/hack in `docs/debt.md` in the same commit.

## Stack & conventions

- **Svelte 5 runes only.** `svelte/store` (writable/readable) is **not** used — use `$state`,
  `$derived`, `$effect`, `$props()`.
- **Server state via `@tanstack/svelte-query`.** Pages/forms never call `fetch`/`axios` directly;
  they use the generated hooks over the shared `client`. Sole exception: `src/lib/api/upload.ts`
  (XHR upload for progress/abort).
- **No client-side zod for forms.** The backend validates (zod `strictObject`); forms rely on HTML
  `required`/`min` and surface backend errors via `getErrorMessage()`. Generated SDK request/response
  validators (`zod.gen.ts`) are the only zod on the client.
- **Generated code is a contract.** Never edit `src/lib/api/generated/**` by hand — only regenerate.
- UI texts in Russian; code/technical terms in English. Styles only in the global `app.css` (CSS
  custom properties from `:root`).

## OpenAPI-first codegen

- The API contract lives in the **external** `slovo-propovedi-docs` repo and is published at
  `https://docs.slovo-propovedi.ru/openAPI.yaml`. There is no OpenAPI file in this repo.
- After the spec changes, run `npm run gen:api` (openapi-ts + zod patches) and commit the regenerated SDK.
- Request semantics: `null` clears a field, an omitted key means "don't change", relations are always
  sent as arrays.

## Quality gates

- `npm run check` (svelte-check) is the **type-check gate** — run it before committing. The husky
  pre-commit hook runs it automatically and blocks commits that fail.
- `npm run build` (vite) must pass before release.
- This repo has no test suite; rely on `check`/`build` and manual verification.

## Deployment

- Deploy is tag-driven: push a `v*` tag (e.g. via `npm run bump-version <ver>`) → Forgejo Actions
  builds the Docker image and deploys to the VPS.
- Commits follow Conventional Commits (`feat:`, `fix:`, `refactor:`, `chore:`, `docs:`).
