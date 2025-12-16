import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { render } from '../utils';
import Download from '@/pages/Download';

describe('Download Page', () => {
  beforeEach(() => {
    // Mock navigator.userAgent for testing
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      configurable: true,
    });
  });

  it('renders download page with title', async () => {
    render(<Download />);
    
    await waitFor(() => {
      expect(screen.getByText('Télécharger QuaiDirect')).toBeInTheDocument();
    });
  });

  it('shows benefits section', async () => {
    render(<Download />);
    
    await waitFor(() => {
      expect(screen.getByText('Pourquoi installer l\'application ?')).toBeInTheDocument();
      expect(screen.getByText(/Accès rapide depuis votre écran d'accueil/)).toBeInTheDocument();
      expect(screen.getByText(/Notifications pour les nouveaux arrivages/)).toBeInTheDocument();
      expect(screen.getByText(/Fonctionne même hors ligne/)).toBeInTheDocument();
    });
  });

  it('detects desktop platform by default', async () => {
    render(<Download />);
    
    await waitFor(() => {
      expect(screen.getByText('Installation sur ordinateur')).toBeInTheDocument();
    });
  });

  it('detects Android platform', async () => {
    // Mock Android user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36',
      configurable: true,
    });

    render(<Download />);
    
    await waitFor(() => {
      expect(screen.getByText('Installation sur Android')).toBeInTheDocument();
    });
  });

  it('detects iOS platform', async () => {
    // Mock iOS user agent
    Object.defineProperty(window.navigator, 'userAgent', {
      value: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)',
      configurable: true,
    });

    render(<Download />);
    
    await waitFor(() => {
      expect(screen.getByText('Installation sur iOS')).toBeInTheDocument();
    });
  });
});
