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
import { Printer, FileSpreadsheet } from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdecontLogo } from '@/components/AdecontLogo'
import { listarEmpresas, listarEmpresasParaRelatorio } from '@/services/cadastroEmpresas'
import { RelatorioClientesImprimivel } from '@/components/RelatorioClientesImprimivel'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

export default function CadastroClientes() {
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

  // Estado do Relatório A4 impresso/PDF
  const [modalRelatorioAberto, setModalRelatorioAberto] = useState<boolean>(false)
  const [empresasRelatorio, setEmpresasRelatorio] = useState<EmpresaRecord[]>([])
  const [gerandoRelatorio, setGerandoRelatorio] = useState<boolean>(false)

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

  // Prepara e abre o relatório A4 com a listagem completa conforme filtros atuais
  const abrirRelatorioA4 = async () => {
    setGerandoRelatorio(true)
    try {
      const listaCompleta = await listarEmpresasParaRelatorio({
        busca: termoBusca,
        tipoDocumento: filtroTipoDoc,
        situacao: filtroSituacao,
        ordenacao,
      })
      setEmpresasRelatorio(listaCompleta)
      setModalRelatorioAberto(true)
    } catch (e) {
      console.error('Erro ao gerar relatório A4:', e)
      // Se falhar o lote completo, usa o lote da página atual como contingência
      setEmpresasRelatorio(empresas)
      setModalRelatorioAberto(true)
    } finally {
      setGerandoRelatorio(false)
    }
  }

  // Resumo de contadores da página exibida
  const resumoContadores = useMemo(() => {
    let cnpjCount = 0
    let cpfCount = 0
    let outrosCount = 0
    empresas.forEach((emp) => {
      if (emp.tipo_documento === 'CNPJ') cnpjCount++
      else if (emp.tipo_documento === 'CPF') cpfCount++
      else outrosCount++
    })
    return { cnpjCount, cpfCount, outrosCount }
  }, [empresas])

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col">
      {/* CABEÇALHO DA CONSULTA DE CLIENTES */}
      <header className="bg-[#0F294A] border-b border-[#0A1D34] shadow-md sticky top-0 z-30">
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
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Acessar o portal de Indicadores Econômicos e Reforma Tributária"
            >
              <span>Portal Panorama RT</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Link>

            <button
              onClick={() => carregarDados()}
              disabled={carregando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10 disabled:opacity-60 cursor-pointer"
              title="Atualizar lista"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={abrirRelatorioA4}
              disabled={gerandoRelatorio || carregando || totalItens === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29f2f] text-xs font-bold text-[#0F294A] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
              title="Gerar e imprimir relatório A4 da consulta com selo ADECONT"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{gerandoRelatorio ? 'Gerando...' : 'Imprimir / A4'}</span>
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
                  <option value="Suspensa">Suspensas</option>
                  <option value="Baixada">Baixadas</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <span className="font-medium hidden sm:inline">Exibir:</span>
                <select
                  value={porPagina}
                  onChange={(e) => setPorPagina(Number(e.target.value))}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value={25}>25 por pág.</option>
                  <option value={50}>50 por pág.</option>
                  <option value={100}>100 por pág.</option>
                </select>
              </div>
            </div>
          </div>

          {/* Barra de estatísticas da listagem */}
          <div className="mt-3 pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-slate-700">
                {totalItens.toLocaleString('pt-BR')} empresas cadastradas
              </span>
              {termoBusca && (
                <span className="bg-[#0F294A]/10 text-[#0F294A] font-medium px-2 py-0.5 rounded-full text-[11px]">
                  Filtradas por: "{termoBusca}"
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="inline-flex items-center gap-1 text-slate-600">
                <span className="w-2 h-2 rounded-full bg-blue-500" />
                Página atual: {empresas.length} registros
              </span>
              <span className="inline-flex items-center gap-1 text-emerald-700 font-medium">
                Pág. {paginaAtual} de {totalPaginas}
              </span>
            </div>
          </div>
        </section>

        {/* FEEDBACK DE ERRO OU VAZIO */}
        {erro && (
          <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl flex items-center justify-between gap-3 text-sm">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <span>{erro}</span>
            </div>
            <button
              onClick={() => carregarDados()}
              className="px-3 py-1 bg-rose-600 text-white rounded-lg text-xs font-semibold hover:bg-rose-700 transition-colors"
            >
              Recarregar
            </button>
          </div>
        )}

        {/* TABELA ANALÍTICA DE CLIENTES */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#0F294A] text-white font-medium border-b border-[#0A1D34] select-none">
                  <th className="py-3 px-3 w-16 text-center">
                    <button
                      onClick={alternarOrdenacaoCodigo}
                      className="inline-flex items-center gap-1 text-slate-200 hover:text-white font-bold"
                      title="Ordenar por Código"
                    >
                      <span>Cód.</span>
                      <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                    </button>
                  </th>
                  <th className="py-3 px-4 min-w-[260px]">
                    <button
                      onClick={alternarOrdenacaoNome}
                      className="inline-flex items-center gap-1 text-slate-200 hover:text-white font-bold"
                      title="Ordenar por Razão Social"
                    >
                      <span>Razão Social / Nome</span>
                      <ArrowUpDown className="w-3 h-3 text-[#D4AF37]" />
                    </button>
                  </th>
                  <th className="py-3 px-3 min-w-[170px]">Apelido / Fantasia</th>
                  <th className="py-3 px-3 min-w-[150px]">CNPJ / CPF</th>
                  <th className="py-3 px-3 min-w-[140px]">Município / UF</th>
                  <th className="py-3 px-3 min-w-[130px]">Contato</th>
                  <th className="py-3 px-3 w-24 text-center">Situação</th>
                  <th className="py-3 px-3 w-20 text-center">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carregando ? (
                  Array.from({ length: 8 }).map((_, i) => (
                    <tr key={`skel-${i}`} className="animate-pulse">
                      <td className="py-3.5 px-3 text-center">
                        <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-48 bg-slate-200 rounded mb-1" />
                        <div className="h-3 w-28 bg-slate-100 rounded" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4 w-32 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="h-4 w-12 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : empresas.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
                        <Building2 className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-slate-700">Nenhum cliente encontrado</span>
                        <p className="text-xs text-slate-400">
                          Tente mudar os termos de busca ou remover os filtros aplicados.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  empresas.map((emp) => {
                    const expandido = empresaExpandidaId === emp.codigo
                    return (
                      <tr
                        key={emp.codigo}
                        className={`hover:bg-[#F8FAFC] transition-colors ${
                          expandido ? 'bg-amber-50/30' : ''
                        }`}
                      >
                        {/* Código */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#0F294A]">
                          {emp.codigo}
                        </td>

                        {/* Razão Social / Nome */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-semibold text-slate-900 leading-snug">
                              {emp.razao_social || '—'}
                            </span>
                            {emp.tipo_cadastro && (
                              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">
                                {emp.tipo_cadastro}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Apelido / Fantasia */}
                        <td className="py-3 px-3 text-slate-700 font-medium">
                          {emp.apelido || '—'}
                        </td>

                        {/* Documento formatado */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {emp.cpf_cnpj ? (
                            <div className="flex items-center gap-1.5">
                              <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-sans text-[10px] font-bold">
                                {emp.tipo_documento}
                              </span>
                              <span>{emp.cpf_cnpj}</span>
                            </div>
                          ) : (
                            <span className="text-slate-400 italic">Não informado</span>
                          )}
                        </td>

                        {/* Município / UF */}
                        <td className="py-3 px-3 text-slate-600">
                          {emp.municipio ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span className="truncate max-w-[150px]">
                                {emp.municipio}
                                {emp.uf ? `/${emp.uf}` : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* Contato (Telefone/Email) */}
                        <td className="py-3 px-3 text-slate-600">
                          <div className="flex flex-col gap-0.5 text-[11px]">
                            {emp.telefone && (
                              <span className="inline-flex items-center gap-1 text-slate-700">
                                <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="font-mono">{emp.telefone}</span>
                              </span>
                            )}
                            {emp.email && (
                              <span
                                className="inline-flex items-center gap-1 text-slate-500 truncate max-w-[140px]"
                                title={emp.email}
                              >
                                <Mail className="w-3 h-3 text-slate-400 shrink-0" />
                                <span className="truncate">{emp.email}</span>
                              </span>
                            )}
                            {!emp.telefone && !emp.email && (
                              <span className="text-slate-400 italic">—</span>
                            )}
                          </div>
                        </td>

                        {/* Situação */}
                        <td className="py-3 px-3 text-center">
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide ${
                              emp.situacao?.toLowerCase() === 'ativa'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {emp.situacao || 'Ativa'}
                          </span>
                        </td>

                        {/* Ficha completa / Detalhes */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setModalEmpresa(emp)}
                            className="inline-flex items-center justify-center p-1.5 text-[#0F294A] hover:bg-[#0F294A]/10 rounded-lg transition-colors"
                            title="Abrir ficha cadastral completa"
                          >
                            <FileText className="w-4 h-4 text-[#0F294A]" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* RODAPÉ DA TABELA: PAGINAÇÃO */}
          <div className="bg-slate-50 px-4 py-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600">
            <div>
              Mostrando{' '}
              <span className="font-bold text-slate-800">
                {totalItens === 0 ? 0 : (paginaAtual - 1) * porPagina + 1}
              </span>{' '}
              a{' '}
              <span className="font-bold text-slate-800">
                {Math.min(paginaAtual * porPagina, totalItens)}
              </span>{' '}
              de <span className="font-bold text-slate-800">{totalItens.toLocaleString('pt-BR')}</span>{' '}
              clientes
            </div>

            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtual <= 1 || carregando}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Primeira página"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual <= 1 || carregando}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Página anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <span className="px-3 py-1 font-semibold text-slate-700 bg-white border border-slate-200 rounded">
                Página {paginaAtual} de {totalPaginas}
              </span>

              <button
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual >= totalPaginas || carregando}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Próxima página"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtual >= totalPaginas || carregando}
                className="p-1.5 rounded border border-slate-200 bg-white hover:bg-slate-100 disabled:opacity-40 disabled:pointer-events-none transition-colors"
                title="Última página"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* MODAL DETALHADO DA EMPRESA (FICHA CADASTRAL) */}
      {modalEmpresa && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Header da modal */}
            <div className="bg-[#0F294A] px-6 py-4 flex items-center justify-between text-white border-b border-[#0A1D34]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
                  <Building2 className="w-5 h-5 text-[#D4AF37]" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white leading-tight">
                    Ficha Cadastral do Cliente
                  </h3>
                  <span className="text-xs text-[#D4AF37] font-mono">
                    Código do Sistema: {modalEmpresa.codigo}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setModalEmpresa(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Fechar"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Conteúdo da modal */}
            <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
              {/* Identificação Principal */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                    Razão Social
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      modalEmpresa.situacao?.toLowerCase() === 'ativa'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {modalEmpresa.situacao || 'Ativa'}
                  </span>
                </div>
                <div className="text-sm font-bold text-slate-900">
                  {modalEmpresa.razao_social || '—'}
                </div>
                <div className="pt-1 flex flex-wrap gap-4 text-slate-600">
                  <div>
                    <span className="text-slate-400">Apelido/Fantasia: </span>
                    <span className="font-semibold text-slate-800">
                      {modalEmpresa.apelido || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Tipo: </span>
                    <span className="font-mono font-medium">
                      {modalEmpresa.tipo_cadastro || 'Empresa'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Documento ({modalEmpresa.tipo_documento})
                  </span>
                  <div className="font-mono text-sm font-bold text-slate-900">
                    {modalEmpresa.cpf_cnpj || 'Não informado'}
                  </div>
                </div>

                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block mb-1">
                    Inscrição Estadual (IE)
                  </span>
                  <div className="font-mono text-sm text-slate-800">
                    {modalEmpresa.inscricao_estadual || 'Isento / Não informada'}
                  </div>
                </div>
              </div>

              {/* Endereço */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Endereço Cadastrado
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">Logradouro</span>
                    <span className="font-medium text-slate-800">
                      {modalEmpresa.endereco || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Bairro</span>
                    <span className="font-medium text-slate-800">
                      {modalEmpresa.bairro || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Município</span>
                    <span className="font-medium text-slate-800">
                      {modalEmpresa.municipio || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">UF</span>
                    <span className="font-medium text-slate-800">{modalEmpresa.uf || '—'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">CEP</span>
                    <span className="font-mono text-slate-800">{modalEmpresa.cep || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Contatos */}
              <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                  Canais de Contato
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[11px]">Telefone Principal</span>
                    <span className="font-mono font-medium text-slate-800">
                      {modalEmpresa.telefone || '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px]">Telefone Alternativo</span>
                    <span className="font-mono text-slate-800">
                      {modalEmpresa.telefone_2 || '—'}
                    </span>
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-400 block text-[11px]">E-mail</span>
                    <span className="font-mono text-slate-800">{modalEmpresa.email || '—'}</span>
                  </div>
                </div>
              </div>

              {/* Datas de Acompanhamento */}
              <div className="grid grid-cols-2 gap-3 text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Início das Atividades
                  </span>
                  <span className="font-medium">
                    {modalEmpresa.data_inicio_atividades || 'Não registrada'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">
                    Data do Cadastro
                  </span>
                  <span className="font-medium">
                    {modalEmpresa.data_cadastro || 'Não registrada'}
                  </span>
                </div>
              </div>
            </div>

            {/* Rodapé da modal */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Base cadastral interna ADECONT • Protegida
              </span>
              <button
                onClick={() => setModalEmpresa(null)}
                className="px-4 py-1.5 rounded-lg bg-[#0F294A] text-white font-semibold text-xs hover:bg-[#1a3d68] transition-colors"
              >
                Fechar Ficha
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL DO RELATÓRIO A4 IMPRIMÍVEL COM SELO ADECONT */}
      {modalRelatorioAberto && (
        <RelatorioClientesImprimivel
          aberto={modalRelatorioAberto}
          aoFechar={() => setModalRelatorioAberto(false)}
          empresas={empresasRelatorio}
          termoBusca={termoBusca}
          filtroTipoDoc={filtroTipoDoc}
          filtroSituacao={filtroSituacao}
        />
      )}

      {/* RODAPÉ INSTITUCIONAL */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-auto text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            ADECONT Assessoria Contábil e Administrativa • Sistema de Gestão Analítica
          </span>
          <span className="text-[11px] text-slate-400 font-mono">
            {totalItens} registros indexados
          </span>
        </div>
      </footer>
    </div>
  )
}
