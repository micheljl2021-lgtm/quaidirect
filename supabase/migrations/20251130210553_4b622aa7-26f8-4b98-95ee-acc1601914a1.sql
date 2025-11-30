-- Add sale_point_id to drops table to link arrivals to sale points
ALTER TABLE drops ADD COLUMN sale_point_id UUID REFERENCES fisherman_sale_points(id);

-- Create function to enforce max 2 sale points per fisherman
CREATE OR REPLACE FUNCTION check_sale_points_limit()
RETURNS TRIGGER AS $$
BEGIN
  IF (SELECT COUNT(*) FROM fisherman_sale_points WHERE fisherman_id = NEW.fisherman_id) >= 2 THEN
    RAISE EXCEPTION 'Un pêcheur ne peut avoir que 2 points de vente maximum';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create trigger to enforce the limit before insert
CREATE TRIGGER enforce_sale_points_limit
BEFORE INSERT ON fisherman_sale_points
FOR EACH ROW EXECUTE FUNCTION check_sale_points_limit();

-- Add index on sale_point_id for better query performance
CREATE INDEX idx_drops_sale_point_id ON drops(sale_point_id);