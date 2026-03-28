#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-unsafe-assignment */

import consola from 'consola';
import { defineCommand, runMain } from 'citty';
import fs from 'node:fs/promises';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { content, defaultStore } from './default.js';

function run(cmd: string, args: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
        const child = spawn(cmd, args, { stdio: 'inherit', shell: true });
        child.on('close', code => {
            if (code === 0) { resolve(); } else { reject(new Error(`${cmd} exited with code ${String(code)}`)); }
        });
    });
}

export const start = defineCommand({
    meta: {
        name: 'Create Bot Detector',
        description: 'Quick starter for @riavzon/bot-detector'
    },

    async run() {
        const output = path.resolve(process.cwd(), 'botDetectorConfig.ts');

        consola.start('Installing dependencies...');
        await run('npm', ['install', 'express', 'cookie-parser', 'better-sqlite3']);

        consola.start('Installing @riavzon/bot-detector and data sources...');
        await run('npm', ['install', '@riavzon/bot-detector']);

        
        consola.start('Writing botDetectorConfig.ts...');
        await fs.writeFile(output, content, 'utf-8');
        consola.success('botDetectorConfig.ts created');

        consola.start('Creating database tables...');
        const pkgMain = path.resolve(process.cwd(), 'node_modules/@riavzon/bot-detector/dist/main.mjs');
        const { defineConfiguration, createTables, getDb } = await import(pkgMain);
        
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await defineConfiguration({ store: defaultStore });
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        await createTables(getDb());

        consola.success('Setup complete. Import botDetectorConfig.ts at the top of your app entry point and mount the middleware.');
        consola.log('');
        consola.log('Keep data sources fresh (run daily or via cron):');
        consola.log('  npx @riavzon/bot-detector refresh');
    }
});
await runMain(start);