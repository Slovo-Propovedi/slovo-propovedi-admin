import { mount } from 'svelte';
import './app.css';
import App from './App.svelte';
import { onAuthExpired } from './lib/api/client';
import { restoreSession } from './lib/auth/auth.svelte';
import { navigate } from './lib/router/router.svelte';

// An expired session always lands on the login screen.
onAuthExpired(() => navigate('/login'));

await restoreSession();

const app = mount(App, { target: document.getElementById('app')! });

export default app;
