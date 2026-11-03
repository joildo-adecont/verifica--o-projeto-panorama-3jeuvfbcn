import React, { useState, useEffect, useMemo } from 'react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Ban,
  Search,
  Filter,
  PlusCircle,
  Printer,
  Calendar,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  AlertCircle,
  FileX,
  X,
  Layers,
  Check,
} from 'lucide-react'
import type {
  NormExclusionHistoryItem,
  CreateNormExclusionInput,
  NormSegment,
} from '@/types/panorama'
import {
  listarHistoricoExclusoes,
  filtrarHistoricoExclusoes,
  criarRegistroExclusaoManual,
  calcularMetricasExclusoes,
  extrairFontesComExclusoes,
  FILTROS_EXCLUSOES_INICIAIS,
  type FiltrosHistoricoExclusoes,
  type FonteDisponivelExclusao,
} from '@/services/normExclusionsHistory'
import { criarAlertaParaExclusao } from '@/services/normAlerts'
import { ModalDetalhesExclusao } from '@/components/ModalDetalhesExclusao'
import { ModalNovaExclusao } from '@/components/ModalNovaExclusao'
import { RelatorioExclusoesImprimivel } from '@/components/RelatorioExclusoesImprimivel'

export const SectionHistoricoExclusoes: React.FC = () => {
  const [itens, setItens] = useState<NormExclusionHistoryItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [filtros, setFiltros] = useState<FiltrosHistoricoExclusoes>(FILTROS_EXCLUSOES_INICIAIS)
  const [exclusaoDetalhes, setExclusaoDetalhes] = useState<NormExclusionHistoryItem | null>(null)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [modalImprimirAberto, setModalImprimirAberto] = useState(false)

  const carregarDados = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarHistoricoExclusoes()
      setItens(lista)
    } catch (err) {
      console.error('Erro ao listar exclusões:', err)
      setErro('Não foi possível carregar as exclusões da base. Exibindo acervo disponível.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()

    const handleUpdate = () => {
      carregarDados()
    }
    window.addEventListener('norm_exclusions_updated', handleUpdate)
    return () => {
      window.removeEventListener('norm_exclusions_updated', handleUpdate)
    }
  }, [])

  // Lista dinâmica de fontes que realmente possuem exclusões registradas no acervo
  const fontesDisponiveis = useMemo<FonteDisponivelExclusao[]>(() => {
    return extrairFontesComExclusoes(itens)
  }, [itens])

  const itensFiltrados = useMemo(() => {
    return filtrarHistoricoExclusoes(itens, filtros)
  }, [itens, filtros])

  const metricas = useMemo(() => {
    return calcularMetricasExclusoes(itens)
  }, [itens])

  const fonteAtivaInfo = useMemo(() => {
    if (filtros.fonte === 'TODAS') return null
    return fontesDisponiveis.find((f) => f.id === filtros.fonte) || null
  }, [filtros.fonte, fontesDisponiveis])

  const temFiltrosAtivos = useMemo(() => {
    return (
      Boolean(filtros.busca) ||
      filtros.segmento !== 'TODOS' ||
      filtros.fonte !== 'TODAS' ||
      filtros.periodo !== 'todos'
    )
  }, [filtros])

  const handleSalvarManual = async (dados: CreateNormExclusionInput) => {
    const novo = await criarRegistroExclusaoManual(dados)
    setItens((prev) => [novo, ...prev])

    // Dispara geração do alerta correspondente no sino
    try {
      await criarAlertaParaExclusao(novo)
      window.dispatchEvent(new CustomEvent('norm_alerts_updated'))
    } catch (err) {
      console.warn('Erro ao disparar alerta da exclusão:', err)
    }
  }

  return (
    <section id="historico-exclusoes" className="w-full py-8 space-y-6">
      {/* Cabeçalho da Seção com Logo ADECONT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <AdecontLogo variant="color" className="h-10 w-auto" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 flex items-center gap-1.5">
              <Ban className="h-3.5 w-3.5" />
              Histórico Oficial de Exclusões
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Histórico de Exclusões e Revogações Legislativas
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            Rastreamento cronológico de todas as exclusões, revogações expressas e perdas de
            eficácia de normas, artigos e tabelas da Reforma Tributária (Leis Complementares,
            Decretos, Resoluções CGIBS, Portarias e Atos). Atualizado automaticamente pela rotina
            semanal de segunda-feira e registros da diretoria.
          </p>
        </div>

        {/* Botões de Ação */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <Button
            variant="outline"
            size="sm"
            onClick={carregarDados}
            disabled={carregando}
            className="gap-1.5 text-xs"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => setModalImprimirAberto(true)}
            className="gap-1.5 text-xs text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <Printer className="h-3.5 w-3.5 text-rose-600" />
            Relatório A4 / Imprimir
          </Button>

          <Button
            size="sm"
            onClick={() => setModalNovoAberto(true)}
            className="gap-1.5 text-xs bg-rose-600 hover:bg-rose-700 text-white shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Registrar Exclusão
          </Button>
        </div>
      </div>

      {/* Cartões de Indicadores Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-slate-500">Total de Exclusões</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {metricas.total}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" /> Mais recente no topo
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-rose-700 dark:text-rose-400">
              Segmento Tributário
            </div>
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1">
              {metricas.porSegmento.Tributário}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
              Regras e alíquotas revogadas
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-amber-700 dark:text-amber-400">
              Segmento Jurídico
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">
              {metricas.porSegmento.Jurídico}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
              Leis e dispositivos revogados
            </div>
          </CardContent>
        </Card>

        <Card className="bg-sky-50/50 dark:bg-sky-950/20 border-sky-200 dark:border-sky-900/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-sky-700 dark:text-sky-400">
              Contábil & Administrativo
            </div>
            <div className="text-2xl font-bold text-sky-900 dark:text-sky-200 mt-1">
              {metricas.porSegmento.Contábil + metricas.porSegmento.Administrativo}
            </div>
            <div className="text-[11px] text-sky-600 dark:text-sky-400 mt-1">
              Obrigações e cadastros revogados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca com Seletor Especializado por Fonte */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Campo de Busca Textual */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por norma, artigo, motivo ou código..."
                value={filtros.busca}
                onChange={(e) => setFiltros((prev) => ({ ...prev, busca: e.target.value }))}
                className="pl-9 text-xs"
              />
            </div>

            {/* Filtro por Segmento */}
            <div>
              <Select
                value={filtros.segmento}
                onValueChange={(val) =>
                  setFiltros((prev) => ({ ...prev, segmento: val as 'TODOS' | NormSegment }))
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Segmento" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todos os Segmentos</SelectItem>
                  <SelectItem value="Tributário">Tributário</SelectItem>
                  <SelectItem value="Jurídico">Jurídico</SelectItem>
                  <SelectItem value="Contábil">Contábil</SelectItem>
                  <SelectItem value="Administrativo">Administrativo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filtro Funcional por Fonte (com selo e contagem de exclusões) */}
            <div>
              <Select
                value={filtros.fonte}
                onValueChange={(val) => setFiltros((prev) => ({ ...prev, fonte: val }))}
              >
                <SelectTrigger className="text-xs">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-slate-400 font-normal shrink-0">Fonte:</span>
                    <span className="truncate font-medium">
                      {filtros.fonte === 'TODAS'
                        ? 'Todas as Fontes'
                        : fontesDisponiveis.find((f) => f.id === filtros.fonte)?.label ||
                          filtros.fonte}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent className="max-h-80">
                  <SelectItem value="TODAS">
                    <div className="flex items-center justify-between gap-3 w-full py-0.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        Todas as fontes
                      </span>
                      <span className="text-[11px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                        {itens.length}
                      </span>
                    </div>
                  </SelectItem>

                  {fontesDisponiveis.map((f) => (
                    <SelectItem key={f.id} value={f.id}>
                      <div className="flex items-center justify-between gap-3 w-full py-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-xs font-medium text-slate-900 dark:text-slate-100 truncate">
                            {f.label}
                          </span>
                          <SeloNivelConfianca tier={f.confidence_tier} fonte={f.label} compacto />
                        </div>
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded shrink-0">
                          {f.count}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filtro por Período */}
            <div>
              <Select
                value={filtros.periodo}
                onValueChange={(val) =>
                  setFiltros((prev) => ({
                    ...prev,
                    periodo: val as 'todos' | '7dias' | '30dias' | '90dias' | 'ano2026',
                  }))
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todo o Período</SelectItem>
                  <SelectItem value="7dias">Últimos 7 dias</SelectItem>
                  <SelectItem value="30dias">Últimos 30 dias</SelectItem>
                  <SelectItem value="90dias">Últimos 90 dias</SelectItem>
                  <SelectItem value="ano2026">Ano de 2026</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Chips de Acesso Rápido por Fonte Oficial (com Selo de Confiança e Contagem) */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Layers className="h-3 w-3 text-rose-600" />
                Filtrar por Fonte Primária:
              </span>

              {filtros.fonte !== 'TODAS' && (
                <button
                  type="button"
                  onClick={() => setFiltros((prev) => ({ ...prev, fonte: 'TODAS' }))}
                  className="text-[11px] text-rose-600 dark:text-rose-400 hover:underline inline-flex items-center gap-1 font-medium"
                >
                  <X className="h-3 w-3" />
                  Voltar a todas as fontes
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {/* Chip "Todas as fontes" */}
              <button
                type="button"
                onClick={() => setFiltros((prev) => ({ ...prev, fonte: 'TODAS' }))}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold transition-all border ${
                  filtros.fonte === 'TODAS'
                    ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                    : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
                }`}
              >
                {filtros.fonte === 'TODAS' && <Check className="h-3 w-3" />}
                <span>Todas as fontes</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                    filtros.fonte === 'TODAS'
                      ? 'bg-rose-700 text-rose-100'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  {itens.length}
                </span>
              </button>

              {/* Chips de Fontes com Selo e Contagem */}
              {fontesDisponiveis.map((f) => {
                const ativa = filtros.fonte === f.id
                return (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() =>
                      setFiltros((prev) => ({
                        ...prev,
                        fonte: ativa ? 'TODAS' : f.id,
                      }))
                    }
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all border ${
                      ativa
                        ? 'bg-rose-50 text-rose-900 border-rose-400 dark:bg-rose-950/60 dark:text-rose-200 dark:border-rose-700 ring-2 ring-rose-200 dark:ring-rose-900 shadow-sm'
                        : 'bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <span className="font-semibold">{f.id}</span>
                    <SeloNivelConfianca tier={f.confidence_tier} fonte={f.label} compacto />
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        ativa
                          ? 'bg-rose-200/80 text-rose-900 dark:bg-rose-900 dark:text-rose-100'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Linha Informativa com Contagem de Resultados e Limpeza */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 dark:text-slate-400 pt-2 border-t border-slate-100 dark:border-slate-800 gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-medium text-slate-700 dark:text-slate-200">
                <strong>{itensFiltrados.length}</strong>{' '}
                {itensFiltrados.length === 1 ? 'exclusão encontrada' : 'exclusões encontradas'}
              </span>
              <span>
                (de um total de <strong>{itens.length}</strong> registradas)
              </span>

              {fonteAtivaInfo && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800 font-medium">
                  Fonte: {fonteAtivaInfo.label}
                  <SeloNivelConfianca
                    tier={fonteAtivaInfo.confidence_tier}
                    fonte={fonteAtivaInfo.label}
                    compacto
                  />
                </span>
              )}
            </div>

            {temFiltrosAtivos && (
              <button
                type="button"
                onClick={() => setFiltros(FILTROS_EXCLUSOES_INICIAIS)}
                className="text-rose-600 dark:text-rose-400 hover:underline font-semibold text-left sm:text-right"
              >
                Limpar todos os filtros ({itensFiltrados.length} de {itens.length})
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linha do Tempo Cronológica com a Mais Recente no Topo */}
      <div className="space-y-4">
        {carregando ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-rose-600" />
            <p className="text-sm">Carregando histórico cronológico de exclusões...</p>
          </div>
        ) : erro && itensFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
            <AlertCircle className="h-6 w-6 text-rose-600 mx-auto" />
            <p className="text-sm text-rose-800 dark:text-rose-300 font-semibold">{erro}</p>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 space-y-3">
            <Filter className="h-8 w-8 mx-auto text-slate-400" />
            <div className="space-y-1">
              <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Nenhuma exclusão ou revogação encontrada para os filtros selecionados.
              </p>
              <p className="text-xs text-slate-500">
                {filtros.fonte !== 'TODAS'
                  ? `Nenhum item com a fonte "${filtros.fonte}" combinada aos critérios de busca.`
                  : 'Tente buscar por outro termo ou limpar os filtros aplicados.'}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setFiltros(FILTROS_EXCLUSOES_INICIAIS)}
              className="text-xs text-rose-600 border-rose-200 hover:bg-rose-50"
            >
              Restaurar todas as exclusões ({itens.length})
            </Button>
          </div>
        ) : (
          <div className="relative pl-6 md:pl-8 space-y-6 before:absolute before:left-3 md:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {itensFiltrados.map((item, index) => {
              const isPrimeiroItem = index === 0

              return (
                <div key={item.id || index} className="relative group">
                  {/* Marcador na Linha do Tempo */}
                  <div
                    className={`absolute -left-6 md:-left-8 top-4 h-5 w-5 rounded-full border-2 border-white dark:border-slate-950 flex items-center justify-center transition-all ${
                      isPrimeiroItem
                        ? 'bg-rose-600 ring-4 ring-rose-100 dark:ring-rose-950 shadow-sm'
                        : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-rose-500'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>

                  {/* Cartão do Item de Exclusão */}
                  <Card
                    onClick={() => setExclusaoDetalhes(item)}
                    className={`cursor-pointer transition-all hover:shadow-md border ${
                      isPrimeiroItem
                        ? 'border-rose-300 dark:border-rose-800/80 bg-gradient-to-br from-rose-50/40 via-white to-slate-50/40 dark:from-rose-950/20 dark:via-slate-900 dark:to-slate-900/60'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Topo do Card com Data, Tipo e Selo de Confiança */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 flex items-center gap-1">
                            <Ban className="h-3 w-3" />
                            {item.norm_type || 'Exclusão Legislativa'}
                          </span>

                          <Badge variant="outline" className="text-[11px] font-medium">
                            {item.segment}
                          </Badge>

                          {item.revoked_article && (
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                              Artigo: {item.revoked_article}
                            </span>
                          )}

                          {isPrimeiroItem && (
                            <span className="text-[10px] font-semibold bg-rose-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Mais Recente no Acervo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {item.exclusion_date}
                          </div>

                          <SeloNivelConfianca
                            tier={item.confidence_tier}
                            fonte={item.source_org}
                            compacto
                          />
                        </div>
                      </div>

                      {/* Identificação da Norma */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between gap-4">
                          <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                            <span>{item.norm_code}</span>
                            {item.norm_number && (
                              <span className="text-xs font-normal text-slate-500">
                                (nº {item.norm_number})
                              </span>
                            )}
                          </h3>
                          <span className="text-xs text-rose-600 dark:text-rose-400 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Ver contexto <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {item.norm_title}
                        </p>
                      </div>

                      {/* Motivo e Fundamentação da Exclusão */}
                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-rose-50/50 dark:bg-rose-950/20 p-3 rounded-lg border border-rose-100 dark:border-rose-900/40">
                        <span className="font-semibold text-rose-900 dark:text-rose-300">
                          Motivo da Exclusão / Revogação:{' '}
                        </span>
                        {item.reason_description}
                      </div>

                      {/* Contexto do Antes: Redação Anterior Revogada (se houver) */}
                      {item.previous_content && (
                        <div className="p-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/40 text-xs">
                          <span className="font-bold text-[10px] block uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-0.5 flex items-center gap-1">
                            <FileX className="h-3 w-3 text-rose-500" />
                            Redação Anterior que foi retirada
                          </span>
                          <p className="line-clamp-2 text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                            {item.previous_content}
                          </p>
                        </div>
                      )}

                      {/* Metadados de Origem */}
                      <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                        <span>
                          Origem:{' '}
                          <span className="font-medium text-slate-700 dark:text-slate-300">
                            {item.record_origin === 'rotina_semanal'
                              ? 'Rotina Semanal Automática (Segunda-feira)'
                              : item.record_origin === 'backfill_inicial'
                                ? 'Carga Inicial Compilada'
                                : 'Registro Manual'}
                          </span>
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span>Fonte Primária: {item.source_org}</span>
                          <SeloNivelConfianca
                            tier={item.confidence_tier}
                            fonte={item.source_org}
                            compacto
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Exclusão */}
      <ModalDetalhesExclusao
        aberto={!!exclusaoDetalhes}
        exclusaoSelecionada={exclusaoDetalhes}
        aoFechar={() => setExclusaoDetalhes(null)}
      />

      {/* Modal de Criação Manual de Exclusão */}
      <ModalNovaExclusao
        aberto={modalNovoAberto}
        aoFechar={() => setModalNovoAberto(false)}
        aoSalvar={handleSalvarManual}
      />

      {/* Modal de Impressão / Exportação A4 */}
      {modalImprimirAberto && (
        <RelatorioExclusoesImprimivel
          itens={itensFiltrados}
          filtros={filtros}
          aoFechar={() => setModalImprimirAberto(false)}
        />
      )}
    </section>
  )
}
