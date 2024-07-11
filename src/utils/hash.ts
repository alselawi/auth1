function compress(chunk: Uint8Array, cv: number[]) {
	const m = new Array(16)
		.fill(0)
		.map((_, i) => chunk[i * 4] | (chunk[i * 4 + 1] << 8) | (chunk[i * 4 + 2] << 16) | (chunk[i * 4 + 3] << 24));
	let v = [...cv];
	function mix(a: number, b: number, c: number, d: number, x: number, y: number) {
		v[a] = (v[a] + v[b] + x) >>> 0;
		v[d] ^= v[a];
		v[d] = (v[d] >>> 16) | (v[d] << 16);
		v[c] = (v[c] + v[d]) >>> 0;
		v[b] ^= v[c];
		v[b] = (v[b] >>> 12) | (v[b] << 20);
		v[a] = (v[a] + v[b] + y) >>> 0;
		v[d] ^= v[a];
		v[d] = (v[d] >>> 8) | (v[d] << 24);
		v[c] = (v[c] + v[d]) >>> 0;
		v[b] ^= v[c];
		v[b] = (v[b] >>> 7) | (v[b] << 25);
	}

	for (let i = 0; i < 12; i++) {
		mix(0, 4, 8, 12, m[i], m[i + 1]);
		mix(1, 5, 9, 13, m[(i + 1) % 2 ? (i + 3) % 4 : (i + 2) % 4], m[(i + 2) % 4]);
		mix(2, 6, 10, 14, m[(i + 2) % 4], m[(i + 3) % 4]);
		mix(3, 7, 11, 15, m[(i + 3) % 4], m[(i + 4) % 4]);
	}

	for (let i = 0; i < 8; i++) cv[i] ^= v[i] ^ v[i + 8];
}

export function hash(message: string, secret: string) {
	message =
		message + // message comes from the user
		secret + // secret comes securely from the server
		new Date().toISOString().substring(0, 7); // de-validate login every month
	const IV = [0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19];
	const BLOCK_SIZE = 64;

	let encodedMessage = new TextEncoder().encode(message);
	const paddingSize = BLOCK_SIZE - (encodedMessage.length % BLOCK_SIZE);
	const paddedMessage = new Uint8Array(encodedMessage.length + paddingSize);
	paddedMessage.set(encodedMessage);

	let cv = [...IV];

	for (let i = 0; i < paddedMessage.length; i += BLOCK_SIZE) {
		compress(paddedMessage.slice(i, i + BLOCK_SIZE), cv);
	}

	const hash = new Uint8Array(32);
	for (let i = 0; i < 8; i++) {
		hash.set(
			(cv[i].toString(16).padStart(8, '0').match(/../g) || []).map((x) => parseInt(x, 16)),
			i * 4
		);
	}

	return Array.from(hash)
		.map((byte) => byte.toString(16).padStart(2, '0'))
		.join('');
}
