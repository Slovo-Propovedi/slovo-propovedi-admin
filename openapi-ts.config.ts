import { defineConfig } from '@hey-api/openapi-ts';

// @hey-api/openapi-ts's bundled HTTP client (@hey-api/json-schema-ref-parser)
// has proven unreliable fetching this specific spec over HTTPS — fails
// consistently with "fetch failed" (a network-level exception, not a real
// HTTP error) while curl and other tools (orval) hitting the exact same URL
// succeed every time. `npm run gen:api` works around it by curl-ing the spec
// to a local file first and pointing `input` at that instead of the URL;
// OPENAPI_SPEC_LOCAL_PATH is unset (falls through to the URL) everywhere else.
export default defineConfig({
  input:
    process.env.OPENAPI_SPEC_LOCAL_PATH ??
    `https://${process.env.DOCS_HOSTNAME ?? 'docs.slovo-propovedi.ru'}/openAPI.yaml`,
  output: 'src/lib/api/generated',
  plugins: [
    {
      name: '@hey-api/sdk',
      // Full request + response validation. The zod plugin cannot emit
      // z.instanceof(File) for multipart binary fields (no binary case in its
      // format switch — it emits z.string()), so scripts/patch-zod-binary.mjs
      // rewrites the generated multipart file schema after codegen.
      validator: true,
    },
    { enums: 'javascript', name: '@hey-api/typescript' },
    '@tanstack/svelte-query',
    '@hey-api/client-fetch',
    {
      name: 'zod',
      compatibilityVersion: 4,
    },
  ],
});
