-- 14. Planner Entity (Content Planner / TaskList)

-- Enums
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planner_task_status') THEN
    CREATE TYPE public.planner_task_status AS ENUM (
      'Not Started',
      'Pending',
      'Under Review',
      'Completed'
    );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'planner_task_priority') THEN
    CREATE TYPE public.planner_task_priority AS ENUM (
      'Low',
      'Medium',
      'Urgent'
    );
  END IF;
END $$;

-- Sequence & Auto Task Code Generator (e.g. PLN-01, PLN-02, ...)
CREATE SEQUENCE IF NOT EXISTS public.planner_task_code_seq START 1;

CREATE OR REPLACE FUNCTION public.generate_planner_task_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.task_code IS NULL OR btrim(NEW.task_code) = '' THEN
    NEW.task_code := 'PLN-' || LPAD(nextval('public.planner_task_code_seq')::TEXT, 2, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Main Planner Tasks Table
CREATE TABLE IF NOT EXISTS public.planner_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_code TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  status public.planner_task_status NOT NULL DEFAULT 'Not Started',
  priority public.planner_task_priority NOT NULL DEFAULT 'Medium',
  position INTEGER NOT NULL DEFAULT 0,
  start_date TIMESTAMPTZ,
  due_date TIMESTAMPTZ,
  channel TEXT,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS trg_generate_planner_task_code ON public.planner_tasks;
CREATE TRIGGER trg_generate_planner_task_code
  BEFORE INSERT ON public.planner_tasks
  FOR EACH ROW EXECUTE FUNCTION public.generate_planner_task_code();

DROP TRIGGER IF EXISTS set_planner_tasks_updated_at ON public.planner_tasks;
CREATE TRIGGER set_planner_tasks_updated_at
  BEFORE UPDATE ON public.planner_tasks
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_planner_tasks_status_position
  ON public.planner_tasks (status, position);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_due_date
  ON public.planner_tasks (due_date);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_priority
  ON public.planner_tasks (priority);
CREATE INDEX IF NOT EXISTS idx_planner_tasks_created_by
  ON public.planner_tasks (created_by);

-- Assignees Join Table (Many-to-Many with profiles)
CREATE TABLE IF NOT EXISTS public.planner_task_assignees (
  task_id UUID NOT NULL REFERENCES public.planner_tasks(id) ON DELETE CASCADE,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (task_id, profile_id)
);

CREATE INDEX IF NOT EXISTS idx_planner_task_assignees_profile_id
  ON public.planner_task_assignees (profile_id);

-- Comments Table
CREATE TABLE IF NOT EXISTS public.planner_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES public.planner_tasks(id) ON DELETE CASCADE,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS set_planner_task_comments_updated_at ON public.planner_task_comments;
CREATE TRIGGER set_planner_task_comments_updated_at
  BEFORE UPDATE ON public.planner_task_comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX IF NOT EXISTS idx_planner_task_comments_task_created
  ON public.planner_task_comments (task_id, created_at);

-- Atomic RPC for moving Kanban tasks
CREATE OR REPLACE FUNCTION public.rpc_move_planner_task(
  p_task_id UUID,
  p_new_status public.planner_task_status,
  p_new_position INTEGER
)
RETURNS VOID AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Akses ditolak: Hanya Administrator yang dapat memindahkan tugas Planner.';
  END IF;

  UPDATE public.planner_tasks
  SET
    status = p_new_status,
    position = p_new_position,
    updated_at = NOW()
  WHERE id = p_task_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Tugas planner tidak ditemukan.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Row Level Security (Admin Only per Design.md)
ALTER TABLE public.planner_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_task_assignees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_task_comments ENABLE ROW LEVEL SECURITY;

-- planner_tasks policies
DROP POLICY IF EXISTS "Allow admin to select planner_tasks" ON public.planner_tasks;
CREATE POLICY "Allow admin to select planner_tasks" ON public.planner_tasks
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to insert planner_tasks" ON public.planner_tasks;
CREATE POLICY "Allow admin to insert planner_tasks" ON public.planner_tasks
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to update planner_tasks" ON public.planner_tasks;
CREATE POLICY "Allow admin to update planner_tasks" ON public.planner_tasks
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to delete planner_tasks" ON public.planner_tasks;
CREATE POLICY "Allow admin to delete planner_tasks" ON public.planner_tasks
  FOR DELETE TO authenticated USING (public.is_admin());

-- planner_task_assignees policies
DROP POLICY IF EXISTS "Allow admin to select planner_task_assignees" ON public.planner_task_assignees;
CREATE POLICY "Allow admin to select planner_task_assignees" ON public.planner_task_assignees
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to insert planner_task_assignees" ON public.planner_task_assignees;
CREATE POLICY "Allow admin to insert planner_task_assignees" ON public.planner_task_assignees
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to update planner_task_assignees" ON public.planner_task_assignees;
CREATE POLICY "Allow admin to update planner_task_assignees" ON public.planner_task_assignees
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to delete planner_task_assignees" ON public.planner_task_assignees;
CREATE POLICY "Allow admin to delete planner_task_assignees" ON public.planner_task_assignees
  FOR DELETE TO authenticated USING (public.is_admin());

-- planner_task_comments policies
DROP POLICY IF EXISTS "Allow admin to select planner_task_comments" ON public.planner_task_comments;
CREATE POLICY "Allow admin to select planner_task_comments" ON public.planner_task_comments
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to insert planner_task_comments" ON public.planner_task_comments;
CREATE POLICY "Allow admin to insert planner_task_comments" ON public.planner_task_comments
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to update planner_task_comments" ON public.planner_task_comments;
CREATE POLICY "Allow admin to update planner_task_comments" ON public.planner_task_comments
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Allow admin to delete planner_task_comments" ON public.planner_task_comments;
CREATE POLICY "Allow admin to delete planner_task_comments" ON public.planner_task_comments
  FOR DELETE TO authenticated USING (public.is_admin());
