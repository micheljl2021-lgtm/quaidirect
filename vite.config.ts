import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import compression from "vite-plugin-compression";
import fs from "fs";

// Plugin to inject cache version into service worker
function injectServiceWorkerVersion() {
  return {
    name: 'inject-sw-version',
    apply: 'build' as const,
    closeBundle() {
      const swPath = path.resolve(__dirname, 'dist/sw.js');
      if (fs.existsSync(swPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        let content = fs.readFileSync(swPath, 'utf-8');
        content = content.replace(/__CACHE_VERSION__/g, timestamp);
        fs.writeFileSync(swPath, content);
        console.log(`Service Worker cache version set to: ${timestamp}`);
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  return {
    server: {
      host: "::",
      port: 8080,
    },
    plugins: [
      react(),
      mode === "development" && componentTagger(),
      // Inject cache version into service worker
      injectServiceWorkerVersion(),
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
        "@/integrations/supabase/client": path.resolve(
          __dirname,
          "./src/integrations/supabase/client.runtime.ts"
        ),
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
      exclude: [
        '**/*.test.ts',
        '**/*.test.tsx',
        '**/*.spec.ts',
        '**/*.spec.tsx',
        '**/__tests__/**'
      ],
    },
  };
});

