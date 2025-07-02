import { Request } from 'express';
import { settings } from '../../settings.js';

export function tlsBotScore(req: Request): number {
  let score = 0;
  const proto = req.httpVersion === '2.0' ? 'h2'
               : req.httpVersion === '1.1' ? 'http/1.1'
               : '';

  if (!proto || (proto !== 'h2' && proto !== 'http/1.1')) {
    score += settings.penalties.tlsCheckFailed;
  }

  const cipher = req.get('x-client-cipher') || '';

  const browserCiphers = new Set([
    'TLS_AES_128_GCM_SHA256', 'TLS_AES_256_GCM_SHA384',
    'TLS_CHACHA20_POLY1305_SHA256',
    'ECDHE-ECDSA-AES128-GCM-SHA256', 'ECDHE-RSA-AES128-GCM-SHA256',
    'ECDHE-ECDSA-CHACHA20-POLY1305', 'ECDHE-RSA-CHACHA20-POLY1305',
    'ECDHE-ECDSA-AES256-GCM-SHA384', 'ECDHE-RSA-AES256-GCM-SHA384',
  ]);

  if (!browserCiphers.has(cipher)) score += settings.penalties.tlsCheckFailed;;
                                          
  const tlsVersion = (req.get('x-client-tls-version') || '').toLowerCase(); // e.g. "tls1.3"
  if (
    tlsVersion &&
    !tlsVersion.startsWith('tls1.3') &&
    !tlsVersion.startsWith('tls1.2')
  ) {
    score += settings.penalties.tlsCheckFailed;      // very old stack
  }

  return score;
}
