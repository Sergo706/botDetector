import { defineCommand } from 'citty';
import { __cache,  __restartData } from '@riavzon/shield-base/internal';
import { InputCache } from '@riavzon/shield-base';
import consola from 'consola';
import { getLibraryRoot } from '@db/findDataPath.js';
import path from 'path';


export const refreshData = defineCommand({
    meta: {
        name: 'refresh',
        description: 'Refresh the local data sources the bot-detector use internally'
    },
    
    async run() {
        const cache: Partial<InputCache> = await __cache()._getCache() ?? {};
        
        if (!cache.outPutPath || !cache.mmdbctlPath || Object.keys(cache).length === 0) {
            consola.error('No data to restart, please first run the installation wizard');
            throw new Error();
        }

        const output = path.resolve(getLibraryRoot(), '_data-sources');
        consola.start('Restarting data sources...');

        await __restartData(output, true);

        consola.success(`✨ All data successfully restarted!`);
    }
});