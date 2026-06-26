ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS professional_name TEXT;

CREATE INDEX IF NOT EXISTS idx_patients_professional_name ON public.patients(professional_name);
