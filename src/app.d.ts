// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
import type { AuthSession, AuthUser } from '$src/auth';
declare global {
	namespace App {
		interface Locals {
			session: AuthSession | undefined;
			user: AuthUser | undefined;
		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface Platform {}
	}
}

export {};

/// <reference types="@uploadthing/svelte" />
