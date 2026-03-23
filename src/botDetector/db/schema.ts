import type { Database } from 'db0';
import { uploadCsv } from '@riavzon/utils/server';
import { isMySQL, isSQLite } from './dialectUtils.js';
import type { Pool } from 'mysql2/promise';
import type { Pool as PgPool } from 'pg';
import { resolveDataPath } from './findDataPath.js';

function visitorIdDefault(db: Database): string {
    if (isMySQL(db)) return 'NOT NULL DEFAULT (UUID())';
    if (db.dialect === 'postgresql') return 'NOT NULL DEFAULT gen_random_uuid()';
    return 'NOT NULL';
}

function lastSeenDef(db: Database): string {
    if (isMySQL(db)) return 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP';
    if (isSQLite(db)) return 'TEXT DEFAULT CURRENT_TIMESTAMP';
    return 'TIMESTAMP DEFAULT CURRENT_TIMESTAMP';
}

function tableOptions(db: Database): string {
    return isMySQL(db) ? 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci' : '';
}

function timestampType(db: Database): string {
    return isSQLite(db) ? 'TEXT' : 'TIMESTAMP';
}

export async function createTables(db: Database): Promise<void> {
    const visitorId = visitorIdDefault(db);
    const lastSeen = lastSeenDef(db);
    const tblOpts = tableOptions(db);
    const tsType = timestampType(db);

    const createVisitorsTable = `
        CREATE TABLE IF NOT EXISTS visitors (
            visitor_id CHAR(36) ${visitorId},
            canary_id VARCHAR(64) PRIMARY KEY,
            ip_address VARCHAR(45),
            user_agent TEXT,
            country VARCHAR(64),
            region VARCHAR(64),
            region_name VARCHAR(350),
            city VARCHAR(64),
            district VARCHAR(260),
            lat VARCHAR(150),
            lon VARCHAR(150),
            timezone VARCHAR(64),
            currency VARCHAR(64),
            isp VARCHAR(64),
            org VARCHAR(64),
            as_org VARCHAR(64),
            device_type VARCHAR(64),
            browser VARCHAR(64),
            proxy BOOLEAN,
            hosting BOOLEAN,
            is_bot BOOLEAN DEFAULT false,
            first_seen ${tsType} DEFAULT CURRENT_TIMESTAMP,
            last_seen ${lastSeen},
            request_count INT DEFAULT 1,
            deviceVendor VARCHAR(64) DEFAULT 'unknown',
            deviceModel VARCHAR(64) DEFAULT 'unknown',
            browserType VARCHAR(64) DEFAULT 'unknown',
            browserVersion VARCHAR(64) DEFAULT 'unknown',
            os VARCHAR(64) DEFAULT 'unknown',
            suspicious_activity_score INT DEFAULT 0
        ) ${tblOpts}
    `;

    const userAgentMetadataSQL = `
        CREATE TABLE IF NOT EXISTS user_agent_metadata (
            http_user_agent VARCHAR(255) NOT NULL,
            metadata_description TEXT,
            metadata_tool VARCHAR(255) DEFAULT NULL,
            metadata_category VARCHAR(255) DEFAULT NULL,
            metadata_link TEXT,
            metadata_priority VARCHAR(1000) DEFAULT NULL,
            metadata_fp_risk VARCHAR(50) DEFAULT NULL,
            metadata_severity VARCHAR(50) DEFAULT NULL,
            metadata_usage VARCHAR(255) DEFAULT NULL,
            metadata_flow_from_external VARCHAR(1000) DEFAULT NULL,
            metadata_flow_from_internal VARCHAR(1000) DEFAULT NULL,
            metadata_flow_to_internal VARCHAR(1000) DEFAULT NULL,
            metadata_flow_to_external VARCHAR(1000) DEFAULT NULL,
            metadata_for_successful_external_login_events VARCHAR(1000) DEFAULT NULL,
            metadata_comment TEXT,
            PRIMARY KEY (http_user_agent)
        ) ${tblOpts}
    `;

    const createBannedTable = `
        CREATE TABLE IF NOT EXISTS banned (
            canary_id VARCHAR(64) PRIMARY KEY,
            ip_address VARCHAR(45),
            country VARCHAR(64),
            user_agent TEXT,
            reason TEXT,
            score INT DEFAULT NULL,
            FOREIGN KEY (canary_id) REFERENCES visitors(canary_id)
        )
    `;

    try {
        await db.exec(createVisitorsTable);
        await db.exec(createBannedTable);
        await db.exec(userAgentMetadataSQL);
        
        const csvPath = resolveDataPath('useragent.csv');
        if (isMySQL(db)) {
            const pool = await db.getInstance() as Pool;
            const up = await uploadCsv(csvPath, 'user_agent_metadata', pool, 'mysql');
            if (!up.ok) throw new Error(up.reason);

        } else if (db.dialect === 'postgresql') {
            const client = await db.getInstance() as PgPool;
            const pool = {
                // eslint-disable-next-line @typescript-eslint/require-await
                connect: async () => ({
                    query: (sql: string, params?: unknown[]) => client.query(sql, params),
                    release: () => { /* empty */ },
                }),
            };
            const up = await uploadCsv(csvPath, 'user_agent_metadata', pool as PgPool, 'pg');
            if (!up.ok) throw new Error(up.reason);
        }

        console.log('Tables created successfully.');
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}