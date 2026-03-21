import { it, describe, expect } from 'vitest';
import { parseUA } from '~~/src/botDetector/helpers/UAparser.js';






describe('parseUA', () => {
    describe('real browser user agents', () => {
        it('identifies chrome as a browser', () => {
            const result = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36');
            expect(result.browser).toBe('Chrome');
            expect(result.browserType).toBeUndefined();
            expect(result.bot).toBe(false);
        });

        it('identifies Firefox as a browser', () => {
            const result = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:125.0) Gecko/20100101 Firefox/125.0');
            expect(result.browser).toBe('Firefox');
            expect(result.browserType).toBeUndefined();
            expect(result.bot).toBe(false);
        });

        it('identifies Safari on iOS as mobile browser', () => {
            const result = parseUA('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1');
            expect(result.browser).toBe('Mobile Safari');
            expect(result.device).toBe('mobile');
            expect(result.bot).toBe(false);
        });

        it('populates os field for Windows', () => {
            const result = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36');
            expect(result.os).toBe('Windows');
        });

        it('defaults device to desktop when no device type is detected', () => {
            const result = parseUA('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/124.0 Safari/537.36');
            expect(result.device).toBe('desktop');
        });
    });

    describe('crawlers and bots', () => {
        it('identifies googlebot as a crawler', () => {
            const result = parseUA('Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)');
            expect(result.browserType).toBe('crawler');
            expect(result.bot).toBe(true);
        });

        it('identifies bingbot as a crawler', () => {
            const result = parseUA('Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)');
            expect(result.browserType).toBe('crawler');
            expect(result.bot).toBe(true);
        });

        it('identifies gptbot as a crawler', () => {
            const result = parseUA('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)');
            expect(result.browserType).toBe('crawler');
        });

        it('flags ai bots via botAI', () => {
            const result = parseUA('Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; GPTBot/1.0; +https://openai.com/gptbot)');
            expect(result.botAI).toBe(true);
        });
    });

    describe('cli tools', () => {
        it('identifies curl as a cli', () => {
            const result = parseUA('curl/8.4.0');
            expect(result.browserType).toBe('cli');
            expect(result.browser).toBe('curl');
        });

        it('identifies wget as a cli', () => {
            const result = parseUA('Wget/1.21.4');
            expect(result.browserType).toBe('cli');
        });
    });

    describe('cases', () => {
        it('does not throw on an empty string', () => {
            expect(() => parseUA('')).not.toThrow();
        });

        it('converts a numeric input to string without throwing', () => {
            expect(() => parseUA(12345)).not.toThrow();
            const result = parseUA(12345);
            expect(result).toBeDefined();
        });

        it('returns defined result structure for an unknown UA', () => {
            const result = parseUA('UnknownBot/1.0 (+http://unknown.example.com)');
            expect(result).toHaveProperty('device');
            expect(result).toHaveProperty('browser');
            expect(result).toHaveProperty('bot');
            expect(result).toHaveProperty('botAI');
            expect(result).toHaveProperty('allResults');
        });

        it('identifies a mobile device from android ua', () => {
            const result = parseUA('Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36');
            expect(result.device).toBe('mobile');
        });
    });
});
