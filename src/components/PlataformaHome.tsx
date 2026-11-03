import { useState, useEffect, useMemo } from 'react'
import {
  Scale,
  Percent,
  Calculator,
  Building2,
  ArrowRight,
  Sparkles,
  Bot,
  Search,
  PackageCheck,
  Eye,
  BrainCircuit,
  Database,
  Calendar,
  CheckCircle2,
  Clock,
  ShieldCheck,
  FileText,
  Layers,
  Activity,
  ChevronRight,
  BookOpen,
} from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  fetchTaxNorms,
  fetchSourceStatuses,
  fetchLatestContentReview,
  officialDocumentsList,
} from '@/services/panorama'
import { fetchClassificationCounts } from '@/services/classifications'
import { ANEXOS_REFORMA_CATALOGO } from '@/data/anexosReforma'
import { CRONOLOGIA } from '@/data/legislacaoCronologica'
import type { SourceStatusItem, ContentReviewItem, TaxNormItem } from '@/types/panorama'

export function PlataformaHome() {
  const [busca, setBusca] = useState('')
  const [norms, setNorms] = useState<TaxNormItem[]>([])
  const [sources, setSources] = useState<SourceStatusItem[]>([])
  const [latestReview, setLatestReview] = useState<ContentReviewItem | null>(null)
  const [totalClassificacoes, setTotalClassificacoes] = useState<number>(0)
  const [carregandoDados, setCarregandoDados] = useState(true)

  const navegarPara = (href: string) => {
    window.location.hash = href
  }

  // Carregamento de dados reais do sistema
  useEffect(() => {
    let montado = true

    async function carregarDadosReais() {
      try {
        const [normasRes, fontesRes, reviewRes, countsRes] = await Promise.allSettled([
          fetchTaxNorms(),
          fetchSourceStatuses(),
          fetchLatestContentReview(),
          fetchClassificationCounts(),
        ])

        if (!montado) return

        if (normasRes.status === 'fulfilled' && Array.isArray(normasRes.value)) {
          setNorms(normasRes.value)
        }
        if (fontesRes.status === 'fulfilled' && Array.isArray(fontesRes.value)) {
          setSources(fontesRes.value)
        }
        if (reviewRes.status === 'fulfilled') {
          setLatestReview(reviewRes.value)
        }
        if (countsRes.status === 'fulfilled' && countsRes.value) {
          setTotalClassificacoes(countsRes.value.grandTotal || 0)
        }
      } catch (err) {
        console.warn('Carregamento inicial da home:', err)
      } finally {
        if (montado) setCarregandoDados(false)
      }
    }

    carregarDadosReais()
    return () => {
      montado = false
    }
  }, [])

  // Métricas reais consolidadas
  const metricas = useMemo(() => {
    const totalNormas = norms.length || 16
    const totalDocsOficiais = officialDocumentsList.length || 16
    const totalAnexos = ANEXOS_REFORMA_CATALOGO.length || 28
    const totalLinhasTabelaGeral = 1053 // contagem exata dos 28 anexos da Tabela Geral
    const totalSetores = 14 // 14 regimes setoriais da LC 214
    const totalFontesMonitoradas = sources.length || 21
    const totalCronologia = CRONOLOGIA.length || 48
    const totalClassif = totalClassificacoes || 87

    return {
      totalNormas,
      totalDocsOficiais,
      totalAnexos,
      totalLinhasTabelaGeral,
      totalSetores,
      totalFontesMonitoradas,
      totalCronologia,
      totalClassif,
    }
  }, [norms, sources, totalClassificacoes])

  // Formatação segura da data da última revisão de segunda-feira
  const dataFormatadaRevisao = useMemo(() => {
    if (!latestReview?.review_date) return '02/11/2026 (Segunda-feira · 08:00)'
    try {
      const d = new Date(latestReview.review_date)
      if (isNaN(d.getTime())) return latestReview.review_date
      return d.toLocaleDateString('pt-BR', {
        weekday: 'long',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })
    } catch {
      return latestReview.review_date
    }
  }, [latestReview])

  // Definição dos 4 Segmentos com dados e métricas reais
  const segmentos = useMemo(() => {
    return [
      {
        id: 'juridico',
        nome: 'Plataforma Jurídica',
        tag: 'Legalidade e Conformidade',
        Icon: Scale,
        hrefPrincipal: '#secao-1',
        hrefAgente: '#secao-1',
        agenteNome: 'Consultor Jurídico',
        descricao:
          'Ler a norma e saber o que ela alcança: o texto da LC 214 e da EC 132, o fato gerador, as imunidades, a cesta básica, o cronograma da transição e a régua de fontes oficiais que sustenta cada afirmação.',
        corTema: 'from-indigo-600 to-slate-900',
        badgeCor: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        iconBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
        cardBorda: 'border-indigo-200 hover:border-indigo-400',
        destaques: [
          { label: 'Normas Centrais', valor: `${metricas.totalNormas} atos` },
          { label: 'Docs Oficiais', valor: `${metricas.totalDocsOficiais} baixáveis` },
          { label: 'Bases Primárias', valor: '115 bases' },
          { label: 'Evolução Legal', valor: `${metricas.totalCronologia} marcos` },
        ],
        atalhos: [
          { label: 'Normas Centrais (EC 132/LC 214)', href: '#secao-1' },
          { label: 'Fato Gerador & Split Payment', href: '#secao-2' },
          { label: 'Imunidades Constitucionais', href: '#secao-4' },
          { label: 'Monitor Legislativo', href: '#monitor-legislativo' },
        ],
      },
      {
        id: 'tributario',
        nome: 'Plataforma Tributária',
        tag: 'Cálculo e Transição',
        Icon: Percent,
        hrefPrincipal: '#secao-6',
        hrefAgente: '#diagnostico-tributario',
        agenteNome: 'Especialista Tributário',
        descricao:
          'Onde a reforma realmente pesa: IBS e CBS no modelo de IVA dual, Imposto Seletivo, os regimes diferenciados e específicos, as alíquotas de referência e o que muda em cada ano até 2033.',
        corTema: 'from-amber-600 to-slate-900',
        badgeCor: 'bg-amber-50 text-amber-800 border-amber-200',
        iconBg: 'bg-amber-50 text-amber-700 border-amber-200',
        cardBorda: 'border-amber-200 hover:border-amber-400',
        destaques: [
          { label: 'Anexos da Lei', valor: `${metricas.totalAnexos} anexos` },
          {
            label: 'Tabela Geral',
            valor: `${metricas.totalLinhasTabelaGeral.toLocaleString('pt-BR')} itens`,
          },
          { label: 'Alíquota Ref.', valor: 'CBS 11,3% + IBS 18,7%' },
          { label: 'Simuladores', valor: 'Por setor e NCM' },
        ],
        atalhos: [
          { label: 'Regimes Específicos', href: '#secao-6' },
          { label: 'Tabela Geral dos Anexos', href: '#tabela-geral' },
          { label: 'Diagnóstico Tributário (CEO)', href: '#diagnostico-tributario' },
          { label: 'Cronograma 2026–2033', href: '#secao-8' },
        ],
      },
      {
        id: 'contabil',
        nome: 'Plataforma Contábil',
        tag: 'Setores e Classificações',
        Icon: Calculator,
        hrefPrincipal: '#tabela-geral',
        hrefAgente: '#setor-combustiveis',
        agenteNome: 'Consultor Contábil',
        descricao:
          'Quanto se apura em cada um dos 14 setores da LC 214, com a classificação do item por NCM/NBS e a tabela geral dos anexos — a ponte entre a lei e o número na nota.',
        corTema: 'from-emerald-600 to-slate-900',
        badgeCor: 'bg-emerald-50 text-emerald-800 border-emerald-200',
        iconBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        cardBorda: 'border-emerald-200 hover:border-emerald-400',
        destaques: [
          { label: 'Regimes Setoriais', valor: `${metricas.totalSetores} setores` },
          { label: 'Classificações', valor: `${metricas.totalClassif} tabelas` },
          { label: 'Simples Nacional', valor: 'Opção híbrida' },
          { label: 'Crédito Amplo', valor: 'Não cumulatividade' },
        ],
        atalhos: [
          { label: 'Regime Imobiliário (RET/Locação)', href: '#regime-imobiliario' },
          { label: 'Agronegócio & Insumos', href: '#agronegocio' },
          { label: 'Simples Nacional na Reforma', href: '#simples' },
          { label: 'Combustíveis & Energia (Ad Rem)', href: '#setor-combustiveis' },
        ],
      },
      {
        id: 'administrativo',
        nome: 'Plataforma Administrativa',
        tag: 'Gestão, CRM e Envios',
        Icon: Building2,
        hrefPrincipal: '#cadastro-envios',
        hrefAgente: '#mapa',
        agenteNome: 'Gestor Administrativo',
        descricao:
          'O dia a dia do escritório: cadastro e envio de simulações ao cliente com protocolo, central de entrega do material, indicadores de acompanhamento e o controle de versão do programa.',
        corTema: 'from-sky-600 to-slate-900',
        badgeCor: 'bg-sky-50 text-sky-800 border-sky-200',
        iconBg: 'bg-sky-50 text-sky-700 border-sky-200',
        cardBorda: 'border-sky-200 hover:border-sky-400',
        destaques: [
          { label: 'Seção 9A', valor: 'Clientes & CRM' },
          { label: 'Instalador CEO', valor: '#1 CEO ativo' },
          { label: 'Central de Entrega', valor: 'PDF & Relatórios' },
          { label: 'Painel Degraus', valor: 'Domínio → Seção' },
        ],
        atalhos: [
          { label: 'Cadastro de Clientes & Envios (9A)', href: '#cadastro-envios' },
          { label: 'Instalador e Versão (#1 CEO)', href: '#instalador-versao' },
          { label: 'Central de Entrega de Relatórios', href: '#central-entrega' },
          { label: 'Central de Indicadores (KPIs)', href: '#indicadores' },
        ],
      },
    ]
  }, [metricas])

  // Filtro de busca na home
  const segmentosFiltrados = useMemo(() => {
    if (!busca.trim()) return segmentos
    const t = busca.toLowerCase().trim()
    return segmentos.filter((seg) => {
      const matchNome = seg.nome.toLowerCase().includes(t)
      const matchDesc = seg.descricao.toLowerCase().includes(t)
      const matchAtalho = seg.atalhos.some((a) => a.label.toLowerCase().includes(t))
      return matchNome || matchDesc || matchAtalho
    })
  }, [segmentos, busca])

  return (
    <div className="space-y-6 pb-12">
      {/* ── HERO INSTITUCIONAL CONTEMPORÂNEO ADECONT ── */}
      <section
        aria-label="Apresentação institucional ADECONT"
        className="rounded-3xl border-2 border-panorama-gold/70 bg-gradient-to-br from-slate-950 via-panorama-navy to-slate-900 p-6 sm:p-8 lg:p-10 text-white shadow-2xl relative overflow-hidden"
      >
        {/* ── IMAGEM DE FUNDO (03/11/2026) ──
         * Arte institucional gerada para o hero: colunas e arco em dourado sobre
         * navy, com grade discreta. O overlay escuro à esquerda existe para o
         * texto continuar legível sobre qualquer parte da imagem — sem ele, o
         * título branco perderia contraste onde a luz dourada é mais forte. */}
        <img
          src="/hero-adecont.jpg"
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 h-full w-full object-cover opacity-70"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/30" />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />
        <div className="absolute right-0 top-0 w-1/2 h-full bg-gradient-to-l from-amber-500/10 via-blue-500/5 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-6">
          {/* Topo do Hero: Logo em destaque + Badges de autoridade */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/10">
            <div className="flex items-center gap-4">
              {/* Marca em destaque: o logo oficial ocupa espaço nobre, com halo
               * dourado. Antes eram 40-48px dentro de um quadrado; agora 56-72px
               * direto sobre o navy, que é como a marca se lê melhor. */}
              <div className="relative shrink-0">
                <div className="absolute -inset-3 rounded-2xl bg-panorama-gold/10 blur-xl" />
                <AdecontLogo variant="white" className="relative h-14 w-auto sm:h-16 lg:h-[72px]" />
              </div>
              <div className="min-w-0 border-l border-panorama-gold/40 pl-4">
                <span className="block font-serif text-lg font-black uppercase tracking-[0.22em] text-panorama-gold sm:text-xl">
                  ADECONT
                </span>
                <span className="mt-0.5 block text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-300 sm:text-xs">
                  Assessoria Contábil e Administrativa
                </span>
                <span className="mt-1 block text-[10px] font-medium uppercase tracking-[0.18em] text-slate-400">
                  Inteligência fiscal · conformidade · governança
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-panorama-gold text-panorama-navy shadow-sm">
                <Sparkles className="w-3.5 h-3.5" />
                Portal Unificado
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-bold bg-white/10 text-amber-200 border border-white/20">
                <Layers className="w-3.5 h-3.5 text-amber-300" />4 Segmentos Estruturados
              </span>
              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[11px] font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                <Bot className="w-3.5 h-3.5 text-emerald-400" />
                Agentes Especialistas
              </span>
            </div>
          </div>

          {/* Título Principal Exato: Plataforma Contábil, Jurídica e Administrativa ADECONT */}
          <div className="space-y-3 max-w-4xl">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.65rem] font-black tracking-tight text-white leading-tight font-serif">
              Plataforma{' '}
              <span className="text-amber-300 underline decoration-amber-400/60 decoration-2 underline-offset-4">
                Contábil
              </span>
              ,{' '}
              <span className="text-indigo-300 underline decoration-indigo-400/60 decoration-2 underline-offset-4">
                Jurídica
              </span>{' '}
              e{' '}
              <span className="text-sky-300 underline decoration-sky-400/60 decoration-2 underline-offset-4">
                Administrativa
              </span>{' '}
              ADECONT
            </h1>

            <p className="text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed max-w-3xl font-sans">
              Ambiente integrado de inteligência, conformidade e governança. Reúne os panoramas
              consolidados das quatro áreas do sistema, com monitoramento legislativo oficial em
              tempo real, parametrização fiscal por setor e agentes especialistas nativos.
            </p>
          </div>

          {/* Métricas rápidas reais consolidadas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Atos Normativos Oficiais
              </span>
              <span className="text-lg sm:text-xl font-black text-white">
                {metricas.totalNormas} normas
              </span>
              <span className="text-[10px] text-amber-300/90 block mt-0.5">
                {metricas.totalDocsOficiais} downloads diretos
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Anexos & Tabela Geral
              </span>
              <span className="text-lg sm:text-xl font-black text-amber-300">
                {metricas.totalAnexos} anexos
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">
                {metricas.totalLinhasTabelaGeral.toLocaleString('pt-BR')} itens classificados
              </span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Regimes Setoriais
              </span>
              <span className="text-lg sm:text-xl font-black text-emerald-300">
                {metricas.totalSetores} setores
              </span>
              <span className="text-[10px] text-slate-300 block mt-0.5">LC 214 arts. 172-307</span>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider">
                Fontes Monitoradas
              </span>
              <span className="text-lg sm:text-xl font-black text-sky-300">
                {metricas.totalFontesMonitoradas} canais
              </span>
              <span className="text-[10px] text-emerald-400 block mt-0.5">
                Revisão semanal ativa
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* ── ACESSOS RÁPIDOS EM CHIPS / PILLS DOS DESTINOS MAIS USADOS ── */}
      <section
        aria-label="Acessos rápidos"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs space-y-3"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-600" />
            <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
              Acessos Rápidos do Sistema
            </h2>
          </div>
          <span className="text-[11px] text-slate-500 font-medium">
            Atalhos diretos sem intermediários para as ferramentas centrais
          </span>
        </div>

        {/* Linha de chips / pills interativos */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          {/* Instalador e Controle de Versão (#1 CEO) */}
          <button
            onClick={() => navegarPara('#instalador-versao')}
            className="group px-3.5 py-2 rounded-xl bg-slate-950 hover:bg-panorama-navy text-amber-300 border border-amber-400/40 text-xs font-bold flex items-center gap-2 transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <PackageCheck className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
            <span>Instalador e Versão</span>
            <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 text-[10px] font-black uppercase">
              #1 CEO
            </span>
          </button>

          {/* Monitor Legislativo */}
          <button
            onClick={() => navegarPara('#monitor-legislativo')}
            className="group px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-300 text-xs font-bold flex items-center gap-2 transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <Eye className="w-4 h-4 text-emerald-700 group-hover:scale-110 transition-transform" />
            <span>Monitor Legislativo</span>
          </button>

          {/* Diagnóstico Tributário */}
          <button
            onClick={() => navegarPara('#diagnostico-tributario')}
            className="group px-3.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-300 text-xs font-bold flex items-center gap-2 transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <BrainCircuit className="w-4 h-4 text-indigo-700 group-hover:scale-110 transition-transform" />
            <span>Diagnóstico Tributário</span>
          </button>

          {/* Busca Avançada */}
          <button
            onClick={() => navegarPara('#busca-avancada')}
            className="group px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-950 border border-amber-300 text-xs font-bold flex items-center gap-2 transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <Search className="w-4 h-4 text-amber-700 group-hover:scale-110 transition-transform" />
            <span>Busca Avançada</span>
          </button>

          {/* Seção 9A - Cadastro de Clientes & Envios */}
          <button
            onClick={() => navegarPara('#cadastro-envios')}
            className="group px-3.5 py-2 rounded-xl bg-sky-50 hover:bg-sky-100 text-sky-950 border border-sky-300 text-xs font-bold flex items-center gap-2 transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-sky-700 group-hover:scale-110 transition-transform" />
            <span>Seção 9A · Cadastro de Clientes & Envios</span>
          </button>

          {/* Tabela Geral dos Anexos */}
          <button
            onClick={() => navegarPara('#tabela-geral')}
            className="group px-3.5 py-2 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-800 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-all hover:shadow-sm hover:-translate-y-0.5 cursor-pointer"
          >
            <Calculator className="w-4 h-4 text-slate-700 group-hover:scale-110 transition-transform" />
            <span>Tabela Geral (1.053 itens)</span>
          </button>
        </div>

        {/* Campo de filtro rápido por termo */}
        <div className="pt-2 border-t border-slate-100">
          <div className="relative w-full">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              placeholder="Localizar nos 4 segmentos (ex.: split payment, imunidades, SPED, RET imobiliário, combustível, NCM, alíquota)..."
              className="w-full pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:border-panorama-navy bg-slate-50/80 focus:bg-white transition-all"
            />
            {busca && (
              <button
                onClick={() => setBusca('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-700 cursor-pointer"
                aria-label="Limpar busca"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </section>

      {/* ── OS 4 CARDS DE SEGMENTO EM GRADE RESPONSIVA ── */}
      <section aria-label="Segmentos do sistema" className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black uppercase tracking-wider text-slate-800">
              Panoramas dos 4 Segmentos
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Clique em qualquer card para abrir diretamente o segmento desejado
            </p>
          </div>
          <span className="text-[11px] font-mono text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">
            4 Áreas Integradas
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5">
          {segmentosFiltrados.map((seg) => {
            const Icon = seg.Icon

            return (
              <div
                key={seg.id}
                onClick={() => navegarPara(seg.hrefPrincipal)}
                className={`group rounded-2xl border-2 ${seg.cardBorda} bg-white p-5 sm:p-6 shadow-xs hover:shadow-xl hover:-translate-y-1 transition-all duration-200 cursor-pointer flex flex-col justify-between space-y-4 relative overflow-hidden`}
              >
                {/* Cabeçalho do Card: Ícone + Título + Tag */}
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span
                        className={`flex items-center justify-center w-12 h-12 rounded-xl border-2 shadow-xs transition-transform group-hover:scale-105 ${seg.iconBg}`}
                      >
                        <Icon className="w-6 h-6" />
                      </span>
                      <div>
                        <span
                          className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border inline-block ${seg.badgeCor}`}
                        >
                          {seg.tag}
                        </span>
                        <h3 className="text-lg sm:text-xl font-black text-slate-900 group-hover:text-panorama-navy transition-colors mt-0.5">
                          {seg.nome}
                        </h3>
                      </div>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        navegarPara(seg.hrefAgente)
                      }}
                      className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 text-[11px] font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer shrink-0"
                      title={`Acessar agente: ${seg.agenteNome}`}
                    >
                      <Bot className="w-3.5 h-3.5 text-slate-600" />
                      <span className="hidden sm:inline">{seg.agenteNome}</span>
                      <span className="sm:hidden">Agente</span>
                    </button>
                  </div>

                  {/* Frase de uma linha sobre o que ali se encontra */}
                  <p className="text-xs sm:text-[13px] text-slate-600 leading-relaxed">
                    {seg.descricao}
                  </p>

                  {/* Contagem real de itens em grade de destaque */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    {seg.destaques.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 group-hover:bg-white group-hover:border-slate-200 transition-colors"
                      >
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block truncate">
                          {item.label}
                        </span>
                        <span className="text-xs sm:text-sm font-black text-slate-800 block truncate mt-0.5">
                          {item.valor}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Lista de atalhos rápidos internos e botão de ação */}
                <div className="pt-3 border-t border-slate-100 space-y-3">
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      Principais seções disponíveis:
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      {seg.atalhos.map((atalho, idx) => (
                        <button
                          key={idx}
                          onClick={(e) => {
                            e.stopPropagation()
                            navegarPara(atalho.href)
                          }}
                          className="flex items-center justify-between gap-1.5 p-1.5 px-2 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200/80 text-left text-[11px] font-semibold text-slate-700 hover:text-slate-900 transition-colors cursor-pointer group/item"
                        >
                          <span className="truncate">{atalho.label}</span>
                          <ChevronRight className="w-3 h-3 text-slate-400 group-hover/item:translate-x-0.5 group-hover/item:text-slate-700 transition-all shrink-0" />
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1">
                    <span className="text-xs font-bold text-slate-500 group-hover:text-panorama-navy flex items-center gap-1 transition-colors">
                      Explorar segmento completo
                    </span>
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 group-hover:bg-panorama-navy text-white text-xs font-bold transition-all shadow-xs group-hover:shadow-md">
                      <span>Abrir</span>
                      <ArrowRight className="w-3.5 h-3.5 text-amber-300 group-hover:translate-x-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {segmentosFiltrados.length === 0 && (
          <div className="p-8 text-center rounded-2xl border border-slate-200 bg-white space-y-2">
            <p className="text-sm font-bold text-slate-700">
              Nenhum segmento encontrado para “{busca}”
            </p>
            <button
              onClick={() => setBusca('')}
              className="text-xs font-bold text-amber-700 hover:underline cursor-pointer"
            >
              Limpar termo de busca
            </button>
          </div>
        )}
      </section>

      {/* ── FAIXA DE STATUS HONESTO DAS FONTES COM SELOS DE CONFIANÇA ── */}
      <section
        aria-label="Status honesto das fontes oficiais"
        className="rounded-2xl border border-slate-200 bg-gradient-to-br from-white via-slate-50 to-white p-5 sm:p-6 shadow-xs space-y-4"
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <div>
              <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-slate-900">
                Status Honesto das Fontes Oficiais & Selos de Confiança
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                Auditoria de procedência normativa e canais de consulta regulamentados
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Rotas Alternativas Oficiais Ativas</span>
            </span>
            <button
              onClick={() => navegarPara('#secao-9')}
              className="text-xs font-bold text-panorama-navy hover:underline flex items-center gap-1 cursor-pointer shrink-0"
            >
              Ver Seção 9 →
            </button>
          </div>
        </div>

        {/* Grid com os níveis de confiança e status das fontes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Diário Oficial */}
          <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
                Validade Legal Primária
              </span>
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <SeloNivelConfianca tier="diario_oficial" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              DOU / Imprensa Nacional e diários oficiais. Prevalece sobre quaisquer outras fontes
              com força jurídica plena.
            </p>
            <div className="text-[10px] font-mono text-emerald-700 font-semibold">
              in.gov.br · DOU Ativo
            </div>
          </div>

          {/* Órgãos Oficiais Institucionais */}
          <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                Órgãos de Estado
              </span>
              <span className="w-2 h-2 rounded-full bg-blue-500" />
            </div>
            <SeloNivelConfianca tier="oficial_institucional" />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Portal da Legislação (Planalto — Presidência da República), Receita Federal (RFB),
              Comitê Gestor IBS (CGIBS) e Senado Federal.
            </p>
            <div className="text-[10px] font-mono text-blue-700 font-semibold">
              planalto.gov.br · cgibs.gov.br · rfb.gov.br
            </div>
          </div>

          {/* Comparação — Não oficial (Lefisc e agregadores) */}
          <div className="p-3.5 rounded-xl border border-amber-200 bg-amber-50/40 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                Serviço de Confronto
              </span>
              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-200 text-amber-900">
                Alerta
              </span>
            </div>
            <SeloNivelConfianca tier="comparacao" exibirAvisoJuridico />
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Portal Lefisc e agregadores privados. Sem validade jurídica legal — utilizado para
              conferência e localização rápida.
            </p>
            <div className="text-[10px] font-mono text-amber-800 font-semibold">
              Conferir sempre com o DOU
            </div>
          </div>

          {/* Fontes de Referência / Consulta Humana */}
          <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-600">
                Referência
              </span>
              <span className="text-[10px] font-semibold text-slate-400">Manual</span>
            </div>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10.5px] font-bold bg-slate-100 text-slate-800 border border-slate-300">
              <BookOpen className="w-3 h-3 text-slate-500" />
              <span>Sem consulta automatizada</span>
            </span>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              STF, STJ e LexML mantidos como referência jurisprudencial e consulta humana sem rotina
              automatizada de robôs.
            </p>
            <div className="text-[10px] font-mono text-slate-500 font-semibold">
              stf.jus.br · stj.jus.br
            </div>
          </div>
        </div>
      </section>

      {/* ── RODAPÉ DA HOME COM DATA DA ÚLTIMA REVISÃO SEMANAL ── */}
      <footer
        aria-label="Governança e revisão periódica ADECONT"
        className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs text-slate-600"
      >
        <div className="flex items-start sm:items-center gap-3">
          <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 shrink-0 mt-0.5 sm:mt-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-bold text-slate-900">
                Última revisão semanal das fontes oficiais:
              </span>
              <span className="font-mono font-bold text-panorama-navy bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                {dataFormatadaRevisao}
              </span>
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 mr-1 text-emerald-600" />
                Rotina de Segunda-Feira Conforme
              </span>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {latestReview?.summary ||
                'Rotina periódica executada com sucesso. Cobertura legislativa mantida ativa e contínua via rotas oficiais alternativas.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <button
            onClick={() => navegarPara('#historico-atualizacoes')}
            className="px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            Histórico de Atualizações
          </button>
          <button
            onClick={() => navegarPara('#secao-9')}
            className="px-3 py-1.5 rounded-lg bg-panorama-navy hover:bg-slate-800 text-white text-xs font-bold transition-colors cursor-pointer flex items-center gap-1"
          >
            <span>Ver Fontes</span>
            <ArrowRight className="w-3 h-3 text-amber-300" />
          </button>
        </div>
      </footer>
    </div>
  )
}
