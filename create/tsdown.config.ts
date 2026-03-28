import { defineConfig } from 'tsdown';

export default defineConfig({
    entry: ['./src/create.ts'],
    format: ['cjs'],
    target: 'node18',
    dts: false,
    clean: true,
    sourcemap: false,
});