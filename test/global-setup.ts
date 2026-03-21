import { run } from '@sergo/utils/server';
import mysql2 from 'mysql2/promise';
import { createTables } from '../src/botDetector/db/schema.js';
import { mysqlOpts, defaultSettings } from './config.js';
import { configuration, getDb } from '~~/src/botDetector/config/config.js';

const MAX_RETRIES = 30;
const RETRY_INTERVAL = 5000;


async function waitForDatabase() {
    for (let i = 0; i < MAX_RETRIES; i++) {
        try {
            const connection = await mysql2.createConnection(mysqlOpts);
            await connection.end();
            return;
        } catch {
            console.log(`Waiting for database... (attempt ${i + 1}/${MAX_RETRIES})`);
            await new Promise(resolve => setTimeout(resolve, RETRY_INTERVAL));
        }
    }
    throw new Error('Database failed to start in time');
}

export async function setup() {
    console.log('Running global setup...');
    configuration(defaultSettings)
    try {
        await run('docker compose -f docker-compose.test.yml up -d mysql-test');
        await waitForDatabase();
        const db = getDb()
        await createTables(db);
    } catch (err) {
        console.error('Test setup failed:', err);
        throw err;
    }
}

export async function teardown() {
    await run('docker compose -f docker-compose.test.yml down -v');
}
