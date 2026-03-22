import { defineCommand } from 'citty';
import { __cache, __askForUserAgent, __ensureMmdbctl } from '@riavzon/shield-base/internal';
import { generateData, type InputCache } from '@riavzon/shield-base';
import consola from 'consola';
import { getLibraryRoot } from '@db/findDataPath.js';
import path from 'path';

export const startCommand = defineCommand({
    meta: {
        name: 'Bot Detector',
        description: 'Get started with the installation wizard'
    },
    
    async run() {
        const cache: Partial<InputCache> = await __cache()._getCache() ?? {};

        consola.start('Starting installation wizard...');

        let mmdbPath = '';
        if (cache.mmdbctlPath) {
            mmdbPath = cache.mmdbctlPath;
        } 
         else {
            consola.start('Verifying system dependencies...');
            mmdbPath = await __ensureMmdbctl();
            cache.mmdbctlPath = mmdbPath;
        }
         let contactInfo: string | undefined = '';
        
        if (cache.useragent) {
            contactInfo = cache.useragent;
        } else {
            contactInfo = await __askForUserAgent();
            cache.useragent = contactInfo;
        }
        
         const output = path.resolve(getLibraryRoot(), '_data-sources');
         cache.selectedDataTypes = ["BGP",  "City",  "Geography",  "Proxy",  "Tor",  "SEO",  "firehol_l1",  "firehol_l2",  "firehol_l3",  "firehol_l4",  "firehol_anonymous"];

         cache.outPutPath = output;
         await __cache()._setCache(cache);

         consola.start('🚀 Compiling all data sources...');
         await generateData(output, contactInfo, true, mmdbPath);
         consola.success(`✨ All data successfully compiled! You can now start using bot-detector`);
    }
});