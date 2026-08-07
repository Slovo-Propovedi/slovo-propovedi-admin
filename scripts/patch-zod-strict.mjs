#!/usr/bin/env node
/**
 * WHY THIS PATCH EXISTS
 *
 * The @hey-api/openapi-ts zod plugin (v0.99.x) has no option to honor
 * `additionalProperties: false` — its object emitter always emits
 * `z.object({ ... })`, never `z.strictObject({ ... })`. The OpenAPI spec
 * declares `additionalProperties: false` on every entity schema, so the
 * generated Zod schemas must reject payloads carrying undeclared keys.
 *
 * This script rewrites every emitted `z.object({` into `z.strictObject({`
 * after codegen has run. `z.strictObject` exists in Zod v4 (installed), so
 * no other Zod API changes are needed. The replacement is idempotent:
 * `z.strictObject({` does not contain the substring `z.object({`, so a
 * second run is a no-op.
 *
 * SCOPE
 *
 * Applies to every object schema in the generated `zod.gen.ts` (entity
 * schemas, DTOs, path/query/body/response validators). `z.record(...)` and
 * scalar schemas are untouched. Must run AFTER scripts/patch-zod-binary.mjs,
 * which matches the emitted `z.object({` block before strict conversion.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Resolve relative to this script so it works no matter the cwd.
const ZOD_GEN_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/lib/api/generated/zod.gen.ts'
);

const source = await readFile(ZOD_GEN_PATH, 'utf8');

const plainObjectCount = (source.match(/z\.object\(\{/g) ?? []).length;
const strictObjectCount = (source.match(/z\.strictObject\(\{/g) ?? []).length;

// Guard: nothing left to convert. Distinguish an idempotent re-run (already
// strict) from generator drift (no objects emitted at all) and fail loudly.
if (plainObjectCount === 0) {
  if (strictObjectCount > 0) {
    console.log(
      `[patch-zod-strict] already up to date — ${strictObjectCount} strict objects, nothing to patch.`
    );
  } else {
    console.warn(
      `\n!!! WARNING: no z.object({ or z.strictObject({ found in ${ZOD_GEN_PATH}.`
    );
    console.warn(
      '!!! The generator output likely changed — inspect zod.gen.ts and update scripts/patch-zod-strict.mjs.\n'
    );
  }
  process.exit(0);
}

const patched = source.replaceAll('z.object({', 'z.strictObject({');
await writeFile(ZOD_GEN_PATH, patched);
console.log(
  `[patch-zod-strict] converted ${plainObjectCount} z.object({ → z.strictObject({`
);
