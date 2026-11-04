/**
 * ABA — Mercado Financeiro do portal de Indicadores Econômicos e Financeiros.
 *
 * Consome EXCLUSIVAMENTE `fetchFontesEstatisticas('b3_mercado')` (rota backend
 * /backend/v1/fontes-estatisticas — proxy BCB SGS 7 / IPEADATA). O navegador
 * nunca fala direto com as fontes — padrão anti-bloqueio do projeto.
 *
 * Regras de resiliência: fonte viva falhou? o serviço devolve a base interna
 * com `fonteViva: false` — aqui exibimos o aviso transparente "base interna —
 * dado aproximado (fonte indisponível)", nunca erro cru.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  TrendingUp,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Building2,
  Newspaper,
  RefreshCw,
  ShieldCheck,
} from 'lucide-react'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  fetchNoticiasFinanceiras,
  type NoticiaFinanceira,
  type RespostaNoticias,
} from '@/services/noticiasFinanceiras'
import {
  fetchFontesEstatisticas,
  FONTES_ESTATISTICAS_META,
  type FonteEstatistica,
  type FonteEstatisticaId,
  type RespostaFontesEstatisticas,
} from '@/services/indicadoresEconomicos'

const ICONE_POR_FONTE: Record<string, typeof TrendingUp> = {
  b3_mercado: TrendingUp,
  ibovespa: TrendingUp,
  ifix: Building2,
}

const ROSTO_POR_FONTE: Record<string, string> = {
  b3_mercado:
    'B3 — Ibovespa (bolsa de valores) · IFIX (fundos imobiliários) — índices de mercado financeiro',
}

function formatarVariacao(v: number): string {
  if (v === 0) return '0'
  return (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function CartaoFonte({ fonte }: { fonte: FonteEstatistica }) {
  const Icone = ICONE_POR_FONTE[fonte.fonte] ?? TrendingUp
  const meta = FONTES_ESTATISTICAS_META[fonte.fonte]
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3 hover:border-panorama-gold transition-colors">
      {/* Cabeçalho do cartão: ícone, nome da fonte e selo oficial institucional */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-panorama-navy text-panorama-gold-light shrink-0">
            <Icone className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-slate-900 leading-snug">{fonte.fonteNome}</h4>
            <p className="text-[10.5px] text-slate-500 leading-snug">
              {ROSTO_POR_FONTE[fonte.fonte]}
            </p>
          </div>
        </div>
        <SeloNivelConfianca tier="oficial_institucional" compacto />
      </div>

      {/* Aviso transparente quando a fonte viva está indisponível */}
      {!fonte.fonteViva && (
        <div className="flex items-start gap-2 p-2.5 rounded-lg bg-amber-50 border border-amber-300 text-amber-900">
          <p className="text-[11px] leading-relaxed">
            <strong>Base interna — dado aproximado (fonte indisponível).</strong>
            {fonte.aviso ? ` ${fonte.aviso}` : ''}
          </p>
        </div>
      )}

      {/* Indicadores da fonte */}
      <div className="space-y-2">
        {fonte.indicadores.length === 0 ? (
          <p className="text-xs text-slate-500 rounded-lg bg-slate-50 p-2.5">
            Nenhum indicador disponível desta fonte no momento.
          </p>
        ) : (
          fonte.indicadores.map((ind) => {
            const sobe = ind.variacao > 0
            const desce = ind.variacao < 0
            const corSeta = sobe ? 'text-rose-600' : desce ? 'text-emerald-600' : 'text-slate-400'
            const IconeSeta = sobe ? ArrowUpRight : desce ? ArrowDownRight : Minus
            return (
              <div
                key={ind.chave || ind.nome}
                className="rounded-xl border border-slate-200 bg-slate-50/60 p-2.5 space-y-1"
              >
                <div className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 leading-snug">{ind.nome}</span>
                  <span
                    className={`inline-flex items-center gap-0.5 text-[10.5px] font-bold shrink-0 ${corSeta}`}
                  >
                    <IconeSeta className="w-3 h-3" />
                    {formatarVariacao(ind.variacao)}
                  </span>
                </div>
                <div className="flex items-baseline gap-1.5 flex-wrap">
                  <span className="text-lg font-black text-panorama-navy tabular-nums">
                    {ind.valor.toLocaleString('pt-BR', { maximumFractionDigits: 4 })}
                  </span>
                  <span className="text-[11px] font-semibold text-slate-500">{ind.unidade}</span>
                  <span className="text-[10px] text-slate-400 ml-auto">Período: {ind.periodo}</span>
                </div>
                {ind.nota && (
                  <p className="text-[10.5px] text-slate-500 leading-snug">{ind.nota}</p>
                )}
              </div>
            )
          })
        )}
      </div>

      {/* Rodapé do cartão: atualização e link oficial */}
      <div className="flex items-center justify-between gap-2 border-t border-slate-100 pt-2 text-[10.5px] text-slate-400">
        <span>Atualizado: {formatarDataSeguro(fonte.atualizadoEm)}</span>
        {meta && (
          <a
            href={meta.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 font-bold text-panorama-navy hover:underline"
          >
            Fonte oficial
            <ExternalLink className="w-3 h-3" />
          </a>
        )}
      </div>
    </div>
  )
}

