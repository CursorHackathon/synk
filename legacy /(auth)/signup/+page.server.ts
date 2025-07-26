import { fail, redirect } from '@sveltejs/kit';
import { auth } from '$src/auth';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If user is already authenticated, redirect to builder
	if (locals.session) {
		throw redirect(302, '/builder');
	}

	// Return empty object to enable static generation
	return {};
};

export const actions: Actions = {
	signup: async ({ request, cookies }) => {
		const data = await request.formData();
		const email = data.get('email')?.toString();
		const password = data.get('password')?.toString();
		const repeatPassword = data.get('repeatPassword')?.toString();

		if (!email || !password || !repeatPassword) {
			return fail(400, {
				error: 'All fields are required',
				email
			});
		}

		if (password !== repeatPassword) {
			return fail(400, {
				error: 'Passwords do not match',
				email
			});
		}

		// Basic password strength validation
		if (
			password.length < 8 ||
			!/[A-Z]/.test(password) ||
			!/[a-z]/.test(password) ||
			!/[\d\W]/.test(password)
		) {
			return fail(400, {
				error:
					'Password must be at least 8 characters and contain uppercase, lowercase, and number/special character',
				email
			});
		}

		try {
			// Use the auth server instance directly for better performance
			const result = await auth.api.signUpEmail({
				body: {
					email,
					password,
					name: email.split('@')[0]
				},
				headers: request.headers
			});

			if (!result) {
				return fail(400, {
					error: 'Failed to create account. Email may already be in use.',
					email
				});
			}

			throw redirect(302, '/builder');
		} catch (error) {
			console.error('Signup error:', error);
			return fail(500, {
				error: 'An error occurred during signup. Please try again.',
				email
			});
		}
	},

	github: async ({ url, request }) => {
		const callbackURL = `${url.origin}/builder`;

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
		const callbackURL = `${url.origin}/builder`;

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
