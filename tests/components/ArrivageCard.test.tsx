import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { render } from '../utils';
import ArrivageCard from '@/components/ArrivageCard';

const defaultProps = {
  id: 'drop-1',
  species: 'Bar',
  scientificName: 'Dicentrarchus labrax',
  port: 'Port de Hyères',
  eta: new Date(),
  quantity: 10,
  fisherman: {
    name: 'Jean Dupont',
    boat: 'Le Mistral',
    isAmbassador: false,
    isPartnerAmbassador: false,
  },
};

describe('ArrivageCard', () => {
  it('renders species name and port', () => {
    render(<ArrivageCard {...defaultProps} />);
    expect(screen.getByText('Bar')).toBeInTheDocument();
    expect(screen.getByText('Port de Hyères')).toBeInTheDocument();
  });

  it('displays "Prix sur place" when no valid price', () => {
    render(<ArrivageCard {...defaultProps} />);
    expect(screen.getByText('Prix sur place')).toBeInTheDocument();
  });

  it('displays price correctly when defined', () => {
    render(<ArrivageCard {...defaultProps} pricePerPiece={15.5} />);
    expect(screen.getByText(/15.50/)).toBeInTheDocument();
  });

  it('shows premium badge when isPremium is true', () => {
    render(<ArrivageCard {...defaultProps} isPremium={true} />);
    expect(screen.getByText('Premium')).toBeInTheDocument();
  });

  it('handles image error with fallback', () => {
    const dropPhotos = [{ photo_url: 'https://invalid.jpg', display_order: 0 }];
    render(<ArrivageCard {...defaultProps} dropPhotos={dropPhotos} />);
    const img = screen.getByRole('img');
    fireEvent.error(img);
    expect(document.querySelector('.bg-gradient-to-br')).toBeInTheDocument();
  });
});
