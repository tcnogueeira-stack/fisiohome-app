'use client';

import { useEffect, useState, ChangeEvent, FormEvent } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

// ─── Types (inalterados) ──────────────────────────────────────────────────────

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

// ─── Tokens visuais (espelho do HTML v3) ─────────────────────────────────────

const C = {
  greenDeep:  '#062e28',
  greenMid:   '#0d7a6d',
  greenLight: '#13a090',
  greenPale:  '#e5f4f2',
  gold:       '#D4B896',
  goldDeep:   '#B89870',
  goldUltra:  '#FBF5EE',
  cream:      '#F8F4EE',
  warmWhite:  '#FEFCF9',
  charcoal:   '#1E2D2B',
  mid:        '#4A6560',
  soft:       '#8AADA8',
  border:     '#DDE8E6',
  borderGold: '#E8D5BE',
} as const;

function iniciaisNome(nome: string) {
  return nome?.trim()[0]?.toUpperCase() ?? '?';
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Dashboard() {
  const router = useRouter();

  const [user,               setUser]               = useState<any>(null);
  const [pacientes,          setPacientes]          = useState<Paciente[]>([]);
  const [pacientesFiltrados, setPacientesFiltrados] = useState<Paciente[]>([]);
  const [busca,              setBusca]              = useState('');
  const [resumo,             setResumo]             = useState<ResumoDashboard>({
    total_pacientes: 0, total_atendimentos: 0, total_faturado: 0,
  });
  const [showModal, setShowModal] = useState(false);
  const [loading,   setLoading]   = useState(false);
  const [navHover,  setNavHover]  = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome_completo: '', cpf: '', data_nascimento: '', sexo: '',
    cep: '', endereco: '', complemento: '', telefone: '',
    diagnostico: '', observacao: '',
  });

  // ── Data fetching (inalterado) ──────────────────────────────────────────────
  const carregarDadosDoDashboard = async (userId: string) => {
    const { data: pData } = await supabase
      .from('v_tn003_pacientes')
      .select('*')
      .eq('fisio_id', userId)
      .order('created_at', { ascending: false });

    const listaPacientes = (pData as Paciente[]) || [];
    setPacientes(listaPacientes);
    setPacientesFiltrados(listaPacientes);

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
      if (!sessionUser) { router.push('/'); }
      else { setUser(sessionUser); carregarDadosDoDashboard(sessionUser.id); }
    };
    getData();
  }, [router]);

  useEffect(() => {
    const termo = busca.toLowerCase();
    setPacientesFiltrados(
      pacientes.filter((p) =>
        (p.nome_completo && p.nome_completo.toLowerCase().includes(termo)) ||
        (p.diagnostico   && p.diagnostico.toLowerCase().includes(termo))
      )
    );
  }, [busca, pacientes]);

  // ── CEP (inalterado) ────────────────────────────────────────────────────────
  const handleCEP = async (e: ChangeEvent<HTMLInputElement>) => {
    const cepLimpo = e.target.value.replace(/[^0-9]/g, '');
    setFormData({ ...formData, cep: cepLimpo });
    if (cepLimpo.length === 8) {
      try {
        const res  = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            endereco: `${data.logradouro}, ${data.bairro} - ${data.localidade}/${data.uf}`,
          }));
        }
      } catch (err) { console.error('Erro ao buscar CEP', err); }
    }
  };

  // ── Save (inalterado) ───────────────────────────────────────────────────────
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
        diagnostico: '', observacao: '',
      });
      carregarDadosDoDashboard(user.id);
    }
    setLoading(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (!user) return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: `linear-gradient(150deg, ${C.greenDeep} 0%, #0a5c52 60%, #0d3d37 100%)`,
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.8rem', color: '#fff', marginBottom: 8 }}>
          Fisio<span style={{ color: C.gold }}>Home</span>
        </div>
        <div style={{ color: 'rgba(255,255,255,0.45)', fontSize: '0.82rem', letterSpacing: '0.06em' }}>
          Autenticando acesso...
        </div>
      </div>
    </div>
  );

  const navItems = [
    { label: 'Dashboard',  icon: '🏠', path: '/dashboard',            active: true  },
    { label: 'Pacientes',  icon: '👥', path: '/dashboard/paciente',   active: false },
    { label: 'Financeiro', icon: '💰', path: '/dashboard/financeiro', active: false },
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: C.cream, fontFamily: "'Nunito', 'Plus Jakarta Sans', sans-serif" }}>

      {/* ════ SIDEBAR ════ */}
      <aside style={{
        width: 240, minWidth: 240, flexShrink: 0,
        background: `linear-gradient(160deg, ${C.greenDeep} 0%, #0a5c52 100%)`,
        display: 'flex', flexDirection: 'column', justifyContent: 'space-between',
        padding: '28px 0 20px', position: 'sticky', top: 0, height: '100vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

          <div style={{ padding: '0 24px', fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.65rem', fontWeight: 700, color: '#fff' }}>
            Fisio<span style={{ color: C.gold }}>Home</span>
          </div>

          <div style={{ height: 1, margin: '0 20px', background: `linear-gradient(90deg, transparent, ${C.gold}, transparent)`, opacity: 0.25 }} />

          <nav style={{ padding: '0 12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
            <p style={{ fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', padding: '0 12px', marginBottom: 4 }}>
              Menu principal
            </p>
            {navItems.map(item => (
              <button
                key={item.label}
                onClick={() => router.push(item.path)}
                onMouseEnter={() => setNavHover(item.label)}
                onMouseLeave={() => setNavHover(null)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left',
                  fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', fontWeight: 600,
                  background: item.active
                    ? 'rgba(212,184,150,0.12)'
                    : navHover === item.label ? 'rgba(255,255,255,0.05)' : 'transparent',
                  color: item.active ? C.gold : 'rgba(255,255,255,0.65)',
                  borderLeft: item.active ? `3px solid ${C.gold}` : '3px solid transparent',
                }}
              >
                <span>{item.icon}</span>{item.label}
              </button>
            ))}
          </nav>
        </div>

        <button onClick={handleLogout} style={{
          margin: '0 20px', padding: '10px 14px',
          background: 'rgba(192,57,43,0.15)', border: '1px solid rgba(192,57,43,0.3)',
          borderRadius: 10, color: '#ff9a8b', fontSize: '0.82rem', fontWeight: 700,
          cursor: 'pointer', fontFamily: "'Nunito', sans-serif", textAlign: 'left',
        }}>
          🚪 Sair
        </button>
      </aside>

      {/* ════ MAIN ════ */}
      <main style={{ flex: 1, padding: '36px 40px', overflowX: 'hidden' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.9rem', fontWeight: 700, color: C.charcoal, margin: 0 }}>
              Painel de Gestão
            </h1>
            <p style={{ fontSize: '0.78rem', color: C.soft, marginTop: 4, textTransform: 'capitalize' }}>
              {new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <button onClick={() => setShowModal(true)} style={{
            padding: '11px 22px',
            background: `linear-gradient(135deg, ${C.greenLight}, ${C.greenDeep})`,
            color: '#fff', border: 'none', borderRadius: 50,
            fontFamily: "'Nunito', sans-serif", fontSize: '0.88rem', fontWeight: 700,
            cursor: 'pointer', boxShadow: '0 4px 14px rgba(10,92,82,0.28)', whiteSpace: 'nowrap',
          }}>
            + Novo Paciente
          </button>
        </div>

        {/* Stats */}
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 28 }}>
          {[
            { label: 'Faturamento (Mês)',  value: `R$ ${Number(resumo?.total_faturado || 0).toFixed(2)}`, icon: '💰', gold: true  },
            { label: 'Atendimentos (Mês)', value: String(resumo?.total_atendimentos || 0),                icon: '🩺', gold: false },
            { label: 'Pacientes Ativos',   value: String(resumo?.total_pacientes || 0),                   icon: '👥', gold: false },
          ].map(stat => (
            <div key={stat.label} style={{
              background: C.warmWhite, borderRadius: 16, padding: '20px 22px',
              display: 'flex', alignItems: 'center', gap: 14,
              boxShadow: '0 2px 12px rgba(10,92,82,0.07)', border: `1px solid ${C.border}`,
              borderTop: stat.gold ? `3px solid ${C.gold}` : `3px solid ${C.greenMid}`,
            }}>
              <span style={{ fontSize: '1.6rem' }}>{stat.icon}</span>
              <div>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: C.soft, marginBottom: 4 }}>
                  {stat.label}
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.65rem', fontWeight: 700, color: stat.gold ? C.goldDeep : C.greenDeep }}>
                  {stat.value}
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* Tabela */}
        <section style={{ background: C.warmWhite, borderRadius: 20, border: `1px solid ${C.border}`, boxShadow: '0 2px 12px rgba(10,92,82,0.07)', overflow: 'hidden' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: `1px solid ${C.border}`, flexWrap: 'wrap', gap: 12 }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.2rem', fontWeight: 700, color: C.charcoal, margin: 0 }}>
              Pacientes
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.cream, border: `1.5px solid ${C.border}`, borderRadius: 50, padding: '8px 16px', minWidth: 260 }}>
              <span style={{ color: C.soft }}>🔍</span>
              <input
                type="text"
                placeholder="Buscar por nome ou diagnóstico..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                style={{ border: 'none', outline: 'none', background: 'transparent', fontFamily: "'Nunito', sans-serif", fontSize: '0.85rem', color: C.charcoal, width: '100%' }}
              />
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  {['Nome', 'Idade', 'Diagnóstico', 'Ações'].map(h => (
                    <th key={h} style={{ padding: '11px 20px', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.09em', textTransform: 'uppercase', color: C.soft, borderBottom: `1px solid ${C.border}`, whiteSpace: 'nowrap' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pacientesFiltrados.length > 0 ? pacientesFiltrados.map((p, i) => (
                  <tr key={p.id} style={{ background: i % 2 === 0 ? '#fff' : C.goldUltra }}>
                    <td style={{ padding: '13px 20px', borderBottom: '1px solid #f0ebe4', verticalAlign: 'middle' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                          background: `linear-gradient(135deg, ${C.greenPale}, #d0ece9)`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontFamily: 'Georgia, serif', fontSize: '0.9rem', color: C.greenMid,
                          border: '1.5px solid rgba(212,184,150,0.3)',
                        }}>
                          {iniciaisNome(p.nome_completo)}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: '0.86rem', color: C.charcoal }}>{p.nome_completo}</span>
                      </div>
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '0.86rem', color: C.mid, borderBottom: '1px solid #f0ebe4' }}>
                      {p.idade ? `${p.idade} anos` : '—'}
                    </td>
                    <td style={{ padding: '13px 20px', fontSize: '0.86rem', color: C.mid, borderBottom: '1px solid #f0ebe4' }}>
                      {p.diagnostico || '—'}
                    </td>
                    <td style={{ padding: '13px 20px', borderBottom: '1px solid #f0ebe4' }}>
                      <button
                        onClick={() => router.push(`/dashboard/paciente/${p.id}`)}
                        style={{
                          padding: '6px 16px', background: C.goldUltra,
                          border: `1.5px solid ${C.borderGold}`, borderRadius: 50,
                          color: C.goldDeep, fontSize: '0.75rem', fontWeight: 700,
                          cursor: 'pointer', fontFamily: "'Nunito', sans-serif",
                        }}
                      >
                        Prontuário
                      </button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px', textAlign: 'center', color: C.soft, fontSize: '0.88rem' }}>
                      {busca ? 'Nenhum resultado encontrado.' : 'Nenhum paciente cadastrado ainda.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </main>

      {/* ════ MODAL NOVO PACIENTE ════ */}
      {showModal && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100,
          background: 'rgba(6,46,40,0.75)', backdropFilter: 'blur(6px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
        }}>
          <div style={{
            background: C.warmWhite, borderRadius: 24, padding: '36px 32px',
            width: '100%', maxWidth: 680, maxHeight: '90vh', overflowY: 'auto',
            boxShadow: '0 24px 60px rgba(0,0,0,0.3)',
            border: `1px solid ${C.borderGold}`, borderTop: `3px solid ${C.gold}`,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 28 }}>
              <div>
                <h2 style={{ fontFamily: 'Cormorant Garamond, Georgia, serif', fontSize: '1.6rem', fontWeight: 700, color: C.charcoal, margin: 0 }}>
                  Ficha do Paciente
                </h2>
                <p style={{ fontSize: '0.75rem', color: C.soft, marginTop: 4 }}>Preencha os dados cadastrais</p>
              </div>
              <button onClick={() => setShowModal(false)} style={{
                background: C.cream, border: `1px solid ${C.border}`, borderRadius: '50%',
                width: 36, height: 36, cursor: 'pointer', fontSize: '1rem', color: C.mid,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>✕</button>
            </div>

            <form onSubmit={handleSave} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div style={{ gridColumn: 'span 2' }}>
                <FL>Nome completo *</FL>
                <input required style={IS} value={formData.nome_completo} onChange={e => setFormData({ ...formData, nome_completo: e.target.value })} placeholder="Nome completo do paciente" />
              </div>
              <div>
                <FL>CPF</FL>
                <input style={IS} value={formData.cpf} onChange={e => setFormData({ ...formData, cpf: e.target.value })} placeholder="000.000.000-00" />
              </div>
              <div>
                <FL>Data de nascimento</FL>
                <input type="date" style={IS} value={formData.data_nascimento} onChange={e => setFormData({ ...formData, data_nascimento: e.target.value })} />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <FL>Diagnóstico clínico</FL>
                <input style={IS} value={formData.diagnostico} onChange={e => setFormData({ ...formData, diagnostico: e.target.value })} placeholder="Ex: AVC Isquêmico / I63" />
              </div>
              <div>
                <FL>CEP</FL>
                <input style={IS} maxLength={8} value={formData.cep} onChange={handleCEP} placeholder="00000-000" />
              </div>
              <div>
                <FL>Telefone / WhatsApp</FL>
                <input style={IS} value={formData.telefone} onChange={e => setFormData({ ...formData, telefone: e.target.value })} placeholder="(00) 00000-0000" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <FL>Endereço completo</FL>
                <input style={IS} value={formData.endereco} onChange={e => setFormData({ ...formData, endereco: e.target.value })} placeholder="Preenchido automaticamente pelo CEP" />
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <FL>Observações iniciais</FL>
                <textarea style={{ ...IS, minHeight: 80, resize: 'vertical' } as React.CSSProperties} value={formData.observacao} onChange={e => setFormData({ ...formData, observacao: e.target.value })} placeholder="Ex: Paciente idoso, usa andador..." />
              </div>
              <button type="submit" disabled={loading} style={{
                gridColumn: 'span 2', padding: 14, marginTop: 8,
                background: loading ? C.soft : `linear-gradient(135deg, ${C.greenLight}, ${C.greenDeep})`,
                color: '#fff', border: 'none', borderRadius: 50,
                fontFamily: "'Nunito', sans-serif", fontSize: '0.95rem', fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: loading ? 'none' : '0 4px 16px rgba(10,92,82,0.28)',
              }}>
                {loading ? 'Salvando...' : 'Confirmar Registro'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Micro helpers ────────────────────────────────────────────────────────────

function FL({ children }: { children: React.ReactNode }) {
  return (
    <label style={{ display: 'block', fontSize: '0.68rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#4A6560', marginBottom: 6 }}>
      {children}
    </label>
  );
}

const IS: React.CSSProperties = {
  width: '100%', padding: '11px 14px', border: '1.5px solid #DDE8E6',
  borderRadius: 10, fontFamily: "'Nunito', sans-serif", fontSize: '0.9rem',
  color: '#1E2D2B', background: '#F8F4EE', outline: 'none', boxSizing: 'border-box',
};
