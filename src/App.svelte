<script lang="ts">
  import { QueryClient, QueryClientProvider } from '@tanstack/svelte-query';
  import Router from './lib/router/Router.svelte';

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
        retry: 1,
      },
    },
  });
</script>

<QueryClientProvider client={queryClient}>
  <Router />
</QueryClientProvider>
