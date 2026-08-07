// True when two same-length lists carry the same ids in a different order.
// Used to skip a no-op reorder request after a drag that ended where it started.
export function hasOrderChanged<T extends { id: string }>(before: T[], after: T[]): boolean {
  if (before.length !== after.length) return true;
  return before.some((item, index) => item.id !== after[index]?.id);
}
