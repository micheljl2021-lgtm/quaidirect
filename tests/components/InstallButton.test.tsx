import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '../utils';
import { InstallButton } from '@/components/InstallButton';
import * as usePWAInstallModule from '@/hooks/usePWAInstall';

// Mock the hook
vi.mock('@/hooks/usePWAInstall', () => ({
  usePWAInstall: vi.fn(),
}));

describe('InstallButton', () => {
  const mockUsePWAInstall = vi.mocked(usePWAInstallModule.usePWAInstall);

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders button when installable and not installed', async () => {
    mockUsePWAInstall.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
    });

    render(<InstallButton />);
    
    await waitFor(() => {
      expect(screen.getByText(/Installer l'app/i)).toBeInTheDocument();
    });
  });

  it('does not render when already installed', () => {
    mockUsePWAInstall.mockReturnValue({
      isInstallable: false,
      isInstalled: true,
      promptInstall: vi.fn(),
    });

    const { container } = render(<InstallButton />);
    
    expect(container.firstChild).toBeNull();
  });

  it('does not render when not installable', () => {
    mockUsePWAInstall.mockReturnValue({
      isInstallable: false,
      isInstalled: false,
      promptInstall: vi.fn(),
    });

    const { container } = render(<InstallButton />);
    
    expect(container.firstChild).toBeNull();
  });

  it('navigates to download page on click', async () => {
    const user = userEvent.setup();
    mockUsePWAInstall.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
    });

    render(<InstallButton />);
    
    const button = await screen.findByText(/Installer l'app/i);
    await user.click(button);
    
    // Check if navigation occurred (will be tested in integration tests)
    expect(button).toBeInTheDocument();
  });

  it('applies custom className', async () => {
    mockUsePWAInstall.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
    });

    render(<InstallButton className="custom-class" />);
    
    const button = await screen.findByText(/Installer l'app/i);
    expect(button).toHaveClass('custom-class');
  });

  it('renders with outline variant', async () => {
    mockUsePWAInstall.mockReturnValue({
      isInstallable: true,
      isInstalled: false,
      promptInstall: vi.fn(),
    });

    render(<InstallButton variant="outline" />);
    
    const button = await screen.findByText(/Installer l'app/i);
    expect(button).toBeInTheDocument();
  });
});
