import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'path';
import { VitePWA } from 'vite-plugin-pwa';
import { createHtmlPlugin } from 'vite-plugin-html';
import basicSsl from '@vitejs/plugin-basic-ssl';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');

  return {
    base: './', // This ensures all asset paths are relative
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    },
    publicDir: 'public',
    optimizeDeps: {
      include: ['three', 'gsap', 'howler', '@tweenjs/tween.js'],
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      emptyOutDir: true,
      sourcemap: mode !== 'production',
      minify: mode === 'production' ? 'terser' : 'esbuild',
      terserOptions: {
        compress: {
          drop_console: mode === 'production',
          drop_debugger: mode === 'production',
        },
      },
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
        },
        output: {
          manualChunks: {
            three: ['three'],
            gsap: ['gsap'],
            howler: ['howler'],
            tween: ['@tweenjs/tween.js'],
          },
        },
      },
    },
    server: {
      port: 3000,
      open: true,
      https: process.env.VITE_USE_HTTPS === 'true',
      host: true,
    },
    preview: {
      port: 3001,
      open: true,
    },
    plugins: [
      basicSsl(),
      createHtmlPlugin({
        minify: true,
        inject: {
          data: {
            title: 'Galaxy Explorer Pro',
            description: '3D Galaxy Explorer - Explore the universe in your browser',
            keywords: '3D, Galaxy, Space, Explorer, Three.js, WebGL',
          },
        },
      }),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'robots.txt', 'sitemap.xml', 'assets/**/*'],
        manifest: {
          name: 'Galaxy Explorer Pro',
          short_name: 'Galaxy Explorer',
          description: '3D Galaxy Explorer - Explore the universe in your browser',
          theme_color: '#000000',
          background_color: '#121212',
          display: 'standalone',
          icons: [
            {
              src: 'assets/icon-192x192.png',
              sizes: '192x192',
              type: 'image/png',
              purpose: 'any maskable',
            },
            {
              src: 'assets/icon-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: ({ url }) => {
                return url.pathname.includes('api');
              },
              handler: 'CacheFirst',
              options: {
                cacheName: 'api-cache',
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
        devOptions: {
          enabled: true,
          type: 'module',
          navigateFallback: 'index.html',
        },
      }),
      viteCompression({
        verbose: true,
        disable: false,
        threshold: 10240,
        algorithm: 'gzip',
        ext: '.gz',
      }),
    ],
  };
});
