import type { Database } from 'db0';

export function isMySQL(db: Database): boolean {
    return db.dialect === 'mysql';
}

export function isSQLite(db: Database): boolean {
    return db.dialect === 'sqlite';
}

/** Convert ? placeholders to $1, $2, for PostgreSQL. */
export function prep(db: Database, sql: string) {
    if (db.dialect !== 'postgresql') return db.prepare(sql);
    let i = 0;
    return db.prepare(sql.replace(/\?/g, () => `$${String(++i)}`));
}

/** Generate positional placeholders for a dynamic list of values. */
export function placeholders(db: Database, count: number, offset = 0): string {
    return Array.from({ length: count }, (_, i) =>
        db.dialect === 'postgresql' ? `$${String(offset + i + 1)}` : '?'
    ).join(', ');
}

/** NOW() equivalent per dialect. */
export function now(db: Database): string {
    return isSQLite(db) ? "datetime('now')" : 'NOW()';
}

/**
 * Upsert conflict clause.
 * MySQL: ON DUPLICATE KEY UPDATE
 * Others: ON CONFLICT(pk) DO UPDATE SET
 */
export function onUpsert(db: Database, pk: string): string {
    return isMySQL(db)
        ? 'ON DUPLICATE KEY UPDATE'
        : `ON CONFLICT(${pk}) DO UPDATE SET`;
}

/**
 * Reference to the incoming row value in an upsert SET clause.
 * MySQL: VALUES(col)
 * Others: excluded.col
 */
export function excluded(db: Database, col: string): string {
    return isMySQL(db) ? `VALUES(${col})` : `excluded.${col}`;
}

/**
 * INSERT IGNORE equivalent.
 * MySQL: INSERT IGNORE INTO
 * SQLite: INSERT OR IGNORE INTO
 * PostgreSQL: INSERT INTO  (use onConflictDoNothing() as trailing clause)
 */
export function insertIgnore(db: Database): string {
    if (isSQLite(db)) return 'INSERT OR IGNORE INTO';
    if (isMySQL(db))  return 'INSERT IGNORE INTO';
    return 'INSERT INTO';
}

/** Trailing ON CONFLICT DO NOTHING clause, for PostgreSQL. */
export function onConflictDoNothing(db: Database): string {
    return db.dialect === 'postgresql' ? 'ON CONFLICT DO NOTHING' : '';
}
