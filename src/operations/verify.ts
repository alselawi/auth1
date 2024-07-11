import { verifyJWT } from '../utils';
import { operationResult } from './type';

export function verify(token: string, secret: string): operationResult {
	const result = verifyJWT(token, secret);
	return {
		success: !!result,
		output: result ? 'Token verified' : 'Token invalid',
	};
}
