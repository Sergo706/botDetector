import { defineStrictTSConfig } from '@sergo/utils/eslint/strict';

export default defineStrictTSConfig({
    rootDir: import.meta.dirname,
    extraIgnores: ['coverage/**', 'tsup.config.ts', 'vitest.config.ts', 'test/**', 'src/botDetector/utils/logger.ts']
});