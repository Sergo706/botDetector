import { defineStrictTSConfig } from '@riavzon/utils/eslint/strict';

export default defineStrictTSConfig({
    rootDir: import.meta.dirname,
    extraIgnores: ['coverage/**', 'tsdown.config.ts', 'vitest.config.ts', 'test/**', 'src/botDetector/utils/logger.ts']
});