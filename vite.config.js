import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig(({ command, mode }) => {
  const isProduction = mode === 'production';
  
  return {
    base: isProduction ? '/galaxy-explorer-pro/' : '/',
    root: 'src',
    publicDir: '../public',
    build: {
      outDir: '../dist',
      emptyOutDir: true,
      sourcemap: isProduction ? false : 'inline',
      minify: isProduction ? 'terser' : false,
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'src/index.html'),
        },
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash][extname]',
        },
      },
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
      } : {},
    },
    server: {
      port: 3000,
      open: true,
      host: true,
      strictPort: true,
    },
    preview: {
      port: 4000,
      open: true,
      host: true,
    },
    plugins: [
      {
        name: 'html-transform',
        transformIndexHtml(html) {
          return html.replace(
            /<script type="module" src="\/src\/main.js"><\/script>/,
            '<script type="module" src="/galaxy-explorer-pro/src/main.js"></script>'
          );
        },
      },
    ],
  };
});
