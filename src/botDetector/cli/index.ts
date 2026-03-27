#!/usr/bin/env node

import { defineCommand, runMain } from 'citty';
import { startCommand } from './commands/start.js';
import { refreshData } from './commands/refresh.js';
import { cleanUp } from './commands/cleanUp.js';
import { makeTables } from './commands/makeTables.js';

export const main = defineCommand({
  meta: {
        name: 'bot-detector',
        description: 'Automatic traffic analysis and detection',
        version: '1.0.0'
    },
  subCommands: {
    init: startCommand,
    refresh: refreshData,
    generate: cleanUp,
    'load-schema': makeTables
  },
});

await runMain(main);
