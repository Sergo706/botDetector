import { defineCommand } from "citty";
import consola from "consola";
import { createTables } from "@db/schema.js";
import { getDb } from "../../config/config.js";

export const makeTables = defineCommand({
    meta: {
        name: 'load-schema',
        description: 'Create database tables'
    },

    async run() {
        const db = getDb();
        consola.start(`Creating tables for ${db.dialect}...`);
        await createTables(db);
    }
});