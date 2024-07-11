import { describe, test, expect, beforeEach } from 'vitest';
import { operationResult } from '../src/operations/type';
import { unstable_dev, UnstableDevWorker } from 'wrangler';

describe('main', async () => {
	let worker: UnstableDevWorker;
	worker = await unstable_dev('src/main.ts');

	test('should return OK for OPTIONS request', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', { method: 'OPTIONS' });
		expect(response.status).toBe(200);
		expect(await response.text()).toBe('OK');
	});

	test('should return Illegal method for non-PUT requests', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', { method: 'GET' });
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(false);
		expect(data.output).toBe('Illegal method');
	});

	test('should return Invalid JSON for invalid JSON body', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', {
			method: 'PUT',
			body: 'invalid json',
		});
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(false);
		expect(data.output).toBe('Invalid JSON');
	});

	test('should return Unknown operation for unsupported operation', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', {
			method: 'PUT',
			body: JSON.stringify({
				operation: 'unknown',
				name: 'John Doe',
				email: 'john.doe@example.com',
				doSend: false,
			}),
		});
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(false);
		expect(data.output).toBe('Unknown operation');
	});

	test('should handle JWT verification', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', {
			method: 'PUT',
			body: JSON.stringify({
				operation: 'jwt',
				token: 'sample-token',
				doSend: false,
			}),
		});
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(false);
		expect(data.output).toBe('Token invalid');
	});

	test('should handle user registration', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', {
			method: 'PUT',
			body: JSON.stringify({
				operation: 'register',
				name: 'John Doe',
				email: 'john.doe@example.com',
				doSend: false,
			}),
		});
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(true);
		expect(data.output).toBe('User registered successfully');
	});

	test('should handle registration confirmation', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', {
			method: 'PUT',
			body: JSON.stringify({
				operation: 'register2',
				code: '123456',
				email: 'john.doe@example.com',
				doSend: false,
			}),
		});
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(false);
		expect(data.output).toBe('User/code not found');
	});

	test('should handle login', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', {
			method: 'PUT',
			body: JSON.stringify({
				operation: 'login',
				email: 'john.doe@example.com',
				doSend: false,
			}),
		});
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(true);
		expect(data.output).toBe('User registered (instead of login) successfully');
	});

	test('should handle login confirmation', async () => {
		const response = await worker.fetch('https://auth1.apexo.app', {
			method: 'PUT',
			body: JSON.stringify({
				operation: 'login2',
				code: '123456',
				email: 'john.doe@example.com',
				doSend: false,
			}),
		});
		expect(response.status).toBe(200);
		const data = (await response.json()) as operationResult;
		expect(data.success).toBe(false);
		expect(data.output).toBe('Invalid code/email');
	});
});
