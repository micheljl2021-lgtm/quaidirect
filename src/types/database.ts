// Types locaux pour les tables Supabase
export interface UserRole {
  id: string;
  user_id: string;
  role: 'visitor' | 'user' | 'premium' | 'fisherman' | 'admin';
  created_at: string;
}

export interface Fisherman {
  id: string;
  user_id: string;
  siret: string | null;
  siren: string | null;
  boat_name: string;
  immat_navire: string;
  photo: string | null;
  verified_at: string | null;
  home_port_id: string | null;
  created_at: string;
}

export interface Port {
  id: string;
  name: string;
  region: string;
  lat: number;
  lng: number;
  timezone: string;
  created_at: string;
}

export interface Drop {
  id: string;
  fisherman_id: string;
  port_id: string;
  eta_at: string;
  status: 'draft' | 'scheduled' | 'landed' | 'cancelled';
  lat: number | null;
  lng: number | null;
  visible_at: string;
  public_visible_at: string | null;
  created_at: string;
}

export interface Offer {
  id: string;
  drop_id: string;
  species_id: string;
  title: string;
  photo_url: string | null;
  unit_type: 'piece';
  unit_price_cents: number;
  max_premium_reservations: number;
  available_units: number;
  is_active: boolean;
  created_at: string;
}
