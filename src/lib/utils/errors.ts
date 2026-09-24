// Shared helpers for turning unknown failures into readable Russian messages.
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка';
}

// Extracts the HTTP status from a thrown API error so callers can branch on a
// specific code. The hey-api client throws the parsed error body on a non-2xx
// response; NestJS sends `statusCode`, other backends `status` — both are
// accepted, and a missing/non-numeric value yields undefined.
export function getErrorStatus(error: unknown): number | undefined {
  if (typeof error !== 'object' || error === null) return undefined;
  const { status, statusCode } = error as { status?: unknown; statusCode?: unknown };
  const candidate = status ?? statusCode;
  return typeof candidate === 'number' ? candidate : undefined;
}
