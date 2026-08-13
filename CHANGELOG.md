# Changelog

All notable changes are auto-generated from [conventional commits](https://www.conventionalcommits.org/) at release time via `npm run bump-version`.

## [0.2.0] - 2026-08-13

### Features
- admin UI — list, create, edit, detail, delete & password modals

### Bug Fixes
- hide self-delete button, clear modal errors, drop misleading password hint, graceful refetch error
- preserve leading acronyms in changelog bullets

### Maintenance
- flatten structure (rm docs/backend, move frontend/{features,screens} to top level), de-version, strip backend docs, merge frontend/{README,architecture,conventions} into root

## [0.1.1] - 2026-08-13

### Bug Fixes
- resolve container-name race in frontend deploy (drop --rm, force-remove in ExecStartPre)

## [0.1.0] - 2026-08-13

### Features
- enrich playlist sermon picker with full sermon info
- format scripture refs with colon and enrich subtitles
- add debounced sermon search to list and picker
- add playlists field to PlaylistSermon and setup pre-commit type-check hook
- restrict sermon audio to MP3, add middle transform option, allow PDF/FB2 uploads
- add cover reuse and drag-and-drop reordering
- make verse 'to' optional (single verse or from-to range)
- xHR progress + abort, disable submit during upload, type-guarded trim
- disable upload button until a file is selected
- login by username instead of email
- phase 11 cleanup — strict mode, dead code removal, sermon entity fix, CI docs, server URL
- point frontend codegen to production OpenAPI URL
- disable Swagger in backend, move OpenAPI spec to standalone service
- migrate from Astro+React to Svelte 5 + Vite

### Bug Fixes
- make release bump commit robust (stage only version files, skip hooks)
- send null for cleared nullable fields in forms and regenerate types
- replace fixed timeout with stall-based idle timeout
- correct HTTP error codes and add position to section response
- guard remaining raw .trim() on submit path (e.trim crash)
- validate multipart file as z.instanceof(File) via post-gen patch (re-enable request validation)
- attach bearer token independent of generated security (stale deployed OpenAPI spec)
- disable broken client-side request validator (multipart file rejected as string)
- preserve useRoute reactivity (avoid destructuring the getter)
- limit Node.js heap during build to prevent server OOM
- address code review findings — a11y, auth, invalidation, security
- remove pid dupticate from nginx, fix dockerfile
- nginx pid directory
- assigning permissions in Dockerfile

### Refactors
- auto-generate changelog from conventional commits (drop [Unreleased], no auto-push)
- extract shared sermonSubtitle util
- migrate to astro
- migrate frontend to vite and update packages

### Maintenance
- add forgejo workflows + vps-deploy.sh (replicates slovo-frontend role runtime)
- add frontend dev scaffolding (husky, bump-version, changelog, README, AGENTS)
- add project documentation and AGENTS.md
- enable strict Zod object validation in generated client
- regenerate API client from updated OpenAPI spec

### Other
- gen: bearer security on protected ops
- first commit
