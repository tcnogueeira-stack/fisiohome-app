'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase'; // Garanta que o caminho do seu @/lib aponta para a pasta lib

// Definição da estrutura de dados do Paciente
interface Paciente {
  id: string;
  nome: string;
  cpf: string;
  telefone: string;
  ultima_consulta: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [pacientes, setPacientes] = useState<Paciente[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');

  // 1. Verifica se o usuário está logado e busca os pacientes
  useEffect(() => {
    const checarSessaoEBuscarDados = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Se não tiver sessão ativa, chuta de volta para o login (raiz)
      if (!session) {
        router.push('/');
        return;
      }

      try {
        // Busca a lista de pacientes ordenada pelo nome
        const { data, error } = await supabase
          .from('pacientes')
          .select('id, nome, cpf, telefone, ultima_consulta')
          .order('nome', { ascending: true });

        if (error) throw error;
        if (data) setPacientes(data);
      } catch (error: any) {
        console.error('Erro ao buscar pacientes:', error.message);
      } finally {
        setLoading(false);
      }
    };

    checarSessaoEBuscarDados();
  }, [router]);

  // 2. Função de Logout
  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  // 3. Filtra a lista de pacientes de acordo com o que for digitado na busca
  const pacientesFiltrados = pacientes.filter(paciente =>
    paciente.nome.toLowerCase().includes(busca.toLowerCase()) ||
    paciente.cpf.includes(busca)
  );

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#EAEAE0]">
        <p className="text-xl font-semibold text-[#1B4C53]">Carregando painel...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#EAEAE0] text-[#1B4C53]">
      {/* Barra Superior / Header */}
      <header className="flex items-center justify-between bg-[#1B4C53] p-4 text-white shadow-md">
        <h1 className="text-2xl font-bold tracking-wide">FisioHome</h1>
        <button
          onClick={handleLogout}
          className="rounded bg-[#F18548] px-4 py-2 font-medium text-white transition hover:bg-[#d67236]"
        >
          Sair do Sistema
        </button>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto max-w-6xl p-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold">Painel de Controle</h2>
            <p className="text-sm text-gray-600">Gerencie seus pacientes de forma rápida e prática.</p>
          </div>
          
          {/* Barra de Pesquisa */}
          <input
            type="text"
            placeholder="Buscar por nome ou CPF..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-4 py-2 text-black shadow-sm focus:border-[#1B4C53] focus:outline-none sm:max-w-md"
          />
        </div>

        {/* Tabela de Pacientes */}
        <div className="overflow-x-auto rounded-lg bg-white shadow-md">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-[#1B4C53] text-white">
              <tr>
                <th className="p-4 font-semibold">Nome do Paciente</th>
                <th className="p-4 font-semibold">CPF</th>
                <th className="p-4 font-semibold">Telefone</th>
                <th className="p-4 font-semibold">Última Consulta</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {pacientesFiltrados.length > 0 ? (
                pacientesFiltrados.map((paciente) => (
                  <tr key={paciente.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-gray-900">{paciente.nome}</td>
                    <td className="p-4 text-gray-600">{paciente.cpf}</td>
                    <td className="p-4 text-gray-600">{paciente.telefone}</td>
                    <td className="p-4 text-gray-600">
                      {paciente.ultima_consulta 
                        ? new Date(paciente.ultima_consulta).toLocaleDateString('pt-BR') 
                        : 'Não informada'}
                    </td>
                    <td className="p-4 text-center">
                      <button
                        onClick={() => router.push(`/dashboard/paciente/${paciente.id}`)}
                        className="rounded bg-[#1B4C53] px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-[#25636d]"
                      >
                        Abrir Prontuário
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-gray-500">
                    Nenhum paciente encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}