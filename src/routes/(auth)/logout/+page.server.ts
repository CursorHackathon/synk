import type { PageServerLoad } from './$types';

import { error, redirect } from '@sveltejs/kit';
import { authClient } from '$src/auth-client';
import chalk from 'chalk';


export const load: PageServerLoad = async ({ locals, request }) => {
  try {
    console.log(chalk.bgWhite("[Auth] ") + "Signing out");

    await authClient.signOut({
      fetchOptions: {
        headers: request.headers
      },
    });

    throw redirect(302, '/login');

  } catch (err) {
    console.error('Error during sign out:', err);
    throw error(500, 'Error signing out');
  }


}; 