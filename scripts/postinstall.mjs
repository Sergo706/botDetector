import { existsSync } from 'fs';
import { execSync } from 'child_process';

if (existsSync('./dist/index.mjs')) {
    execSync('node ./dist/index.mjs init', { stdio: 'inherit' });
}
