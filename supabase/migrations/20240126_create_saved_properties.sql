-- Create saved_properties table for users to save their favorite listings
CREATE TABLE IF NOT EXISTS saved_properties (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  listing_id TEXT NOT NULL,
  listing_type TEXT NOT NULL DEFAULT 'mls', -- 'mls' or 'off_market'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure a user can only save a property once
  UNIQUE(user_id, listing_id, listing_type)
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_saved_properties_user_id ON saved_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_properties_listing_id ON saved_properties(listing_id);

-- Enable Row Level Security
ALTER TABLE saved_properties ENABLE ROW LEVEL SECURITY;

-- Users can only see their own saved properties
CREATE POLICY "Users can view own saved properties"
  ON saved_properties FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own saved properties
CREATE POLICY "Users can insert own saved properties"
  ON saved_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can delete their own saved properties
CREATE POLICY "Users can delete own saved properties"
  ON saved_properties FOR DELETE
  USING (auth.uid() = user_id);
