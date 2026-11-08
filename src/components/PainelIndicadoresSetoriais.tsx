/**
 * PAINEL — INDICADORES ECONÔMICOS SETORIAIS (ADECONT)
 *
 * Padrão visual de PainelDadosMercado.tsx: cards por indicador agrupados por
 * setor (Agronegócio, Construção Civil, Comércio e Serviços, Crédito e Finanças),
 * valor atual destacado, unidade, data do dado, selo da fonte REAL (fonteRota),
 * semáforo semântico de variação e aviso transparente de contingência da base
 * interna quando a fonte viva falha. Tema claro/escuro e números monoespaçados.
 */

import React, { useMemo, useState } from 'react'
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Database,
  RefreshCw,
  Sprout,
  HardHat,
  ShoppingBag,
  Landmark,
  AlertTriangle,
  Activity,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { RelatorioIndicadoresSetoriaisA4 } from './RelatorioIndicadoresSetoriaisA4'
import { AdecontLogo } from './AdecontLogo'
import { BotaoExportacaoSetorial } from './BotaoExportacaoSetorial'
import {
  ROTULO_SETOR,
  ORDEM_SETOR,
  formatarValorSetorial,
  obterStatusSemaforoSetorial,
  type ItemIndicadorSetorial,
  type SetorIndicador,
} from '@/services/indicadoresSetoriais'

const GRUPOS_SETORIAIS: { setor: SetorIndicador; titulo: string }[] = ORDEM_SETOR.map((setor) => ({
  setor,
  titulo: ROTULO_SETOR[setor],
}))

interface PainelIndicadoresSetoriaisProps {
  indicadores: ItemIndicadorSetorial[]
  carregando?: boolean
  atualizadoEm?: string
  onRecarregar?: () => void
  clienteNome?: string
  clienteDoc?: string
}

const ICONES_SETOR: Record<SetorIndicador, React.ElementType> = {
  agronegocio: Sprout,
  construcao: HardHat,
  comercio_servicos: ShoppingBag,
  credito_financeiro: Landmark,
}

const CORES_SETOR: Record<SetorIndicador, { badge: string; icone: string; borda: string }> = {
  agronegocio: {
    badge: 'bg-lime-100 text-lime-800 dark:bg-lime-950/60 dark:text-lime-300',
    icone: 'text-lime-700 dark:text-lime-400',
    borda: 'border-l-lime-500',
  },
  construcao: {
    badge: 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300',
    icone: 'text-orange-700 dark:text-orange-400',
    borda: 'border-l-orange-500',
  },
  comercio_servicos: {
    badge: 'bg-sky-100 text-sky-800 dark:bg-sky-950/60 dark:text-sky-300',
    icone: 'text-sky-700 dark:text-sky-400',
    borda: 'border-l-sky-500',
  },
  credito_financeiro: {
    badge: 'bg-violet-100 text-violet-800 dark:bg-violet-950/60 dark:text-violet-300',
    icone: 'text-violet-700 dark:text-violet-400',
    borda: 'border-l-violet-500',
  },
}

