import {  Pool } from 'mysql2/promise';
import { uploadCsv } from '@sergo/utils/server';
import { join } from 'path';

export async function createTables(connection: Pool): Promise<void> {
    const createVisitorsTable = `
        CREATE TABLE IF NOT EXISTS visitors (
            visitor_id CHAR(36) NOT NULL,
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
            first_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            last_seen TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            request_count INT DEFAULT 1,
            deviceVendor VARCHAR(64) DEFAULT 'unknown',
            deviceModel VARCHAR(64) DEFAULT 'unknown',
            browserType VARCHAR(64) DEFAULT 'unknown',
            browserVersion VARCHAR(64) DEFAULT 'unknown',
            os VARCHAR(64) DEFAULT 'unknown',
            suspicious_activity_score INT DEFAULT 0
        );
        `;

const userAgentMetadataSQL = `
    CREATE TABLE IF NOT EXISTS user_agent_metadata (
      http_user_agent varchar(255) NOT NULL,
      metadata_description text,
      metadata_tool varchar(255) DEFAULT NULL,
      metadata_category varchar(255) DEFAULT NULL,
      metadata_link text,
      metadata_priority varchar(1000) DEFAULT NULL,
      metadata_fp_risk varchar(50) DEFAULT NULL,
      metadata_severity varchar(50) DEFAULT NULL,
      metadata_usage varchar(255) DEFAULT NULL,
      metadata_flow_from_external varchar(1000) DEFAULT NULL,
      metadata_flow_from_internal varchar(1000) DEFAULT NULL,
      metadata_flow_to_internal varchar(1000) DEFAULT NULL,
      metadata_flow_to_external varchar(1000) DEFAULT NULL,
      metadata_for_successful_external_login_events varchar(1000) DEFAULT NULL,
      metadata_comment text,
      PRIMARY KEY (http_user_agent)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
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
        );
    `;

    try {
        await connection.execute(createVisitorsTable);
        await connection.execute(createBannedTable);
        await connection.execute(userAgentMetadataSQL);
        const csvPath = join(import.meta.dirname, 'useragent.csv');

        const up = await uploadCsv(csvPath, 'user_agent_metadata', connection)
        if (!up.ok) {
            throw new Error(up.reason);
        }
        
        console.log('Tables created successfully.');
        return;
    } catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}