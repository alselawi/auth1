import { hash } from './hash';

type JWT = { payload: Object; signature: string };

export function makeJWT(payload: Object, secret: string) {
	const signature = hash(JSON.stringify(payload), secret);
	const parsedJWT: JWT = { payload, signature };
	return btoa(JSON.stringify(parsedJWT));
}

export function verifyJWT(jwt: string, secret: string) {
	try {
		let parsedJWT = JSON.parse(atob(jwt)) as JWT;
		return hash(JSON.stringify(parsedJWT.payload), secret) === parsedJWT.signature;
	} catch (e) {
		return false;
	}
}
