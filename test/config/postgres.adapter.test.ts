import { excluded, insertIgnore, isMySQL, isSQLite, now, onConflictDoNothing, onUpsert, placeholders, prep } from "@db/dialectUtils.js";
import { createTables } from "@db/schema.js";
import { run } from "@riavzon/utils/server";
import { randomUUID } from "crypto";
import { Database } from "db0";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { initDb } from "~~/src/botDetector/config/dbAdapter.js";
import { DbConfig } from "~~/src/botDetector/types/dbTypes.js";


const PG_CONFIG: DbConfig = {
  driver: 'postgresql',
  host: 'localhost',
  port: 5433,
  user: 'botdetector',
  password: 'test',
  database: 'testdb',
};

describe('PostgreSQL adapter', () => {
  let db: Database;

  beforeAll(async () => {
    await run('docker compose -f docker-compose.test.yml up -d postgres-test --wait');

    for (let attempt = 1; attempt <= 30; attempt++) {
      try {
        db = await initDb(PG_CONFIG);
        await db.exec('CREATE EXTENSION IF NOT EXISTS pgcrypto').catch(() => {});
        await createTables(db);
        break;
      } catch (err) {
        if (attempt === 5) throw err;
        await new Promise(r => setTimeout(r, 5000));
      }
    }
  }, 120_000);

  afterAll(async () => {
    await db.exec('DROP TABLE IF EXISTS banned CASCADE');
    await db.exec('DROP TABLE IF EXISTS visitors CASCADE');
    await db.exec('DROP TABLE IF EXISTS user_agent_metadata CASCADE');
    await (db as any).dispose?.();
  });

  it('dialect is postgresql', () => {
    expect(db.dialect).toBe('postgresql');
  });

  it('isMySQL()=false, isSQLite()=false', () => {
    expect(isMySQL(db)).toBe(false);
    expect(isSQLite(db)).toBe(false);
  });

  it('getInstance() returns a usable pg.Client', async () => {
    const client = await db.getInstance() as any;
    expect(typeof client.query).toBe('function');
    const result = await client.query('SELECT 1 AS n');
    expect(result.rows[0].n).toBe(1);
  });

  it('createTables() created visitors, banned, user_agent_metadata', async () => {
    for (const table of ['visitors', 'banned', 'user_agent_metadata']) {
      const rows = await db.prepare(`SELECT 1 AS ok FROM ${table} LIMIT 0`).all() as any[];
      expect(Array.isArray(rows)).toBe(true);
    }
  });

  it('user_agent_metadata was seeded with UA rows from CSV', async () => {
    const row = await db.prepare('SELECT COUNT(*) AS n FROM user_agent_metadata').get() as any;
    expect(Number(row.n)).toBeGreaterThan(0);
  });

  it('INSERT and SELECT', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address, country, request_count) VALUES (?, ?, ?, ?, ?)')
      .run(canaryId, visitorId, '10.0.0.2', 'DE', 5);

    const row = await prep(db, 'SELECT canary_id, visitor_id, ip_address, country, request_count FROM visitors WHERE canary_id = ? LIMIT 1')
      .get(canaryId) as any;

    expect(row.canary_id).toBe(canaryId);
    expect(row.visitor_id).toBe(visitorId);
    expect(row.ip_address).toBe('10.0.0.2');
    expect(row.country).toBe('DE');
    expect(Number(row.request_count)).toBe(5);
  });

  it('prep() translates ? to $n correctly', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address, request_count) VALUES (?, ?, ?, ?)')
      .run(canaryId, visitorId, '5.5.5.5', 42);

    const row = await prep(db, 'SELECT ip_address, request_count FROM visitors WHERE canary_id = ?')
      .get(canaryId) as any;

    expect(row.ip_address).toBe('5.5.5.5');
    expect(Number(row.request_count)).toBe(42);
  });

  it('UPDATE', async () => {
    const canaryId = randomUUID();
    await prep(db, 'INSERT INTO visitors (canary_id, visitor_id, ip_address, request_count) VALUES (?, ?, ?, ?)').run(canaryId, randomUUID(), '3.3.3.3', 1);

    await prep(db, 'UPDATE visitors SET request_count = ? WHERE canary_id = ?').run(9, canaryId);

    const row = await prep(db, 'SELECT ip_address, request_count FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(row.request_count)).toBe(9);
    expect(row.ip_address).toBe('3.3.3.3');
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

  it('upsert updates conflicting row, new value written, exactly one row remains', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    const sql = `
      INSERT INTO visitors (canary_id, visitor_id, ip_address)
      VALUES (?, ?, ?)
      ${onUpsert(db, 'canary_id')}
      ip_address = ${excluded(db, 'ip_address')}
    `;
    await prep(db, sql).run(canaryId, visitorId, '4.4.4.4');
    await prep(db, sql).run(canaryId, visitorId, '5.5.5.5');

    const row = await prep(db, 'SELECT ip_address FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.ip_address).toBe('5.5.5.5');

    const count = await prep(db, 'SELECT COUNT(*) AS n FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(count.n)).toBe(1);
  });

  it('INSERT INTO .. ON CONFLICT DO NOTHING', async () => {
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    const insert = `${insertIgnore(db)} visitors (canary_id, visitor_id, ip_address) VALUES (?, ?, ?) ${onConflictDoNothing(db)}`;
    await prep(db, insert).run(canaryId, visitorId, '6.6.6.6');
    await prep(db, insert).run(canaryId, visitorId, '7.7.7.7');

    const row = await prep(db, 'SELECT ip_address FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.ip_address).toBe('6.6.6.6');

    const count = await prep(db, 'SELECT COUNT(*) AS n FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(Number(count.n)).toBe(1);
  });

  it('visitor_id column defaults to a valid uuid when omitted', async () => {
    const canaryId = randomUUID();
    await db.prepare('INSERT INTO visitors (canary_id) VALUES ($1)').run(canaryId);

    const row = await prep(db, 'SELECT visitor_id FROM visitors WHERE canary_id = ?').get(canaryId) as any;
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
    const canaryId = randomUUID();
    const visitorId = randomUUID();
    const result = await prep(db, 'INSERT INTO visitors (canary_id, visitor_id) VALUES (?, ?)').run(canaryId, visitorId);
    expect(result.success).toBe(true);

    const row = await prep(db, 'SELECT canary_id, visitor_id FROM visitors WHERE canary_id = ?').get(canaryId) as any;
    expect(row.canary_id).toBe(canaryId);
    expect(row.visitor_id).toBe(visitorId);
  });

  it('placeholders() generates $n series', () => {
    expect(placeholders(db, 3)).toBe('$1, $2, $3');
    expect(placeholders(db, 2, 3)).toBe('$4, $5');
  });

  it('banned table enforces FK', async () => {
    const orphan = randomUUID();
    await expect(
      prep(db, 'INSERT INTO banned (canary_id, ip_address) VALUES (?, ?)').run(orphan, '9.9.9.9')
    ).rejects.toThrow();
  });
});