# AGENTS.md

Coding agent instructions for the **slovo-propovedi-admin** monorepo — the admin panel of the «Слово.Проповеди» platform.

The repo is a **monorepo** of two apps sharing one OpenAPI contract: `backend/` (NestJS + TypeORM + PostgreSQL + MinIO) and `frontend/web-app/` (Svelte 5 + Vite SPA). The panel manages sermons, playlists, sections and files. Both apps generate code from a **single shared OpenAPI spec** — the single source of truth for all API contracts.

## READ DOCS FIRST (hard rule)

The full knowledge base lives in `docs/` (in Russian). Read it before implementing anything — do not re-explore the codebase from scratch. Start at `docs/README.md`, then `docs/architecture.md`, then the relevant `docs/frontend/` / `docs/backend/` / `docs/contracts/` sections.

Five mandatory agent rules (full text in `docs/README.md`):

1. **Read before you code** — before a feature/fix, read the docs for the affected area: UI/screen → `docs/frontend/screens/<screen>.md`; frontend module → `docs/frontend/features/<module>.md`; backend module → `docs/backend/modules/<module>.md`; external contract → `docs/contracts/<protocol>.md`; architecture → `docs/architecture.md` (+ `frontend/` or `backend/` variant); process → `docs/conventions.md`.
2. **Update docs in the same commit** — any code change that isn't mirrored in `docs/` in the same PR/commit is incomplete.
3. **Every cut corner** (TODO, hack, deferred decision) → an entry in `docs/debt.md` in the same PR, format `- [ ] <what> — <where (file paths)> — <when to return>`.
4. **New dependencies** — only via an entry in `docs/decisions.md` (Approved stack) explaining "why". Never add packages silently.
5. **Missing docs = add them** — if `docs/` lacks what you need, investigate the code, document it, and note any gap in `docs/debt.md`.

## Layout

```
backend/            # NestJS API (TypeORM, zod, nestjs-zod, MinIO)
frontend/web-app/   # Svelte 5 + Vite SPA (admin)
postgres/           # DB data + dump (initdb)
volumes/minio/      # MinIO object storage
docs/               # Source of truth — README.md, architecture.md, decisions.md,
                    # conventions.md, debt.md, contracts/, frontend/, backend/
Makefile            # Root orchestration (docker, vault, codegen)
docker-compose.yml  # postgres, adminer, backend, minio
.env / .vault       # Secrets (.vault is the committed ansible-vault snapshot of .env)
```

Full structure and docs map: [`docs/README.md`](docs/README.md).

## Codegen workflow (CRITICAL)

**Do NOT hand-edit generated code.** Both apps generate from the shared OpenAPI spec, and the spec itself lives in a **separate repo** (`slovo-propovedi-docs`, published on tag `v*` at `https://docs.slovo-propovedi.ru/openAPI.yaml`).

- **Backend generated:** `backend/src/generated/index.ts` (Orval → zod schemas, strict). Regen: `cd backend && npm run gen:schemas`.
- **Frontend generated:** `frontend/web-app/src/lib/api/generated/` (@hey-api → SDK, types, svelte-query hooks, zod). Regen: `cd frontend/web-app && npm run gen:api`.
- **Both at once:** `make gen-api`.

**To change the API contract:** edit the spec in the external `slovo-propovedi-docs` repo → publish it (tag `v*`) → `make gen-api`. Always regen **both** sides in the same PR and commit all generated files. Frontend pages never call `fetch` directly (except XHR file upload) — only the generated SDK. Full pipeline: [`docs/contracts/rest-api.md`](docs/contracts/rest-api.md).

> ⚠️ Never edit `backend/src/generated/` or `frontend/web-app/src/lib/api/generated/` by hand — regen instead.

## How to run / test / build

Working dirs: `cd backend` and `cd frontend/web-app`.

| Task | Command |
|------|---------|
| Backend dev server (watch) | `cd backend && npm run start:dev` |
| Backend build | `cd backend && npm run build` |
| Backend tests | `cd backend && npm run test` |
| Backend lint | `cd backend && npm run lint` |
| Backend: regen zod schemas | `cd backend && npm run gen:schemas` |
| Frontend dev server | `cd frontend/web-app && npm run dev` |
| Frontend build | `cd frontend/web-app && npm run build` |
| Frontend type-check (`svelte-check`) | `cd frontend/web-app && npm run check` |
| Frontend: regen API SDK | `cd frontend/web-app && npm run gen:api` |
| Start containers | `make up` |
| Stop containers | `make down` |
| Restart containers | `make restart` |
| Encrypt `.env` → `.vault` (ansible-vault) | `make encrypt` |
| Decrypt `.vault` → `.env` | `make decrypt` |

> ⚠️ `make encrypt`/`make decrypt` require `ansible-vault`. Never commit `.env` — only `.vault`.

## Key conventions (don't violate)

- **OpenAPI-first** — the spec is the source of truth; both sides are generated from it (ADR-002). See `docs/contracts/rest-api.md`.
- **Backend:** `nestjs-zod` (NOT `class-validator`) for HTTP validation — `ZodValidationPipe` + `@ZodResponse()`, strict zod on all boundaries. `class-validator` only remains on the `User` entity (ADR-003). See `docs/backend/conventions.md`.
- **Frontend:** server state via `@tanstack/svelte-query` (`createQuery`/`createMutation` + generated hooks), local state via **Svelte 5 runes** — **no `svelte/store`** (ADR-004). **No client-side zod for forms** — backend validates; forms rely on HTML `required`/`min` (see `docs/frontend/conventions.md`).
- **No auto-DDL:** TypeORM `synchronize: false` (production runs behind PgBouncer). Schema changes go through **manual SQL** in `backend/sql/` (`bootstrap.sql` + idempotent one-shot migrations), applied with `psql -f`. Never let TypeORM auto-create schema (ADR-005). See `docs/backend/db.md`.
- **Form null vs undefined semantics:** `null` = clear the column on the backend; `undefined` (key omitted) = no change. Always send relation arrays explicitly. See `docs/frontend/conventions.md`.

## Tech debt

Check [`docs/debt.md`](docs/debt.md) **before** claiming something is "done" — known gaps include the schema/spec maintenance burden and fragile post-gen patches. Any new corner you cut goes there in the same PR.
