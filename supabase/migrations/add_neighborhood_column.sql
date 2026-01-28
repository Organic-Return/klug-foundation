-- Add neighborhood column to mls_properties table
-- Run this in your Supabase SQL Editor

ALTER TABLE mls_properties
ADD COLUMN IF NOT EXISTS neighborhood TEXT;

-- Create an index for faster neighborhood searches
CREATE INDEX IF NOT EXISTS idx_mls_properties_neighborhood
ON mls_properties(neighborhood);

-- Optional: Update existing records with neighborhood data
-- You can populate this from your MLS data source or manually
-- Example: UPDATE mls_properties SET neighborhood = 'Downtown' WHERE city = 'Aspen' AND address ILIKE '%downtown%';
