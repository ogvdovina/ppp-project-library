import { defineConfig } from 'vitest/config';

export default defineConfig({
  base: './',
  server: {
    fs: { deny: ['**/.git/**', '**/.agents/**', '**/.codex/**', '**/_archive/**', '**/.env*'] }
  },
  test: { include: ['tests/unit/**/*.test.js'] }
});
