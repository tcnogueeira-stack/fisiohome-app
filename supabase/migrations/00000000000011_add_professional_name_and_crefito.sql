-- Add professional_name and crefito columns to sessions table
ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS professional_name TEXT,
  ADD COLUMN IF NOT EXISTS crefito TEXT;

-- Add crefito column to patients table
ALTER TABLE public.patients
  ADD COLUMN IF NOT EXISTS crefito TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_professional_name ON public.sessions(professional_name);
CREATE INDEX IF NOT EXISTS idx_patients_crefito ON public.patients(crefito);
