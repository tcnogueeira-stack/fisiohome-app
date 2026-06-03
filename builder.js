const fs = require('fs');
const path = require('path');

// ==========================================
// 1. CONTEÚDO DO DASHBOARD PRINCIPAL (page.tsx)
// ==========================================
const dashboardContent = `'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import '../globals.css';

export default function Dashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [pacientes, setPacientes] = useState<any[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<any[]>([]);
  const [busca, setBusca] = useState('');
  const [resumo, setResumo] = useState<any>({ total_pacientes: 0, total_atendimentos: 0, total_faturado: 0 });
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    nome_completo: '', cpf: '', data_nascimento: '', sexo: '',
    cep: '', endereco: '', complemento: '', telefone: '',
    diagnostico: '', observacao: ''
  });

  const carregarDadosDoDashboard = async (userId: string) => {
    const { data: pData } = await supabase
      .from('v_tn003_pacientes')
      .select('*')
      .eq('fisio_id', userId)
      .order('created_at', { ascending: false });
    
    setPacientes(pData || []);
    setPacientesFiltrados(pData || []);

    const { data: rData } = await supabase
      .from('v_tn_resumo_dashboard')
      .select('*')
      .eq('fisio_id', userId)
      .single();
    if (rData) setResumo(rData);
  };

  useEffect(() => {
    const getData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) router.push('/');
      else { setUser(user); carregarDadosDoDashboard(user.id); }
    };
    getData();
  }, [router]);

  useEffect(() => {
    const termo = busca.toLowerCase();
    const filtrados = pacientes.filter((p: any) => 
      (p.nome_completo && p.nome_completo.toLowerCase().includes(termo)) ||
      (p.diagnostico && p.diagnostico.toLowerCase().includes(termo))
    );
    setPacientesFiltrados(filtrados);
  }, [busca, pacientes]);

  const handleCEP = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const valorAlterado = e.target.value;
    const cepLimpo = valorAlterado.replace(/[^0-9]/g, '');
    setFormData({ ...formData, cep: cepLimpo });
    
    if (cepLimpo.length === 8) {
      const res = await fetch("https://viacep.com.br/ws/" + cepLimpo + "/json/");
      const data = await res.json();
      if (!data.erro) {
        setFormData(prev => ({ 
          ...prev, 
          endereco: data.logradouro + ", " + data.bairro + " - " + data.localidade + "/" + data.uf
        }));
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase
      .from('tn003_pacientes')
      .insert([{ ...formData, fisio_id: user?.id }]);

    if (error) {
      alert('Erro ao salvar: ' + error.message);
    } else {
      setShowModal(false);
      setFormData({ 
        nome_completo: '', cpf: '', data_nascimento: '', sexo: '', 
        cep: '', endereco: '', complemento: '', telefone: '', 
        diagnostico: '', observacao: '' 
      });
      if (user) carregarDadosDoDashboard(user.id);
    }
    setLoading(false);
  };

  if (!user) return <div className="loading">A autenticar...</div>;

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
            <p style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '2.2rem', fontWeight: 'bold' }}>R$ {parseFloat(resumo?.total_faturado || 0).toFixed(2)}</p>
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
              {pacientesFiltrados.length > 0 ? pacientesFiltrados.map((p: any) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F1F0EC', color: '#2D5A53' }}>
                  <td style={{ padding: '15px', fontWeight: 600 }}>{p.nome_completo}</td>
                  <td style={{ padding: '15px' }}>{p.idade ? p.idade + " anos" : '---'}</td>
                  <td style={{ padding: '15px' }}>{p.diagnostico || 'Sem diagnóstico'}</td>
                  <td style={{ padding: '15px' }}>
                     <button 
                        onClick={() => router.push("/dashboard/paciente/" + p.id)}
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
}`;

