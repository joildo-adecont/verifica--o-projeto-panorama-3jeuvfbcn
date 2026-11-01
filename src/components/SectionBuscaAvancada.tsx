import { useState, useEffect, useRef, useTransition } from 'react'
import {
  Search,
  Sparkles,
  Layers,
  Scale,
  Percent,
  TrendingUp,
  FileText,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  HelpCircle,
  Hash,
  X,
  Compass,
  AlertOctagon,
  Shield,
  Building2,
  Users,
  Flame,
  BadgeCheck,
  FileSpreadsheet,
  SlidersHorizontal,
  RotateCcw,
  Check,
  Landmark,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import {
  buscarAvancado,
  type AssuntoEspecialItem,
  type AnexoReformaItem,
  type ResultadoBuscaAvancada,
  type ParametrosBuscaAvancada,
  type FiltrosAvancados,
  type GrupoResultadoId,
  type EsferaFederativaId,
} from '@/services/buscaAvancada'
import { downloadOfficialDocViaProxy } from '@/services/panorama'
import { OPCOES_TABELAS_CLASSIFICACOES } from '@/components/ModalBaseClassificacoes'
import { ModalBuscaAvancada } from '@/components/ModalBuscaAvancada'
import { GraficosBusca } from '@/components/GraficosBusca'
import { ConsultaCompletaAnexos } from '@/components/ConsultaCompletaAnexos'
import { toast } from '@/hooks/use-toast'
import { Send, Share2 } from 'lucide-react'

const SUGESTOES_RAPIDAS = [
  'insumo agropecuário',
  'medicina',
  'dispositivo médico',
  'arroz',
  'cooperativa',
  'serviço de educação',
  'cesta básica',
  'combustíveis',
  'Simples Nacional',
  'imunidade',
  'cigarro',
  'LC 214/2025',
]

const ANEXOS_FILTRO_RAPIDO = [
  { id: 'TODOS', label: 'Todos os Anexos' },
  { id: 'Anexo I', label: 'Anexo I (Cesta Básica 0%)' },
  { id: 'Anexo II', label: 'Anexo II (Educação -60%)' },
  { id: 'Anexo III', label: 'Anexo III (Saúde -60%)' },
  { id: 'Anexo IV', label: 'Anexo IV (Dispositivos Médicos -60%)' },
  { id: 'Anexo V', label: 'Anexo V (Acessibilidade -60%)' },
  { id: 'Anexo VII', label: 'Anexo VII (Cesta Estendida -60%)' },
  { id: 'Anexo VIII', label: 'Anexo VIII (Higiene/Limpeza -60%)' },
  { id: 'Anexo IX', label: 'Anexo IX (Insumos Agro -60%)' },
  { id: 'Anexo X', label: 'Anexo X (Cultura -60%)' },
  { id: 'Anexo XII', label: 'Anexo XII (Médicos Zero 0%)' },
  { id: 'Anexo XIII', label: 'Anexo XIII (Acessibilidade Zero 0%)' },
  { id: 'Anexo XV', label: 'Anexo XV (Hortícolas/Ovos 0%)' },
  { id: 'anexo-profissoes-30', label: 'Profissões Regulamentadas (-30%)' },
  { id: 'anexo-regime-combustiveis', label: 'Combustíveis (Monofásico)' },
  { id: 'anexo-regime-financeiros', label: 'Serviços Financeiros' },
  { id: 'anexo-regime-cooperativas', label: 'Cooperativas (Ato Coop. 0%)' },
  { id: 'anexo-regime-planos-saude', label: 'Planos de Saúde (Deduções)' },
  { id: 'anexo-regime-intercambio', label: 'Intercâmbio / Turismo' },
  { id: 'Anexo XVII', label: 'Anexo XVII (Imposto Seletivo)' },
]

const CATEGORIAS_ESPECIAIS_FILTRO = [
  'TODAS',
  'Imposto do Pecado',
  'Comitê Gestor',
  'Simples Nacional',
  'ME e EPP',
  'Regimes Societários',
  'Entidades Associativas',
  'Sindicatos',
  'Regras Especiais',
  'Imunidades por Produtos e Segmentos',
]

const GRUPOS_CONTEUDO: { id: GrupoResultadoId; label: string; icon: typeof Layers }[] = [
  { id: 'normas', label: 'Normas e Atos', icon: Scale },
  { id: 'classificacoes', label: 'Classificações (11 Tabelas)', icon: Layers },
  { id: 'assuntos-especiais', label: 'Assuntos Especiais', icon: AlertOctagon },
  { id: 'anexos', label: 'Anexos da LC 214', icon: FileSpreadsheet },
  { id: 'aliquotas', label: 'Alíquotas & Desonerações', icon: Percent },
  { id: 'analises', label: 'Análises & Projeções', icon: TrendingUp },
]

const ESFERAS_FEDERATIVAS: { id: EsferaFederativaId; label: string; sigla: string }[] = [
  { id: 'federal', label: 'Federal (União, CGIBS, RFB)', sigla: 'FED' },
  { id: 'estadual', label: 'Estadual (Sefaz, Estados)', sigla: 'EST' },
  { id: 'municipal', label: 'Municipal (Prefeituras, Diários)', sigla: 'MUN' },
]

const FONTES_OFICIAIS_OPCOES = [
  { id: 'CGIBS', label: 'CGIBS (Comitê Gestor)', badge: 'Oficial' },
  { id: 'Planalto', label: 'Planalto (Presidência)', badge: 'Lei/Decreto' },
  { id: 'RFB', label: 'Receita Federal (RFB)', badge: 'Instruções' },
  { id: 'CONFAZ', label: 'CONFAZ', badge: 'Convênios' },
  { id: 'Siscomex', label: 'Siscomex (MDIC)', badge: 'NCM/Aduana' },
  { id: 'IBGE', label: 'IBGE (CNAE)', badge: 'Estatística' },
  { id: 'CGSN', label: 'CGSN (Simples)', badge: 'Simples' },
  { id: 'SUFRAMA', label: 'SUFRAMA (ZFM)', badge: 'Regional' },
]

const TIPOS_ATO_OPCOES = [
  'Resolução',
  'Decreto',
  'Portaria',
  'Ato',
  'Lei Complementar',
  'Emenda Constitucional',
  'Convênio',
]

const REDUCOES_ALIQUOTA_OPCOES = [
  { id: '0%', label: 'Alíquota Zero / Isenção (0%)', badge: 'Cesta Básica' },
  { id: '-30%', label: 'Redução 30% (-30%)', badge: 'Profissões' },
  { id: '-50%', label: 'Redução 50% (-50%)', badge: 'Dedução' },
  { id: '-60%', label: 'Redução 60% (-60%)', badge: 'Saúde / Agro' },
  { id: '-100%', label: 'Desoneração Total (100%)', badge: 'Imunidade' },
]

function extrairTermoInicialUrl(): string {
  if (typeof window === 'undefined') return 'cigarro'
  try {
    // 1. Tenta query param no search (?q=... ou ?busca=...)
    const urlParams = new URLSearchParams(window.location.search)
    const qSearch = urlParams.get('q') || urlParams.get('busca') || urlParams.get('termo')
    if (qSearch && qSearch.trim()) return qSearch.trim()

    // 2. Tenta query param dentro do hash (ex.: #busca-avancada?q=cesta%20basica)
    const hash = window.location.hash || ''
    if (hash.includes('?')) {
      const hashQuery = hash.substring(hash.indexOf('?') + 1)
      const hashParams = new URLSearchParams(hashQuery)
      const qHash = hashParams.get('q') || hashParams.get('busca') || hashParams.get('termo')
      if (qHash && qHash.trim()) return qHash.trim()
    }
  } catch {
    /* intentionally ignored */
  }
  return 'cigarro'
}

export function SectionBuscaAvancada() {
  const [termo, setTermo] = useState<string>(() => extrairTermoInicialUrl())
  const [tipoClassif, setTipoClassif] = useState<string>('TODOS')
  const [atosNivel, setAtosNivel] = useState<'todos' | 'federal' | 'estadual' | 'municipal'>(
    'todos',
  )
  const [categoriaEspecial, setCategoriaEspecial] = useState<string>('TODAS')
  const [filtroAnexo, setFiltroAnexo] = useState<string>('TODOS')
  const [filtros, setFiltros] = useState<FiltrosAvancados>({
    grupos: [],
    esferas: [],
    fontes: [],
    tiposAto: [],
    tabelas: [],
    reducoes: [],
  })
  const [painelFiltrosAberto, setPainelFiltrosAberto] = useState<boolean>(true)
  const [classifPage, setClassifPage] = useState<number>(1)
  const [abaAtiva, setAbaAtiva] = useState<
    | 'tudo'
    | 'consulta-anexos'
    | 'anexos-reforma'
    | 'assuntos-especiais'
    | 'classificacoes'
    | 'atos'
    | 'aliquotas'
    | 'conexoes'
    | 'analises'
  >('tudo')

  const [resultado, setResultado] = useState<ResultadoBuscaAvancada | null>(null)
  const [carregando, setCarregando] = useState<boolean>(true)
  const [baixandoId, setBaixandoId] = useState<string | null>(null)
  const [modalEnvioAberto, setModalEnvioAberto] = useState<boolean>(false)
  const [, startTransition] = useTransition()

  // Handlers para manipulação facetada de filtros
  const toggleFiltro = <K extends keyof FiltrosAvancados>(chave: K, valor: string) => {
    setClassifPage(1)
    setFiltros((prev) => {
      const listaAtual = (prev[chave] || []) as string[]
      const jaExiste = listaAtual.includes(valor)
      const novaLista = jaExiste
        ? listaAtual.filter((item) => item !== valor)
        : [...listaAtual, valor]
      return {
        ...prev,
        [chave]: novaLista,
      }
    })
  }

  const limparFiltros = () => {
    setClassifPage(1)
    setFiltros({
      grupos: [],
      esferas: [],
      fontes: [],
      tiposAto: [],
      tabelas: [],
      reducoes: [],
    })
    setTipoClassif('TODOS')
    setAtosNivel('todos')
    setCategoriaEspecial('TODAS')
    setFiltroAnexo('TODOS')
  }

  const totalFiltrosAtivos =
    (filtros.grupos?.length || 0) +
    (filtros.esferas?.length || 0) +
    (filtros.fontes?.length || 0) +
    (filtros.tiposAto?.length || 0) +
    (filtros.tabelas?.length || 0) +
    (filtros.reducoes?.length || 0) +
    (tipoClassif !== 'TODOS' ? 1 : 0) +
    (atosNivel !== 'todos' ? 1 : 0) +
    (categoriaEspecial !== 'TODAS' ? 1 : 0) +
    (filtroAnexo !== 'TODOS' ? 1 : 0)

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleAbrirEnvio = () => {
    const termoLimpo = termo.trim()
    if (!termoLimpo) {
      toast({
        title: 'Dica de envio da Busca Avançada',
        description:
          'Nenhum termo foi digitado. Abrindo o envio do link geral — se desejar pesquisar uma matéria específica, você pode digitar no campo.',
      })
    }
    setModalEnvioAberto(true)
  }

  const executarBusca = async (params: ParametrosBuscaAvancada) => {
    setCarregando(true)
    try {
      const res = await buscarAvancado(params)
      startTransition(() => {
        setResultado(res)
      })
    } catch (err) {
      console.error('Erro na Busca Avançada:', err)
      toast({
        title: 'Erro na busca',
        description: 'Não foi possível carregar alguns resultados.',
        variant: 'destructive',
      })
    } finally {
      setCarregando(false)
    }
  }

  // Debounce de digitação ~250ms conforme requisito de performance sobre 15.240+ NCMs
  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => {
      executarBusca({
        termo,
        tipoClassificacao: tipoClassif,
        atosNivel,
        categoriaEspecial,
        filtroAnexo,
        filtros,
        classifPage,
        classifPerPage: 25,
      })
    }, 250)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [termo, tipoClassif, atosNivel, categoriaEspecial, filtroAnexo, filtros, classifPage])

  const handleBaixarDocumento = async (id: string, filename?: string) => {
    setBaixandoId(id)
    try {
      await downloadOfficialDocViaProxy(id, filename)
      toast({
        title: 'Download iniciado',
        description: `Arquivo ${filename || 'oficial'} mediado com sucesso pelo proxy do backend.`,
      })
    } catch (err) {
      toast({
        title: 'Falha no download',
        description: String(err),
        variant: 'destructive',
      })
    } finally {
      setBaixandoId(null)
    }
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho da Seção */}
      <div className="bg-gradient-to-r from-panorama-navy via-slate-900 to-panorama-navy rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden border border-panorama-gold/30">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-panorama-gold/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-panorama-gold/20 text-panorama-gold-light border border-panorama-gold/30 text-xs font-bold uppercase tracking-wider">
                <Sparkles className="w-3.5 h-3.5" />
                Motor Integrado da Reforma Tributária
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-white/10 text-[11px] font-mono text-slate-300">
                Atalho: tecla [B]
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Busca Avançada</h1>
            <p className="text-sm text-slate-300 max-w-2xl leading-relaxed">
              Pesquisa unificada em toda a legislação da reforma: atos normativos, 15.240+ NCMs,
              códigos cClassTrib, CSTs, alíquotas com desonerações, imunidades, associações legais
              (LC 214/2025, EC 132/2023) e análises de especialistas em tabelas e gráficos.
            </p>
          </div>

          <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 pt-3 md:pt-0 border-white/10">
            <div className="flex flex-col items-end gap-2.5">
              <AdecontLogo variant="white" className="h-10 w-auto scale-95 origin-right" />
              <button
                type="button"
                onClick={handleAbrirEnvio}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-panorama-gold via-amber-300 to-panorama-gold-dark text-panorama-navy font-bold text-xs shadow-md hover:brightness-105 active:scale-98 transition-all cursor-pointer"
                title="Enviar matéria pesquisada ao cliente cadastrado através da Central de Entrega"
              >
                <Send className="w-3.5 h-3.5 text-panorama-navy" />
                <span>Enviar pela Central</span>
              </button>
              <span className="text-[10.5px] text-slate-400">
                Assessoria Contábil e Administrativa
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Caixa Central de Pesquisa */}
      <div className="bg-white rounded-2xl border-2 border-slate-200 shadow-md p-4 sm:p-6 space-y-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-panorama-navy" />
          </div>
          <input
            type="text"
            value={termo}
            onChange={(e) => {
              setTermo(e.target.value)
              setClassifPage(1)
            }}
            placeholder="Digite um produto, serviço, regra, NCM, alíquota ou ato (ex.: arroz, cesta básica, agronegócio, cClassTrib, isenção)..."
            className="w-full pl-12 pr-10 py-3.5 bg-slate-50 border-2 border-slate-200 focus:border-panorama-navy rounded-xl text-base sm:text-lg font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none transition-colors"
            autoFocus
          />
          <div className="absolute inset-y-0 right-0 pr-2 flex items-center gap-1">
            {termo && (
              <button
                type="button"
                onClick={() => {
                  setTermo('')
                  setClassifPage(1)
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="w-5 h-5" />
              </button>
            )}
            <button
              type="button"
              onClick={handleAbrirEnvio}
              className="px-3 py-1.5 rounded-lg bg-panorama-navy hover:bg-panorama-navy-light text-panorama-gold-light border border-panorama-gold/40 text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
              title={
                termo.trim()
                  ? `Enviar matéria pesquisada "${termo.trim()}" ao cliente pela Central de Entrega`
                  : 'Enviar Busca Avançada ao cliente pela Central de Entrega'
              }
            >
              <Send className="w-3.5 h-3.5 text-panorama-gold" />
              <span className="hidden sm:inline">Enviar ao Cliente</span>
            </button>
          </div>
        </div>

        {/* Sugestões Rápidas de Pesquisa */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          <span className="text-slate-500 font-semibold flex items-center gap-1 shrink-0">
            <Compass className="w-3.5 h-3.5 text-panorama-gold-dark" />
            Sugestões:
          </span>
          {SUGESTOES_RAPIDAS.map((sug) => (
            <button
              key={sug}
              onClick={() => {
                setTermo(sug)
                setClassifPage(1)
              }}
              className={`px-2.5 py-1 rounded-full border text-[11.5px] font-medium transition-colors cursor-pointer ${
                termo.toLowerCase() === sug.toLowerCase()
                  ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy font-bold shadow-xs'
                  : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100 hover:border-slate-300'
              }`}
            >
              {sug}
            </button>
          ))}
        </div>

        {/* Barra de Filtros e Painel Facetado Expandível */}
        <div className="space-y-3 pt-3 border-t border-slate-100">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setPainelFiltrosAberto((prev) => !prev)}
                className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                  totalFiltrosAtivos > 0
                    ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy'
                    : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-panorama-gold" />
                <span>Filtros Avançados</span>
                {totalFiltrosAtivos > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] font-black bg-panorama-gold text-panorama-navy">
                    {totalFiltrosAtivos}
                  </span>
                )}
              </button>

              {totalFiltrosAtivos > 0 && (
                <button
                  type="button"
                  onClick={limparFiltros}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold cursor-pointer transition-colors"
                  title="Limpar todos os filtros selecionados"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Limpar filtros</span>
                </button>
              )}

              {/* Seletor rápido de esfera */}
              <div className="hidden lg:flex items-center gap-1 text-xs text-slate-600">
                <span className="font-semibold text-[11px] text-slate-500 ml-2">Esfera:</span>
                {ESFERAS_FEDERATIVAS.map((esf) => {
                  const ativa = filtros.esferas?.includes(esf.id)
                  return (
                    <button
                      key={esf.id}
                      type="button"
                      onClick={() => toggleFiltro('esferas', esf.id)}
                      className={`px-2 py-0.5 rounded-lg text-[11px] font-bold border transition-colors cursor-pointer ${
                        ativa
                          ? 'bg-blue-700 text-white border-blue-800'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {esf.sigla}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-slate-500 justify-end">
              {carregando ? (
                <span className="inline-flex items-center gap-1 text-panorama-navy font-semibold">
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Pesquisando nas bases...
                </span>
              ) : resultado ? (
                <span>
                  <strong>{resultado.totalGeralEncontrado.toLocaleString('pt-BR')}</strong>{' '}
                  registros correlacionados às {resultado.timestamp}
                </span>
              ) : null}
            </div>
          </div>

          {/* PAINEL COMPLETO DE FILTROS FACETADOS (ESTILO ADECONT) */}
          {painelFiltrosAberto && (
            <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-slate-50 via-white to-blue-50/20 border-2 border-slate-200 space-y-4 animate-in fade-in duration-200 shadow-inner">
              {/* Grupo 1: Tipo de Conteúdo / Grupo de Resultado */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-panorama-navy" />
                    1. Grupo de Resultado / Tipo de Conteúdo
                  </span>
                  <span className="text-[11px] text-slate-400">
                    {filtros.grupos && filtros.grupos.length > 0
                      ? `${filtros.grupos.length} grupo(s) selecionado(s)`
                      : 'Todos os grupos exibidos'}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {GRUPOS_CONTEUDO.map((grp) => {
                    const ativo = filtros.grupos?.includes(grp.id)
                    const Icone = grp.icon
                    return (
                      <button
                        key={grp.id}
                        type="button"
                        onClick={() => toggleFiltro('grupos', grp.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                          ativo
                            ? 'bg-panorama-navy text-panorama-gold-light border-panorama-navy shadow-xs font-bold'
                            : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <Icone
                          className={`w-3.5 h-3.5 ${ativo ? 'text-panorama-gold' : 'text-slate-400'}`}
                        />
                        <span>{grp.label}</span>
                        {ativo && <Check className="w-3 h-3 text-panorama-gold" />}
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Grid 2 colunas para Esfera + Fontes + Atos + Reduções */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 pt-2 border-t border-slate-200/80">
                {/* 2. Esfera Federativa */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-600" />
                    2. Esfera Federativa
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {ESFERAS_FEDERATIVAS.map((esf) => {
                      const ativo = filtros.esferas?.includes(esf.id)
                      return (
                        <button
                          key={esf.id}
                          type="button"
                          onClick={() => toggleFiltro('esferas', esf.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{esf.label}</span>
                          {ativo ? (
                            <Check className="w-3.5 h-3.5 text-blue-700 shrink-0 ml-1" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0 ml-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 3. Fontes Oficiais */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                    3. Fonte Oficial
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-1">
                    {FONTES_OFICIAIS_OPCOES.map((fnt) => {
                      const ativo = filtros.fontes?.includes(fnt.id)
                      return (
                        <button
                          key={fnt.id}
                          type="button"
                          onClick={() => toggleFiltro('fontes', fnt.id)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            ativo
                              ? 'bg-emerald-100 text-emerald-950 border-emerald-400 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{fnt.label}</span>
                          {ativo && <Check className="w-3 h-3 text-emerald-700" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 4. Tipo de Ato Normativo */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-amber-600" />
                    4. Tipo de Ato
                  </span>
                  <div className="flex flex-wrap gap-1 max-h-40 overflow-y-auto p-1">
                    {TIPOS_ATO_OPCOES.map((tipo) => {
                      const ativo = filtros.tiposAto?.includes(tipo)
                      return (
                        <button
                          key={tipo}
                          type="button"
                          onClick={() => toggleFiltro('tiposAto', tipo)}
                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg border text-[11px] font-semibold transition-colors cursor-pointer ${
                            ativo
                              ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold shadow-2xs'
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <span>{tipo}</span>
                          {ativo && <Check className="w-3 h-3 text-amber-800" />}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* 5. Reduções / Alíquotas dos Anexos */}
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5 text-indigo-600" />
                    5. Redução / Alíquota
                  </span>
                  <div className="flex flex-col gap-1.5">
                    {REDUCOES_ALIQUOTA_OPCOES.map((red) => {
                      const ativo = filtros.reducoes?.includes(red.id)
                      return (
                        <button
                          key={red.id}
                          type="button"
                          onClick={() => toggleFiltro('reducoes', red.id)}
                          className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer text-left ${
                            ativo
                              ? 'bg-indigo-50 border-indigo-400 text-indigo-950 font-bold'
                              : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                          }`}
                        >
                          <span className="truncate">{red.label}</span>
                          {ativo ? (
                            <Check className="w-3.5 h-3.5 text-indigo-700 shrink-0 ml-1" />
                          ) : (
                            <span className="w-3.5 h-3.5 rounded border border-slate-300 shrink-0 ml-1" />
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* 6. As 11 Tabelas de Classificações Oficiais (quando relevante) */}
              <div className="space-y-2 pt-2 border-t border-slate-200/80">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <Layers className="w-3.5 h-3.5 text-amber-600" />
                    6. Tabelas de Classificações Oficiais (11 Bases Oficiais)
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Siscomex · CGIBS · CONFAZ · SPED
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {OPCOES_TABELAS_CLASSIFICACOES.filter((t) => t.id !== 'TODOS').map((t) => {
                    const ativo = filtros.tabelas?.includes(t.id)
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => toggleFiltro('tabelas', t.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono transition-all cursor-pointer ${
                          ativo
                            ? 'bg-amber-100 text-amber-950 border-amber-400 font-bold shadow-2xs'
                            : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <span>{t.id}</span>
                        <span className="text-[10px] font-sans text-slate-500">
                          ({t.label.split('(')[1]?.replace(')', '') || t.label})
                        </span>
                        {ativo && <Check className="w-3 h-3 text-amber-700" />}
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>
          )}

          {/* CHIPS DE FILTROS ATIVOS REMOVÍVEIS */}
          {totalFiltrosAtivos > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1 text-xs">
              <span className="text-slate-500 font-semibold text-[11px]">Filtros ativos:</span>
              {filtros.grupos?.map((g) => (
                <span
                  key={`chip-g-${g}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-panorama-navy text-panorama-gold-light border border-panorama-navy text-[11px] font-semibold"
                >
                  <span>Grupo: {GRUPOS_CONTEUDO.find((x) => x.id === g)?.label || g}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltro('grupos', g)}
                    className="hover:text-white cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.esferas?.map((esf) => (
                <span
                  key={`chip-esf-${esf}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300 text-[11px] font-semibold"
                >
                  <span>Esfera: {esf}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltro('esferas', esf)}
                    className="hover:text-blue-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.fontes?.map((fnt) => (
                <span
                  key={`chip-fnt-${fnt}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 text-[11px] font-semibold"
                >
                  <span>Fonte: {fnt}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltro('fontes', fnt)}
                    className="hover:text-emerald-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.tiposAto?.map((tipo) => (
                <span
                  key={`chip-tipo-${tipo}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 text-[11px] font-semibold"
                >
                  <span>Ato: {tipo}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltro('tiposAto', tipo)}
                    className="hover:text-amber-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.tabelas?.map((tab) => (
                <span
                  key={`chip-tab-${tab}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-purple-100 text-purple-900 border border-purple-300 text-[11px] font-semibold"
                >
                  <span>Tabela: {tab}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltro('tabelas', tab)}
                    className="hover:text-purple-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              {filtros.reducoes?.map((red) => (
                <span
                  key={`chip-red-${red}`}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-300 text-[11px] font-semibold"
                >
                  <span>Redução: {red}</span>
                  <button
                    type="button"
                    onClick={() => toggleFiltro('reducoes', red)}
                    className="hover:text-indigo-950 cursor-pointer"
                    title="Remover filtro"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}

              <button
                type="button"
                onClick={limparFiltros}
                className="text-[11px] font-bold text-rose-600 hover:underline cursor-pointer ml-1"
              >
                Limpar todos
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Gráficos Correlatos */}
      {resultado && (
        <GraficosBusca
          termo={termo}
          dadosGraficos={resultado.dadosGraficos}
          dadosAnexos={resultado.anexosReforma.resumoReducoes}
        />
      )}

      {/* Navegação em Abas dos Resultados Agrupados */}
      <div className="border-b border-slate-200">
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 text-xs sm:text-sm font-semibold">
          <button
            onClick={() => setAbaAtiva('tudo')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'tudo'
                ? 'border-panorama-navy text-panorama-navy bg-white shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Sparkles className="w-4 h-4 text-panorama-gold-dark" />
            Visão Geral Consolidada
          </button>

          <button
            onClick={() => setAbaAtiva('consulta-anexos')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'consulta-anexos'
                ? 'border-emerald-700 text-emerald-950 bg-emerald-50/70 shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/40'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-700" />
            <span>Consulta Completa dos Anexos</span>
            <span className="ml-1 px-2 py-0.5 rounded-full text-[10.5px] font-extrabold bg-emerald-700 text-white shadow-2xs">
              TODOS OS ITENS
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('anexos-reforma')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'anexos-reforma'
                ? 'border-blue-600 text-blue-900 bg-blue-50/50 shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-blue-800 hover:bg-blue-50/30'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-blue-600" />
            <span>Cards dos Anexos (LC 214)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-600 text-white">
              {resultado?.anexosReforma.total || 0}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('assuntos-especiais')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'assuntos-especiais'
                ? 'border-amber-600 text-amber-900 bg-amber-50/50 shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-amber-800 hover:bg-amber-50/30'
            }`}
          >
            <AlertOctagon className="w-4 h-4 text-amber-600" />
            <span>Assuntos Especiais (fora da trib. geral)</span>
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-500 text-white">
              {resultado?.assuntosEspeciais.total || 0}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('classificacoes')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'classificacoes'
                ? 'border-panorama-navy text-panorama-navy bg-white shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Layers className="w-4 h-4 text-amber-600" />
            Classificações Oficiais (NCM/cClassTrib)
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
              {resultado?.classificacoes.totalItems.toLocaleString('pt-BR') || 0}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('atos')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'atos'
                ? 'border-panorama-navy text-panorama-navy bg-white shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Scale className="w-4 h-4 text-blue-600" />
            Atos Normativos & Radar
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">
              {(resultado?.normas.total || 0) + (resultado?.radarAtos.total || 0)}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('aliquotas')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'aliquotas'
                ? 'border-panorama-navy text-panorama-navy bg-white shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Percent className="w-4 h-4 text-emerald-600" />
            Alíquotas & Tratamentos
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
              {resultado?.aliquotasTratamentos.length || 0}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('conexoes')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'conexoes'
                ? 'border-panorama-navy text-panorama-navy bg-white shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <Compass className="w-4 h-4 text-teal-600" />
            Conexões Legais
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-teal-100 text-teal-800">
              {resultado?.conexoesLegais.length || 0}
            </span>
          </button>

          <button
            onClick={() => setAbaAtiva('analises')}
            className={`px-4 py-2.5 rounded-t-lg transition-colors border-b-2 whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
              abaAtiva === 'analises'
                ? 'border-panorama-navy text-panorama-navy bg-white shadow-xs font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50'
            }`}
          >
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            Análises & Projeções
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">
              {resultado?.analisesEspecialistas.length || 0}
            </span>
          </button>
        </nav>
      </div>

      {/* Estado vazio quando filtros e termo não retornam nenhum registro */}
      {resultado && resultado.totalGeralEncontrado === 0 && !carregando && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            Nenhum resultado localizado com os filtros aplicados
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            Não encontramos registros correlacionados para o termo &ldquo;{termo}&rdquo; com as
            restrições selecionadas. Experimente limpar ou flexibilizar os filtros de esferas,
            fontes ou tabelas.
          </p>
          <div className="pt-2">
            <button
              type="button"
              onClick={limparFiltros}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light text-xs font-bold transition-all shadow-xs cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-panorama-gold" />
              <span>Limpar todos os filtros</span>
            </button>
          </div>
        </div>
      )}

      {/* BLOCO NOVO: CONSULTA COMPLETA DOS ANEXOS DA LC 214/2025 (LISTA DE TODOS OS ITENS SEM PRECISAR DIGITAR BUSCA) */}
      {(abaAtiva === 'tudo' || abaAtiva === 'consulta-anexos') && (
        <ConsultaCompletaAnexos
          filtroReducao={filtros.reducoes}
          filtroTabela={filtros.tabelas}
          filtroFonte={filtros.fontes}
        />
      )}

      {/* BLOCO 0A: ANEXOS DA REFORMA TRIBUTÁRIA (LC 214/2025 E REGIMES ESPECÍFICOS - VISÃO EM CARDS) */}
      {(abaAtiva === 'tudo' || abaAtiva === 'anexos-reforma') &&
        resultado &&
        resultado.anexosReforma.items.length > 0 && (
          <div className="bg-gradient-to-br from-blue-50/70 via-white to-sky-50/40 rounded-2xl border-2 border-blue-300 shadow-md p-5 sm:p-6 space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-blue-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-blue-700 text-white shadow-xs">
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    Anexos Oficiais da Reforma Tributária
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-900 border border-blue-300">
                    {resultado.anexosReforma.total} anexo(s) localizado(s)
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Anexos da Lei Complementar 214/2025 & Regimes Específicos</span>
                </h3>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  Catálogo dos <strong>Anexos da LC 214/2025</strong> com produtos e serviços
                  correlacionados, respectivas <strong>capitulações legais exatas</strong> (artigos,
                  incisos e parágrafos do texto compilado oficial do Planalto), percentuais de{' '}
                  <strong>redução de alíquotas (0%, -30%, -50%, -60% e -100%)</strong> e vínculos
                  com os códigos oficiais vigentes no sistema (NCM, NBS, cClassTrib, cCredPres).
                </p>
              </div>

              {/* Filtros rápidos de Anexo */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto max-w-md justify-end">
                {resultado.anexosReforma.categoriasPresentes.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => {
                      const match = ANEXOS_FILTRO_RAPIDO.find((a) => a.label.includes(cat))
                      if (match) setFiltroAnexo(match.id)
                    }}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-white border border-blue-300 text-blue-900 hover:bg-blue-100 transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
                {filtroAnexo !== 'TODOS' && (
                  <button
                    onClick={() => setFiltroAnexo('TODOS')}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-blue-200 text-blue-950 hover:bg-blue-300 transition-colors cursor-pointer"
                  >
                    Limpar filtro de anexo
                  </button>
                )}
              </div>
            </div>

            {/* Grid dos Cards de Anexos da Reforma */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {resultado.anexosReforma.items.map((anexo: AnexoReformaItem) => (
                <div
                  key={anexo.id}
                  className="bg-white rounded-xl border-2 border-blue-200/90 p-5 shadow-sm hover:border-blue-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    {/* Header do Card de Anexo */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wide bg-blue-900 text-white shadow-xs">
                        <FileSpreadsheet className="w-3 h-3 text-blue-300" />
                        {anexo.numero}
                      </span>
                      <span
                        className={`px-2.5 py-0.5 rounded-md text-[11px] font-extrabold ${
                          anexo.reducaoAliquotaPct === -100
                            ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                            : anexo.reducaoAliquotaPct === -60
                              ? 'bg-blue-100 text-blue-900 border border-blue-300'
                              : anexo.reducaoAliquotaPct === -30
                                ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                : 'bg-slate-100 text-slate-800 border border-slate-300'
                        }`}
                      >
                        {anexo.reducaoRotulo}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {anexo.titulo}
                    </h4>

                    <p className="text-xs font-medium text-slate-600 italic">{anexo.subtitulo}</p>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/90 p-3 rounded-lg border border-slate-200">
                      {anexo.resumo}
                    </p>

                    {/* Capitulação Legal Oficial do Planalto */}
                    <div className="bg-sky-50/80 border-l-4 border-sky-600 p-2.5 rounded-r-lg text-xs space-y-1">
                      <span className="font-bold text-sky-950 block text-[11px] uppercase tracking-wider flex items-center gap-1">
                        <Scale className="w-3.5 h-3.5 text-sky-700" />
                        Capitulação Legal (Texto Oficial do Planalto):
                      </span>
                      <p className="text-sky-900 font-mono font-semibold text-[11.5px] leading-relaxed">
                        {anexo.capitulacaoLegal}
                      </p>
                      <div className="flex items-center gap-2 pt-0.5 text-[10.5px] text-sky-800">
                        <span>Remissões diretas:</span>
                        {anexo.artigosRemissao.map((art, idx) => (
                          <span
                            key={idx}
                            className="bg-sky-200/70 text-sky-900 font-bold px-1.5 py-0.2 rounded"
                          >
                            {art}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Alíquota Efetiva e Base de Cálculo */}
                    <div className="p-2.5 rounded-lg bg-emerald-50/70 border border-emerald-200 text-xs space-y-1">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-emerald-900 font-bold">
                          Alíquota Efetiva de Referência (IBS 18,7% + CBS 11,3%):
                        </span>
                        <span className="font-mono font-extrabold text-emerald-800 bg-white px-2 py-0.5 rounded border border-emerald-300">
                          {anexo.aliquotaEfetivaIbsCbs}
                        </span>
                      </div>
                      <p className="text-[11px] text-emerald-950 leading-relaxed">
                        {anexo.baseCalculoTexto}
                      </p>
                    </div>

                    {/* Lista de Produtos / Serviços Catalogados com códigos oficiais */}
                    <div className="pt-2 border-t border-slate-100 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800 flex items-center gap-1">
                          <Layers className="w-3.5 h-3.5 text-amber-600" />
                          Produtos e Serviços Relacionados ({anexo.produtosServicos.length} itens):
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          Vínculo: NCM / NBS / cClassTrib
                        </span>
                      </div>

                      <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 divide-y divide-slate-100 bg-white text-xs">
                        {anexo.produtosServicos.map((prod, pIdx) => (
                          <div
                            key={pIdx}
                            className="p-2 hover:bg-slate-50 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-1.5"
                          >
                            <div className="space-y-0.5">
                              <span className="font-semibold text-slate-800">
                                {prod.item}. {prod.descricao}
                              </span>
                              {prod.detalhes && (
                                <p className="text-[11px] text-slate-500 italic">{prod.detalhes}</p>
                              )}
                            </div>
                            {prod.codigo && (
                              <span className="inline-flex items-center gap-1 font-mono text-[10.5px] font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 shrink-0 self-start sm:self-auto">
                                <span className="text-amber-700 font-semibold">
                                  {prod.tipoCodigo}:
                                </span>
                                <span>{prod.codigo}</span>
                              </span>
                            )}
                          </div>
                        ))}
                      </div>

                      {/* Tags de códigos oficiais cruzados com o banco */}
                      <div className="flex items-center gap-1 flex-wrap pt-1">
                        <span className="text-[10.5px] font-bold text-slate-500">
                          Códigos no banco:
                        </span>
                        {anexo.codigosOficiaisRelacionados.map((cod, cIdx) => (
                          <span
                            key={cIdx}
                            className="font-mono text-[10px] font-bold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded border border-slate-200"
                          >
                            {cod}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card: Selo Oficial do Planalto e Download Mediado */}
                  <div className="pt-3 border-t border-slate-200/80 space-y-2">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-emerald-100 text-emerald-900 border border-emerald-300">
                          <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {anexo.fonteOficial.selo}
                        </span>
                        <a
                          href={anexo.fonteOficial.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-700 hover:underline"
                        >
                          <span>Texto Planalto</span>
                          <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                        </a>
                      </div>

                      {anexo.documentoDownloadId && (
                        <button
                          onClick={() =>
                            handleBaixarDocumento(
                              anexo.documentoDownloadId!,
                              'LC-214-2025-Planalto-Oficial.pdf',
                            )
                          }
                          disabled={baixandoId === anexo.documentoDownloadId}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                          title="Download do texto integral oficial mediado pelo proxy backend (/backend/v1/download-resolution)"
                        >
                          <Download className="w-3 h-3" />
                          {baixandoId === anexo.documentoDownloadId
                            ? 'Baixando...'
                            : 'PDF Oficial (Proxy)'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* BLOCO 0: ASSUNTOS ESPECIAIS — FORA DA TRIBUTAÇÃO GERAL (DESTAQUE MÁXIMO) */}
      {(abaAtiva === 'tudo' || abaAtiva === 'assuntos-especiais') &&
        resultado &&
        resultado.assuntosEspeciais.items.length > 0 && (
          <div className="bg-gradient-to-br from-amber-50/60 via-white to-orange-50/30 rounded-2xl border-2 border-amber-300 shadow-md p-5 sm:p-6 space-y-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b-2 border-amber-200 pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-amber-600 text-white shadow-xs">
                    <AlertOctagon className="w-3.5 h-3.5" />
                    Fora da Tributação Geral
                  </span>
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300">
                    {resultado.assuntosEspeciais.total} assunto(s) localizado(s)
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-extrabold text-slate-900 flex items-center gap-2">
                  <span>Assuntos Especiais da Reforma Tributária</span>
                </h3>
                <p className="text-xs text-slate-600 max-w-3xl leading-relaxed">
                  Tratamentos que <strong>saem da tributação padrão do IVA Dual</strong>: alíquotas
                  majoradas do Imposto do Pecado (cigarros, bebidas e veículos), governança e
                  projeções do Comitê Gestor (CGIBS), regimes favorecidos do Simples Nacional e
                  ME/EPP, transição societária (Lucro Presumido e Real), imunidades constitucionais
                  (entidades associativas, sindicatos, livros e exportações) e regras específicas da
                  LC 214/2025.
                </p>
              </div>

              {/* Botões de filtro rápido por categoria */}
              <div className="flex flex-wrap items-center gap-1.5 self-start sm:self-auto max-w-md justify-end">
                {resultado.assuntosEspeciais.categoriasPresentes.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCategoriaEspecial(cat)}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-white border border-amber-300 text-amber-900 hover:bg-amber-100 transition-colors cursor-pointer"
                  >
                    {cat}
                  </button>
                ))}
                {categoriaEspecial !== 'TODAS' && (
                  <button
                    onClick={() => setCategoriaEspecial('TODAS')}
                    className="px-2 py-0.5 rounded-full text-[10.5px] font-bold bg-amber-200 text-amber-900 hover:bg-amber-300 transition-colors cursor-pointer"
                  >
                    Limpar filtro
                  </button>
                )}
              </div>
            </div>

            {/* Grid dos Cards de Assuntos Especiais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {resultado.assuntosEspeciais.items.map((esp: AssuntoEspecialItem) => (
                <div
                  key={esp.id}
                  className="bg-white rounded-xl border-2 border-amber-200/90 p-5 shadow-sm hover:border-amber-400 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-2.5">
                    {/* Header do Card */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10.5px] font-extrabold uppercase tracking-wide bg-amber-100 text-amber-900 border border-amber-300">
                        <Flame className="w-3 h-3 text-amber-700" />
                        {esp.categoria}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-800 border border-orange-200">
                        {esp.badgeExcecao}
                      </span>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 leading-snug">
                      {esp.titulo}
                    </h4>

                    <p className="text-xs font-medium text-slate-600 italic">{esp.subtitulo}</p>

                    <p className="text-xs text-slate-700 leading-relaxed bg-slate-50/80 p-3 rounded-lg border border-slate-200">
                      {esp.descricao}
                    </p>

                    {/* Destaque "O que muda" */}
                    <div className="bg-amber-50/80 border-l-4 border-amber-500 p-2.5 rounded-r-lg text-xs space-y-1">
                      <span className="font-bold text-amber-900 block text-[11px] uppercase tracking-wider">
                        O que muda na Reforma Tributária:
                      </span>
                      <p className="text-amber-950 leading-relaxed text-[11.5px]">{esp.oQueMuda}</p>
                    </div>

                    {/* Alíquota / Efeito tributário */}
                    <div className="flex items-center justify-between gap-2 text-xs pt-1">
                      <span className="text-slate-500 font-medium">Tratamento / Alíquota:</span>
                      <span className="font-bold font-mono text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {esp.aliquotaOuTratamento}
                      </span>
                    </div>

                    {/* Conexões normativas com o banco */}
                    <div className="pt-2 border-t border-slate-100 space-y-1.5">
                      <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                        <Compass className="w-3.5 h-3.5 text-blue-600" />
                        Conexões Normativas (Banco de Atos & Leis):
                      </span>
                      <div className="space-y-1.5">
                        {esp.conexoesNormativas.map((con, idx) => (
                          <div
                            key={idx}
                            className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                <span className="font-mono text-blue-700">{con.codigoNorma}</span>
                                <span>· {con.dispositivo}</span>
                              </div>
                              <div className="text-[11px] text-slate-600">{con.titulo}</div>
                              <div className="text-[10px] text-emerald-700 font-medium">
                                Efeito: {con.efeitoOuTratamento}
                              </div>
                            </div>
                            {con.linkProxyPdf && (
                              <button
                                onClick={() =>
                                  handleBaixarDocumento(
                                    con.codigoNorma,
                                    `${con.codigoNorma.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
                                  )
                                }
                                disabled={baixandoId === con.codigoNorma}
                                className="px-2 py-1 text-[11px] font-bold rounded bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light transition-colors flex items-center gap-1 shrink-0 cursor-pointer disabled:opacity-50"
                                title="Download oficial intermediado pelo proxy backend (sem erro no Edge)"
                              >
                                <Download className="w-3 h-3" />
                                {baixandoId === con.codigoNorma ? 'Baixando...' : 'PDF Proxy'}
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Rodapé do Card: Base legal e Fontes Oficiais com Selo */}
                  <div className="pt-3 border-t border-slate-200/80 space-y-2">
                    <div className="text-[11px] text-slate-600 flex items-start gap-1">
                      <Scale className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                      <span>
                        <strong>Base Legal:</strong> {esp.baseLegal}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <span className="text-[10.5px] text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1">
                        <BadgeCheck className="w-3.5 h-3.5 text-emerald-600" />
                        Fontes Oficiais:
                      </span>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {esp.fontesOficiais.map((fonte, idx) => (
                          <a
                            key={idx}
                            href={fonte.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 transition-colors"
                          >
                            <span>{fonte.orgao}</span>
                            <ExternalLink className="w-2.5 h-2.5 text-slate-400" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

      {/* BLOCO 1: Classificações Oficiais (NCM, cClassTrib, CST, etc.) */}
      {(abaAtiva === 'tudo' || abaAtiva === 'classificacoes') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Classificações Oficiais (NCM, cClassTrib, CST, cCredPres, CEST...)
                </h3>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Pesquisa server-side nas bases oficiais do Siscomex, IT 2025.002 do CGIBS/RFB,
                CONFAZ e SPED (~15.240 NCMs).
              </p>
            </div>
            {resultado?.classificacoes && (
              <span className="text-xs font-mono px-2.5 py-1 rounded bg-slate-100 text-slate-600 self-start sm:self-auto">
                Página {resultado.classificacoes.page} de {resultado.classificacoes.totalPages} (
                {resultado.classificacoes.totalItems.toLocaleString('pt-BR')} itens)
              </span>
            )}
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-28">Tabela</th>
                  <th className="py-2.5 px-3 w-32">Código</th>
                  <th className="py-2.5 px-3">Nome / Descrição Oficial</th>
                  <th className="py-2.5 px-3 w-40">Fonte Oficial</th>
                  <th className="py-2.5 px-3 w-64">Enquadramento / Base Legal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado?.classificacoes.items && resultado.classificacoes.items.length > 0 ? (
                  resultado.classificacoes.items.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-2.5 px-3 align-top font-bold">
                        <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono bg-amber-50 text-amber-800 border border-amber-200">
                          {item.tipo}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 align-top font-mono font-bold text-slate-900 whitespace-nowrap">
                        {item.codigo}
                      </td>
                      <td className="py-2.5 px-3 align-top space-y-0.5">
                        {item.nome && <div className="font-bold text-slate-800">{item.nome}</div>}
                        <div className="text-slate-600 leading-snug">{item.descricao}</div>
                      </td>
                      <td className="py-2.5 px-3 align-top">
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {item.fonte}
                        </span>
                        {item.tabela_origem && (
                          <div
                            className="text-[10px] text-slate-400 mt-0.5 truncate max-w-[150px]"
                            title={item.tabela_origem}
                          >
                            {item.tabela_origem}
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3 align-top text-slate-700 text-[11.5px] leading-relaxed">
                        {item.observacoes || 'Conforme legislação federal da Reforma Tributária.'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-6 text-center text-slate-400">
                      Nenhuma classificação encontrada para os filtros selecionados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Paginação da Tabela de Classificações */}
          {resultado && resultado.classificacoes.totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-500">
                Mostrando {resultado.classificacoes.items.length} de{' '}
                {resultado.classificacoes.totalItems.toLocaleString('pt-BR')} itens
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setClassifPage((p) => Math.max(p - 1, 1))}
                  disabled={classifPage <= 1}
                  className="px-3 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                  Anterior
                </button>
                <span className="text-xs font-mono text-slate-600">
                  {classifPage} / {resultado.classificacoes.totalPages}
                </span>
                <button
                  onClick={() =>
                    setClassifPage((p) => Math.min(p + 1, resultado.classificacoes.totalPages))
                  }
                  disabled={classifPage >= resultado.classificacoes.totalPages}
                  className="px-3 py-1 text-xs font-semibold rounded border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 cursor-pointer"
                >
                  Próxima
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* BLOCO 2: Atos Normativos e Radar de Atos (com download mediado quando PDF) */}
      {(abaAtiva === 'tudo' || abaAtiva === 'atos') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-600" />
              <h3 className="text-base font-bold text-slate-900">
                Atos Normativos Correlacionados & Radar Nacional
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {(resultado?.normas.total || 0) + (resultado?.radarAtos.total || 0)} atos encontrados
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Normas Centrais */}
            {resultado?.normas.items.map((norma) => (
              <div
                key={norma.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-blue-300 transition-all bg-gradient-to-br from-white to-slate-50/50 space-y-2.5 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                      {norma.norm_type || 'Norma Federal'}
                    </span>
                    <span className="text-[11px] font-mono font-bold text-slate-500">
                      {norma.date || norma.dou_date}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">
                    {norma.code}: {norma.title}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-3">
                    {norma.summary}
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 font-medium truncate">
                    Origem: <strong>{norma.origin || 'Planalto / CGIBS'}</strong>
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() =>
                        handleBaixarDocumento(
                          norma.code,
                          `${norma.code.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`,
                        )
                      }
                      disabled={baixandoId === norma.code}
                      className="px-2.5 py-1 text-xs font-bold rounded-lg border border-panorama-navy bg-panorama-navy text-panorama-gold-light hover:bg-panorama-navy-light transition-colors flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      title="Download mediado via proxy backend (sem bloqueio de navegador)"
                    >
                      <Download className="w-3 h-3" />
                      {baixandoId === norma.code ? 'Baixando...' : 'Download Proxy'}
                    </button>
                    {norma.link_url && (
                      <a
                        href={norma.link_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-100"
                        title="Ver na fonte oficial externa"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {/* Radar de Atos dos 3 Níveis */}
            {resultado?.radarAtos.items.map((ato) => (
              <div
                key={ato.id}
                className="border border-slate-200 rounded-xl p-4 hover:border-amber-300 transition-all bg-white space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                        ato.nivel === 'federal'
                          ? 'bg-blue-100 text-blue-800'
                          : ato.nivel === 'estadual'
                            ? 'bg-teal-100 text-teal-800'
                            : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {ato.nivel} {ato.uf ? `· ${ato.uf}` : ''}
                    </span>
                    {ato.data_publicacao && (
                      <span className="text-[11px] font-mono text-slate-500">
                        {ato.data_publicacao}
                      </span>
                    )}
                  </div>
                  <h4 className="font-bold text-slate-800 text-xs sm:text-sm leading-snug">
                    {ato.titulo}
                  </h4>
                  {ato.trecho && (
                    <p className="text-xs text-slate-600 line-clamp-2 italic">
                      &ldquo;{ato.trecho}&rdquo;
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                  <span>{ato.fonte_oficial || ato.ente_nome || 'Diário Oficial'}</span>
                  {ato.url && (
                    <a
                      href={ato.url}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-blue-700 hover:underline"
                    >
                      Acessar Ato
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* BLOCO 3: Alíquotas e Tratamentos Diferenciados */}
      {(abaAtiva === 'tudo' || abaAtiva === 'aliquotas') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Percent className="w-4 h-4 text-emerald-600" />
              <h3 className="text-base font-bold text-slate-900">
                Alíquotas, Reduções, Isenções e Imunidades Correlatas
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {resultado?.aliquotasTratamentos.length || 0} tratamentos identificados
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-48">Tema / Setor</th>
                  <th className="py-2.5 px-3 w-44">Regime / Tratamento</th>
                  <th className="py-2.5 px-3 w-32">Fator Redutor</th>
                  <th className="py-2.5 px-3 w-48">Alíquota Efetiva Estimada</th>
                  <th className="py-2.5 px-3">Fundamento Legal & Observações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado?.aliquotasTratamentos.map((trat) => (
                  <tr key={trat.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 align-top font-bold text-slate-900">
                      <div>{trat.tema}</div>
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                        {trat.categoria}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 align-top font-semibold text-emerald-800">
                      {trat.tipoTratamento}
                    </td>
                    <td className="py-2.5 px-3 align-top font-mono font-bold text-slate-700">
                      {trat.reducaoOuFator}
                    </td>
                    <td className="py-2.5 px-3 align-top font-mono font-bold text-blue-800 whitespace-nowrap">
                      {trat.aliquotaEstimada}
                    </td>
                    <td className="py-2.5 px-3 align-top space-y-1">
                      <div className="font-bold text-slate-800 text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                        {trat.fundamentoLegal}
                      </div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">
                        {trat.observacao}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BLOCO 4: Conexões e Associações Legais */}
      {(abaAtiva === 'tudo' || abaAtiva === 'conexoes') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900">
                Cadeia de Associação Legal (LC 214/2025 · EC 132/2023 · RIBS)
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {resultado?.conexoesLegais.length || 0} vínculos catalogados
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-bold border-b border-slate-200">
                  <th className="py-2.5 px-3 w-40">Norma Central</th>
                  <th className="py-2.5 px-3 w-36">Dispositivo de Origem</th>
                  <th className="py-2.5 px-3 w-44">Remissão Cruzada</th>
                  <th className="py-2.5 px-3 w-44">Anexo / Catálogo</th>
                  <th className="py-2.5 px-3">Efeito e Fundamentação Deduzida</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {resultado?.conexoesLegais.map((con) => (
                  <tr key={con.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-3 align-top font-bold text-slate-900">{con.norma}</td>
                    <td className="py-2.5 px-3 align-top font-mono font-bold text-blue-700">
                      {con.dispositivo}
                    </td>
                    <td className="py-2.5 px-3 align-top text-slate-600 font-mono text-[11px]">
                      {con.remissao || '—'}
                    </td>
                    <td className="py-2.5 px-3 align-top font-semibold text-slate-800">
                      {con.anexo}
                    </td>
                    <td className="py-2.5 px-3 align-top space-y-1">
                      <div className="font-bold text-slate-800">{con.rotulo}</div>
                      <p className="text-slate-600 text-[11px] leading-relaxed">{con.detalhe}</p>
                      <span className="inline-block px-1.5 py-0.2 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200">
                        {con.aliquotaOuEfeito}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* BLOCO 5: Dados, Projeções e Análises de Especialistas */}
      {(abaAtiva === 'tudo' || abaAtiva === 'analises') && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-600" />
              <h3 className="text-base font-bold text-slate-900">
                Análises Técnicas e Projeções de Especialistas
              </h3>
            </div>
            <span className="text-xs font-semibold text-slate-500">
              {resultado?.analisesEspecialistas.length || 0} análises correlacionadas
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {resultado?.analisesEspecialistas.map((an) => (
              <div
                key={an.id}
                className="border border-slate-200 rounded-xl p-4 bg-gradient-to-br from-slate-50/50 to-white hover:border-indigo-300 transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {an.tag}
                    </span>
                    <span className="text-[11px] font-mono text-slate-400">{an.dataOuMarco}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm leading-snug">{an.tema}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{an.resumo}</p>
                </div>

                <div className="pt-2 border-t border-slate-100 space-y-1">
                  <div className="text-[11px] text-slate-500">
                    Fonte: <strong>{an.autoridadeOuFonte}</strong>
                  </div>
                  <div className="text-[11.5px] font-medium text-emerald-700 bg-emerald-50/70 p-2 rounded-lg border border-emerald-100">
                    <strong>Impacto / Projeção:</strong> {an.impactoOuProjecao}
                  </div>
                  {an.linkSecao && (
                    <a
                      href={an.linkSecao}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-panorama-navy hover:underline pt-1"
                    >
                      Ver detalhes na seção dedicada →
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rodapé Informativo Institucional ADECONT */}
      <div className="p-4 rounded-xl border border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <AdecontLogo variant="color" className="h-8 w-auto scale-90 origin-left" />
          <span>
            ADECONT · Assessoria Contábil e Administrativa · Panorama da Reforma Tributária
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAbrirEnvio}
            className="text-[11px] font-bold text-panorama-navy hover:text-panorama-navy-light flex items-center gap-1 cursor-pointer underline"
          >
            <Share2 className="w-3 h-3 text-panorama-gold-dark" />
            Enviar resultados desta consulta pela Central
          </button>
          <span className="text-[11px] text-slate-400">
            Pesquisa automatizada sobre bases federais, estaduais e municipais
          </span>
        </div>
      </div>

      {/* Modal da Central de Entrega integrado diretamente na Busca Avançada */}
      <ModalBuscaAvancada
        isOpen={modalEnvioAberto}
        onClose={() => setModalEnvioAberto(false)}
        termoInicial={termo.trim()}
        contextoInicial={{
          termo: termo.trim(),
          anexoFiltro: filtroAnexo,
          categoriaEspecial,
          totalRegistros: resultado?.totalGeralEncontrado,
          filtrosAplicados: {
            grupos: filtros.grupos,
            esferas: filtros.esferas,
            fontes: filtros.fontes,
            tiposAto: filtros.tiposAto,
            tabelas: filtros.tabelas,
            reducoes: filtros.reducoes,
          },
        }}
      />
    </div>
  )
}
