import { register, confirmRegistration, login, finishLogin } from '../src/operations';
import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { Miniflare } from 'miniflare';

let db: D1Database;

const mf = new Miniflare({
	modules: true,
	d1Databases: {
		users: '0522b7e5-56d5-4598-9650-05df9895546e',
	},
	script: ``,
});

beforeEach(async () => {
	db = await mf.getD1Database('users');
	// create table
	await db.exec(`
		CREATE TABLE users ( id TEXT PRIMARY KEY, name TEXT, email TEXT, ecc TEXT, prefix TEXT, lcc TEXT, confirmed INTEGER, role TEXT, timestamp TEXT)
	`);
});

afterEach(async () => {
	db.exec('DROP TABLE users');
});

describe('register', () => {
	test('should return error when no database specified', async () => {
		const result = await register(null as any, 'John Doe', 'john@example.com');
		expect(result).toEqual({ success: false, output: 'No DB specified' });
	});

	test('should return error when no name specified', async () => {
		const result = await register(db, '', 'john@example.com');
		expect(result).toEqual({ success: false, output: 'No name specified' });
	});

	test('should return error when no email specified', async () => {
		const result = await register(db, 'John Doe', '');
		expect(result).toEqual({ success: false, output: 'No email specified' });
	});

	test('should return error when user already exists', async () => {
		await db.exec(`
			INSERT INTO users (id, name, email, ecc, prefix, lcc, confirmed, role) VALUES ('1', 'Jane Doe', 'jane@example.com', 'ECC1', 'P1', 'LCC1', 1, 'user')
		`);
		const result = await register(db, 'John Doe', 'jane@example.com');
		expect(result).toEqual({ success: false, output: 'User already exists' });
	});

	test('should register a new user successfully', async () => {
		const result = await register(db, 'John Doe', 'john@example.com', false);
		expect(result).toEqual({ success: true, output: 'User registered successfully' });
		const user: any = await db.prepare('SELECT * FROM users WHERE email = ?').bind('john@example.com').first();
		expect(user).not.toBeNull();
		expect(user.name).toBe('John Doe');
		expect(user.confirmed).toBe(0);
	});
});

describe('confirmRegistration', () => {
	test('should return error when no database specified', async () => {
		const result = await confirmRegistration(null as any, '1234', 'john@example.com');
		expect(result).toEqual({ success: false, output: 'No DB specified' });
	});

	test('should return error when no code specified', async () => {
		const result = await confirmRegistration(db, '', 'john@example.com');
		expect(result).toEqual({ success: false, output: 'Code not specified' });
	});

	test('should return error when no email specified', async () => {
		const result = await confirmRegistration(db, '1234', '');
		expect(result).toEqual({ success: false, output: 'Email not specified' });
	});

	test('should return error when user/code not found', async () => {
		const result = await confirmRegistration(db, '1234', 'john@example.com');
		expect(result).toEqual({ success: false, output: 'User/code not found' });
	});

	test('should confirm a user successfully', async () => {
		await db.exec(
			`INSERT INTO users (id, name, email, ecc, prefix, lcc, confirmed, role, timestamp) VALUES ('2', 'John Doe', 'john@example.com', 'ECC1234', 'P1', 'LCC1', 0, 'user', '${new Date().toISOString()}')`
		);

		const result = await confirmRegistration(db, 'ECC1234', 'john@example.com');
		expect(result).toEqual({ success: true, output: expect.any(String) });

		const user: any = await db.prepare('SELECT * FROM users WHERE email = ?').bind('john@example.com').first();
		expect(user.confirmed).toBe(1);
	});

	test('should fail to confirm registration with expired code', async () => {
		// Register a user
		const registerResult = await register(db, 'Test User', 'test@example.com', false);
		expect(registerResult.success).toBe(true);

		// Retrieve the ECC code
		const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind('test@example.com').first();
		expect(user).not.toBeNull();
		const ecc = user!.ecc as string;

		// Simulate the passage of time by updating the timestamp
		await db
			.prepare(
				`
		  UPDATE users
		  SET timestamp = ?
		  WHERE email = ?
		`
			)
			.bind(new Date(Date.now() - 11 * 60 * 1000).toISOString(), 'test@example.com')
			.run();

		// Try to confirm the registration
		const confirmResult = await confirmRegistration(db, ecc, 'test@example.com');
		expect(confirmResult.success).toBe(false);
		expect(confirmResult.output).toBe('Code expired');
	});

	test('should successfully confirm registration within the valid time frame', async () => {
		// Register a user
		const registerResult = await register(db, 'Test User', 'test@example.com', false);
		expect(registerResult.success).toBe(true);

		// Retrieve the ECC code
		const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind('test@example.com').first();
		expect(user).not.toBeNull();
		const ecc = user!.ecc as string;

		// Confirm the registration
		const confirmResult = await confirmRegistration(db, ecc, 'test@example.com');
		expect(confirmResult.success).toBe(true);
		expect(typeof confirmResult.output).toBe('string'); // Assuming JWT is a string

		// Retrieve the user again to check the ecc field
		const confirmedUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind('test@example.com').first();
		expect(confirmedUser).not.toBeNull();
		expect(confirmedUser!.ecc).toBeNull();
	});

	test('should remove all non-confirmed users when a user is confirmed', async () => {
		// Register a user
		const registerResult = await register(db, 'Test User', 'test@example.com', false);
		expect(registerResult.success).toBe(true);

		// Register another non-confirmed user with the same email
		await register(db, 'Another User', 'test@example.com', false);

		// Retrieve the ECC code
		const user = await db.prepare('SELECT * FROM users WHERE email = ?').bind('test@example.com').first();
		expect(user).not.toBeNull();
		const ecc = user!.ecc as string;

		// Confirm the registration
		const confirmResult = await confirmRegistration(db, ecc, 'test@example.com');
		expect(confirmResult.success).toBe(true);
		expect(typeof confirmResult.output).toBe('string'); // Assuming JWT is a string

		// Verify that all non-confirmed users with the same email are removed
		const nonConfirmedUsers = await db.prepare('SELECT * FROM users WHERE email = ? AND confirmed = 0').bind('test@example.com').all();
		expect(nonConfirmedUsers.results.length).toBe(0);

		// verify that the confirmed user is still in the database and its the only one
		const confirmedUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind('test@example.com').all();
		expect(confirmedUser.results.length).toBe(1);

		// verify that the confirmed user is confirmed
		expect(confirmedUser.results[0].confirmed).toBe(1);
	});
});

