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
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { AdecontLogo } from '@/components/AdecontLogo'
import {
  listarEmpresasInativas,
  listarEmpresasInativasParaRelatorio,
  reativarCliente,
  type EmpresaInativa,
} from '@/services/cadastroEmpresasInativos'

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

  const contagem = useMemo(() => {
    const map: Record<string, number> = {}
    empresas.forEach((e) => {
      const s = e.situacao || 'Inativa'
      map[s] = (map[s] || 0) + 1
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

        {/* lista */}
        <section className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {carregando ? (
            <div className="p-10 text-center text-sm text-slate-500">Carregando…</div>
          ) : empresas.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-sm font-semibold text-slate-600">
                Nenhum cliente inativo encontrado
              </p>
              <p className="mt-1 text-xs text-slate-400">
                {termoBusca
                  ? 'Nenhum resultado para esta busca.'
                  : 'Todos os clientes estão ativos — ou já foram reativados.'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {empresas.map((emp) => {
                const aberto = empresaExpandidaId === emp.codigo
                return (
                  <div key={`${emp.id}-${emp.codigo}`}>
                    <div className="flex items-center gap-3 px-4 py-2.5 hover:bg-slate-50">
                      <button
                        onClick={() => alternarExpansao(emp.codigo)}
                        className="p-0.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                      >
                        {aberto ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>

                      <span className="w-12 shrink-0 text-[11px] font-bold text-slate-400">
                        #{emp.codigo}
                      </span>

                      <button
                        onClick={() => setModalEmpresa(emp)}
                        className="flex-1 text-left cursor-pointer"
                      >
                        <p className="text-[13px] font-semibold text-[#2C3E50] hover:underline">
                          {emp.razao_social}
                          {emp.nome_fantasia && (
                            <span className="ml-1.5 text-[11px] font-normal text-slate-400">
                              ({emp.nome_fantasia})
                            </span>
                          )}
                        </p>
                        <p className="text-[10.5px] text-slate-500">
                          {emp.numero_documento || 'sem documento'}
                          {emp.municipio && ` · ${emp.municipio}/${emp.uf}`}
                          {emp.cnae && ` · CNAE ${emp.cnae}`}
                        </p>
                      </button>

                      <span className="shrink-0 rounded-full bg-slate-200 px-2 py-0.5 text-[9.5px] font-bold text-slate-600">
                        {emp.situacao || 'Inativa'}
                      </span>

                      <button
                        onClick={() => reativar(emp)}
                        disabled={reativando === emp.codigo}
                        title="Devolver ao Cadastro Analítico de Clientes"
                        className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[#2C3E50] px-2 py-1 text-[10px] font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
                      >
                        <RotateCcw className="w-3 h-3" />
                        {reativando === emp.codigo ? '...' : 'Reativar'}
                      </button>
                    </div>

                    {aberto && (
                      <div className="border-t border-slate-100 bg-slate-50/60 px-4 py-3 pl-16">
                        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                          <Campo
                            icone={<Hash className="w-3 h-3" />}
                            rotulo="Documento"
                            valor={emp.numero_documento}
                          />
                          <Campo
                            icone={<Building2 className="w-3 h-3" />}
                            rotulo="Natureza"
                            valor={emp.natureza_juridica}
                          />
                          <Campo
                            icone={<MapPin className="w-3 h-3" />}
                            rotulo="Endereço"
                            valor={`${emp.endereco || ''} ${emp.numero_endereco || ''}`.trim()}
                          />
                          <Campo
                            icone={<MapPin className="w-3 h-3" />}
                            rotulo="Município"
                            valor={`${emp.municipio || ''}/${emp.uf || ''}`}
                          />
                          <Campo
                            icone={<Phone className="w-3 h-3" />}
                            rotulo="Telefone"
                            valor={emp.telefone}
                          />
                          <Campo
                            icone={<Mail className="w-3 h-3" />}
                            rotulo="E-mail"
                            valor={emp.email}
                          />
                          <Campo
                            icone={<Calendar className="w-3 h-3" />}
                            rotulo="Cliente desde"
                            valor={emp.cliente_desde}
                          />
                          <Campo
                            icone={<FileText className="w-3 h-3" />}
                            rotulo="CNAE"
                            valor={emp.cnae}
                          />
                        </div>
                        {emp.motivo_transferencia && (
                          <p className="mt-2 text-[10px] text-slate-500">
                            <strong>Motivo da transferência:</strong> {emp.motivo_transferencia}
                            {emp.transferido_em && ` · em ${emp.transferido_em.slice(0, 10)}`}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
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
                onClick={() => reativar(modalEmpresa)}
                disabled={reativando === modalEmpresa.codigo}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#2C3E50] px-3 py-1.5 text-[11px] font-bold text-white hover:opacity-90 disabled:opacity-50 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                {reativando === modalEmpresa.codigo ? 'Reativando…' : 'Devolver ao cadastro ativo'}
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
