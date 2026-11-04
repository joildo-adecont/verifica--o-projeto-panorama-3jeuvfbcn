/**
 * ABA — Estatísticas do portal de Indicadores Econômicos e Financeiros.
 *
 * Consome EXCLUSIVAMENTE `fetchFontesEstatisticas` (rota backend
 * /backend/v1/fontes-estatisticas — proxy IBGE SIDRA / Tesouro SICONFI /
 * IPEADATA). O navegador nunca fala direto com as fontes — padrão anti-bloqueio.
 *
 * Regras de resiliência: fonte viva falhou? o serviço devolve a base interna
 * com `fonteViva: false` — aqui exibimos o aviso transparente "base interna —
 * dado aproximado (fonte indisponível)", nunca erro cru.
 */
import { useEffect, useMemo, useState } from 'react'
import {
  BarChart3,
  ExternalLink,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Landmark,
} from 'lucide-react'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import {
  fetchFontesEstatisticas,
  FONTES_ESTATISTICAS_META,
  type FonteEstatistica,
  type FonteEstatisticaId,
  type RespostaFontesEstatisticas,
} from '@/services/indicadoresEconomicos'

const ICONE_POR_FONTE: Record<FonteEstatisticaId, typeof BarChart3> = {
  ibge: BarChart3,
  tesouro: Landmark,
  ipea: BarChart3,
}

const ROSTO_POR_FONTE: Record<FonteEstatisticaId, string> = {
  ibge: 'IPCA · PIB · desemprego (PNAD Contínua)',
  tesouro: 'SICONFI — contas públicas (RREO/RGF)',
  ipea: 'IGP-M · INPC · salário mínimo',
}

function formatarVariacao(v: number): string {
  if (v === 0) return '0'
  return (v > 0 ? '+' : '') + v.toLocaleString('pt-BR', { maximumFractionDigits: 2 })
}

function CartaoFonte({ fonte }: { fonte: FonteEstatistica }) {
  const Icone = ICONE_POR_FONTE[fonte.fonte] ?? BarChart3
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

export function AbaEstatisticas() {
  const [resposta, setResposta] = useState<RespostaFontesEstatisticas | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let montado = true
    fetchFontesEstatisticas('todas').then((res) => {
      if (!montado) return
      setResposta(res)
      setCarregando(false)
    })
    return () => {
      montado = false
    }
  }, [])

  const fontes = useMemo(() => resposta?.fontes ?? [], [resposta])
  const algumaViva = fontes.some((f) => f.fonteViva)

  if (carregando) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {Array.from({ length: 3 }).map((_, i) => (
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
            <strong>Aviso transparente:</strong> as fontes estatísticas oficiais estão indisponíveis
            agora — exibindo a base interna aproximada do sistema (não oficial, apenas referência).
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
          Nenhuma fonte estatística disponível no momento. Tente atualizar o portal.
        </div>
      )}
    </div>
  )
}
