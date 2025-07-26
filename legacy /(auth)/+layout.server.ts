import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// If user is already authenticated, redirect to builder
	if (locals.session) {
		throw redirect(302, '/builder');
	}

	// Return empty object to enable static generation
	return {};
};
