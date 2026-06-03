'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useParams, useRouter } from 'next/navigation';
import '../../../globals.css';

export default function ProntuarioPaciente() {
  const { id } = useParams();
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [paciente, setPaciente] = useState(null);
  
  // CORREÇÃO TS: Informando que o estado aceita um array de objetos dinâmicos
  const [atendimentos, setAtendimentos] = useState<any[]>([]);
  
  const [loading, setLoading] = useState(false);

  // Estados do Formulário (Evolução + Financeiro básico)
  const [novoAtendimento, setNovoAtendimento] = useState('');
  const [valorSessao, setValorSessao] = useState('');
  const [formaPagamento, setFormaPagamento] = useState('Pix');

  const carregarDados = async () => {
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
    const verificarUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push('/'); return; }
      setUser(user);
    };
    verificarUser();
    if (id) carregarDados();
  }, [id, router]);

  const handleSalvarTudo = async (e) => {
    e.preventDefault();
    if (!novoAtendimento.trim()) return;
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
              {atendimentos.length > 0 ? atendimentos.map((atend) => {
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
}