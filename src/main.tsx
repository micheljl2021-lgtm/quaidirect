import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import "./index.css";

const LazyApp = lazy(() => import("./App.tsx"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 1,
      refetchOnReconnect: true,
    },
  },
});

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
    tracesSampleRate: 0.3,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
    ignoreErrors: [
      "ResizeObserver loop limit exceeded",
      "ResizeObserver loop completed with undelivered notifications",
      "Network request failed",
      "Load failed",
    ],
  });
}

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary
      fallback={({ error }) => (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
          <div className="text-center max-w-md">
            <h1 className="text-2xl font-bold text-destructive mb-4">
              Une erreur est survenue
            </h1>
            <p className="text-muted-foreground mb-6">
              Nous avons été notifiés et travaillons à résoudre le problème.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Recharger la page
            </button>
          </div>
        </div>
      )}
      onError={(error) => {
        console.error("Sentry caught an error:", error);
      }}
    >
      <Suspense
        fallback={<div className="min-h-screen bg-background" aria-busy="true" />}
      >
        <LazyApp />
      </Suspense>
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);
