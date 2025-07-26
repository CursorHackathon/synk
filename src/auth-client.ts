import { createAuthClient } from 'better-auth/svelte';
import { inferAdditionalFields } from 'better-auth/client/plugins';

import type { auth } from './auth';

export const authClient = createAuthClient({
	baseURL: import.meta.env.BETTER_AUTH_URL ?? 'http://localhost:5173',
	plugins: [ 
		inferAdditionalFields<typeof auth>(),
	]
});
