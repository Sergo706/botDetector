import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { randomUUID } from 'node:crypto';
import { initDb } from '~~/src/botDetector/config/dbAdapter.js';
import { createTables } from '~~/src/botDetector/db/schema.js';
import { prep, now, onUpsert, excluded, insertIgnore, placeholders, isMySQL, isSQLite } from '~~/src/botDetector/db/dialectUtils.js';
import type { Database } from 'db0';
import type { DbConfig } from '~~/src/botDetector/types/dbTypes.js';


const SQLITE_CONFIG: DbConfig = {
  driver: 'sqlite',
  name: ':memory:',
};

describe('SQLite adapter', () => {
  let db: Database;

  beforeAll(async () => {
    db = await initDb(SQLITE_CONFIG);
    await createTables(db);
  });

  afterAll(async () => {
    await (db as any).dispose?.();
  });

  it('dialect is sqlite', () => {
    expect(db.dialect).toBe('sqlite');
  });

  it('isMySQL()=false, isSQLite()=true', () => {
    expect(isMySQL(db)).toBe(false);
    expect(isSQLite(db)).toBe(true);
  });

  it('getInstance() returns a usable better-sqlite3 instance', async () => {
    const instance = await db.getInstance() as any;
    expect(typeof instance.prepare).toBe('function');
    const result = instance.prepare('SELECT 1 AS n').get();
    expect(result.n).toBe(1);
  });

  it('createTables() created visitors, banned, user_agent_metadata', async () => {
    for (const table of ['visitors', 'banned', 'user_agent_metadata']) {
      const rows = await db.prepare(`SELECT 1 AS ok FROM ${table} LIMIT 0`).all() as any[];
      expect(Array.isArray(rows)).toBe(true);
    }
  });

  it('INSERT and SELECT', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address, country, request_count) VALUES (?, ?, ?, ?, ?)')
      .run(canaryId, visitorId, '10.0.0.1', 'US', 3);

    const row = await prep(db, 'SELECT canary_id, visitor_id, ip_address, country, request_count FROM visitors WHERE canary_id = ? LIMIT 1')
      .get(canaryId) as any;

    expect(row.canary_id).toBe(canaryId);
    expect(row.visitor_id).toBe(visitorId);
    expect(row.ip_address).toBe('10.0.0.1');
    expect(row.country).toBe('US');
    expect(Number(row.request_count)).toBe(3);
  });

  it('UPDATE', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address, request_count) VALUES (?, ?, ?, ?)').run(canaryId, visitorId, '1.2.3.4', 1);

    await prep(db, 'UPDATE visitors SET request_count = ? WHERE canary_id = ?').run(7, canaryId);

    const row = await prep(db, 'SELECT ip_address, request_count FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(row.request_count)).toBe(7);
    expect(row.ip_address).toBe('1.2.3.4');
  });

  it('DELETE', async () => {
    const canaryId = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(canaryId, randomUUID());

    const before = await prep(db, 'SELECT canary_id FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(before.canary_id).toBe(canaryId);

    await prep(db, 'DELETE FROM visitors WHERE canary_id = ?').run(canaryId);

    const after = await prep(db, 'SELECT canary_id FROM visitors WHERE canary_id = ?').get(canaryId);
    expect(after).toBeUndefined();
  });

  it('upsert updates conflicting row,new value written, exactly one row remains', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    const sql = `
      INSERT INTO visitors (canary_id, visitor_id, ip_address)
      VALUES (?, ?, ?)
      ${onUpsert(db, 'canary_id')}
      ip_address = ${excluded(db, 'ip_address')}
    `;
    await prep(db, sql).run(canaryId, visitorId, '1.1.1.1');
    await prep(db, sql).run(canaryId, visitorId, '2.2.2.2');

    const row = await prep(db, 'SELECT ip_address FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.ip_address).toBe('2.2.2.2');

    const count = await prep(db, 'SELECT COUNT(*) AS n FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(count.n)).toBe(1);
  });

  it('INSERT OR IGNORE skips duplicate,original value preserved, exactly one row', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    const insert = `${insertIgnore(db)} visitors (canary_id, visitor_id, ip_address) VALUES (?, ?, ?)`;
    await prep(db, insert).run(canaryId, visitorId, 'first');
    await prep(db, insert).run(canaryId, visitorId, 'second');

    const row = await prep(db, 'SELECT ip_address FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.ip_address).toBe('first');

    const count = await prep(db, 'SELECT COUNT(*) AS n FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(count.n)).toBe(1);
  });

  it('now() returns current UTC timestamp as a string within 5 seconds', async () => {
    const before = Date.now();
    const row = await db.prepare(`SELECT ${now(db)} AS ts`).get() as any;

    expect(typeof row.ts).toBe('string');
    expect(row.ts).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);

    const ts = new Date(row.ts.replace(' ', 'T') + 'Z').getTime();
    expect(ts).toBeGreaterThanOrEqual(before - 2000);
    expect(ts).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('all() returns exactly the rows matching the query', async () => {
    const a = randomUUID();
    const b = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(a, randomUUID());
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(b, randomUUID());

    const rows = await prep(db, 'SELECT canary_id FROM visitors WHERE canary_id IN (?, ?)').all(a, b) as any[];
    expect(rows).toHaveLength(2);
    const ids = rows.map((r: any) => r.canary_id);
    expect(ids).toContain(a);
    expect(ids).toContain(b);
  });

  it('run() reports success:true and the inserted row is readable', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    const result = await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(canaryId, visitorId);
    expect(result.success).toBe(true);

    const row = await prep(db, 'SELECT canary_id, visitor_id FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.canary_id).toBe(canaryId);
    expect(row.visitor_id).toBe(visitorId);
  });

  it('placeholders() generates ? series for sqlite', () => {
    expect(placeholders(db, 1)).toBe('?');
    expect(placeholders(db, 3)).toBe('?, ?, ?');
  });
});

