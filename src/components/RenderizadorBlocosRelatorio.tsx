/**
 * RENDERIZADOR DE BLOCOS ESTRUTURADOS DOS RELATÓRIOS DOS AGENTES
 * Sistema ADECONT — Projeto Panorama
 *
 * Recebe os blocos do parser (texto, lista, tabela, comparativo, título) e
 * monta um relatório visual: tabelas de verdade, gráfico de barras em CSS
 * quando a tabela tem coluna numérica, e comparativos lado a lado.
 * O mesmo componente é usado na tela do agente e na Central de Entregas.
 */
import { useMemo } from 'react'
import { cn } from '@/lib/utils'
import {
  parseValorNumerico,
  tabelaVirouGrafico,
  type BlocoRelatorio,
} from '@/services/relatorioAgenteParser'

const CORES_BARRA = [
  'bg-indigo-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-sky-500',
  'bg-violet-500',
]

function GraficoBarrasTabela({
  colunas,
  linhas,
  modoCompacto = false,
}: {
  colunas: string[]
  linhas: string[][]
  modoCompacto?: boolean
}) {
  const dados = useMemo(() => {
    // 1ª coluna = rótulo; primeira coluna numérica = valor
    let colValor = -1
    for (let c = 1; c < colunas.length && colValor < 0; c++) {
      const comNumero = linhas.filter((l) => parseValorNumerico(l[c] ?? '') !== null).length
      if (comNumero >= 2) colValor = c
    }
    if (colValor < 0) return []
    return linhas
      .map((l) => ({ rotulo: l[0] ?? '', valor: parseValorNumerico(l[colValor] ?? '') ?? 0 }))
      .slice(0, 12)
  }, [colunas, linhas])

  const max = Math.max(...dados.map((d) => Math.abs(d.valor)), 1)

  if (dados.length < 2) return null
  return (
    <div
      className={cn(
        'rounded-lg border border-slate-200 bg-slate-50/60',
        modoCompacto ? 'mt-2 p-2' : 'mt-3 p-3',
      )}
    >
      <p
        className={cn(
          'mb-2 font-semibold uppercase tracking-wide text-slate-500',
          modoCompacto ? 'text-[10px]' : 'text-[11px]',
        )}
      >
        Gráfico comparativo
      </p>
      <div className="space-y-1.5">
        {dados.map((d, i) => (
          <div key={`${d.rotulo}-${i}`} className="flex items-center gap-2">
            <span
              className={cn(
                'w-40 shrink-0 truncate text-slate-600',
                modoCompacto ? 'text-[11px]' : 'text-xs',
              )}
              title={d.rotulo}
            >
              {d.rotulo}
            </span>
            <div
              className={cn(
                'flex-1 overflow-hidden rounded bg-slate-200/70',
                modoCompacto ? 'h-3' : 'h-4',
              )}
            >
              <div
                className={cn('h-full rounded', CORES_BARRA[i % CORES_BARRA.length])}
                style={{ width: `${Math.max(2, (Math.abs(d.valor) / max) * 100)}%` }}
              />
            </div>
            <span
              className={cn(
                'w-24 shrink-0 text-right font-medium text-slate-700',
                modoCompacto ? 'text-[11px]' : 'text-xs',
              )}
            >
              {d.valor.toLocaleString('pt-BR')}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function BlocoTabela({
  bloco,
  modoCompacto = false,
}: {
  bloco: Extract<BlocoRelatorio, { tipo: 'tabela' }>
  modoCompacto?: boolean
}) {
  const temGrafico = tabelaVirouGrafico(bloco)
  return (
    <div className={modoCompacto ? '' : 'my-3'}>
      <div className="overflow-x-auto rounded-lg border border-slate-200">
        <table className={cn('w-full', modoCompacto ? 'text-[11px]' : 'text-sm')}>
          {bloco.colunas.length > 0 && (
            <thead>
              <tr className="bg-slate-100">
                {bloco.colunas.map((c, i) => (
                  <th
                    key={i}
                    className={cn(
                      'border-b border-slate-200 px-2 py-1.5 text-left font-semibold text-slate-700',
                      modoCompacto && 'px-1.5 py-1',
                    )}
                  >
                    {c}
                  </th>
                ))}
              </tr>
            </thead>
          )}
          <tbody>
            {bloco.linhas.map((l, ri) => (
              <tr key={ri} className={ri % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}>
                {l.map((c, ci) => (
                  <td
                    key={ci}
                    className={cn(
                      'border-b border-slate-100 px-3 py-1.5 text-slate-700',
                      modoCompacto ? 'px-1.5 py-0.5' : 'py-1.5',
                    )}
                  >
                    {c}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {temGrafico && (
        <GraficoBarrasTabela
          colunas={bloco.colunas}
          linhas={bloco.linhas}
          modoCompacto={modoCompacto}
        />
      )}
    </div>
  )
}

function BlocoComparativo({
  bloco,
  modoCompacto = false,
}: {
  bloco: Extract<BlocoRelatorio, { tipo: 'comparativo' }>
  modoCompacto?: boolean
}) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3',
        modoCompacto ? '' : 'my-3',
      )}
    >
      {bloco.itens.map((it, i) => {
        const n = parseValorNumerico(it.valor)
        return (
          <div key={i} className="rounded-lg border border-indigo-200 bg-indigo-50/60 px-3 py-2">
            <p
              className={cn(
                'font-semibold uppercase tracking-wide text-indigo-700',
                modoCompacto ? 'text-[10px]' : 'text-[11px]',
              )}
            >
              {it.rotulo}
            </p>
            <p
              className={cn('font-medium text-slate-800', modoCompacto ? 'text-[12px]' : 'text-sm')}
            >
              {it.valor}
              {n !== null && (
                <span
                  className="ml-2 text-[10px] text-indigo-400"
                  title="Valor numérico reconhecido"
                >
                  n={n.toLocaleString('pt-BR')}
                </span>
              )}
            </p>
          </div>
        )
      })}
    </div>
  )
}

export function RenderizadorBlocosRelatorio({
  blocos,
  className,
  modoCompacto = false,
}: {
  blocos: BlocoRelatorio[]
  className?: string
  /** Na tela do agente (bolha do chat): tipografia menor, sem margens grandes. */
  modoCompacto?: boolean
}) {
  if (!blocos || blocos.length === 0) return null
  return (
    <div className={cn('space-y-1', className)}>
      {blocos.map((b, i) => {
        switch (b.tipo) {
          case 'titulo':
            return b.nivel === 1 ? (
              <h3
                key={i}
                className={cn(
                  'font-bold text-slate-900',
                  modoCompacto ? 'mt-1 text-sm' : 'mt-4 text-lg',
                )}
              >
                {b.texto}
              </h3>
            ) : b.nivel === 2 ? (
              <h4
                key={i}
                className={cn(
                  'font-semibold text-slate-800',
                  modoCompacto ? 'mt-1 text-[13px]' : 'mt-3 text-base',
                )}
              >
                {b.texto}
              </h4>
            ) : (
              <h5
                key={i}
                className={cn(
                  'font-semibold text-slate-700',
                  modoCompacto ? 'mt-0.5 text-xs' : 'mt-2 text-sm',
                )}
              >
                {b.texto}
              </h5>
            )
          case 'texto':
            return (
              <p
                key={i}
                className={cn(
                  'whitespace-pre-wrap leading-relaxed text-slate-700',
                  modoCompacto ? 'text-[12px]' : 'text-sm',
                )}
              >
                {b.texto}
              </p>
            )
          case 'lista':
            return (
              <ul
                key={i}
                className={cn(
                  'ml-5 list-disc space-y-0.5 text-slate-700',
                  modoCompacto ? 'text-[12px]' : 'text-sm',
                )}
              >
                {b.itens.map((it, j) => (
                  <li key={j}>{it}</li>
                ))}
              </ul>
            )
          case 'tabela':
            return <BlocoTabela key={i} bloco={b} modoCompacto={modoCompacto} />
          case 'comparativo':
            return <BlocoComparativo key={i} bloco={b} modoCompacto={modoCompacto} />
          default:
            return null
        }
      })}
    </div>
  )
}
