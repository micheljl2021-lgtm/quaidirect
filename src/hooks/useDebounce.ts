import { useState, useEffect } from 'react';

/**
 * Hook de debounce pour retarder l'exécution d'une valeur
 * Utile pour les recherches et filtres qui déclenchent des requêtes
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
