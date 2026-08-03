import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input:
    'https://git.lightnode.ru/Slovo_Propovedi/slovo-propovedi-swagger/raw/branch/main/openAPI.yaml',
  output: 'src/lib/api/generated',
  plugins: [
    '@hey-api/sdk',
    { enums: 'javascript', name: '@hey-api/typescript' },
    '@tanstack/svelte-query',
    '@hey-api/client-fetch',
  ],
});
