CREATE TABLE IF NOT EXISTS public.patients (
  id BIGINT PRIMARY KEY,
  name TEXT NOT NULL,
  birth TEXT,
  age TEXT,
  sex TEXT,
  diag TEXT NOT NULL,
  cpf TEXT,
  phone TEXT,
  cep TEXT,
  addr TEXT,
  city TEXT,
  obs TEXT,
  usuario_id TEXT NOT NULL,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Users can view their own patients
CREATE POLICY "Users can view own patients"
  ON public.patients FOR SELECT
  USING (usuario_id = auth.uid()::text OR usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Users can insert their own patients
CREATE POLICY "Users can insert own patients"
  ON public.patients FOR INSERT
  WITH CHECK (usuario_id = auth.uid()::text OR usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Users can update their own patients
CREATE POLICY "Users can update own patients"
  ON public.patients FOR UPDATE
  USING (usuario_id = auth.uid()::text OR usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Users can delete their own patients
CREATE POLICY "Users can delete own patients"
  ON public.patients FOR DELETE
  USING (usuario_id = auth.uid()::text OR usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()));

-- Admins can see all patients
CREATE POLICY "Admin can view all patients"
  ON public.patients FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
