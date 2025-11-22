-- Create fishing_method enum
CREATE TYPE fishing_method AS ENUM (
  'palangre',
  'filet',
  'ligne',
  'casier',
  'chalut',
  'seine',
  'hamecon',
  'nasse',
  'autre'
);

-- Add fishing activity fields to fishermen table
ALTER TABLE fishermen
ADD COLUMN company_name TEXT,
ADD COLUMN description TEXT,
ADD COLUMN fishing_methods fishing_method[],
ADD COLUMN fishing_zones TEXT[],
ADD COLUMN fishing_zones_geojson JSONB;