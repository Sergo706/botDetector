import { defineStrictTSConfig } from '@riavzon/utils/eslint/strict';

export default defineStrictTSConfig({
    rootDir: import.meta.dirname,
    extraIgnores: ['tsdown.config.ts'],
});