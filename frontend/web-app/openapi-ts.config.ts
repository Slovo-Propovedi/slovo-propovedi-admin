import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'https://docs.slovo-propovedi.ru/openAPI.yaml',
  output: 'src/lib/api/generated',
  plugins: [
    {
      name: '@hey-api/sdk',
      // Disable only the client-side request validator: it ran the multipart
      // body schema (file: z.string()) against a runtime File and rejected every
      // upload before fetch. Server-side Zod remains the authority, and the UI
      // gates submission. Response validation stays on.
      validator: { request: false, response: true },
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
