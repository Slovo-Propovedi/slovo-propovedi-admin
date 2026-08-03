// API client: transport configuration, token persistence and 401 recovery.
//
// The generated SDK speaks through the shared `client` singleton. This module
// configures that singleton once and guards every request against an expired
// access token: on 401 it refreshes the pair once, retries the original
// request, and only then gives up and announces the expired session.
import { client } from './generated/client.gen';
import type { Client, RequestOptions } from './generated/client/types.gen';
import { authRefresh } from './generated/sdk.gen';

export const API_BASE_URL = import.meta.env.VITE_API_BASE ?? 'http://localhost:3000';

const TOKENS_KEY = 'slovo_admin_tokens';

const AUTH_RETRY_MARKER = Symbol('auth-retry-marker');
const RETRIED = Symbol('retried');

const AUTH_EXPIRED_ERROR = new Error('Сессия истекла. Пожалуйста, войдите заново.');

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
      const { data } = await authRefresh({ body: { refreshToken }, throwOnError: true });
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
// by their callers and must not trigger the refresh loop.
function isAuthEndpoint(url: string): boolean {
  return url.startsWith('/auth/');
}

client.setConfig({
  baseUrl: API_BASE_URL,
  throwOnError: true,
  auth: () => getAccessToken(),
});

client.interceptors.response.use((response, _request, options) => {
  if (response.status === 401 && !isAuthEndpoint(options.url)) {
    throw AUTH_RETRY_MARKER;
  }
  return response;
});

type WrappedRequestOptions = RequestOptions & { [RETRIED]?: boolean };

const originalRequest = client.request.bind(client) as Client['request'];

client.request = (async (options: Parameters<Client['request']>[0]) => {
  const wrapped = options as WrappedRequestOptions;

  try {
    return await originalRequest(wrapped as never);
  } catch (error: unknown) {
    if (error !== AUTH_RETRY_MARKER) throw error;
    if (wrapped[RETRIED]) throw AUTH_EXPIRED_ERROR;

    const refreshed = await refreshTokens();
    if (!refreshed) {
      notifyAuthExpired();
      throw AUTH_EXPIRED_ERROR;
    }
    return originalRequest({ ...wrapped, [RETRIED]: true } as never);
  }
}) as Client['request'];