function formatarDataSeguro(iso: string): string {
  if (!iso) return '—'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('pt-BR')
}

function BlocoNoticias() {
  const [noticias, setNoticias] = useState<RespostaNoticias | null>(null)
  const [carregandoNoticias, setCarregandoNoticias] = useState(true)

  useEffect(() => {
    let montado = true
    fetchNoticiasFinanceiras().then((res) => {
      if (!montado) return
      setNoticias(res)
      setCarregandoNoticias(false)
    })
    return () => {
      montado = false
    }
  }, [])

  const atualizar = () => {
    setCarregandoNoticias(true)
    fetchNoticiasFinanceiras().then((res) => {
      setNoticias(res)
      setCarregandoNoticias(false)
    })
  }

  return (
    <section className="p-4 rounded-2xl border border-slate-200 bg-white space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-panorama-navy text-panorama-gold-light shrink-0">
            <Newspaper className="w-4 h-4" />
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-black text-slate-900 leading-snug">
              Notícias financeiras — Banco Central do Brasil
            </h3>
            <p className="text-[10.5px] text-slate-500">
              Agência de Notícias do BCB — via proxy do backend (RSS oficial, cache próprio).
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <SeloNivelConfianca tier="oficial_institucional" compacto />
          <button
            type="button"
            onClick={atualizar}
            title="Atualizar notícias"
            className="p-1.5 rounded-lg text-slate-400 hover:text-panorama-gold hover:bg-slate-100 cursor-pointer"
          >
            <RefreshCw className={'w-3.5 h-3.5 ' + (carregandoNoticias ? 'animate-spin' : '')} />
          </button>
        </div>
      </div>

      {carregandoNoticias ? (
        <div className="space-y-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-12 rounded-xl bg-slate-100 animate-pulse" />
          ))}
        </div>
      ) : noticias && noticias.itens.length > 0 ? (
        <ul className="space-y-2">
          {noticias.itens.slice(0, 8).map((n: NoticiaFinanceira) => (
            <li key={n.guid}>
              <a
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block p-2.5 rounded-xl border border-slate-200 bg-slate-50/60 hover:border-panorama-gold hover:bg-slate-50 transition-colors group"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="text-xs font-bold text-slate-800 leading-snug">{n.titulo}</span>
                  <ExternalLink className="w-3 h-3 text-slate-400 group-hover:text-panorama-gold shrink-0 mt-0.5" />
                </span>
                {n.resumo && (
                  <span className="block text-[10.5px] text-slate-500 mt-0.5 line-clamp-2">
                    {n.resumo}
                  </span>
                )}
                <span className="flex items-center gap-1.5 mt-1">
                  <span className="text-[9.5px] px-1.5 py-0.5 rounded bg-slate-200 text-[9.5px] font-bold text-slate-600">
                    fonte oficial institucional
                  </span>
                  {n.publicadoEm && (
                    <span className="text-[10px] text-slate-400">
                      {formatarDataSeguro(n.publicadoEm)}
                    </span>
                  )}
                </span>
              </a>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-xs text-amber-800 bg-amber-50 border border-amber-300 rounded-lg p-2.5">
          {noticias?.aviso ||
            'Notícias financeiras indisponíveis neste momento — tente atualizar o portal mais tarde.'}
        </p>
      )}

      {noticias && noticias.aviso && noticias.itens.length > 0 && (
        <p className="text-[10.5px] text-amber-700 flex items-start gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 shrink-0 mt-0.5" />
          {noticias.aviso}
        </p>
      )}
    </section>
  )
}

export function AbaMercadoFinanceiro() {
  const [resposta, setResposta] = useState<RespostaFontesEstatisticas | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let montado = true
    fetchFontesEstatisticas('b3_mercado').then((res) => {
      if (!montado) return
      setResposta(res)
      setCarregando(false)
    })
    return () => {
      montado = false
    }
  }, [])

  const fontes = useMemo(
    () => (resposta?.fontes ?? []).filter((f) => f.fonte === 'b3_mercado'),
    [resposta],
  )
  const algumaViva = fontes.some((f) => f.fonteViva)

  if (carregando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="h-64 rounded-2xl bg-slate-100 animate-pulse" />
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {!algumaViva && fontes.length > 0 && (
        <div className="flex items-start gap-2 p-3 rounded-xl bg-amber-50 border border-amber-300 text-amber-900">
          <p className="text-xs leading-relaxed">
            <strong>Aviso transparente:</strong> a fonte de mercado financeiro (B3/BCB/IPEA) está
            indisponível agora — exibindo a base interna aproximada do sistema (não oficial, apenas
            referência).
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {fontes.map((f) => (
          <CartaoFonte key={f.fonte} fonte={f} />
        ))}
      </div>

      {fontes.length === 0 && (
        <div className="p-8 rounded-2xl border-2 border-dashed border-slate-300 bg-white text-center text-sm text-slate-500">
          Nenhum índice de mercado financeiro disponível no momento. Tente atualizar o portal.
        </div>
      )}

      {/* Bloco de notícias financeiras — RSS oficial do Banco Central */}
      <BlocoNoticias />
    </div>
  )
}
