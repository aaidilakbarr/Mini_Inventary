-- Create custom types
CREATE TYPE user_role AS ENUM ('admin', 'staff');
CREATE TYPE inventory_status AS ENUM ('Available', 'Borrowed', 'Maintenance', 'Lost', 'Retired');
CREATE TYPE borrowing_status AS ENUM ('Pending Approval', 'Approved', 'Borrowed', 'Returned', 'Rejected');
CREATE TYPE billing_cycle AS ENUM ('Monthly', 'Quarterly', 'Semi-Annually', 'Yearly', 'Custom');
CREATE TYPE subscription_status AS ENUM ('Active', 'Cancelled', 'Expired', 'Past Due');
CREATE TYPE reminder_status AS ENUM ('Upcoming', 'Due Today', 'Overdue', 'Completed', 'Dismissed');

-- Profiles table (extends auth.users)
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'staff',
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Categories table
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL, -- 'inventory', 'subscription', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Inventories table
CREATE TABLE inventories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  condition TEXT,
  location TEXT,
  purchase_info JSONB,
  supplier TEXT,
  warranty_info TEXT,
  photo_url TEXT,
  status inventory_status NOT NULL DEFAULT 'Available',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Borrowings table
CREATE TABLE borrowings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventories(id) ON DELETE CASCADE,
  borrower_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  request_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ NOT NULL,
  return_date TIMESTAMPTZ,
  status borrowing_status NOT NULL DEFAULT 'Pending Approval',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_name TEXT NOT NULL,
  provider TEXT,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  cost DECIMAL(12, 2) NOT NULL DEFAULT 0.00,
  billing_cycle billing_cycle NOT NULL,
  start_date TIMESTAMPTZ,
  next_billing_date TIMESTAMPTZ NOT NULL,
  payment_method TEXT,
  status subscription_status NOT NULL DEFAULT 'Active',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reminders table
CREATE TABLE reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  source_type TEXT NOT NULL, -- 'inventory', 'borrowing', 'subscription', 'maintenance', 'manual'
  source_id UUID,
  due_date TIMESTAMPTZ NOT NULL,
  status reminder_status NOT NULL DEFAULT 'Upcoming',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Functions
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER set_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_inventories_updated_at BEFORE UPDATE ON inventories FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_borrowings_updated_at BEFORE UPDATE ON borrowings FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION set_updated_at();
CREATE TRIGGER set_reminders_updated_at BEFORE UPDATE ON reminders FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Basic RLS setup
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE borrowings ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Development policies
CREATE POLICY "Allow full access to authenticated users" ON profiles FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON categories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON inventories FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON borrowings FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON subscriptions FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON reminders FOR ALL TO authenticated USING (true);
CREATE POLICY "Allow full access to authenticated users" ON audit_logs FOR ALL TO authenticated USING (true);
