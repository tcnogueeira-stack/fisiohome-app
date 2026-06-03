'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import '../globals.css';

// Definição estrita das estruturas de dados do banco
interface Paciente {
  id: string;
  nome_completo: string;
  idade?: number;
  diagnostico?: string;
  cpf?: string;
  data_nascimento?: string;
  sexo?: string;
  cep?: string;
  endereco?: string;
  complemento?: string;
  telefone?: string;
  observacao?: string;
}

interface ResumoDashboard {
  total_pacientes: number;
  total_atendimentos: number;
  total_faturado: number;
}

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([]);
  const [busca, setBusca] = useState('');
  const [resumo, setResumo] = useState<ResumoDashboard>({ total_pacientes: 0, total_atendimentos: 0, total_faturado: 0 });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '', cpf: '', data_nascimento: '', sexo: '',
    cep: '', endereco: '', complemento: '', telefone: '',
    diagnostico: '', observacao: ''
  });

  const carregarDadosDoDashboard = async (userId: string) => {
    // Busca lista de pacientes na View
    const { data: pData } = await supabase
      .from('v_tn003_pacientes')
      .select('*')
      .eq('fisio_id', userId)
      .order('created_at', { ascending: false });
    
    const listaPacientes = (pData as Paciente[]) || [];
    setPacientes(listaPacientes);
    setPacientesFiltrados(listaPacientes);

    // Busca sumário financeiro e de atendimentos
    const { data: rData } = await supabase
      .from('v_tn_resumo_dashboard')
      .select('*')
      .eq('fisio_id', userId)
      .single();
    
    if (rData) setResumo(rData as ResumoDashboard);
  };

  useEffect(() => {
    const getData = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser();
      if (!sessionUser) {
        router.push('/');
      } else { 
        setUser(sessionUser); 
        carregarDadosDoDashboard(sessionUser.id); 
      }
    };
    getData();
  }, [router]);

  useEffect(() => {
    const termo = busca.toLowerCase();
    const filtrados = pacientes.filter((p) => 
      (p.nome_completo && p.nome_completo.toLowerCase().includes(termo)) ||
      (p.diagnostico && p.diagnostico.toLowerCase().includes(termo))
    );
    setPacientesFiltrados(filtrados);
  }, [busca, pacientes]);

  const handleCEP = async (e: ChangeEvent<HTMLInputElement>) => {
    const valorAlterado = e.target.value;
    const cepLimpo = valorAlterado.replace(/[^0-9]/g, '');
    setFormData({ ...formData, cep: cepLimpo });
    
    if (cepLimpo.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({ 
            ...prev, 
            endereco: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`
          }));
        }
      } catch (err) {
        console.error("Erro ao buscar CEP", err);
      }
    }
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    if (!user?.id) return;
    
    setLoading(true);
    const { error } = await supabase
      .from('tn003_pacientes')
      .insert([{ ...formData, fisio_id: user.id }]);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      setShowModal(false);
      setFormData({ 
        nome_completo: '', cpf: '', data_nascimento: '', sexo: '', 
        cep: '', endereco: '', complemento: '', telefone: '', 
        diagnostico: '', observacao: '' 
      });
      carregarDadosDoDashboard(user.id);
    }
    setLoading(false);
  };

  if (!user) return <div className="loading">Autenticando acesso...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9F8F6' }}>
      <aside style={{ width: '260px', backgroundColor: '#2D5A53', color: '#D4B896', padding: '40px 20px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', marginBottom: '50px' }}>FisioHome</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '0.9rem', letterSpacing: '1px', borderBottom: '1px solid #3d6b63', paddingBottom: '10px' }}>MENU PRINCIPAL</span>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#D4B896', textAlign: 'left', cursor: 'pointer', fontWeight: 'bold' }}>Pacientes</button>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '50px' }}>
        <header style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '40px' }}>
          <h1 style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '2.5rem' }}>Painel de Gestão</h1>
          <button className="btn-entrar" style={{ width: 'auto', padding: '12px 30px' }} onClick={() => setShowModal(true)}>+ Novo Paciente</button>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '25px', marginBottom: '40px' }}>
          <div style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #E5E2DA' }}>
            <h4 style={{ color: '#B89B73', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Faturamento (Mês)</h4>
            <p style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', fontWeight: 'bold' }}>R$ {Number(resumo?.total_faturado || 0).toFixed(2)}</p>
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #E5E2DA' }}>
            <h4 style={{ color: '#B89B73', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Atendimentos (Mês)</h4>
            <p style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', fontWeight: 'bold' }}>{resumo?.total_atendimentos || 0}</p>
          </div>
          <div style={{ background: 'white', padding: '25px', borderRadius: '20px', border: '1px solid #E5E2DA' }}>
            <h4 style={{ color: '#B89B73', fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '10px' }}>Pacientes Ativos</h4>
            <p style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', fontWeight: 'bold' }}>{resumo?.total_pacientes || 0}</p>
          </div>
        </section>

        <section style={{ background: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #E5E2DA', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', gap: '20px' }}>
            <h3 style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', whiteSpace: 'nowrap' }}>Lista de Clientes</h3>
            <input 
              type="text" 
              placeholder="🔍 Buscar por nome ou diagnóstico..." 
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              style={{ width: '100%', maxWidth: '380px', padding: '10px 15px', borderRadius: '12px', border: '1px solid #E5E2DA', backgroundColor: '#F1F0EC', color: '#2D5A53', fontSize: '0.95rem', outline: 'none' }}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ color: '#B89B73', borderBottom: '1px solid #E5E2DA' }}>
                <th style={{ padding: '15px' }}>NOME</th>
                <th style={{ padding: '15px' }}>IDADE</th>
                <th style={{ padding: '15px' }}>DIAGNÓSTICO</th>
                <th style={{ padding: '15px' }}>AÇÕES</th>
              </tr>
            </thead>
            <tbody>
              {pacientesFiltrados.length > 0 ? pacientesFiltrados.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F0EC', color: '#2D5A53' }}>
                  <td style={{ padding: '15px', fontWeight: 600 }}>{p.nome_completo}</td>
                  <td style={{ padding: '15px' }}>{p.idade ? `${p.idade} anos` : '---'}</td>
                  <td style={{ padding: '15px' }}>{p.diagnostico || 'Sem diagnóstico'}</td>
                  <td style={{ padding: '15px' }}>
                     <button 
                        onClick={() => router.push(`/dashboard/paciente/${p.id}`)}
                        style={{ background: '#F1F0EC', border: '1px solid #D4B896', color: '#2D5A53', padding: '8px 15px', borderRadius: '10px', cursor: 'pointer' }}
                     >
                       Prontuário
                     </button>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} style={{ padding: '30px', textAlign: 'center', color: '#B89B73' }}>Nenhum paciente encontrado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      </main>

      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', background: 'rgba(18, 43, 38, 0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, backdropFilter: 'blur(5px)' }}>
          <div style={{ background: '#F9F8F6', padding: '40px', borderRadius: '30px', width: '100%', maxWidth: '700px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '30px' }}>
                <h2 style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '2rem' }}>Ficha do Paciente</h2>
                <button onClick={() => setShowModal(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#2D5A53' }}>✕</button>
            </div>
            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>NOME COMPLETO</label><input required value={formData.nome_completo} onChange={e => setFormData({...formData, nome_completo: e.target.value})} /></div>
              <div className="input-group"><label>CPF</label><input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} /></div>
              <div className="input-group"><label>DATA NASCIMENTO</label><input type="date" value={formData.data_nascimento} onChange={e => setFormData({...formData, data_nascimento: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>DIAGNÓSTICO CLÍNICO</label><input value={formData.diagnostico} onChange={e => setFormData({...formData, diagnostico: e.target.value})} /></div>
              <div className="input-group"><label>CEP</label><input maxLength={8} value={formData.cep} onChange={handleCEP} /></div>
              <div className="input-group"><label>TELEFONE</label><input value={formData.telefone} onChange={e => setFormData({...formData, telefone: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>ENDEREÇO COMPLETO</label><input value={formData.endereco} onChange={e => setFormData({...formData, endereco: e.target.value})} /></div>
              <div style={{ gridColumn: 'span 2' }} className="input-group"><label>OBSERVAÇÕES INICIAIS</label><textarea style={{ width: '100%', padding: '15px', borderRadius: '15px', border: '1px solid #E5E2DA', minHeight: '80px' }} value={formData.observacao} onChange={e => setFormData({...formData, observacao: e.target.value})} /></div>
              <button type="submit" className="btn-entrar" style={{ gridColumn: 'span 2', marginTop: '10px' }} disabled={loading}>Confirmar Registro</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}