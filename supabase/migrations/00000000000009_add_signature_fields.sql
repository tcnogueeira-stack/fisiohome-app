ALTER TABLE public.sessions
  ADD COLUMN IF NOT EXISTS signed_by TEXT,
  ADD COLUMN IF NOT EXISTS user_agent TEXT,
  ADD COLUMN IF NOT EXISTS token TEXT;

CREATE INDEX IF NOT EXISTS idx_sessions_token ON public.sessions(token);
