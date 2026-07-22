import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    globals: false,
    environment: 'node',
    include: ['src/__tests__/**/*.test.ts'],
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'postgresql://postgres:postgres@localhost:5432/magazin_pos?schema=public',
      JWT_ACCESS_SECRET: 'test-access-secret-minimum-32-characters-long',
      JWT_REFRESH_SECRET: 'test-refresh-secret-minimum-32-characters-long',
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include: ['src/**/*.ts'],
      exclude: ['src/__tests__/**'],
    },
  },
  resolve: {
    alias: {
      '@magazin/shared': path.resolve(__dirname, '../shared/src/index.ts'),
    },
  },
});
