import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  UserCheck,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RefreshCw,
  FileText,
  Briefcase,
  Hash,
  AlertCircle,
  X,
  ArrowUpDown,
  ExternalLink,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { listarEmpresas } from '@/services/cadastroEmpresas'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

export default function Index() {
  const [empresas, setEmpresas] = useState<EmpresaRecord[]>([])
  const [totalItens, setTotalItens] = useState<number>(0)
  const [totalPaginas, setTotalPaginas] = useState<number>(1)
  const [paginaAtual, setPaginaAtual] = useState<number>(1)
  const [porPagina, setPorPagina] = useState<number>(50)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)

  // Filtros
  const [termoBusca, setTermoBusca] = useState<string>('')
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('TODOS')
  const [filtroSituacao, setFiltroSituacao] = useState<string>('TODOS')
  const [ordenacao, setOrdenacao] = useState<
    'codigo-asc' | 'codigo-desc' | 'nome-asc' | 'nome-desc'
  >('codigo-asc')

  // Item selecionado para expansão / detalhes
  const [empresaExpandidaId, setEmpresaExpandidaId] = useState<number | null>(null)
  const [modalEmpresa, setModalEmpresa] = useState<EmpresaRecord | null>(null)

  // Carrega dados da coleção cadastro_empresas
  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await listarEmpresas({
        busca: termoBusca,
        tipoDocumento: filtroTipoDoc,
        situacao: filtroSituacao,
        ordenacao,
        pagina: paginaAtual,
        porPagina,
      })

      setEmpresas(res.items)
      setTotalItens(res.totalItems)
      setTotalPaginas(res.totalPages || 1)
    } catch (e: any) {
      console.error('Falha ao carregar cadastro de empresas:', e)
      setErro('Não foi possível carregar o cadastro de clientes. Tente novamente.')
    } finally {
      setCarregando(false)
    }
  }, [termoBusca, filtroTipoDoc, filtroSituacao, ordenacao, paginaAtual, porPagina])

  // Debounce na busca textual e reset de página quando filtro muda
  useEffect(() => {
    setPaginaAtual(1)
  }, [termoBusca, filtroTipoDoc, filtroSituacao, ordenacao, porPagina])

  useEffect(() => {
    const timer = setTimeout(() => {
      carregarDados()
    }, 250)
    return () => clearTimeout(timer)
  }, [carregarDados])

  const alternarExpansao = (codigo: number) => {
    setEmpresaExpandidaId((prev) => (prev === codigo ? null : codigo))
  }

  const alternarOrdenacaoNome = () => {
    if (ordenacao === 'nome-asc') {
      setOrdenacao('nome-desc')
    } else if (ordenacao === 'nome-desc') {
      setOrdenacao('codigo-asc')
    } else {
      setOrdenacao('nome-asc')
    }
  }

  const alternarOrdenacaoCodigo = () => {
    if (ordenacao === 'codigo-asc') {
      setOrdenacao('codigo-desc')
    } else {
      setOrdenacao('codigo-asc')
    }
  }

  const limparFiltros = () => {
    setTermoBusca('')
    setFiltroTipoDoc('TODOS')
    setFiltroSituacao('TODOS')
    setOrdenacao('codigo-asc')
    setPaginaAtual(1)
  }

  const temFiltroAtivo =
    termoBusca.trim() !== '' || filtroTipoDoc !== 'TODOS' || filtroSituacao !== 'TODOS'

  // Estatísticas rápidas da lista atual
  const contadores = useMemo(() => {
    return {
      exibindo: empresas.length,
      total: totalItens,
      inicio: totalItens === 0 ? 0 : (paginaAtual - 1) * porPagina + 1,
      fim: Math.min(paginaAtual * porPagina, totalItens),
    }
  }, [empresas.length, totalItens, paginaAtual, porPagina])

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
      {/* CABEÇALHO INSTITUCIONAL ADECONT */}
      <header className="bg-[#0F294A] border-b border-[#D4AF37]/30 text-white shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <AdecontLogo variant="white" showTagline={false} className="h-10 sm:h-12 w-auto" />
            <div className="border-l border-white/20 pl-3">
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide text-white leading-tight">
                Cadastro Analítico de Clientes
              </h1>
              <p className="text-[11px] sm:text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
                Assessoria Contábil e Administrativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <a
              href="#inicio"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Acessar o portal de Indicadores Econômicos e Reforma Tributária"
            >
              <span>Portal Panorama RT</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </a>

            <button
              onClick={() => carregarDados()}
              disabled={carregando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29f2f] text-xs font-bold text-[#0F294A] transition-colors shadow-sm disabled:opacity-60 cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
        {/* BARRA DE FILTROS E BUSCA */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por razão social, apelido, CNPJ/CPF (com ou sem pontuação) ou código..."
                className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0F294A]/20 focus:border-[#0F294A] transition-all"
              />
              {termoBusca && (
                <button
                  onClick={() => setTermoBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                  title="Limpar termo"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Filtros rápidos */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="font-medium hidden sm:inline">Documento:</span>
                <select
                  value={filtroTipoDoc}
                  onChange={(e) => setFiltroTipoDoc(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="TODOS">Todos os tipos</option>
                  <option value="CNPJ">CNPJ</option>
                  <option value="CPF">CPF</option>
                  <option value="CEI">CEI</option>
                  <option value="CAEPF">CAEPF</option>
                  <option value="SEM_DOC">Sem documento</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="font-medium hidden sm:inline">Situação:</span>
                <select
                  value={filtroSituacao}
                  onChange={(e) => setFiltroSituacao(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="TODOS">Todas situações</option>
                  <option value="Ativa">Ativas</option>
                  <option value="Inativa">Inativas</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="font-medium hidden sm:inline">Itens/pág:</span>
                <select
                  value={porPagina}
                  onChange={(e) => setPorPagina(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              {temFiltroAtivo && (
                <button
                  onClick={limparFiltros}
                  className="text-xs text-red-600 hover:text-red-800 font-semibold px-2 py-1.5 rounded-lg hover:bg-red-50 transition-colors"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Linha de contadores e status da busca */}
          <div className="mt-3 pt-2.5 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div>
              {totalItens > 0 ? (
                <span>
                  Exibindo <strong className="text-slate-800">{contadores.inicio}</strong> a{' '}
                  <strong className="text-slate-800">{contadores.fim}</strong> de{' '}
                  <strong className="text-[#0F294A] font-bold">{totalItens}</strong> clientes
                  cadastrados
                </span>
              ) : carregando ? (
                <span>Consultando cadastro...</span>
              ) : (
                <span className="text-amber-700 font-medium">
                  Nenhum cliente encontrado para os filtros aplicados
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-slate-400">Ordenação:</span>
              <button
                onClick={alternarOrdenacaoCodigo}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                  ordenacao.startsWith('codigo')
                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Código {ordenacao === 'codigo-desc' ? '↓' : '↑'}
              </button>
              <button
                onClick={alternarOrdenacaoNome}
                className={`px-2 py-0.5 rounded text-[11px] font-semibold border transition-colors ${
                  ordenacao.startsWith('nome')
                    ? 'bg-[#0F294A] text-white border-[#0F294A]'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                Nome {ordenacao === 'nome-desc' ? '↓' : ordenacao === 'nome-asc' ? '↑' : ''}
              </button>
            </div>
          </div>
        </section>

        {/* FEEDBACK DE ERRO */}
        {erro && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{erro}</span>
            </div>
            <button
              onClick={() => carregarDados()}
              className="px-3 py-1 bg-red-600 text-white rounded-lg text-xs font-bold hover:bg-red-700 transition-colors"
            >
              Tentar novamente
            </button>
          </div>
        )}

        {/* LISTAGEM: TABELA DESKTOP + CARDS MOBILE */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex-1 flex flex-col">
          {carregando && empresas.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-8 h-8 text-[#0F294A] animate-spin" />
              <p className="text-sm font-medium">Carregando clientes da base ADECONT...</p>
            </div>
          ) : empresas.length === 0 ? (
            <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
              <Building2 className="w-10 h-10 text-slate-300" />
              <p className="text-base font-semibold text-slate-700">Nenhum cliente encontrado</p>
              <p className="text-xs text-slate-400 max-w-md">
                Tente ajustar os termos de busca ou remover os filtros de documento/situação.
              </p>
              {temFiltroAtivo && (
                <button
                  onClick={limparFiltros}
                  className="mt-2 text-xs font-bold text-[#0F294A] hover:underline"
                >
                  Limpar todos os filtros
                </button>
              )}
            </div>
          ) : (
            <>
              {/* VISUALIZAÇÃO DESKTOP: TABELA (oculta em telas < md) */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100/80 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                      <th
                        className="py-3 px-3 w-16 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
                        onClick={alternarOrdenacaoCodigo}
                        title="Clique para ordenar por código"
                      >
                        <div className="flex items-center gap-1">
                          <span>Cód.</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 w-40">Documento</th>
                      <th
                        className="py-3 px-4 cursor-pointer hover:bg-slate-200/60 transition-colors select-none"
                        onClick={alternarOrdenacaoNome}
                        title="Clique para ordenar por nome"
                      >
                        <div className="flex items-center gap-1">
                          <span>Razão Social / Nome</span>
                          <ArrowUpDown className="w-3 h-3 text-slate-400" />
                        </div>
                      </th>
                      <th className="py-3 px-3 w-44">Apelido / Fantasia</th>
                      <th className="py-3 px-3 w-36">Município / UF</th>
                      <th className="py-3 px-3 w-24 text-center">Situação</th>
                      <th className="py-3 px-3 w-20 text-center">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {empresas.map((emp) => {
                      const expandida = empresaExpandidaId === emp.codigo
                      const situacaoAtiva =
                        (emp.situacao || 'Ativa').toLowerCase().includes('ativa') &&
                        !emp.situacao?.toLowerCase().includes('inativa')

                      return (
                        <tr
                          key={emp.codigo}
                          className={`hover:bg-blue-50/40 transition-colors ${
                            expandida ? 'bg-blue-50/60 font-medium' : ''
                          }`}
                        >
                          <td className="py-2.5 px-3 font-mono font-bold text-[#0F294A]">
                            #{emp.codigo}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="font-mono text-slate-800">
                              {emp.numero_documento || (
                                <span className="text-slate-400 italic">Sem doc</span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-500 uppercase tracking-wide">
                              {emp.tipo_documento || '—'}
                            </div>
                          </td>
                          <td className="py-2.5 px-4">
                            <div className="font-semibold text-slate-900 leading-snug">
                              {emp.razao_social || emp.nome || '—'}
                            </div>
                            {emp.ramo_atividade && (
                              <div
                                className="text-[10.5px] text-slate-500 truncate max-w-md"
                                title={emp.ramo_atividade}
                              >
                                {emp.ramo_atividade}
                              </div>
                            )}
                          </td>
                          <td className="py-2.5 px-3 text-slate-700">
                            <span className="font-medium text-slate-800">
                              {emp.apelido || emp.nome_fantasia || '—'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600">
                            {emp.municipio ? `${emp.municipio}${emp.uf ? `/${emp.uf}` : ''}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                situacaoAtiva
                                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                                  : 'bg-rose-100 text-rose-800 border border-rose-200'
                              }`}
                            >
                              {emp.situacao || 'Ativa'}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-center">
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => alternarExpansao(emp.codigo)}
                                className="p-1 rounded text-slate-500 hover:text-[#0F294A] hover:bg-slate-200/60 transition-colors"
                                title={expandida ? 'Recolher detalhes' : 'Ver detalhes rápidos'}
                              >
                                {expandida ? (
                                  <ChevronUp className="w-4 h-4" />
                                ) : (
                                  <ChevronDown className="w-4 h-4" />
                                )}
                              </button>
                              <button
                                onClick={() => setModalEmpresa(emp)}
                                className="p-1 rounded text-slate-500 hover:text-[#0F294A] hover:bg-slate-200/60 transition-colors"
                                title="Abrir ficha completa"
                              >
                                <FileText className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* PAINEL EXPANSÍVEL DESKTOP (se algum código estiver expandido) */}
              {empresaExpandidaId !== null &&
                (() => {
                  const emp = empresas.find((e) => e.codigo === empresaExpandidaId)
                  if (!emp) return null
                  return (
                    <div className="hidden md:block bg-gradient-to-r from-blue-50/70 to-slate-50 border-t border-b border-blue-200/80 p-4 text-xs">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-2">
                          <Building2 className="w-4 h-4 text-[#0F294A]" />
                          <h3 className="font-bold text-sm text-[#0F294A]">
                            #{emp.codigo} — {emp.razao_social || emp.nome}
                          </h3>
                          {emp.apelido && (
                            <span className="text-slate-500 font-normal">({emp.apelido})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setModalEmpresa(emp)}
                            className="px-2.5 py-1 bg-[#0F294A] text-white rounded-md text-[11px] font-bold hover:bg-[#183b68] transition-colors"
                          >
                            Abrir Ficha Completa
                          </button>
                          <button
                            onClick={() => setEmpresaExpandidaId(null)}
                            className="p-1 text-slate-400 hover:text-slate-600"
                            title="Fechar"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-3 text-[11.5px]">
                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Endereço
                          </span>
                          <span className="font-medium text-slate-800">
                            {emp.tipo_endereco ? `${emp.tipo_endereco} ` : ''}
                            {emp.endereco || '—'}
                            {emp.numero_endereco ? `, ${emp.numero_endereco}` : ''}
                            {emp.complemento ? ` (${emp.complemento})` : ''}
                          </span>
                          <span className="block text-slate-500 text-[10px]">
                            {emp.bairro ? `${emp.bairro} — ` : ''}
                            {emp.municipio || '—'}/{emp.uf || '—'}{' '}
                            {emp.cep ? `• CEP: ${emp.cep}` : ''}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Contato
                          </span>
                          <span className="font-medium text-slate-800 block">
                            Telefone: {emp.telefone || '—'}
                          </span>
                          <span className="text-slate-600 block truncate" title={emp.email}>
                            E-mail: {emp.email || '—'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Atividade / CNAE
                          </span>
                          <span className="font-medium text-slate-800 block">
                            CNAE: {emp.cnae || '—'}
                          </span>
                          <span
                            className="text-slate-600 block truncate"
                            title={emp.ramo_atividade}
                          >
                            {emp.ramo_atividade || '—'}
                          </span>
                        </div>

                        <div>
                          <span className="text-slate-400 block text-[10px] uppercase font-bold">
                            Gestão / Datas
                          </span>
                          <span className="text-slate-700 block">
                            Início: {emp.inicio_atividades || '—'}
                          </span>
                          <span className="text-slate-700 block">
                            Cliente desde: {emp.cliente_desde || '—'}
                          </span>
                          <span className="text-slate-700 block truncate" title={emp.contador}>
                            Contador: {emp.contador || '—'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )
                })()}

              {/* VISUALIZAÇÃO MOBILE: CARDS RESPONSIVOS (visível apenas em telas < md) */}
              <div className="block md:hidden divide-y divide-slate-100">
                {empresas.map((emp) => {
                  const expandida = empresaExpandidaId === emp.codigo
                  const situacaoAtiva =
                    (emp.situacao || 'Ativa').toLowerCase().includes('ativa') &&
                    !emp.situacao?.toLowerCase().includes('inativa')

                  return (
                    <div key={emp.codigo} className="p-3.5 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-1">
                            <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono font-bold text-[10.5px] text-[#0F294A]">
                              #{emp.codigo}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded-full text-[9.5px] font-bold ${
                                situacaoAtiva
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {emp.situacao || 'Ativa'}
                            </span>
                            <span className="text-[10px] font-mono text-slate-500 uppercase">
                              {emp.tipo_documento || 'DOC'}
                            </span>
                          </div>

                          <h3 className="font-bold text-sm text-slate-900 leading-snug break-words">
                            {emp.razao_social || emp.nome || '—'}
                          </h3>

                          {(emp.apelido || emp.nome_fantasia) && (
                            <p className="text-xs text-[#0F294A] font-medium mt-0.5">
                              {emp.apelido || emp.nome_fantasia}
                            </p>
                          )}

                          <p className="text-xs font-mono text-slate-600 mt-1">
                            {emp.numero_documento || (
                              <span className="text-slate-400 italic">Sem documento</span>
                            )}
                          </p>

                          <p className="text-[11px] text-slate-500 mt-0.5">
                            {emp.municipio
                              ? `${emp.municipio}/${emp.uf || ''}`
                              : 'Município não informado'}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <button
                            onClick={() => setModalEmpresa(emp)}
                            className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-[#0F294A]"
                            title="Ficha completa"
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => alternarExpansao(emp.codigo)}
                            className="p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-500"
                            title={expandida ? 'Recolher' : 'Expandir'}
                          >
                            {expandida ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Detalhes rápidos expansíveis no card mobile */}
                      {expandida && (
                        <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] space-y-1.5 bg-slate-50/80 -mx-3.5 -mb-3.5 p-3 rounded-b-lg">
                          <div>
                            <span className="text-slate-400 font-semibold block">Endereço:</span>
                            <span className="text-slate-700">
                              {emp.endereco
                                ? `${emp.endereco}, ${emp.numero_endereco || 'S/N'}`
                                : '—'}
                              {emp.bairro ? ` - ${emp.bairro}` : ''}
                            </span>
                          </div>

                          {(emp.telefone || emp.email) && (
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <span className="text-slate-400 font-semibold block">
                                  Telefone:
                                </span>
                                <span className="text-slate-700">{emp.telefone || '—'}</span>
                              </div>
                              <div>
                                <span className="text-slate-400 font-semibold block">E-mail:</span>
                                <span className="text-slate-700 truncate block">
                                  {emp.email || '—'}
                                </span>
                              </div>
                            </div>
                          )}

                          {emp.ramo_atividade && (
                            <div>
                              <span className="text-slate-400 font-semibold block">
                                Ramo de Atividade:
                              </span>
                              <span className="text-slate-700">{emp.ramo_atividade}</span>
                            </div>
                          )}

                          <div className="pt-1">
                            <button
                              onClick={() => setModalEmpresa(emp)}
                              className="w-full py-1.5 px-3 bg-[#0F294A] text-white rounded-lg text-xs font-bold text-center"
                            >
                              Ver Ficha Completa
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </>
          )}

          {/* BARRA DE PAGINAÇÃO INFERIOR */}
          {totalPaginas > 1 && (
            <div className="p-3 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs text-slate-600">
              <div className="text-[11px] sm:text-xs">
                Página <strong className="text-slate-800">{paginaAtual}</strong> de{' '}
                <strong className="text-slate-800">{totalPaginas}</strong> ({totalItens} clientes no
                total)
              </div>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPaginaAtual(1)}
                  disabled={paginaAtual <= 1 || carregando}
                  className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Primeira página"
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                  disabled={paginaAtual <= 1 || carregando}
                  className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Página anterior"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <span className="px-2 font-semibold text-slate-800 text-xs">
                  {paginaAtual} / {totalPaginas}
                </span>

                <button
                  onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                  disabled={paginaAtual >= totalPaginas || carregando}
                  className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Próxima página"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setPaginaAtual(totalPaginas)}
                  disabled={paginaAtual >= totalPaginas || carregando}
                  className="p-1.5 rounded border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                  title="Última página"
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {/* MODAL / PAINEL DE FICHA COMPLETA DO CLIENTE */}
      {modalEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-[#0F294A] text-white p-4 sm:p-5 flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded bg-white/20 font-mono font-bold text-xs">
                    Código #{modalEmpresa.codigo}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-xs font-bold ${
                      (modalEmpresa.situacao || 'Ativa').toLowerCase().includes('ativa') &&
                      !modalEmpresa.situacao?.toLowerCase().includes('inativa')
                        ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30'
                        : 'bg-rose-400/20 text-rose-300 border border-rose-400/30'
                    }`}
                  >
                    {modalEmpresa.situacao || 'Ativa'}
                  </span>
                </div>
                <h2 className="text-base sm:text-lg font-bold leading-tight break-words">
                  {modalEmpresa.razao_social || modalEmpresa.nome}
                </h2>
                {modalEmpresa.apelido && (
                  <p className="text-xs text-[#D4AF37] font-semibold mt-0.5">
                    Apelido/Fantasia: {modalEmpresa.apelido}
                  </p>
                )}
              </div>
              <button
                onClick={() => setModalEmpresa(null)}
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo do Modal */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
              {/* Seção Documentos */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#0F294A]" />
                  Documentos & Inscrições
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">
                      {modalEmpresa.tipo_documento || 'Documento'}
                    </span>
                    <span className="font-mono font-bold text-slate-800 text-sm">
                      {modalEmpresa.numero_documento || 'Não informado'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Inscrição Estadual</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {modalEmpresa.inscricao_estadual || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Inscrição Municipal</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {modalEmpresa.inscricao_municipal || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Junta Comercial</span>
                    <span className="font-mono font-semibold text-slate-700">
                      {modalEmpresa.inscricao_junta_comercial || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção Endereço */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#0F294A]" />
                  Localização & Endereço
                </h4>
                <div className="space-y-1">
                  <div className="font-medium text-slate-800">
                    {modalEmpresa.tipo_endereco ? `${modalEmpresa.tipo_endereco} ` : ''}
                    {modalEmpresa.endereco || 'Endereço não informado'}
                    {modalEmpresa.numero_endereco ? `, ${modalEmpresa.numero_endereco}` : ''}
                    {modalEmpresa.complemento ? ` (${modalEmpresa.complemento})` : ''}
                  </div>
                  <div className="text-slate-600">
                    Bairro: <strong>{modalEmpresa.bairro || '—'}</strong> • Município:{' '}
                    <strong>{modalEmpresa.municipio || '—'}</strong>/{modalEmpresa.uf || '—'}
                  </div>
                  <div className="text-slate-500 font-mono text-[11px]">
                    CEP: {modalEmpresa.cep || '—'} • País: {modalEmpresa.pais || 'BRASIL'}
                  </div>
                </div>
              </div>

              {/* Seção Contato */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#0F294A]" />
                  Contatos
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Telefone</span>
                    <span className="font-semibold text-slate-800">
                      {modalEmpresa.telefone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">E-mail</span>
                    <span className="font-semibold text-slate-800 break-all">
                      {modalEmpresa.email || '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Seção Atividade & Gestão */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200">
                <h4 className="font-bold text-slate-800 text-[11px] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-[#0F294A]" />
                  Atividade Econômica & Gestão
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[10.5px]">Ramo de Atividade</span>
                    <span className="font-medium text-slate-800">
                      {modalEmpresa.ramo_atividade || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">CNAE Principal</span>
                    <span className="font-mono font-semibold text-slate-800">
                      {modalEmpresa.cnae || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Natureza Jurídica</span>
                    <span className="font-semibold text-slate-800">
                      {modalEmpresa.natureza_juridica || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">
                      Início das Atividades
                    </span>
                    <span className="font-semibold text-slate-800">
                      {modalEmpresa.inicio_atividades || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">
                      Cliente ADECONT Desde
                    </span>
                    <span className="font-semibold text-[#0F294A]">
                      {modalEmpresa.cliente_desde || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Contador Responsável</span>
                    <span className="font-semibold text-slate-800">
                      {modalEmpresa.contador || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10.5px]">Responsável Legal</span>
                    <span className="font-semibold text-slate-800">
                      {modalEmpresa.responsavel_legal || '—'}
                    </span>
                  </div>
                  {modalEmpresa.capital_social && (
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">Capital Social</span>
                      <span className="font-semibold text-slate-800">
                        R$ {modalEmpresa.capital_social}
                      </span>
                    </div>
                  )}
                  {modalEmpresa.pagina && (
                    <div>
                      <span className="text-slate-400 block text-[10.5px]">
                        Página Relatório PDF
                      </span>
                      <span className="font-mono text-slate-700">Pág. {modalEmpresa.pagina}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Rodapé do Modal */}
            <div className="p-3 bg-slate-100 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setModalEmpresa(null)}
                className="px-4 py-1.5 bg-[#0F294A] text-white rounded-lg text-xs font-bold hover:bg-[#183b68] transition-colors"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RODAPÉ INSTITUCIONAL */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-4 border-t border-slate-800 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-200">ADECONT</span>
            <span>— Assessoria Contábil e Administrativa</span>
          </div>
          <div className="text-[11px] text-slate-500">
            Base Cadastral de Empresas • Consulta Analítica Integrada
          </div>
        </div>
      </footer>
    </div>
  )
}
