// API client: transport configuration, token persistence and 401 recovery.
//
// The generated SDK speaks through the shared `client` singleton. This module
// configures that singleton once and guards every request against an expired
// access token: on 401 it refreshes the pair once, retries the original
// request, and only then gives up and announces the expired session.
//
// Production talks directly to the API domain (`https://api.slovo-propovedi.ru`).
// Local development uses the Vite proxy via `VITE_API_BASE=/api` (see
// .env.development and vite.config.ts). Set VITE_API_BASE to override the
// default for custom deployments.
import { client } from './generated/client.gen';
import type { Client, RequestOptions } from './generated/client/types.gen';
import { authControllerRefresh } from './generated/sdk.gen';

export const API_BASE_URL = import.meta.env.VITE_API_BASE ?? 'https://api.slovo-propovedi.ru';

const TOKENS_KEY = 'slovo_admin_tokens';

const AUTH_RETRY_MARKER = Symbol('auth-retry-marker');
const RETRIED = Symbol('retried');

const AUTH_EXPIRED_MESSAGE = 'Сессия истекла. Пожалуйста, войдите заново.';

interface StoredTokens {
  accessToken?: string;
  refreshToken?: string;
}

function loadTokens(): StoredTokens {
  try {
    const raw = localStorage.getItem(TOKENS_KEY);
    return raw ? (JSON.parse(raw) as StoredTokens) : {};
  } catch {
    return {};
  }
}

export function getAccessToken(): string | undefined {
  return loadTokens().accessToken;
}

export function setTokens(accessToken: string, refreshToken?: string): void {
  const stored = loadTokens();
  localStorage.setItem(TOKENS_KEY, JSON.stringify({ accessToken, refreshToken: refreshToken ?? stored.refreshToken }));
}

export function clearTokens(): void {
  localStorage.removeItem(TOKENS_KEY);
}

let refreshInFlight: Promise<boolean> | null = null;

// Exchanges the stored refresh token for a fresh pair. Concurrent callers
// share the same in-flight request; failure clears the stored tokens.
export function refreshTokens(): Promise<boolean> {
  if (refreshInFlight) return refreshInFlight;

  refreshInFlight = (async () => {
    const refreshToken = loadTokens().refreshToken;
    if (!refreshToken) return false;

    try {
      const { data } = await authControllerRefresh({ body: { refreshToken }, throwOnError: true });
      if (!data.accessToken) return false;
      setTokens(data.accessToken, data.refreshToken ?? refreshToken);
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshInFlight = null;
    }
  })();

  return refreshInFlight;
}

type AuthExpiredListener = () => void;
const authExpiredListeners = new Set<AuthExpiredListener>();

// Subscribes to session loss. Returns an unsubscribe function.
export function onAuthExpired(listener: AuthExpiredListener): () => void {
  authExpiredListeners.add(listener);
  return () => authExpiredListeners.delete(listener);
}

function notifyAuthExpired(): void {
  for (const listener of authExpiredListeners) listener();
}

// Login and refresh responses may legitimately carry 401s; they are handled
// by their callers and must not trigger the refresh loop. Every other
// endpoint — including /auth/profile — participates in the refresh-retry
// flow, so an expired access token is recovered instead of ending the session.
function isAuthEndpoint(url: string): boolean {
  return url === '/auth/login' || url === '/auth/refresh';
}

client.setConfig({
  baseUrl: API_BASE_URL,
  throwOnError: true,
  auth: () => getAccessToken(),
});

// The generated SDK only sends the bearer token when the OpenAPI spec marks
// the operation with `security`. The spec deployed on docs.slovo-propovedi.ru
// is out of date and omits `security` on most protected operations, so
// regenerating the client silently drops the header. Attach the token here
// whenever one is stored: the backend guards still decide what is actually
// protected, and sending it to public endpoints is harmless.
client.interceptors.request.use((request) => {
  const token = getAccessToken();
  if (!token) return request;
  request.headers.set('Authorization', `Bearer ${token}`);
  return request;
});

