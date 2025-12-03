import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import App from "./App.tsx";
import "./index.css";

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
  <Sentry.ErrorBoundary
    fallback={({ error, resetError }) => (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <h1 className="text-2xl font-bold text-destructive mb-4">
            Une erreur est survenue
          </h1>
          <p className="text-muted-foreground mb-6">
            Nous avons été notifiés et travaillons à résoudre le problème.
          </p>
          <button
            onClick={resetError}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Réessayer
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
);
