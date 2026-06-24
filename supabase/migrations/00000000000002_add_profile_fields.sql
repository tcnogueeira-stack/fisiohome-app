-- Add missing columns to profiles table used by the frontend
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS crp TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS spec TEXT DEFAULT '',
  ADD COLUMN IF NOT EXISTS addr TEXT DEFAULT '';
