async function createTables(connection) {
    const createVisitorsTable = `
        CREATE TABLE IF NOT EXISTS visitors (
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
            suspicos_activity_score INT DEFAULT 0
        );
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
        console.log('Tables created successfully.');
    }
    catch (error) {
        console.error('Error creating tables:', error);
        throw error;
    }
}
export {};
