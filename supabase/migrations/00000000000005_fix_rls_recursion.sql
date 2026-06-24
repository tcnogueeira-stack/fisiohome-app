-- Fix infinite recursion in RLS policies caused by subqueries reading public.profiles
-- from within policies on the same table.

-- Security definer function to check admin role (bypasses RLS)
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin');
$$;

-- Security definer function to get current user's email (bypasses RLS)
CREATE OR REPLACE FUNCTION public.my_email()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT email FROM public.profiles WHERE id = auth.uid();
$$;

-- ── Fix profiles policies ──

DROP POLICY IF EXISTS "Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can insert profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admin can update any profile" ON public.profiles;

CREATE POLICY "Admin can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admin can insert profiles"
  ON public.profiles FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admin can update any profile"
  ON public.profiles FOR UPDATE
  USING (public.is_admin());

-- ── Fix patients policies ──

DROP POLICY IF EXISTS "Users can view own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can insert own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can update own patients" ON public.patients;
DROP POLICY IF EXISTS "Users can delete own patients" ON public.patients;
DROP POLICY IF EXISTS "Admin can view all patients" ON public.patients;

CREATE POLICY "Users can view own patients"
  ON public.patients FOR SELECT
  USING (usuario_id = auth.uid()::text OR usuario_id = public.my_email());

CREATE POLICY "Users can insert own patients"
  ON public.patients FOR INSERT
  WITH CHECK (usuario_id = auth.uid()::text OR usuario_id = public.my_email());

CREATE POLICY "Users can update own patients"
  ON public.patients FOR UPDATE
  USING (usuario_id = auth.uid()::text OR usuario_id = public.my_email());

CREATE POLICY "Users can delete own patients"
  ON public.patients FOR DELETE
  USING (usuario_id = auth.uid()::text OR usuario_id = public.my_email());

CREATE POLICY "Admin can view all patients"
  ON public.patients FOR SELECT
  USING (public.is_admin());

-- ── Fix sessions policies ──

DROP POLICY IF EXISTS "Users can view own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can insert own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can update own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Users can delete own sessions" ON public.sessions;
DROP POLICY IF EXISTS "Admin can view all sessions" ON public.sessions;

CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = public.my_email())
    )
  );

CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = public.my_email())
    )
  );

CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = public.my_email())
    )
  );

CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = public.my_email())
    )
  );

CREATE POLICY "Admin can view all sessions"
  ON public.sessions FOR SELECT
  USING (public.is_admin());
