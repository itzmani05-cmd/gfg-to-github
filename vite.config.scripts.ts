import { defineConfig } from 'vite';
import { resolve } from 'path';

// Config for building background and content scripts in library mode
export default defineConfig({
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false, // Ensure we don't clear the popup/options builds
    lib: {
      entry: {
        background: resolve(__dirname, 'src/background/index.ts'),
        'content-main': resolve(__dirname, 'src/content/content-main.ts'),
        'content-isolated': resolve(__dirname, 'src/content/content-isolated.ts'),
      },
      formats: ['es'],
    },
    rollupOptions: {
      output: {
        entryFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
  },
});
