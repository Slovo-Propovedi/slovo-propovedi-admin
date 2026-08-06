// XHR-based file upload with real progress events and abort support.
//
// The generated SDK speaks through @hey-api/client-fetch, whose fetch
// transport exposes no upload progress. This module is the single exception
// to the SDK: only the /files upload travels over XHR; every other endpoint
// keeps using the generated fetch client.
//
// Auth reuses the exact token source the API client's interceptor uses, so
// uploads stay consistent with every other request.
import { API_BASE_URL, getAccessToken } from './client';

export interface UploadResult {
  fileName: string;
  fileUrl: string;
}

const UPLOAD_TIMEOUT_MS = 120_000;

// Parses the server's error body for a human-readable message. Non-JSON or
// unknown shapes fall through so the caller reports a generic failure.
function readServerMessage(responseText: string): string | null {
  try {
    const body: unknown = JSON.parse(responseText);
    if (typeof body === 'object' && body !== null) {
      const { message } = body as { message?: unknown };
      if (typeof message === 'string' && message.trim()) return message.trim();
      if (Array.isArray(message)) {
        const parts = message.filter((part): part is string => typeof part === 'string');
        if (parts.length > 0) return parts.join(', ');
      }
    }
  } catch {
    // Non-JSON body — fall back to the caller's generic message.
  }
  return null;
}

// Parses the success body at the boundary: a valid UploadResult is trusted
// from here on, anything else fails fast with a descriptive error.
function parseUploadResult(responseText: string): UploadResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(responseText);
  } catch {
    throw new Error('Сервер вернул некорректный ответ при загрузке файла');
  }

  const result = parsed as Partial<UploadResult>;
  if (typeof result.fileUrl !== 'string' || result.fileUrl === '' || typeof result.fileName !== 'string' || result.fileName === '') {
    throw new Error('Сервер не вернул URL файла');
  }
  return { fileName: result.fileName, fileUrl: result.fileUrl };
}

export function uploadFileWithProgress(
  file: File,
  onProgress: (loaded: number, total: number) => void,
  signal?: AbortSignal,
): Promise<UploadResult> {
  const token = getAccessToken();
  if (!token) {
    return Promise.reject(new Error('Вы не авторизованы. Пожалуйста, войдите заново.'));
  }

  if (signal?.aborted) {
    return Promise.reject(new Error('Загрузка отменена'));
  }

  return new Promise<UploadResult>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    const abortFromSignal = (): void => xhr.abort();
    signal?.addEventListener('abort', abortFromSignal, { once: true });

    xhr.open('POST', `${API_BASE_URL}/files`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);
    xhr.timeout = UPLOAD_TIMEOUT_MS;

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) onProgress(event.loaded, event.total);
    };

    xhr.ontimeout = () => {
      reject(new Error(`Загрузка превысила лимит времени (${UPLOAD_TIMEOUT_MS / 60_000} мин). Попробуйте ещё раз.`));
    };

    xhr.onerror = () => {
      reject(new Error('Ошибка сети при загрузке файла'));
    };

    xhr.onabort = () => {
      reject(new Error('Загрузка отменена'));
    };

    xhr.onload = () => {
      const isSuccess = xhr.status >= 200 && xhr.status < 300;
      if (!isSuccess) {
        const message = readServerMessage(xhr.responseText);
        const statusText = xhr.statusText ? ` (${xhr.statusText})` : '';
        reject(new Error(message ?? `Ошибка загрузки файла: ${xhr.status}${statusText}`));
        return;
      }

      try {
        resolve(parseUploadResult(xhr.responseText));
      } catch (error) {
        reject(error);
      }
    };

    const formData = new FormData();
    formData.append('file', file);
    xhr.send(formData);
  });
}
