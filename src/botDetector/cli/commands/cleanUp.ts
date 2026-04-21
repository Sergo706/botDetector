import { runGeneration } from "@db/generator.js";
import { defineCommand } from "citty";
import consola from "consola";
import { getConfiguration } from "../../config/config.js";
import { execSync } from "child_process";
import { __ensureMmdbctl } from "@riavzon/shield-base/internal";
import { DbConfig, defineConfiguration } from "~~/src/main.js";

export const cleanUp = defineCommand({
    meta: {
        name: 'generate',
        description: 'Run the generator: reads banned and high-risk visitors from your database and compiles them into an optimized binary'
    },
  args: {
        db: { 
            type: 'enum', 
            description: 'The data base driver defined in your configuration',
            required: false,
            default: "sqlite",
        },
        "db-name": { type: 'string', description: 'The database name', required: false },
        "db-host": { type: 'string', description: 'The database host', required: false },
        "db-user": { type: 'string', description: 'The database user', required: false },
        "db-password": { type: 'string', description: 'The database password', required: false },
        "db-url": { type: 'string', description: 'The database URL (for planetscale)', required: false },
        mmdbctl: { type: 'string', description: 'The path for the mmdbctl binary', default: 'mmdbctl', required: false },
        types: { type: 'boolean', description: 'Generate Typescript types', default: false, required: false },
        delete: { type: 'boolean', description: 'Delete the rows that compiled in this run', default: false, required: false },
        score: { type: 'string', description: 'The threat score considered a "high threat"', default: '70', required: false },
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
                },
                generator: {
                    scoreThreshold: Number(args.score),
                    generateTypes: args.types,
                    deleteAfterBuild: args.delete,
                    mmdbctlPath: args.mmdbctl
                }
            });

            const { generator } = getConfiguration();

        try {
            execSync(`${generator.mmdbctlPath} --help`, { stdio: 'ignore' });
        } catch {
                
            consola.warn(`The configurable mmdbctl path cannot be resolved at ${generator.mmdbctlPath}, You will be prompted to install it.`);
            const path = await __ensureMmdbctl();
            consola.box(`mmdbctl installed successfully. Provide the next path in mmdbctl="<path>" argument option and run the command again: ${path}`);

            process.exit(1);
     }

       consola.start('Starting clean up operation...');
       await runGeneration();
       consola.success('Success!');
       process.exit(0);
    }
});