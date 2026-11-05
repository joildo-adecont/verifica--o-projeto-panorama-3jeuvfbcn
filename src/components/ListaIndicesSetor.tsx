/**
 * Componente de lista/grade de índices dentro do setor selecionado.
 * Permite marcar/desmarcar individualmente para comparação ou abrir a série individual.
 */
import { Check, ExternalLink, Plus, Layers, Eye } from 'lucide-react'
import type { ItemSetorIndicador } from '@/services/distribuicaoSetores'
import type { ChaveSerieHistorica } from '@/services/seriesHistoricas'

export interface PropsListaIndicesSetor {
  setorNome: string
  setorCor: string
  indicadores: ItemSetorIndicador[]
  selecionados: ChaveSerieHistorica[]
  onToggleIndice: (chave: ChaveSerieHistorica) => void
  onAbrirIndicador: (chave: ChaveSerieHistorica) => void
  onSelecionarTodosSetor: () => void
  onDesmarcarTodosSetor: () => void
}

export function ListaIndicesSetor({
  setorNome,
  setorCor,
  indicadores,
  selecionados,
  onToggleIndice,
  onAbrirIndicador,
  onSelecionarTodosSetor,
  onDesmarcarTodosSetor,
}: PropsListaIndicesSetor) {
  const todosMarcados = indicadores.every((i) => selecionados.includes(i.chave))
  const algumMarcado = indicadores.some((i) => selecionados.includes(i.chave))

  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-3 sm:p-4 space-y-3">
      {/* Cabeçalho do setor expandido */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="w-3.5 h-3.5 rounded-full shrink-0 shadow-2xs"
            style={{ backgroundColor: setorCor }}
          />
          <div>
            <h4 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
              <span>Setor: {setorNome}</span>
              <span className="text-[10.5px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                {indicadores.length} índices catalogados
              </span>
            </h4>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Marque os índices para comparar entre si ou combine com índices de outros setores da
              pizza.
            </p>
          </div>
        </div>

        {/* Ações de lote dentro do setor */}
        <div className="flex items-center gap-1.5 shrink-0 self-start sm:self-center">
          <button
            type="button"
            onClick={onSelecionarTodosSetor}
            className="px-2.5 py-1 text-[11px] font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 transition-colors cursor-pointer"
          >
            {todosMarcados ? 'Todos marcados' : 'Marcar todos do setor'}
          </button>
          {algumMarcado && (
            <button
              type="button"
              onClick={onDesmarcarTodosSetor}
              className="px-2 py-1 text-[11px] font-semibold rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-200/60 transition-colors cursor-pointer"
            >
              Desmarcar do setor
            </button>
          )}
        </div>
      </div>

      {/* Grade de índices individuais */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
        {indicadores.map((ind) => {
          const marcado = selecionados.includes(ind.chave)
          return (
            <div
              key={ind.chave}
              className={`p-2.5 rounded-xl border transition-all flex flex-col justify-between gap-2 ${
                marcado
                  ? 'border-panorama-gold bg-amber-50/80 shadow-2xs'
                  : 'border-slate-200 bg-white hover:border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <label className="flex items-start gap-2 cursor-pointer flex-1 min-w-0">
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => onToggleIndice(ind.chave)}
                    className="mt-0.5 w-4 h-4 rounded text-panorama-navy focus:ring-panorama-gold border-slate-300 cursor-pointer"
                  />
                  <div className="min-w-0">
                    <span className="block text-xs font-bold text-slate-900 leading-snug">
                      {ind.nome}
                    </span>
                    <span className="block text-[10.5px] text-slate-500 line-clamp-1 mt-0.5">
                      {ind.descricao || ind.categoria}
                    </span>
                  </div>
                </label>

                {/* Botão de ver série individual */}
                <button
                  type="button"
                  onClick={() => onAbrirIndicador(ind.chave)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-panorama-navy hover:bg-slate-100 transition-colors shrink-0 cursor-pointer"
                  title={`Ver histórico e acumulados de ${ind.nome}`}
                >
                  <Eye className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Rodapé do cartão do índice */}
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100/80 text-[10px] text-slate-400">
                <span className="font-mono truncate">{ind.unidade || 'Índice'}</span>
                <span className="truncate max-w-[130px] font-medium text-slate-500">
                  {ind.fonte}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
