import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'https://docs.slovo-propovedi.ru/openAPI.yaml',
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
