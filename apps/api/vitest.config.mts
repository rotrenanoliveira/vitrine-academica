import swc from 'unplugin-swc'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  oxc: false,
  test: {
    isolated: true,

    coverage: {
      enabled: false,
      provider: 'v8',
    },

    globals: true,
    root: './',
    dir: './src',
    projects: [
      {
        extends: true,
        test: {
          name: 'unit',
          include: ['**/*.spec.ts'],
          exclude: ['**/*.e2e.spec.ts'],
        },
        dir: './tests',
      },
      {
        extends: true,
        test: {
          name: 'e2e',
          include: ['**/*.e2e.spec.ts'],
          exclude: ['**/*.spec.ts'],
        },
        dir: './tests',
      },
    ],
  },
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    swc.vite({
      module: { type: 'es6' },
    }),
  ],
})
