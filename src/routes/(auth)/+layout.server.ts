import { redirect } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	// If user is already authenticated, redirect to dash
	if (locals.session) {
		throw redirect(302, '/dash');
	}

	// Return empty object to enable static generation
	return {};
};
