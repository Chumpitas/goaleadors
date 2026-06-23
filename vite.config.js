import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Vitest config lives here too (test block) so we keep a single source of truth.
export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
