import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalizedId = id.replace(/\\/g, '/');

          if (!normalizedId.includes('node_modules')) {
            return undefined;
          }

          if (normalizedId.includes('@bytemd') || normalizedId.includes('/bytemd/')) {
            return 'editor';
          }

          if (normalizedId.includes('/antd/') || normalizedId.includes('@ant-design')) {
            return 'ui';
          }

          if (normalizedId.includes('/react/') || normalizedId.includes('/react-dom/') || normalizedId.includes('/scheduler/')) {
            return 'react-vendor';
          }

          if (normalizedId.includes('/react-router/') || normalizedId.includes('/react-router-dom/')) {
            return 'router';
          }

          if (
            normalizedId.includes('/@reduxjs/') ||
            normalizedId.includes('/redux/') ||
            normalizedId.includes('/react-redux/') ||
            normalizedId.includes('/immer/')
          ) {
            return 'state';
          }

          if (normalizedId.includes('/axios/')) {
            return 'network';
          }

          if (
            normalizedId.includes('/codemirror/') ||
            normalizedId.includes('/@codemirror/') ||
            normalizedId.includes('/remark-') ||
            normalizedId.includes('/rehype-') ||
            normalizedId.includes('/mdast-') ||
            normalizedId.includes('/hast-') ||
            normalizedId.includes('/micromark/') ||
            normalizedId.includes('/unified/') ||
            normalizedId.includes('/unist-') ||
            normalizedId.includes('/vfile/') ||
            normalizedId.includes('/tippy.js/') ||
            normalizedId.includes('/@popperjs/')
          ) {
            return 'markdown';
          }

          if (
            normalizedId.includes('/rc-') ||
            normalizedId.includes('/@rc-component/') ||
            normalizedId.includes('/@emotion/') ||
            normalizedId.includes('/classnames/') ||
            normalizedId.includes('/resize-observer-polyfill/')
          ) {
            return 'ui-helpers';
          }

          return 'vendor';
        },
      },
    },
  },
})

