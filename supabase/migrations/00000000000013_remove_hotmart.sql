-- Remove Hotmart references from profiles (migration to Asaas)
-- Safe for the already-applied production schema.

-- Drop the created_from column (also drops its CHECK constraint)
ALTER TABLE public.profiles DROP COLUMN IF EXISTS created_from;

-- Replace trigger function so new users are inserted without created_from
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, phone, cpf, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'name', 'Fisioterapeuta'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'cpf', ''),
    'user'
  );
  RETURN NEW;
END;
$$;
