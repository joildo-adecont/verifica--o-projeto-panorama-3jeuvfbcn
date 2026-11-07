import React, { useMemo, useState } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  HelpCircle,
  Layers,
  Filter,
  LayoutGrid,
  Table as TableIcon,
  Search,
  Sparkles,
  ArrowUpDown,
  FileSpreadsheet,
} from 'lucide-react'
import type {
  ItemIndicador,
  StatusSemaforo,
  AnaliseBalanco3Exercicios,
} from '@/types/analisesEmpresariaisModel'
import { calcular25Indicadores } from '@/services/motorAnaliseEmpresarial'

interface Props {
  indicadores: ItemIndicador[]
  clienteNome: string
  exercicioRotulo?: string
  balanco3Anos?: AnaliseBalanco3Exercicios
}

// Grupos estruturais ADECONT
const GRUPOS_DEFINICAO = [
  {
    id: 'todos',
    titulo: 'Todos os Indicadores',
    rotuloCurto: 'Todos (25)',
    ids: [] as string[],
  },
  {
    id: 'liquidez',
    titulo: '1. Índices de Liquidez (Capacidade de Pagamento)',
    rotuloCurto: '1. Liquidez',
    ids: ['liq_corrente', 'liq_seca', 'liq_imediata', 'liq_geral', 'ccl'],
  },
  {
    id: 'endividamento',
    titulo: '2. Estrutura de Capital & Endividamento',
    rotuloCurto: '2. Endividamento',
    ids: [
      'pct',
      'comp_endividamento',
      'grau_endividamento',
      'divida_liquida',
      'div_liq_ebitda',
      'div_liq_pl',
    ],
  },
  {
    id: 'rentabilidade',
    titulo: '3. Rentabilidade & Retorno sobre o Capital',
    rotuloCurto: '3. Rentabilidade',
    ids: ['margem_bruta', 'margem_ebitda', 'margem_operacional', 'margem_liquida', 'roa', 'roe'],
  },
  {
    id: 'atividade',
    titulo: '4. Atividade & Ciclos Operacionais',
    rotuloCurto: '4. Atividade / Ciclos',
    ids: ['giro_ativo', 'pmr', 'pmp', 'pme', 'ciclo_operacional', 'ciclo_financeiro'],
  },
  {
    id: 'cobertura',
    titulo: '5. Cobertura de Dívida & Investimentos',
    rotuloCurto: '5. Cobertura / Capex',
    ids: ['dscr', 'capex_receita'],
  },
]

