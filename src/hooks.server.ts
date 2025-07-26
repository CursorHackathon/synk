import { auth } from './auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';
import { connectDB } from './db';
import chalk from 'chalk';

import { building } from '$app/environment';

function getNestedData(data: unknown, depth = 2): unknown {
	if (typeof data !== 'object' || data === null || depth <= 0) return data;

	return Object.fromEntries(
		Object.entries(data).map(([key, value]) => {
			if (typeof value === 'object' && value !== null) {
				return [key, depth === 1 ? '[Object]' : getNestedData(value, depth - 1)];
			}
			return [key, value];
		})
	);
}

export async function handle({ event, resolve }) {
	// Connect to MongoDB when the server starts
	await connectDB();

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	// Convert ObjectId fields to strings to make them serializable
	if (session?.user) {
		// Use JSON.parse(JSON.stringify()) to convert ObjectIds to strings
		// This is safe now because we know session.user exists
		try {
			event.locals.user = JSON.parse(JSON.stringify(session.user));
		} catch (error) {
			console.error('Error serializing user object:', error);
			// Fallback: create a basic serializable user object
			event.locals.user = {
				id: session.user.id,
				name: session.user.name || '',
				email: session.user.email || '',
				image: session.user.image || ''
			};
		}
	} else {
		event.locals.user = session?.user;
	}

	event.locals.session = session?.session;
	console.log(chalk.gray('[Session]', JSON.stringify(getNestedData(session, 1), null)));
	return svelteKitHandler({ event, resolve, auth, building });
}

export async function handleFetch({ request, fetch }) {
	const startTime = Date.now();
	const url = request.url;
	const method = request.method;

	console.log(chalk.blue(`[FETCH] ${method} ${url}`));

	try {
		const response = await fetch(request);
		const duration = Date.now() - startTime;

		// L1 Response Logging
		const contentType = response.headers.get('content-type');
		const responseSize = response.headers.get('content-length');
		const cacheStatus = response.headers.get('x-cache') || 'N/A';

		console.log(
			chalk.green(
				`[FETCH SUCCESS] ${method} ${url} - ${response.status} ${response.statusText} (${duration}ms)`
			)
		);
		console.log(
			chalk.gray(
				`[RESPONSE INFO] Content-Type: ${contentType}, Size: ${responseSize || 'unknown'} bytes, Cache: ${cacheStatus}`
			)
		);

		// Clone the response to read its body without consuming it
		const responseClone = response.clone();
		try {
			if (contentType?.includes('application/json')) {
				const jsonData = await responseClone.json();
				console.log(chalk.gray(`[RESPONSE DATA] ${JSON.stringify(getNestedData(jsonData, 2))}`));
			}
		} catch (error: unknown) {
			if (error instanceof Error) {
				console.log(chalk.gray(`[RESPONSE DATA] Could not parse JSON response: ${error.message}`));
			} else {
				console.log(chalk.gray(`[RESPONSE DATA] Could not parse JSON response: Unknown error`));
			}
		}

		return response;
	} catch (error: unknown) {
		const duration = Date.now() - startTime;

		console.log(
			chalk.red(
				`[FETCH ERROR] ${method} ${url} - ${error instanceof Error ? error.message : 'Unknown error'} (${duration}ms)`
			)
		);

		throw error;
	}
}
