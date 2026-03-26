-- Add a short, human-readable family code to tenants so kids can
-- find their family on the public kid-login page without a UUID.
-- Generated automatically as 6 uppercase alphanumeric characters.

CREATE OR REPLACE FUNCTION generate_family_code()
RETURNS text AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$ LANGUAGE plpgsql;

ALTER TABLE tenants ADD COLUMN family_code text UNIQUE;

-- Backfill existing tenants
UPDATE tenants SET family_code = generate_family_code() WHERE family_code IS NULL;

ALTER TABLE tenants ALTER COLUMN family_code SET NOT NULL;
ALTER TABLE tenants ALTER COLUMN family_code SET DEFAULT generate_family_code();
