/**
 * ABA HISTÓRICO — portal de Indicadores Econômicos e Financeiros (9B).
 *
 * Buscador nativo de índices no topo (tolerante a acentos, termos com "E") e
 * listagem por categoria; ao clicar num indicador abre o gráfico evolutivo
 * com acumulados. Consome o proxy do backend — nunca domínio externo direto.
 */
import { useMemo, useState } from 'react'
import { Search, ChevronRight, Database, Info } from 'lucide-react'
import { AdecontLogo } from '@/components/AdecontLogo'
import { SeloNivelConfianca } from '@/components/SeloNivelConfianca'
import { GraficoIndicadorHistorico } from '@/components/GraficoIndicadorHistorico'
import {
  buscarIndicadores,
  SUGESTOES_BUSCA_INDICADORES,
  type ResultadoBuscaIndicador,
} from '@/services/buscadorIndicadores'
import { catalogoAgrupado } from '@/services/buscadorIndicadores'
import type { ChaveSerieHistorica } from '@/services/seriesHistoricas'

export function AbaHistoricoIndicadores() {
  const [consulta, setConsulta] = useState('')
  const [selecionado, setSelecionado] = useState<ChaveSerieHistorica | null>(null)

  const resultados = useMemo(() => buscarIndicadores(consulta), [consulta])
  const agrupado = useMemo(() => catalogoAgrupado(), [])

  const aberto = selecionado !== null

  if (aberto) {
    return (
      <div className="mt-4">
        <GraficoIndicadorHistorico chave={selecionado!} onVoltar={() => setSelecionado(null)} />
      </div>
    )
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Cabeçalho com logo ADECONT */}
      <div className="flex items-center justify-between gap-3 p-4 rounded-2xl border border-slate-200 bg-white">
        <div className="min-w-0">
          <h3 className="text-sm font-black text-slate-900">Histórico de índices e indicadores</h3>
          <p className="text-[11px] text-slate-500 mt-0.5">
            Séries evolutivas com acumulados por ano e por período, granularidade mensal, trimestral
            ou anual.
          </p>
        </div>
        <AdecontLogo variant="color" className="h-8 w-auto shrink-0" />
      </div>

      {/* Buscador nativo — visível no topo da aba */}
      <div className="p-4 rounded-2xl border border-slate-200 bg-white space-y-2">
        <label
          htmlFor="busca-indicadores"
          className="text-[11px] font-bold text-slate-500 uppercase tracking-wide"
        >
          Buscar índice ou indicador
        </label>
        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
            aria-hidden="true"
          />
          <input
            id="busca-indicadores"
            type="text"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder="IPCA, Selic, dólar, soja, IDEB…"
            className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-panorama-gold/60 focus:border-panorama-gold"
          />
        </div>
        <div className="flex flex-wrap gap-1.5 pt-1">
          {SUGESTOES_BUSCA_INDICADORES.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setConsulta(s)}
              className="px-2.5 py-1 rounded-full bg-slate-100 text-[11px] font-bold text-slate-600 hover:bg-slate-200 cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
        <p className="text-[10.5px] text-slate-400 flex items-center gap-1">
          <Info className="w-3 h-3" /> Busca tolerante a acentos e maiúsculas — termos combinados
          com "E".
        </p>
      </div>

      {/* Resultados da busca */}
      {consulta.trim() !== '' && (
        <ListaIndicadores
          titulo={
            resultados.length > 0
              ? `${resultados.length} indicador(es) para "${consulta}"`
              : `Nada para "${consulta}"`
          }
          itens={resultados.map((r) => ({
            chave: r.chave,
            nome: r.nome,
            descricao: r.descricao,
            categoria: r.categoria,
            unidade: r.unidade,
            fonte: r.fonte,
            baseInterna: r.baseInterna,
          }))}
          vazioHint="Tente outro termo: inflação, câmbio, emprego, saúde, saneamento…"
          onAbrir={setSelecionado}
        />
      )}

      {/* Listagem completa por categoria */}
      {consulta.trim() === '' && (
        <div className="space-y-4">
          {[...agrupado.entries()].map(([categoria, itens]) => (
            <section key={categoria} className="p-4 rounded-2xl border border-slate-200 bg-white">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wide mb-3">
                {categoria}
              </h4>
              <ListaIndicadores titulo="" itens={itens} onAbrir={setSelecionado} ocultarTitulo />
            </section>
          ))}
        </div>
      )}

      {/* Rodapé de fontes */}
      <div className="flex items-center gap-2 text-[10.5px] text-slate-400">
        <Database className="w-3 h-3 shrink-0" />
        Séries via proxy do backend (/backend/v1/series-historicas) — BCB SGS, IBGE SIDRA e base
        interna aproximada.
        <SeloNivelConfianca tier="oficial_institucional" compacto />
      </div>
    </div>
  )
}

function ListaIndicadores({
  titulo,
  itens,
  onAbrir,
  vazioHint,
  ocultarTitulo,
}: {
  titulo: string
  itens: ResultadoBuscaIndicador[]
  onAbrir: (c: ChaveSerieHistorica) => void
  vazioHint?: string
  ocultarTitulo?: boolean
}) {
  return (
    <div>
      {!ocultarTitulo && <p className="text-xs font-bold text-slate-600 mb-2">{titulo}</p>}
      {itens.length === 0 ? (
        <p className="text-xs text-slate-500">{vazioHint || 'Nenhum indicador encontrado.'}</p>
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {itens.map((r) => (
            <li key={r.chave}>
              <button
                type="button"
                onClick={() => onAbrir(r.chave)}
                className="w-full text-left p-3 rounded-xl border border-slate-200 hover:border-panorama-gold hover:bg-slate-50 transition-colors cursor-pointer group"
              >
                <span className="flex items-center justify-between gap-2">
                  <span className="text-xs font-black text-slate-900 truncate">{r.nome}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-panorama-gold shrink-0" />
                </span>
                <span className="block text-[10.5px] text-slate-500 mt-0.5 line-clamp-2">
                  {r.descricao}
                </span>
                <span className="flex flex-wrap items-center gap-1.5 mt-1.5">
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9.5px] font-bold text-slate-500">
                    {r.categoria}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 text-[9.5px] font-bold text-slate-500">
                    {r.unidade}
                  </span>
                  {r.baseInterna && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-100 text-[9.5px] font-bold text-amber-700">
                      base interna
                    </span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
