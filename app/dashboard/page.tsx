'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Garanta que o caminho aponta corretamente para a pasta lib

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    // Proteção de rota simples: se não houver sessão ativa, volta ao login
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/');
      }
    };
    checkSession();
  }, [router]);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Painel de Controle - FisioHome</h1>
      <p>Bem-vindo! Esta é a página principal do seu dashboard.</p>
      {/* A sua tabela ou lista de pacientes entra aqui */}
    </div>
  );
}