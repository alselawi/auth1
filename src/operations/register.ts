import { makeJWT, randomCode, sendEmail } from '../utils';
import { operationResult } from './type';

export async function register(users: D1Database, name: string, email: string, mlsn: string, doSend = true): Promise<operationResult> {
	if (!users) {
		return { success: false, output: 'No DB specified' };
	}
	if (!name) {
		return { success: false, output: 'No name specified' };
	}
	if (!email) {
		return { success: false, output: 'No email specified' };
	}

	email = email.toLowerCase();

	try {
		const confirmedUserCount = await users
			.prepare(
				`
				SELECT COUNT(*) as count
				FROM users
				WHERE email = ? AND confirmed = 1
				`
			)
			.bind(email)
			.all();

		const statementResult = (confirmedUserCount.results[0] as { count: number }).count;
		const alreadyExists = statementResult > 0;

		if (alreadyExists) {
			return { success: false, output: 'User already exists' };
		}

		const ecc = randomCode();
		const id = randomCode(30);
		const lcc = randomCode();

		// Insert new user
		await users
			.prepare(
				`
				INSERT INTO users (id, name, email, ecc, prefix, lcc, confirmed, role, timestamp)
				VALUES (?, ?, ?, ?, ?, ?, 0, 'user', ?)
				`
			)
			.bind(id, name, email, ecc, 'P' + id, lcc, new Date().toISOString())
			.run();

		if (doSend)
			await sendEmail(email, 'Verify your account', `<h2>Dear ${name},<h2>Verify your account using this code: <b>${ecc}</b>`, mlsn);

		return { success: true, output: 'User registered successfully' };
	} catch (error) {
		console.error('Registration error:', error);
		return { success: false, output: 'An error occurred during registration: ' + error };
	}
}

export async function confirmRegistration(users: D1Database, code: string, email: string, secret: string): Promise<operationResult> {
	if (!users) return { success: false, output: 'No DB specified' };
	if (!code) return { success: false, output: 'Code not specified' };
	if (!email) return { success: false, output: 'Email not specified' };

	code = code.toUpperCase();
	email = email.toLowerCase();

	try {
		const foundUser = await users.prepare(`SELECT * FROM users WHERE email = ? AND ecc = ? AND confirmed = 0`).bind(email, code).first();

		if (!foundUser) return { success: false, output: 'User/code not found' };

		const codeTimestamp = new Date(foundUser.timestamp as string);
		const currentTimestamp = new Date();
		const timeDiff = (currentTimestamp.getTime() - codeTimestamp.getTime()) / (1000 * 60); // in minutes

		if (timeDiff > 10) {
			return { success: false, output: 'Code expired' };
		}

		// Update user to confirmed
		await users.prepare(`UPDATE users SET confirmed = 1, ecc = NULL WHERE email = ? AND ecc = ?`).bind(email, code).run();

		// Remove all non-confirmed users that have the same email
		await users.prepare(`DELETE FROM users WHERE email = ? AND confirmed = 0`).bind(email).all();

		const jwt = makeJWT(
			{
				email: foundUser.email,
				name: foundUser.name,
				role: foundUser.role,
				prefix: foundUser.prefix,
			},
			secret
		);

		return { success: true, output: jwt };
	} catch (error) {
		console.error('Registration confirmation error:', error);
		return { success: false, output: 'An error occurred during registration confirmation' };
	}
}
