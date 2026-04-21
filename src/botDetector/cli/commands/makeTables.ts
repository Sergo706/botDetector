import { defineCommand } from "citty";
import consola from "consola";
import { createTables } from "@db/schema.js";
import { getDb } from "../../config/config.js";
import { DbConfig } from "../../types/dbTypes.js";
import { defineConfiguration } from "~~/src/main.js";

export const makeTables = defineCommand({
    meta: {
        name: 'load-schema',
        description: 'Create database tables',
    },
    args: {
    db: { 
        type: 'enum', 
        description: 'The data base driver to use',
        required: false,
        default: "sqlite",
    },
    "db-name": { type: 'string', description: 'The database name', required: false },
    "db-host": { type: 'string', description: 'The database host', required: false },
    "db-user": { type: 'string', description: 'The database user', required: false },
    "db-password": { type: 'string', description: 'The database password', required: false },
    "db-url": { type: 'string', description: 'The database URL (for planetscale)', required: false },
  },

    async run({args}) {
       let dbDriver: DbConfig;

       switch (args.db) {
                case 'sqlite':
                    dbDriver = { driver: 'sqlite', name: args["db-name"] };
                    break;
                case 'mysql-pool':
                    dbDriver = {
                        driver: 'mysql-pool',
                        host: args["db-host"],
                        user: args["db-user"],
                        password: args["db-password"],
                        database: args["db-name"]
                    };
                    break;
                case 'postgresql':
                    dbDriver = {
                        driver: 'postgresql',
                        host: args["db-host"],
                        user: args["db-user"],
                        password: args["db-password"],
                        database: args["db-name"]
                    };
                    break;
                case 'cloudflare-d1':
                    dbDriver = { driver: 'cloudflare-d1', bindingName: args["db-name"] };
                    break;
                case 'planetscale':
                    dbDriver = { driver: 'planetscale', url: args["db-url"] };
                    break;
                default:
                    throw new Error(`Unsupported db driver: ${String(args.db)}`);
            }
            
           await defineConfiguration({
                 store: {
                    main: dbDriver
                }
            });

        const db = getDb();
        consola.start(`Creating tables for ${db.dialect}...`);
        await createTables(db);
        process.exit(0);
    }
});