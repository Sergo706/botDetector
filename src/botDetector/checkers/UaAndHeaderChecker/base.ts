import path from 'path';
import { URL } from 'url';
import { Request } from 'express';
import { pathRules, whiteList } from '@utils/regex/pathTravelersRegex.js';
import { BotDetectorConfig } from '../../types/configSchema.js';

export class UaAndHeaderCheckerBase {
    protected pathScore(req: Request, config: BotDetectorConfig): number {
        const settings = config.pathTraveler
        const MAX_DECODE_ITERATIONS = settings.maxIterations;
        const MAX_PATH_LENGTH = settings.maxPathLength;
        
        let score = 0;
        const hostHeader = req.get('x-forwarded-host');
        const base = `${req.protocol}://${hostHeader || req.get('host')}`;
        
        const rawPath = req.get('x-original-path') || req.originalUrl;
        
        
        let pathname: string;
        try {
        
            const fullUrl = new URL(rawPath, base);
            pathname = fullUrl.pathname;
            console.log('[DEBUG] fullUrl.pathname =', fullUrl.pathname);
        } catch {
            pathname = rawPath.split('?')[0];
            console.log('[DEBUG][pathScore] fallback path =', pathname);
        }
        
        
        
        if (pathname.length > MAX_PATH_LENGTH) {
            return settings.pathLengthToLong;
        }
        
        
        if (whiteList.some(rx => rx.test(pathname))) {
            return 0;
        }
        
        
        let decoded = pathname;
        let totalDecodedLength = 0;
        for (let i = 0; i < MAX_DECODE_ITERATIONS; i++) {
        try {
            const tmp = decodeURIComponent(decoded);
            if (tmp === decoded) break;
            totalDecodedLength += tmp.length;
            if (totalDecodedLength > MAX_PATH_LENGTH * 2) {
            return settings.longDecoding; 
            }
            decoded = tmp;
        } catch {
            break;
        }
        }
        
        const normalized = path.normalize(decoded);
        
        for (const { re, weight } of pathRules) {
            if (re.test(normalized)) {
            score += weight;
            if (score >= 30) break;
            }
        }
        
        return score;
    }

    protected tlsBotScore(req: Request, config: BotDetectorConfig): number {
      const settings = config.checkers.enableUaAndHeaderChecks;
      if (settings.enable === false) return 0;
      const { penalties } = settings;

      let score = 0;
      const proto = req.httpVersion === '2.0' ? 'h2'
                   : req.httpVersion === '1.1' ? 'http/1.1'
                   : '';
    
      if (!proto || (proto !== 'h2' && proto !== 'http/1.1')) {
        score += penalties.tlsCheckFailed;
      }
    
      const cipher = req.get('x-client-cipher') || '';
    
      const browserCiphers = new Set([
        'TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384',
        'TLS_CHACHA20_POLY1305_SHA256',
        'ECDHE-ECDSA-AES128-GCM-SHA256', 'ECDHE-RSA-AES128-GCM-SHA256',
        'ECDHE-ECDSA-CHACHA20-POLY1305', 'ECDHE-RSA-CHACHA20-POLY1305',
        'ECDHE-ECDSA-AES256-GCM-SHA384', 'ECDHE-RSA-AES256-GCM-SHA384',
        'TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256',
        'TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256',
        'TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384',
        'TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384',
        'TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256',
        'TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256'
      ]);
    
      if (!browserCiphers.has(cipher)) score += penalties.tlsCheckFailed;;
                                              
      const tlsVersion = (req.get('x-client-tls-version') || '').toLowerCase();
      if (
        tlsVersion &&
        !tlsVersion.startsWith('tls1.3') &&
        !tlsVersion.startsWith('tls1.2')
      ) {
        score += penalties.tlsCheckFailed; 
      }
    
      return score;
    }
}