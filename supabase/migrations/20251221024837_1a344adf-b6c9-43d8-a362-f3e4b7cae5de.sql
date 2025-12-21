-- Drop the existing check constraint and add the new one with additional values
ALTER TABLE drops DROP CONSTRAINT IF EXISTS drops_drop_type_check;
ALTER TABLE drops ADD CONSTRAINT drops_drop_type_check 
  CHECK (drop_type = ANY (ARRAY['detailed', 'simple', 'quick', 'template']));