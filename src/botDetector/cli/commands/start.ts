import { defineCommand } from 'citty';
import { __cache, __askForUserAgent, __ensureMmdbctl } from '@riavzon/shield-base/internal';
import {
    getBGPAndASN,
    buildCitiesData,
    getGeoDatas,
    getListOfProxies,
    getThreatLists,
    getTorLists,
    getCrawlersIps,
    getUserAgentLmdbList,
    getJaDatabaseLmdb,
    type InputCache
} from '@riavzon/shield-base';
import consola from 'consola';
import { getLibraryRoot } from '@db/findDataPath.js';
import path from 'path';
import fs from 'node:fs';

export const startCommand = defineCommand({
    meta: {
        name: 'Bot Detector',
        description: 'Get started with the installation wizard'
    },

    async run() {
        const output = path.resolve(getLibraryRoot(), '_data-sources');
        const sentinel = path.resolve(output, 'asn.mmdb');

        if (!process.stdout.isTTY) {
            if (fs.existsSync(sentinel)) return;
            consola.warn('bot-detector: data sources not found. Run `npx bot-detector init` in an interactive terminal to set up.');
            return;
        }

        const cache: Partial<InputCache> = await __cache()._getCache() ?? {};

        consola.start('Starting installation wizard...');

        let mmdbPath = '';
        if (cache.mmdbctlPath) {
            mmdbPath = cache.mmdbctlPath;
        } else {
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

        if (fs.existsSync(sentinel)) {
            consola.success('Data sources already initialized. Run `bot-detector refresh` to update them.');
            return;
        }

        cache.selectedDataTypes = ["BGP", "City", "Geography", "Proxy", "Tor", "SEO", "firehol_l1", "firehol_l2", "firehol_l3", "firehol_l4", "firehol_anonymous", "JA4", "UserAgent"];
        cache.outPutPath = output;
        await __cache()._setCache(cache);

        consola.start('Compiling all data sources...');

        await Promise.all([
            getBGPAndASN(contactInfo, output, mmdbPath),
            buildCitiesData(output, mmdbPath),
            getTorLists(output, mmdbPath),
            getGeoDatas(output, mmdbPath),
            getListOfProxies(output, mmdbPath),
            getThreatLists(output, mmdbPath, true),
            getCrawlersIps(output, mmdbPath),
            getUserAgentLmdbList(output),
            getJaDatabaseLmdb(output)
        ]);

        consola.success('All data successfully compiled. You can now start using bot-detector.');
    }
});