import { confirmRegistration, finishLogin, login, register, verify } from './operations';
import { corsHeaders, corsRes } from './utils';

export default {
	async fetch(request: Request, env: Env) {
		if (request.method === 'OPTIONS') {
			return new Response('OK', {
				headers: corsHeaders,
			});
		}

		if (request.method !== 'PUT')
			return corsRes({
				success: false,
				output: 'Illegal method',
			});

		/**
		 * Each request will have the following JSON structure or part of it:
		 */
		let reqJSON = {
			operation: '', // register, register2, login, login2, jwt
			name: '', // the name to be registered
			email: '', // the email to be registered
			code: '', // the code to be confirmed
			token: '', // the token to be verified
			doSend: true, // whether to send an email
		};

		try {
			reqJSON = await request.json();
		} catch (e) {
			return corsRes({
				success: false,
				output: 'Invalid JSON',
			});
		}

		switch (reqJSON.operation) {
			// verifying a JWT token
			case 'jwt':
				return corsRes(verify(reqJSON.token, env.secret));
			// registering a new user
			case 'register':
				return corsRes(await register(env.users, reqJSON.name, reqJSON.email, env.mlsn, reqJSON.doSend));
			case 'register2':
				return corsRes(await confirmRegistration(env.users, reqJSON.code, reqJSON.email, env.secret));
			case 'login':
				return corsRes(await login(env.users, reqJSON.email, env.mlsn, reqJSON.doSend));
			case 'login2':
				return corsRes(await finishLogin(env.users, reqJSON.code, reqJSON.email, env.secret));
			default:
				return corsRes({
					success: false,
					output: 'Unknown operation',
				});
		}
	},
};