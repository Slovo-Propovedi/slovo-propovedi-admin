// Returns a wrapper that delays calling `fn` until `ms` milliseconds have
// passed since the last invocation. Rapid inputs (like keystrokes) collapse
// into a single call, so search fields only refetch after the user pauses.
export function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout> | undefined;

  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}
