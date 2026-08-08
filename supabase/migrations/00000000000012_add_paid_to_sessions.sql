-- Add paid (recebido/liquidado) column to sessions table for payment tracking

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS paid BOOLEAN NOT NULL DEFAULT false;
