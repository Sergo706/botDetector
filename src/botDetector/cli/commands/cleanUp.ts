import { runGeneration } from "@db/generator.js";
import { defineCommand } from "citty";
import consola from "consola";
import { getConfiguration } from "../../config/config.js";
import { execSync } from "child_process";
import { __ensureMmdbctl } from "@riavzon/shield-base/internal";

export const cleanUp = defineCommand({
    meta: {
        name: 'generate',
        description: 'Run the generator: reads banned and high-risk visitors from your database and compiles them into an optimized binary (based on your generator configuration)'
    },

    async run() {    
        const { generator } = getConfiguration();
        try {
            execSync(`${generator.mmdbctlPath} --help`, { stdio: 'ignore' });
        } catch {
                
            consola.warn(`The configurable mmdbctl path cannot be resolved at ${generator.mmdbctlPath}, You will be prompted to install it.`);
            const path = await __ensureMmdbctl();
            consola.box(`mmdbctl installed successfully. Add the next path in generator.mmdbctlPath configuration option and run the command again: ${path}`);

            process.exit(1);
     }

       consola.start('Starting clean up operation...');
       await runGeneration();
       consola.success('Success!');
    }
});