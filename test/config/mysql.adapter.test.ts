import { describe, it, expect, beforeAll, afterEach } from 'vitest';
import { randomUUID } from 'node:crypto';
import { createTables } from '~~/src/botDetector/db/schema.js';
import {
  prep, now, onUpsert, excluded,
  insertIgnore,
  placeholders, isMySQL, isSQLite,
} from '~~/src/botDetector/db/dialectUtils.js';
import type { Database } from 'db0';
import { getDb } from '~~/src/botDetector/config/config.js';


describe('MySQL adapter', () => {
  let db: Database;

  beforeAll(() => {
    db = getDb();
  });

  afterEach(async () => {
    await prep(db, "DELETE FROM banned WHERE canary_id LIKE 'dbadapter-test-%'").run();
    await prep(db, "DELETE FROM visitors WHERE canary_id LIKE 'dbadapter-test-%'").run();
  });

  it('dialect is mysql', () => {
    expect(db.dialect).toBe('mysql');
  });

  it('isMySQL()=true, isSQLite()=false', () => {
    expect(isMySQL(db)).toBe(true);
    expect(isSQLite(db)).toBe(false);
  });

  it('getInstance() returns a usable mysql2 Pool', async () => {
    const pool = await db.getInstance() as any;
    expect(typeof pool.getConnection).toBe('function');
    const [rows] = await pool.query('SELECT 1 AS n');
    expect(rows[0].n).toBe(1);
  });

  it('createTables() is idempotent', async () => {
    await expect(createTables(db)).resolves.not.toThrow();
  });

  it('user_agent_metadata was seeded with UA rows from CSV', async () => {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM user_agent_metadata').get() as any;
    expect(Number(row.n)).toBeGreaterThan(0);
  });

  it('INSERT and SELECT', async () => {
    const canaryId = `dbadapter-test-${randomUUID()}`;
    const visitorId = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address, country, request_count) VALUES (?, ?, ?, ?, ?)')
      .run(canaryId, visitorId, '10.0.0.3', 'FR', 2);

    const row = await prep(db, 'SELECT canary_id, visitor_id, ip_address, country, request_count FROM visitors WHERE canary_id = ? LIMIT 1')
      .get(canaryId) as any;

    expect(row.canary_id).toBe(canaryId);
    expect(row.visitor_id).toBe(visitorId);
    expect(row.ip_address).toBe('10.0.0.3');
    expect(row.country).toBe('FR');
    expect(Number(row.request_count)).toBe(2);
  });

  it('UPDATE', async () => {
    const canaryId = `dbadapter-test-${randomUUID()}`;
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address, request_count) VALUES (?, ?, ?, ?)').run(canaryId, randomUUID(), '7.7.7.7', 1);

    await prep(db, 'UPDATE visitors SET request_count = ? WHERE canary_id = ?').run(11, canaryId);

    const row = await prep(db, 'SELECT ip_address, request_count FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(row.request_count)).toBe(11);
    expect(row.ip_address).toBe('7.7.7.7');
  });

  it('DELETE removes the row — get() returns undefined afterwards', async () => {
    const canaryId = `dbadapter-test-${randomUUID()}`;
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(canaryId, randomUUID());

    const before = await prep(db, 'SELECT canary_id FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(before.canary_id).toBe(canaryId);

    await prep(db, 'DELETE FROM visitors WHERE canary_id = ?').run(canaryId);

    const after = await prep(db, 'SELECT canary_id FROM visitors WHERE canary_id = ?').get(canaryId);
    expect(after).toBeUndefined();
  });

  it('upsert updates conflicting row — new value written, exactly one row remains', async () => {
    const canaryId = `dbadapter-test-${randomUUID()}`;
    const visitorId = randomUUID();
    const sql = `
      INSERT INTO visitors (canary_id, visitor_id, ip_address)
      VALUES (?, ?, ?)
      ${onUpsert(db, 'canary_id')}
      ip_address = ${excluded(db, 'ip_address')}
    `;
    await prep(db, sql).run(canaryId, visitorId, '8.8.8.8');
    await prep(db, sql).run(canaryId, visitorId, '9.9.9.9');

    const row = await prep(db, 'SELECT ip_address FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.ip_address).toBe('9.9.9.9');

    const count = await prep(db, 'SELECT COUNT(*) AS n FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(count.n)).toBe(1);
  });

  it('INSERT IGNORE skips duplicate — original preserved, exactly one row', async () => {
    const canaryId = `dbadapter-test-${randomUUID()}`;
    const visitorId = randomUUID();
    const insert = `${insertIgnore(db)} visitors (canary_id, visitor_id, ip_address) VALUES (?, ?, ?)`;
    await prep(db, insert).run(canaryId, visitorId, 'first');
    await prep(db, insert).run(canaryId, visitorId, 'second');

    const row = await prep(db, 'SELECT ip_address FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.ip_address).toBe('first');

    const count = await prep(db, 'SELECT COUNT(*) AS n FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(count.n)).toBe(1);
  });

  it('visitor_id column defaults to a valid UUID when omitted', async () => {
    const canaryId = `dbadapter-test-${randomUUID()}`;
    await prep(db, 'INSERT INTO visitors (canary_id) VALUES (?)').run(canaryId);

    const row = await prep(db, 'SELECT visitor_id FROM visitors WHERE canary_id = ? LIMIT 1').get(canaryId) as any;
    expect(row.visitor_id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('now() returns current timestamp as a Date within 5 seconds', async () => {
    const before = Date.now();
    const row = await db.prepare(`SELECT ${now(db)} AS ts`).get() as any;

    expect(row.ts).toBeInstanceOf(Date);
    expect(row.ts.getTime()).toBeGreaterThanOrEqual(before - 2000);
    expect(row.ts.getTime()).toBeLessThanOrEqual(Date.now() + 1000);
  });

  it('run() reports success:true and the inserted row is readable', async () => {
    const canaryId = `dbadapter-test-${randomUUID()}`;
    const visitorId = randomUUID();
    const result = await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address) VALUES (?, ?, ?)').run(canaryId, visitorId, '1.2.3.4');
    expect(result.success).toBe(true);

    const row = await prep(db, 'SELECT canary_id, visitor_id, ip_address FROM visitors WHERE canary_id = ? LIMIT 1').get(canaryId) as any;
    expect(row.canary_id).toBe(canaryId);
    expect(row.visitor_id).toBe(visitorId);
    expect(row.ip_address).toBe('1.2.3.4');
  });

  it('all() returns exactly the rows matching the query', async () => {
    const a = `dbadapter-test-${randomUUID()}`;
    const b = `dbadapter-test-${randomUUID()}`;
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(a, randomUUID());
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(b, randomUUID());

    const rows = await prep(db, 'SELECT canary_id FROM visitors WHERE canary_id IN (?, ?)').all(a, b) as any[];
    expect(rows).toHaveLength(2);
    const ids = rows.map((r: any) => r.canary_id);
    expect(ids).toContain(a);
    expect(ids).toContain(b);
  });

  it('placeholders() generates ? series for mysql', () => {
    expect(placeholders(db, 1)).toBe('?');
    expect(placeholders(db, 3)).toBe('?, ?, ?');
  });

  it('banned table enforces FK — insert without a matching visitor fails', async () => {
    const orphan = `dbadapter-test-${randomUUID()}`;
    await expect(
      prep(db, 'INSERT INTO banned (canary_id, ip_address) VALUES (?, ?)').run(orphan, '9.9.9.9')
    ).rejects.toThrow();
  });
});
