import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * Composant qui réinitialise le scroll en haut de page
 * lors des changements de route
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}
