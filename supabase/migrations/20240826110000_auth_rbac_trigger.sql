-- Function to automatically handle new user registration from Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::public.user_role, 'staff'::public.user_role),
    NEW.raw_user_meta_data->>'avatar_url'
  )
  ON CONFLICT (id) DO UPDATE SET
    full_name = EXCLUDED.full_name,
    email = EXCLUDED.email,
    role = COALESCE(EXCLUDED.role, profiles.role),
    updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to execute whenever a new auth user is created
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Helper function to check if the current requesting user is an Admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- RLS Policy Adjustments for RBAC
-- Profiles: Everyone authenticated can read profiles; Users can update their own; Admins can update any
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON profiles;
CREATE POLICY "Allow authenticated users to read all profiles" ON profiles
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow users to update own profile" ON profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE POLICY "Allow admin to manage all profiles" ON profiles
  FOR ALL TO authenticated USING (public.is_admin());

-- Audit Logs: Only admins can read audit logs
DROP POLICY IF EXISTS "Allow full access to authenticated users" ON audit_logs;
CREATE POLICY "Allow admin to view audit logs" ON audit_logs
  FOR SELECT TO authenticated USING (public.is_admin());

CREATE POLICY "Allow system to insert audit logs" ON audit_logs
  FOR INSERT TO authenticated WITH CHECK (true);
