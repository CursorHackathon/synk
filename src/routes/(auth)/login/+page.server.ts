import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$src/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already authenticated, redirect to dash
	if (locals.session) {
		throw redirect(302, '/dash');
	}

	// Return empty object to enable static generation
	return {};
};

export const actions: Actions = {
	signin: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();

		if (!email || !password) {
			return fail(400, {
				error: 'Email and password are required',
				email
			});
		}

		try {
			// Use the auth server instance directly for better performance

			const session = await auth.api.signInEmail({
				body: {
					email,
					password
				},
				headers: request.headers
			});

			if (!session) {
				return fail(400, {
					error: 'Invalid email or password',
					email
				});
			}

			throw redirect(302, '/dash');
		} catch (error) {
			console.error('Login error:', error);
			return fail(500, {
				error: 'An error occurred during login. Please try again.',
				email
			});
		}
	},

	github: async ({ url, request }) => {
		const callbackURL = `${url.origin}/dash`;

		try {
			const result = await auth.api.signInSocial({
				body: {
					provider: 'github',
					callbackURL
				},
				headers: request.headers
			});

			if (result?.url) {
				throw redirect(302, result.url);
			}
		} catch (error) {
			console.error('GitHub auth error:', error);
			return fail(500, {
				error: 'GitHub authentication failed'
			});
		}
	},

	google: async ({ url, request }) => {
		const callbackURL = `${url.origin}/dash`;

		const result = await auth.api.signInSocial({
			body: {
				provider: 'google',
				callbackURL
			},
			headers: request.headers
		});

		if (result?.url) {
			throw redirect(302, result.url);
		}
	}
};
