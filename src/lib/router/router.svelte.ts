// Lightweight history-based router built on Svelte runes.
// `currentPath` is module-level reactive state, so any component that reads
// `route.path` re-renders on navigation.
let currentPath = $state(window.location.pathname);

window.addEventListener('popstate', () => {
  currentPath = window.location.pathname;
});

export function navigate(path: string): void {
  if (currentPath === path) return;
  window.history.pushState({}, '', path);
  currentPath = path;
  window.scrollTo(0, 0);
}

export function useRoute() {
  return {
    get path() {
      return currentPath;
    },
    navigate,
  };
}

// Matches a pattern like `/sections/:id/edit` against a real path and
// returns the captured params, or null when the path does not fit.
export function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) return null;

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i] ?? '';
    const pathPart = pathParts[i] ?? '';
    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
    } else if (patternPart !== pathPart) {
      return null;
    }
  }
  return params;
}
