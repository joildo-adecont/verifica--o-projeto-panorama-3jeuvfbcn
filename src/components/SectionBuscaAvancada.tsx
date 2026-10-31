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
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import {
  buscarAvancado,
  type AssuntoEspecialItem,
  type ResultadoBuscaAvancada,
  type ParametrosBuscaAvancada,
} from '@/services/buscaAvancada'
import { downloadOfficialDocViaProxy } from '@/services/panorama'
import { OPCOES_TABELAS_CLASSIFICACOES } from '@/components/ModalBaseClassificacoes'
import { GraficosBusca } from '@/components/GraficosBusca'
import { toast } from '@/hooks/use-toast'

const SUGESTOES_RAPIDAS = [
  'cigarro',
  'álcool',
  'Simples Nacional',
  'lucro presumido',
  'comitê gestor',
  'entidades associativas',
  'sindicatos',
  'combustíveis',
  'imunidade',
  'cesta básica',
  'Zona Franca de Manaus',
  'LC 214/2025',
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

export function SectionBuscaAvancada() {
  const [termo, setTermo] = useState<string>('cigarro')
  const [tipoClassif, setTipoClassif] = useState<string>('TODOS')
  const [atosNivel, setAtosNivel] = useState<'todos' | 'federal' | 'estadual' | 'municipal'>(
    'todos',
  )
  const [categoriaEspecial, setCategoriaEspecial] = useState<string>('TODAS')
  const [classifPage, setClassifPage] = useState<number>(1)
  const [abaAtiva, setAbaAtiva] = useState<
    | 'tudo'
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
  const [, startTransition] = useTransition()

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

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
        classifPage,
        classifPerPage: 25,
      })
    }, 250)

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [termo, tipoClassif, atosNivel, categoriaEspecial, classifPage])

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
            <AdecontLogo variant="white" className="h-10 w-auto scale-95 origin-right" />
            <span className="text-[11px] text-slate-400 mt-1">
              Assessoria Contábil e Administrativa
            </span>
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
          {termo && (
            <button
              onClick={() => {
                setTermo('')
                setClassifPage(1)
              }}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
              title="Limpar pesquisa"
            >
              <X className="w-5 h-5" />
            </button>
          )}
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

        {/* Barra de Filtros Refinados */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Tabela:</span>
            </div>
            <select
              value={tipoClassif}
              onChange={(e) => {
                setTipoClassif(e.target.value)
                setClassifPage(1)
              }}
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-panorama-navy"
            >
              <option value="TODOS">Todas as classificações (11 tabelas)</option>
              {OPCOES_TABELAS_CLASSIFICACOES.filter((t) => t.id !== 'TODOS').map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label}
                </option>
              ))}
            </select>

            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-semibold ml-2">
              <span>Esfera dos Atos:</span>
            </div>
            <select
              value={atosNivel}
              onChange={(e) =>
                setAtosNivel(e.target.value as 'todos' | 'federal' | 'estadual' | 'municipal')
              }
              className="text-xs bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-1.5 text-slate-700 font-medium focus:outline-none focus:border-panorama-navy"
            >
              <option value="todos">Todas as esferas</option>
              <option value="federal">Federal (União, CGIBS, RFB)</option>
              <option value="estadual">Estadual (Sefaz / Estados)</option>
              <option value="municipal">Municipal (Prefeituras / Diários)</option>
            </select>

            <div className="flex items-center gap-1.5 text-xs text-amber-800 font-semibold ml-2">
              <AlertOctagon className="w-3.5 h-3.5 text-amber-600" />
              <span>Assuntos Especiais:</span>
            </div>
            <select
              value={categoriaEspecial}
              onChange={(e) => setCategoriaEspecial(e.target.value)}
              className="text-xs bg-amber-50/70 border border-amber-300 rounded-lg px-2.5 py-1.5 text-amber-900 font-medium focus:outline-none focus:border-amber-600"
            >
              {CATEGORIAS_ESPECIAIS_FILTRO.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === 'TODAS' ? 'Todos os 9 grupos especiais' : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-500 justify-end">
            {carregando ? (
              <span className="inline-flex items-center gap-1 text-panorama-navy font-semibold">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Pesquisando nas bases...
              </span>
            ) : resultado ? (
              <span>
                <strong>{resultado.totalGeralEncontrado.toLocaleString('pt-BR')}</strong> registros
                correlacionados às {resultado.timestamp}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {/* Gráficos Correlatos */}
      {resultado && <GraficosBusca termo={termo} dadosGraficos={resultado.dadosGraficos} />}

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
        <span className="text-[11px] text-slate-400">
          Pesquisa automatizada sobre bases federais, estaduais e municipais
        </span>
      </div>
    </div>
  )
}
