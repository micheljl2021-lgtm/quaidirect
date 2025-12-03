import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    // Gzip compression for production builds
    mode === "production" && compression({
      algorithm: "gzip",
      ext: ".gz",
      threshold: 10240,
    }),
    // Brotli compression for modern browsers
    mode === "production" && compression({
      algorithm: "brotliCompress",
      ext: ".br",
      threshold: 10240,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    target: "es2020",
    rollupOptions: {
      external: [/\.test\.tsx?$/, /\.spec\.tsx?$/, /__tests__/],
      output: {
        manualChunks: {
          "vendor-react": ["react", "react-dom", "react-router-dom"],
          "vendor-ui": [
            "@radix-ui/react-dialog",
            "@radix-ui/react-dropdown-menu",
            "@radix-ui/react-select",
            "@radix-ui/react-tabs",
            "@radix-ui/react-toast",
            "@radix-ui/react-tooltip",
            "@radix-ui/react-popover",
          ],
          "vendor-query": ["@tanstack/react-query", "@supabase/supabase-js"],
          "vendor-maps": ["@react-google-maps/api", "@googlemaps/markerclusterer"],
          "vendor-charts": ["recharts"],
          "vendor-forms": ["react-hook-form", "@hookform/resolvers", "zod"],
          "vendor-date": ["date-fns", "react-day-picker"],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
  esbuild: {
    exclude: ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx', '**/__tests__/**'],
  },
}));