describe('login', () => {
	test('should fail with no DB specified', async () => {
		const result = await login(null as any, 'test@example.com');
		expect(result.success).toBe(false);
		expect(result.output).toBe('No DB specified');
	});

	test('should fail with no email specified', async () => {
		const result = await login(db, '');
		expect(result.success).toBe(false);
		expect(result.output).toBe('No email specified');
	});

	test('should successfully login with existing confirmed user', async () => {
		// Insert test user into the database
		await db.exec(`INSERT INTO users (id, name, email, confirmed) VALUES ('1', 'Test User', 'test@example.com', 1)`);

		// Test login function
		const result = await login(db, 'test@example.com', false);
		expect(result.success).toBe(true);
		expect(result.output).toBe('Login code sent');
	});

	test('should register and then login for new user', async () => {
		// Test login function for a new user
		const result = await login(db, 'newuser@example.com', false);
		expect(result.success).toBe(true);
		expect(result.output).toBe('User registered (instead of login) successfully');

		// Check if the user is registered correctly
		const registeredUser = await db.prepare('SELECT * FROM users WHERE email = ?').bind('newuser@example.com').first();
		expect(registeredUser).not.toBeNull();
	});

	test('should register instead of login with unconfirmed user', async () => {
		await db.exec(`INSERT INTO users (id, name, email, confirmed) VALUES ('1', 'Test User', 'test@example.com', 0)`);

		// Test login function
		const result = await login(db, 'test@example.com', false);
		expect(result.success).toBe(true);
		expect(result.output).toBe('User registered (instead of login) successfully');
	});

	test('should handle database errors during login', async () => {
		const mockDb = {
			prepare: () => ({
				bind: () => ({
					first: async () => {
						throw new Error('Database error');
					},
				}),
			}),
		};

		const result = await login(mockDb as any, 'test@example.com');
		expect(result.success).toBe(false);
		expect(result.output).toBe('Error: Error: Database error');
	});
});

describe('finishLogin', () => {
    test('should fail with no DB specified', async () => {
        const result = await finishLogin(null as any, 'ABC123', 'test@example.com');
        expect(result.success).toBe(false);
        expect(result.output).toBe('No DB specified');
    });

    test('should fail with no code specified', async () => {
        const result = await finishLogin(db, '', 'test@example.com');
        expect(result.success).toBe(false);
        expect(result.output).toBe('No code specified');
    });

    test('should fail with no email specified', async () => {
        const result = await finishLogin(db, 'ABC123', '');
        expect(result.success).toBe(false);
        expect(result.output).toBe('No email specified');
    });

    test('should fail with invalid code/email', async () => {
        const result = await finishLogin(db, 'invalidCode', 'invalid@example.com');
        expect(result.success).toBe(false);
        expect(result.output).toBe('Invalid code/email');
    });

    test('should return error for expired code', async () => {
        // Insert test user with expired login code into the database (simulate 11 minutes ago)
        await db.exec(`
            INSERT INTO users (id, name, email, lcc, timestamp) VALUES ('1', 'Test User', 'test@example.com', 'ABC123', '${new Date(Date.now() - 11 * 60 * 1000).toISOString()}')
        `);

        // Test finishLogin function for expired code
        const result = await finishLogin(db, 'ABC123', 'test@example.com');
        expect(result.success).toBe(false);
        expect(result.output).toBe('Code expired');
    });

	test('should successfully login with valid code', async () => {
		// Insert test user with valid login code into the database
		await db.exec(`
			INSERT INTO users (id, name, email, lcc, timestamp) VALUES ('1', 'Test User', 'test2@example.com', 'ABC123', '${new Date().toISOString()}')
		`);
		const f = await finishLogin(db, 'ABC123', 'test2@example.com');
		expect(f.success).toBe(true);
		expect(f.output).toEqual(expect.any(String));
	});
		
});