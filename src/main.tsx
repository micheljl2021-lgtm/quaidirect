import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { validateEnvironment } from "@/lib/validate-env";
import App from "./App.tsx";
import "./index.css";

// Validate environment variables before initializing the app
// This prevents silent failures and provides clear error messages
try {
  validateEnvironment();
} catch (error) {
  console.error('[BOOTSTRAP] Environment validation failed:', error);
  // Re-throw to trigger ErrorBoundary with clear message
  throw error;
}

// Configure QueryClient with optimized defaults
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
      gcTime: 30 * 60 * 1000, // 30 minutes garbage collection
      refetchOnWindowFocus: false, // Don't refetch on tab focus
      retry: 1, // Only retry once on failure
      refetchOnReconnect: true, // Refetch when network reconnects
    },
  },
});

// Initialize Sentry for error tracking and performance monitoring
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;

if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance monitoring
    tracesSampleRate: 0.3, // 30% of transactions for performance monitoring
    // Session Replay
    replaysSessionSampleRate: 0.1, // 10% of sessions
    replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
    // Environment
    environment: import.meta.env.MODE,
    // Filter out noisy errors
    ignoreErrors: [
      'ResizeObserver loop limit exceeded',
      'ResizeObserver loop completed with undelivered notifications',
      'Network request failed',
      'Load failed',
    ],
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              {error?.message?.includes('environment') || error?.message?.includes('Supabase credentials')
                ? 'Erreur de Configuration'
                : 'Une erreur est survenue'}
            </h1>
            <div className="text-muted-foreground mb-6">
              {error?.message?.includes('environment') || error?.message?.includes('Supabase credentials') ? (
                <>
                  <p className="font-mono text-sm mb-4 text-left bg-muted p-3 rounded">
                    {error?.message || 'Variables d\'environnement manquantes'}
                  </p>
                  <p className="text-xs">
                    Vérifiez les secrets dans Lovable Cloud Settings
                  </p>
                </>
              ) : (
                <p>Nous avons été notifiés et travaillons à résoudre le problème.</p>
              )}
            </div>
            <button
              onClick={() => {
                if (error?.message?.includes('environment') || error?.message?.includes('Supabase credentials')) {
                  window.location.reload();
                } else {
                  resetError();
                }
              }}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              {error?.message?.includes('environment') || error?.message?.includes('Supabase credentials')
                ? 'Recharger la page'
                : 'Réessayer'}
            </button>
          </div>
        </div>
      )}
      onError={(error) => {
        console.error("Sentry caught an error:", error);
      }}
    >
      <App />
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);
