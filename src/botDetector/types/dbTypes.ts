import postgresql from "db0/connectors/postgresql";
import type betterSqlite3Connector from "db0/connectors/better-sqlite3";
import type cloudflareD1Connector from "db0/connectors/cloudflare-d1";
import planetscale from "db0/connectors/planetscale";
import type mysql from "mysql2/promise";

type Opts<T extends (opts?: any) => any> = NonNullable<Parameters<T>[0]>;

export type SupportedDbDrivers = {
 'mysql-pool':  mysql.PoolOptions;
  postgresql: Opts<typeof postgresql>;
  sqlite: Opts<typeof betterSqlite3Connector>;
  'cloudflare-d1': Opts<typeof cloudflareD1Connector>;
  planetscale: Opts<typeof planetscale>
};

export type DbConfig = {
    [K in keyof SupportedDbDrivers]: { driver: K } & SupportedDbDrivers[K]
}[keyof SupportedDbDrivers];