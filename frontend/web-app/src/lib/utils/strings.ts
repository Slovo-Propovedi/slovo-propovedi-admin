// Type-guarded trim for form payloads: a non-string field can never crash
// submit handlers, and always normalises to an empty string.
export function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

// Normalises a form field into a trimmed string. Svelte binds `<input
// type="number">` values as numbers (and null once cleared), so a typed number
// must keep its text form instead of being flattened to '' like `trimmed`
// would. Emptiness checks and Number() parsing can then trust the result.
export function fieldText(value: unknown): string {
  if (typeof value === 'number') return String(value);
  return trimmed(value);
}
