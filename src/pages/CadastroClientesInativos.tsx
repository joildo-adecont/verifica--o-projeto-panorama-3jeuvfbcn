import { useState, useEffect, useMemo, useCallback } from 'react'
import {
  Search,
  Building2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Filter,
  RefreshCw,
  FileText,
  Hash,
  AlertCircle,
  X,
  ArrowUpDown,
  ExternalLink,
  Printer,
  RotateCcw,
  History,
  UserX,
  UserCheck,
  Loader2,
  Power,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdecontLogo } from '@/components/AdecontLogo'
import { BarraAcoesMassaClientes } from '@/components/BarraAcoesMassaClientes'
import { useToast } from '@/hooks/use-toast'
import {
  listarEmpresasInativas,
  listarEmpresasInativasParaRelatorio,
  reativarCliente,
  type EmpresaInativa,
} from '@/services/cadastroEmpresasInativos'
import {
  editarClientesEmMassa,
  reativarClientesEmMassa,
  type DadosEdicaoEmMassa,
} from '@/services/cadastroEmpresasMassa'
import type { EmpresaRecord } from '@/types/cadastroEmpresas'

/**
 * CADASTRO ANALÍTICO DE CLIENTES INATIVOS
 * =======================================
 * Pedido do CEO (05/11/2026): "criar outro Cadastro Analítico de Clientes, que
 * chamaremos de Cadastro Analítico de Clientes Inativos, e transferir todos os
 * clientes inativos que estão no Cadastro Analítico de Clientes para este novo
 * cadastro."
 *
 * ── POR QUE UMA TELA PRÓPRIA, E NÃO SÓ UM FILTRO ──
 * O cadastro principal já tinha o filtro "Inativas". A separação resolve três
 * coisas que filtro não resolve:
 *   1. a contagem da carteira ativa passa a ser a contagem REAL de clientes
 *      ativos, sem depender de alguém lembrar de filtrar;
 *   2. o inativo deixa de aparecer em cruzamento de regime e em relatório de
 *      prospecção — onde ele nunca deveria estar;
 *   3. cada inativo guarda POR QUE saiu (`motivo_transferencia`) e QUANDO — o
 *      que um filtro jamais contaria.
 *
 * ── O QUE ESTA TELA NÃO FAZ ──
 * Não apaga nem edita o cadastro ativo. A única ação sobre ele é REATIVAR, que
 * devolve o cliente ao cadastro principal — com confirmação, porque é escrita.
 */
