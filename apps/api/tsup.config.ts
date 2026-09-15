import path from 'node:path'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/infra/http/server.ts'],
  outDir: 'dist',
  format: ['esm'],
  target: 'es2024',
  platform: 'node',
  bundle: true,
  clean: true,
  sourcemap: true,
  splitting: false,
  dts: false,
  tsconfig: 'tsconfig.json',
  esbuildOptions(options) {
    options.alias = {
      '@': path.resolve(__dirname, 'src'),
    }
  },
})
