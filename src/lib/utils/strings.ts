// Type-guarded trim for form payloads: a non-string field can never crash
// submit handlers, and always normalises to an empty string.
export function trimmed(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}