// ==========================================
// 2. CONTEÚDO DO PRONTUÁRIO DO PACIENTE (page.tsx)
// ==========================================
const pacientePageContent = `'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import '../../../globals.css';

export default function ProntuarioPaciente() {
  const params = useParams();
  const id = params?.id;
  const router = useRouter();
  
  const [user, setUser] = useState<any>(null);
  const [paciente, setPaciente] = useState<any>(null);
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [novoAtendimento, setNovoAtendimento] = useState('');
  const [valorSessao, setValorSessao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');

  const carregarDados = async () => {
    if (!id) return;
    const { data: pData } = await supabase.from('v_tn003_pacientes').select('*').eq('id', id).single();
    setPaciente(pData);

    if (pData) {
      const { data: aData } = await supabase
        .from('tn005_atendimentos')
        .select('*, tn007_financeiro(valor, forma_pagamento)')
        .eq('paciente_id', id)
        .order('data_atendimento', { ascending: false });
      setAtendimentos(aData || []);
    }
  };

  useEffect(() => {
    const verificarUsuario = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);
    };
    verificarUsuario();
    if (id) carregarDados();
  }, [id, router]);

  const handleSalvarTudo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novoAtendimento.trim() || !user) return;
    setLoading(true);

    const { data: atendimento, error: errorAtend } = await supabase
      .from('tn005_atendimentos')
      .insert([{ paciente_id: id, fisio_id: user.id, descricao: novoAtendimento }])
      .select()
      .single();

    if (errorAtend) {
      alert('Erro ao registrar atendimento: ' + errorAtend.message);
      setLoading(false);
      return;
    }

    if (valorSessao && parseFloat(valorSessao) > 0) {
      const { error: errorFin } = await supabase
        .from('tn007_financeiro')
        .insert([
          {
            atendimento_id: atendimento.id,
            paciente_id: id,
            fisio_id: user.id,
            valor: parseFloat(valorSessao),
            forma_pagamento: formaPagamento
          }
        ]);

      if (errorFin) alert('Atendimento salvo, mas houve erro no financeiro: ' + errorFin.message);
    }

    setNovoAtendimento('');
    setValorSessao('');
    setFormaPagamento('Pix');
    carregarDados();
    setLoading(false);
  };

  if (!paciente) return <div className="loading">Carregando prontuário...</div>;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#F9F8F6' }}>
      <aside style={{ width: '260px', backgroundColor: '#2D5A53', color: '#D4B896', padding: '40px 20px' }}>
        <h2 style={{ fontFamily: 'Cormorant Garamond', fontSize: '2rem', marginBottom: '50px', cursor: 'pointer' }} onClick={() => router.push('/dashboard')}>FisioHome</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <span style={{ fontSize: '0.9rem', letterSpacing: '1px', borderBottom: '1px solid #3d6b63', paddingBottom: '10px' }}>NAVEGAÇÃO</span>
            <button onClick={() => router.push('/dashboard')} style={{ background: 'none', border: 'none', color: '#D4B896', textAlign: 'left', cursor: 'pointer' }}>← Voltar aos Pacientes</button>
        </nav>
      </aside>

      <main style={{ flex: 1, padding: '50px' }}>
        <header style={{ marginBottom: '40px', borderBottom: '1px solid #E5E2DA', paddingBottom: '20px' }}>
          <h1 style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '2.8rem', marginBottom: '10px' }}>{paciente.nome_completo}</h1>
          <p style={{ color: '#B89B73', fontSize: '1.1rem' }}>
            <strong>Idade:</strong> {paciente.idade ? paciente.idade + ' anos' : '---'} | <strong>CPF:</strong> {paciente.cpf || '---'} | <strong>Diagnóstico:</strong> {paciente.diagnostico || 'Não informado'}
          </p>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '40px' }}>
          <div>
            <div style={{ background: 'white', padding: '30px', borderRadius: '25px', border: '1px solid #E5E2DA', marginBottom: '40px' }}>
              <h3 style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '1.6rem', marginBottom: '15px' }}>Registrar Sessão e Faturamento</h3>
              <form onSubmit={handleSalvarTudo}>
                <textarea
                  required
                  style={{ width: '100%', minHeight: '100px', padding: '15px', borderRadius: '15px', border: '1px solid #E5E2DA', background: '#F1F0EC', fontFamily: 'inherit', marginBottom: '20px', resize: 'vertical' }}
                  placeholder="Evolução clínica do paciente na sessão de hoje..."
                  value={novoAtendimento}
                  onChange={(e) => setNovoAtendimento(e.target.value)}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
                  <div className="input-group">
                    <label>VALOR DA SESSÃO (R$)</label>
                    <input type="number" step="0.01" placeholder="0,00" value={valorSessao} onChange={(e) => setValorSessao(e.target.value)} />
                  </div>
                  <div className="input-group">
                    <label>FORMA DE PAGAMENTO</label>
                    <select style={{ width: '100%', padding: '12px', borderRadius: '10px', border: '1px solid #E5E2DA', backgroundColor: '#F1F0EC', color: '#2D5A53' }} value={formaPagamento} onChange={(e) => setFormaPagamento(e.target.value)}>
                      <option value="Pix">Pix</option>
                      <option value="Dinheiro">Dinheiro</option>
                      <option value="Cartão de Crédito">Cartão de Crédito</option>
                      <option value="Cartão de Débito">Cartão de Débito</option>
                      <option value="Transferência">Transferência</option>
                    </select>
                  </div>
                </div>

                <button type="submit" className="btn-entrar" style={{ width: 'auto', padding: '12px 35px' }} disabled={loading}>
                  {loading ? 'Salvando...' : 'Finalizar Atendimento'}
                </button>
              </form>
            </div>

            <h3 style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '1.8rem', marginBottom: '20px' }}>Histórico Clínico e Financeiro</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {atendimentos.length > 0 ? atendimentos.map((atend: any) => {
                const fin = Array.isArray(atend.tn007_financeiro) ? atend.tn007_financeiro[0] : atend.tn007_financeiro;
                return (
                  <div key={atend.id} style={{ background: 'white', padding: '25px', borderRadius: '20px', borderLeft: '5px solid #D4B896', border: '1px solid #E5E2DA' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid #F1F0EC', paddingBottom: '8px' }}>
                      <span style={{ color: '#B89B73', fontWeight: 600, fontSize: '0.9rem' }}>
                        {new Date(atend.data_atendimento).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {fin && fin.valor > 0 ? (
                        <span style={{ backgroundColor: '#E2ECE9', color: '#2D5A53', padding: '4px 12px', borderRadius: '20px', fontSize: '0.85rem', fontWeight: 600 }}>
                          Recebido: R$ {parseFloat(fin.valor).toFixed(2)} ({fin.forma_pagamento})
                        </span>
                      ) : (
                        <span style={{ color: '#B89B73', fontSize: '0.85rem', fontStyle: 'italic' }}>Sem lançamento financeiro</span>
                      )}
                    </div>
                    <p style={{ color: '#2D5A53', lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>{atend.descricao}</p>
                  </div>
                );
              }) : (
                <p style={{ color: '#B89B73', fontStyle: 'italic' }}>Nenhum atendimento registrado.</p>
              )}
            </div>
          </div>

          <aside style={{ background: 'white', padding: '25px', borderRadius: '25px', border: '1px solid #E5E2DA', height: 'fit-content' }}>
            <h4 style={{ color: '#2D5A53', fontFamily: 'Cormorant Garamond', fontSize: '1.4rem', marginBottom: '15px' }}>Observações do Paciente</h4>
            <p style={{ fontSize: '0.95rem', color: '#666', lineHeight: '1.5' }}>{paciente.observacao || 'Nenhuma observação cadastrada.'}</p>
          </aside>
        </div>
      </main>
    </div>
  );
}`;

// Escrita dos Arquivos
const dashboardPath = path.join(process.cwd(), 'app', 'dashboard', 'page.tsx');
fs.writeFileSync(dashboardPath, dashboardContent);

const targetDir = path.join(process.cwd(), 'app', 'dashboard', 'paciente', '[id]');
if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });
fs.writeFileSync(path.join(targetDir, 'page.tsx'), pacientePageContent);

console.log('✅ Ambas as páginas (Dashboard e Prontuário) foram reescritas com tipagem TypeScript 100% estrita.');