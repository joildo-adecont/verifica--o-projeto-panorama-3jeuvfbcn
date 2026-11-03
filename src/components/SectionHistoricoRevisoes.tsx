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
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  History,
  Search,
  Filter,
  PlusCircle,
  Printer,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  FileText,
  AlertCircle,
} from 'lucide-react'
import type {
  NormReviewHistoryItem,
  CreateNormReviewInput,
  ConfidenceTier,
  ReviewType,
  NormSegment,
} from '@/types/panorama'
import {
  listarHistoricoRevisoes,
  filtrarHistoricoRevisoes,
  criarRegistroRevisaoManual,
  FILTROS_HISTORICO_INICIAIS,
  type FiltrosHistoricoNormas,
} from '@/services/normReviewsHistory'
import { ModalDetalhesNorma } from '@/components/ModalDetalhesNorma'
import { ModalNovaRevisao } from '@/components/ModalNovaRevisao'
import { RelatorioRevisoesImprimivel } from '@/components/RelatorioRevisoesImprimivel'

export const SectionHistoricoRevisoes: React.FC = () => {
  const [itens, setItens] = useState<NormReviewHistoryItem[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const [filtros, setFiltros] = useState<FiltrosHistoricoNormas>(FILTROS_HISTORICO_INICIAIS)
  const [normaDetalhes, setNormaDetalhes] = useState<NormReviewHistoryItem | null>(null)
  const [modalNovoAberto, setModalNovoAberto] = useState(false)
  const [modalImprimirAberto, setModalImprimirAberto] = useState(false)

  const carregarDados = async () => {
    setCarregando(true)
    setErro(null)
    try {
      const lista = await listarHistoricoRevisoes()
      setItens(lista)
    } catch (err) {
      console.error('Erro ao listar revisões:', err)
      setErro('Não foi possível carregar as revisões da base. Exibindo acervo disponível.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarDados()
  }, [])

  const itensFiltrados = useMemo(() => {
    return filtrarHistoricoRevisoes(itens, filtros)
  }, [itens, filtros])

  const handleSalvarManual = async (dados: CreateNormReviewInput) => {
    const novo = await criarRegistroRevisaoManual(dados)
    setItens((prev) => [novo, ...prev])
  }

  // Estatísticas rápidas
  const totalInclusoes = useMemo(
    () => itens.filter((i) => i.review_type === 'inclusao').length,
    [itens],
  )
  const totalAlteracoes = useMemo(
    () => itens.filter((i) => i.review_type === 'alteracao').length,
    [itens],
  )
  const totalExclusoes = useMemo(
    () => itens.filter((i) => i.review_type === 'exclusao').length,
    [itens],
  )

  return (
    <section id="historico-revisoes" className="w-full py-8 space-y-6">
      {/* Cabeçalho da Seção com Logo ADECONT */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <AdecontLogo variant="color" className="h-10 w-auto" />
            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 flex items-center gap-1.5">
              <History className="h-3.5 w-3.5" />
              Histórico Oficial de Normas
            </span>
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-100">
            Histórico de Revisões de Normas da Reforma Tributária
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl">
            Rastreamento cronológico de todas as alterações, inclusões e exclusões legislativas
            (Resoluções CGIBS, Leis Complementares, Decretos, Instruções Normativas RFB, Portarias e
            Atos). Alimentado automaticamente pela rotina semanal de segunda-feira e por registros
            da diretoria.
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
            <Printer className="h-3.5 w-3.5 text-emerald-600" />
            Relatório A4 / Imprimir
          </Button>

          <Button
            size="sm"
            onClick={() => setModalNovoAberto(true)}
            className="gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            Registrar Revisão
          </Button>
        </div>
      </div>

      {/* Cartões de Indicadores Rápidos */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="bg-slate-50/70 dark:bg-slate-900/40 border-slate-200 dark:border-slate-800">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-slate-500">Total de Eventos</div>
            <div className="text-2xl font-bold text-slate-900 dark:text-slate-100 mt-1">
              {itens.length}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" /> Mais recente no topo
            </div>
          </CardContent>
        </Card>

        <Card className="bg-emerald-50/50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-emerald-700 dark:text-emerald-400">
              Inclusões Normativas
            </div>
            <div className="text-2xl font-bold text-emerald-900 dark:text-emerald-200 mt-1">
              {totalInclusoes}
            </div>
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 mt-1">
              Novas normas incorporadas
            </div>
          </CardContent>
        </Card>

        <Card className="bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-amber-700 dark:text-amber-400">
              Alterações Legislativas
            </div>
            <div className="text-2xl font-bold text-amber-900 dark:text-amber-200 mt-1">
              {totalAlteracoes}
            </div>
            <div className="text-[11px] text-amber-600 dark:text-amber-400 mt-1">
              Prazos e textos revisados
            </div>
          </CardContent>
        </Card>

        <Card className="bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/60">
          <CardContent className="p-4">
            <div className="text-xs uppercase font-medium text-rose-700 dark:text-rose-400">
              Exclusões / Revogações
            </div>
            <div className="text-2xl font-bold text-rose-900 dark:text-rose-200 mt-1">
              {totalExclusoes}
            </div>
            <div className="text-[11px] text-rose-600 dark:text-rose-400 mt-1">
              Dispositivos revogados
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Barra de Filtros e Busca */}
      <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            {/* Campo de Busca */}
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar por número, código ou palavra..."
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

            {/* Filtro por Tipo de Revisão */}
            <div>
              <Select
                value={filtros.tipoRevisao}
                onValueChange={(val) =>
                  setFiltros((prev) => ({ ...prev, tipoRevisao: val as 'TODOS' | ReviewType }))
                }
              >
                <SelectTrigger className="text-xs">
                  <SelectValue placeholder="Tipo de Revisão" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="TODOS">Todas as Revisões</SelectItem>
                  <SelectItem value="alteracao">Alteração Legislativa</SelectItem>
                  <SelectItem value="inclusao">Inclusão Normativa</SelectItem>
                  <SelectItem value="exclusao">Exclusão / Revogação</SelectItem>
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

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>
              Exibindo <strong>{itensFiltrados.length}</strong> de <strong>{itens.length}</strong>{' '}
              revisões registradas
            </span>
            {(filtros.busca ||
              filtros.segmento !== 'TODOS' ||
              filtros.tipoRevisao !== 'TODOS' ||
              filtros.periodo !== 'todos') && (
              <button
                type="button"
                onClick={() => setFiltros(FILTROS_HISTORICO_INICIAIS)}
                className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
              >
                Limpar todos os filtros
              </button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Linha do Tempo Cronológica com a Mais Recente no Topo */}
      <div className="space-y-4">
        {carregando ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center justify-center gap-3">
            <RefreshCw className="h-6 w-6 animate-spin text-emerald-600" />
            <p className="text-sm">Carregando histórico cronológico de revisões...</p>
          </div>
        ) : erro && itensFiltrados.length === 0 ? (
          <div className="p-8 text-center bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-xl space-y-2">
            <AlertCircle className="h-6 w-6 text-rose-600 mx-auto" />
            <p className="text-sm text-rose-800 dark:text-rose-300 font-semibold">{erro}</p>
          </div>
        ) : itensFiltrados.length === 0 ? (
          <div className="p-12 text-center bg-slate-50 dark:bg-slate-900/30 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 space-y-2">
            <Filter className="h-6 w-6 mx-auto text-slate-400" />
            <p className="text-sm font-semibold">
              Nenhuma revisão encontrada para os filtros selecionados.
            </p>
            <p className="text-xs text-slate-400">
              Tente buscar por outro termo ou remover os filtros aplicados.
            </p>
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
                        ? 'bg-emerald-600 ring-4 ring-emerald-100 dark:ring-emerald-950 shadow-sm'
                        : 'bg-slate-400 dark:bg-slate-600 group-hover:bg-emerald-500'
                    }`}
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-white" />
                  </div>

                  {/* Cartão do Item de Revisão */}
                  <Card
                    onClick={() => setNormaDetalhes(item)}
                    className={`cursor-pointer transition-all hover:shadow-md border ${
                      isPrimeiroItem
                        ? 'border-emerald-300 dark:border-emerald-800/80 bg-gradient-to-br from-emerald-50/40 via-white to-slate-50/40 dark:from-emerald-950/20 dark:via-slate-900 dark:to-slate-900/60'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/70 hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <CardContent className="p-5 space-y-4">
                      {/* Topo do Card com Data, Tipo e Selo de Confiança */}
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800/60 pb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`text-[11px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full ${
                              item.review_type === 'inclusao'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : item.review_type === 'alteracao'
                                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                  : 'bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300'
                            }`}
                          >
                            {item.review_type === 'inclusao'
                              ? 'Inclusão Normativa'
                              : item.review_type === 'alteracao'
                                ? 'Alteração Legislativa'
                                : 'Exclusão / Revogação'}
                          </span>

                          <Badge variant="outline" className="text-[11px] font-medium">
                            {item.segment}
                          </Badge>

                          {isPrimeiroItem && (
                            <span className="text-[10px] font-semibold bg-emerald-600 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Sparkles className="h-3 w-3" /> Mais Recente no Acervo
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400 font-semibold">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {item.review_date}
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
                            <span className="text-xs font-normal text-slate-500">
                              ({item.norm_type})
                            </span>
                          </h3>
                          <span className="text-xs text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                            Ver evolução <ArrowRight className="h-3 w-3" />
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 font-medium">
                          {item.norm_title}
                        </p>
                      </div>

                      {/* Resumo da Alteração */}
                      <div className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/40 p-3 rounded-lg border border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">
                          Resumo da Revisão:{' '}
                        </span>
                        {item.summary_change}
                      </div>

                      {/* Comparativo de Versão Anterior e Atual */}
                      {(item.previous_version || item.current_version) && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                          {item.previous_version && (
                            <div className="p-2.5 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-950 dark:text-rose-200">
                              <span className="font-bold text-[10px] block uppercase tracking-wider text-rose-700 dark:text-rose-400 mb-0.5">
                                Versão Anterior
                              </span>
                              <p className="line-clamp-2 text-[11px]">{item.previous_version}</p>
                            </div>
                          )}

                          {item.current_version && (
                            <div
                              className={`p-2.5 rounded-lg border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-950 dark:text-emerald-200 ${
                                !item.previous_version ? 'md:col-span-2' : ''
                              }`}
                            >
                              <span className="font-bold text-[10px] block uppercase tracking-wider text-emerald-700 dark:text-emerald-400 mb-0.5">
                                Versão Atual / Vigente
                              </span>
                              <p className="line-clamp-2 text-[11px]">{item.current_version}</p>
                            </div>
                          )}
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
                        <span>Fonte: {item.source_org}</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal de Detalhes da Norma e Todas as suas Revisões */}
      <ModalDetalhesNorma
        aberto={!!normaDetalhes}
        normaSelecionada={normaDetalhes}
        todasRevisoes={itens}
        aoFechar={() => setNormaDetalhes(null)}
      />

      {/* Modal de Criação Manual de Revisão */}
      <ModalNovaRevisao
        aberto={modalNovoAberto}
        aoFechar={() => setModalNovoAberto(false)}
        aoSalvar={handleSalvarManual}
      />

      {/* Modal de Impressão / Exportação A4 */}
      {modalImprimirAberto && (
        <RelatorioRevisoesImprimivel
          itens={itensFiltrados}
          filtros={filtros}
          aoFechar={() => setModalImprimirAberto(false)}
        />
      )}
    </section>
  )
}
