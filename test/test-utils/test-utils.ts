import { vi } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import type { GeoResponse } from '~~/src/botDetector/types/geoTypes.js';
import type { ParsedUAResult } from '~~/src/botDetector/types/UAparserTypes.js';
import type { ValidationContext } from '~~/src/main.js';

export interface ReqOpts {
    ip?: string;
    ua?: string;
    cookie?: string;
    httpVersion?:string;
    method?: string;
    protocol?: string;
    hostname?: string;
    host?: string;
    originalUrl?: string;
    headers?: Record<string, string>;
};

export function makeReq(opts: ReqOpts = {}): Request {
    const ua = opts.ua ?? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';
    const hostname = opts.hostname ?? opts.host ?? 'example.com';
    const headers: Record<string, string> = {
        'user-agent': ua,
        'accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-encoding': 'gzip, deflate, br',
        'accept-language': 'en-US,en;q=0.9',
        'upgrade-insecure-requests': '1',
        'x-client-id': 'browser-client-v1',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-dest': 'document',
        'sec-fetch-site': 'none',
        'x-client-cipher': 'TLS_AES_256_GCM_SHA384',
        'x-client-tls-version': 'TLS1.3',
        'sec-ch-ua': '"Chromium";v="124", "Google Chrome";v="124"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        ...opts.headers,
    };

    const cookies: Record<string, string> = {};
    if (opts.cookie) cookies['canary_id'] = opts.cookie;

    return {
        ip: opts.ip ?? '1.2.3.4',
        httpVersion: opts.httpVersion ?? '2.0',
        method: opts.method ?? 'GET',
        protocol: opts.protocol ?? 'https',
        hostname,
        host: hostname,
        originalUrl: opts.originalUrl ?? '/',
        path: opts.originalUrl ?? '/',
        cookies,
        rawHeaders: Object.entries(headers).flat(),
        accepts: () => 'text/html',
        acceptsEncodings: () => 'gzip',
        acceptsLanguages: () => 'en',
        get: (name: string) => headers[name.toLowerCase()] ?? '',
        headers,
    } as unknown as Request;
}


export function makeRes() {
    const cookiesCalled: { name: string; value: string; opts: any }[] = [];
    return {
        sendStatus: vi.fn(),
        cookie: vi.fn((name: string, value: string, opts: any) => cookiesCalled.push({ name, value, opts })),
        _cookies: cookiesCalled,
    } as unknown as Response & { sendStatus: ReturnType<typeof vi.fn>; _cookies: typeof cookiesCalled };
}

export function makeNext(): NextFunction {
    return vi.fn() as unknown as NextFunction;
}

export const cleanUSGeo: GeoResponse = {
    country: 'united states',
    countryCode: 'us',
    region: 'ca',
    regionName: 'california',
    city: 'los angeles',
    district: 'downtown',
    lat: '34.0522',
    lon: '-118.2437',
    timezone: 'America/Los_Angeles',
    subregion: 'north america',
    phone: '1',
    continent: 'north america',
    proxy: false,
    hosting: false,
} as GeoResponse;

export const bannedCountryGeo: GeoResponse = {
    ...cleanUSGeo,
    country: 'russia',
    countryCode: 'ru',
} as GeoResponse;


export const cleanBrowserUA: ParsedUAResult = {
    device: 'desktop',
    browser: 'Chrome',
    browserType: undefined,
    browserVersion: '124',
    os: 'Windows',
    bot: false,
    botAI: false,
    allResults: {} as any,
};

export const headlessUA: ParsedUAResult = {
    ...cleanBrowserUA,
    browser: 'HeadlessChrome',
};

export const createMockContext = (overrides: Partial<ValidationContext> = {}): ValidationContext => {
    const defaults: ValidationContext = {
        req: { get: () => '' } as unknown as Request,
        ipAddress: '127.0.0.1',
        parsedUA: {},
        geoData: {},
        cookie: '',
        proxy: { isProxy: false },
        anon: false,
        bgp: {},
        tor: {},
        threatLevel: null,
        custom: {},
    };
    return { ...defaults, ...overrides };
};

export const uid = () => crypto.randomUUID();
