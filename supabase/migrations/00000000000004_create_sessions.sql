CREATE TABLE IF NOT EXISTS public.sessions (
  id BIGINT PRIMARY KEY,
  patient_id BIGINT NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  date TEXT NOT NULL,
  num INT NOT NULL,
  evolucao TEXT NOT NULL DEFAULT '(sem registro)',
  pa TEXT DEFAULT '—',
  spo2 TEXT DEFAULT '—',
  fc TEXT DEFAULT '—',
  pain INT DEFAULT 0,
  procs JSONB DEFAULT '[]'::jsonb,
  obs TEXT DEFAULT '',
  signed BOOLEAN NOT NULL DEFAULT false,
  signed_at TIMESTAMPTZ,
  professional JSONB,
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- Users can view sessions linked to their patients
CREATE POLICY "Users can view own sessions"
  ON public.sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
  );

-- Users can insert sessions for their patients
CREATE POLICY "Users can insert own sessions"
  ON public.sessions FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
  );

-- Users can update their own sessions
CREATE POLICY "Users can update own sessions"
  ON public.sessions FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
  );

-- Users can delete their own sessions
CREATE POLICY "Users can delete own sessions"
  ON public.sessions FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.patients
      WHERE patients.id = sessions.patient_id
        AND (patients.usuario_id = auth.uid()::text OR patients.usuario_id = (SELECT email FROM public.profiles WHERE id = auth.uid()))
    )
  );

-- Admins can see all sessions
CREATE POLICY "Admin can view all sessions"
  ON public.sessions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_sessions_patient_id ON public.sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_sessions_date ON public.sessions(date);
CREATE INDEX IF NOT EXISTS idx_patients_usuario_id ON public.patients(usuario_id);
