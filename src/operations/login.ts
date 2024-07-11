import { makeJWT, randomCode, sendEmail } from '../utils';
import { register } from './register';
import { operationResult } from './type';

export async function login(database: D1Database, email: string, mlsn: string, doSend = true): Promise<operationResult> {
	try {
		if (!database) return { success: false, output: 'No DB specified' };
		if (!email) return { success: false, output: 'No email specified' };
		email = email.toLowerCase();

		const user = await database.prepare('SELECT * FROM users WHERE email = ? AND confirmed = 1').bind(email).first();

		if (!user) {
			const result = await register(database, email.split('@')[0], email, mlsn, doSend);
			if (result.success === true) {
				result.output = 'User registered (instead of login) successfully';
			}
			return result;
		}

		const code = randomCode();
		const timestamp = new Date().toISOString();
		await database.prepare('UPDATE users SET lcc = ?, timestamp = ? WHERE id = ?').bind(code, timestamp, user.id).run();

		if (doSend) {
			await sendEmail(email, 'Login', `<h2>Dear ${user.name},</h2><p>Login using this code: <b>${code}</b></p>`, mlsn);
		}

		return { success: true, output: 'Login code sent' };
	} catch (error) {
		console.error('Login error:', error);
		return { success: false, output: `Error: ${error}` };
	}
}

export async function finishLogin(database: D1Database, code: string, email: string, secret: string): Promise<operationResult> {
	try {
		if (!database) return { success: false, output: 'No DB specified' };
		if (!code) return { success: false, output: 'No code specified' };
		if (!email) return { success: false, output: 'No email specified' };

		code = code.toUpperCase();
		email = email.toLowerCase();

		const user = await database.prepare('SELECT * FROM users WHERE email = ? AND lcc = ?').bind(email, code).first();
		if (!user) return { success: false, output: 'Invalid code/email' };

		const codeTimestamp = new Date(user.timestamp as string);
		const currentTimestamp = new Date();
		const timeDiff = (currentTimestamp.getTime() - codeTimestamp.getTime()) / (1000 * 60); // in minutes

		if (timeDiff > 10) {
			return { success: false, output: 'Code expired' };
		}

		await database.prepare('UPDATE users SET lcc = NULL WHERE id = ?').bind(user.id).run();
		const jwt = makeJWT({ email: user.email, name: user.name, role: user.role, prefix: user.prefix }, secret);

		return { success: true, output: jwt };
	} catch (error) {
		console.error('Login confirmation error:', error);
		return { success: false, output: `Error: ${error}` };
	}
}
