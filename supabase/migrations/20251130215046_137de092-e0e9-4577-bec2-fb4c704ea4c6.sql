-- Make port_id nullable since we now use sale_point_id for sale points
ALTER TABLE drops ALTER COLUMN port_id DROP NOT NULL;