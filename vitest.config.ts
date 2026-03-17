import path from 'path'
import { defineConfig } from 'vitest/config'

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
            resolve: {
                alias: {
                    '@checkers': path.resolve(__dirname, 'src/botDetector/checkers'),
                    '@db': path.resolve(__dirname, 'src/botDetector/db'),
                    '@helpers': path.resolve(__dirname, 'src/botDetector/helpers'),
                    '@utils': path.resolve(__dirname, 'src/botDetector/utils'),
                    '~~': path.resolve(__dirname, './'),
                }
            },
            test: {
                name:'botDetector',
                include: ['test/**/*.{test,spec}.ts'],
                environment: 'node',
                setupFiles: ['test/setup.ts'],
                globalSetup: ['./test/global-setup.ts'],
                hookTimeout: 60000 * 25,
                testTimeout: 15000,
                fileParallelism: false,
                maxConcurrency: 2,
            }
        },

    ]
}
})