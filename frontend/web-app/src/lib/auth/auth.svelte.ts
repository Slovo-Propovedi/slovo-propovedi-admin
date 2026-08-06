// Auth state: current user, session restore and login/logout flows.
//
// The module keeps the profile in reactive state; components read it through
// `getAuthState()` so every subscriber re-renders when the session changes.
import { authControllerGetProfile, authControllerSignIn } from '$lib/api/generated';
import {
  clearTokens,
  getAccessToken,
  setTokens,
} from '$lib/api/client';
import { navigate } from '$lib/router/router.svelte';

export interface AuthUser {
  id?: string;
  name?: string;
  username?: string;
  email?: string;
}

let user: AuthUser | null = $state(null);
let isReady = $state(false);
let isLoggingIn = $state(false);

export function getAuthState() {
  return {
    get user() {
      return user;
    },
    get isReady() {
      return isReady;
    },
    get isLoggingIn() {
      return isLoggingIn;
    },
  };
}

// Restores the session from stored tokens, or silently clears it.
export async function restoreSession(): Promise<void> {
  try {
    if (!getAccessToken()) return;
    const { data: profile } = await authControllerGetProfile({ throwOnError: true });
    user = profile;
  } catch {
    // The API client already retries the profile request once with a refresh
    // token when it fails with 401. If it still fails, the session cannot be
    // restored, so clear the tokens and leave the user signed out.
    clearTokens();
    user = null;
  } finally {
    isReady = true;
  }
}

export async function login(username: string, password: string): Promise<void> {
  isLoggingIn = true;
  try {
    const { data } = await authControllerSignIn({ body: { username, password }, throwOnError: true });
    if (!data.accessToken) throw new Error('Сервер не вернул токен доступа');
    setTokens(data.accessToken, data.refreshToken);
    user = data.user ?? { username };
    navigate('/');
  } finally {
    isLoggingIn = false;
  }
}

export function logout(): void {
  // Note: the backend has no revoke endpoint, so the refresh token remains
  // valid until it expires. Tokens are cleared client-side only, which is the
  // best we can do; the local session is gone immediately.
  clearTokens();
  user = null;
  navigate('/login');
}
