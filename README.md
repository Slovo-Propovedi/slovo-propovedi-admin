# Slovo Propovedi — admin SPA (frontend)

Standalone frontend for the **Слово.Проповеди** admin panel: a **Svelte 5 + Vite** single-page
application (dark theme, Russian UI). It was split from the former `slovo-propovedi-admin` monorepo;
the old `frontend/web-app/` path is now this repository's root.

The app talks to the **API** backend over generated HTTP clients — there is no OpenAPI file in
this repo (see [Regenerating the API client](#regenerating-the-api-client)).

## Prerequisites

- **Node.js 22+** (npm 10+)

## Development

```bash
npm install
npm run dev
```

`npm run dev` starts the Vite dev server (default `http://localhost:5173`).

## Build

```bash
npm run build
```

Produces the production bundle in `dist/`. The app is served as a static SPA through `nginx.conf`
(a Docker image is built by Forgejo Actions on release — see [Deployment](#deployment)).

## Type-check

```bash
npm run check
```

Runs `svelte-check` — this is the project's type-check gate. The git pre-commit hook
(`.husky/pre-commit`) runs it automatically on every commit and blocks commits that fail.

## Regenerating the API client

The API contract is **OpenAPI-first** and lives in the external `slovo-propovedi-docs` repository,
published at `https://docs.slovo-propovedi.ru/openAPI.yaml`.

```bash
npm run gen:api
```

Regenerates `src/lib/api/generated/` via `openapi-ts` (SDK + `@tanstack/svelte-query` hooks + zod
validators) and applies the zod binary/strict patches (`scripts/patch-zod-binary.mjs`,
`scripts/patch-zod-strict.mjs`). Generated code is a contract — never edit it by hand; only
regenerate.

## Releasing

```bash
npm run bump-version <version|patch|minor|major>
```

Promotes `## [Unreleased]` in `CHANGELOG.md` to `<version>` with today's date, opens a fresh empty
`[Unreleased]` section, updates `package.json`, commits (`chore: bump version to <version>`), and
creates + pushes an annotated tag `v<version>`.

## Deployment

Deployment is fully automated via **Forgejo Actions**, driven by git tags.

### How it works

1. Push a commit to `main` (the pre-commit hook runs `npm run check`).
2. Tag a release (`v*`) — either with `npm run bump-version <ver>` or manually:

   ```bash
   git tag v0.1.0
   git push origin v0.1.0
   ```

3. The tag-triggered release workflow builds the Docker image and deploys to the VPS via
   `scripts/vps-deploy.sh` (SSH, Docker build, Traefik labels, systemd service).

### Required Forgejo secrets

Settings → Actions → Secrets.

| Secret | Description |
| --- | --- |
| `VPS_SSH_PRIVATE_KEY` | SSH private key (ed25519) for root access to the VPS |
| `VPS_HOST` | VPS hostname or IP |
| `VPS_SSH_USER` | SSH user on the VPS (`root`) |
| `ACME_EMAIL` | Email for Let's Encrypt certificates (required for first deploy to a fresh VPS) |

### Required Forgejo variables

Settings → Actions → Variables.

| Variable | Description |
| --- | --- |
| `FRONTEND_HOSTNAME` | Public hostname for the admin SPA (e.g. `admin.example.com`) |

### Rollback

The VPS keeps the previously deployed image under the mirror backup convention (previous tag
preserved alongside `latest`). To roll back, redeploy the previous tag — point Forgejo Actions at the
older `v*` tag (or locally build/run that image), and the deploy script restores the previous
version.
