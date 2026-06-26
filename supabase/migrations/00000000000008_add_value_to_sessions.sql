-- Add value (monetary) column to sessions table for revenue tracking

ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS value NUMERIC DEFAULT 0;
