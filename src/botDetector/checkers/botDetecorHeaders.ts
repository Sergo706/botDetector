import { Request } from 'express';
import { getConfiguration } from "../config/config.js";

export function headersBotDetector(req: Request): number {
  let score = 0;
  const {penalties} = getConfiguration()

  if (req.httpVersion === '1.1') {
    const conn = req.get('connection')?.toLowerCase();
    if (conn && conn === 'close') score += penalties.headerOptions.connectionHeaderIsClose;
  }

  const isBrowserRequest = !req.get('x-client-id');   
  const isTopNavigation  =
  req.method === 'GET' && req.get('sec-fetch-dest') === 'document';

  if (isBrowserRequest && !isTopNavigation && req.method !== 'GET') {
    const origin = req.get('origin');
    if (!origin) {
      score += penalties.headerOptions.originHeaderIsNULL;
    } else if (origin !== `${req.protocol}://${req.hostname}`) {
      score += penalties.headerOptions.originHeaderMissmatch;
    }
  }
  
  const accept          = req.get('accept');
  const acceptLanguage  = req.get('accept-language');
  const hostHeader      = req.get('X-Forwarded-Host');

  if (!acceptLanguage) score += penalties.headerOptions.ommitedAcceptLanguage;
  if (!accept) score += penalties.headerOptions.acceptHeader.acceptIsNULL;


  const mustHeaders = new Set([
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest',
    'sec-fetch-user',
    'accept-encoding',
    'accept-language',
    'referer',

  ]);

  mustHeaders.forEach((h, i) => {
    if (req.method === 'POST' && h.startsWith('sec-fetch-')) return;
    if (!req.get(h)) score += penalties.headerOptions.weightPerMustHeader;
  });


  if (accept && accept.trim() === '*/*') score += penalties.headerOptions.acceptHeader.ommitedAcceptHeader;
  else if (accept && accept.length < 10) score += penalties.headerOptions.acceptHeader.shortAcceptHeader;


  if (req.get('x-requested-with') && req.method === 'GET') score += penalties.headerOptions.AJAXHeaderExists;
  if (req.get('postman-token') || req.get('insomnia'))      score += penalties.headerOptions.postManOrInsomiaHeaders;
  if (hostHeader && req.hostname && hostHeader !== req.hostname) score += penalties.headerOptions.hostMismatchWeight;


  return score;
}
