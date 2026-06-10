'use client';

import { useState, useEffect } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface Paciente {
  id: string;
  nome: string;
  idade: number | null;
  sexo: string | null;
  diagnostico_clinico: string;
  cpf: string | null;
  telefone: string | null;
  endereco: string | null;
}

export default function DashboardPage() {
  const supabase = createClientComponentClient();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPaciente, setSelectedPaciente] = useState<Paciente | null>(null);

  // Estados para o Modal de Criação
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [nome, setNome] = useState('');
  const [idade, setIdade] = useState('');
  const [sexo, setSexo] = useState('');
  const [diagnostico, setDiagnostico] = useState('');
  const [cpf, setCpf] = useState('');
  const [telefone, setTelefone] = useState('');
  const [endereco, setEndereco] = useState('');

  // Buscar pacientes da View banco de dados
  async function fetchPacientes() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('v_tn003_pacientes')
        .select('*')
        .order('nome', { ascending: true });

      if (error) throw error;
      if (data) {
        const mapped: Paciente[] = data.map((p: any) => ({
          id: p.id,
          nome: p.nome || 'Sem nome',
          idade: p.idade,
          sexo: p.sexo,
          diagnostico_clinico: p.diagnostico_clinico || 'Não informado',
          cpf: p.cpf,
          telefone: p.telefone,
          endereco: p.endereco
        }));
        setPacientes(mapped);
        
        // Mantém o paciente selecionado atualizado se ele ainda existir na lista
        if (selectedPaciente) {
          const atualizado = mapped.find(m => m.id === selectedPaciente.id);
          if (atualizado) setSelectedPaciente(atualizado);
        }
      }
    } catch (err) {
      console.error('Erro ao buscar pacientes:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchPacientes();
  }, []);

  // Cadastrar novo paciente no banco
  async function handleCreatePaciente(e: React.FormEvent) {
    e.preventDefault();
    if (!nome || !diagnostico) {
      alert('Nome e Diagnóstico são obrigatórios.');
      return;
    }

    try {
      const { error } = await supabase
        .from('tn003_pacientes')
        .insert([{
          nome,
          idade: idade ? parseInt(idade) : null,
          sexo: sexo || null,
          diagnostico_clinico: diagnostico,
          cpf: cpf || null,
          telefone: telefone || null,
          endereco: endereco || null
        }]);

      if (error) throw error;

      // Resetar formulário e fechar modal
      setNome('');
      setIdade('');
      setSexo('');
      setDiagnostico('');
      setCpf('');
      setTelefone('');
      setEndereco('');
      setIsModalOpen(false);
      
      // Recarregar lista
      fetchPacientes();
    } catch (err) {
      console.error('Erro ao cadastrar paciente:', err);
      alert('Erro ao salvar paciente no banco de dados.');
    }
  }

  // Cálculos de faturamento dinâmico baseado na regra de negócio
  const qtdPacientes = pacientes.length;
  const faturamentoEstimado = qtdPacientes * 1250; 

  return (
    <div style={{
      fontFamily: "'Nunito', sans-serif",
      backgroundColor: '#F8F4EE', // Creme sutil de fundo
      minHeight: '100vh',
      color: '#2C2A29',
      padding: '40px 20px'
    }}>
      
      {/* CABEÇALHO DA PÁGINA */}
      <header style={{
        maxWidth: '1200px',
        margin: '0 auto 40px auto',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', serif",
            fontSize: '32px',
            fontWeight: 700,
            color: '#0a5c52',
            margin: 0
          }}>FisioHome</h1>
          <p style={{ margin: '4px 0 0 0', opacity: 0.7, fontSize: '14px' }}>Prontuário Digital Corporativo</p>
        </div>

        <button 
          onClick={() => setIsModalOpen(true)}
          style={{
            backgroundColor: '#0a5c52',
            color: '#FEFCF9',
            border: 'none',
            padding: '12px 24px',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(10,92,82,0.15)',
            transition: 'all 0.2s ease'
          }}
        >
          + Novo Paciente
        </button>
      </header>

      {/* METRICAS E CONTEÚDO PRINCIPAL */}
      <main style={{
        maxWidth: '1200px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: selectedPaciente ? '1fr 380px' : '1fr',
        gap: '30px',
        alignItems: 'start',
        transition: 'grid-template-columns 0.3s ease'
      }}>
        
        {/* COLUNA DA ESQUERDA: CARDS + LISTAGEM */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          
          {/* CARDS RESUMO */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
            <div style={{
              backgroundColor: '#FEFCF9',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #EDD9C0',
              boxShadow: '0 4px 20px rgba(44,42,41,0.02)'
            }}>
              <span style={{ fontSize: '14px', opacity: 0.6, fontWeight: 500 }}>Atendimentos Ativos</span>
              <h2 style={{ fontSize: '28px', color: '#0a5c52', margin: '8px 0 0 0', fontWeight: 700 }}>{qtdPacientes}</h2>
            </div>

            <div style={{
              backgroundColor: '#FEFCF9',
              padding: '24px',
              borderRadius: '12px',
              border: '1px solid #EDD9C0',
              boxShadow: '0 4px 20px rgba(44,42,41,0.02)'
            }}>
              <span style={{ fontSize: '14px', opacity: 0.6, fontWeight: 500 }}>Faturamento Estimado</span>
              <h2 style={{ fontSize: '28px', color: '#B89870', margin: '8px 0 0 0', fontWeight: 700 }}>
                R$ {faturamentoEstimado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </h2>
            </div>
          </div>

          {/* TABELA DE PACIENTES */}
          <div style={{
            backgroundColor: '#FEFCF9',
            borderRadius: '12px',
            border: '1px solid #EDD9C0',
            overflow: 'hidden',
            boxShadow: '0 4px 20px rgba(44,42,41,0.02)'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ backgroundColor: '#FBF5EE', borderBottom: '1px solid #EDD9C0' }}>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#0a5c52' }}>PACIENTE</th>
                  <th style={{ padding: '16px 20px', fontSize: '13px', fontWeight: 600, color: '#0a5c52' }}>DIAGNÓSTICO CLÍNICO</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={2} style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>Carregando dados...</td>
                  </tr>
                ) : pacientes.length === 0 ? (
                  <tr>
                    <td colSpan={2} style={{ padding: '30px', textAlign: 'center', opacity: 0.5 }}>Nenhum paciente cadastrado.</td>
                  </tr>
                ) : (
                  pacientes.map((paciente) => {
                    const isSelected = selectedPaciente?.id === paciente.id;
                    return (
                      <tr 
                        key={paciente.id}
                        onClick={() => setSelectedPaciente(isSelected ? null : paciente)}
                        style={{
                          borderBottom: '1px solid #F1EAE0',
                          cursor: 'pointer',
                          backgroundColor: isSelected ? '#e5f4f2' : 'transparent',
                          transition: 'background-color 0.2s ease'
                        }}
                        onMouseEnter={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = '#FBF5EE'; }}
                        onMouseLeave={(e) => { if(!isSelected) e.currentTarget.style.backgroundColor = 'transparent'; }}
                      >
                        <td style={{ padding: '16px 20px' }}>
                          <div style={{ fontWeight: 600, color: '#2C2A29' }}>{paciente.nome}</div>
                          <div style={{ fontSize: '12px', opacity: 0.6, marginTop: '2px' }}>
                            {paciente.idade ? `${paciente.idade} anos` : 'Idade não informada'} • {paciente.sexo || 'Não informado'}
                          </div>
                        </td>
                        <td style={{ padding: '16px 20px', color: '#4A4846', fontSize: '14px' }}>
                          {paciente.diagnostico_clinico}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* COLUNA DA DIREITA: PAINEL DE DETALHES DO PACIENTE (ABRE AO CLICAR NA LINHA) */}
        {selectedPaciente && (
          <aside style={{
            backgroundColor: '#FEFCF9',
            borderRadius: '12px',
            border: '1px solid #EDD9C0',
            padding: '24px',
            boxShadow: '0 4px 20px rgba(44,42,41,0.04)',
            position: 'sticky',
            top: '40px',
            animation: 'fadeIn 0.2s ease'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '22px', fontWeight: 700, color: '#0a5c52', margin: 0 }}>
                Prontuário Digital
              </h3>
              <button 
                onClick={() => setSelectedPaciente(null)}
                style={{ background: 'none', border: 'none', fontSize: '18px', cursor: 'pointer', opacity: 0.5 }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px' }}>
              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase' }}>Nome Completo</label>
                <div style={{ fontWeight: 600, fontSize: '16px', marginTop: '2px' }}>{selectedPaciente.nome}</div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase' }}>Diagnóstico Clínico</label>
                <div style={{ marginTop: '2px', color: '#4A4846', lineHeight: '1.4' }}>{selectedPaciente.diagnostico_clinico}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase' }}>CPF</label>
                  <div style={{ marginTop: '2px' }}>{selectedPaciente.cpf || '—'}</div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase' }}>Telefone</label>
                  <div style={{ marginTop: '2px' }}>{selectedPaciente.telefone || '—'}</div>
                </div>
              </div>

              <div>
                <label style={{ fontSize: '11px', fontWeight: 600, opacity: 0.5, textTransform: 'uppercase' }}>Endereço</label>
                <div style={{ marginTop: '2px', color: '#4A4846' }}>{selectedPaciente.endereco || '—'}</div>
              </div>
            </div>
          </aside>
        )}
      </main>

      {/* MODAL PARA CADASTRO DE NOVO PACIENTE */}
      {isModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(44,42,41,0.4)',
          backdropFilter: 'blur(4px)',
          display: 'flex', justifyContent: 'center', alignItems: 'center',
          zIndex: 1000
        }}>
          <div style={{
            backgroundColor: '#FEFCF9',
            borderRadius: '16px',
            border: '1px solid #EDD9C0',
            width: '100%', maxWidth: '500px',
            padding: '30px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: '24px', fontWeight: 700, color: '#0a5c52', margin: 0 }}>
                Admitir Novo Paciente
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', opacity: 0.5 }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreatePaciente} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Nome Completo *</label>
                <input type="text" required value={nome} onChange={e => setNome(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Idade</label>
                  <input type="number" value={idade} onChange={e => setIdade(e.target.value)} style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Sexo</label>
                  <select value={sexo} onChange={e => setSexo(e.target.value)} style={inputStyle}>
                    <option value="">Selecione</option>
                    <option value="Masculino">Masculino</option>
                    <option value="Feminino">Feminino</option>
                    <option value="Outro">Outro</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Diagnóstico Clínico *</label>
                <textarea required value={diagnostico} onChange={e => setDiagnostico(e.target.value)} rows={3} style={{ ...inputStyle, resize: 'none' }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>CPF</label>
                  <input type="text" value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" style={inputStyle} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Telefone</label>
                  <input type="text" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(00) 00000-0000" style={inputStyle} />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, marginBottom: '6px' }}>Endereço Residencial</label>
                <input type="text" value={endereco} onChange={e => setEndereco(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '10px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ ...buttonStyle, backgroundColor: 'transparent', border: '1px solid #EDD9C0', color: '#2C2A29' }}>
                  Cancelar
                </button>
                <button type="submit" style={{ ...buttonStyle, backgroundColor: '#0a5c52', color: '#FEFCF9' }}>
                  Salvar Cadastro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '8px',
  border: '1px solid #EDD9C0',
  backgroundColor: '#FEFCF9',
  fontSize: '14px',
  outline: 'none',
  fontFamily: 'inherit'
};

const buttonStyle = {
  flex: 1,
  padding: '12px',
  borderRadius: '8px',
  border: 'none',
  fontSize: '14px',
  fontWeight: 600,
  cursor: 'pointer'
};