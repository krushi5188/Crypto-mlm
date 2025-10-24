import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  // Load env file from project root (one level up)
  const env = loadEnv(mode, path.resolve(__dirname, '..'), '');
  
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    },
    build: {
      outDir: 'dist',
      sourcemap: false
    },
    envDir: path.resolve(__dirname, '..') // Look for .env in project root
  };
});