export const FerramentaIndicadoresComparativos: React.FC<Props> = ({
  indicadores,
  clienteNome,
  exercicioRotulo = 'Ano Atual',
  balanco3Anos,
}) => {
  const [grupoFiltro, setGrupoFiltro] = useState<string>('todos')
  const [semaforoFiltro, setSemaforoFiltro] = useState<string>('todos')
  const [busca, setBusca] = useState<string>('')
  const [modoVisualizacao, setModoVisualizacao] = useState<'cards' | 'tabela'>('cards')
  const [ordenacao, setOrdenacao] = useState<'padrao' | 'criticos' | 'alfabetica'>('padrao')

  // Indicadores calculados para Ano -2 e Ano -1 quando houver balanço 3 anos
  const { indMenos2Map, indMenos1Map, rotuloMenos2, rotuloMenos1, rotuloAtual } = useMemo(() => {
    if (!balanco3Anos) {
      return {
        indMenos2Map: new Map<string, ItemIndicador>(),
        indMenos1Map: new Map<string, ItemIndicador>(),
        rotuloMenos2: 'Ano -2',
        rotuloMenos1: 'Ano -1',
        rotuloAtual: exercicioRotulo,
      }
    }

    const calcMenos2 = calcular25Indicadores(balanco3Anos.anoMenos2)
    const calcMenos1 = calcular25Indicadores(balanco3Anos.anoMenos1)

    return {
      indMenos2Map: new Map(calcMenos2.map((i) => [i.id, i])),
      indMenos1Map: new Map(calcMenos1.map((i) => [i.id, i])),
      rotuloMenos2: balanco3Anos.anoMenos2?.rotulo || 'Ano -2',
      rotuloMenos1: balanco3Anos.anoMenos1?.rotulo || 'Ano -1',
      rotuloAtual: balanco3Anos.anoAtual?.rotulo || exercicioRotulo,
    }
  }, [balanco3Anos, exercicioRotulo])

  const formatarValorNumerico = (
    val: number | null | undefined,
    unidade: ItemIndicador['unidade'],
  ): string => {
    if (val === null || val === undefined || isNaN(val)) return '—'
    if (unidade === 'moeda') {
      return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0,
      }).format(val)
    }
    if (unidade === 'percentual') {
      return `${val.toFixed(2).replace('.', ',')}%`
    }
    if (unidade === 'dias') {
      return `${Math.round(val)} dias`
    }
    return `${val.toFixed(2).replace('.', ',')}x`
  }

  // Variação percentual entre ano atual e ano anterior
  const calcularVariacao = (atual: number, anterior: number | undefined) => {
    if (
      anterior === undefined ||
      anterior === null ||
      anterior === 0 ||
      isNaN(atual) ||
      isNaN(anterior)
    ) {
      return null
    }
    const delta = ((atual - anterior) / Math.abs(anterior)) * 100
    return delta
  }

  const getSemaforoBadge = (status: StatusSemaforo) => {
    switch (status) {
      case 'saudavel':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
            Saudável
          </span>
        )
      case 'atencao':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
            <AlertTriangle className="w-3 h-3 text-amber-600 dark:text-amber-400" />
            Atenção
          </span>
        )
      case 'critico':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800">
            <XCircle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
            Crítico
          </span>
        )
    }
  }

  // Estilização do card por status semafórico
  const getCardAparencia = (status: StatusSemaforo) => {
    switch (status) {
      case 'saudavel':
        return {
          cardBorder: 'border-emerald-200 dark:border-emerald-800/60 hover:border-emerald-400',
          topBar: 'bg-emerald-500',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300',
          valorCor: 'text-slate-900 dark:text-white',
        }
      case 'atencao':
        return {
          cardBorder: 'border-amber-200 dark:border-amber-800/60 hover:border-amber-400',
          topBar: 'bg-amber-500',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300',
          valorCor: 'text-slate-900 dark:text-white',
        }
      case 'critico':
        return {
          cardBorder: 'border-rose-200 dark:border-rose-800/60 hover:border-rose-400',
          topBar: 'bg-rose-500',
          badgeBg: 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-300',
          valorCor: 'text-rose-950 dark:text-rose-100',
        }
    }
  }

  // Mapeia cada indicador a um grupo
  const getNomeGrupoIndicador = (id: string): string => {
    for (const g of GRUPOS_DEFINICAO) {
      if (g.id !== 'todos' && g.ids.includes(id)) {
        return g.rotuloCurto
      }
    }
    return 'Geral'
  }

  // Totais
  const totalSaudavel = indicadores.filter((i) => i.semaforo === 'saudavel').length
  const totalAtencao = indicadores.filter((i) => i.semaforo === 'atencao').length
  const totalCritico = indicadores.filter((i) => i.semaforo === 'critico').length

  // Filtragem
  const indicadoresFiltrados = useMemo(() => {
    let lista = [...indicadores]

    if (grupoFiltro !== 'todos') {
      const grupoObj = GRUPOS_DEFINICAO.find((g) => g.id === grupoFiltro)
      if (grupoObj) {
        lista = lista.filter((i) => grupoObj.ids.includes(i.id))
      }
    }

    if (semaforoFiltro !== 'todos') {
      lista = lista.filter((i) => i.semaforo === semaforoFiltro)
    }

    if (busca.trim()) {
      const termo = busca.toLowerCase()
      lista = lista.filter(
        (i) =>
          i.nome.toLowerCase().includes(termo) ||
          i.formula.toLowerCase().includes(termo) ||
          i.explicacao.toLowerCase().includes(termo) ||
          i.referencia.toLowerCase().includes(termo),
      )
    }

    if (ordenacao === 'criticos') {
      const peso: Record<StatusSemaforo, number> = { critico: 0, atencao: 1, saudavel: 2 }
      lista.sort((a, b) => peso[a.semaforo] - peso[b.semaforo])
    } else if (ordenacao === 'alfabetica') {
      lista.sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    }

    return lista
  }, [indicadores, grupoFiltro, semaforoFiltro, busca, ordenacao])

  return (
    <div className="space-y-6">
      {/* 1. PAINEL DE SÍNTESE EXECUTIVA — 4 CARDS NO PADRÃO PANORAMA */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Monitorados */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Indicadores Monitorados
            </span>
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              {indicadores.length}
            </span>
            <span className="text-xs font-semibold text-slate-500">métricas ativas</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 flex items-center gap-1.5 truncate">
            <span className="font-semibold text-primary">{rotuloAtual}</span>
            <span>•</span>
            <span className="truncate">{clienteNome}</span>
          </div>
        </div>

        {/* Card 2: Saudáveis */}
        <div
          onClick={() => setSemaforoFiltro(semaforoFiltro === 'saudavel' ? 'todos' : 'saudavel')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all relative overflow-hidden ${
            semaforoFiltro === 'saudavel'
              ? 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-500 ring-2 ring-emerald-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Nível Saudável
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-200">
              {indicadores.length > 0
                ? `${Math.round((totalSaudavel / indicadores.length) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 tracking-tight">
              {totalSaudavel}
            </span>
            <span className="text-xs font-semibold text-slate-500">de {indicadores.length}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Em conformidade com benchmarks oficiais</p>
        </div>

        {/* Card 3: Atenção */}
        <div
          onClick={() => setSemaforoFiltro(semaforoFiltro === 'atencao' ? 'todos' : 'atencao')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all relative overflow-hidden ${
            semaforoFiltro === 'atencao'
              ? 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-500 ring-2 ring-amber-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-amber-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Nível de Atenção
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200">
              {indicadores.length > 0
                ? `${Math.round((totalAtencao / indicadores.length) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-amber-600 dark:text-amber-400 tracking-tight">
              {totalAtencao}
            </span>
            <span className="text-xs font-semibold text-slate-500">de {indicadores.length}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Margem próxima ao limite regulatório</p>
        </div>

        {/* Card 4: Crítico */}
        <div
          onClick={() => setSemaforoFiltro(semaforoFiltro === 'critico' ? 'todos' : 'critico')}
          className={`cursor-pointer rounded-2xl border p-4 shadow-sm transition-all relative overflow-hidden ${
            semaforoFiltro === 'critico'
              ? 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-500 ring-2 ring-rose-500/20'
              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-rose-300'
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-rose-700 dark:text-rose-400 uppercase tracking-wider flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" />
              Nível Crítico
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/60 text-rose-800 dark:text-rose-200">
              {indicadores.length > 0
                ? `${Math.round((totalCritico / indicadores.length) * 100)}%`
                : '0%'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-rose-600 dark:text-rose-400 tracking-tight">
              {totalCritico}
            </span>
            <span className="text-xs font-semibold text-slate-500">de {indicadores.length}</span>
          </div>
          <p className="mt-2 text-[11px] text-slate-500">Exige intervenção e plano corretivo</p>
        </div>
      </div>

      {/* 2. BARRA DE CONTROLE: CATEGORIAS, BUSCA, ORDENAÇÃO E VISTA */}
      <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 space-y-3">
          {/* Linha 1: Filtros de Categoria */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1 shrink-0">
              <Filter className="w-3.5 h-3.5 text-primary" /> Dimensões:
            </span>
            {GRUPOS_DEFINICAO.map((grupo) => {
              const ativo = grupoFiltro === grupo.id
              return (
                <button
                  key={grupo.id}
                  type="button"
                  onClick={() => setGrupoFiltro(grupo.id)}
                  className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                    ativo
                      ? 'bg-primary text-white shadow-xs font-semibold'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                  }`}
                >
                  {grupo.rotuloCurto}
                </button>
              )
            })}
          </div>

          {/* Linha 2: Busca, Ordenação e Alternador de Visão */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
            {/* Campo de Busca Rápida */}
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por nome, fórmula ou referência..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/60 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
              />
              {busca && (
                <button
                  type="button"
                  onClick={() => setBusca('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Ordenação */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setOrdenacao('padrao')}
                  className={`text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                    ordenacao === 'padrao'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Ordem Oficial
                </button>
                <button
                  type="button"
                  onClick={() => setOrdenacao('criticos')}
                  className={`text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                    ordenacao === 'criticos'
                      ? 'bg-rose-600 text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Prioridade Crítica
                </button>
                <button
                  type="button"
                  onClick={() => setOrdenacao('alfabetica')}
                  className={`text-[11px] px-2 py-1 rounded font-medium transition-colors ${
                    ordenacao === 'alfabetica'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white font-bold shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  A-Z
                </button>
              </div>

              {/* Botões Grid / Tabela */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700">
                <button
                  type="button"
                  onClick={() => setModoVisualizacao('cards')}
                  title="Visualização em Cards"
                  className={`p-1.5 rounded transition-colors ${
                    modoVisualizacao === 'cards'
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setModoVisualizacao('tabela')}
                  title="Visualização em Tabela"
                  className={`p-1.5 rounded transition-colors ${
                    modoVisualizacao === 'tabela'
                      ? 'bg-white dark:bg-slate-700 text-primary shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <TableIcon className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Limpar Filtros */}
              {(grupoFiltro !== 'todos' ||
                semaforoFiltro !== 'todos' ||
                busca ||
                ordenacao !== 'padrao') && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setGrupoFiltro('todos')
                    setSemaforoFiltro('todos')
                    setBusca('')
                    setOrdenacao('padrao')
                  }}
                  className="text-xs h-7 px-2 text-slate-500 hover:text-slate-900"
                >
                  Limpar
                </Button>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* 3. VISUALIZAÇÃO: GRID DE CARDS OU TABELA */}
      {indicadoresFiltrados.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 mx-auto flex items-center justify-center mb-3">
            <HelpCircle className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
            Nenhum indicador encontrado
          </h4>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
            Nenhuma métrica corresponde aos filtros e termos pesquisados.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setGrupoFiltro('todos')
              setSemaforoFiltro('todos')
              setBusca('')
              setOrdenacao('padrao')
            }}
            className="mt-4 text-xs"
          >
            Redefinir Filtros
          </Button>
        </div>
      ) : modoVisualizacao === 'cards' ? (
        /* MODO CARDS RICOS COM HIERARQUIA TIPOGRÁFICA */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {indicadoresFiltrados.map((ind) => {
            const aparencia = getCardAparencia(ind.semaforo)
            const indMenos1 = indMenos1Map.get(ind.id)
            const indMenos2 = indMenos2Map.get(ind.id)
            const variacao = indMenos1 ? calcularVariacao(ind.valor, indMenos1.valor) : null
            const nomeGrupo = getNomeGrupoIndicador(ind.id)

            return (
              <div
                key={ind.id}
                className={`bg-white dark:bg-slate-900 rounded-2xl border ${aparencia.cardBorder} shadow-sm hover:shadow-md transition-all flex flex-col justify-between overflow-hidden relative group`}
              >
                {/* Faixa superior de semáforo */}
                <div className={`h-1.5 w-full ${aparencia.topBar}`} />

                <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                  {/* Cabeçalho do Card */}
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300">
                        {nomeGrupo}
                      </span>
                      {getSemaforoBadge(ind.semaforo)}
                    </div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug line-clamp-1">
                      {ind.nome}
                    </h4>
                  </div>

                  {/* Bloco de Valor Principal Destaque */}
                  <div className="bg-slate-50/80 dark:bg-slate-800/40 rounded-xl p-3 border border-slate-100 dark:border-slate-800">
                    <div className="flex items-baseline justify-between gap-2">
                      <div>
                        <span className="text-xs text-slate-600 dark:text-slate-300 block font-medium">
                          {rotuloAtual}
                        </span>
                        <div className="text-2xl font-black tracking-tight font-mono text-slate-900 dark:text-white">
                          {formatarValorNumerico(ind.valor, ind.unidade)}
                        </div>
                      </div>

                      {/* Badge de Variação Temporal */}
                      {variacao !== null && (
                        <div
                          className={`flex items-center gap-1 text-xs font-bold font-mono px-2 py-1 rounded-lg ${
                            variacao > 0
                              ? 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800'
                              : variacao < 0
                                ? 'text-rose-700 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800'
                                : 'text-slate-500 bg-slate-100 dark:bg-slate-800'
                          }`}
                          title={`Variação frente a ${rotuloMenos1}`}
                        >
                          {variacao > 0 ? (
                            <TrendingUp className="w-3.5 h-3.5" />
                          ) : variacao < 0 ? (
                            <TrendingDown className="w-3.5 h-3.5" />
                          ) : (
                            <Minus className="w-3.5 h-3.5" />
                          )}
                          <span>
                            {variacao > 0 ? '+' : ''}
                            {variacao.toFixed(1).replace('.', ',')}%
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Comparativo Trienal Compacto */}
                    <div className="grid grid-cols-3 gap-1.5 mt-2.5 pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-center">
                      <div className="p-1 rounded bg-white/70 dark:bg-slate-900/60">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 block truncate font-medium">
                          {rotuloMenos2}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                          {indMenos2 ? formatarValorNumerico(indMenos2.valor, ind.unidade) : '—'}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-white/70 dark:bg-slate-900/60">
                        <span className="text-[10px] text-slate-600 dark:text-slate-300 block truncate font-medium">
                          {rotuloMenos1}
                        </span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 font-mono">
                          {indMenos1 ? formatarValorNumerico(indMenos1.valor, ind.unidade) : '—'}
                        </span>
                      </div>
                      <div className="p-1 rounded bg-primary/10 border border-primary/20">
                        <span className="text-[10px] font-bold text-primary block truncate">
                          {rotuloAtual}
                        </span>
                        <span className="text-xs font-bold text-primary font-mono">
                          {formatarValorNumerico(ind.valor, ind.unidade)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Diagnóstico Explicativo */}
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed line-clamp-2">
                    {ind.explicacao}
                  </p>

                  {/* Rodapé com Benchmark e Fórmula */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300 gap-2">
                    <span className="truncate">
                      Meta:{' '}
                      <strong className="text-slate-700 dark:text-slate-200">
                        {ind.referencia}
                      </strong>
                    </span>
                    <span
                      className="truncate font-mono text-[10px] text-slate-600 dark:text-slate-300"
                      title={ind.formula}
                    >
                      {ind.formula}
                    </span>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        /* MODO TABELA CORPORATIVA */
        <Card className="border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40">
            <CardTitle className="text-xs font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-primary" />
              Tabela Completa de Indicadores ADECONT ({indicadoresFiltrados.length} métricas)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0 overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 border-b border-slate-200 dark:border-slate-800 text-left font-semibold">
                  <th className="p-3">Indicador</th>
                  <th className="p-3 hidden md:table-cell">Grupo</th>
                  <th className="p-3 text-center">Referência</th>
                  <th className="p-3 text-right">{rotuloMenos2}</th>
                  <th className="p-3 text-right">{rotuloMenos1}</th>
                  <th className="p-3 text-right font-bold text-primary">{rotuloAtual}</th>
                  <th className="p-3 text-center">Tendência</th>
                  <th className="p-3 text-center">Semáforo</th>
                  <th className="p-3 hidden lg:table-cell">Diagnóstico</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {indicadoresFiltrados.map((ind) => {
                  const indMenos1 = indMenos1Map.get(ind.id)
                  const indMenos2 = indMenos2Map.get(ind.id)
                  const variacao = indMenos1 ? calcularVariacao(ind.valor, indMenos1.valor) : null
                  const nomeGrupo = getNomeGrupoIndicador(ind.id)

                  return (
                    <tr
                      key={ind.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="p-3 font-semibold text-slate-900 dark:text-slate-100">
                        <div>{ind.nome}</div>
                        <div className="text-[10px] text-slate-600 dark:text-slate-300 font-mono hidden sm:block">
                          {ind.formula}
                        </div>
                      </td>
                      <td className="p-3 text-slate-600 dark:text-slate-300 text-[11px] hidden md:table-cell">
                        {nomeGrupo}
                      </td>
                      <td className="p-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {ind.referencia}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {indMenos2 ? formatarValorNumerico(indMenos2.valor, ind.unidade) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono text-slate-600 dark:text-slate-400">
                        {indMenos1 ? formatarValorNumerico(indMenos1.valor, ind.unidade) : '—'}
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-primary text-sm">
                        {formatarValorNumerico(ind.valor, ind.unidade)}
                      </td>
                      <td className="p-3 text-center">
                        {variacao !== null ? (
                          <span
                            className={`inline-flex items-center gap-0.5 font-mono text-[11px] font-bold ${
                              variacao > 0
                                ? 'text-emerald-600'
                                : variacao < 0
                                  ? 'text-rose-600'
                                  : 'text-slate-400'
                            }`}
                          >
                            {variacao > 0 ? '+' : ''}
                            {variacao.toFixed(1).replace('.', ',')}%
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      <td className="p-3 text-center">{getSemaforoBadge(ind.semaforo)}</td>
                      <td className="p-3 text-[11px] text-slate-600 dark:text-slate-300 hidden lg:table-cell max-w-xs truncate">
                        {ind.explicacao}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

export default FerramentaIndicadoresComparativos
