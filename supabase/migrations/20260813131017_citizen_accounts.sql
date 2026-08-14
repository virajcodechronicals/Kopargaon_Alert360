CREATE TABLE citizen_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Drop the FK from profiles to auth.users if we are bypassing Supabase Auth for citizens
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_id_fkey;

-- Now link citizen_accounts to profiles by inserting into profiles whenever a citizen_account is created
CREATE OR REPLACE FUNCTION handle_new_citizen_account()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, role)
  VALUES (new.id, 'citizen');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_citizen_account_created
  AFTER INSERT ON citizen_accounts
  FOR EACH ROW EXECUTE PROCEDURE handle_new_citizen_account();
