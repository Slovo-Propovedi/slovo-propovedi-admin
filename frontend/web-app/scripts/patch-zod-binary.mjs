#!/usr/bin/env node
/**
 * WHY THIS PATCH EXISTS
 *
 * The @hey-api/openapi-ts zod plugin has no `binary` case in its format
 * switch, so a multipart field with `format: binary` is emitted as
 * `z.string()`. Browsers submit a runtime `File` inside FormData, so the
 * generated request validator would reject every upload before fetch.
 *
 * This script rewrites the emitted field to `z.instanceof(File)` — the
 * correct runtime guard for a multipart file — after codegen has run.
 *
 * SCOPE
 *
 * This covers the multipart file field in `zAppControllerUploadFileBody`.
 * If new binary upload fields are added later, extend the list below.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

// Resolve relative to this script so it works no matter the cwd.
const ZOD_GEN_PATH = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '../src/lib/api/generated/zod.gen.ts'
);

// Generated schema blocks that contain binary multipart file fields.
const BINARY_FILE_FIELDS = [
  {
    schemaName: 'zAppControllerUploadFileBody',
    // Match `z.string()` (both parens) so the replacement does not leave the
    // original closing paren behind (which would yield `z.instanceof(File))`).
    fieldPattern: /(file:\s*)z\.string\(\)/,
  },
];

const source = await readFile(ZOD_GEN_PATH, 'utf8');
let patchedSomething = false;
let hasShapeDrift = false;

for (const { schemaName, fieldPattern } of BINARY_FILE_FIELDS) {
  const blockPattern = new RegExp(
    `export const ${schemaName} = z\\.object\\(\\{([\\s\\S]*?)\\n\\}\\);`
  );
  const block = blockPattern.exec(source)?.[0];

  if (block === undefined) {
    console.warn(
      `\n!!! WARNING: schema block "${schemaName}" was not found in ${ZOD_GEN_PATH}.`
    );
    console.warn(
      '!!! The generated schema name/shape likely changed — update scripts/patch-zod-binary.mjs.\n'
    );
    hasShapeDrift = true;
    continue;
  }

  if (block.includes('z.instanceof(File)')) {
    console.log(
      `[patch-zod-binary] ${schemaName} already uses z.instanceof(File) — no-op.`
    );
    continue;
  }

  if (fieldPattern.exec(block) === null) {
    console.warn(
      `\n!!! WARNING: binary file field not found in "${schemaName}".`
    );
    console.warn(
      '!!! The generated field shape likely changed — update scripts/patch-zod-binary.mjs.\n'
    );
    hasShapeDrift = true;
    continue;
  }

  const patched = block.replace(fieldPattern, '$1z.instanceof(File)');
  await writeFile(ZOD_GEN_PATH, source.replace(block, patched));
  patchedSomething = true;
  console.log(
    `[patch-zod-binary] ${schemaName}: file: z.string() → file: z.instanceof(File)`
  );
}

if (hasShapeDrift) {
  console.warn(
    '!!! WARNING: the patch no longer matches the generated code — inspect zod.gen.ts'
  );
  console.warn(
    '!!! and update scripts/patch-zod-binary.mjs before shipping.\n'
  );
} else if (!patchedSomething) {
  console.log('[patch-zod-binary] already up to date — nothing to patch.');
}
