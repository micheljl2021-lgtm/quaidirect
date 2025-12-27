import { useEffect, useMemo, useState } from 'react';
import { useJsApiLoader, type UseLoadScriptOptions } from '@react-google-maps/api';
import { getGoogleMapsApiKey, googleMapsLoaderConfig, initGoogleMapsApiKey } from '@/lib/google-maps';

const PLACEHOLDER_KEY = 'GOOGLE_MAPS_KEY_PENDING';

export function useGoogleMapsLoader(overrides?: Partial<UseLoadScriptOptions>) {
  const [apiKey, setApiKey] = useState<string>(() => getGoogleMapsApiKey());
  const [apiKeyLoading, setApiKeyLoading] = useState<boolean>(() => !getGoogleMapsApiKey());
  const [apiKeyError, setApiKeyError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    if (!apiKey) {
      setApiKeyLoading(true);
      initGoogleMapsApiKey()
        .then((key) => {
          if (cancelled) return;
          setApiKey(key);
          if (!key) {
            setApiKeyError('API_KEY_MISSING');
          }
        })
        .catch((error) => {
          if (cancelled) return;
          setApiKeyError(error instanceof Error ? error.message : 'API key load failed');
        })
        .finally(() => {
          if (!cancelled) setApiKeyLoading(false);
        });
    }

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  const loaderOptions: UseLoadScriptOptions = useMemo(() => ({
    ...googleMapsLoaderConfig,
    ...overrides,
    id: apiKey ? googleMapsLoaderConfig.id : `${googleMapsLoaderConfig.id}-placeholder`,
    googleMapsApiKey: apiKey || PLACEHOLDER_KEY,
  }), [apiKey, overrides]);

  const loaderState = useJsApiLoader(loaderOptions);

  return {
    ...loaderState,
    apiKey,
    apiKeyLoading,
    apiKeyError,
  };
}
