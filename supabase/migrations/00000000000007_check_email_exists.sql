-- Security definer function to check if an email exists in profiles (bypasses RLS)
-- Used by the forgot-password flow to validate email before sending reset link

CREATE OR REPLACE FUNCTION public.check_email_exists(p_email TEXT)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE email = p_email);
$$;
