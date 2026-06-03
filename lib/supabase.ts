import { createClient } from '@supabase/supabase-js';

// Buscamos as variáveis ou deixamos uma string vazia caso a Vercel não as veja no build
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Se as variáveis estiverem vazias durante a compilação, passamos dados fictícios 
// para o Next.js não estourar o erro 'throw new Error' e travar o build.
export const supabase = createClient(
  supabaseUrl || 'https://placeholder-url-for-build.supabase.co', 
  supabaseAnonKey || 'placeholder-key'
);