import { operationResult } from '../src/operations/type';
import { corsRes, hash, makeJWT, verifyJWT, randomCode } from '../src/utils';
import { describe, it, expect } from 'vitest';

describe('corsRes', () => {
    it('should return a response with CORS headers', () => {
        const response = corsRes({ success: true, output: 'Test Response' });

        expect(response).toBeInstanceOf(Response);

        const headers = response.headers;
        expect(headers.get('Access-Control-Allow-Origin')).toBe('*');
        expect(headers.get('Access-Control-Allow-Methods')).toBe('GET, POST, PUT, DELETE, HEAD, OPTIONS');
        expect(headers.get('Access-Control-Max-Age')).toBe('86400');
        expect(headers.get('Access-Control-Allow-Headers')).toBe('x-worker-key,Content-Type,x-custom-metadata,Content-MD5,x-amz-meta-fileid,x-amz-meta-account_id,x-amz-meta-clientid,x-amz-meta-file_id,x-amz-meta-opportunity_id,x-amz-meta-client_id,x-amz-meta-webhook,authorization');
        expect(headers.get('Access-Control-Allow-Credentials')).toBe('true');
        expect(headers.get('Allow')).toBe('GET, POST, PUT, DELETE, HEAD, OPTIONS');
    });

    it('should return the correct response body', async () => {
        const responseBody: operationResult = { success: true, output: 'Test Response' };
        const response = corsRes(responseBody);

        const body = await response.text();
        expect(body).toBe(JSON.stringify(responseBody));
    });
});

describe('hash', () => {
    it('should return the correct hash for a given message', () => {
        const message = 'hello';
        const expectedHash = 'fa9711b9fd10621effad8e0e54112cf5ff1b43454ef90def265a1780ff20849b'; // Replace with the actual expected hash

        const result = hash(message);

        expect(result).toBe(expectedHash);
    });

    it('should return a different hash for different messages', () => {
        const message1 = 'hello';
        const message2 = 'world';

        const hash1 = hash(message1);
        const hash2 = hash(message2);

        expect(hash1).not.toBe(hash2);
    });

    it('should return a different hash if the secret is changed', () => {
        const message = 'hello';
        const hash1 = hash(message, 'modified secret');
        const hash2 = hash(message);
        expect(hash1).not.toBe(hash2);
    });
});

describe('JWT Functions', () => {
    it('should create a valid JWT', () => {
        const payload = { userId: 123, username: 'test' };
        const jwt = makeJWT(payload);

        const decodedJWT = JSON.parse(atob(jwt));
        expect(decodedJWT.payload).toEqual(payload);
        expect(decodedJWT.signature).toBe(hash(JSON.stringify(payload)));
    });

    it('should verify a valid JWT', () => {
        const payload = { userId: 123, username: 'test' };
        const jwt = makeJWT(payload);

        const isValid = verifyJWT(jwt);
        expect(isValid).toBe(true);
    });

    it('should not verify an invalid JWT', () => {
        const payload = { userId: 123, username: 'test' };
        const jwt = makeJWT(payload);

        // Tamper with the JWT
        const decodedJWT = JSON.parse(atob(jwt));
        decodedJWT.payload.userId = 456;
        const tamperedJWT = btoa(JSON.stringify(decodedJWT));

        const isValid = verifyJWT(tamperedJWT);
        expect(isValid).toBe(false);
    });

    it('should return false for a malformed JWT', () => {
        const malformedJWT = 'invalid-jwt';
        const isValid = verifyJWT(malformedJWT);
        expect(isValid).toBe(false);
    });
});

describe('randomCode', () => {
    it('should generate a code of the default length', () => {
        const code = randomCode();
        expect(code).toHaveLength(6);
    });

    it('should generate a code of the specified length', () => {
        const length = 10;
        const code = randomCode(length);
        expect(code).toHaveLength(length);
    });

    it('should generate a code containing only uppercase letters', () => {
        const code = randomCode();
        expect(code).toMatch(/^[A-Z]+$/);
    });

    it('should handle edge cases correctly', () => {
        const codeZeroLength = randomCode(0);
        expect(codeZeroLength).toHaveLength(0);
    });

    it('should generate different codes on subsequent calls', () => {
        const code1 = randomCode();
        const code2 = randomCode();
        expect(code1).not.toEqual(code2);
    });
});
