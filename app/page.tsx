'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import './globals.css';

export const dynamic = 'force-dynamic';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async () => {
    if (!email || !password) return alert('Preencha todos os campos.');
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      alert('Erro: ' + error.message);
    } else {
      router.push('/dashboard');
    }
    setLoading(false);
  };

  const handleResetPassword = async () => {
    if (!email) return alert('Digite seu e-mail primeiro.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) alert('Erro: ' + error.message);
    else alert('Link de recuperação enviado!');
  };

  return (
    <div className="login-card">
      <div className="brand-section">
        <h1>FisioHome</h1>
        <p>Prontuário Digital</p>
        <div style={{ width: '40px', height: '2px', background: '#D4B896', margin: '15px auto' }}></div>
      </div>

      <div className="input-group">
        <label>E-MAIL</label>
        <input 
          type="email" 
          placeholder="seu@email.com" 
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>

      <div className="input-group">
        <label>SENHA</label>
        <input 
          type="password" 
          placeholder="••••••••" 
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
      </div>

      <a href="#" className="forgot-password" onClick={(e) => { e.preventDefault(); handleResetPassword(); }}>
        Esqueci minha senha
      </a>

      <button className="btn-entrar" onClick={handleLogin} disabled={loading}>
        {loading ? 'Carregando...' : 'Entrar'}
      </button>
    </div>
  );
}