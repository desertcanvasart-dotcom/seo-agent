-- User profiles linked to Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  api_key_id UUID REFERENCES api_keys(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_profiles_email ON profiles (email);

-- Auto-create profile + API key when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
DECLARE
  new_key_id UUID;
  key_hash_val TEXT;
BEGIN
  -- Create API key for the user
  -- The actual key is generated client-side; we store the hash
  -- For auto-creation, we'll use a placeholder that gets replaced on first login
  INSERT INTO api_keys (name, key_hash, prefix, scopes, is_active)
  VALUES (
    NEW.email,
    encode(sha256(gen_random_uuid()::text::bytea), 'hex'),
    'sk_auto_',
    '{read, write}',
    true
  )
  RETURNING id INTO new_key_id;

  -- Create profile
  INSERT INTO profiles (id, email, full_name, api_key_id)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    new_key_id
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