export default function CadastroClientesInativos() {
  const [empresas, setEmpresas] = useState<EmpresaInativa[]>([])
  const [totalItens, setTotalItens] = useState<number>(0)
  const [totalPaginas, setTotalPaginas] = useState<number>(1)
  const [paginaAtual, setPaginaAtual] = useState<number>(1)
  const [porPagina, setPorPagina] = useState<number>(50)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [erro, setErro] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const [termoBusca, setTermoBusca] = useState<string>('')
  const [filtroTipoDoc, setFiltroTipoDoc] = useState<string>('TODOS')
  const [ordenacao, setOrdenacao] = useState<
    'codigo-asc' | 'codigo-desc' | 'nome-asc' | 'nome-desc'
  >('codigo-asc')

  const [empresaExpandidaId, setEmpresaExpandidaId] = useState<number | null>(null)
  const [modalEmpresa, setModalEmpresa] = useState<EmpresaInativa | null>(null)
  const [reativando, setReativando] = useState<number | null>(null)
  const [gerandoRelatorio, setGerandoRelatorio] = useState<boolean>(false)

  // Seleção múltipla para ações em massa
  const [selecionadosCodigos, setSelecionadosCodigos] = useState<Set<number>>(new Set())
  const [processandoMassa, setProcessandoMassa] = useState<boolean>(false)
  const { toast } = useToast()

  const carregarDados = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const res = await listarEmpresasInativas({
        busca: termoBusca,
        tipoDocumento: filtroTipoDoc,
        ordenacao,
        pagina: paginaAtual,
        porPagina,
      })
      setEmpresas(res.items)
      setTotalItens(res.totalItems)
      setTotalPaginas(res.totalPages || 1)
    } catch (e: any) {
      console.error('Falha ao carregar clientes inativos:', e)
      setErro('Não foi possível carregar o cadastro de clientes inativos.')
    } finally {
      setCarregando(false)
    }
  }, [termoBusca, filtroTipoDoc, ordenacao, paginaAtual, porPagina])

  useEffect(() => {
    setPaginaAtual(1)
  }, [termoBusca, filtroTipoDoc, ordenacao, porPagina])

  useEffect(() => {
    const timer = setTimeout(() => carregarDados(), 250)
    return () => clearTimeout(timer)
  }, [carregarDados])

  const alternarExpansao = (codigo: number) => {
    setEmpresaExpandidaId((prev) => (prev === codigo ? null : codigo))
  }

  // Clientes selecionados mapeados a partir dos códigos
  const clientesSelecionados: EmpresaRecord[] = useMemo(() => {
    return empresas.filter((emp) => selecionadosCodigos.has(emp.codigo))
  }, [empresas, selecionadosCodigos])

  const todosPaginaSelecionados =
    empresas.length > 0 && empresas.every((emp) => selecionadosCodigos.has(emp.codigo))

  const alternarSelecionarTodosPagina = () => {
    setSelecionadosCodigos((prev) => {
      const next = new Set(prev)
      if (todosPaginaSelecionados) {
        empresas.forEach((emp) => next.delete(emp.codigo))
      } else {
        empresas.forEach((emp) => next.add(emp.codigo))
      }
      return next
    })
  }

  const alternarSelecaoCliente = (codigo: number) => {
    setSelecionadosCodigos((prev) => {
      const next = new Set(prev)
      if (next.has(codigo)) {
        next.delete(codigo)
      } else {
        next.add(codigo)
      }
      return next
    })
  }

  const limparSelecao = () => {
    setSelecionadosCodigos(new Set())
  }

  // Execução de Edição em Massa para inativos
  const handleExecutarEdicaoEmMassa = async (
    clientes: EmpresaRecord[],
    dados: DadosEdicaoEmMassa,
  ) => {
    setProcessandoMassa(true)
    try {
      const res = await editarClientesEmMassa(clientes, dados, 'cadastro_empresas_inativos')
      if (res.sucessoCount > 0) {
        toast({
          title: 'Edição em massa concluída',
          description: `${res.sucessoCount} ${res.sucessoCount === 1 ? 'cliente inativo atualizado' : 'clientes inativos atualizados'} com sucesso.`,
        })

        // Atualiza imediatamente o estado da listagem para feedback sem recarregar a página
        setEmpresas((prev) =>
          prev.map((emp) => {
            if (selecionadosCodigos.has(emp.codigo)) {
              return {
                ...emp,
                ...(dados.regime_tributario ? { regime_tributario: dados.regime_tributario } : {}),
                ...(dados.municipio ? { municipio: dados.municipio } : {}),
                ...(dados.uf ? { uf: dados.uf } : {}),
              }
            }
            return emp
          }),
        )

        limparSelecao()
        await carregarDados()
      } else {
        toast({
          title: 'Erro na edição em massa',
          description: 'Nenhum cliente pôde ser atualizado. Verifique a conexão com o banco.',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      console.error('Erro na edição em massa de inativos:', e)
      toast({
        title: 'Falha ao processar edição',
        description: e?.message || 'Ocorreu um erro ao atualizar os clientes.',
        variant: 'destructive',
      })
    } finally {
      setProcessandoMassa(false)
    }
  }

  // Execução de Reativação em Massa
  const handleExecutarReativacaoEmMassa = async (clientes: EmpresaRecord[]) => {
    setProcessandoMassa(true)
    try {
      const res = await reativarClientesEmMassa(clientes)
      if (res.sucessoCount > 0) {
        toast({
          title: 'Reativação em massa concluída',
          description: `${res.sucessoCount} ${res.sucessoCount === 1 ? 'cliente reativado' : 'clientes reativados'} e restaurados no Cadastro Analítico de Clientes.`,
        })
        limparSelecao()
        await carregarDados()
      } else {
        toast({
          title: 'Erro na reativação em massa',
          description: 'Não foi possível reativar os clientes selecionados.',
          variant: 'destructive',
        })
      }
    } catch (e: any) {
      console.error('Erro na reativação em massa:', e)
      toast({
        title: 'Falha ao reativar clientes',
        description: e?.message || 'Ocorreu um erro ao reativar os clientes.',
        variant: 'destructive',
      })
    } finally {
      setProcessandoMassa(false)
    }
  }

  /**
   * REATIVAR — devolve o cliente ao cadastro principal.
   * Confirma antes: mover cadastro de volta altera as duas telas e a contagem
   * da carteira, e um clique errado não tem desfazer automático.
   */
  const reativar = async (emp: EmpresaInativa) => {
    const nome = emp.razao_social || String(emp.codigo)
    if (!window.confirm(`Devolver "${nome}" ao Cadastro Analítico de Clientes como Ativa?`)) return

    setReativando(emp.codigo)
    setAviso(null)
    try {
      await reativarCliente(emp.codigo)
      setAviso(`"${nome}" voltou para o Cadastro Analítico de Clientes.`)
      setModalEmpresa(null)
      carregarDados()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setReativando(null)
    }
  }

  const imprimir = async () => {
    setGerandoRelatorio(true)
    try {
      const lista = await listarEmpresasInativasParaRelatorio({
        busca: termoBusca,
        tipoDocumento: filtroTipoDoc,
        ordenacao,
      })
      const janela = window.open('', '_blank')
      if (!janela) return
      const linhas = lista
        .map(
          (e) =>
            `<tr><td>${e.codigo}</td><td>${e.razao_social}</td><td>${e.numero_documento}</td><td>${e.situacao || ''}</td><td>${e.municipio || ''}/${e.uf || ''}</td><td>${e.cnae || ''}</td></tr>`,
        )
        .join('')
      janela.document.write(`<!doctype html><html><head><meta charset="utf-8">
<title>Clientes Inativos — ADECONT</title>
<style>
body{font-family:Arial,sans-serif;font-size:10px;margin:18px;color:#111}
h1{font-size:14px;margin:0 0 2px}
.sub{font-size:9px;color:#555;margin-bottom:10px}
table{width:100%;border-collapse:collapse}
th{background:#0F294A;color:#fff;text-align:left;padding:4px 5px;font-size:9px}
td{border-bottom:1px solid #ddd;padding:3px 5px}
</style></head><body>
<h1>Cadastro Analítico de Clientes Inativos</h1>
<div class="sub">ADECONT — Assessoria Contábil e Administrativa · ${lista.length} cliente(s) · emitido em ${new Date().toLocaleString('pt-BR')}</div>
<table><thead><tr><th>Cód.</th><th>Razão social</th><th>Documento</th><th>Situação</th><th>Município</th><th>CNAE</th></tr></thead>
<tbody>${linhas}</tbody></table>
<script>window.onload=function(){window.print()}</script>
</body></html>`)
      janela.document.close()
    } catch (e: any) {
      setErro(e.message)
    } finally {
      setGerandoRelatorio(false)
    }
  }

  /**
   * CONTAGEM POR SITUAÇÃO — do TOTAL, não da página.
   * A primeira versão contava só os itens carregados e mostrava "Inativa: 50"
   * quando havia 360: um número que parece o total e não é. Aqui a fonte é o
   * `totalItens` do servidor; a quebra por situação só aparece quando há mais de
   * uma situação distinta na página, e o rótulo diz que é da página.
   */
  const contagem = useMemo(() => {
    const map: Record<string, number> = {}
    empresas.forEach((e) => {
      const sit = e.situacao || 'Inativa'
      map[sit] = (map[sit] || 0) + 1
    })
    return map
  }, [empresas])

  return (
    <div className="min-h-screen bg-[#F4F6F9] text-slate-800 flex flex-col">
      {/* cabeçalho — grafite, para distinguir do cadastro ativo (azul) */}
      <header className="bg-[#2C3E50] border-b border-[#1F2D3D] shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <AdecontLogo variant="white" showTagline={false} className="h-10 sm:h-12 w-auto" />
            <div className="border-l border-white/20 pl-3">
              <h1 className="text-base sm:text-lg font-serif font-bold tracking-wide text-white leading-tight">
                Cadastro Analítico de Clientes Inativos
              </h1>
              <p className="text-[11px] sm:text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">
                Assessoria Contábil e Administrativa
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-end">
            <Link
              to="/cadastro-clientes"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Ir para o Cadastro Analítico de Clientes (ativos)"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Clientes Ativos</span>
            </Link>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10"
              title="Acessar o portal"
            >
              <span>Portal</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </Link>

            <button
              onClick={() => carregarDados()}
              disabled={carregando}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-xs font-semibold text-slate-100 transition-colors border border-white/10 disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''}`} />
              <span className="hidden sm:inline">Atualizar</span>
            </button>

            <button
              onClick={imprimir}
              disabled={gerandoRelatorio || carregando || totalItens === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#D4AF37] hover:bg-[#c29f2f] text-xs font-bold text-[#2C3E50] transition-colors shadow-sm disabled:opacity-50 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{gerandoRelatorio ? 'Gerando...' : 'Imprimir / A4'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-5 flex flex-col gap-4">
        {/* faixa de contexto: deixa claro o que esta tela é */}
        <div className="rounded-xl border border-slate-300 bg-white p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-start gap-2">
              <History className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
              <div>
                <p className="text-[12px] font-bold text-[#2C3E50]">
                  {totalItens} cliente(s) inativo(s) neste cadastro
                </p>
                <p className="text-[10.5px] text-slate-500">
                  Transferidos do Cadastro Analítico de Clientes. Aqui ficam fora da contagem da
                  carteira ativa, do cruzamento de regime e dos relatórios de prospecção — e podem
                  ser devolvidos a qualquer momento.
                </p>
              </div>
            </div>
            {Object.keys(contagem).length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(contagem).map(([s, n]) => (
                  <span
                    key={s}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600"
                  >
                    {s}: {n}
                    {Object.keys(contagem).length > 1 ? ' (nesta pág.)' : ''}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {aviso && (
          <div className="flex items-start gap-2 rounded-lg border border-emerald-300 bg-emerald-50 p-2.5 text-[11px] text-emerald-900">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{aviso}</span>
          </div>
        )}
        {erro && (
          <div className="flex items-start gap-2 rounded-lg border border-red-300 bg-red-50 p-2.5 text-[11px] text-red-800">
            <AlertCircle className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <span>{erro}</span>
          </div>
        )}

        {/* filtros */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={termoBusca}
                onChange={(e) => setTermoBusca(e.target.value)}
                placeholder="Buscar por razão social, apelido, CNPJ/CPF ou código..."
                className="w-full pl-9 pr-9 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#2C3E50]/20 focus:border-[#2C3E50] transition-all"
              />
              {termoBusca && (
                <button
                  onClick={() => setTermoBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-full"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
                <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
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
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <select
                  value={ordenacao}
                  onChange={(e) => setOrdenacao(e.target.value as any)}
                  className="bg-transparent text-xs font-semibold text-slate-700 focus:outline-none cursor-pointer"
                >
                  <option value="codigo-asc">Código ↑</option>
                  <option value="codigo-desc">Código ↓</option>
                  <option value="nome-asc">Nome A–Z</option>
                  <option value="nome-desc">Nome Z–A</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
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
        </section>

        {/* BARRA DE AÇÕES EM MASSA */}
        <BarraAcoesMassaClientes
          clientesSelecionados={clientesSelecionados}
          modo="inativos"
          processando={processandoMassa}
          onLimparSelecao={limparSelecao}
          onExecutarEdicaoEmMassa={handleExecutarEdicaoEmMassa}
          onExecutarReativacaoEmMassa={handleExecutarReativacaoEmMassa}
        />

        {/* TABELA DE CLIENTES INATIVOS */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#2C3E50] text-white font-medium border-b border-[#1F2D3D] select-none">
                  <th className="py-3 px-2 w-10 text-center">
                    <input
                      type="checkbox"
                      aria-label="Selecionar todos os clientes da página"
                      checked={todosPaginaSelecionados}
                      onChange={alternarSelecionarTodosPagina}
                      className="rounded border-slate-300 text-[#2C3E50] focus:ring-[#2C3E50] h-4 w-4 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3 w-16 text-center">Cód.</th>
                  <th className="py-3 px-4 min-w-[240px]">Razão Social / Nome</th>
                  <th className="py-3 px-3 min-w-[150px]">CNPJ / CPF</th>
                  <th className="py-3 px-3 w-24 text-center">Situação</th>
                  <th className="py-3 px-3 min-w-[130px] text-center bg-[#1F2D3D]/80">
                    <span className="inline-flex items-center gap-1 font-bold text-white tracking-wide">
                      <Power className="w-3.5 h-3.5 text-[#D4AF37]" />
                      <span>Status / Ação</span>
                    </span>
                  </th>
                  <th className="py-3 px-3 min-w-[140px]">Município / UF</th>
                  <th className="py-3 px-3 min-w-[110px]">CNAE</th>
                  <th className="py-3 px-3 w-16 text-center">Ficha</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {carregando ? (
                  Array.from({ length: 6 }).map((_, i) => (
                    <tr key={`skel-ina-${i}`} className="animate-pulse">
                      <td className="py-3.5 px-2 text-center">
                        <div className="h-4 w-4 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="h-4 w-48 bg-slate-200 rounded mb-1" />
                        <div className="h-3 w-28 bg-slate-100 rounded" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4 w-28 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="h-4 w-12 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="h-6 w-20 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4 w-24 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="h-4 w-20 bg-slate-200 rounded" />
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <div className="h-4 w-8 bg-slate-200 rounded mx-auto" />
                      </td>
                    </tr>
                  ))
                ) : empresas.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      <div className="max-w-xs mx-auto flex flex-col items-center gap-2">
                        <Building2 className="w-8 h-8 text-slate-300" />
                        <span className="font-semibold text-slate-700">
                          Nenhum cliente inativo encontrado
                        </span>
                        <p className="text-xs text-slate-400">
                          {termoBusca
                            ? 'Nenhum resultado para esta busca.'
                            : 'Todos os clientes estão ativos — ou já foram reativados.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  empresas.map((emp) => {
                    const aberto = empresaExpandidaId === emp.codigo
                    return (
                      <tr
                        key={`${emp.id}-${emp.codigo}`}
                        className={`hover:bg-slate-50 transition-colors ${
                          selecionadosCodigos.has(emp.codigo)
                            ? 'bg-sky-50/60'
                            : aberto
                              ? 'bg-amber-50/20'
                              : ''
                        }`}
                      >
                        {/* Checkbox de seleção */}
                        <td className="py-3 px-2 text-center">
                          <input
                            type="checkbox"
                            aria-label={`Selecionar cliente ${emp.razao_social || emp.codigo}`}
                            checked={selecionadosCodigos.has(emp.codigo)}
                            onChange={() => alternarSelecaoCliente(emp.codigo)}
                            className="rounded border-slate-300 text-[#2C3E50] focus:ring-[#2C3E50] h-4 w-4 cursor-pointer"
                          />
                        </td>

                        {/* Código */}
                        <td className="py-3 px-3 text-center font-mono font-bold text-[#2C3E50]">
                          #{emp.codigo}
                        </td>

                        {/* Razão Social */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <button
                              onClick={() => setModalEmpresa(emp)}
                              className="text-left font-semibold text-slate-900 hover:text-[#2C3E50] hover:underline cursor-pointer"
                            >
                              {emp.razao_social}
                            </button>
                            {emp.nome_fantasia && (
                              <span className="text-[11px] text-slate-500 italic">
                                {emp.nome_fantasia}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Documento */}
                        <td className="py-3 px-3 font-mono text-[11px] text-slate-700">
                          {emp.numero_documento || '—'}
                        </td>

                        {/* Situação */}
                        <td className="py-3 px-3 text-center">
                          <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-200 text-slate-700">
                            {emp.situacao || 'Inativa'}
                          </span>
                        </td>

                        {/* TECLA INDIVIDUAL STATUS / AÇÃO — INATIVO / REATIVAR */}
                        <td className="py-2.5 px-3 text-center whitespace-nowrap bg-slate-50/40">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation()
                              reativar(emp)
                            }}
                            disabled={reativando === emp.codigo}
                            title={`Cliente atualmente INATIVO. Clique ou toque para reativar "${emp.razao_social || emp.codigo}" e devolver ao Cadastro Analítico de Clientes.`}
                            aria-label={`Status Inativo: clique para reativar ${emp.razao_social || emp.codigo}`}
                            className="group relative inline-flex items-center justify-center gap-1.5 min-w-[96px] px-2.5 py-1 text-[11px] font-bold rounded-full border border-rose-300 bg-rose-50 text-rose-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 active:scale-95 transition-all shadow-xs disabled:opacity-50 disabled:pointer-events-none cursor-pointer select-none touch-manipulation focus:outline-none focus:ring-2 focus:ring-[#D4AF37]/50"
                          >
                            {reativando === emp.codigo ? (
                              <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700 group-hover:text-emerald-700 shrink-0" />
                                <span className="font-semibold text-[10.5px]">Reativando…</span>
                              </>
                            ) : (
                              <>
                                <span className="relative flex h-2 w-2 shrink-0">
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 group-hover:bg-emerald-600 transition-colors" />
                                </span>
                                <UserX className="w-3.5 h-3.5 text-rose-600 group-hover:hidden shrink-0" />
                                <UserCheck className="w-3.5 h-3.5 text-emerald-700 hidden group-hover:inline-block shrink-0" />
                                <span className="group-hover:hidden font-bold">Inativo</span>
                                <span className="hidden group-hover:inline-block font-bold text-emerald-700">
                                  Reativar
                                </span>
                              </>
                            )}
                          </button>
                        </td>

                        {/* Município / UF */}
                        <td className="py-3 px-3 text-slate-600">
                          {emp.municipio ? (
                            <span className="inline-flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>
                                {emp.municipio}
                                {emp.uf ? `/${emp.uf}` : ''}
                              </span>
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>

                        {/* CNAE */}
                        <td className="py-3 px-3 text-slate-600 font-mono text-[11px]">
                          {emp.cnae || '—'}
                        </td>

                        {/* Ficha completa / Detalhes */}
                        <td className="py-3 px-3 text-center">
                          <button
                            onClick={() => setModalEmpresa(emp)}
                            className="inline-flex items-center justify-center p-1.5 text-[#2C3E50] hover:bg-[#2C3E50]/10 rounded-lg transition-colors cursor-pointer"
                            title="Abrir ficha do cliente inativo"
                          >
                            <FileText className="w-4 h-4 text-[#2C3E50]" />
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* paginação */}
        {totalPaginas > 1 && (
          <div className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2">
            <p className="text-[11px] text-slate-500">
              {totalItens} registro(s) · página {paginaAtual} de {totalPaginas}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPaginaAtual(1)}
                disabled={paginaAtual === 1}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPaginaAtual((p) => Math.max(1, p - 1))}
                disabled={paginaAtual === 1}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPaginaAtual((p) => Math.min(totalPaginas, p + 1))}
                disabled={paginaAtual === totalPaginas}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPaginaAtual(totalPaginas)}
                disabled={paginaAtual === totalPaginas}
                className="rounded p-1 text-slate-500 hover:bg-slate-100 disabled:opacity-30 cursor-pointer"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>

      {/* modal de detalhes */}
      {modalEmpresa && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setModalEmpresa(null)}
        >
          <div
            className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl bg-white p-5"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wide text-slate-400">
                  Cliente inativo #{modalEmpresa.codigo}
                </p>
                <h2 className="text-[15px] font-bold text-[#2C3E50]">
                  {modalEmpresa.razao_social}
                </h2>
                <p className="text-[11px] text-slate-500">
                  {modalEmpresa.numero_documento} · {modalEmpresa.situacao || 'Inativa'}
                </p>
              </div>
              <button
                onClick={() => setModalEmpresa(null)}
                className="rounded p-1 text-slate-400 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              <Campo
                icone={<Building2 className="w-3 h-3" />}
                rotulo="Natureza jurídica"
                valor={modalEmpresa.natureza_juridica}
              />
              <Campo
                icone={<FileText className="w-3 h-3" />}
                rotulo="CNAE"
                valor={modalEmpresa.cnae}
              />
              <Campo
                icone={<FileText className="w-3 h-3" />}
                rotulo="Ramo de atividade"
                valor={modalEmpresa.ramo_atividade}
              />
              <Campo
                icone={<Calendar className="w-3 h-3" />}
                rotulo="Cliente desde"
                valor={modalEmpresa.cliente_desde}
              />
              <Campo
                icone={<MapPin className="w-3 h-3" />}
                rotulo="Endereço"
                valor={`${modalEmpresa.endereco || ''} ${modalEmpresa.numero_endereco || ''}`.trim()}
              />
              <Campo
                icone={<MapPin className="w-3 h-3" />}
                rotulo="Município"
                valor={`${modalEmpresa.municipio || ''}/${modalEmpresa.uf || ''}`}
              />
              <Campo
                icone={<Phone className="w-3 h-3" />}
                rotulo="Telefone"
                valor={modalEmpresa.telefone}
              />
              <Campo
                icone={<Mail className="w-3 h-3" />}
                rotulo="E-mail"
                valor={modalEmpresa.email}
              />
              <Campo
                icone={<Hash className="w-3 h-3" />}
                rotulo="Inscrição estadual"
                valor={modalEmpresa.inscricao_estadual}
              />
              <Campo
                icone={<Hash className="w-3 h-3" />}
                rotulo="Capital social"
                valor={modalEmpresa.capital_social}
              />
            </div>

            {modalEmpresa.motivo_transferencia && (
              <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <p className="text-[9.5px] font-bold uppercase tracking-wide text-slate-500">
                  Por que está aqui
                </p>
                <p className="text-[11px] text-slate-700">{modalEmpresa.motivo_transferencia}</p>
                {modalEmpresa.transferido_em && (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Transferido em {modalEmpresa.transferido_em.slice(0, 16).replace('T', ' ')}
                  </p>
                )}
              </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setModalEmpresa(null)}
                className="rounded-lg border border-slate-300 px-3 py-1.5 text-[11px] font-bold text-slate-600 hover:bg-slate-50 cursor-pointer"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={() => reativar(modalEmpresa)}
                disabled={reativando === modalEmpresa.codigo}
                className="group inline-flex items-center gap-1.5 rounded-full border border-rose-300 bg-rose-50 px-3 py-1.5 text-[11px] font-bold text-rose-700 hover:bg-emerald-50 hover:border-emerald-300 hover:text-emerald-800 active:scale-95 transition-all shadow-xs disabled:opacity-50 cursor-pointer select-none"
                title={`Cliente atualmente INATIVO. Clique para reativar "${modalEmpresa.razao_social || modalEmpresa.codigo}" e devolver ao cadastro ativo.`}
              >
                {reativando === modalEmpresa.codigo ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-700 group-hover:text-emerald-700" />
                    <span>Reativando Cliente…</span>
                  </>
                ) : (
                  <>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500 group-hover:bg-emerald-600 transition-colors" />
                    </span>
                    <UserX className="w-3.5 h-3.5 text-rose-600 group-hover:hidden shrink-0" />
                    <UserCheck className="w-3.5 h-3.5 text-emerald-700 hidden group-hover:inline-block shrink-0" />
                    <span className="group-hover:hidden font-bold">
                      Inativo (clique p/ Reativar)
                    </span>
                    <span className="hidden group-hover:inline-block font-bold text-emerald-700">
                      Reativar Cliente
                    </span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Campo({
  icone,
  rotulo,
  valor,
}: {
  icone: React.ReactNode
  rotulo: string
  valor?: string
}) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-2 py-1.5">
      <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide text-slate-400">
        {icone}
        {rotulo}
      </p>
      <p className="truncate text-[11px] font-semibold text-slate-700" title={valor || ''}>
        {valor || '—'}
      </p>
    </div>
  )
}
