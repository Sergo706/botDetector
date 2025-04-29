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
  { re: /(^|\/)\.git(?:\/|$)/i,                         weight: 10 },
  { re: /(^|\/)\.git\/config(?:\/|$)/i,                weight: 10 },           // updated
  { re: /(^|\/)\.env(?:\.local|\.example)?(?:\/|$)/i,  weight: 10 },
  { re: /(^|\/)wp-admin(?:\/|$)/i,                     weight: 8 },
  { re: /\/wp-json\/wp\/v2(?:\/|$)/i,                  weight: 7 },
  { re: /\/(jenkins|hudson)(?:\/|$)/i,                 weight: 9 },            // simplified
  { re: /\/(script|login)\.groovy(?:\/|$)/i,           weight: 8 },
  { re: /\/actuator\/(?:env|health|metrics)(?:\/|$)/i, weight: 8 },
  // { re: /[?&]url=https?:\/\//i,                        weight: 6 }, // Striped
  { re: /\/web\.config(?:\/|$)/i,                      weight: 7 },
  { re: /\/\.DS_Store(?:\/|$)/i,                       weight: 4 },
  { re: /\/latest\/meta-data\/iam(?:\/|$)/i,           weight: 10 },           // updated
  { re: /(^|\/)\.aws\/credentials(?:\/|$)/i,           weight: 10 },           // updated
  { re: /\/Dockerfile(?:\/|$)/i,                       weight: 7 },            // updated
  { re: /\/composer\.lock(?:\/|$)/i,                   weight: 7 },            // updated
  { re: /\/jnlpJars\/jenkins-cli\.jar(?:\/|$)/i,       weight: 9 },            // updated
  { re: /\/manager\/html(?:\/|$)/i,                    weight: 10 },
  { re: /\/shell(?:\.php)?(?:\/|$)/i,                  weight: 10 },           // updated
  { re: /\/(grafana|kibana|prometheus)(?:\/|$)/i,      weight: 7 },            // simplified
  { re: /\/(owa|ecp)(?:\/|$)/i,                        weight: 8 },            // simplified
  { re: /wp-login\.php(?:\/|$)/i,                      weight: 8 },            // updated
  { re: /\/swagger-ui(?:\/|\.html)(?:\/|$)/i,          weight: 6 },            // updated
  { re: /\/v2\/api-docs(?:\/|$)/i,                     weight: 5 },            // updated
  { re: /\/api-docs(?:\/|\.json)(?:\/|$)/i,            weight: 5 },            // updated
  { re: /phpmyadmin(?:\/|$)/i,                         weight: 8 },
  { re: /(^|\/)\.well-known(?:\/|$)/i,                 weight: 5 },
  { re: /(^|\/)\.htaccess(?:\/|$)/i,                   weight: 7 },
  { re: /composer\.json(?:\/|$)/i,                     weight: 7 },            // updated
  { re: /docker-compose\.ya?ml(?:\/|$)/i,              weight: 7 },            // updated
  { re: /\.(?:sql|bak|old|save|log|ini|conf|zip|tar(?:\.gz)?)(?:\/|$)/i, weight: 7 },
  { re: /(\.{2}|%2e%2e)(?:\/|\\)/i,                    weight: 5 },
  { re: /(package-lock\.json|yarn\.lock|\.gitignore)(?:\/|$)/i, weight: 6 },   // updated
  { re: /(^|\/)admin(?:\/|$)/i,                        weight: 6 },
  { re: /phpinfo(?:\.php)?(?:\/|$)/i,                  weight: 8 },            // updated
  { re: /(^|\/)\.ssh(?:\/|$)/i,                        weight: 8 },
  { re: /^\/xmlrpc\.php(?:\/|$)/i,                     weight: 8 },            // updated
  { re: /(^|\/)wp-config\.php(?:\/|$)/i,               weight: 10 },           // updated
  { re: /(^|\/)(install|setup)(?:\.php)?(?:\/|$)/i,    weight: 8 },            // updated
  { re: /(^|\/)backup(?:s)?(?:\.zip|\.tar\.gz|\.sql)(?:\/|$)/i, weight: 8 },   // updated
  { re: /(^|\/)\.gitlab-ci\.yml(?:\/|$)/i,             weight: 8 },            // updated
  { re: /(^|\/)\.svn(?:\/|$)/i,                        weight: 6 },
  { re: /(^|\/)\.hg(?:\/|$)/i,                         weight: 6 },
  { re: /(^|\/)CVS(?:\/|$)/i,                          weight: 6 },
  { re: /(^|\/)\.vscode(?:\/|$)/i,                     weight: 4 },
  { re: /(^|\/)\.htpasswd(?:\/|$)/i,                   weight: 8 },            // simplified
  { re: /phpunit(?:\.phar)?(?:\/|$)/i,                 weight: 9 },            // updated
  { re: /(^|\/)config(?:uration)?\.(?:php|yml|json|xml|ini|conf|cfg)(?:\/|$)/i, weight: 7 },
];


const WHITELIST: RegExp[] = [
  /^\/?$/,                                       // root path
  /^\/(css|js|images|assets|static)\//i,       // static asset directories
  /\.(?:html|css|js|png|jpe?g|svg|map|woff2?|ttf|webp)$/i, // common file extensions
  /^\/robots\.txt$/i,                             // robots.txt (search engine bots)
  /^\/sitemap\.xml$/i,                            // sitemap.xml (search engine bots)
];



export function pathScore(req: Request): number {
  
  let score = 0;
  const hostHeader = req.get('x-forwarded-host');
  const base = `${req.protocol}://${hostHeader || req.get('host')}`;

  const rawPath = settings.proxy
  ? (req.get('x-original-path') || req.originalUrl)
  : req.originalUrl;

  // 1) Extract raw pathname
  let pathname: string;
  try {

    const fullUrl = new URL(rawPath, base);
    pathname = fullUrl.pathname;
    console.log('[DEBUG] fullUrl.pathname =', fullUrl.pathname);
  } catch {
    pathname = rawPath.split('?')[0];
    console.log('[DEBUG][pathScore] fallback path =', pathname);
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
      console.log('matched', re, 'score +', weight);   // ← add this
      score += weight;
      if (score >= 30) break;
    }
  }

  return score;
}
