// Auth state: current user, session restore and login/logout flows.
//
// The module keeps the profile in reactive state; components read it through
// `getAuthState()` so every subscriber re-renders when the session changes.
import { authGetProfile, authLogin } from '$lib/api/generated';
import {
  clearTokens,
  getAccessToken,
  refreshTokens,
  setTokens,
} from '$lib/api/client';
import { navigate } from '$lib/router/router.svelte';

export interface AuthUser {
  id?: string;
  name?: string;
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
    const { data: profile } = await authGetProfile({ throwOnError: true });
    user = profile;
  } catch {
    const refreshed = await refreshTokens();
    if (refreshed) {
      const { data: profile } = await authGetProfile({ throwOnError: true });
      user = profile;
    } else {
      clearTokens();
      user = null;
    }
  } finally {
    isReady = true;
  }
}

export async function login(email: string, password: string): Promise<void> {
  isLoggingIn = true;
  try {
    const { data } = await authLogin({ body: { email, password }, throwOnError: true });
    if (!data.accessToken) throw new Error('Сервер не вернул токен доступа');
    setTokens(data.accessToken, data.refreshToken);
    user = data.user ?? { email };
    navigate('/');
  } finally {
    isLoggingIn = false;
  }
}

export function logout(): void {
  clearTokens();
  user = null;
  navigate('/login');
}
