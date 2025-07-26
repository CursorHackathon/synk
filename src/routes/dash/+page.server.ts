import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
  // Basic auth check - redirect to login if no session exists


  // Return minimal data - let client handle the rest
  return {};
}; 