export const PainelIndicadoresSetoriais: React.FC<PainelIndicadoresSetoriaisProps> = ({
  indicadores,
  carregando = false,
  atualizadoEm = '',
  onRecarregar,
  clienteNome,
  clienteDoc,
}) => {
  const [relatorioAberto, setRelatorioAberto] = useState(false)

  const grupos = useMemo(() => {
    return GRUPOS_SETORIAIS.map((g) => {
      const itens = indicadores.filter((i) => i.setor === g.setor)
      const comDado = itens.filter((i) => i.valorAtual !== null && i.valorAtual !== undefined)
      const contingencia = itens.filter((i) => i.baseInterna && i.valorAtual !== null)
      return { ...g, itens, totalComDado: comDado.length, totalContingencia: contingencia.length }
    }).filter((g) => g.itens.length > 0)
  }, [indicadores])

  const totalIndicadores = indicadores.length
  const totalComDado = indicadores.filter(
    (i) => i.valorAtual !== null && i.valorAtual !== undefined,
  ).length
  const totalContingencia = indicadores.filter((i) => i.baseInterna).length
  const temDados = totalComDado > 0

  const corSetaVariacao = (variacao: number | null): string => {
    const st = obterStatusSemaforoSetorial(variacao)
    if (st.tipo === 'alta') return 'text-emerald-600 dark:text-emerald-400'
    if (st.tipo === 'baixa') return 'text-rose-600 dark:text-rose-400'
    return 'text-slate-400'
  }

  const fundoSeloVariacao = (variacao: number | null): string => {
    const st = obterStatusSemaforoSetorial(variacao)
    if (st.tipo === 'alta')
      return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
    if (st.tipo === 'baixa')
      return 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
    return 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'
  }

  return (
    <section
      className="bg-white dark:bg-slate-900/95 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800 p-5 space-y-5"
      aria-label="Indicadores Econômicos Setoriais"
    >
      {/* Cabeçalho */}
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 dark:bg-emerald-950/60 rounded-lg">
              <Activity className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </span>
            <h3 className="text-sm font-black text-slate-900 dark:text-slate-100 uppercase tracking-wide">
              Indicadores Econômicos Setoriais
            </h3>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 max-w-2xl">
            Painel macrosetorial ADECONT: agronegócio, construção civil, comércio e serviços,
            crédito e finanças — com selo da fonte real (rota oficial ou base interna de
            contingência) e semáforo de variação.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-right mr-1 hidden sm:block">
            <span className="text-[9px] text-slate-400 uppercase font-bold block">
              Sincronizado
            </span>
            <span className="text-[11px] font-semibold text-slate-600 dark:text-slate-300">
              {atualizadoEm || '—'}
            </span>
          </div>
          {onRecarregar && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRecarregar}
              disabled={carregando}
              className="h-8 gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
            >
              <RefreshCw
                className={`w-3.5 h-3.5 ${carregando ? 'animate-spin' : ''} text-emerald-600 dark:text-emerald-400`}
              />
              Atualizar
            </Button>
          )}
          <BotaoExportacaoSetorial
            indicadores={indicadores}
            clienteNome={clienteNome}
            clienteDoc={clienteDoc}
            atualizadoEm={atualizadoEm}
            disabled={!temDados || carregando}
            motivoDesabilitado={
              carregando
                ? 'Aguarde o carregamento dos indicadores setoriais'
                : 'Nenhum indicador setorial carregado — clique em Atualizar'
            }
            onAbrirRelatorioPdf={() => setRelatorioAberto(true)}
          />
        </div>
      </div>

      {/* Aviso global de contingência */}
      {totalContingencia > 0 && temDados && (
        <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-lg p-2.5">
          <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <p className="text-[11px] text-amber-800 dark:text-amber-200">
            <span className="font-bold">
              {totalContingencia} indicador(es) exibindo dado(s) da base interna de contingência
            </span>{' '}
            — a fonte oficial remota está indisponível neste momento. Os valores permanecem
            disponíveis (nunca série vazia) e serão substituídos automaticamente quando a fonte viva
            responder.
          </p>
        </div>
      )}

      {/* Carregando */}
      {carregando && indicadores.length === 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, idx) => (
            <div
              key={idx}
              className="h-28 rounded-xl bg-slate-100 dark:bg-slate-800/70 animate-pulse"
            />
          ))}
        </div>
      )}

      {/* Vazio */}
      {!carregando && indicadores.length === 0 && (
        <div className="p-6 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl text-center space-y-1.5">
          <Database className="w-6 h-6 text-slate-400 mx-auto" />
          <p className="text-xs font-bold text-slate-600 dark:text-slate-300">
            Nenhum indicador setorial carregado
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Clique em &quot;Atualizar&quot; para buscar as séries nas fontes oficiais (com
            contingência na base interna).
          </p>
        </div>
      )}

      {/* Cards agrupados por setor */}
      {grupos.map((grupo) => {
        const IconeSetor = ICONES_SETOR[grupo.setor] || TrendingUp
        const coresSetor = CORES_SETOR[grupo.setor]
        return (
          <div key={grupo.setor} className="space-y-2.5">
            <div className="flex items-center gap-2">
              <span
                className={`p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 ${coresSetor.icone}`}
              >
                <IconeSetor className="w-4 h-4" />
              </span>
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                {grupo.titulo}
              </h4>
              <span
                className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${coresSetor.badge}`}
              >
                {grupo.totalComDado}/{grupo.itens.length} com dado
              </span>
              {grupo.totalContingencia > 0 && (
                <span className="text-[10px] font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
                  <Database className="w-3 h-3" />
                  {grupo.totalContingencia} contingência
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
              {grupo.itens.map((ind) => {
                const valorFmt = formatarValorSetorial(
                  ind.valorAtual,
                  ind.formato,
                  ind.casasDecimais,
                )
                const st = obterStatusSemaforoSetorial(ind.variacao)
                const Seta =
                  st.tipo === 'alta' ? TrendingUp : st.tipo === 'baixa' ? TrendingDown : Minus
                const corSelo = ind.baseInterna
                  ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                  : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'

                return (
                  <div
                    key={ind.chave}
                    className={`rounded-xl border border-slate-200 dark:border-slate-800 border-l-4 ${coresSetor.borda} p-3.5 space-y-2 bg-slate-50/40 dark:bg-slate-900 hover:shadow-md transition-shadow`}
                  >
                    {/* Nome + selo de variação */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[11px] font-bold text-slate-700 dark:text-slate-300 leading-tight">
                          {ind.nome}
                        </p>
                        <p className="text-[9px] uppercase tracking-wider text-slate-400 font-semibold">
                          {ind.codigoCurto}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${fundoSeloVariacao(ind.variacao)}`}
                        title={st.statusTexto}
                      >
                        <Seta className="w-3.5 h-3.5" />
                      </span>
                    </div>

                    {/* Valor atual monoespaçado */}
                    <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black font-mono text-slate-900 dark:text-slate-100 tracking-tight tabular-nums">
                        {valorFmt}
                      </span>
                      <span className="text-[10px] text-slate-500 dark:text-slate-400 font-semibold">
                        {ind.unidade}
                      </span>
                    </div>

                    {/* Variação textual */}
                    <p
                      className={`text-[11px] font-semibold font-mono tabular-nums ${corSetaVariacao(ind.variacao)}`}
                    >
                      {ind.variacao === null
                        ? 'Variação N/D'
                        : `${ind.variacao >= 0 ? '+' : ''}${ind.variacao.toLocaleString('pt-BR', {
                            minimumFractionDigits: ind.casasDecimais > 2 ? 4 : 2,
                            maximumFractionDigits: ind.casasDecimais > 2 ? 4 : 2,
                          })} vs. período anterior`}
                    </p>

                    {/* Data + fonte real */}
                    <div className="flex items-center justify-between gap-1.5 pt-1.5 border-t border-slate-200/70 dark:border-slate-800/70">
                      <span className="text-[9px] text-slate-500 dark:text-slate-400 font-medium">
                        {ind.periodoFormatado || ind.dataReferencia || '—'}
                      </span>
                      <span
                        className={`text-[8.5px] font-bold px-1.5 py-0.5 rounded border max-w-[130px] truncate ${corSelo}`}
                        title={ind.fonteRota || ind.fonte || 'Fonte N/D'}
                      >
                        {ind.fonteRota || ind.fonte || 'Fonte N/D'}
                      </span>
                    </div>

                    {/* Aviso de contingência no card */}
                    {ind.baseInterna && (ind.aviso || ind.fonteRota) && (
                      <div className="flex items-start gap-1 bg-amber-50 dark:bg-amber-950/40 border border-amber-200/70 dark:border-amber-900/60 rounded px-1.5 py-1">
                        <AlertTriangle className="w-2.5 h-2.5 text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[9px] text-amber-800 dark:text-amber-300 leading-snug">
                          {ind.aviso ||
                            'Dado proveniente da base interna ADECONT (fonte viva indisponível).'}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {/* Rodapé */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-200 dark:border-slate-800 text-[10px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <AdecontLogo className="h-4 w-auto" />
          <span className="font-semibold">ADECONT — Assessoria Contábil e Administrativa</span>
        </div>
        <span>
          {totalComDado}/{totalIndicadores} indicadores com dado · {grupos.length} setores · Fontes
          oficiais com contingência interna
        </span>
      </div>

      {/* Relatório A4 */}
      <RelatorioIndicadoresSetoriaisA4
        open={relatorioAberto}
        onClose={() => setRelatorioAberto(false)}
        indicadores={indicadores}
        clienteNome={clienteNome}
        clienteDoc={clienteDoc}
        atualizadoEm={atualizadoEm}
      />
    </section>
  )
}

export default PainelIndicadoresSetoriais
