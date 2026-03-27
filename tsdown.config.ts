import { defineConfig, type UserConfig } from 'tsdown'

const shared: UserConfig = {
  target: 'node18',
  tsconfig: 'tsconfig.build.json',
  treeshake: true,
  sourcemap: true,
  minify: false,
  deps: {
    onlyBundle: ['@types/express-serve-static-core'],
    neverBundle: 'lmdb'
  },
};

export default defineConfig([
  {
    ...shared,
    entry: ['./src/main.ts'],
    dts: true,
    format: ['esm', 'cjs'],
    clean: true,
    publint: {
      level: 'error',
      enabled: 'ci-only',
      strict: true,
    },
    attw: {
      level: 'error',
      enabled: 'ci-only'
    },
    copy: [
      { from: '_data-sources/suffix.json', to: 'dist/_data-sources', flatten: false }
    ],
    failOnWarn: true,
  },
  {
    ...shared,
    entry: ['./src/botDetector/cli/index.ts'],
    dts: false,
    format: ['esm'],
  },
])

