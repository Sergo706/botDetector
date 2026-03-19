import path from 'path'
import { defineConfig } from 'vitest/config'

const alias = {
    '@checkers': path.resolve(__dirname, 'src/botDetector/checkers'),
    '@db': path.resolve(__dirname, 'src/botDetector/db'),
    '@helpers': path.resolve(__dirname, 'src/botDetector/helpers'),
    '@utils': path.resolve(__dirname, 'src/botDetector/utils'),
    '~~': path.resolve(__dirname, './'),
};

const sharedTest = {
    environment: 'node' as const,
    setupFiles: ['test/setup.ts'],
    globalSetup: ['./test/global-setup.ts'],
    hookTimeout: 60000 * 25,
    testTimeout: 15000,
};

const MMDB_WRITERS = [
    'test/db/generator.test.ts',
    'test/checkers/knownBadIps.test.ts',
];

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      reporter: ['html'],
      cleanOnRerun: true,
      include: ['src/**/*.ts'],
    },
    watch: false,
    projects: [
        {
            resolve: { alias },
            test: {
                ...sharedTest,
                name: 'botDetector',
                include: ['test/**/*.{test,spec}.ts'],
                exclude: MMDB_WRITERS,
            },
        },
        {
            resolve: { alias },
            test: {
                ...sharedTest,
                name: 'botDetector-mmdb',
                include: MMDB_WRITERS,
                fileParallelism: false,
            },
        },
    ],
  },
})