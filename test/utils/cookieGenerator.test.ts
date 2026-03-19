import { it, describe, expect } from 'vitest';
import { makeCookie } from '~~/src/botDetector/utils/cookieGenerator.js';
import { makeRes } from '../test-utils/test-utils.js';

const baseOptions = {
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 3600000,
    secure: false,
};

describe('cookieGenerator — makeCookie()', () => {
    describe('standard cookie', () => {
        it('calls res.cookie with the provided name and value', () => {
            const res = makeRes();
            makeCookie(res, 'session', 'abc123', { ...baseOptions });
            expect(res._cookies).toHaveLength(1);
            expect(res._cookies[0].name).toBe('session');
            expect(res._cookies[0].value).toBe('abc123');
        });

        it('passes httpOnly, sameSite, maxAge through to res.cookie', () => {
            const res = makeRes();
            makeCookie(res, 'session', 'val', { ...baseOptions, httpOnly: true, sameSite: 'strict', maxAge: 86400 });
            const { opts } = res._cookies[0];
            expect(opts.httpOnly).toBe(true);
            expect(opts.sameSite).toBe('strict');
            expect(opts.maxAge).toBe(86400);
        });

        it('preserves domain when no special prefix is used', () => {
            const res = makeRes();
            makeCookie(res, 'session', 'val', { ...baseOptions, domain: 'example.com' });
            expect(res._cookies[0].opts.domain).toBe('example.com');
        });
    });

    describe('__Host- prefix enforcement', () => {
        it('forces secure=true for __Host- prefixed cookies', () => {
            const res = makeRes();
            makeCookie(res, '__Host-session', 'val', { ...baseOptions, secure: false });
            expect(res._cookies[0].opts.secure).toBe(true);
        });

        it('forces path="/" for __Host- prefixed cookies', () => {
            const res = makeRes();
            makeCookie(res, '__Host-session', 'val', { ...baseOptions, path: '/api' });
            expect(res._cookies[0].opts.path).toBe('/');
        });

        it('removes domain for __Host- prefixed cookies', () => {
            const res = makeRes();
            makeCookie(res, '__Host-session', 'val', { ...baseOptions, domain: 'example.com' });
            expect(res._cookies[0].opts.domain).toBeUndefined();
        });
    });

    describe('__Secure- prefix enforcement', () => {
        it('forces secure=true for __Secure- prefixed cookies', () => {
            const res = makeRes();
            makeCookie(res, '__Secure-token', 'val', { ...baseOptions, secure: false });
            expect(res._cookies[0].opts.secure).toBe(true);
        });

        it('does NOT force path="/" for __Secure- prefixed cookies', () => {
            const res = makeRes();
            makeCookie(res, '__Secure-token', 'val', { ...baseOptions, path: '/api' });
            expect(res._cookies[0].opts.path).toBe('/api');
        });

        it('preserves domain for __Secure- prefixed cookies', () => {
            const res = makeRes();
            makeCookie(res, '__Secure-token', 'val', { ...baseOptions, domain: 'example.com' });
            expect(res._cookies[0].opts.domain).toBe('example.com');
        });
    });

    describe('expires option', () => {
        it('passes expires date through to res.cookie', () => {
            const res = makeRes();
            const expiry = new Date(Date.now() + 3600_000);
            makeCookie(res, 'session', 'val', { ...baseOptions, expires: expiry });
            expect(res._cookies[0].opts.expires).toEqual(expiry);
        });
    });
});
