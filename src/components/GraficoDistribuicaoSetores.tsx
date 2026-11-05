/**
 * GRÁFICO DE PIZZA — Distribuição por Setor do portal de Indicadores
 * Econômicos e Financeiros.
 *
 * Cada fatia = setor temático; tamanho = quantidade de indicadores daquele
 * setor no catálogo (contagem local, do catálogo estático do frontend — o
 * gráfico renderiza mesmo sem rede/backend).
 *
 * Interação: hover/touch destaca a fatia e mostra tooltip com a lista dos
 * indicadores do setor; clicar abre o histórico do indicador representativo
 * do setor (mesmo fluxo do buscador nativo → aba Histórico).
 *
 * Recharts (mesma biblioteca dos demais gráficos do portal) + logo ADECONT.
 */
import { useMemo, useState } from 'react'
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts'
import { PieChart as IconePizza } from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import { distribuicaoPorSetor, type SetorDistribuicao } from '@/services/distribuicaoSetores'
import type { ChaveSerieHistorica } from '@/services/seriesHistoricas'

interface PropsGraficoSetores {
  /** Chamado ao clicar numa fatia: abre o histórico do indicador representativo. */
  onAbrirIndicador: (chave: ChaveSerieHistorica) => void
}

function pct(v: number): string {
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 1 })
}

export function GraficoDistribuicaoSetores({ onAbrirIndicador }: PropsGraficoSetores) {
  const fatias = useMemo(() => distribuicaoPorSetor(), [])
  const [destacada, setDestacada] = useState<number | null>(null)

  const ativa = destacada !== null ? fatias[destacada] : undefined
  const total = useMemo(() => fatias.reduce((s, f) => s + f.quantidade, 0), [fatias])

  if (fatias.length === 0) {
    return (
      <div className="p-4 rounded-2xl border border-slate-200 bg-white text-sm text-slate-500">
        Nenhum indicador catalogado para distribuir por setor.
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-3">
      {/* Cabeçalho do card, padrão dos demais do portal */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <IconePizza className="w-4 h-4 text-panorama-gold-dark" />
            Distribuição por Setor
          </h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            {total} indicadores do catálogo agrupados em {fatias.length} setores temáticos — passe o
            mouse (ou toque) numa fatia para ver os índices do setor; clique para abrir o histórico
            do setor.
          </p>
        </div>
        <AdecontLogo variant="color" className="h-8 w-auto shrink-0 self-start sm:self-center" />
      </div>

      {/* Pizza + legenda */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] gap-4 items-center">
        <div className="h-[280px] w-full" data-testid="grafico-distribuicao-setores">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={fatias}
                dataKey="quantidade"
                nameKey="setor"
                cx="50%"
                cy="50%"
                innerRadius={58}
                outerRadius={110}
                paddingAngle={2}
                stroke="none"
                isAnimationActive={false}
                onClick={(_: unknown, i: number) => {
                  const f = fatias[i]
                  if (f) onAbrirIndicador(f.representante)
                }}
                onMouseEnter={(_: unknown, i: number) => setDestacada(i)}
                onMouseLeave={() => setDestacada(null)}
              >
                {fatias.map((f, i) => (
                  <Cell
                    key={f.setor}
                    fill={f.cor}
                    opacity={destacada === null || destacada === i ? 1 : 0.35}
                    className="cursor-pointer transition-opacity"
                  />
                ))}
              </Pie>
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || payload.length === 0) return null
                  const f = payload[0].payload as SetorDistribuicao
                  return (
                    <div className="max-w-[260px] p-3 rounded-xl bg-slate-900 border border-slate-600 shadow-lg">
                      <p className="text-xs font-black text-white">
                        {f.setor} — {f.quantidade} índice(s) ({pct(f.percentual)}%)
                      </p>
                      <ul className="mt-1.5 space-y-0.5">
                        {f.indicadores.map((ind) => (
                          <li
                            key={ind.chave}
                            className="text-[10.5px] leading-snug text-slate-200 flex items-center gap-1"
                          >
                            <span
                              className="w-1.5 h-1.5 rounded-full shrink-0"
                              style={{ backgroundColor: f.cor }}
                            />
                            {ind.nome}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda ao lado — também destaca e clica */}
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 self-center">
          {fatias.map((f, i) => (
            <li key={f.setor}>
              <button
                type="button"
                onMouseEnter={() => setDestacada(i)}
                onMouseLeave={() => setDestacada(null)}
                onClick={() => onAbrirIndicador(f.representante)}
                title={`Abrir histórico de ${f.setor}`}
                className={`w-full text-left flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-all cursor-pointer ${
                  destacada === i
                    ? 'border-panorama-gold bg-amber-50 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 hover:border-panorama-gold'
                }`}
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0 border border-white/70 shadow-xs"
                  style={{ backgroundColor: f.cor }}
                />
                <span className="min-w-0">
                  <span className="block text-[11.5px] font-bold text-slate-800 truncate">
                    {f.setor}
                  </span>
                  <span className="block text-[10px] text-slate-500 tabular-nums">
                    {f.quantidade} índice(s) · {pct(f.percentual)}%
                  </span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {/* Rodapé: setor em destaque + selo oficial */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-2">
        <p className="text-[10.5px] text-slate-500">
          {ativa ? (
            <>
              Em destaque:{' '}
              <span className="font-bold" style={{ color: ativa.cor }}>
                {ativa.setor}
              </span>{' '}
              — {ativa.quantidade} índice(s), {pct(ativa.percentual)}% do catálogo.
            </>
          ) : (
            'Distribuição calculada do catálogo local do sistema — não depende de rede.'
          )}
        </p>
        <SeloNivelConfianca tier="oficial_institucional" compacto />
      </div>
    </div>
  )
}
