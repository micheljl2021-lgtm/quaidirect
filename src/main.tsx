import { Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import * as Sentry from "@sentry/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { checkEnvironment } from "@/lib/validate-env";
import "./index.css";

const LazyApp = lazy(() => import("./App.tsx"));

const getErrorMessage = (err: unknown) => {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  try {
    return JSON.stringify(err);
  } catch {
    return "Unknown error";
  }
};

const isConfigErrorMessage = (message: string) => {
  return (
    message.includes("Missing required environment variables") ||
    message.includes("Supabase credentials") ||
    message.includes("supabaseUrl is required")
  );
};

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

const envCheck = checkEnvironment();

if (envCheck) {
  console.error("[BOOTSTRAP] Missing required env vars:", envCheck.missing);
}

const BootstrapConfigError = ({ missing }: { missing: string[] }) => (
  <div className="min-h-screen bg-background text-foreground">
    <main className="mx-auto w-full max-w-2xl p-6">
      <header className="mb-6">
        <h1 className="text-2xl font-semibold">Erreur de configuration</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Le site n’a pas reçu les variables de démarrage nécessaires. Résultat : écran blanc en production.
        </p>
      </header>

      <section className="rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">Variables manquantes</h2>
        <ul className="mt-3 space-y-1 text-sm font-mono text-muted-foreground">
          {missing.map((v) => (
            <li key={v}>• {v}</li>
          ))}
        </ul>

        <div className="mt-4 text-sm text-muted-foreground">
          <p className="mb-2">À vérifier côté Lovable Cloud :</p>
          <ol className="list-decimal pl-5 space-y-1">
            <li>Les secrets frontend existent bien avec le préfixe <span className="font-mono">VITE_</span>.</li>
            <li>Après changement de secrets, republier (Publish → Update) pour reconstruire le build.</li>
          </ol>
        </div>
      </section>

      <section className="mt-6 rounded-lg border border-border bg-card p-4">
        <h2 className="text-sm font-medium">Diagnostic rapide</h2>
        <div className="mt-3 grid gap-2 text-xs text-muted-foreground">
          <div><span className="font-mono">MODE</span> : {import.meta.env.MODE}</div>
          <div><span className="font-mono">HOST</span> : {typeof window !== 'undefined' ? window.location.host : 'unknown'}</div>
        </div>
      </section>
    </main>
  </div>
);

createRoot(document.getElementById("root")!).render(
  <QueryClientProvider client={queryClient}>
    <Sentry.ErrorBoundary
      fallback={({ error, resetError }) => {
        const message = getErrorMessage(error);
        const isConfig = isConfigErrorMessage(message);

        return (
          <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="text-center max-w-md">
              <h1 className="text-2xl font-bold text-destructive mb-4">
                {isConfig ? "Erreur de Configuration" : "Une erreur est survenue"}
              </h1>
              <div className="text-muted-foreground mb-6">
                {isConfig ? (
                  <>
                    <p className="font-mono text-sm mb-4 text-left bg-muted p-3 rounded">
                      {message || "Variables d'environnement manquantes"}
                    </p>
                    <p className="text-xs">
                      Vérifiez les secrets Lovable Cloud puis republiez (Publish → Update).
                    </p>
                  </>
                ) : (
                  <p>Nous avons été notifiés et travaillons à résoudre le problème.</p>
                )}
              </div>
              <button
                onClick={() => {
                  if (isConfig) {
                    window.location.reload();
                  } else {
                    resetError();
                  }
                }}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                {isConfig ? "Recharger la page" : "Réessayer"}
              </button>
            </div>
          </div>
        );
      }}
      onError={(error) => {
        console.error("Sentry caught an error:", error);
      }}
    >
      {envCheck ? (
        <BootstrapConfigError missing={envCheck.missing} />
      ) : (
        <Suspense
          fallback={<div className="min-h-screen bg-background" aria-busy="true" />}
        >
          <LazyApp />
        </Suspense>
      )}
    </Sentry.ErrorBoundary>
  </QueryClientProvider>
);

