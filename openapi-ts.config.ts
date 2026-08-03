import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: 'https://docs.slovo-propovedi.ru/openAPI.yaml',
  output: 'src/lib/api/generated',
  plugins: [
    {
      name: '@hey-api/sdk',
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
