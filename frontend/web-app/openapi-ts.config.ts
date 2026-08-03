import { defineConfig } from '@hey-api/openapi-ts';

export default defineConfig({
  input: '../../openAPI.yaml',
  output: 'src/lib/api/generated',
  plugins: [
    '@hey-api/sdk',
    { enums: 'javascript', name: '@hey-api/typescript' },
    '@tanstack/svelte-query',
    '@hey-api/client-fetch',
  ],
});
