import { type Connector, createDatabase, type Database } from 'db0';
import type { DbConfig } from '../types/dbTypes.js';


export async function initDb(config: DbConfig): Promise<Database> {
    const { driver, ...opts } = config;
    let mod: { default: (opts?: any) => Connector };

    switch (driver) {
        case 'mysql-pool':
            mod = await import('./mysqlPoolConnector.js');
            break;
        case 'postgresql':
            mod = await import('db0/connectors/postgresql');
            break;
        case 'sqlite':
            mod = await import('db0/connectors/better-sqlite3');
            break;
        case 'cloudflare-d1':
            mod = await import('db0/connectors/cloudflare-d1');
            break;
        case 'planetscale':
            mod = await import('db0/connectors/planetscale');
            break;
        default:
            throw new Error(`Unsupported database driver: ${driver}`);
    }

    return createDatabase(mod.default(opts));
}
