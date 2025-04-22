import { Request } from 'express';
import path from 'path';
import { URL } from 'url';
import { settings } from '../settings.js';

// Maximum number of recursive decode iterations to catch multi-encoded sequences
const MAX_DECODE_ITERATIONS = settings.penalties.pathTraveler.maxIterations;
// Any pathname longer than this is considered high-risk
const MAX_PATH_LENGTH = settings.penalties.pathTraveler.maxPathLength;

// Suspicious patterns and their associated weights
// Adjust weights and add/remove patterns as needed to tune sensitivity vs. false positives
const PATH_RULES: Array<{ re: RegExp; weight: number }> = [
  { re: /(^|\/)\.git(?:\/|$)/i,               weight: 10 }, // .git folder probes
  { re: /(^|\/)\.env(?:\.local|\.example|$)/i, weight: 10 }, // .env variants
  { re: /(^|\/)wp-admin(?:\/|$)/i,             weight: 8 },  // WordPress admin
  { re: /wp-login\.php$/i,                      weight: 8 },  // WordPress login
  { re: /phpmyadmin(?:\/|$)/i,                 weight: 8 },  // phpMyAdmin interface
  { re: /(^|\/)\.well-known(?:\/|$)/i,       weight: 5 },  // ACME/security configs
  { re: /(^|\/)\.htaccess(?:\/|$)/i,         weight: 7 },  // .htaccess file
  { re: /composer\.json$/i,                    weight: 7 },  // Composer manifest
  { re: /docker-compose\.ya?ml$/i,             weight: 7 },  // Docker Compose
  { re: /\.(?:sql|bak|old|save|log|ini|conf|zip|tar(?:\.gz)?)(?:$|\/)/i, weight: 7 }, // Backups/config
  { re: /(\.{2}|%2e%2e)(?:\/|\\)/i,           weight: 5 },  // Directory traversal
  { re: /(package-lock\.json|yarn\.lock|\.gitignore)$/i, weight: 6 },  // Lock/ignore files
  { re: /(^|\/)admin(?:\/|$)/i,               weight: 6 },  // Generic admin panels
  { re: /phpinfo(?:\.php)?$/i,                 weight: 8 },  // PHP info pages
  { re: /(^|\/)\.ssh(?:\/|$)/i,              weight: 8 },  // SSH folder access
];

// Whitelisted safe paths that should never score (static assets, root)
const WHITELIST: RegExp[] = [
  /^\/?$/,                                       // root path
  /^\/(css|js|images|assets|static)\//i,       // static asset directories
  /\.(?:html|css|js|png|jpe?g|svg|map|woff2?|ttf|webp)$/i, // common file extensions
  /^\/robots\.txt$/i,                             // robots.txt (search engine bots)
  /^\/sitemap\.xml$/i,                            // sitemap.xml (search engine bots)
];

/**
 * Computes a path-based suspicion score for a given request.
 * Higher scores indicate more suspicious or malicious path probes.
 *
 * @param req Express request object
 * @returns numeric score (0 = safe, higher = more suspicious)
 */
export function pathScore(req: Request): number {
  let score = 0;
  const hostHeader = req.get('x-forwarded-host');
  const base = `${req.protocol}://${hostHeader || req.get('host')}`;

  // 1) Extract raw pathname
  let pathname: string;
  try {
    const fullUrl = new URL(req.originalUrl, base);
    pathname = fullUrl.pathname;
  } catch {
    pathname = req.originalUrl.split('?')[0];
  }

  // 2) Quick length check
  if (pathname.length > MAX_PATH_LENGTH) {
    return settings.penalties.pathTraveler.pathLengthToLong;  // immediate high score
  }

  // 3) Skip whitelisted paths
  if (WHITELIST.some(rx => rx.test(pathname))) {
    return 0;
  }

  // 4) Recursive percent-decode (catch multi-layer encoding)
 let decoded = pathname;
 let totalDecodedLength = 0;
for (let i = 0; i < MAX_DECODE_ITERATIONS; i++) {
  try {
    const tmp = decodeURIComponent(decoded);
    if (tmp === decoded) break;
    totalDecodedLength += tmp.length;
    if (totalDecodedLength > MAX_PATH_LENGTH * 2) {
      return settings.penalties.pathTraveler.longDecoding; 
      // Assign a high score for suspiciously long decoding
    }
    decoded = tmp;
  } catch {
    break;
  }
}
  // 5) Normalize to collapse traversal segments
  const normalized = path.normalize(decoded);

  // 6) Score against each rule
  for (const { re, weight } of PATH_RULES) {
    if (re.test(normalized)) {
      score += weight;
      if (score >= 30) break;
    }
  }

  return score;
}
