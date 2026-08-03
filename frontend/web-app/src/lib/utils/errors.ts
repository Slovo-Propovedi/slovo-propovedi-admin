// Shared helpers for turning unknown failures into readable Russian messages.
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'object' && error !== null && 'message' in error) {
    const message = (error as { message?: unknown }).message;
    if (typeof message === 'string' && message) return message;
  }
  if (error instanceof Error) return error.message;
  return 'Неизвестная ошибка';
}
