import { defineConfig, type Options } from 'tsup';

const config: Options = {
  entry: ['src/main.ts'],
  format: ['esm'],
  tsconfig: 'tsconfig.build.json',
  dts: true,
  sourcemap: true,
  clean: true,  
  splitting: true,
  minify: true,
  outDir: 'dist',
  external: [
    '@riavzon/shield-base',
    'cookie-parser',
    'express',
    'mysql2',
    'mysql2/promise',
    'db0',
    'magic-regexp',
    'maxmind',
    'pino',
    'ua-parser-js',
    'unstorage',
    'zod',
  ],
  treeshake: true,
};

export default defineConfig(config);