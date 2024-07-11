```typescript
const API_URL = 'https://your-worker-url.workers.dev';

// Register a new user
fetch(API_URL, {
	method: 'PUT',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		operation: 'register',
		name: 'John Doe',
		email: 'john@example.com',
		doSend: true,
	}),
})
	.then((response) => response.json())
	.then((data) => console.log(data));

// Confirm registration
fetch(API_URL, {
	method: 'PUT',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		operation: 'register2',
		code: 'ABC123',
		email: 'john@example.com',
	}),
})
	.then((response) => response.json())
	.then((data) => console.log(data));

// Login
fetch(API_URL, {
	method: 'PUT',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		operation: 'login',
		email: 'john@example.com',
		doSend: true,
	}),
})
	.then((response) => response.json())
	.then((data) => console.log(data));

// Finish login
fetch(API_URL, {
	method: 'PUT',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		operation: 'login2',
		code: 'XYZ789',
		email: 'john@example.com',
	}),
})
	.then((response) => response.json())
	.then((data) => console.log(data));

// Verify JWT
fetch(API_URL, {
	method: 'PUT',
	headers: { 'Content-Type': 'application/json' },
	body: JSON.stringify({
		operation: 'jwt',
		token: 'your-jwt-token-here',
	}),
})
	.then((response) => response.json())
	.then((data) => console.log(data));
```
