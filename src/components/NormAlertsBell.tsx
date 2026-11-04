import React, { useState, useEffect, useRef, useMemo } from 'react'
import {
  Bell,
  Check,
  CheckCheck,
  Calendar,
  ExternalLink,
  ChevronRight,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  ArrowRight,
  ShieldCheck,
  X,
  Ban,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import type { NormAlertItem } from '@/types/panorama'
import {
  listarAlertasRevisoes,
  marcarAlertaComoLido,
  marcarTodosAlertasComoLidos,
} from '@/services/normAlerts'
import {
  fetchAlertasMercado,
  marcarAlertaMercadoLido,
  nomeIndiceAlerta,
  formatarDataAlerta,
  type AlertaMercado,
} from '@/services/alertasMercado'
import { TrendingUp, TrendingDown } from 'lucide-react'

export const NormAlertsBell: React.FC = () => {
  const [aberto, setAberto] = useState(false)
  const [alertas, setAlertas] = useState<NormAlertItem[]>([])
  const [alertasMercado, setAlertasMercado] = useState<AlertaMercado[]>([])
  const [avisoMercado, setAvisoMercado] = useState('')
  const [carregando, setCarregando] = useState(false)
  const [filtroAba, setFiltroAba] = useState<'todos' | 'nao_lidos' | 'mercado'>('todos')
  const popoverRef = useRef<HTMLDivElement>(null)

  const carregarAlertas = async () => {
    setCarregando(true)
    try {
      const lista = await listarAlertasRevisoes()
      setAlertas(lista)
    } catch (err) {
      console.warn('Erro ao carregar alertas:', err)
    }
    try {
      const resMercado = await fetchAlertasMercado()
      setAlertasMercado(resMercado.itens)
      setAvisoMercado(resMercado.erro ? resMercado.aviso : '')
    } catch {
      setAvisoMercado('Alertas de mercado indisponíveis neste momento.')
    } finally {
      setCarregando(false)
    }
  }

  useEffect(() => {
    carregarAlertas()

    // Ouve eventos de criação de alertas no mesmo navegador
    const handleAtualizacao = () => {
      carregarAlertas()
    }
    window.addEventListener('norm_alerts_updated', handleAtualizacao)

    // Intervalo de checagem periódica suave (5 minutos)
    const interval = setInterval(carregarAlertas, 5 * 60 * 1000)

    return () => {
      window.removeEventListener('norm_alerts_updated', handleAtualizacao)
      clearInterval(interval)
    }
  }, [])

  // Fechar ao clicar fora ou pressionar ESC
  useEffect(() => {
    if (!aberto) return

    const handleCliqueFora = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        setAberto(false)
      }
    }

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setAberto(false)
      }
    }

    document.addEventListener('mousedown', handleCliqueFora)
    document.addEventListener('keydown', handleEsc)
    return () => {
      document.removeEventListener('mousedown', handleCliqueFora)
      document.removeEventListener('keydown', handleEsc)
    }
  }, [aberto])

  const totalNaoLidos = useMemo(
    () => alertas.filter((a) => !a.is_read).length + alertasMercado.filter((a) => !a.isRead).length,
    [alertas, alertasMercado],
  )

  const alertasExibidos = useMemo(() => {
    if (filtroAba === 'nao_lidos') {
      return alertas.filter((a) => !a.is_read)
    }
    return alertas
  }, [alertas, filtroAba])

  const alertasMercadoExibidos = useMemo(() => {
    if (filtroAba === 'nao_lidos') {
      return alertasMercado.filter((a) => !a.isRead)
    }
    return alertasMercado
  }, [alertasMercado, filtroAba])

  const handleMarcarAlertaMercadoLido = async (alerta: AlertaMercado, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    setAlertasMercado((prev) => prev.map((a) => (a.id === alerta.id ? { ...a, isRead: true } : a)))
    await marcarAlertaMercadoLido(alerta.id)
  }

  const handleMarcarLido = async (alerta: NormAlertItem, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation()
    }
    // Otimista
    setAlertas((prev) => prev.map((a) => (a.id === alerta.id ? { ...a, is_read: true } : a)))
    await marcarAlertaComoLido(alerta.id)
  }

  const handleMarcarTodos = async () => {
    // Otimista
    setAlertas((prev) => prev.map((a) => ({ ...a, is_read: true })))
    await marcarTodosAlertasComoLidos(alertas)
  }

  const handleNavegarParaHistorico = (alerta?: NormAlertItem) => {
    if (alerta && !alerta.is_read) {
      handleMarcarLido(alerta)
    }
    setAberto(false)

    // Se o alerta for do tipo exclusão, leva para a seção dedicada de exclusões (#historico-exclusoes)
    const destino =
      alerta?.review_type === 'exclusao' ? '#historico-exclusoes' : '#historico-revisoes'
    if (window.location.hash === destino) {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      window.location.hash = destino
    }
  }

  return (
    <div className="relative inline-block" ref={popoverRef}>
      {/* Botão Bell com Badge de Contagem */}
      <button
        onClick={() => setAberto((prev) => !prev)}
        aria-label="Alertas de novas revisões de normas"
        title="Alertas de novas revisões de normas da Reforma Tributária"
        className={`relative inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-lg border transition-all cursor-pointer ${
          aberto
            ? 'bg-panorama-gold/20 border-panorama-gold text-panorama-navy'
            : totalNaoLidos > 0
              ? 'bg-amber-50/80 hover:bg-amber-100/80 border-amber-300 text-amber-900 shadow-xs'
              : 'bg-white hover:bg-slate-100 border-slate-200 text-slate-700'
        }`}
      >
        <Bell
          className={`h-4 w-4 ${totalNaoLidos > 0 ? 'text-amber-600 animate-pulse' : 'text-slate-600'}`}
        />

        {totalNaoLidos > 0 && (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-rose-600 px-1 text-[10px] font-black text-white shadow-md ring-2 ring-white animate-in zoom-in-75">
            {totalNaoLidos > 99 ? '99+' : totalNaoLidos}
          </span>
        )}
      </button>

      {/* Painel Popover de Alertas */}
      {aberto && (
        <div className="absolute right-0 top-full mt-2 w-[340px] sm:w-[420px] md:w-[460px] rounded-xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden flex flex-col max-h-[85vh] animate-in fade-in-50 slide-in-from-top-2">
          {/* Topo Institucional ADECONT */}
          <div className="bg-gradient-to-r from-panorama-navy to-slate-900 p-3.5 text-white flex items-center justify-between border-b border-panorama-gold/30">
            <div className="flex items-center gap-2.5">
              <div className="bg-white/95 rounded-md p-1">
                <AdecontLogo variant="color" className="h-6 w-auto" />
              </div>
              <div>
                <h4 className="text-xs font-bold leading-tight flex items-center gap-1.5 text-slate-100">
                  <span>Alertas</span>
                  {totalNaoLidos > 0 && (
                    <span className="bg-rose-500 text-white text-[10px] font-extrabold px-1.5 py-0.2 rounded-full">
                      {totalNaoLidos} novo{totalNaoLidos > 1 ? 's' : ''}
                    </span>
                  )}
                </h4>
                <p className="text-[10px] text-slate-300 leading-tight">
                  Normas da Reforma Tributária e mercado financeiro
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={carregarAlertas}
                title="Recarregar alertas"
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <RefreshCw className={`h-3.5 w-3.5 ${carregando ? 'animate-spin' : ''}`} />
              </button>
              <button
                onClick={() => setAberto(false)}
                title="Fechar painel"
                className="p-1 rounded text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Barra de Ações Rápidas & Filtros */}
          <div className="flex items-center justify-between px-3 py-2 bg-slate-50 border-b border-slate-200 text-xs">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setFiltroAba('todos')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  filtroAba === 'todos'
                    ? 'bg-panorama-navy text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Todos ({alertas.length})
              </button>
              <button
                onClick={() => setFiltroAba('nao_lidos')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer ${
                  filtroAba === 'nao_lidos'
                    ? 'bg-panorama-navy text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                Não Lidos ({totalNaoLidos})
              </button>
              <button
                onClick={() => setFiltroAba('mercado')}
                className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition-colors cursor-pointer flex items-center gap-1 ${
                  filtroAba === 'mercado'
                    ? 'bg-panorama-navy text-white shadow-xs'
                    : 'text-slate-600 hover:bg-slate-200/60'
                }`}
              >
                <TrendingUp className="h-3 w-3" />
                Mercado ({alertasMercado.length})
              </button>
            </div>

            {totalNaoLidos > 0 && (
              <button
                onClick={handleMarcarTodos}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-800 transition-colors cursor-pointer"
              >
                <CheckCheck className="h-3.5 w-3.5" />
                Marcar todos como lidos
              </button>
            )}
          </div>

          {/* Lista de Alertas com a Mais Recente no Topo */}
          <div className="overflow-y-auto flex-1 divide-y divide-slate-100 max-h-[380px] sm:max-h-[440px]">
            {filtroAba === 'mercado' ? (
              <>
                {avisoMercado && (
                  <p className="px-3 py-2 text-[11px] text-amber-800 bg-amber-50 border-b border-amber-200">
                    {avisoMercado}
                  </p>
                )}
                {alertasMercadoExibidos.length === 0 ? (
                  <div className="p-8 text-center text-slate-500 space-y-2">
                    <TrendingUp className="h-7 w-7 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">
                      Nenhum alerta de mercado registrado.
                    </p>
                    <p className="text-[11px] text-slate-400">
                      A rotina do backend monitora diariamente Ibovespa, IFIX e dólar (PTAX) e grava
                      alertas quando a variação diária supera os limites definidos.
                    </p>
                  </div>
                ) : (
                  alertasMercadoExibidos.map((alerta) => (
                    <div
                      key={alerta.id}
                      className={`p-3 sm:p-3.5 flex flex-col gap-2 border-l-4 ${
                        !alerta.isRead
                          ? 'bg-amber-50/40 border-l-amber-500'
                          : 'bg-white border-l-transparent opacity-85'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                              alerta.direcao === 'alta'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {alerta.direcao === 'alta' ? (
                              <TrendingUp className="h-2.5 w-2.5" />
                            ) : (
                              <TrendingDown className="h-2.5 w-2.5" />
                            )}
                            {alerta.direcao === 'alta' ? 'Alta' : 'Queda'}{' '}
                            {alerta.variacaoPct.toFixed(2)}%
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[10px] py-0 px-1.5 font-semibold text-slate-600 bg-white"
                          >
                            {nomeIndiceAlerta(alerta.indice)}
                          </Badge>
                          {!alerta.isRead && (
                            <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                          )}
                        </div>
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {formatarDataAlerta(alerta.alertDate)}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-700 bg-slate-50/80 p-2 rounded border border-slate-100">
                        {alerta.mensagem}
                      </p>
                      <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/80">
                        <span className="text-slate-500 font-medium flex items-center gap-1.5">
                          Fonte: {alerta.fonte}
                          <SeloNivelConfianca
                            tier="oficial_institucional"
                            fonte={alerta.fonte}
                            compacto
                          />
                        </span>
                        {!alerta.isRead ? (
                          <button
                            onClick={(e) => handleMarcarAlertaMercadoLido(alerta, e)}
                            className="inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-800 font-bold hover:underline p-1"
                            title="Marcar este alerta como lido"
                          >
                            <Check className="h-3 w-3" />
                            Lido
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Lido</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </>
            ) : alertasExibidos.length === 0 ? (
              <div className="p-8 text-center text-slate-500 space-y-2">
                <Bell className="h-7 w-7 text-slate-300 mx-auto" />
                <p className="text-xs font-semibold text-slate-700">
                  {filtroAba === 'nao_lidos'
                    ? 'Você leu todos os alertas!'
                    : 'Nenhum alerta registrado no momento.'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Novos alertas entram automaticamente pela rotina semanal ou registro de diretoria.
                </p>
              </div>
            ) : (
              alertasExibidos.map((alerta, index) => {
                const isPrimeiro = index === 0

                return (
                  <div
                    key={alerta.id || index}
                    onClick={() => handleNavegarParaHistorico(alerta)}
                    className={`p-3 sm:p-3.5 transition-colors cursor-pointer group flex flex-col gap-2 relative ${
                      !alerta.is_read
                        ? 'bg-amber-50/40 hover:bg-amber-50/80 border-l-4 border-l-amber-500'
                        : 'bg-white hover:bg-slate-50 border-l-4 border-l-transparent opacity-85 hover:opacity-100'
                    }`}
                  >
                    {/* Linha 1: Tipo de Revisão + Segmento + Data + Selo */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 ${
                            alerta.review_type === 'inclusao'
                              ? 'bg-emerald-100 text-emerald-800'
                              : alerta.review_type === 'alteracao'
                                ? 'bg-amber-100 text-amber-800'
                                : 'bg-rose-100 text-rose-800'
                          }`}
                        >
                          {alerta.review_type === 'exclusao' && (
                            <Ban className="h-2.5 w-2.5 text-rose-700" />
                          )}
                          {alerta.review_type === 'inclusao'
                            ? 'Inclusão'
                            : alerta.review_type === 'alteracao'
                              ? 'Alteração'
                              : 'Exclusão'}
                        </span>

                        <Badge
                          variant="outline"
                          className="text-[10px] py-0 px-1.5 font-semibold text-slate-600 bg-white"
                        >
                          {alerta.segment}
                        </Badge>

                        {!alerta.is_read && (
                          <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                        )}

                        {isPrimeiro && (
                          <span className="text-[9px] font-bold bg-emerald-600 text-white px-1.5 py-0.2 rounded-full flex items-center gap-0.5">
                            <Sparkles className="h-2.5 w-2.5" /> Mais recente
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold text-slate-500 flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-slate-400" />
                          {alerta.review_date}
                        </span>
                      </div>
                    </div>

                    {/* Linha 2: Código da Norma e Título */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h5 className="text-xs font-bold text-slate-900 group-hover:text-panorama-navy transition-colors">
                          {alerta.norm_code}
                          {alerta.norm_type && (
                            <span className="font-normal text-slate-500 text-[11px] ml-1.5">
                              ({alerta.norm_type})
                            </span>
                          )}
                        </h5>

                        <ChevronRight className="h-3.5 w-3.5 text-slate-400 group-hover:text-panorama-navy group-hover:translate-x-0.5 transition-all shrink-0 mt-0.5" />
                      </div>

                      {alerta.norm_title && alerta.norm_title !== alerta.norm_code && (
                        <p className="text-[11px] text-slate-600 line-clamp-1 mt-0.5">
                          {alerta.norm_title}
                        </p>
                      )}
                    </div>

                    {/* Linha 3: Resumo da alteração */}
                    <p className="text-[11px] text-slate-700 bg-slate-50/80 p-2 rounded border border-slate-100 line-clamp-2">
                      {alerta.summary_change}
                    </p>

                    {/* Linha 4: Fonte com Selo + Ação Marcar como Lido */}
                    <div className="flex items-center justify-between text-[10px] pt-1 border-t border-slate-100/80">
                      <div className="flex items-center gap-2 truncate max-w-[240px] sm:max-w-[300px]">
                        <span className="truncate text-slate-500 font-medium">
                          Fonte: {alerta.source_org}
                        </span>
                        <SeloNivelConfianca
                          tier={alerta.confidence_tier}
                          fonte={alerta.source_org}
                          compacto
                        />
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        {!alerta.is_read ? (
                          <button
                            onClick={(e) => handleMarcarLido(alerta, e)}
                            className="inline-flex items-center gap-0.5 text-emerald-700 hover:text-emerald-800 font-bold hover:underline p-1"
                            title="Marcar este alerta como lido"
                          >
                            <Check className="h-3 w-3" />
                            Lido
                          </button>
                        ) : (
                          <span className="text-slate-400 italic">Lido</span>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>

          {/* Rodapé do Painel com Link Direto para o Histórico */}
          <div className="p-2.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-2">
            <span className="text-[10px] text-slate-500 font-medium">
              Histórico completo: Seção Tributário
            </span>

            <Button
              size="sm"
              variant="default"
              onClick={() => handleNavegarParaHistorico()}
              className="text-xs h-7 px-3 bg-panorama-navy hover:bg-panorama-navy-light text-white font-semibold gap-1"
            >
              <span>Abrir Histórico Completo</span>
              <ArrowRight className="h-3 w-3" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