// A 401 does not always mean the session expired: the token may have been
// revoked or the user's permissions changed. Capture the server's message so
// the caller sees the real reason instead of a generic "session expired".
interface AuthFailure {
  status?: number;
  message?: string;
}

interface AuthMarkerError extends Error {
  [AUTH_RETRY_MARKER]?: true;
  failure?: AuthFailure;
}

function isAuthMarker(error: unknown): error is AuthMarkerError {
  return typeof error === 'object' && error !== null && AUTH_RETRY_MARKER in error;
}

async function readAuthFailure(response: Response): Promise<AuthFailure> {
  try {
    const text = await response.clone().text();
    if (!text) return { status: response.status };

    const body: unknown = JSON.parse(text);
    if (typeof body === 'object' && body !== null) {
      const { message } = body as { message?: unknown };
      if (typeof message === 'string' && message.trim()) {
        return { status: response.status, message: message.trim() };
      }
      if (Array.isArray(message)) {
        const parts = message.filter((part): part is string => typeof part === 'string');
        if (parts.length > 0) return { status: response.status, message: parts.join(', ') };
      }
    }
    return { status: response.status };
  } catch {
    return { status: response.status };
  }
}

function buildAuthExpiredError(failure?: AuthFailure): Error {
  return new Error(failure?.message?.trim() || AUTH_EXPIRED_MESSAGE);
}

client.interceptors.response.use(async (response, _request, options) => {
  if (response.status === 401 && !isAuthEndpoint(options.url)) {
    const failure = await readAuthFailure(response);
    throw Object.assign(new Error(`Unauthorized (${response.status})`), {
      [AUTH_RETRY_MARKER]: true,
      failure,
    });
  }
  return response;
});

type WrappedRequestOptions = RequestOptions & { [RETRIED]?: boolean };

type RetryableRequest = (options: WrappedRequestOptions) => Promise<unknown>;

// Wraps one client request function with the refresh-and-retry loop. The
// marker thrown by the response interceptor carries the failure details. On
// the first 401 the request is retried once after a token refresh; a second
// 401 means the token itself is invalid, so the session is announced as
// expired instead of looping forever.
function withAuthRetry(request: RetryableRequest): RetryableRequest {
  const attempt = async (options: WrappedRequestOptions): Promise<unknown> => {
    try {
      return await request(options);
    } catch (error: unknown) {
      if (!isAuthMarker(error)) throw error;

      // A second 401 after a successful refresh means the token is invalid —
      // fail fast and loudly with the server's reason when one is available.
      if (options[RETRIED]) {
        notifyAuthExpired();
        throw buildAuthExpiredError(error.failure);
      }

      const refreshed = await refreshTokens();
      if (!refreshed) {
        notifyAuthExpired();
        throw buildAuthExpiredError(error.failure);
      }

      // The refresh succeeded, so retry the original request through the
      // wrapper. The RETRIED guard above catches a second 401 from this
      // attempt, keeping the loop to exactly one refresh.
      return attempt({ ...options, [RETRIED]: true });
    }
  };

  return attempt;
}

// The generated SDK calls the HTTP methods (client.get/post/patch/delete)
// directly, so every one of them needs the retry wrapper — not just
// client.request — for the refresh-on-401 flow to actually run.
client.request = withAuthRetry(client.request.bind(client) as RetryableRequest) as Client['request'];
client.get = withAuthRetry(client.get.bind(client) as RetryableRequest) as Client['get'];
client.post = withAuthRetry(client.post.bind(client) as RetryableRequest) as Client['post'];
client.patch = withAuthRetry(client.patch.bind(client) as RetryableRequest) as Client['patch'];
client.put = withAuthRetry(client.put.bind(client) as RetryableRequest) as Client['put'];
client.delete = withAuthRetry(client.delete.bind(client) as RetryableRequest) as Client['delete'];
