import mysql from 'mysql2/promise';
import type { Connector, Primitive } from "db0";
import { BoundableStatement } from 'db0/connectors/_internal/statement';

export type ConnectorOptions = mysql.PoolOptions;

type InternalQuery = (
  sql: string,
  params?: unknown[],
) => Promise<mysql.QueryResult>;

export default function mysqlPoolConnector(opts: ConnectorOptions): Connector<mysql.Pool> {
  let _pool: mysql.Pool | undefined;

    const getPool = () => {
        if (_pool) {
        return _pool;
        }

        _pool = mysql.createPool({
        ...opts,
        });

        return _pool;
    };

const query: InternalQuery = async (sql, params) => {
    const p = getPool();
    const res = await p.query(sql, params);
    return res[0];
};

  return {
    name: "mysql-pool",
    dialect: "mysql",
    getInstance: () => getPool(),
    exec: (sql) => query(sql),
    prepare: (sql) => new StatementWrapper(sql, query),
    dispose: async () => {
      await _pool?.end();
      _pool = undefined;
    },
  };
}

class StatementWrapper extends BoundableStatement<void> {
  #query: InternalQuery;
  #sql: string;

  constructor(sql: string, query: InternalQuery) {
    super();
    this.#sql = sql;
    this.#query = query;
  }

  async all(...params: Primitive[]) {
    const res = (await this.#query(this.#sql, params)) as mysql.RowDataPacket[];
    return res;
  }

  async run(...params: Primitive[]) {
    await this.#query(this.#sql, params);
    return { success: true };
  }

  async get(...params: Primitive[]) {
    const res = (await this.#query(this.#sql, params)) as mysql.RowDataPacket[];
    return res[0];
  }
}