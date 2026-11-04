/**
 * TABELA DE VARIAÇÕES PERCENTUAIS — histórico individual (aba Histórico).
 *
 * Evidencia, mês a mês, o valor do indicador e a variação % frente ao período
 * anterior, com destaque verde (queda) / vermelho (alta) no padrão do portal.
 * A variação do primeiro ponto da janela é calculada contra o último ponto
 * ANTERIOR à janela (a série completa vem inteira do proxy do backend), então
 * a tabela nunca perde a primeira variação por corte de período.
 */
import type { CatalogoSerie, PontoSerie } from '@/services/seriesHistoricas'
import { ordenarSerie, formatarValorSerie } from '@/services/seriesCalculos'

const ROTULO_GRAN: Record<string, string> = {
  mensal: 'mês anterior',
  trimestral: 'trimestre anterior',
  anual: 'ano anterior',
}

function pesoPeriodo(p: string): number {
  const m = p.match(/^(\d{4})(?:-(?:(\d{2})|Q(\d)))?$/)
  if (!m) return 0
  return (
    parseInt(m[1], 10) * 10000 +
    (m[2] ? parseInt(m[2], 10) * 100 : m[3] ? parseInt(m[3], 10) * 300 : 0)
  )
}

function formatarPct(v: number): string {
  return (
    (v > 0 ? '+' : '') +
    v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) +
    '%'
  )
}

export function TabelaVariacoesMensais({
  serieCompleta,
  serieFiltrada,
  item,
  granularidade,
}: {
  serieCompleta: PontoSerie[]
  serieFiltrada: PontoSerie[]
  item: CatalogoSerie
  granularidade: 'mensal' | 'trimestral' | 'anual'
}) {
  const ordenadaCompleta = ordenarSerie(serieCompleta).filter((p) => Number.isFinite(p.valor))
  const filtrada = ordenarSerie(serieFiltrada).filter((p) => Number.isFinite(p.valor))
  if (filtrada.length === 0) return null

  const primeiraChave = pesoPeriodo(filtrada[0].periodo)
  const anteriorDaJanela = [...ordenadaCompleta]
    .reverse()
    .find((p) => pesoPeriodo(p.periodo) < primeiraChave)

  // Valor do período anterior a cada ponto: para o 1º da janela usa o ponto
  // anterior à janela; para os demais usa o ponto anterior dentro da janela.
  const linhas = filtrada.map((p, i) => {
    const anterior = i === 0 ? anteriorDaJanela : filtrada[i - 1]
    let variacao: number | undefined
    if (item.modoAcumulado === 'variacao_mensal') {
      // A própria série já é a variação % do período.
      variacao = p.valor
    } else if (anterior && anterior.valor !== 0) {
      variacao = ((p.valor - anterior.valor) / Math.abs(anterior.valor)) * 100
    }
    return { periodo: p.periodo, valor: p.valor, variacao }
  })

  return (
    <div className="p-4 rounded-2xl border border-slate-200 bg-white">
      <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-1">
        Variações percentuais — {item.nome}
      </h4>
      <p className="text-[10.5px] text-slate-400 mb-3">
        Variação % em relação ao {ROTULO_GRAN[granularidade] ?? 'período anterior'} · verde =
        queda, vermelho = alta · "—" quando não há base de comparação.
      </p>
      <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-100">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 bg-slate-50">
            <tr className="border-b border-slate-200 text-left">
              <th className="py-2 px-3 font-black text-slate-700">Período</th>
              <th className="py-2 px-3 font-black text-slate-700 text-right">Valor</th>
              <th className="py-2 px-3 font-black text-slate-700 text-right">
                Variação % vs. {ROTULO_GRAN[granularidade] ?? 'anterior'}
              </th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((l) => {
              const v = l.variacao
              const cor =
                v === undefined
                  ? 'text-slate-400'
                  : v > 0
                    ? 'text-rose-600'
                    : v < 0
                      ? 'text-emerald-600'
                      : 'text-slate-500'
              return (
                <tr key={l.periodo} className="border-b border-slate-100 last:border-b-0">
                  <td className="py-1.5 px-3 font-bold text-slate-800">{l.periodo}</td>
                  <td className="py-1.5 px-3 text-right tabular-nums text-slate-700">
                    {formatarValorSerie(l.valor, item)}
                  </td>
                  <td className={`py-1.5 px-3 text-right font-bold tabular-nums ${cor}`}>
                    {v === undefined ? '—' : formatarPct(v)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
