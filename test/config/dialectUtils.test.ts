import { excluded, insertIgnore, isMySQL, isSQLite, now, onConflictDoNothing, onUpsert, placeholders, prep } from "@db/dialectUtils.js";
import { Database } from "db0";
import { describe, expect, it } from "vitest";

describe('dialectUtils (unit)', () => {
  function mockDB(dialect: string) {
    let capturedSql = '';
    const db = {
      dialect,
      prepare: (sql: string) => { capturedSql = sql; return null as any; },
    } as unknown as Database;
    return { db, sql: () => capturedSql };
  }


  describe('prep()', () => {
    it('passes sql unchanged for mysql', () => {
      const { db, sql } = mockDB('mysql');
      prep(db, 'SELECT * FROM t WHERE a = ? AND b = ?');
      expect(sql()).toBe('SELECT * FROM t WHERE a = ? AND b = ?');
    });

    it('passes sql unchanged for sqlite', () => {
      const { db, sql } = mockDB('sqlite');
      prep(db, 'SELECT * FROM t WHERE id = ?');
      expect(sql()).toBe('SELECT * FROM t WHERE id = ?');
    });

    it('converts ? to $n for postgresql', () => {
      const { db, sql } = mockDB('postgresql');
      prep(db, 'SELECT * FROM t WHERE a = ? AND b = ? AND c = ?');
      expect(sql()).toBe('SELECT * FROM t WHERE a = $1 AND b = $2 AND c = $3');
    });

    it('handles single ? for postgresql', () => {
      const { db, sql } = mockDB('postgresql');
      prep(db, 'SELECT * FROM t WHERE id = ?');
      expect(sql()).toBe('SELECT * FROM t WHERE id = $1');
    });

    it('leaves SQL with no params unchanged for postgresql', () => {
      const { db, sql } = mockDB('postgresql');
      prep(db, 'SELECT * FROM t');
      expect(sql()).toBe('SELECT * FROM t');
    });
  });


  describe('now()', () => {
    it('returns NOW() for mysql', () => {
      expect(now({ dialect: 'mysql' } as Database)).toBe('NOW()');
    });

    it('returns NOW() for postgresql', () => {
      expect(now({ dialect: 'postgresql' } as Database)).toBe('NOW()');
    });

    it("returns datetime('now') for sqlite", () => {
      expect(now({ dialect: 'sqlite' } as Database)).toBe("datetime('now')");
    });
  });


  describe('onUpsert()', () => {
    it('mysql, ON DUPLICATE KEY UPDATE', () => {
      expect(onUpsert({ dialect: 'mysql' } as Database, 'id')).toBe('ON DUPLICATE KEY UPDATE');
    });

    it('sqlite, ON CONFLICT(pk) DO UPDATE SET', () => {
      expect(onUpsert({ dialect: 'sqlite' } as Database, 'canary_id')).toBe('ON CONFLICT(canary_id) DO UPDATE SET');
    });

    it('postgresql, ON CONFLICT(pk) DO UPDATE SET', () => {
      expect(onUpsert({ dialect: 'postgresql' } as Database, 'canary_id')).toBe('ON CONFLICT(canary_id) DO UPDATE SET');
    });
  });


  describe('excluded()', () => {
    it('mysql, VALUES(col)', () => {
      expect(excluded({ dialect: 'mysql' } as Database, 'ip_address')).toBe('VALUES(ip_address)');
    });

    it('sqlite, excluded.col', () => {
      expect(excluded({ dialect: 'sqlite' } as Database, 'ip_address')).toBe('excluded.ip_address');
    });

    it('postgresql, excluded.col', () => {
      expect(excluded({ dialect: 'postgresql' } as Database, 'ip_address')).toBe('excluded.ip_address');
    });
  });

  describe('insertIgnore()', () => {
    it('mysql, INSERT IGNORE INTO', () => {
      expect(insertIgnore({ dialect: 'mysql' } as Database)).toBe('INSERT IGNORE INTO');
    });

    it('sqlite, INSERT OR IGNORE INTO', () => {
      expect(insertIgnore({ dialect: 'sqlite' } as Database)).toBe('INSERT OR IGNORE INTO');
    });

    it('postgresql, INSERT INTO', () => {
      expect(insertIgnore({ dialect: 'postgresql' } as Database)).toBe('INSERT INTO');
    });
  });

  describe('onConflictDoNothing()', () => {
    it('mysql, empty string', () => {
      expect(onConflictDoNothing({ dialect: 'mysql' } as Database)).toBe('');
    });

    it('sqlite, empty string', () => {
      expect(onConflictDoNothing({ dialect: 'sqlite' } as Database)).toBe('');
    });

    it('postgresql, ON CONFLICT DO NOTHING', () => {
      expect(onConflictDoNothing({ dialect: 'postgresql' } as Database)).toBe('ON CONFLICT DO NOTHING');
    });
  });


  describe('placeholders()', () => {
    it('mysql: n=3, ?, ?, ?', () => {
      expect(placeholders({ dialect: 'mysql' } as Database, 3)).toBe('?, ?, ?');
    });

    it('sqlite: n=1, ?', () => {
      expect(placeholders({ dialect: 'sqlite' } as Database, 1)).toBe('?');
    });

    it('postgresql: n=3 no offset, $1, $2, $3', () => {
      expect(placeholders({ dialect: 'postgresql' } as Database, 3)).toBe('$1, $2, $3');
    });

    it('postgresql: n=3 offset=3, $4, $5, $6', () => {
      expect(placeholders({ dialect: 'postgresql' } as Database, 3, 3)).toBe('$4, $5, $6');
    });
  });

  describe('isMySQL() / isSQLite()', () => {
    it('isMySQL: mysql=true, sqlite=false, postgresql=false', () => {
      expect(isMySQL({ dialect: 'mysql' } as Database)).toBe(true);
      expect(isMySQL({ dialect: 'sqlite' } as Database)).toBe(false);
      expect(isMySQL({ dialect: 'postgresql' } as Database)).toBe(false);
    });

    it('isSQLite: sqlite=true, mysql=false, postgresql=false', () => {
      expect(isSQLite({ dialect: 'sqlite' } as Database)).toBe(true);
      expect(isSQLite({ dialect: 'mysql' } as Database)).toBe(false);
      expect(isSQLite({ dialect: 'postgresql' } as Database)).toBe(false);
    });
  });
});