import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { visualizer } from 'rollup-plugin-visualizer'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html
    visualizer({
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ],

  // Build optimizations
  build: {
    // Target modern browsers for smaller bundle
    target: 'es2015',
    
    // Minification
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.logs in production
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.info'], // Remove specific console methods
      },
    },

    // Code splitting
    rollupOptions: {
      output: {
        // Manual chunks for better caching
        manualChunks: {
          // Vendor chunks
          'react-vendor': ['react', 'react-dom'],
          'supabase-vendor': ['@supabase/supabase-js'],
          
          // Component chunks
          'admin-components': [
            './src/components/AdminPanel.jsx',
            './src/components/UserManagement.jsx',
            './src/components/DisclaimerManager.jsx',
          ],
          'chat-components': [
            './src/components/ChatInterface.jsx',
            './src/components/DepartmentSelect.jsx',
          ],
          'form-components': [
            './src/components/DepositForm.jsx',
            './src/components/WithdrawForm.jsx',
            './src/components/NewUserForm.jsx',
          ],
        },
        
        // Optimize chunk names
        chunkFileNames: 'assets/[name]-[hash].js',
        entryFileNames: 'assets/[name]-[hash].js',
        assetFileNames: 'assets/[name]-[hash].[ext]',
      },
    },

    // Chunk size warning limit
    chunkSizeWarningLimit: 1000,

    // Source maps for production debugging (optional)
    sourcemap: false, // Set to true if you need debugging in production

    // CSS code splitting
    cssCodeSplit: true,

    // Asset inlining threshold (4kb)
    assetsInlineLimit: 4096,
  },

  // Development server optimizations
  server: {
    // Enable HMR
    hmr: true,
    
    // Faster startup
    warmup: {
      clientFiles: [
        './src/App.jsx',
        './src/components/Login.jsx',
        './src/lib/supabase.js',
      ],
    },
  },

  // Dependency optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      '@supabase/supabase-js',
    ],
    exclude: [
      // Exclude large dependencies that don't need pre-bundling
    ],
  },

  // Preview server (for testing production build)
  preview: {
    port: 4173,
    strictPort: true,
  },
})
