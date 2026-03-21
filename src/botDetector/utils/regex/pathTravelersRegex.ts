import { createRegExp, anyOf, maybe, exactly } from 'magic-regexp'

const startOrSlash = anyOf(exactly('').at.lineStart(), '/').grouped()
const slashOrEnd = anyOf('/', exactly('').at.lineEnd())

export const pathRules: Array<{ re: RegExp; weight: number }> = [
  { re: createRegExp(startOrSlash, '.git', slashOrEnd, ['i']), weight: 10 },
  { re: createRegExp(startOrSlash, '.git/config', slashOrEnd, ['i']), weight: 10 },         
  { re: createRegExp(startOrSlash, '.env', maybe(anyOf('.local', '.example')), slashOrEnd, ['i']), weight: 10 },
  { re: createRegExp(startOrSlash, 'wp-admin', slashOrEnd, ['i']), weight: 8 },
  { re: createRegExp('/wp-json/wp/v2', slashOrEnd, ['i']), weight: 7 },
  { re: createRegExp('/', anyOf('jenkins', 'hudson').grouped(), slashOrEnd, ['i']), weight: 9 },            
  { re: createRegExp('/', anyOf('script', 'login').grouped(), '.groovy', slashOrEnd, ['i']), weight: 8 },
  { re: createRegExp('/actuator/', anyOf('env', 'health', 'metrics'), slashOrEnd, ['i']), weight: 8 },
  { re: createRegExp('/web.config', slashOrEnd, ['i']), weight: 7 },
  { re: createRegExp('/.DS_Store', slashOrEnd, ['i']), weight: 4 },
  { re: createRegExp('/latest/meta-data/iam', slashOrEnd, ['i']), weight: 10 },           
  { re: createRegExp(startOrSlash, '.aws/credentials', slashOrEnd, ['i']), weight: 10 },           
  { re: createRegExp('/Dockerfile', slashOrEnd, ['i']), weight: 7 },            
  { re: createRegExp('/composer.lock', slashOrEnd, ['i']), weight: 7 },            
  { re: createRegExp('/jnlpJars/jenkins-cli.jar', slashOrEnd, ['i']), weight: 9 },            
  { re: createRegExp('/manager/html', slashOrEnd, ['i']), weight: 10 },
  { re: createRegExp('/shell', maybe('.php'), slashOrEnd, ['i']), weight: 10 },           
  { re: createRegExp('/', anyOf('grafana', 'kibana', 'prometheus').grouped(), slashOrEnd, ['i']), weight: 7 },           
  { re: createRegExp('/', anyOf('owa', 'ecp').grouped(), slashOrEnd, ['i']), weight: 8 },        
  { re: createRegExp('wp-login.php', slashOrEnd, ['i']), weight: 8 },            
  { re: createRegExp('/swagger-ui', anyOf('/', '.html'), slashOrEnd, ['i']), weight: 6 },            
  { re: createRegExp('/v2/api-docs', slashOrEnd, ['i']), weight: 5 },            
  { re: createRegExp('/api-docs', anyOf('/', '.json'), slashOrEnd, ['i']), weight: 5 },            
  { re: createRegExp('phpmyadmin', slashOrEnd, ['i']), weight: 8 },
  { re: createRegExp(startOrSlash, '.well-known', slashOrEnd, ['i']), weight: 5 },
  { re: createRegExp(startOrSlash, '.htaccess', slashOrEnd, ['i']), weight: 7 },
  { re: createRegExp('composer.json', slashOrEnd, ['i']), weight: 7 },            
  { re: createRegExp('docker-compose.y', maybe('a'), 'ml', slashOrEnd, ['i']), weight: 7 },            
  { re: createRegExp('.', anyOf('sql', 'bak', 'old', 'save', 'log', 'ini', 'conf', 'zip', exactly('tar', maybe('.gz'))), slashOrEnd, ['i']), weight: 7 },
  { re: createRegExp(anyOf('..', '%2e%2e').grouped(), anyOf('/', '\\'), ['i']), weight: 5 },
  { re: createRegExp(anyOf('package-lock.json', 'yarn.lock', '.gitignore').grouped(), slashOrEnd, ['i']), weight: 6 },   
  { re: createRegExp(startOrSlash, 'admin', slashOrEnd, ['i']), weight: 6 },
  { re: createRegExp('phpinfo', maybe('.php'), slashOrEnd, ['i']), weight: 8 },            
  { re: createRegExp(startOrSlash, '.ssh', slashOrEnd, ['i']), weight: 8 },
  { re: createRegExp(exactly('').at.lineStart(), '/xmlrpc.php', slashOrEnd, ['i']), weight: 8 },            
  { re: createRegExp(startOrSlash, 'wp-config.php', slashOrEnd, ['i']), weight: 10 },           
  { re: createRegExp(startOrSlash, anyOf('install', 'setup').grouped(), maybe('.php'), slashOrEnd, ['i']), weight: 8 },            
  { re: createRegExp(startOrSlash, 'backup', maybe('s'), anyOf('.zip', '.tar.gz', '.sql'), slashOrEnd, ['i']), weight: 8 },   
  { re: createRegExp(startOrSlash, '.gitlab-ci.yml', slashOrEnd, ['i']), weight: 8 },            
  { re: createRegExp(startOrSlash, '.svn', slashOrEnd, ['i']), weight: 6 },
  { re: createRegExp(startOrSlash, '.hg', slashOrEnd, ['i']), weight: 6 },
  { re: createRegExp(startOrSlash, 'CVS', slashOrEnd, ['i']), weight: 6 },
  { re: createRegExp(startOrSlash, '.vscode', slashOrEnd, ['i']), weight: 4 },
  { re: createRegExp(startOrSlash, '.htpasswd', slashOrEnd, ['i']), weight: 8 },            
  { re: createRegExp('phpunit', maybe('.phar'), slashOrEnd, ['i']), weight: 9 },            
  { re: createRegExp(startOrSlash, 'config', maybe('uration'), '.', anyOf('php', 'yml', 'json', 'xml', 'ini', 'conf', 'cfg'), slashOrEnd, ['i']), weight: 7 },
];

export const whiteList: RegExp[] = [
  createRegExp(
    exactly('').at.lineStart(), 
    maybe('/'), 
    exactly('').at.lineEnd()
  ),

  createRegExp(
    exactly('').at.lineStart(),
    '/',
    anyOf('css', 'js', 'images', 'assets', 'static').grouped(),
    '/',
    ['i']
  ),

  createRegExp(
    '.',
    anyOf(
      'html',
      'css',
      'js',
      'png',
      exactly('jp', maybe('e'), 'g'),
      'svg',
      'map',
      exactly('woff', maybe('2')),
      'ttf',
      'webp'
    ),
    exactly('').at.lineEnd(),
    ['i']
  ),

  createRegExp(
    exactly('').at.lineStart(),
    '/robots.txt',
    exactly('').at.lineEnd(),
    ['i']
  ),

  createRegExp(
    exactly('').at.lineStart(),
    '/sitemap.xml',
    exactly('').at.lineEnd(),
    ['i']
  ),
];